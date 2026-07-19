import { Router, Request, Response, NextFunction } from "express";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

import os from "node:os";

const router = Router();

const isWindows = process.platform === "win32";
const YTDLP_BIN = isWindows 
  ? path.resolve(process.cwd(), "yt-dlp.exe")
  : path.resolve(process.cwd(), "yt-dlp");

import { execFile } from "node:child_process";
import https from "node:https";

const activeStreams = new Map<string, string>();

router.get("/prepare-stream/:id", (req: Request, res: Response, next: NextFunction): void => {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(id)) {
    res.status(400).json({ error: "Invalid video ID" });
    return;
  }

  req.log.info({ id }, "Preparing stream via yt-dlp");

  const ytdlpArgs = [
    "--format", "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio",
    "--no-playlist",
    "--quiet",
    "--no-warnings",
    "--js-runtimes", "node",
    "--get-url",
    `https://www.youtube.com/watch?v=${id}`
  ];

  let cookiesPath = path.join(process.cwd(), "cookies.txt");
  if (!fs.existsSync(cookiesPath)) {
    cookiesPath = path.join(process.cwd(), "..", "..", "cookies.txt");
  }

  if (process.env.YOUTUBE_COOKIE || process.env.COOKIE) {
    try {
      const tempCookiePath = path.join(os.tmpdir(), "youtube_cookies.txt");
      fs.writeFileSync(tempCookiePath, process.env.YOUTUBE_COOKIE || process.env.COOKIE || "");
      cookiesPath = tempCookiePath;
    } catch (e) {
      // ignore
    }
  }

  if (fs.existsSync(cookiesPath)) {
    ytdlpArgs.push("--cookies", cookiesPath);
  }

  execFile(YTDLP_BIN, ytdlpArgs, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    if (error) {
      req.log.error({ err: error, id, stderr }, "yt-dlp failed to get URL");
      return res.status(502).json({ error: "Stream preparation failed", detail: stderr });
    }

    const url = stdout.trim().split("\n").pop();
    if (url && url.startsWith("http")) {
      req.log.info({ id }, "Stream URL successfully prepared");
      activeStreams.set(id, url);
      // Clean up memory after 2 hours
      setTimeout(() => activeStreams.delete(id), 2 * 60 * 60 * 1000);
      
      return res.json({ proxyUrl: `${req.protocol}://${req.get('host')}/api/stream-proxy/${id}` });
    } else {
      req.log.error({ id, stdout }, "yt-dlp returned invalid URL");
      return res.status(502).json({ error: "Invalid stream URL", detail: stdout });
    }
  });
});

router.get("/stream-proxy/:id", (req: Request, res: Response): void => {
  const { id } = req.params;
  const targetUrl = activeStreams.get(id);

  if (!targetUrl) {
    res.status(404).json({ error: "Stream not prepared or expired. Call /prepare-stream first." });
    return;
  }

  req.log.info({ id }, "Proxying stream bytes instantly to bypass ExoPlayer timeout");

  https.get(targetUrl, (proxyRes) => {
    res.status(proxyRes.statusCode || 200);
    if (proxyRes.headers['content-type']) res.setHeader('Content-Type', proxyRes.headers['content-type']);
    if (proxyRes.headers['content-length']) res.setHeader('Content-Length', proxyRes.headers['content-length']);
    if (proxyRes.headers['accept-ranges']) res.setHeader('Accept-Ranges', proxyRes.headers['accept-ranges']);
    if (proxyRes.headers['content-range']) res.setHeader('Content-Range', proxyRes.headers['content-range']);
    
    proxyRes.pipe(res);
  }).on("error", (err) => {
    req.log.error({ err, id }, "Error proxying stream");
    res.end();
  });
});

// For backwards compatibility
router.get("/stream/:id", (req, res) => res.redirect(302, `/api/prepare-stream/${req.params.id}`));

export default router;

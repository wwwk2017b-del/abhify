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

router.get("/stream/:id", (req: Request, res: Response, next: NextFunction): void => {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(id)) {
    res.status(400).json({ error: "Invalid video ID" });
    return;
  }

  if (!fs.existsSync(YTDLP_BIN)) {
     res.status(500).json({ error: `yt-dlp binary is missing at ${YTDLP_BIN}.` });
     return;
  }

  req.log.info({ id }, "Stream request via local yt-dlp");

  const ytdlpArgs = [
    "--format", "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio",
    "--no-playlist",
    "--quiet",
    "--no-warnings",
    "--no-part",
    "--output", "-"
  ];

  let cookiesPath = path.join(process.cwd(), "cookies.txt");
  if (!fs.existsSync(cookiesPath)) {
    cookiesPath = path.join(process.cwd(), "..", "..", "cookies.txt"); // root of repo
  }

  // Support for environment variable cookies (useful for Render/Vercel/Heroku)
  if (process.env.YOUTUBE_COOKIE || process.env.COOKIE) {
    try {
      const tempCookiePath = path.join(os.tmpdir(), "youtube_cookies.txt");
      fs.writeFileSync(tempCookiePath, process.env.YOUTUBE_COOKIE || process.env.COOKIE || "");
      cookiesPath = tempCookiePath;
      req.log.info("Written environment cookie to temp file");
    } catch (e) {
      req.log.warn("Failed to write temp cookie file");
    }
  }

  if (fs.existsSync(cookiesPath)) {
    ytdlpArgs.push("--cookies", cookiesPath);
    req.log.info({ id, cookiesPath }, "Using cookies.txt for authentication");
  } else {
    req.log.warn("No cookies.txt found! YouTube may block the request with a captcha.");
  }

  ytdlpArgs.push("--get-url", `https://www.youtube.com/watch?v=${id}`);

  const { execFile } = require("node:child_process");

  execFile(YTDLP_BIN, ytdlpArgs, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    if (error) {
      req.log.error({ err: error, id, stderr }, "yt-dlp failed to get URL");
      return res.status(502).json({ error: "Stream failed", detail: stderr });
    }

    const url = stdout.trim().split("\n")[0];
    if (url && url.startsWith("http")) {
      req.log.info({ id }, "Redirecting client to direct YouTube URL");
      return res.redirect(302, url);
    } else {
      req.log.error({ id, stdout }, "yt-dlp returned invalid URL");
      return res.status(502).json({ error: "Invalid stream URL", detail: stdout });
    }
  });

  req.on("close", () => {
    ytdlp.kill("SIGTERM");
  });
});

export default router;


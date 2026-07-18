import { Router } from "express";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const router = Router();

// Determine if we are on Windows or Linux (Render)
const isWindows = process.platform === "win32";
const YTDLP_BIN = isWindows 
  ? path.resolve(process.cwd(), "yt-dlp.exe")
  : path.resolve(process.cwd(), "yt-dlp");

router.get("/stream/:id", (req, res) => {
  const { id } = req.params;

  if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) {
    return res.status(400).json({ error: "Invalid video ID" });
  }

  // Fallback to check if yt-dlp is downloaded
  if (!fs.existsSync(YTDLP_BIN)) {
     return res.status(500).json({ error: `yt-dlp binary is missing at ${YTDLP_BIN}.` });
  }

  req.log.info({ id }, "Stream request via local yt-dlp");

  const ytdlp = spawn(YTDLP_BIN, [
    "--format",
    "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio",
    "--no-playlist",
    "--quiet",
    "--no-warnings",
    "--no-part",
    "--output",
    "-", 
    `https://www.youtube.com/watch?v=${id}`,
  ]);

  let headersWritten = false;
  const stderrLines: string[] = [];

  res.setHeader("Content-Type", "audio/mp4");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Access-Control-Allow-Origin", "*");

  ytdlp.stdout.on("data", (chunk: Buffer) => {
    if (!headersWritten) {
      headersWritten = true;
      res.status(200);
    }
    res.write(chunk);
  });

  ytdlp.stderr.on("data", (chunk: Buffer) => {
    const line = chunk.toString().trim();
    if (line) stderrLines.push(line);
    req.log.warn({ id, line }, "yt-dlp stderr");
  });

  ytdlp.on("error", (err) => {
    req.log.error({ err, id }, "yt-dlp spawn error");
    if (!headersWritten) {
      res.status(500).json({
        error: "yt-dlp could not start",
        detail: err.message,
      });
    } else {
      res.end();
    }
  });

  ytdlp.on("close", (code) => {
    if (!headersWritten) {
      const detail = stderrLines.join("\n") || `exited with code ${code}`;
      req.log.error({ id, code, detail }, "yt-dlp exited without data");
      res.status(502).json({ error: "Stream failed", detail });
    } else {
      res.end();
    }
  });

  req.on("close", () => {
    ytdlp.kill("SIGTERM");
  });
});

export default router;

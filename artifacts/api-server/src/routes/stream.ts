import { Router } from "express";
import { execFile } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const router = Router();

const isWindows = process.platform === "win32";
const YTDLP_BIN = isWindows 
  ? path.resolve(process.cwd(), "yt-dlp.exe")
  : path.resolve(process.cwd(), "yt-dlp");

router.get("/stream/:id", (req, res) => {
  const { id } = req.params;

  if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) {
    return res.status(400).json({ error: "Invalid video ID" });
  }

  if (!fs.existsSync(YTDLP_BIN)) {
     return res.status(500).json({ error: `yt-dlp binary is missing at ${YTDLP_BIN}.` });
  }

  req.log.info({ id }, "Stream URL extraction via local yt-dlp");

  execFile(YTDLP_BIN, [
    "--format", "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio",
    "--get-url",
    `https://www.youtube.com/watch?v=${id}`,
  ], (error, stdout, stderr) => {
    if (error) {
      req.log.error({ err: error.message, stderr }, "yt-dlp extraction failed");
      return res.status(502).json({ error: "Stream URL extraction failed", detail: stderr || error.message });
    }

    const url = stdout.trim();
    if (!url || !url.startsWith("http")) {
      req.log.error({ url, stderr }, "Invalid URL extracted by yt-dlp");
      return res.status(502).json({ error: "Invalid Stream URL extracted", detail: stderr });
    }

    req.log.info({ id, url }, "Redirecting client to stream URL");
    res.redirect(302, url);
  });
});

export default router;


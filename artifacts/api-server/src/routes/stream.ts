import { Router } from "express";
import ytdl from "@distube/ytdl-core";

const router = Router();

router.get("/stream/:id", async (req, res) => {
  const { id } = req.params;

  if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) {
    return res.status(400).json({ error: "Invalid video ID" });
  }

  const url = `https://www.youtube.com/watch?v=${id}`;

  req.log.info({ id }, "Stream request");

  try {
    // Validate the video is accessible before committing headers
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, {
      quality: "highestaudio",
      filter: "audioonly",
    });

    if (!format) {
      return res.status(404).json({ error: "No audio format found" });
    }

    const contentLength = format.contentLength
      ? parseInt(format.contentLength, 10)
      : undefined;

    res.setHeader("Content-Type", format.mimeType ?? "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
      res.setHeader("Accept-Ranges", "bytes");
    }

    const audioStream = ytdl(url, {
      format,
      highWaterMark: 1 << 25, // 32 MB buffer for smoother streaming
    });

    audioStream.pipe(res);

    req.on("close", () => audioStream.destroy());

    audioStream.on("error", (err) => {
      req.log.error({ err }, "Audio stream error");
      if (!res.headersSent) {
        res.status(500).json({ error: "Stream failed" });
      } else {
        res.end();
      }
    });
  } catch (err: any) {
    req.log.error({ err }, "Stream error");
    const msg = err?.message ?? "";
    const status =
      msg.includes("Sign in") || msg.includes("bot") ? 451 : 500;
    if (!res.headersSent) {
      res.status(status).json({ error: "Could not get audio stream", detail: msg });
    }
  }
});

export default router;

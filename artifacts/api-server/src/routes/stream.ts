import { Router } from "express";
import play from "play-dl";

const router = Router();

router.get("/stream/:id", async (req, res) => {
  const { id } = req.params;

  if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) {
    return res.status(400).json({ error: "Invalid video ID" });
  }

  try {
    const stream = await play.stream(
      `https://www.youtube.com/watch?v=${id}`,
      { quality: 2 },
    );

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Access-Control-Allow-Origin", "*");

    stream.stream.pipe(res);

    req.on("close", () => {
      stream.stream.destroy();
    });

    stream.stream.on("error", (err) => {
      req.log.error({ err }, "Stream pipe error");
      if (!res.headersSent) {
        res.status(500).json({ error: "Stream failed" });
      } else {
        res.end();
      }
    });
  } catch (err) {
    req.log.error({ err }, "Stream error");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to get audio stream" });
    }
  }
});

export default router;

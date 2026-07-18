import { Router } from "express";
import ytdl from "@distube/ytdl-core";

const router = Router();

router.get("/stream/:id", async (req, res) => {
  const { id } = req.params;

  if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) {
    return res.status(400).json({ error: "Invalid video ID" });
  }

  req.log.info({ id }, "Stream request via ytdl-core");

  try {
    const info = await ytdl.getInfo(id);
    const format = ytdl.chooseFormat(info.formats, { filter: "audioonly" });

    res.setHeader("Content-Type", "audio/mp4");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const stream = ytdl.downloadFromInfo(info, { format });
    
    stream.on("error", (err) => {
      req.log.error({ err, id }, "ytdl-core stream error");
      if (!res.headersSent) {
        res.status(502).json({ error: "Stream failed", detail: err.message });
      } else {
        res.end();
      }
    });

    stream.pipe(res);
  } catch (err: any) {
    req.log.error({ err, id }, "ytdl-core getInfo error");
    if (!res.headersSent) {
      res.status(502).json({ error: "Stream failed", detail: err.message });
    }
  }
});

export default router;


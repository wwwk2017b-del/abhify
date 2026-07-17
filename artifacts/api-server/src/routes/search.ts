import { Router } from "express";
import play from "play-dl";

const router = Router();

const formatDuration = (secs: number): string => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

router.get("/search", async (req, res) => {
  const q = typeof req.query["q"] === "string" ? req.query["q"].trim() : "";
  if (!q) {
    return res.status(400).json({ error: "Query is required" });
  }
  const rawLimit = Number(req.query["limit"]);
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 50);

  try {
    const results = await play.search(q, {
      source: { youtube: "video" },
      limit,
    });

    const tracks = results
      .filter((v) => v.durationInSec > 0 && v.id && v.title)
      .map((video) => ({
        id: video.id ?? "",
        title: video.title ?? "Unknown Title",
        artist: video.channel?.name ?? "Unknown Artist",
        duration: video.durationInSec,
        durationFormatted: formatDuration(video.durationInSec),
        thumbnail:
          video.thumbnails?.[video.thumbnails.length - 1]?.url ??
          video.thumbnails?.[0]?.url ??
          "",
      }));

    res.json(tracks);
  } catch (err) {
    req.log.error({ err }, "Search error");
    res.status(500).json({ error: "Search failed. Please try again." });
  }
});

export default router;

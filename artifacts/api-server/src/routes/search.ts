import { Router } from "express";
import ytSearch from "yt-search";

const router = Router();

router.get("/search", async (req, res) => {
  const q = typeof req.query["q"] === "string" ? req.query["q"].trim() : "";
  if (!q) {
    return res.status(400).json({ error: "Query is required" });
  }
  const rawLimit = Number(req.query["limit"]);
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 50);

  req.log.info({ q, limit }, "Search request");

  try {
    const result = await ytSearch({ query: q, hl: "en", gl: "US" });

    const tracks = result.videos
      .filter((v) => v.videoId && v.title && v.seconds > 0)
      .slice(0, limit)
      .map((v) => ({
        id: v.videoId,
        title: v.title,
        artist: v.author?.name ?? "Unknown Artist",
        duration: v.seconds,
        durationFormatted: v.timestamp ?? `${Math.floor(v.seconds / 60)}:${String(v.seconds % 60).padStart(2, "0")}`,
        thumbnail:
          v.thumbnail ??
          `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
      }));

    req.log.info({ q, count: tracks.length }, "Search results");
    res.json(tracks);
  } catch (err: any) {
    req.log.error({ err, q }, "Search error");
    res.status(500).json({ error: "Search failed", detail: err?.message ?? String(err) });
  }
});

export default router;

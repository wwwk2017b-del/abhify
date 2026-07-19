import { Router, Request, Response, NextFunction } from "express";
import { search } from "youtube-ext";

const router = Router();

function parseDuration(text: string | undefined): number {
  if (!text) return 0;
  const parts = text.split(':').reverse();
  let secs = 0;
  for (let i = 0; i < parts.length; i++) {
    secs += parseInt(parts[i] || "0", 10) * Math.pow(60, i);
  }
  return secs;
}

router.get("/search", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const q = typeof req.query["q"] === "string" ? req.query["q"].trim() : "";
  if (!q) {
    res.status(400).json({ error: "Query is required" });
    return;
  }
  const rawLimit = Number(req.query["limit"]);
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 50);

  req.log.info({ q, limit }, "Search request");

  try {
    const result = await search(q);

    const tracks = result.videos
      .filter((v: any) => v.id && v.title)
      .slice(0, limit)
      .map((v: any) => {
        const secs = parseDuration(v.duration?.text);
        return {
          id: v.id,
          title: v.title,
          artist: v.channel?.name ?? "Unknown Artist",
          duration: secs,
          durationFormatted: v.duration?.text || `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`,
          thumbnail:
            v.thumbnails?.[0]?.url ??
            `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
        };
      });

    req.log.info({ q, count: tracks.length }, "Search results");
    res.json(tracks);
  } catch (err: any) {
    req.log.error({ err, q }, "Search error");
    res.status(500).json({ error: "Search failed", detail: err?.message ?? String(err) });
  }
});

export default router;

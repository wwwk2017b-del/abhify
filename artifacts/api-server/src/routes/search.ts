import { Router, Request, Response, NextFunction } from "express";

const router = Router();

router.get("/search", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const q = typeof req.query["q"] === "string" ? req.query["q"].trim() : "";
  if (!q) {
    res.status(400).json({ error: "Query is required" });
    return;
  }
  const rawLimit = Number(req.query["limit"]);
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 50);

  req.log.info({ q, limit }, "Search request (JioSaavn)");

  try {
    // Switch to search.getResults instead of autocomplete to get 20+ results with durations!
    const response = await fetch(`https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(q)}&n=${limit}&p=1&_format=json&_marker=0&ctx=android`);
    const data = await response.json();

    if (!data || !data.results) {
      res.json([]);
      return;
    }

    const tracks = data.results.map((v: any) => {
      const secs = parseInt(v.duration || "0", 10);
      return {
        id: v.id,
        title: v.song || v.title,
        artist: v.primary_artists || v.description || "Unknown Artist",
        duration: secs, 
        durationFormatted: `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`,
        thumbnail: (v.image || "").replace("150x150", "500x500").replace("50x50", "500x500")
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

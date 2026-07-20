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
    const response = await fetch(`https://www.jiosaavn.com/api.php?__call=autocomplete.get&query=${encodeURIComponent(q)}&_format=json&_marker=0&ctx=android`);
    const data = await response.json();

    if (!data || !data.songs || !data.songs.data) {
      res.json([]);
      return;
    }

    const tracks = data.songs.data.slice(0, limit).map((v: any) => {
      return {
        id: v.id,
        title: v.title,
        artist: v.more_info?.primary_artists || v.description || "Unknown Artist",
        duration: 0, // JioSaavn autocomplete doesn't return duration, we can set 0 or fetch detailed info
        durationFormatted: "",
        thumbnail: (v.image || "").replace("50x50", "500x500") // Get higher res image
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

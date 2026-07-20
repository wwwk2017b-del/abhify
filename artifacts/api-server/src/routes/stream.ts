import { Router, Request, Response, NextFunction } from "express";
import CryptoJS from "crypto-js";

const router = Router();

// JioSaavn DES encryption key
const DES_KEY = "38346591";

function decryptUrl(encrypted: string): string {
  const keyHex = CryptoJS.enc.Utf8.parse(DES_KEY);
  const decrypted = CryptoJS.DES.decrypt(
    { ciphertext: CryptoJS.enc.Base64.parse(encrypted) } as any,
    keyHex,
    {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    }
  );
  return decrypted.toString(CryptoJS.enc.Utf8).replace('_96.mp4', '_320.mp4');
}

router.get("/prepare-stream/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: "Invalid song ID" });
    return;
  }

  req.log.info({ id }, "Preparing stream via JioSaavn API");

  try {
    const response = await fetch(`https://www.jiosaavn.com/api.php?__call=song.getDetails&cc=in&_marker=0%3F_marker%3D0&_format=json&pids=${encodeURIComponent(id)}`);
    const data = await response.json();

    if (!data || !data[id]) {
      res.status(404).json({ error: "Song not found on JioSaavn" });
      return;
    }

    const songData = data[id];
    
    // Some songs might not be encrypted
    if (songData.media_preview_url && !songData.encrypted_media_url) {
      const url = songData.media_preview_url.replace('_96_p.mp4', '_320.mp4').replace('preview.saavncdn.com', 'aac.saavncdn.com');
      res.json({ proxyUrl: url });
      return;
    }

    if (songData.encrypted_media_url) {
      const decryptedUrl = decryptUrl(songData.encrypted_media_url);
      req.log.info({ id, url: decryptedUrl }, "Successfully decrypted stream URL");
      
      // Return the direct JioSaavn CDN URL to the client. 
      // It completely bypasses our Node server for playback, guaranteeing instant 320kbps streaming!
      res.json({ proxyUrl: decryptedUrl });
      return;
    }

    res.status(404).json({ error: "No media URL found for this song" });
  } catch (err: any) {
    req.log.error({ err, id }, "Failed to get JioSaavn stream URL");
    res.status(500).json({ error: "Stream preparation failed", detail: err?.message ?? String(err) });
  }
});

// For backwards compatibility (if the app still uses the old URL)
router.get("/stream/:id", (req, res) => res.redirect(302, `/api/prepare-stream/${req.params.id}`));
// We keep stream-proxy just in case the app is hardcoded to call it somewhere, but it should hit proxyUrl directly.
router.get("/stream-proxy/:id", (req, res) => res.status(404).json({ error: "Proxy no longer needed" }));

export default router;

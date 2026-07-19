async function testAllPiped() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/TeamPiped/Piped-wiki/main/docs/Instances.md');
    const text = await res.text();
    const urls = text.match(/https:\/\/[^\s|\]]+/g) || [];
    
    // filter for api instances
    const apiUrls = urls.filter(u => u.includes('api.piped') || u.includes('pipedapi'));
    console.log(`Found ${apiUrls.length} API instances.`);
    
    for (const api of apiUrls) {
      try {
        const testRes = await fetch(`${api}/streams/dQw4w9WgXcQ`, { signal: AbortSignal.timeout(3000) });
        if (testRes.ok) {
          const data = await testRes.json();
          if (data.audioStreams && data.audioStreams.length > 0) {
            console.log(`SUCCESS: ${api}`);
            const audio = data.audioStreams.find(s => s.quality === 'AUDIO_QUALITY_MEDIUM' || s.mimeType?.includes('mp4a')) || data.audioStreams[0];
            console.log(`Audio URL: ${audio.url.substring(0, 100)}`);
            return;
          }
        }
      } catch(e) {
        // ignore
      }
    }
    console.log("No working instances found.");
  } catch(e) {
    console.error(e);
  }
}
testAllPiped();

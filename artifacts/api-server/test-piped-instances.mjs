async function testPiped() {
  const instances = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.tokhmi.xyz',
    'https://pipedapi.syncpundit.io',
    'https://api.piped.privacydev.net',
    'https://piped-api.lunar.icu',
    'https://api.piped.projectsegfau.lt'
  ];
  
  for (const instance of instances) {
    try {
      console.log(`Testing ${instance}...`);
      const res = await fetch(`${instance}/streams/dQw4w9WgXcQ`);
      if (res.ok) {
        const data = await res.json();
        const audio = data.audioStreams?.find(s => s.mimeType?.includes('mp4'));
        if (audio && audio.url) {
          console.log(`SUCCESS: ${instance}`);
          console.log(`URL: ${audio.url.substring(0, 100)}...`);
          
          // Test if we can actually download from this URL
          const headRes = await fetch(audio.url, { method: 'HEAD' });
          console.log(`HEAD status: ${headRes.status}`);
          if (headRes.status === 200) {
            return;
          }
        }
      }
    } catch(e) {
      console.log(`Failed: ${instance}`);
    }
  }
}
testPiped();

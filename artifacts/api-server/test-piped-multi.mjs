async function testPiped() {
  const instances = [
    'https://pipedapi.kavin.rocks',
    'https://piped-api.lunar.icu',
    'https://api.piped.privacydev.net',
    'https://pipedapi.in.projectsegfau.lt',
    'https://api.piped.projectsegfau.lt',
    'https://pipedapi.moomoo.me',
    'https://pipedapi.syncpundit.io',
    'https://pipedapi.drgns.space'
  ];
  for (const instance of instances) {
    try {
      const res = await fetch(`${instance}/streams/dQw4w9WgXcQ`);
      if (res.ok) {
        const data = await res.json();
        const audio = data.audioStreams?.find(s => s.mimeType && s.mimeType.includes('mp4'));
        if (audio && audio.url) {
          console.log("SUCCESS:", instance, audio.url);
          return;
        }
      }
    } catch(e) {}
  }
  console.log("ALL FAILED");
}
testPiped();

async function testInvidious() {
  const instances = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://invidious.f5.si',
    'https://yt.chocolatemoo53.com',
    'https://inv.zoomerville.com',
    'https://invidious.tiekoetter.com'
  ];
  for (const instance of instances) {
    try {
      const res = await fetch(`${instance}/api/v1/videos/dQw4w9WgXcQ`);
      if (res.ok) {
        const data = await res.json();
        const audio = data.formatStreams?.find(s => s.itag === '140' || s.itag === 140) || data.adaptiveFormats?.find(s => s.itag === '140' || s.itag === 140);
        if (audio && audio.url) {
          console.log("SUCCESS:", instance);
          return;
        }
      }
    } catch(e) {}
  }
  console.log("ALL FAILED");
}
testInvidious();

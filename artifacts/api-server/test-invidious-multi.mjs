async function testInvidious() {
  const instances = [
    'https://vid.puffyan.us',
    'https://inv.tux.pizza',
    'https://invidious.jing.rocks',
    'https://invidious.nerdvpn.de'
  ];
  for (const instance of instances) {
    try {
      console.log("Trying", instance);
      const res = await fetch(`${instance}/api/v1/videos/dQw4w9WgXcQ`);
      if (res.ok) {
        const data = await res.json();
        const audio = data.formatStreams?.find(s => s.itag === '140' || s.itag === 140) || data.adaptiveFormats?.find(s => s.itag === '140' || s.itag === 140);
        console.log("Success with", instance, "Audio URL:", audio ? audio.url : "Not found");
        return;
      } else {
        console.log("Failed with status", res.status);
      }
    } catch(e) {
      console.error("Error on", instance, e.message);
    }
  }
}
testInvidious();

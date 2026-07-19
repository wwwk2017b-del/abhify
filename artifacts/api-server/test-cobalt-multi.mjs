async function getCobalt() {
  const instances = [
    'https://cobalt.qewertyy.dev',
    'https://api.cobalt.tools',
    'https://co.wuk.sh'
  ];
  for (const instance of instances) {
    try {
      const res = await fetch(`${instance}/api/json`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', isAudioOnly: true })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          console.log("SUCCESS:", instance, data.url);
          return;
        }
      }
    } catch(e) {}
  }
  console.log("ALL FAILED");
}
getCobalt();

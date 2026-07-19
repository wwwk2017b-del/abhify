async function testCobalt() {
  const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  try {
    const res = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, isAudioOnly: true })
    });
    const data = await res.json();
    console.log(data);
  } catch(e) {
    console.error(e);
  }
}
testCobalt();

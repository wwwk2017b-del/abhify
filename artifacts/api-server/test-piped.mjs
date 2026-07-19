async function testPiped() {
  try {
    const res = await fetch('https://pipedapi.kavin.rocks/streams/dQw4w9WgXcQ');
    const data = await res.json();
    const audio = data.audioStreams.find(s => s.mimeType && s.mimeType.includes('mp4'));
    console.log("Audio URL:", audio ? audio.url : "Not found");
  } catch(e) {
    console.error(e);
  }
}
testPiped();

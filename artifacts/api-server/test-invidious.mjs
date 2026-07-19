async function testInvidious() {
  try {
    const res = await fetch('https://invidious.privacyredirect.com/api/v1/videos/dQw4w9WgXcQ');
    const data = await res.json();
    const audio = data.formatStreams.find(s => s.itag === '140' || s.itag === 140);
    console.log("Audio URL:", audio ? audio.url : "Not found");
  } catch(e) {
    console.error(e);
  }
}
testInvidious();

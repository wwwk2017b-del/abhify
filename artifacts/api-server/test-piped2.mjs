async function testPiped() {
  try {
    const res = await fetch('https://pipedapi.kavin.rocks/streams/dQw4w9WgXcQ');
    console.log(res.status);
    const text = await res.text();
    console.log(text.substring(0, 500));
  } catch(e) {
    console.error(e);
  }
}
testPiped();

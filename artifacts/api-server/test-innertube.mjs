import { Innertube, UniversalCache } from 'youtubei.js';

async function testInnertube() {
  try {
    console.log("Starting Innertube...");
    const yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true
    });
    
    console.log("Fetching video info...");
    const info = await yt.getBasicInfo('dQw4w9WgXcQ');
    
    console.log("Getting formats...");
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    
    console.log("URL:", format.decipher(yt.session.player));
  } catch(e) {
    console.error(e);
  }
}
testInnertube();

import { Innertube, UniversalCache } from 'youtubei.js';

async function testInnertube() {
  try {
    const yt = await Innertube.create({ generate_session_locally: true });
    const info = await yt.getBasicInfo('dQw4w9WgXcQ');
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    console.log(format);
  } catch(e) { console.error(e) }
}
testInnertube();

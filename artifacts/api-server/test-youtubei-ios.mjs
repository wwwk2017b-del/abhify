import { Innertube, UniversalCache } from 'youtubei.js';

async function run() {
  const yt = await Innertube.create({
    cache: new UniversalCache(false),
    generate_session_locally: true,
    client_type: 'IOS'
  });
  
  try {
    const info = await yt.getBasicInfo('dQw4w9WgXcQ');
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    console.log(format.decipher(yt.session.player));
  } catch (e) {
    console.error(e);
  }
}
run();

import ytdl from '@distube/ytdl-core';

async function test() {
  try {
    const info = await ytdl.getInfo('ko70cExuzZM');
    const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly' });
    console.log("Audio URL:", format.url);
  } catch(e) {
    console.error(e);
  }
}
test();

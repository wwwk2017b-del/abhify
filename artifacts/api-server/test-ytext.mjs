import { videoInfo } from 'youtube-ext';

async function testYtExt() {
  try {
    const info = await videoInfo('dQw4w9WgXcQ');
    const url = info.streamingData?.serverAbrStreamingUrl;
    console.log("URL:", url);
  } catch(e) {
    console.error(e);
  }
}
testYtExt();

import fs from 'fs';
import https from 'https';
import path from 'path';
import { exec } from 'child_process';

const isWindows = process.platform === 'win32';
const filename = isWindows ? 'yt-dlp.exe' : 'yt-dlp';
const url = isWindows 
  ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
  : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

console.log(`Downloading ${filename} (this might take a few seconds)...`);
const file = fs.createWriteStream(filename);

https.get(url, (response) => {
  if (response.statusCode === 302 || response.statusCode === 301) {
    https.get(response.headers.location, (res2) => {
      res2.pipe(file);
      file.on("finish", () => {
        file.close();
        if (!isWindows) {
          exec(`chmod +x ${filename}`);
        }
        console.log("Download complete!");
      });
    });
  } else {
    response.pipe(file);
    file.on("finish", () => {
      file.close();
      if (!isWindows) {
        exec(`chmod +x ${filename}`);
      }
      console.log("Download complete!");
    });
  }
});

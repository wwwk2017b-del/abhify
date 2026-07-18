import { execSync } from 'child_process';
import path from 'path';

const isWindows = process.platform === 'win32';
const filename = isWindows ? 'yt-dlp.exe' : 'yt-dlp';
const url = isWindows 
  ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
  : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

console.log(`Downloading ${filename} using curl...`);

try {
  execSync(`curl -L -o ${filename} ${url}`, { stdio: 'inherit' });
  if (!isWindows) {
    execSync(`chmod +x ${filename}`);
  }
  console.log("Download complete!");
} catch (err) {
  console.error("Failed to download yt-dlp:", err);
  process.exit(1);
}

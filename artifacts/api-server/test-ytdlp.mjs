import { exec } from "child_process";

exec("yt-dlp.exe --get-url --format bestaudio[ext=m4a] https://www.youtube.com/watch?v=dQw4w9WgXcQ", (err, stdout, stderr) => {
  console.log("Stdout:", stdout);
  console.log("Stderr:", stderr);
});

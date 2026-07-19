import ytSearch from 'yt-search';

console.time('ytSearch');
ytSearch('never gonna give you up')
  .then(res => {
    console.timeEnd('ytSearch');
    console.log("Found:", res.videos.length);
  })
  .catch(err => {
    console.timeEnd('ytSearch');
    console.error("Error:", err);
  });

import pkg from 'jiosaavn-sdk';
const { SearchService, SongService } = pkg;

async function run() {
  const searchService = new SearchService();
  const songService = new SongService();
  try {
    const searchResult = await searchService.searchSongs({ query: 'believer' });
    if (searchResult?.data?.results?.length > 0) {
      const firstSong = searchResult.data.results[0];
      console.log('First song ID:', firstSong.id);
      console.log('First song name:', firstSong.name);
      
      const songDetails = await songService.getSongByIds({ ids: [firstSong.id] });
      console.log('Song downloadUrls:', JSON.stringify(songDetails?.data?.[0]?.downloadUrl, null, 2));
    }
  } catch (err) {
    console.error(err);
  }
}
run();

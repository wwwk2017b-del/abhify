import pkg from 'saavnapi'; 
const SaavnAPI = pkg.default; 
async function run() { 
  const saavn = new SaavnAPI(); 
  try { 
    const searchResult = await saavn.search.searchAll('believer'); 
    console.log('Search results:', JSON.stringify(searchResult.data, null, 2)); 
  } catch (err) { 
    console.error(err); 
  } 
} 
run();

async function testInvidious() {
  try {
    const res = await fetch('https://api.invidious.io/instances.json');
    const instances = await res.json();
    
    // Get active https instances with API enabled
    const activeInstances = instances
      .map(i => i[1])
      .filter(i => i.type === 'https' && i.api === true && i.cors === true);
      
    console.log(`Found ${activeInstances.length} active instances.`);
    
    for (const instance of activeInstances.slice(0, 10)) {
      try {
        console.log(`Testing ${instance.uri}...`);
        const testRes = await fetch(`${instance.uri}/api/v1/videos/dQw4w9WgXcQ`, { signal: AbortSignal.timeout(5000) });
        if (testRes.ok) {
          const data = await testRes.json();
          const audio = data.formatStreams?.find(s => s.itag === '140' || s.itag === 140) 
            || data.adaptiveFormats?.find(s => s.itag === '140' || s.itag === 140);
            
          if (audio && audio.url) {
            console.log(`SUCCESS: ${instance.uri}`);
            console.log(`URL: ${audio.url.substring(0, 100)}...`);
            
            // Test if we can actually stream from this URL
            const headRes = await fetch(audio.url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
            console.log(`HEAD status: ${headRes.status}`);
            if (headRes.status === 200) {
              console.log(`*** FOUND WORKING API: ${instance.uri} ***`);
              return;
            }
          }
        }
      } catch(e) {
        console.log(`Failed: ${instance.uri} - ${e.message}`);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
testInvidious();

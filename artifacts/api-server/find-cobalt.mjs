async function findCobalt() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/imputnet/cobalt/current/instances.json');
    const data = await res.json();
    for (const instance of data) {
      if (instance.api && instance.api.includes('https')) {
        console.log(instance.api);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
findCobalt();

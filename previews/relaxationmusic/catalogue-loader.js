(function (root) {
  'use strict';
  function create(fetcher = (...args) => fetch(...args)) {
    let manifest, next = 0, running;
    const tracks = [];
    async function json(url) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);
      try {
        const response = await fetcher(url, {signal: controller.signal});
        if (!response.ok) throw new Error('Catalogue HTTP ' + response.status);
        return await response.json();
      } finally { clearTimeout(timeout); }
    }
    async function run(progress) {
      if (!manifest) {
        const value = await json('catalogue/manifest.json?v=chunks-1');
        if (!Array.isArray(value.chunks) || !Number.isInteger(value.count) || value.count < 1 ||
            value.chunks.reduce((sum, chunk) => sum + chunk.count, 0) !== value.count ||
            value.chunks.some(chunk => !/^[\w-]+\.json$/.test(chunk.file) || !Number.isInteger(chunk.count) || chunk.count < 1)) {
          throw new Error('Invalid catalogue manifest');
        }
        manifest = value;
      }
      progress(tracks.length, manifest.count);
      while (next < manifest.chunks.length) {
        const chunk = manifest.chunks[next];
        const rows = await json('catalogue/' + chunk.file);
        if (!Array.isArray(rows) || rows.length !== chunk.count || rows.some(row => !Array.isArray(row) || row.length !== 14)) {
          throw new Error('Invalid catalogue chunk');
        }
        // Commit only complete chunks so retry never duplicates or loses rows.
        for (const row of rows) tracks.push(row);
        next += 1;
        progress(tracks.length, manifest.count);
      }
      return tracks;
    }
    return {load(progress = () => {}) {
      if (!running) running = run(progress).finally(() => { running = null; });
      return running;
    }};
  }
  root.CatalogueLoader = {create};
  if (typeof module !== 'undefined') module.exports = {create};
})(globalThis);

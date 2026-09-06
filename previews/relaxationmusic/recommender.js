(function (root) {
  'use strict';
  const C = { id: 0, name: 1, artists: 2, year: 3, tempo: 4, energy: 5, danceability: 6,
    acousticness: 7, instrumentalness: 8, valence: 9, speechiness: 10, loudness: 11, duration: 12, explicit: 13 };
  const keys = ['energy', 'danceability', 'acousticness', 'instrumentalness', 'valence'];
  const presets = {
    switch: { energy: .55, danceability: .75, acousticness: .15, instrumentalness: .7, valence: .5, tempoMin: 115, tempoMax: 130 },
    soften: { energy: .2, danceability: .35, acousticness: .8, instrumentalness: .85, valence: .35, tempoMin: 50, tempoMax: 160 },
    focus: { energy: .4, danceability: .55, acousticness: .4, instrumentalness: .9, valence: .45, tempoMin: 70, tempoMax: 150 }
  };
  const normalize = s => s.normalize('NFKC').toLocaleLowerCase().trim();
  function distance(track, target) {
    const weights = { energy: 2, danceability: 2, acousticness: 1, instrumentalness: 2, valence: 1 };
    return keys.reduce((sum, key) => sum + weights[key] * (track[C[key]] - target[key]) ** 2, 0) / 8;
  }
  function accepts(t, filters) {
    return t[C.tempo] > 0 && t[C.tempo] >= filters.tempoMin && t[C.tempo] <= filters.tempoMax &&
      t[C.year] >= filters.yearMin && (!filters.noExplicit || !t[C.explicit]) &&
      (!filters.instrumentalOnly || t[C.instrumentalness] >= .5) &&
      t[C.speechiness] < .33 && !filters.excluded?.has(t[C.id]);
  }
  function rank(tracks, target, filters, limit = 60) {
    const candidates = [];
    for (const t of tracks) if (accepts(t, filters)) candidates.push({ track: t, distance: distance(t, target) });
    candidates.sort((a, b) => a.distance - b.distance || a.track[C.id].localeCompare(b.track[C.id]));
    const seen = new Set(), artistCounts = new Map(), results = [];
    for (const item of candidates) {
      const artist = normalize(item.track[C.artists]);
      const identity = artist + '\0' + normalize(item.track[C.name]);
      if (seen.has(identity) || (artistCounts.get(artist) || 0) >= 2) continue;
      seen.add(identity);
      artistCounts.set(artist, (artistCounts.get(artist) || 0) + 1);
      results.push(item);
      if (results.length >= limit) break;
    }
    return { count: candidates.length, results };
  }
  function search(tracks, query, limit = 8) {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    if (terms.join('').length < 2) return [];
    const results = [];
    for (const t of tracks) {
      const haystack = normalize(t[C.name] + ' ' + t[C.artists]);
      if (terms.every(term => haystack.includes(term))) results.push(t);
      if (results.length >= limit) break;
    }
    return results;
  }
  const api = { C, keys, presets, distance, accepts, rank, search };
  root.MusicMatcher = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);

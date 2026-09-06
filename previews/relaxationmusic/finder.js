/* The catalogue stays separate from the study's three published cluster means. */
(function () {
  'use strict';
  const M = window.MusicMatcher, C = M.C;
  const $ = id => document.getElementById(id);
  const labels = { energy: 'Энергия', danceability: 'Танцевальность', acousticness: 'Акустичность', instrumentalness: 'Инструментальность', valence: 'Позитивность звучания' };
  const descriptions = {
    energy: 'Воспринимаемая интенсивность звучания: от низкой к высокой.',
    danceability: 'Оценка пригодности для танца. Учитывает ритм и темп, но не определяет жанр.',
    acousticness: 'Уверенность алгоритма в акустическом звучании: от 0 до 1.',
    instrumentalness: 'Вероятность отсутствия вокала: от 0 до 1. Это не доля времени без голоса.',
    valence: 'От более мрачного звучания к более радостному. Это не оценка настроения слушателя.'
  };
  let tracks = [], target = { ...M.presets.switch }, ranked = [], shown = 12;
  const excluded = new Set();
  const smallScreen = matchMedia('(max-width: 760px)');
  $('sound-options').open = !smallScreen.matches;
  smallScreen.addEventListener('change', event => { $('sound-options').open = !event.matches; });
  let timer;
  const number = value => value.toLocaleString('ru-RU');
  function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function link(label, url) {
    const el = node('a', label);
    el.href = url; el.target = '_blank'; el.rel = 'noopener noreferrer';
    return el;
  }
  for (const key of M.keys) {
    const field = node('div');
    const label = node('label', undefined, 'slider-label'); label.htmlFor = key;
    label.append(node('span', labels[key]));
    const output = node('output', target[key].toFixed(2)); output.id = key + '-value'; output.htmlFor = key;
    label.append(output);
    const input = node('input'); Object.assign(input, { type: 'range', id: key, min: '0', max: '1', step: '.01', value: String(target[key]) });
    input.setAttribute('aria-describedby', key + '-help');
    const help = node('span', descriptions[key], 'sr-only'); help.id = key + '-help';
    field.append(label, input, help); $('sliders').append(field);
    input.addEventListener('input', () => {
      target[key] = Number(input.value); output.value = target[key].toFixed(2);
      custom(); schedule();
    });
  }
  function custom() {
    document.querySelector('input[value="custom"]').checked = true;
    $('seed-status').hidden = true;
  }
  function setControls() {
    for (const key of M.keys) {
      $(key).value = target[key]; $(key + '-value').value = target[key].toFixed(2);
    }
    $('tempoMin').value = target.tempoMin; $('tempoMax').value = target.tempoMax;
  }
  document.querySelectorAll('input[name=mode]').forEach(input => input.addEventListener('change', () => {
    if (input.value === 'custom') return;
    target = { ...M.presets[input.value] };
    $('instrumentalOnly').checked = true;
    $('seed-status').hidden = true;
    setControls(); update();
  }));
  function filters() {
    return { tempoMin: Number($('tempoMin').value), tempoMax: Number($('tempoMax').value),
      yearMin: Number($('yearMin').value), noExplicit: $('noExplicit').checked,
      instrumentalOnly: $('instrumentalOnly').checked, excluded };
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(update, 140); }
  ['tempoMin', 'tempoMax'].forEach(id => $(id).addEventListener('input', () => { custom(); schedule(); }));
  ['yearMin', 'noExplicit', 'instrumentalOnly'].forEach(id => $(id).addEventListener('change', update));
  $('preferences').addEventListener('submit', event => event.preventDefault());
  function update() {
    const f = filters();
    $('profile-summary').textContent = f.tempoMin + '–' + f.tempoMax + ' BPM';
    const valid = f.tempoMin >= 1 && f.tempoMax <= 244 && f.tempoMin <= f.tempoMax && f.tempoMax >= 1;
    $('tempo-error').hidden = valid;
    $('tempoMin').setAttribute('aria-invalid', String(!valid));
    $('tempoMax').setAttribute('aria-invalid', String(!valid));
    if (!valid) {
      ranked = []; $('results').replaceChildren(); $('more').hidden = true; $('empty').hidden = true;
      $('catalog-status').textContent = 'Проверь диапазон темпа'; return;
    }
    if (!tracks.length) return;
    const result = M.rank(tracks, target, f);
    ranked = result.results; shown = 12;
    $('catalog-status').textContent = number(result.count) + ' прошли фильтры · ' + f.yearMin + '–2020';
    render();
  }
  function chooseSeed(t) {
    for (const key of M.keys) target[key] = t[C[key]];
    const bpm = t[C.tempo];
    target.tempoMin = bpm > 0 ? Math.max(1, Math.floor(bpm - 10)) : 1;
    target.tempoMax = bpm > 0 ? Math.min(244, Math.ceil(bpm + 10)) : 244;
    if (t[C.year] < Number($('yearMin').value)) $('yearMin').value = '1921';
    if (t[C.instrumentalness] < .5) $('instrumentalOnly').checked = false;
    if (t[C.explicit]) $('noExplicit').checked = false;
    custom(); excluded.add(t[C.id]); setControls();
    $('seed-status').textContent = 'Ориентир: ' + t[C.artists] + ' — ' + t[C.name] + (bpm > 0 ? '' : '. Темп неизвестен; поиск по всем BPM.');
    $('seed-status').hidden = false;
    $('seed-results').hidden = true; $('seed-search').value = '';
    update();
  }
  function render() {
    const frag = document.createDocumentFragment();
    ranked.slice(0, shown).forEach(({ track: t }, index) => {
      const li = node('li', undefined, 'track');
      li.dataset.trackId = t[C.id];
      const count = node('span', String(index + 1).padStart(2, '0'), 'track-number'); count.setAttribute('aria-hidden', 'true');
      const body = node('div');
      body.append(node('div', t[C.name], 'track-title'));
      const seconds = Math.round(t[C.duration] / 1000);
      body.append(node('div', t[C.artists] + ' · ' + t[C.year] + ' · ' + Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0'), 'track-artist'));
      const meta = node('div', undefined, 'track-meta');
      meta.append(node('strong', t[C.tempo].toFixed(1) + ' BPM'));
      meta.append(node('span', 'энергия ' + t[C.energy].toFixed(2)));
      meta.append(node('span', 'танцевальность ' + t[C.danceability].toFixed(2)));
      meta.append(node('span', 'инструментальность ' + t[C.instrumentalness].toFixed(2)));
      body.append(meta);
      const actions = node('div', undefined, 'track-actions');
      actions.append(link('Spotify', 'https://open.spotify.com/track/' + encodeURIComponent(t[C.id])),
        link('YouTube', 'https://www.youtube.com/results?search_query=' + encodeURIComponent(t[C.artists] + ' ' + t[C.name])));
      const similar = node('button', 'Ближе к этому'); similar.type = 'button';
      similar.setAttribute('aria-label', 'Искать похожее на ' + t[C.name] + ', ' + t[C.artists]);
      similar.addEventListener('click', () => { chooseSeed(t); $('seed-status').tabIndex = -1; $('seed-status').focus(); });
      const skip = node('button', 'Пропустить', 'skip'); skip.type = 'button';
      skip.setAttribute('aria-label', 'Пропустить ' + t[C.name]);
      skip.addEventListener('click', () => { excluded.add(t[C.id]); update(); $('restore').focus(); });
      actions.append(similar, skip); body.append(actions); li.append(count, body); frag.append(li);
    });
    $('results').replaceChildren(frag);
    $('empty').hidden = ranked.length > 0;
    $('more').hidden = shown >= ranked.length;
    $('restore').hidden = excluded.size === 0;
  }
  $('more').addEventListener('click', () => { shown += 12; render(); });
  $('restore').addEventListener('click', () => { excluded.clear(); update(); });
  $('reset-filters').addEventListener('click', () => {
    $('tempoMin').value = '1'; $('tempoMax').value = '244'; $('yearMin').value = '1921'; custom(); update();
  });
  let searchTimer;
  $('seed-search').disabled = true;
  $('seed-search').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const query = $('seed-search').value.trim();
      const results = M.search(tracks, query);
      $('seed-results').replaceChildren();
      $('seed-results').hidden = query.length < 2;
      if (query.length < 2) return;
      if (!results.length) {
        $('seed-results').append(node('p', 'В этом каталоге не найдено. Можно задать параметры вручную.', 'paper-note')); return;
      }
      for (const t of results) {
        const button = node('button', t[C.name]); button.type = 'button';
        button.append(node('small', t[C.artists] + ' · ' + t[C.year]));
        button.addEventListener('click', () => { chooseSeed(t); $('seed-search').focus(); });
        $('seed-results').append(button);
      }
    }, 200);
  });
  $('seed-search').addEventListener('keydown', event => {
    if (event.key === 'Escape') $('seed-results').hidden = true;
    if (event.key === 'ArrowDown') $('seed-results').querySelector('button')?.focus();
  });
  function failed() {
    $('loading').textContent = 'Каталог не удалось загрузить. Открой страницу ещё раз.';
    $('catalog-status').textContent = 'Каталог недоступен';
    const retry = node('button', 'Повторить'); retry.type = 'button';
    retry.addEventListener('click', () => location.reload()); $('loading').append(retry);
  }
  const script = document.createElement('script'); script.src = 'catalogue.js';
  script.onload = () => {
    if (!window.MUSIC_CATALOGUE?.tracks?.length) { failed(); return; }
    tracks = window.MUSIC_CATALOGUE.tracks;
    $('loading').hidden = true; $('seed-search').disabled = false;
    const preset = new URLSearchParams(location.search).get('profile');
    if (M.presets[preset]) {
      target = { ...M.presets[preset] }; document.querySelector('input[value="' + preset + '"]').checked = true; setControls();
    }
    update();
  };
  script.onerror = failed; document.head.append(script);
})();

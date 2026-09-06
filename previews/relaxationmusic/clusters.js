(function () {
  'use strict';
  const root = document.getElementById('music-map');
  if (!root) return;
  const data = [
    { id: 1, name: 'Громкая, энергичная, танцевальная', n: 324, color: '#c64e40', energy: .69, danceability: .59, acousticness: .14, instrumentalness: .05, valence: .50, speechiness: .07,
      description: 'Самый большой кластер. Относительно высокая энергия и танцевальность, низкая акустичность; обычно с вокалом.',
      examples: [['Home', 'Depeche Mode'], ['My Sweet Lord', 'George Harrison'], ['Toxicity', 'System Of A Down']] },
    { id: 2, name: 'Нейтрально-акустическая', n: 195, color: '#168061', energy: .33, danceability: .51, acousticness: .75, instrumentalness: .03, valence: .30, speechiness: .04,
      description: 'Больше акустического звучания, меньше энергии. Низкая инструментальность: в этой группе часто есть вокал.',
      examples: [['Patience', "Guns N' Roses"], ['Can You Feel the Love Tonight', 'Elton John'], ['Seigfried', 'Frank Ocean']] },
    { id: 3, name: 'Мягкая инструментальная', n: 79, color: '#9b7518', energy: .16, danceability: .35, acousticness: .89, instrumentalness: .87, valence: .18, speechiness: .04,
      description: 'Самый маленький кластер. Высокая акустичность и инструментальность, низкая энергия.',
      examples: [['River Flows In You', 'Yiruma'], ['Evening Wind', 'Joe Hisaishi'], ['Weightless Part 4', 'Marconi Union']] }
  ];
  const labels = { energy: 'Энергия', danceability: 'Танцевальность', acousticness: 'Акустичность', instrumentalness: 'Инструментальность', valence: 'Позитивность звучания', speechiness: 'Речевитость' };
  const svg = root.querySelector('svg');
  let selected = 1;
  const ns = 'http://www.w3.org/2000/svg';
  function mark(tag, attrs, text) {
    const el = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function draw() {
    const width = Math.max(270, svg.getBoundingClientRect().width || 720), height = 340;
    const left = 55, right = width - 35, top = 24, bottom = height - 60;
    const xKey = root.querySelector('#map-x').value, yKey = root.querySelector('#map-y').value;
    const x = value => left + (value + .12) / 1.24 * (right - left), y = value => bottom - (value + .12) / 1.24 * (bottom - top);
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    const content = document.createDocumentFragment();
    content.append(mark('title', {}, 'Средние параметры трёх кластеров: ' + labels[xKey] + ' и ' + labels[yKey]));
    content.append(mark('desc', {}, 'Один круг обозначает среднее целого кластера. Площадь пропорциональна числу треков. Значения доступны в таблице под картой.'));
    for (const value of [0, .25, .5, .75, 1]) {
      content.append(mark('line', { x1: left, x2: right, y1: y(value), y2: y(value), stroke: '#e4e4e4' }));
      content.append(mark('text', { x: left - 10, y: y(value) + 4, 'text-anchor': 'end' }, String(value).replace('.', ',')));
      content.append(mark('text', { x: x(value), y: bottom + 22, 'text-anchor': 'middle' }, String(value).replace('.', ',')));
    }
    content.append(mark('text', { x: (left + right) / 2, y: height - 9, 'text-anchor': 'middle', class: 'axis-label' }, labels[xKey] + ' (0–1)'));
    content.append(mark('text', { transform: 'translate(15 ' + ((top + bottom) / 2) + ') rotate(-90)', 'text-anchor': 'middle', class: 'axis-label' }, labels[yKey] + ' (0–1)'));
    for (const d of [...data].sort((a, b) => (a.id === selected) - (b.id === selected))) {
      const radius = Math.sqrt(d.n / 324) * Math.min(22, (right - left) * .105);
      const circle = mark('circle', { cx: x(d[xKey]), cy: y(d[yKey]), r: radius, fill: d.color, opacity: d.id === selected ? 1 : .7,
        stroke: d.id === selected ? '#161616' : 'none', 'stroke-width': 2, cursor: 'pointer', role: 'button', tabindex: '0',
        'aria-label': d.name + ': ' + labels[xKey] + ' ' + d[xKey] + ', ' + labels[yKey] + ' ' + d[yKey] + ', ' + d.n + ' треков', 'aria-pressed': d.id === selected });
      circle.append(mark('title', {}, d.name + ': ' + d.n + ' треков'));
      circle.addEventListener('click', () => select(d.id));
      circle.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault(); select(d.id); root.querySelector('[data-cluster="' + d.id + '"]').focus();
        }
      });
      content.append(circle, mark('text', { x: x(d[xKey]), y: y(d[yKey]) + 5, 'text-anchor': 'middle', class: 'marker-label' }, String(d.id)));
    }
    svg.replaceChildren(content);
  }
  function select(id) {
    selected = id;
    const d = data.find(cluster => cluster.id === selected);
    root.style.setProperty('--selected', d.color);
    root.querySelectorAll('[data-cluster]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.cluster) === id)));
    root.querySelector('#cluster-title').textContent = d.id + '. ' + d.name;
    root.querySelector('#cluster-description').textContent = d.description;
    const bars = root.querySelector('#cluster-features'); bars.replaceChildren();
    for (const [key, label] of Object.entries(labels)) {
      const cell = document.createElement('div');
      const head = document.createElement('div'); head.className = 'feature-head';
      const name = document.createElement('span'); name.textContent = label;
      const value = document.createElement('span'); value.textContent = d[key].toFixed(2).replace('.', ',');
      head.append(name, value);
      const bar = document.createElement('div'); bar.className = 'track-bar'; bar.setAttribute('aria-hidden', 'true');
      const fill = document.createElement('span'); fill.style.width = d[key] * 100 + '%'; bar.append(fill); cell.append(head, bar); bars.append(cell);
    }
    const examples = root.querySelector('#cluster-examples'); examples.replaceChildren('Примеры из исследования: ');
    d.examples.forEach(([name, artist], index) => {
      if (index) examples.append('; ');
      const a = document.createElement('a'); a.textContent = artist + ' — ' + name;
      a.href = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(artist + ' ' + name);
      a.target = '_blank'; a.rel = 'noopener noreferrer'; examples.append(a);
    });
    draw();
  }
  root.querySelectorAll('[data-cluster]').forEach(button => button.addEventListener('click', () => select(Number(button.dataset.cluster))));
  root.querySelectorAll('.map-axes select').forEach(input => input.addEventListener('change', draw));
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(draw).observe(svg);
  select(1);
})();

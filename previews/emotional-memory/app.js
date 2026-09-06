/* Illustrative states, not empirical neural weights or a learning simulation. */
const states = [
  {title:'Привычное ожидание', caption:'Ошибка будто заранее означает: меня осудят.', old:7, fresh:0, visible:0, activation:0},
  {title:'Ожидание оживает', caption:'Новый черновик вызывает знакомое ожидание унижения.', old:7, fresh:0, visible:0, activation:1},
  {title:'Другой исход', caption:'Ошибку заметили. Вместо унижения предложили исправление.', old:6, fresh:2, visible:1, activation:0},
  {title:'Больше одного исхода', caption:'У ошибки появляется другая устойчивая ассоциация. Прежняя не стёрта.', old:3, fresh:7, visible:1, activation:0}
];

function stageAt(tops, readingLine) {
  let index = 0;
  tops.forEach((top, i) => { if (top <= readingLine) index = i; });
  return index;
}

function mount() {
  const steps = [...document.querySelectorAll('.step')];
  const map = document.querySelector('.map');
  const oldEdges = document.querySelector('.old-edges');
  const newEdges = document.querySelector('.new-edges');
  const newNodes = document.querySelector('.new-nodes');
  const activation = document.querySelector('.activation');
  const title = document.getElementById('map-heading');
  const caption = document.getElementById('map-caption');
  const count = document.getElementById('stage-count');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let active = -1;
  let current = {...states[0]};
  let frame = 0;
  let pending = false;
  let lastTime = 0;

  function paint() {
    oldEdges.setAttribute('stroke-width', current.old.toFixed(2));
    newEdges.setAttribute('stroke-width', current.fresh.toFixed(2));
    newEdges.setAttribute('opacity', current.visible.toFixed(3));
    newNodes.setAttribute('opacity', current.visible.toFixed(3));
    activation.setAttribute('opacity', current.activation.toFixed(3));
  }

  function animate(time) {
    const target = states[active];
    const factor = reduced.matches ? 1 : 1 - Math.exp(-Math.min(time - lastTime, 64) / 110);
    lastTime = time;
    let moving = false;
    for (const key of ['old','fresh','visible','activation']) {
      current[key] += (target[key] - current[key]) * factor;
      if (Math.abs(target[key] - current[key]) < .005) current[key] = target[key];
      else moving = true;
    }
    paint();
    frame = moving ? requestAnimationFrame(animate) : 0;
  }

  function update() {
    pending = false;
    const mobile = matchMedia('(max-width: 700px)').matches;
    // On mobile the reading line must be below the sticky diagram, not behind it.
    const sticky = getComputedStyle(map).position === 'sticky';
    const line = mobile && sticky ? Math.min(innerHeight - 50, map.getBoundingClientRect().bottom + 85) : innerHeight * .46;
    const next = stageAt(steps.map(step => step.getBoundingClientRect().top), line);
    if (next === active) return;
    active = next;
    map.dataset.stage = String(active);
    title.textContent = states[active].title;
    caption.textContent = states[active].caption;
    count.textContent = `0${active + 1} / 04`;
    steps.forEach((step, i) => step.classList.toggle('current', i === active));
    if (frame) cancelAnimationFrame(frame);
    lastTime = performance.now();
    frame = requestAnimationFrame(animate);
  }

  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(update); }
  }
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule);
  addEventListener('pageshow', schedule);
  reduced.addEventListener('change', () => {
    if (reduced.matches && active >= 0) {
      cancelAnimationFrame(frame); frame = 0;
      current = {...states[active]}; paint();
    }
  });
  new ResizeObserver(schedule).observe(map);
  update();
}

if (typeof document !== 'undefined') mount();
if (typeof module !== 'undefined') module.exports = {states, stageAt};

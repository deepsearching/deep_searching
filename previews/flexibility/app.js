(function (root) {
  'use strict';
  const key = 'se-flexibility-trials-v1';
  const fields = ['goal', 'reason', 'barrier', 'feeling', 'route', 'action', 'criterion', 'minutes', 'when', 'returnAt', 'expectation'];
  const barriers = { feeling: 'Чувство или мысль', resources: 'Не хватает ресурсов', goal: 'Сомнение в цели', mixed: 'Несколько причин' };
  const routes = { step: 'Небольшой шаг', support: 'Разобраться с препятствием', pause: 'Пауза', reconsider: 'Пересмотр цели' };
  const outcomes = { done: 'Сделал выбранное', partly: 'Сделал часть', not_started: 'Не получилось начать', changed: 'Изменил решение' };
  const fresh = () => ({ version: 1, view: 'draft', draft: {}, attempt: null, records: [], review: {} });
  function remaining(start, minutes, now) { return Math.max(0, Math.ceil((start + minutes * 60000 - now) / 1000)); }
  function validPlan(p) {
    return p && fields.every(f => typeof p[f] === 'string' && p[f].length <= 800) &&
      Object.hasOwn(barriers, p.barrier) && Object.hasOwn(routes, p.route) &&
      [2, 5, 10, 15, 30, 60].includes(Number(p.minutes)) && ['now', 'later'].includes(p.when) &&
      ['goal', 'reason', 'action', 'criterion', 'expectation', 'feeling'].every(f => p[f].trim());
  }
  function validAttempt(a) { return a && validPlan(a.plan) && Number.isFinite(a.createdAt) && (a.startedAt === null || Number.isFinite(a.startedAt)); }
  function validRecord(r) { return validAttempt(r) && Object.hasOwn(outcomes, r.outcome) && ['fact', 'after', 'adjustment'].every(f => typeof r[f] === 'string') && Number.isFinite(r.completedAt); }
  function parseSaved(text) {
    const s = JSON.parse(text);
    if (!s || s.version !== 1 || !['draft', 'active', 'review', 'done'].includes(s.view) ||
      !s.draft || typeof s.draft !== 'object' || !s.review || typeof s.review !== 'object' ||
      !Array.isArray(s.records) || !s.records.every(validRecord) ||
      (['active', 'review'].includes(s.view) && !validAttempt(s.attempt)) ||
      (s.view === 'done' && !s.records.length)) throw new Error('Invalid saved state');
    return s;
  }
  const core = { remaining, parseSaved, validPlan, fresh };
  if (typeof module !== 'undefined') module.exports = core;
  if (!root.document) return;
  const $ = id => document.getElementById(id);
  let state = fresh(), remember = false;
  function error(message) { $('form-error').textContent = message; $('form-error').hidden = !message; }
  function storageNote(message) {
    $('storage-note').textContent = message || (remember ? 'Записи сохраняются только в этом браузере. На общем устройстве их сможет увидеть другой пользователь.' : 'После перезагрузки страницы записи исчезнут.');
  }
  try {
    const saved = localStorage.getItem(key);
    if (saved) { state = parseSaved(saved); remember = true; }
  } catch (_) { storageNote('Сохранённые записи недоступны. Новые ответы пока останутся только до закрытия страницы.'); }
  $('remember').checked = remember;
  function save() {
    if (!remember) return;
    try { localStorage.setItem(key, JSON.stringify(state)); storageNote(); }
    catch (_) { storageNote('Последние изменения не удалось сохранить на устройстве. Они доступны, пока страница открыта.'); }
  }
  function readPlan() {
    const values = new FormData($('plan-form'));
    return Object.fromEntries(fields.map(f => [f, String(values.get(f) || '').trim()]));
  }
  function fillPlan(plan) {
    $('plan-form').reset();
    for (const f of fields) {
      if (f === 'barrier' || f === 'route') {
        if (Object.hasOwn(f === 'barrier' ? barriers : routes, plan[f])) document.querySelector('input[name="' + f + '"][value="' + plan[f] + '"]').checked = true;
      } else if (typeof plan[f] === 'string') $(f).value = plan[f];
    }
    adaptForm();
  }
  const prompts = {
    feeling: 'Можно заметить неприятное чувство и отдельно решить, какое действие сейчас доступно.',
    resources: 'Что должно появиться, чтобы дело стало выполнимым: время, информация, помощь или восстановление?',
    goal: 'У пересмотра цели тоже может быть конкретный результат: например, решение, что стоит продолжать и от чего отказаться.',
    mixed: 'Причины могут сочетаться. Для этой попытки достаточно выбрать одно препятствие, с которым имеет смысл разобраться.'
  };
  const examples = {
    step: ['Моё конкретное действие', 'Записать три возможных первых предложения, не редактируя', 'В документе появились три предложения'],
    support: ['Как я разберусь с препятствием?', 'Сформулировать один недостающий вопрос и отправить его коллеге', 'Вопрос отправлен. Ответ не зависит от меня'],
    pause: ['Как будет выглядеть пауза?', 'На десять минут отойти от экрана, затем решить, возвращаться ли к делу', 'Пауза состоялась; после неё я заново оценил свои силы'],
    reconsider: ['Что я проверю в самой цели?', 'Записать, что мне даёт эта задача и чего стоит её продолжение', 'Записано решение: продолжить, изменить или отказаться']
  };
  function adaptForm() {
    const p = readPlan();
    $('barrier-context').hidden = !Object.hasOwn(barriers, p.barrier);
    $('barrier-note').textContent = prompts[p.barrier] || '';
    $('feeling').required = Boolean(p.barrier);
    const example = examples[p.route] || examples.step;
    $('action-label').textContent = example[0]; $('action').placeholder = example[1]; $('criterion').placeholder = example[2];
    $('return-field').hidden = p.when !== 'later'; $('returnAt').required = p.when === 'later';
    $('returnAt').setCustomValidity('');
  }
  function element(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function pairs(container, values) {
    container.replaceChildren();
    for (const [label, value] of values) container.append(element('dt', label), element('dd', value || 'Не записано'));
  }
  function comparison(container, r) {
    container.replaceChildren();
    const values = [['Ожидал', r.plan.expectation], ['Произошло', r.fact], ['До попытки', r.plan.feeling], ['После попытки', r.after || 'Не записано'], ['Учту в следующий раз', r.adjustment]];
    values.forEach(([label, value], i) => {
      const block = element('div', undefined, i === 4 ? 'comparison-wide' : '');
      block.append(element('p', label, 'label'), element('p', value)); container.append(block);
    });
  }
  const date = value => new Date(value).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  function journal() {
    $('record-count').textContent = state.records.length;
    $('journal-empty').hidden = state.records.length > 0;
    $('clear-data').hidden = !state.records.length && !state.attempt && !state.draft.goal;
    $('records').replaceChildren();
    for (const r of state.records) {
      const entry = element('details', undefined, 'entry');
      const summary = element('summary'); summary.append(element('span', r.plan.goal), element('small', date(r.completedAt)));
      const description = element('p', routes[r.plan.route] + ' · ' + outcomes[r.outcome], 'entry-outcome');
      const plan = element('dl', undefined, 'record'); pairs(plan, [['Выбрал', r.plan.action], ['Критерий', r.plan.criterion]]);
      const body = element('div', undefined, 'comparison'); comparison(body, r); entry.append(summary, description, plan, body); $('records').append(entry);
    }
  }
  function clock() {
    const a = state.attempt;
    if (state.view !== 'active' || !a || a.startedAt === null) return;
    const seconds = remaining(a.startedAt, Number(a.plan.minutes), Date.now());
    $('clock').value = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
    $('budget-label').textContent = seconds ? 'Осталось в выбранном отрезке' : 'Выбранное время закончилось';
    if (!seconds) $('active-note').textContent = 'Время закончилось. Результат ещё не записан.';
  }
  function render(focus = false) {
    for (const view of ['draft', 'active', 'review', 'done']) $(view + '-view').hidden = state.view !== view;
    ['plan', 'act', 'review'].forEach((name, i) => {
      const current = state.view === 'draft' ? 0 : state.view === 'active' ? 1 : 2;
      if (current === i) $('stage-' + name).setAttribute('aria-current', 'step'); else $('stage-' + name).removeAttribute('aria-current');
    });
    if (state.view === 'active') {
      const a = state.attempt, p = a.plan;
      pairs($('active-plan'), [['Мне важно', p.goal], ['Ради чего', p.reason], ['Сейчас мешает', p.feeling], ['Выбираю: ' + routes[p.route].toLowerCase(), p.action], ['Наблюдаемый результат', p.criterion], ['Ожидаю', p.expectation]]);
      $('begin').hidden = a.startedAt !== null; $('edit-plan').hidden = a.startedAt !== null; $('budget').hidden = a.startedAt === null;
      $('active-note').textContent = a.startedAt !== null ? 'Выполнение пока не отмечено. Осталось увидеть, что произойдёт при попытке.' : p.when === 'later' ? 'Запланировано на ' + date(p.returnAt) + '. Автоматического напоминания не будет.' : 'План записан. Попытка ещё не начата.';
      clock();
    }
    if (state.view === 'review') {
      pairs($('review-plan'), [['Выбрал', state.attempt.plan.action], ['Критерий', state.attempt.plan.criterion], ['Ожидал', state.attempt.plan.expectation]]);
      $('review-form').reset();
      for (const f of ['fact', 'after', 'adjustment']) if (typeof state.review[f] === 'string') $(f).value = state.review[f];
      if (Object.hasOwn(outcomes, state.review.outcome)) document.querySelector('input[name="outcome"][value="' + state.review.outcome + '"]').checked = true;
    }
    if (state.view === 'done') {
      comparison($('comparison'), state.records[0]);
      $('done-note').textContent = outcomes[state.records[0].outcome] + '. Это наблюдение об одной попытке, а не оценка твоей психологической гибкости.';
    }
    journal();
    if (focus) {
      const target = state.view === 'draft' ? $('goal') : $(state.view === 'active' ? 'active-title' : state.view === 'review' ? 'review-title' : 'done-title');
      target.focus();
    }
  }
  $('plan-form').addEventListener('input', () => { adaptForm(); state.draft = readPlan(); save(); });
  $('plan-form').addEventListener('change', () => { adaptForm(); state.draft = readPlan(); save(); });
  $('plan-form').addEventListener('submit', event => {
    event.preventDefault(); error('');
    const p = readPlan();
    if (p.when === 'later' && (!Number.isFinite(Date.parse(p.returnAt)) || Date.parse(p.returnAt) <= Date.now())) {
      $('returnAt').setCustomValidity('Укажи время в будущем или выбери «сейчас».'); $('returnAt').reportValidity(); return;
    }
    if (!validPlan(p)) { error('Нужно записать дело, причину, препятствие, действие, критерий и ожидание.'); return; }
    state.draft = p; state.attempt = { plan: p, createdAt: Date.now(), startedAt: null }; state.review = {}; state.view = 'active'; save(); render(true);
  });
  $('begin').addEventListener('click', () => {
    if (state.attempt.startedAt !== null) return;
    state.attempt.startedAt = Date.now(); save(); render();
  });
  $('to-review').addEventListener('click', () => { state.view = 'review'; save(); render(true); });
  $('back-active').addEventListener('click', () => { state.view = 'active'; save(); render(true); });
  $('edit-plan').addEventListener('click', () => { state.view = 'draft'; fillPlan(state.draft); save(); render(true); });
  $('review-form').addEventListener('input', () => { state.review = Object.fromEntries(new FormData($('review-form'))); save(); });
  $('review-form').addEventListener('submit', event => {
    event.preventDefault(); if (state.view !== 'review') return;
    const r = Object.fromEntries(new FormData($('review-form')));
    if (!Object.hasOwn(outcomes, r.outcome) || !r.fact.trim() || !r.adjustment.trim()) { error('Нужны результат, конкретный факт и то, что учтёшь дальше.'); return; }
    state.records.unshift({ ...state.attempt, ...r, completedAt: Date.now() });
    state.attempt = null; state.review = {}; state.view = 'done'; error(''); save(); render(true);
  });
  function newTrial(repeat) {
    const previous = state.records[0]?.plan;
    state.view = 'draft'; state.attempt = null; state.review = {};
    state.draft = repeat && previous ? { goal: previous.goal, reason: previous.reason, minutes: previous.minutes, when: 'now' } : {};
    fillPlan(state.draft); error(''); save(); render(true);
  }
  $('repeat').addEventListener('click', () => newTrial(true));
  $('new-goal').addEventListener('click', () => newTrial(false));
  $('remember').addEventListener('change', () => {
    if (!$('remember').checked) {
      try { localStorage.removeItem(key); remember = false; storageNote(); }
      catch (_) { $('remember').checked = true; storageNote('Не удалось удалить сохранённую копию. Записи остались на устройстве.'); }
    } else { remember = true; save(); }
  });
  $('clear-data').addEventListener('click', () => {
    if (!confirm('Удалить записи и текущую попытку из этого браузера?')) return;
    state = fresh(); fillPlan({}); save(); error(''); render(true);
  });
  fillPlan(state.draft); if (remember) storageNote(); render(); setInterval(clock, 1000);
})(globalThis);

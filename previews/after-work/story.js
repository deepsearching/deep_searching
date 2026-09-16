(() => {
  'use strict';
  const chapterIds = ['light', 'people', 'care', 'decisions', 'phone'];
  const completed = new Set();
  function viewForHash(hash) {
    const id = hash.replace(/^#/, '');
    if (chapterIds.includes(id) || id === 'ending') return {mode: 'reading', id};
    return {mode: id === 'all' ? 'all' : 'menu', id: null};
  }
  function finish(id) {
    if (!chapterIds.includes(id)) throw new Error('Unknown chapter');
    completed.add(id);
    return completed.size === chapterIds.length ? 'ending' : 'menu';
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {viewForHash, finish, completed};
  if (typeof document === 'undefined') return;
  const layout = document.querySelector('.story-layout');
  const chapters = [...document.querySelectorAll('.chapter')];
  const links = [...document.querySelectorAll('[data-chapter]')];
  const allButton = document.querySelector('#all-text');
  const caption = document.querySelector('#menu-caption');
  let current = null;

  function focusView(target) {
    target.focus({preventScroll: true});
    target.scrollIntoView({block: 'start', behavior: 'instant'});
  }

  function updateReceipt() {
    for (const link of links) {
      const id = link.dataset.chapter;
      const done = completed.has(id);
      link.classList.toggle('done', done);
      const paths = done ? ['M20 6 9 17l-5-5'] : ['M7 7h10v10', 'M7 17 17 7'];
      const mark = link.querySelector('.item-mark');
      const svg = mark.querySelector('svg');
      svg.replaceChildren(...paths.map(d => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        return path;
      }));
      link.setAttribute('aria-label', link.children[1].textContent + (done ? ', глава прочитана' : ''));
      if (id === current) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
    caption.textContent = completed.size ? `Прочитано глав: ${completed.size} из 5` : 'Вечернее меню';
    document.querySelector('#receipt-status').textContent = completed.size ? `Прочитано ${completed.size} из пяти глав.` : '';
  }

  function render(mode, id, move = true) {
    current = id || null;
    layout.className = `story-layout ${mode}-mode`;
    chapters.forEach(chapter => { chapter.hidden = mode !== 'all' && chapter.id !== id; });
    allButton.textContent = mode === 'all' ? 'По главам' : 'Весь текст';
    updateReceipt();
    if (move) {
      const target = mode === 'menu' ? document.querySelector('#menu-title') : mode === 'all' ? chapters[0].querySelector('h2') : document.querySelector(`#${id} h2`);
      target.setAttribute('tabindex', '-1');
      focusView(target);
    }
  }

  function navigate(hash) {
    const nextHash = `#${hash}`;
    if (location.hash !== nextHash) history.pushState(null, '', nextHash);
    route(true);
  }

  function route(move) {
    const view = viewForHash(location.hash);
    render(view.mode, view.id, move);
  }

  links.forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    navigate(link.dataset.chapter);
  }));
  document.querySelectorAll('[data-menu], [data-return]').forEach(button => button.addEventListener('click', event => {
    event.preventDefault(); navigate('menu');
  }));
  document.querySelector('[data-summary]').addEventListener('click', event => {
    event.preventDefault(); navigate('ending');
  });
  document.querySelector('[data-all]').addEventListener('click', event => {
    event.preventDefault(); navigate('all');
  });
  document.querySelectorAll('[data-finish]').forEach(button => button.addEventListener('click', () => {
    navigate(finish(button.dataset.finish));
  }));
  allButton.addEventListener('click', () => navigate(layout.classList.contains('all-mode') ? 'menu' : 'all'));
  window.addEventListener('popstate', () => route(true));
  window.addEventListener('hashchange', () => route(true));
  document.documentElement.classList.add('js');
  route(Boolean(location.hash));
})();

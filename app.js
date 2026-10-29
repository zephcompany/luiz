/* Interações gerais: movimento reduzido, header, progresso, FAQ, estados "ao vivo". */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;

  function updateMotion() {
    document.body.classList.toggle('paused', paused);
    root.classList.toggle('motion-ok', !paused);
    document.dispatchEvent(new CustomEvent('swipe:motion', { detail: { paused } }));
  }
  updateMotion();
  reduced.addEventListener('change', e => { paused = e.matches; updateMotion(); });

  /* Sem GSAP (ou com movimento reduzido), tudo fica visível desde o início. */
  if (!window.gsap || !window.ScrollTrigger) root.classList.remove('motion-ok');

  /* Header: fundo e encolhimento ao rolar, esconde ao descer rápido. */
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.scroll-progress');
  let lastY = scrollY;
  let scheduled = false;
  const render = () => {
    const y = scrollY;
    const available = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = `${available > 0 ? (y / available) * 100 : 0}%`;
    if (header) {
      header.classList.toggle('is-scrolled', y > 24);
      const delta = y - lastY;
      if (y > 420 && delta > 6) header.classList.add('is-hidden');
      else if (delta < -4 || y < 120) header.classList.remove('is-hidden');
    }
    lastY = y;
    scheduled = false;
  };
  addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(render); } }, { passive: true });
  addEventListener('resize', render);
  render();

  /* FAQ: um item aberto por vez, com fechamento animado. */
  const items = [...document.querySelectorAll('.faq details')];
  items.forEach(item => {
    const summary = item.querySelector('summary');
    summary.addEventListener('click', event => {
      event.preventDefault();
      if (item.open) close(item);
      else {
        items.forEach(other => { if (other !== item && other.open) close(other); });
        item.open = true;
      }
    });
  });
  function close(item) {
    if (paused) { item.open = false; return; }
    item.classList.add('is-closing');
    const body = item.querySelector('.faq-body');
    const done = () => { item.open = false; item.classList.remove('is-closing'); body.removeEventListener('transitionend', done); };
    body.addEventListener('transitionend', done);
    setTimeout(done, 520);
  }

  /* Ponteiro da demonstração: mira no botão de salvar do card alvo. */
  const appMain = document.querySelector('.app-main');
  const target = document.querySelector('.app-card.is-target .app-save');
  function aimPointer() {
    if (!appMain || !target) return;
    const card = target.closest('.app-card');
    appMain.style.setProperty('--pt-x', `${card.offsetLeft + target.offsetLeft + target.offsetWidth * .35}px`);
    appMain.style.setProperty('--pt-y', `${card.offsetTop + target.offsetTop + target.offsetHeight * .3}px`);
  }
  aimPointer();
  addEventListener('resize', aimPointer, { passive: true });
  document.fonts?.ready.then(aimPointer);
  addEventListener('load', aimPointer, { once: true });

  /* Demonstrações (app, chat): ligam quando entram na tela. */
  if ('IntersectionObserver' in window) {
    const live = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-live'); live.unobserve(entry.target); }
    }), { threshold: .25 });
    document.querySelectorAll('.platform-shot, .bento-chat').forEach(el => live.observe(el));
  } else {
    document.querySelectorAll('.platform-shot, .bento-chat').forEach(el => el.classList.add('is-live'));
  }
})();

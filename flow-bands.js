/* Faixas horizontais: movimento contínuo que reage à velocidade do scroll
   (acelera e inclina levemente ao rolar), com pausa por botão, fora da tela
   e em movimento reduzido. Sem JS de movimento, a animação CSS assume. */
(() => {
  'use strict';
  const bands = [...document.querySelectorAll('.flow-band')];
  if (!bands.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  bands.forEach(band => {
    const button = band.querySelector('.flow-band-toggle');
    if (!button) return;
    button.addEventListener('click', () => {
      const paused = band.classList.toggle('band-paused');
      button.setAttribute('aria-pressed', String(paused));
      button.setAttribute('aria-label', paused ? 'Retomar movimento da faixa' : 'Pausar movimento da faixa');
      /* As faixas cruzadas compartilham um único controle. */
      if (band.classList.contains('band-cross-a')) band.parentElement?.querySelector('.band-cross-b')?.classList.toggle('band-paused', paused);
    });
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('band-in-view', entry.isIntersecting));
    }, { rootMargin: '120px' });
    bands.forEach(band => observer.observe(band));
  } else bands.forEach(band => band.classList.add('band-in-view'));

  /* Motor próprio (rAF) para reagir à velocidade do scroll. */
  const state = bands.map(band => ({
    band,
    track: band.querySelector('.flow-band-track'),
    group: band.querySelector('.flow-band-group'),
    dir: band.classList.contains('flow-band-dark') ? -1 : 1,
    base: band.classList.contains('flow-band-light') ? 52 : 60,
    pos: 0, boost: 0, skew: 0
  }));
  let lastY = scrollY, lastT = performance.now(), velocity = 0, running = false;

  function frame(now) {
    const dt = Math.min(64, now - lastT) / 1000 || .016;
    lastT = now;
    const y = scrollY;
    const v = (y - lastY) / dt; // px/s
    lastY = y;
    velocity += (v - velocity) * .18;
    state.forEach(s => {
      const half = s.group ? s.group.offsetWidth : 0;
      if (!half) return;
      const active = s.band.classList.contains('band-in-view') && !s.band.classList.contains('band-paused') && !document.body.classList.contains('paused') && !document.hidden;
      const targetBoost = Math.max(-520, Math.min(520, velocity * .22));
      s.boost += (targetBoost - s.boost) * .08;
      const targetSkew = Math.max(-7, Math.min(7, velocity / 220));
      s.skew += (targetSkew - s.skew) * .1;
      if (active) {
        const speed = (s.base + s.boost) * s.dir;
        s.pos = (((s.pos + speed * dt) % half) + half) % half;
      }
      s.track.style.transform = `translate3d(${(-s.pos).toFixed(2)}px,0,0) skewX(${(-s.skew).toFixed(2)}deg)`;
    });
    if (running) requestAnimationFrame(frame);
  }

  function start() {
    if (reduced.matches) { stop(); return; }
    document.documentElement.classList.add('band-js');
    if (!running) { running = true; lastT = performance.now(); lastY = scrollY; requestAnimationFrame(frame); }
  }
  function stop() {
    running = false;
    document.documentElement.classList.remove('band-js');
    state.forEach(s => { s.track.style.transform = ''; });
  }
  start();
  reduced.addEventListener('change', () => (reduced.matches ? stop() : start()));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && running) { lastT = performance.now(); } });
})();

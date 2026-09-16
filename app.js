(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  function updateMotion() {
    document.body.classList.toggle('paused', paused);
    document.dispatchEvent(new CustomEvent('swipe:motion', { detail: { paused } }));
  }
  updateMotion();
  reduced.addEventListener('change', e => { paused = e.matches; updateMotion(); });
  if ('IntersectionObserver' in window && !reduced.matches) {
    document.body.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }
  const progress = document.querySelector('.scroll-progress');
  let scheduled = false;
  const renderProgress = () => {
    const available = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${available > 0 ? scrollY / available * 100 : 0}%`;
    scheduled = false;
  };
  addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(renderProgress); } }, { passive: true });
  addEventListener('resize', renderProgress);
  renderProgress();
  const cursor = document.querySelector('.cursor');
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced.matches) {
    addEventListener('pointermove', e => {
      cursor.style.left = `${e.clientX}px`; cursor.style.top = `${e.clientY}px`;
      cursor.classList.add('shown');
      cursor.classList.toggle('active', Boolean(e.target.closest('a,button,summary,.swipe-card')));
    }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.remove('shown'));
  }
  document.querySelectorAll('.faq details').forEach(item => item.addEventListener('toggle', () => {
    if (item.open) document.querySelectorAll('.faq details').forEach(other => { if (other !== item) other.open = false; });
  }));
  document.querySelector('.preloader').addEventListener('animationend', e => { if (e.animationName === 'loaderOut') e.currentTarget.remove(); });
})();
// Small, independent movements give each reference its own rhythm.
(() => {
  document.querySelectorAll('.swipe-card').forEach((card, index) => card.style.setProperty('--card-index', index));
  document.querySelectorAll('.video-timeline i').forEach((bar, index) => {
    bar.style.setProperty('--bar-index', index);
    bar.style.setProperty('--bar-height', `${12 + ((index * 13 + 7) % 27)}px`);
  });
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.tilt-surface').forEach(surface => {
    let queued = false;
    let latestX = 0;
    let latestY = 0;
    const reset = () => { surface.style.setProperty('--tilt-x', '0deg'); surface.style.setProperty('--tilt-y', '0deg'); };
    surface.addEventListener('pointermove', event => {
      if (!finePointer.matches || reducedMotion.matches || document.body.classList.contains('paused')) return;
      const bounds = surface.getBoundingClientRect();
      latestX = (event.clientX - bounds.left) / bounds.width - .5;
      latestY = (event.clientY - bounds.top) / bounds.height - .5;
      if (!queued) {
        queued = true;
        requestAnimationFrame(() => {
          surface.style.setProperty('--tilt-x', `${-latestY * 7}deg`);
          surface.style.setProperty('--tilt-y', `${latestX * 9}deg`);
          queued = false;
        });
      }
    }, { passive: true });
    surface.addEventListener('pointerleave', reset);
    surface.addEventListener('focusout', reset);
    reducedMotion.addEventListener('change', reset);
  });
})();

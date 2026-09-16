(() => {
  const bands = [...document.querySelectorAll('.flow-band')];
  bands.forEach(band => {
    const button = band.querySelector('.flow-band-toggle');
    button.addEventListener('click', () => {
      const paused = band.classList.toggle('band-paused');
      button.setAttribute('aria-pressed', String(paused));
      button.setAttribute('aria-label', paused ? 'Retomar movimento da faixa' : 'Pausar movimento da faixa');
    });
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('band-in-view', entry.isIntersecting));
    }, { rootMargin: '80px' });
    bands.forEach(band => observer.observe(band));
  }
})();

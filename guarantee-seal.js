(() => {
  const section = document.querySelector('.guarantee-medallion');
  if (!section || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    section.classList.toggle('seal-in-view', entries[0].isIntersecting);
  }, { threshold: .1 });
  observer.observe(section);
})();

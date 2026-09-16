(() => {
  'use strict';
  const menu = document.querySelector('.flow-menu');
  if (!menu) return;
  const links = [...menu.querySelectorAll('a')];
  if (!links.length) return;
  const highlight = document.createElement('span');
  highlight.className = 'menu-highlight';
  highlight.setAttribute('aria-hidden', 'true');
  menu.appendChild(highlight);
  let active = links.find(link => link.hash === location.hash) || links[0];
  let hovered = null;
  let frame;
  const focused = () => links.includes(document.activeElement) ? document.activeElement : null;
  function move(link) {
    if (!link) return;
    const item = link.getBoundingClientRect();
    const wrapper = menu.getBoundingClientRect();
    if (!item.width || !wrapper.width) return;
    highlight.style.width = `${item.width}px`;
    highlight.style.height = `${item.height}px`;
    highlight.style.transform = `translate3d(${item.left - wrapper.left - menu.clientLeft}px,${item.top - wrapper.top - menu.clientTop}px,0)`;
    highlight.classList.add('is-visible');
  }
  function select(link) {
    active = link;
    links.forEach(item => {
      item.classList.toggle('is-current', item === active);
      if (item === active) item.setAttribute('aria-current', 'location');
      else item.removeAttribute('aria-current');
    });
    move(hovered || focused() || active);
  }
  function refresh() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => move(hovered || focused() || active));
  }
  links.forEach(link => {
    link.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch') return;
      hovered = link;
      move(link);
    });
    link.addEventListener('focus', () => move(link));
    link.addEventListener('click', () => { hovered = null; select(link); });
  });
  menu.addEventListener('pointerleave', () => { hovered = null; move(focused() || active); });
  menu.addEventListener('pointercancel', () => { hovered = null; move(focused() || active); });
  menu.addEventListener('focusout', refresh);
  addEventListener('hashchange', () => {
    const match = links.find(link => link.hash === location.hash);
    if (match) select(match);
  });
  addEventListener('resize', refresh, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(refresh).observe(menu);
  document.fonts?.ready.then(refresh);
  select(active);
})();

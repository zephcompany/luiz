(() => {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger || !window.SplitText) return;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const headings = [...document.querySelectorAll('[data-title-reveal]')];
  const completed = new WeakSet();
  let splits = [];
  let animations = new Map();
  let refreshFrame;

  function clear() {
    cancelAnimationFrame(refreshFrame);
    animations.forEach(animation => {
      animation.scrollTrigger?.kill();
      animation.revert();
    });
    animations.clear();
    splits.forEach(split => split.revert());
    splits = [];
  }

  function build() {
    clear();
    if (reduced.matches || document.body.classList.contains('paused')) return;
    headings.forEach(heading => {
      const split = SplitText.create(heading, {
        type: 'lines', autoSplit: true, aria: 'auto', linesClass: 'title-reveal-line',
        onSplit(self) {
          const previous = animations.get(heading);
          previous?.scrollTrigger?.kill();
          previous?.kill();
          // Finished headings stay readable after responsive reflow.
          if (completed.has(heading)) return;
          const centered = getComputedStyle(heading).textAlign === 'center';
          const bars = self.lines.map(line => {
            gsap.set(line, {
              position: 'relative', display: 'block', width: 'fit-content',
              maxWidth: '100%', marginLeft: centered ? 'auto' : 0,
              marginRight: centered ? 'auto' : 0, clipPath: 'inset(0% 100% 0% 0%)'
            });
            // A dedicated span avoids selecting existing emphasized text.
            const bar = document.createElement('span');
            bar.className = 'title-reveal-bar';
            bar.setAttribute('aria-hidden', 'true');
            line.appendChild(bar);
            return bar;
          });
          const timeline = gsap.timeline({
            scrollTrigger: { trigger: heading, start: 'top 80%', once: true, toggleActions: 'play none none none' },
            onComplete: () => {
              completed.add(heading);
              gsap.set(self.lines, { clipPath: 'none' });
              bars.forEach(bar => { bar.hidden = true; });
            }
          });
          timeline.to(self.lines, { clipPath: 'inset(0% 0% 0% 0%)', duration: .4, stagger: .09, ease: 'power3.out' }, 0);
          timeline.to(bars, { scaleX: 0, transformOrigin: 'right center', duration: .4, stagger: .09, ease: 'power3.out' }, .25);
          animations.set(heading, timeline);
          cancelAnimationFrame(refreshFrame);
          refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
          return timeline;
        }
      });
      splits.push(split);
    });
  }
  const ready = document.fonts?.ready || Promise.resolve();
  ready.then(() => {
    build();
    document.addEventListener('swipe:motion', build);
    reduced.addEventListener('change', build);
  });
})();

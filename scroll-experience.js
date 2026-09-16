(() => {
  'use strict';
  const hero = document.querySelector('.hero-arc');
  const gallery = document.querySelector('.arc-gallery');
  const cards = [...document.querySelectorAll('.arc-card')];
  const story = document.querySelector('.story-section');
  const pin = document.querySelector('.story-pin');
  const panels = [...document.querySelectorAll('.story-panel')];
  const tabs = [...document.querySelectorAll('.story-tab')];
  const meter = document.querySelector('.story-meter>span');
  const plans = document.querySelector('.plans');
  const priceCards = [...document.querySelectorAll('.plan')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let hoveredCard = null;
  let lenis = null;
  let context = null;
  let media = null;
  let storyTimeline = null;
  let heroObserver = null;
  let frameHandler = null;
  let activeStep = 0;
  let arcIdle = 0;
  let arcVisible = true;
  const arcMotion = { phase: 0 };
  const hasGSAP = Boolean(window.gsap && window.ScrollTrigger);

  function drawArc() {
    const width = gallery.clientWidth;
    const mobile = width < 761;
    const mid = (cards.length - 1) / 2;
    cards.forEach((card, index) => {
      // A concave gallery: middle covers are distant; the sides approach the viewer.
      let position = index - mid + arcIdle + arcMotion.phase;
      position = ((position + cards.length / 2) % cards.length + cards.length) % cards.length - cards.length / 2;
      const step = mobile ? .185 : .108;
      const cubic = mobile ? .0035 : .002;
      const x = (step * position + cubic * position ** 3) * width;
      const scale = 1 + (mobile ? .092 : .075) * position ** 2;
      card.style.setProperty('--arc-x', `${x.toFixed(2)}px`);
      card.style.setProperty('--arc-angle', `${(-position * (mobile ? 13 : 11)).toFixed(2)}deg`);
      card.style.setProperty('--arc-scale', scale.toFixed(4));
      card.style.setProperty('--arc-y', '0px');
      card.style.zIndex = card === hoveredCard ? '1000' : String(Math.round(Math.abs(position) * 100));
      card.style.visibility = Math.abs(x) < width * 1.1 ? 'visible' : 'hidden';
    });
  }

  // Keep the orbit on the outer card and the hover on its inner cover.
  // Freeze idle drift while inspecting a card so it stays under the pointer.
  function releaseCard() {
    if (!hoveredCard) return;
    hoveredCard.classList.remove('is-hovered');
    hoveredCard.style.removeProperty('--hover-x');
    hoveredCard.style.removeProperty('--hover-rotate');
    hoveredCard = null;
    drawArc();
  }
  cards.forEach(card => {
    card.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch' || !finePointer.matches || reduced.matches || document.body.classList.contains('paused')) return;
      releaseCard();
      hoveredCard = card;
      card.classList.add('is-hovered');
      drawArc();
    });
    card.addEventListener('pointermove', event => {
      if (hoveredCard !== card) return;
      const bounds = card.getBoundingClientRect();
      const x = Math.max(-.5, Math.min(.5, (event.clientX - bounds.left) / Math.max(bounds.width, 1) - .5));
      card.style.setProperty('--hover-x', `${(x * 10).toFixed(2)}px`);
      card.style.setProperty('--hover-rotate', `${(x * 3).toFixed(2)}deg`);
    }, { passive: true });
    card.addEventListener('pointerleave', () => { if (hoveredCard === card) releaseCard(); });
    card.addEventListener('pointercancel', () => { if (hoveredCard === card) releaseCard(); });
  });
  finePointer.addEventListener('change', releaseCard);
  reduced.addEventListener('change', releaseCard);
  addEventListener('blur', releaseCard);

  function setStep(step) {
    activeStep = step;
    tabs.forEach((tab, index) => {
      tab.classList.toggle('active', index === step);
      if (index === step) tab.setAttribute('aria-current', 'step');
      else tab.removeAttribute('aria-current');
    });
    if (story.classList.contains('story-pinned')) {
      panels.forEach((panel, index) => {
        panel.inert = index !== step;
        panel.setAttribute('aria-hidden', String(index !== step));
      });
    }
  }

  function restorePanels() {
    story.classList.remove('story-pinned');
    panels.forEach(panel => { panel.inert = false; panel.removeAttribute('aria-hidden'); });
    meter.style.width = '33.3333%';
    storyTimeline = null;
  }

  function goTo(target) {
    if (lenis) lenis.scrollTo(target, { duration: 1.1 });
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: reduced.matches ? 'instant' : 'smooth' });
    else target.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
  }

  tabs.forEach((tab, index) => tab.addEventListener('click', () => {
    if (storyTimeline?.scrollTrigger) {
      const trigger = storyTimeline.scrollTrigger;
      const progress = storyTimeline.labels[`chapter-${index}`] / storyTimeline.duration();
      goTo(trigger.start + (trigger.end - trigger.start) * progress + 1);
    } else {
      setStep(index);
      goTo(panels[index]);
    }
  }));

  function refresh() {
    drawArc();
    lenis?.resize();
    if (hasGSAP) { ScrollTrigger.sort(); ScrollTrigger.refresh(); }
  }

  function destroyMotion() {
    releaseCard();
    heroObserver?.disconnect();
    heroObserver = null;
    if (frameHandler && hasGSAP) gsap.ticker.remove(frameHandler);
    frameHandler = null;
    media?.revert();
    media = null;
    plans.classList.remove('pricing-cards-motion');
    priceCards.forEach(card => card.classList.remove('price-aligned'));
    context?.revert();
    context = null;
    lenis?.destroy();
    lenis = null;
    restorePanels();
    document.documentElement.classList.remove('motion-enhanced');
    arcIdle = 0;
    arcMotion.phase = 0;
    drawArc();
  }

  function startMotion() {
    destroyMotion();
    if (!hasGSAP || reduced.matches || document.body.classList.contains('paused')) return;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('motion-enhanced');
    document.body.classList.add('scroll-ready');
    if (window.Lenis) {
      lenis = new Lenis({
        duration: 1.05,
        smoothWheel: true,
        syncTouch: false,
        autoRaf: false,
        anchors: true,
        prevent: node => node.id === 'platform-dialog',
        stopInertiaOnNavigate: true
      });
      lenis.on('scroll', ScrollTrigger.update);
    }
    gsap.ticker.lagSmoothing(0);
    frameHandler = (time, deltaTime) => {
      lenis?.raf(time * 1000);
      if (arcVisible && !document.hidden) {
        if (!hoveredCard) arcIdle += Math.min(deltaTime || 16.67, 64) * .000035;
        drawArc();
      }
    };
    gsap.ticker.add(frameHandler);
    heroObserver = new IntersectionObserver(entries => { arcVisible = entries[0].isIntersecting; }, { rootMargin: '100px' });
    heroObserver.observe(hero);

    context = gsap.context(() => {
      gsap.to(arcMotion, {
        phase: 1.55, ease: 'none',
        onUpdate: drawArc,
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .7 }
      });
      gsap.to('.hero-intro', {
        y: -40, opacity: .2, ease: 'none',
        scrollTrigger: { trigger: hero, start: '35% top', end: 'bottom top', scrub: .8 }
      });
      // Start these reveals only when their actual location enters the viewport.
      document.querySelectorAll('.reveal').forEach(element => {
        gsap.fromTo(element, { y: 16, opacity: 0 }, {
          y: 0, opacity: 1, duration: .6, ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 91%', toggleActions: 'play none none none', once: true }
        });
      });
      gsap.fromTo('.platform-shot', { rotateX: 9, scale: .94 }, {
        rotateX: 0, scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.platform', start: 'top 85%', end: 'center center', scrub: 1 }
      });

    });

    media = gsap.matchMedia();
    // Continuous interpolation avoids abrupt class changes while scrolling.
    media.add('(min-width: 900px)', () => {
      plans.classList.add('pricing-cards-motion');
      const entrance = gsap.timeline({ scrollTrigger: {
        id: 'pricing-entry', trigger: plans, start: 'top 92%', end: 'top 42%',
        scrub: .55, invalidateOnRefresh: true
      }});
      priceCards.forEach((card, index) => {
        entrance.fromTo(card, {
          x: (index - 1) * 18, y: index === 1 ? 26 : 18,
          rotationX: 5, rotationY: (1 - index) * 8, rotationZ: (index - 1) * 1.5
        }, {
          x: 0, y: 0, rotationX: 0, rotationY: 0, rotationZ: 0,
          duration: 1, ease: 'power1.out'
        }, index * .1);
      });
      return () => plans.classList.remove('pricing-cards-motion');
    });
    media.add('(min-width: 900px) and (min-height: 780px)', () => {
      story.classList.add('story-pinned');
      gsap.set(panels, { autoAlpha: 0, y: 65 });
      gsap.set(panels[0], { autoAlpha: 1, y: 0 });
      setStep(0);
      const timeline = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: () => `+=${Math.round(innerHeight * 2.7)}`,
          pin: true,
          pinSpacing: true,
          refreshPriority: 1,
          scrub: .7,
          anticipatePin: 1,
          invalidateOnRefresh: true
        },
        onUpdate() {
          const time = this.time();
          const next = time < 1.12 ? 0 : time < 2.22 ? 1 : 2;
          if (next !== activeStep) setStep(next);
          meter.style.width = `${(1 / 3 + this.progress() * 2 / 3) * 100}%`;
        }
      });
      timeline.addLabel('chapter-0', 0);
      timeline.to(panels[0], { autoAlpha: 0, y: -45, duration: .5 }, .8);
      timeline.fromTo(panels[1], { autoAlpha: 0, y: 65 }, { autoAlpha: 1, y: 0, duration: .7, immediateRender: false }, 1);
      timeline.addLabel('chapter-1', 1.72);
      timeline.to(panels[1], { autoAlpha: 0, y: -45, duration: .5 }, 1.9);
      timeline.fromTo(panels[2], { autoAlpha: 0, y: 65 }, { autoAlpha: 1, y: 0, duration: .7, immediateRender: false }, 2.1);
      timeline.addLabel('chapter-2', 2.82);
      timeline.to({}, { duration: .65 }, 2.8);
      storyTimeline = timeline;
      return () => restorePanels();
    });
    refresh();
  }

  // Native scroll stays available when effects are paused, on reduced motion,
  // and if an animation library cannot load. Small screens keep all topics in flow.
  drawArc();
  startMotion();
  document.addEventListener('swipe:motion', startMotion);
  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refresh, 180);
  }, { passive: true });
  document.fonts?.ready.then(refresh);
  addEventListener('load', refresh, { once: true });
  document.querySelectorAll('.faq details').forEach(detail => detail.addEventListener('toggle', () => requestAnimationFrame(refresh)));
  // Let keyboard focus reveal offscreen controls inside the pinned story.
  document.addEventListener('focusin', event => {
    if (event.target instanceof HTMLElement && event.target.closest('dialog')) return;
    if (lenis && event.target.matches('a,button,summary,input,select,textarea')) {
      const bounds = event.target.getBoundingClientRect();
      if (bounds.bottom > innerHeight || bounds.top < 0) lenis.scrollTo(event.target, { immediate: true, offset: -80 });
    }
  });
})();

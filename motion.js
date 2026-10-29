/* Coreografia de scroll: preloader + entrada da hero, títulos divididos em
   linhas/palavras, reveals, mural horizontal, cards empilhados e wordmark.
   Depende de GSAP + ScrollTrigger + SplitText (vendor/). Sem eles, ou com
   movimento reduzido, tudo fica visível e a página rola normalmente. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hasGSAP = Boolean(window.gsap && window.ScrollTrigger);
  const hasSplit = Boolean(window.SplitText);
  const q = (s, c = document) => c.querySelector(s);
  const qa = (s, c = document) => [...c.querySelectorAll(s)];

  function showEverything() {
    root.classList.remove('motion-ok');
    qa('[data-split]').forEach(el => el.classList.add('is-split'));
    qa('[data-reveal],[data-reveal-group]>*').forEach(el => { el.style.opacity = ''; el.style.transform = ''; });
    const pre = q('.preloader');
    if (pre) pre.remove();
  }

  if (!hasGSAP) { showEverything(); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (hasSplit) gsap.registerPlugin(SplitText);

  let ctx = null;
  let media = null;
  let splits = [];
  let introDone = false;
  const heroIntro = q('.hero-intro');

  const isPaused = () => reduced.matches || document.body.classList.contains('paused');

  /* ---------- seleção animada nos destaques (cursor clica, arrasta e seleciona) ---------- */
  const selTimelines = new Map();
  function armSel(sel, deferred = false, pieces = [sel]) {
    const old = selTimelines.get(sel);
    if (old) { old.scrollTrigger?.kill(); old.kill(); selTimelines.delete(sel); }
    sel.querySelectorAll('.sel-ui').forEach(n => n.remove());
    pieces.forEach(p => { if (p !== sel) selTimelines.get(p)?.kill(); });
    const ui = document.createElement('span');
    ui.className = 'sel-ui';
    ui.setAttribute('aria-hidden', 'true');
    ui.innerHTML = '<span class="sel-box"></span><span class="sel-handles"></span><span class="sel-tag">Headline</span><span class="sel-cursor"><svg class="ico"><use href="#i-pointer"/></svg></span>';
    sel.appendChild(ui);
    const box = ui.querySelector('.sel-box');
    const handles = ui.querySelector('.sel-handles');
    const tag = ui.querySelector('.sel-tag');
    const cursor = ui.querySelector('.sel-cursor');
    const pad = 4;
    /* Caixa que envolve todas as partes (um <em> pode ter sido fatiado em duas linhas). */
    const measure = () => {
      const base = sel.getBoundingClientRect();
      let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
      pieces.forEach(p => { const k = p.getBoundingClientRect(); l = Math.min(l, k.left); t = Math.min(t, k.top); r = Math.max(r, k.right); b = Math.max(b, k.bottom); });
      return { x: l - base.left - pad, y: t - base.top - pad, w: r - l + pad * 2, h: b - t + pad * 2 };
    };
    const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 3.2, defaults: { ease: 'power2.inOut' } });
    tl.add(() => {
      const { x, y, w, h } = measure();
      tag.textContent = `${Math.round(w - pad * 2)} × ${Math.round(h - pad * 2)}`;
      gsap.set(box, { left: x, top: y, width: 0, height: 0, opacity: 0 });
      gsap.set(handles, { left: x - 5, top: y - 5, width: w + 10, height: h + 10, opacity: 0, scale: .6, transformOrigin: '50% 50%' });
      gsap.set(tag, { left: x + w / 2, top: y + h + 8, xPercent: -50, opacity: 0, y: -6 });
      gsap.set(cursor, { x: x + w * .78, y: y + h + 34, opacity: 0, scale: 1 });
    });
    tl.to(cursor, { opacity: 1, duration: .25 }, .05)
      .to(cursor, { x: () => measure().x - 2, y: () => measure().y - 2, duration: .75 }, .1)
      .to(cursor, { scale: .82, duration: .12 })
      .set(box, { opacity: 1 })
      .addLabel('drag')
      .to(cursor, { x: () => { const m = measure(); return m.x + m.w + 2; }, y: () => { const m = measure(); return m.y + m.h + 2; }, duration: 1.05 }, 'drag')
      .to(box, { width: () => measure().w, height: () => measure().h, duration: 1.05 }, 'drag')
      .to(cursor, { scale: 1, duration: .15 })
      .to(handles, { opacity: 1, scale: 1, duration: .3, ease: 'back.out(2)' }, '-=.05')
      .to(tag, { opacity: 1, y: 0, duration: .3 }, '<')
      .to(cursor, { x: '+=70', y: '+=46', opacity: 0, duration: .55, ease: 'power2.in' }, '+=.7')
      .to({}, { duration: 1.6 })
      .to([box, handles, tag], { opacity: 0, duration: .5, ease: 'power2.out' });
    tl.scrollTrigger = ScrollTrigger.create({
      trigger: sel, start: 'top 92%', end: 'bottom 6%',
      onEnter: () => { if (!deferred || introDone) tl.play(); },
      onEnterBack: () => { if (!deferred || introDone) tl.play(); },
      onLeave: () => tl.pause(), onLeaveBack: () => tl.pause()
    });
    selTimelines.set(sel, tl);
    return tl;
  }
  function disarmSel() {
    selTimelines.forEach(tl => { tl.scrollTrigger?.kill(); tl.kill(); });
    selTimelines.clear();
    qa('.sel-ui').forEach(n => n.remove());
  }

  /* ---------- títulos: máscara por linha ou palavra ---------- */
  function splitHeading(el) {
    const mode = el.dataset.split === 'words' ? 'words' : 'lines';
    const inHero = heroIntro && heroIntro.contains(el);
    const hadSel = Boolean(el.querySelector('em.sel'));
    const split = SplitText.create(el, {
      type: mode === 'words' ? 'words' : 'lines',
      mask: mode,
      autoSplit: true,
      /* Mantém os &nbsp; que evitam viúvas: só o espaço comum separa palavras. */
      reduceWhiteSpace: false,
      prepareText: text => text.replace(/[ \t\n\r]+/g, ' '),
      aria: 'auto',
      linesClass: 'split-line',
      wordsClass: 'split-word',
      onSplit(self) {
        el.classList.add('is-split');
        /* O SplitText recria o <em>; devolve a seleção animada a ele. */
        if (hadSel) { const ems = [...el.querySelectorAll('em')]; ems.forEach(e => e.classList.add('sel')); if (ems.length) armSel(ems[0], inHero, ems); }
        const targets = mode === 'words' ? self.words : self.lines;
        const vars = {
          yPercent: 115, duration: mode === 'words' ? 1.1 : 1.05, ease: 'power4.out',
          stagger: mode === 'words' ? .05 : .1
        };
        if (inHero) {
          const tween = gsap.from(targets, { ...vars, paused: !introDone });
          el._heroTween = tween;
          return tween;
        }
        return gsap.from(targets, { ...vars, scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
      }
    });
    splits.push(split);
  }

  /* ---------- reveals simples ---------- */
  function buildReveals() {
    qa('[data-reveal]').forEach(el => {
      if (heroIntro && heroIntro.contains(el)) return;
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: parseFloat(el.dataset.delay) || 0,
        clearProps: 'all', onComplete: () => el.classList.add('is-in'),
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });
    qa('[data-reveal-group]').forEach(group => {
      gsap.to([...group.children], {
        opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .07, clearProps: 'all',
        onComplete: () => group.classList.add('is-in'),
        scrollTrigger: { trigger: group, start: 'top 88%', once: true }
      });
    });
  }

  /* ---------- entrada: preloader → hero ---------- */
  function playIntro() {
    const pre = q('.preloader');
    const heroReveals = heroIntro ? qa('[data-reveal]', heroIntro) : [];
    const h1 = q('.hero h1');
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: () => { introDone = true; } });
    if (pre) {
      tl.to(pre.querySelector('.preloader-line i'), { scaleX: 1, duration: .75, ease: 'power2.inOut' })
        .to(pre, { yPercent: -100, duration: .85, ease: 'power4.inOut' }, '+=.1')
        .set(pre, { display: 'none' });
    }
    const t0 = pre ? '-=.5' : 0;
    if (h1 && h1._heroTween) tl.add(() => { h1._heroTween.play(); }, t0);
    else if (h1) tl.from(h1, { opacity: 0, y: 30, duration: 1 }, t0);
    tl.to(heroReveals, { opacity: 1, y: 0, duration: 1, stagger: .09, clearProps: 'all', onComplete: () => heroReveals.forEach(el => el.classList.add('is-in')) }, pre ? '-=.3' : '+=.2');
    tl.from(qa('.arc-cover'), { yPercent: 40, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: { each: .045, from: 'center' }, clearProps: 'transform,opacity' }, '<-.2');
    tl.from(qa('.hero-chip'), { opacity: 0, duration: .8, stagger: .15 }, '-=.5');
    tl.add(() => { introDone = true; qa('.hero .sel').forEach(e => selTimelines.get(e)?.play()); }, '-=.6');
    return tl;
  }

  /* ---------- formatos: timeline fixada, blocos trocam com o scroll ---------- */
  let formatsTimeline = null;
  function buildFormats() {
    const section = q('.formats');
    const pin = q('.formats-pin');
    const cards = qa('.formats-stage .wall-card');
    const steps = qa('.formats-steps li');
    const line = q('.formats-line i');
    if (!section || !pin || cards.length < 2) return;
    section.classList.add('is-pinned');
    const n = cards.length;
    const setStep = i => {
      steps.forEach((li, k) => li.classList.toggle('is-active', k === i));
      cards.forEach((c, k) => c.setAttribute('aria-hidden', String(k !== i)));
    };
    gsap.set(cards, { autoAlpha: 0, y: 70, scale: .96 });
    gsap.set(cards[0], { autoAlpha: 1, y: 0, scale: 1 });
    setStep(0);
    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        id: 'formats', trigger: section, start: 'top top', end: () => `+=${Math.round(innerHeight * (n - 1) * .75)}`,
        pin: true, pinSpacing: true, scrub: .8, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 2,
        onUpdate(self) {
          const p = self.progress;
          const i = Math.min(n - 1, Math.round(p * (n - 1)));
          if (!steps[i].classList.contains('is-active')) setStep(i);
          if (line) line.style.height = `${p * 100}%`;
        }
      }
    });
    cards.forEach((card, i) => {
      tl.addLabel(`step-${i}`, i);
      if (i === n - 1) { tl.to({}, { duration: .5 }, i); return; }
      tl.to(card, { autoAlpha: 0, y: -60, scale: .97, duration: .45 }, i + .35);
      tl.to(cards[i + 1], { autoAlpha: 1, y: 0, scale: 1, duration: .6, immediateRender: false }, i + .5);
    });
    formatsTimeline = tl;
    return () => {
      section.classList.remove('is-pinned');
      cards.forEach(c => { c.removeAttribute('aria-hidden'); gsap.set(c, { clearProps: 'all' }); });
      steps.forEach((li, k) => li.classList.toggle('is-active', k === 0));
      formatsTimeline = null;
    };
  }
  qa('.formats-steps button').forEach(btn => btn.addEventListener('click', () => {
    const i = parseInt(btn.dataset.goto, 10) || 0;
    const tl = formatsTimeline;
    if (tl?.scrollTrigger) {
      const st = tl.scrollTrigger;
      const target = st.start + (st.end - st.start) * (i / (tl.duration() || 1)) + 2;
      if (window.__lenis) window.__lenis.scrollTo(target, { duration: 1 });
      else scrollTo({ top: target, behavior: 'smooth' });
    } else {
      const card = qa('.formats-stage .wall-card')[i];
      card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }));

  /* ---------- títulos que se preenchem com o scroll ---------- */
  function buildFills() {
    qa('[data-fill]').forEach(el => {
      if (!hasSplit) { el.classList.add('is-split'); return; }
      const hadSel = Boolean(el.querySelector('em.sel'));
      const split = SplitText.create(el, {
        type: 'words', wordsClass: 'fill-word', autoSplit: true, aria: 'auto', reduceWhiteSpace: false,
        prepareText: text => text.replace(/[ \t\n\r]+/g, ' '),
        onSplit(self) {
          el.classList.add('is-split');
          if (hadSel) { const ems = [...el.querySelectorAll('em')]; ems.forEach(e => e.classList.add('sel')); if (ems.length) armSel(ems[0], false, ems); }
          return gsap.fromTo(self.words, { opacity: .16 }, {
            opacity: 1, ease: 'none', stagger: .06,
            scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 28%', scrub: .6 }
          });
        }
      });
      splits.push(split);
    });
  }

  /* ---------- cards empilhados ---------- */
  function buildStack() {
    const cards = qa('.advantage-card');
    cards.forEach((card, i) => {
      card.style.setProperty('--i', i);
      const next = cards[i + 1];
      if (!next) return;
      gsap.to(card, {
        scale: 1 - (cards.length - 1 - i) * .035, ease: 'none',
        scrollTrigger: { trigger: next, start: 'top bottom', end: () => `top ${110 + (i + 1) * 26}px`, scrub: true }
      });
    });
    cards.forEach((card, i) => gsap.from(card, {
      opacity: 0, y: 50, duration: .9, ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 92%', once: true }
    }));
  }

  /* ---------- wordmark e paralaxes leves ---------- */
  function buildParallax() {
    const mark = q('[data-wordmark]');
    if (mark) gsap.fromTo(mark, { xPercent: 4 }, { xPercent: -14, ease: 'none', scrollTrigger: { trigger: '.final-cta', start: 'top bottom', end: 'bottom top', scrub: 1 } });
    const grid = q('.hero-grid');
    if (grid) gsap.to(grid, { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero-arc', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- ciclo de vida ---------- */
  function destroy() {
    disarmSel();
    media?.revert(); media = null;
    ctx?.revert(); ctx = null;
    splits.forEach(s => s.revert()); splits = [];
    qa('.advantage-card').forEach(c => c.style.removeProperty('--i'));
  }

  function build() {
    destroy();
    if (isPaused()) { showEverything(); return; }
    root.classList.add('motion-ok');
    ctx = gsap.context(() => {
      if (hasSplit) qa('[data-split]').forEach(splitHeading);
      else qa('[data-split]').forEach(el => { el.classList.add('is-split'); gsap.from(el, { opacity: 0, y: 30, duration: 1, scrollTrigger: { trigger: el, start: 'top 86%', once: true } }); });
      buildReveals();
      buildFills();
      qa('.sel').forEach(sel => { if (!selTimelines.has(sel)) armSel(sel, heroIntro && heroIntro.contains(sel)); });
      buildParallax();
      media = gsap.matchMedia();
      media.add('(min-width: 1000px)', () => { const undoFormats = buildFormats(); buildStack(); return () => { undoFormats?.(); }; });
    });
    ScrollTrigger.refresh();
  }

  const ready = Promise.all([document.fonts?.ready || Promise.resolve(), new Promise(r => addEventListener('load', r, { once: true }))]);
  const timeout = new Promise(r => setTimeout(r, 1800));
  Promise.race([ready, timeout]).then(() => {
    build();
    if (isPaused()) return;
    playIntro();
    /* Garante o ScrollTrigger alinhado após imagens carregarem. */
    setTimeout(() => ScrollTrigger.refresh(), 1200);
  });

  document.addEventListener('swipe:motion', () => {
    if (isPaused()) { destroy(); showEverything(); }
    else if (introDone || !q('.preloader')) build();
  });
  let resizeTimer;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200); }, { passive: true });
})();

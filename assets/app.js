(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

  /* ---------- Smooth scroll (Lenis) + ScrollTrigger sync ---------- */
  let lenis = null;
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (!reduced && typeof Lenis !== 'undefined') {
      lenis = new Lenis({ duration: 1.1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* Anchor links */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = $(id);
      if (!t) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(t, { offset: id === '#protocolo' ? 0 : -40, duration: 1.4 });
      else t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Header + mobile menu ---------- */
  const hdr = $('#hdr'), burger = $('#burger');
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    hdr.classList.toggle('solid', y > 40);
    if (!document.body.classList.contains('menu-open')) {
      hdr.classList.toggle('hide', y > 240 && y > lastY + 4);
      if (y < lastY - 4) hdr.classList.remove('hide');
    }
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    if (!document.body.classList.contains('menu-open')) return;
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    lenis && lenis.start();
  }
  burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    if (lenis) open ? lenis.stop() : lenis.start();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Mobile CTA bar ---------- */
  const mbar = $('#mbar');
  if ('IntersectionObserver' in window) {
    const state = { hero: true, end: false };
    const upd = () => mbar.classList.toggle('show', !state.hero && !state.end);
    new IntersectionObserver(([e]) => { state.hero = e.isIntersecting; upd(); }, { threshold: 0.15 }).observe($('#topo'));
    new IntersectionObserver(([e]) => { state.end = e.isIntersecting; upd(); }, { threshold: 0.2 }).observe($('#agendar'));
  }

  /* ---------- Video ---------- */
  const vid = $('#vid'), soundBtn = $('#sound'), arch = $('.arch');
  const setSoundUI = on => {
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.querySelector('span').textContent = on ? 'Silenciar' : 'Ouvir com som';
    soundBtn.querySelector('use').setAttribute('href', on ? '#i-mute' : '#i-sound');
    arch.dataset.cursorLabel = on ? 'MUDO' : 'SOM';
  };
  const toggleSound = () => {
    const turnOn = vid.muted;
    if (turnOn) { vid.currentTime = 0; vid.muted = false; vid.play().catch(() => { vid.muted = true; setSoundUI(false); }); }
    else vid.muted = true;
    setSoundUI(turnOn && !vid.muted);
  };
  soundBtn.addEventListener('click', e => { e.stopPropagation(); toggleSound(); });
  arch.addEventListener('click', toggleSound);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!reduced) vid.play().catch(() => {}); }
      else { vid.pause(); if (!vid.muted) { vid.muted = true; setSoundUI(false); } }
    }, { threshold: 0.35 }).observe(vid);
  }

  /* ---------- Custom cursor ---------- */
  const cur = $('#cur'), dot = $('#curDot'), curTxt = $('#curTxt');
  if (finePointer) {
    document.documentElement.classList.add('cursor-on');
    document.body.classList.add('cursor-on');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    const k = reduced ? 1 : 0.2;
    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
      const t = e.target.closest ? e.target : null;
      const spot = t && t.closest('[data-cursor]');
      const link = t && t.closest('a,button');
      cur.classList.remove('link', 'view');
      dot.classList.remove('hide');
      if (spot && spot.dataset.cursor === 'view') {
        cur.classList.add('view'); curTxt.textContent = spot.dataset.cursorLabel || 'VER'; dot.classList.add('hide');
      } else if (spot || link) cur.classList.add('link');
      cur.classList.toggle('dark', !!(t && t.closest('.proto,.final')));
    }, { passive: true });
    document.addEventListener('mouseleave', () => document.body.classList.remove('cursor-on'));
    document.addEventListener('mouseenter', () => document.body.classList.add('cursor-on'));
    const loop = () => {
      rx += (mx - rx) * k; ry += (my - ry) * k;
      cur.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      requestAnimationFrame(loop);
    };
    loop();

    /* Magnetic buttons */
    if (hasGsap && !reduced) {
      $$('[data-magnetic]').forEach(el => {
        const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
        const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
        el.addEventListener('mousemove', e => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
        });
        el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
      });
    }
  }

  /* ---------- Service hover preview ---------- */
  const pop = $('#svcPop');
  if (hasGsap && finePointer && !reduced) {
    const imgs = $$('img', pop);
    const px = gsap.quickTo(pop, 'x', { duration: 0.6, ease: 'power3.out' });
    const py = gsap.quickTo(pop, 'y', { duration: 0.6, ease: 'power3.out' });
    $$('.svc-row').forEach(row => {
      row.addEventListener('mouseenter', () => {
        const src = row.dataset.img;
        imgs.forEach(i => i.classList.toggle('on', i.dataset.k === src));
        gsap.to(pop, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' });
      });
      row.addEventListener('mouseleave', () => gsap.to(pop, { opacity: 0, scale: 0.7, duration: 0.4, ease: 'power3.in' }));
      row.addEventListener('mousemove', e => { px(e.clientX + 60); py(e.clientY - 160); });
    });
    gsap.set(pop, { x: -400, y: -400 });
  }

  if (!hasGsap) return;

  /* ---------- Hero intro ---------- */
  const splitWords = el => {
    const walk = node => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const s = document.createElement('span'); s.textContent = p; w.appendChild(s); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  };
  const h1 = $('#h1');
  const label = h1.textContent;
  h1.setAttribute('aria-label', label);
  splitWords(h1);
  $$('.w', h1).forEach(w => w.setAttribute('aria-hidden', 'true'));

  const intro = () => {
    if (reduced) return;
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to('.hero .eyebrow', { opacity: 1, duration: 0.9 }, 0.1)
      .to('.hero h1 .w>span', { y: 0, duration: 1.3, stagger: 0.07 }, 0.15)
      .to('.hero .lead', { opacity: 1, duration: 1 }, 0.75)
      .to('.hero .cta-row', { opacity: 1, duration: 1 }, 0.9)
      .fromTo('.hero-media', { opacity: 0, y: 60, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 1.5 }, 0.3)
      .to('.hero-facts', { opacity: 1, duration: 1 }, 1.1);
  };
  (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]) : Promise.resolve()).then(intro);

  if (reduced) return;

  /* ---------- Scroll-driven sections ---------- */
  const mm = gsap.matchMedia();

  mm.add('(min-width: 981px)', () => {
    /* Parallax layers */
    $$('[data-speed]').forEach(el => {
      const sp = parseFloat(el.dataset.speed);
      const free = el.classList.contains('hero-ghost') || el.classList.contains('chip') || el.classList.contains('tooth');
      const trigger = free ? el.closest('section') : el.parentElement;
      if (free) {
        const amp = () => sp * innerHeight;
        gsap.fromTo(el, { y: () => -amp() }, { y: () => amp(), ease: 'none',
          scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true } });
      } else {
        gsap.set(el, { yPercent: -7.6 });
        const amp = () => Math.sign(sp) * trigger.offsetHeight * 0.07;
        gsap.fromTo(el, { y: () => -amp() }, { y: () => amp(), ease: 'none',
          scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true } });
      }
    });

    /* Protocolo: pinned story */
    const steps = $$('#steps .step'), prog = $('#prog');
    let active = 0;
    const setStep = i => {
      if (i === active) return;
      active = i;
      steps.forEach((s, n) => s.classList.toggle('on', n === i));
    };
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '#protoStage', start: 'top top', end: '+=260%', pin: true, scrub: 0.5, anticipatePin: 1,
        onUpdate: self => {
          setStep(Math.min(steps.length - 1, Math.floor(self.progress * steps.length)));
          prog.style.transform = `scaleX(${self.progress})`;
        }
      }
    });
    tl.fromTo('#protoFrame', { clipPath: 'inset(22% 16% 22% 16% round 140px)' }, { clipPath: 'inset(0% 0% 0% 0% round 22px)', duration: 0.35 }, 0)
      .fromTo('#protoImg', { scale: 1.3 }, { scale: 1, duration: 1 }, 0);
    gsap.set('.benefits li', { opacity: 0 });
    tl.to('.benefits li', { opacity: 1, stagger: 0.08, duration: 0.15 }, 0.75);
    return () => { steps.forEach((s, n) => s.classList.toggle('on', n === 0)); active = 0; prog.style.transform = ''; };
  });

  mm.add('(max-width: 980px)', () => {
    $$('.step').forEach(s => gsap.from(s, { opacity: 0, y: 30, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: s, start: 'top 88%', once: true } }));
    gsap.from('#protoFrame', { opacity: 0, y: 40, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '#protoFrame', start: 'top 88%', once: true } });
  });

  /* Reveals (all sizes) */
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%', once: true,
    onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12 })
  });

  /* Refresh once media has settled */
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();

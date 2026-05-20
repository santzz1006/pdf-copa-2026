/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 *  DRIVE COPA 2026 â€” pdf.js
 *  Engine: Vanilla JS ES6+ Â· Zero Dependencies Â· 60fps rAF Loop
 *  Arquitetura: IIFE Â· State centralizado Â· Physics Lerp
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */
(function () {
  'use strict';

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 0. DEVICE & FEATURE DETECTION
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const HAS_POINTER    = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IS_TOUCH       = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 1. MATH UTILS â€” Precision, suavidade, limites
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

  /** InterpolaÃ§Ã£o linear: move 'a' em direÃ§Ã£o a 'b' por fator 't' */
  const lerp  = (a, b, t) => a + (b - a) * t;

  /** Restringe 'val' ao intervalo [min, max] */
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  /** Re-mapeia 'val' de um intervalo para outro */
  const mapRange = (val, iMin, iMax, oMin, oMax) =>
    oMin + ((val - iMin) / (iMax - iMin)) * (oMax - oMin);

  /** DistÃ¢ncia euclidiana entre dois pontos 2D */
  const dist = (ax, ay, bx, by) =>
    Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);

  /** Sinal matemÃ¡tico robusto: -1, 0 ou 1 */
  const sign = (n) => (n > 0 ? 1 : n < 0 ? -1 : 0);

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 2. ESTADO GLOBAL CENTRALIZADO
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const S = {


    /** Dados de scroll com fÃ­sica */
    scroll: {
      current:  0,
      target:   0,
      velocity: 0,
      last:     0,
      delta:    0,
    },

    /** DimensÃµes da viewport (atualizado em resize) */
    vp: {
      w: window.innerWidth,
      h: window.innerHeight,
    },

    /** Contagem de locks de scroll (modal + drawer) */
    scrollLockCount: 0,

    /** ID do loop principal */
    rafId: null,
  };

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 3. UTILITÃRIOS DOM
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /**
   * Bloqueia o scroll do body usando contador de referÃªncias,
   * para que modal e drawer possam coexistir sem conflito.
   */
  function lockScroll() {
    S.scrollLockCount++;
    if (S.scrollLockCount === 1) {
      document.body.style.overflow = 'hidden';
    }
  }

  function unlockScroll() {
    S.scrollLockCount = Math.max(0, S.scrollLockCount - 1);
    if (S.scrollLockCount === 0) {
      document.body.style.overflow = '';
    }
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 4. CURSOR BOLA DE FUTEBOL
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initSoccerCursor() {
    if (!HAS_POINTER) return;

    const root = document.body;
    const interactables = [
      'a[href]',
      'button',
      '[data-magnetic]',
      '[data-scroll-target]',
      'input',
      'label',
      'select',
      'textarea',
      '[data-tilt]',
      '[role="button"]',
      '[role="tab"]',
      '[tabindex]:not([tabindex="-1"])',
      'summary',
      '.accordion-item button',
    ].join(', ');

    const isEnabledInteractive = (target) => {
      const el = target?.closest?.(interactables);
      if (!el) return false;
      return !el.matches(':disabled, [disabled], [aria-disabled="true"]');
    };

    const moveCursor = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      root.style.setProperty('--soccer-cursor-x', `${e.clientX}px`);
      root.style.setProperty('--soccer-cursor-y', `${e.clientY}px`);
      root.classList.add('has-soccer-cursor');
      root.classList.toggle('is-soccer-cursor-hover', isEnabledInteractive(e.target));
    };

    const hideHoverCursor = () => {
      root.classList.remove('has-soccer-cursor');
      root.classList.remove('is-soccer-cursor-hover');
      root.style.setProperty('--soccer-cursor-x', '-120px');
      root.style.setProperty('--soccer-cursor-y', '-120px');
    };

    document.addEventListener('pointermove', moveCursor, { passive: true });
    document.addEventListener('pointerleave', hideHoverCursor);
    window.addEventListener('blur', hideHoverCursor);
  }


  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 5. SCROLL â€” VELOCIDADE, SKEW & MÃ‰TRICAS
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

  /** ColeÃ§Ã£o de elementos com distorÃ§Ã£o baseada no scroll */
  let skewEls = [];

  function initScroll() {
    skewEls = $$('.scroll-skew');

    S.scroll.current = window.scrollY;
    S.scroll.last    = window.scrollY;

    window.addEventListener('scroll', () => {
      S.scroll.current = window.scrollY;
    }, { passive: true });
  }

  function tickScroll() {
    const { scroll, vp } = S;

    /* Delta bruto e velocidade suavizada */
    scroll.delta    = scroll.current - scroll.last;
    scroll.velocity = lerp(scroll.velocity, scroll.delta, REDUCED_MOTION ? 1 : 0.09);
    scroll.last     = lerp(scroll.last, scroll.current, REDUCED_MOTION ? 1 : 0.09);

    /* â”€â”€ Scroll Skew â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    if (!REDUCED_MOTION && skewEls.length) {
      const skewDeg = clamp(scroll.velocity * 0.045, -3.5, 3.5);
      skewEls.forEach(el => {
        el.style.setProperty('--skew-speed', `${skewDeg}deg`);
        el.style.transform = `skewY(${skewDeg}deg)`;
      });
    }

    /* â”€â”€ Barra de progresso de scroll â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const meterSpan = $('[class="scroll-meter"] span, .scroll-meter span');
    if (meterSpan) {
      const docH   = document.documentElement.scrollHeight - vp.h;
      const pct    = docH > 0 ? clamp(scroll.current / docH, 0, 1) : 0;
      meterSpan.style.width = `${pct * 100}%`;
    }

    /* â”€â”€ Header: estado scrollado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const header = $('[data-glass]');
    if (header) {
      const method = scroll.current > 48 ? 'setAttribute' : 'removeAttribute';
      header[method]('data-scrolled', '');
    }

    /* â”€â”€ BotÃ£o Voltar ao Topo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const backTop = $('[data-back-top]');
    if (backTop) {
      const method = scroll.current > vp.h * 0.45 ? 'setAttribute' : 'removeAttribute';
      backTop[method]('data-visible', '');
    }
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 6. TILT CARDS 3D + EFEITO FOIL
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

  /**
   * Cada entrada armazena o estado fÃ­sico do cartÃ£o:
   * rx/ry â†’ Ã¢ngulos atuais (interpolados),
   * targetRx/targetRy â†’ Ã¢ngulos alvo (calculados no mousemove).
   */
  const tiltInstances = [];

  function initTiltCards() {
    $$('[data-tilt]').forEach(card => {
      /* Detecta se o cartÃ£o tem animaÃ§Ã£o CSS de flutuaÃ§Ã£o */
      const computedAnim = getComputedStyle(card).animationName;
      const hasFloatAnim = computedAnim && computedAnim !== 'none';

      const instance = {
        el:          card,
        foil:        card.querySelector('.foil'),
        rx:          0,
        ry:          0,
        targetRx:    0,
        targetRy:    0,
        active:      false,
        hasFloat:    hasFloatAnim,
        restoreAnim: false,
      };

      tiltInstances.push(instance);

      /* â”€â”€ Leitura do Ã¢ngulo relativo ao centro do cartÃ£o â”€â”€â”€â”€â”€â”€â”€ */
      card.addEventListener('mousemove', (e) => {
        const rect  = card.getBoundingClientRect();
        const cx    = rect.left + rect.width  / 2;
        const cy    = rect.top  + rect.height / 2;
        const nx    = clamp((e.clientX - cx) / (rect.width  / 2), -1, 1);
        const ny    = clamp((e.clientY - cy) / (rect.height / 2), -1, 1);

        instance.targetRx = -ny * 10;
        instance.targetRy =  nx * 10;
        instance.active   = true;

        /* Pausa a animaÃ§Ã£o de flutuaÃ§Ã£o durante o tilt */
        if (instance.hasFloat && !REDUCED_MOTION) {
          card.style.animationPlayState = 'paused';
        }

        /* â”€â”€ Foil: atualiza posiÃ§Ã£o do gradiente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        if (instance.foil) {
          const shineX = clamp(mapRange(nx, -1, 1, 0, 100), 0, 100);
          const shineY = clamp(mapRange(ny, -1, 1, 0, 100), 0, 100);
          card.style.setProperty('--shine-x', `${shineX}%`);
          card.style.setProperty('--shine-y', `${shineY}%`);
          instance.foil.style.backgroundPosition = `${shineX}% ${shineY}%`;
          instance.foil.style.opacity = '1';
        }
      }, { passive: true });

      /* â”€â”€ Reset suave ao sair â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
      card.addEventListener('mouseleave', () => {
        instance.targetRx    = 0;
        instance.targetRy    = 0;
        instance.active      = false;
        instance.restoreAnim = instance.hasFloat;

        if (instance.foil) {
          instance.foil.style.backgroundPosition = '';
          instance.foil.style.opacity = '';
        }
        card.style.removeProperty('--shine-x');
        card.style.removeProperty('--shine-y');
      });
    });
  }

  function tickTiltCards() {
    if (REDUCED_MOTION) return;

    tiltInstances.forEach(inst => {
      const lf = 0.075;
      inst.rx = lerp(inst.rx, inst.targetRx, lf);
      inst.ry = lerp(inst.ry, inst.targetRy, lf);

      inst.el.style.transform =
        `perspective(900px) rotateX(${inst.rx.toFixed(3)}deg) rotateY(${inst.ry.toFixed(3)}deg)`;

      /* Restaura animaÃ§Ã£o quando o cartÃ£o voltou ao repouso */
      if (
        inst.restoreAnim &&
        Math.abs(inst.rx) < 0.04 &&
        Math.abs(inst.ry) < 0.04
      ) {
        inst.el.style.transform            = '';
        inst.el.style.animationPlayState   = '';
        inst.rx                            = 0;
        inst.ry                            = 0;
        inst.restoreAnim                   = false;
      }
    });
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 7. BOTÃ•ES MAGNÃ‰TICOS
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initMagnetic() {
    if (!HAS_POINTER || REDUCED_MOTION) return;

    $$('[data-magnetic]').forEach(btn => {
      let bx = 0, by = 0;          // posiÃ§Ã£o interpolada atual
      let tx = 0, ty = 0;          // posiÃ§Ã£o alvo
      let rafId = null;
      const STRENGTH = 0.32;
      const RADIUS   = 110;

      function animateMagnet() {
        bx = lerp(bx, tx, 0.13);
        by = lerp(by, ty, 0.13);
        btn.style.transform = `translate(${bx.toFixed(2)}px, ${by.toFixed(2)}px)`;

        const stillMoving = Math.abs(bx - tx) > 0.05 || Math.abs(by - ty) > 0.05;
        const notAtRest   = Math.abs(bx) > 0.05 || Math.abs(by) > 0.05;

        if (stillMoving || notAtRest) {
          rafId = requestAnimationFrame(animateMagnet);
        } else {
          btn.style.transform = '';
          rafId = null;
        }
      }

      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = e.clientX - cx;
        const dy   = e.clientY - cy;
        const d    = dist(e.clientX, e.clientY, cx, cy);

        if (d < RADIUS) {
          const factor = (1 - d / RADIUS) * STRENGTH;
          tx = dx * factor;
          ty = dy * factor;
        }

        if (!rafId) rafId = requestAnimationFrame(animateMagnet);
      }, { passive: true });

      btn.addEventListener('mouseleave', () => {
        tx = 0;
        ty = 0;
        if (!rafId) rafId = requestAnimationFrame(animateMagnet);
      });
    });
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 8. EFEITO RIPPLE NOS CTAs
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initRipple() {
    $$('[data-ripple]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rect = btn.getBoundingClientRect();
        const x    = e.clientX - rect.left;
        const y    = e.clientY - rect.top;
        const size = Math.max(rect.width, rect.height) * 2.2;

        const wave = document.createElement('span');
        wave.className = 'ripple-wave';
        Object.assign(wave.style, {
          width:  `${size}px`,
          height: `${size}px`,
          left:   `${x - size / 2}px`,
          top:    `${y - size / 2}px`,
        });

        btn.appendChild(wave);
        wave.addEventListener('animationend', () => wave.remove(), { once: true });
      });
    });
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 9. SCROLL REVEAL â€” IntersectionObserver
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initScrollReveal() {
    if (REDUCED_MOTION) {
      /* Acessibilidade: mostra tudo imediatamente sem animaÃ§Ã£o */
      $$('[data-reveal], .reveal-item').forEach(el =>
        el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold:  [0.08, 0.2],
      rootMargin: '0px 0px -48px 0px',
    });

    $$('[data-reveal], .reveal-item').forEach(el => observer.observe(el));
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 10. SIMULADOR DE ECONOMIA
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initCalculator() {
    const range       = document.getElementById('stickerRange');
    if (!range) return;

    const countOut    = document.getElementById('stickerCount');
    const marketEl    = document.getElementById('marketCost');
    const printEl     = document.getElementById('printCost');
    const savingEl    = document.getElementById('savingValue');
    const savingBar   = document.getElementById('savingBar');
    const savingPhrase = document.getElementById('savingPhrase');

    /** Formatador BRL sem decimais desnecessárias */
    const BRL = new Intl.NumberFormat('pt-BR', {
      style:                 'currency',
      currency:              'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    /* Premissas médias: banca/avulsas vs. impressão + Drive */
    const AVULSA_PRICE = 2.00;
    const PRINT_PRICE  = 0.25;
    const DRIVE_PRICE  = 9.90;

    const PHRASES = [
      'Com essa diferença, dá para imprimir o álbum e ainda sobra para curtir os jogos.',
      'Você economiza evitando repetidas, frete e faltantes caras compradas uma por uma.',
      'A impressão sai previsível: você baixa, imprime e monta sem depender da sorte nos pacotes.',
      'O Drive entra como custo fixo baixo e reduz muito o valor final da coleção.',
      'Quanto mais figurinhas faltam, maior fica a vantagem de imprimir pelo Drive.',
      'Essa diferença mostra o peso real da banca quando entram repetidas e avulsas.',
    ];

    function triggerCountPulse(el) {
      el.style.animation = 'none';
      void el.offsetWidth; // force reflow
      el.style.animation  = '';
    }

    function calculate() {
      const qty     = parseInt(range.value, 10);
      const min     = parseInt(range.min,   10);
      const max     = parseInt(range.max,   10);
      const pct     = clamp((qty - min) / (max - min), 0, 1);

      /* Valores calculados */
      const market = qty * AVULSA_PRICE;
      const print = (qty * PRINT_PRICE) + DRIVE_PRICE;
      const saving = Math.max(0, market - print);

      /* DOM updates */
      if (countOut) {
        countOut.textContent = qty;
        triggerCountPulse(countOut);
      }

      if (marketEl)  marketEl.textContent  = BRL.format(market);
      if (printEl)   printEl.textContent   = BRL.format(Math.round(print));
      if (savingEl)  savingEl.textContent  = BRL.format(Math.round(saving));

      /* Barra de progresso do slider */
      if (savingBar) savingBar.style.width = `${pct * 100}%`;

      /* Fill do track via CSS custom property */
      range.style.setProperty('--range-pct', `${(pct * 100).toFixed(1)}%`);

      /* Frase dinâmica */
      if (savingPhrase) {
        const phraseIdx  = Math.floor(pct * (PHRASES.length - 1));
        savingPhrase.textContent = PHRASES[phraseIdx];
      }
    }

    range.addEventListener('input',  calculate);
    range.addEventListener('change', calculate);
    calculate(); // Render inicial
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 11. CAROUSEL DE DEPOIMENTOS
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initCarousel() {
    const root = $('[data-carousel]');
    if (!root) return;

    const track  = $('[data-carousel-track]', root);
    const slides = $$('.testimonial', track || root);
    const dotsEl = $('[data-carousel-dots]', root);
    const prevBtn = $('[data-carousel-prev]', root);
    const nextBtn = $('[data-carousel-next]', root);

    if (slides.length < 2) return;

    let current      = 0;
    let timer        = null;
    const DELAY      = 4800;
    const isHovered  = { val: false };

    /* Cria pontos de navegaÃ§Ã£o */
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type         = 'button';
      dot.className    = `dot${i === 0 ? ' active' : ''}`;
      dot.setAttribute('aria-label', `Depoimento ${i + 1} de ${slides.length}`);
      dot.addEventListener('click', () => { goTo(i); resetTimer(); });
      dotsEl?.appendChild(dot);
    });

    const getDots = () => $$('.dot', dotsEl);

    function goTo(idx, skipTransition = false) {
      const dots  = getDots();
      const prev  = current;
      current     = ((idx % slides.length) + slides.length) % slides.length;

      if (prev === current) return;

      slides[prev].classList.remove('active');
      dots[prev]?.classList.remove('active');

      if (!skipTransition) {
        slides[current].style.animation = 'none';
        void slides[current].offsetWidth;
        slides[current].style.animation = '';
      }

      slides[current].classList.add('active');
      dots[current]?.classList.add('active');
    }

    function startTimer() {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        if (!isHovered.val) goTo(current + 1);
      }, DELAY);
    }

    function resetTimer() {
      clearInterval(timer);
      startTimer();
    }

    /* NavegaÃ§Ã£o por botÃµes */
    prevBtn?.addEventListener('click', () => { goTo(current - 1); resetTimer(); });
    nextBtn?.addEventListener('click', () => { goTo(current + 1); resetTimer(); });

    /* Pausa no hover */
    root.addEventListener('mouseenter', () => { isHovered.val = true;  });
    root.addEventListener('mouseleave', () => { isHovered.val = false; });

    /* Swipe em touch */
    if (IS_TOUCH) {
      let startX = 0;
      root.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
      }, { passive: true });

      root.addEventListener('touchend', e => {
        const dx = startX - e.changedTouches[0].clientX;
        if (Math.abs(dx) > 44) {
          goTo(dx > 0 ? current + 1 : current - 1);
          resetTimer();
        }
      }, { passive: true });
    }

    /* NavegaÃ§Ã£o por teclado quando foco estÃ¡ no carousel */
    root.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  { goTo(current - 1); resetTimer(); }
      if (e.key === 'ArrowRight') { goTo(current + 1); resetTimer(); }
    });

    startTimer();
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 12. ABAS DO DRIVE (Drive Tabs)
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initDriveTabs() {
    const root = $('[data-drive-tabs]');
    if (!root) return;

    const buttons = $$('[data-tab-button]', root);
    const panels  = $$('[data-tab-panel]',  root);

    /* Estado inicial: garante que hidden estÃ¡ correto */
    panels.forEach(p => {
      p.hidden = !p.classList.contains('active');
    });

    function activate(key) {
      buttons.forEach(btn => {
        const isMe = btn.dataset.tabButton === key;
        btn.classList.toggle('active', isMe);
        btn.setAttribute('aria-selected', String(isMe));
        btn.tabIndex = isMe ? 0 : -1;
      });

      panels.forEach(panel => {
        const isMe = panel.dataset.tabPanel === key;
        /* Reset da animaÃ§Ã£o para re-trigger */
        if (isMe) {
          panel.style.animation = 'none';
          void panel.offsetWidth;
          panel.style.animation = '';
        }
        panel.classList.toggle('active', isMe);
        panel.hidden = !isMe;
      });
    }

    buttons.forEach(btn => {
      btn.addEventListener('click', () => activate(btn.dataset.tabButton));

      /* NavegaÃ§Ã£o via teclado (ARIA tabs pattern) */
      btn.addEventListener('keydown', e => {
        const idx = buttons.indexOf(btn);
        let next  = -1;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          next = (idx + 1) % buttons.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          next = (idx - 1 + buttons.length) % buttons.length;
        } else if (e.key === 'Home') {
          e.preventDefault();
          next = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          next = buttons.length - 1;
        }

        if (next >= 0) {
          buttons[next].focus();
          activate(buttons[next].dataset.tabButton);
        }
      });
    });
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 13. ACCORDION DO FAQ
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initAccordion() {
    const accordion = $('[data-accordion]');
    if (!accordion) return;

    const items = $$('.accordion-item', accordion);

    items.forEach(item => {
      const btn     = $('button', item);
      const content = $('.accordion-content', item);
      if (!btn || !content) return;

      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');

        /* Fecha todos */
        items.forEach(i => {
          i.classList.remove('active');
          $('button', i)?.setAttribute('aria-expanded', 'false');
        });

        /* Abre o clicado, se estava fechado */
        if (!isOpen) {
          item.classList.add('active');
          btn.setAttribute('aria-expanded', 'true');
        }
      });

      /* Teclado: Enter/Space jÃ¡ ativam clique, mas Space no button precisa de prevenÃ§Ã£o */
      btn.addEventListener('keydown', e => {
        if (e.key === ' ') { e.preventDefault(); btn.click(); }
      });
    });
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 14. MODAL DE COMPRA
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initPurchaseModal() {
    const modal = $('[data-purchase-modal]');
    if (!modal) return;

    const dialog   = $('.purchase-modal__dialog', modal);
    const triggers = $$('[data-purchase-trigger]');
    const closers  = $$('[data-purchase-close]', modal);

    /* Primeiro elemento focÃ¡vel no dialog */
    const getFocusable = () =>
      $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', dialog);

    function open() {
      modal.setAttribute('data-open', '');
      modal.removeAttribute('aria-hidden');
      lockScroll();

      /* Move foco para o dialog */
      requestAnimationFrame(() => {
        const focusable = getFocusable();
        if (focusable.length) focusable[0].focus();
      });
    }

    function close() {
      modal.removeAttribute('data-open');
      modal.setAttribute('aria-hidden', 'true');
      unlockScroll();
    }

    triggers.forEach(t => {
      t.addEventListener('click', e => {
        e.preventDefault();
        open();
      });
    });

    closers.forEach(c => c.addEventListener('click', close));

    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (modal.hasAttribute('data-open')) close();
    });

    /* Focus trap dentro do dialog */
    modal.addEventListener('keydown', e => {
      if (!modal.hasAttribute('data-open') || e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (!focusable.length) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 15. MENU MOBILE (Drawer)
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initDrawer() {
    const drawer = $('[data-drawer]');
    const toggle = $('[data-menu-toggle]');
    if (!drawer || !toggle) return;

    let isOpen = false;

    /* Backdrop semitransparente */
    const backdrop = document.createElement('div');
    backdrop.className       = 'drawer-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    Object.assign(backdrop.style, {
      position:       'fixed',
      inset:          '0',
      background:     'rgba(6, 26, 12, 0.50)',
      zIndex:         '998',
      opacity:        '0',
      pointerEvents:  'none',
      transition:     'opacity 0.4s ease',
      backdropFilter: 'blur(3px)',
    });
    document.body.appendChild(backdrop);

    function open() {
      isOpen = true;
      drawer.setAttribute('data-open', '');
      drawer.removeAttribute('aria-hidden');
      toggle.setAttribute('aria-expanded', 'true');
      backdrop.style.opacity       = '1';
      backdrop.style.pointerEvents = 'auto';
      lockScroll();

      /* Foco no primeiro link */
      requestAnimationFrame(() => {
        $('a', drawer)?.focus();
      });
    }

    function close(returnFocus = true) {
      isOpen = false;
      drawer.removeAttribute('data-open');
      drawer.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      backdrop.style.opacity       = '0';
      backdrop.style.pointerEvents = 'none';
      unlockScroll();
      if (returnFocus) toggle.focus();
    }

    toggle.addEventListener('click', () => isOpen ? close() : open());
    backdrop.addEventListener('click', () => close());

    /* Fecha ao clicar em qualquer link do drawer */
    $$('a', drawer).forEach(a => {
      a.addEventListener('click', () => close(false));
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen) close();
    });

    /* Focus trap no drawer */
    drawer.addEventListener('keydown', e => {
      if (!isOpen || e.key !== 'Tab') return;
      const focusable = $$('a, button, [tabindex]:not([tabindex="-1"])', drawer);
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 16. SCROLL PARA Ã‚NCORA (Ghost CTA e links internos)
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initScrollTargets() {
    /* BotÃµes com data-scroll-target */
    $$('[data-scroll-target]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = $(btn.dataset.scrollTarget);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    /* Links Ã¢ncora do desktop-nav jÃ¡ funcionam via CSS scroll-padding-top,
       mas garantimos smooth em todos os href="#..." */
    $$('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const target = $(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 17. BOTÃƒO VOLTAR AO TOPO
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initBackToTop() {
    const btn = $('[data-back-top]');
    if (!btn) return;

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 18. MARQUEE â€” DuplicaÃ§Ã£o para loop infinito perfeito
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initMarquee() {
    const track = $('.marquee-track');
    if (!track) return;

    /* Clona o conteÃºdo para criar o loop sem gap */
    const clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.parentElement.appendChild(clone);

    /* Pausa a animaÃ§Ã£o no hover */
    track.closest('.hero-marquee')?.addEventListener('mouseenter', () => {
      track.style.animationPlayState       = 'paused';
      clone.style.animationPlayState       = 'paused';
    });

    track.closest('.hero-marquee')?.addEventListener('mouseleave', () => {
      track.style.animationPlayState       = '';
      clone.style.animationPlayState       = '';
    });
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 19. ACTIVE NAV LINK (observa seÃ§Ãµes)
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initActiveNav() {
    const navLinks = $$('.desktop-nav a[href^="#"]');
    if (!navLinks.length) return;

    const sectionMap = new Map();
    navLinks.forEach(link => {
      const id  = link.getAttribute('href').slice(1);
      const sec = document.getElementById(id);
      if (sec) sectionMap.set(sec, link);
    });

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(l => l.removeAttribute('aria-current'));
        sectionMap.get(entry.target)?.setAttribute('aria-current', 'page');
      });
    }, {
      rootMargin: '-30% 0px -60% 0px',
      threshold:  0,
    });

    sectionMap.forEach((_, sec) => observer.observe(sec));
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 20. SPOTLIGHT SEGUE O MOUSE (efeito ambiente)
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initSpotlight() {
    if (!HAS_POINTER || REDUCED_MOTION) return;
    const spotlight = $('.spotlight');
    if (!spotlight) return;

    let spX = 50, spY = -40;
    let tX  = 50, tY  = -40;

    document.addEventListener('mousemove', e => {
      tX = (e.clientX / S.vp.w) * 100;
      tY = ((e.clientY / S.vp.h) - 0.5) * 20 - 30;
    }, { passive: true });

    function tickSpotlight() {
      spX = lerp(spX, tX, 0.04);
      spY = lerp(spY, tY, 0.04);
      spotlight.style.left      = `${spX}%`;
      spotlight.style.transform = `translateX(-50%) translateY(${spY * 0.3}px)`;
      requestAnimationFrame(tickSpotlight);
    }

    requestAnimationFrame(tickSpotlight);
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 21. RESIZE â€” atualiza mÃ©tricas da viewport
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initResize() {
    let debounce;
    window.addEventListener('resize', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        S.vp.w = window.innerWidth;
        S.vp.h = window.innerHeight;
      }, 160);
    });
  }

  function initBackgroundPattern() {
    const layers = document.querySelectorAll('.bg-pattern-layer');
    if (!layers.length) return;

    const images = ['fundo1.png', 'fundo2.png', 'fundo3.png', 'fundo4.png', 'fundo5.png'];

    layers.forEach(layer => {
      if (layer.children.length) return;

      const fragment = document.createDocumentFragment();
      const isGlobal = layer.classList.contains('bg-pattern-layer--global');
      const count = isGlobal ? 280 : 48;
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        window.innerHeight
      );

      if (isGlobal) {
        layer.style.height = `${docHeight}px`;
      }

      for (let i = 0; i < count; i++) {
        const img = document.createElement('img');
        const randomImg = images[Math.floor(Math.random() * images.length)];
        const left = Math.random() * 100;
        const top = isGlobal ? Math.random() * docHeight : Math.random() * 100;
        const rot = Math.random() * 360;

        img.src = randomImg;
        img.className = 'bg-pattern-item';
        img.alt = '';
        img.decoding = 'async';
        img.style.left = `${left}%`;
        img.style.top = isGlobal ? `${top}px` : `${top}%`;
        img.style.transform = `rotate(${rot}deg)`;

        fragment.appendChild(img);
      }

      layer.appendChild(fragment);
    });

    const syncGlobalLayerHeight = () => {
      const globalLayer = document.querySelector('.bg-pattern-layer--global');
      if (!globalLayer) return;

      const nextHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        window.innerHeight
      );
      globalLayer.style.height = `${nextHeight}px`;
    };

    window.addEventListener('load', syncGlobalLayerHeight, { once: true });
    window.addEventListener('resize', syncGlobalLayerHeight);
  }

  function initCountdown() {
    const timer = document.getElementById('countdownTimer');
    if (!timer) return;

    const pad = value => String(value).padStart(2, '0');

    const getTodayDeadline = () => {
      const deadline = new Date();
      deadline.setHours(23, 59, 59, 999);
      return deadline.getTime();
    };

    const update = () => {
      const remaining = Math.max(0, getTodayDeadline() - Date.now());
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

      timer.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };

    update();
    const timerId = setInterval(update, 1000);
    window.addEventListener('pagehide', () => clearInterval(timerId), { once: true });
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 22. PACK LOADER â€” garante que o corpo fica visÃ­vel depois
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initPackLoader() {
    const loader = document.getElementById('packLoader');
    if (!loader) return;

    /* A animaÃ§Ã£o CSS jÃ¡ cobre o exit (2.5s delay + 0.6s fade).
       Remove do DOM depois para liberar memÃ³ria e garantir acessibilidade. */
    const EXIT_MS = 3200;
    setTimeout(() => {
      loader.style.display = 'none';
      loader.setAttribute('aria-hidden', 'true');
    }, EXIT_MS);
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 23. EFEITO HOVER NAS FIGURINHAS DA GALERIA (parallax leve)
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function initGalleryParallax() {
    if (!HAS_POINTER || REDUCED_MOTION) return;

    $$('.sticker-gallery').forEach(gallery => {
      const cards = $$('.gallery-sticker', gallery);

      gallery.addEventListener('mousemove', e => {
        const rect = gallery.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width  - 0.5;
        const my = (e.clientY - rect.top)  / rect.height - 0.5;

        cards.forEach((card, i) => {
          const depth  = (i % 3 + 1) * 0.4;
          const tiltX  = my * depth * 6;
          const tiltY  = mx * depth * 8;
          /* Combinamos com o tilt individual via wrapper */
          card.style.setProperty('--gx', `${mx * 50}%`);
          card.style.setProperty('--gy', `${my * 50}%`);
        });
      }, { passive: true });

      gallery.addEventListener('mouseleave', () => {
        cards.forEach(card => {
          card.style.removeProperty('--gx');
          card.style.removeProperty('--gy');
        });
      });
    });
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 24. LOOP CENTRAL â€” requestAnimationFrame
   * Roda a 60fps e delega para cada sistema que precisa de tick contÃ­nuo.
   * Sistemas de evento (click, hover, etc.) operam de forma independente.
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function startRAFLoop() {
    function loop() {
      tickScroll();
      tickTiltCards();
      S.rafId = requestAnimationFrame(loop);
    }
    S.rafId = requestAnimationFrame(loop);
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Â§ 25. INIT PRINCIPAL
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function init() {
    /* Inicializa estado de scroll antes do loop */
    S.scroll.current = window.scrollY;
    S.scroll.last    = window.scrollY;

    /* Sistemas baseados em fÃ­sica (alimentam o rAF loop) */
    initSoccerCursor();
    initScroll();
    initTiltCards();

    /* Sistemas de eventos (nÃ£o precisam de rAF prÃ³prio) */
    initMagnetic();
    initRipple();
    initScrollReveal();
    initCalculator();
    initCarousel();
    initDriveTabs();
    initAccordion();
    initPurchaseModal();
    initDrawer();
    initScrollTargets();
    initBackToTop();
    initMarquee();
    initActiveNav();
    initSpotlight();
    initGalleryParallax();
    initBackgroundPattern();
    initCountdown();
    initPackLoader();
    initResize();

    /* Dispara o loop principal */
    startRAFLoop();

    /* Log de confirmaÃ§Ã£o (pode remover em produÃ§Ã£o) */
    if (typeof console !== 'undefined') {
      console.info(
        '%câš½ Drive Copa 2026 JS %c Iniciado com sucesso',
        'background:#024d1e;color:#00ff87;padding:3px 8px;border-radius:4px;font-weight:bold;',
        'color:#3a6648;'
      );
    }
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * BOOTSTRAP â€” aguarda o DOM estar pronto
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  /* Cleanup ao sair da pÃ¡gina (SPA-friendly) */
  window.addEventListener('pagehide', () => {
    if (S.rafId) cancelAnimationFrame(S.rafId);
  });

})();

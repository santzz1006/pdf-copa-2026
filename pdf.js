(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const money = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  });

  const state = {
    lastScrollY: window.scrollY,
    scrollVelocity: 0,
    carouselIndex: 0,
    carouselTimer: null
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function initLoader() {
    const loader = $("#packLoader");
    if (!loader) return;

    window.setTimeout(() => {
      loader.classList.add("hide");
    }, 1300);

    window.setTimeout(() => {
      loader.remove();
    }, 2100);
  }

  function initSpotlight() {
    const root = document.documentElement;
    let targetX = 50;
    let targetY = 50;
    let currentX = 50;
    let currentY = 50;

    window.addEventListener("pointermove", (event) => {
      targetX = (event.clientX / window.innerWidth) * 100;
      targetY = (event.clientY / window.innerHeight) * 100;
    }, { passive: true });

    const tick = () => {
      currentX = lerp(currentX, targetX, 0.12);
      currentY = lerp(currentY, targetY, 0.12);
      root.style.setProperty("--mouse-x", `${currentX}%`);
      root.style.setProperty("--mouse-y", `${currentY}%`);
      requestAnimationFrame(tick);
    };

    tick();
  }

  function initScrollEffects() {
    const meter = $(".scroll-meter span");
    const backTop = $("[data-back-top]");
    const skewTargets = $$(".scroll-skew");
    let ticking = false;

    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      const delta = window.scrollY - state.lastScrollY;
      state.scrollVelocity = lerp(state.scrollVelocity, delta, 0.18);
      const skew = clamp(state.scrollVelocity * -0.035, -4.5, 4.5);

      if (meter) meter.style.width = `${progress * 100}%`;
      if (backTop) backTop.classList.toggle("visible", window.scrollY > 700);

      skewTargets.forEach((target) => {
        target.style.setProperty("--skew-speed", `${skew}deg`);
      });

      state.lastScrollY = window.scrollY;
      ticking = false;
    };

    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    if (backTop) {
      backTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    update();
  }

  function initReveal() {
    const items = $$("[data-reveal], .reveal-item");

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    $$("[data-reveal-group]").forEach((group) => {
      $$(".reveal-item", group).forEach((item, index) => {
        item.style.animationDelay = `${index * 85}ms`;
      });
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.16,
      rootMargin: "0px 0px -6% 0px"
    });

    items.forEach((item) => observer.observe(item));
  }

  function initTiltCards() {
    const cards = $$(".tilt-card");
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canHover) return;

    cards.forEach((card) => {
      let frame = null;
      let currentX = 0;
      let currentY = 0;
      let targetX = 0;
      let targetY = 0;
      const baseTransform = getComputedStyle(card).transform === "none" ? "" : getComputedStyle(card).transform;

      const animate = () => {
        currentX = lerp(currentX, targetX, 0.16);
        currentY = lerp(currentY, targetY, 0.16);
        card.style.transform = `${baseTransform} rotateX(${currentY}deg) rotateY(${currentX}deg) translateZ(0)`;
        frame = requestAnimationFrame(animate);
      };

      card.addEventListener("pointerenter", () => {
        card.style.transition = "box-shadow .25s ease";
        card.style.boxShadow = "0 35px 85px rgba(0,0,0,.48), 0 0 35px rgba(255,215,106,.22)";
        if (!frame) animate();
      });

      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        targetX = clamp((x - 0.5) * 18, -12, 12);
        targetY = clamp((0.5 - y) * 18, -12, 12);
        card.style.setProperty("--shine-x", `${x * 100}%`);
        card.style.setProperty("--shine-y", `${y * 100}%`);
      });

      card.addEventListener("pointerleave", () => {
        targetX = 0;
        targetY = 0;
        card.style.boxShadow = "";
        window.setTimeout(() => {
          if (Math.abs(currentX) < 0.1 && Math.abs(currentY) < 0.1 && frame) {
            cancelAnimationFrame(frame);
            frame = null;
            card.style.transform = "";
          }
        }, 420);
      });
    });
  }

  function initMagneticButtons() {
    const buttons = $$("[data-magnetic]");
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    buttons.forEach((button) => {
      if (canHover) {
        let frame = null;
        let tx = 0;
        let ty = 0;
        let cx = 0;
        let cy = 0;

        const animate = () => {
          cx = lerp(cx, tx, 0.2);
          cy = lerp(cy, ty, 0.2);
          button.style.transform = `translate(${cx}px, ${cy}px) scale(${tx || ty ? 1.035 : 1})`;
          frame = requestAnimationFrame(animate);
        };

        button.addEventListener("pointermove", (event) => {
          const rect = button.getBoundingClientRect();
          const x = event.clientX - rect.left - rect.width / 2;
          const y = event.clientY - rect.top - rect.height / 2;
          tx = clamp(x * 0.18, -18, 18);
          ty = clamp(y * 0.22, -16, 16);
          if (!frame) animate();
        });

        button.addEventListener("pointerleave", () => {
          tx = 0;
          ty = 0;
          window.setTimeout(() => {
            if (Math.abs(cx) < 0.1 && Math.abs(cy) < 0.1 && frame) {
              cancelAnimationFrame(frame);
              frame = null;
              button.style.transform = "";
            }
          }, 360);
        });
      }

      if (button.hasAttribute("data-ripple")) {
        button.addEventListener("click", (event) => {
          const rect = button.getBoundingClientRect();
          const ripple = document.createElement("span");
          ripple.className = "ripple-dot";
          ripple.style.left = `${event.clientX - rect.left}px`;
          ripple.style.top = `${event.clientY - rect.top}px`;
          button.appendChild(ripple);
          window.setTimeout(() => ripple.remove(), 760);
        });
      }
    });
  }

  function initCalculator() {
    const range = $("#stickerRange");
    const count = $("#stickerCount");
    const marketCost = $("#marketCost");
    const printCost = $("#printCost");
    const savingValue = $("#savingValue");
    const savingBar = $("#savingBar");
    const savingPhrase = $("#savingPhrase");
    if (!range || !count || !marketCost || !printCost || !savingValue || !savingBar) return;

    const phrases = [
      "Com essa diferença, dá para imprimir o álbum e ainda sobra para assistir ao jogo com estilo.",
      "Aqui começa a ficar claro por que comprar original avulsa virou brincadeira cara.",
      "A economia já parece placar elástico: nostalgia de um lado, mercado inflado do outro.",
      "Com essa diferença, dá para imprimir o álbum, chamar os amigos e ainda sobra para a pizza do jogo.",
      "Nesse nível, o Drive deixa de ser gasto e vira resgate histórico com troco."
    ];

    const update = () => {
      const needed = Number(range.value);
      const min = Number(range.min);
      const max = Number(range.max);
      const progress = ((needed - min) / (max - min)) * 100;
      const averageMarketUnit = 12;
      const averagePrintUnit = 0.3;
      const market = needed * averageMarketUnit;
      const print = Math.max(12, needed * averagePrintUnit);
      const saving = Math.max(0, market - print);
      const savingProgress = clamp((saving / (max * averageMarketUnit)) * 100, 4, 100);
      const phraseIndex = clamp(Math.floor(progress / 22), 0, phrases.length - 1);

      count.value = needed;
      marketCost.textContent = money.format(market);
      printCost.textContent = money.format(print);
      savingValue.textContent = money.format(saving);
      savingBar.style.width = `${savingProgress}%`;
      range.style.setProperty("--range-progress", `${progress}%`);
      if (savingPhrase) savingPhrase.textContent = phrases[phraseIndex];
    };

    range.addEventListener("input", update);
    update();
  }

  function initAccordions() {
    const accordion = $("[data-accordion]");
    if (!accordion) return;

    $$(".accordion-item", accordion).forEach((item) => {
      const button = $("button", item);
      if (!button) return;

      button.addEventListener("click", () => {
        const isActive = item.classList.contains("active");

        $$(".accordion-item", accordion).forEach((other) => {
          other.classList.remove("active");
          const otherButton = $("button", other);
          if (otherButton) otherButton.setAttribute("aria-expanded", "false");
        });

        if (!isActive) {
          item.classList.add("active");
          button.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  function initCarousel() {
    const carousel = $("[data-carousel]");
    if (!carousel) return;

    const testimonials = $$(".testimonial", carousel);
    const dotsWrap = $("[data-carousel-dots]", carousel);
    const prev = $("[data-carousel-prev]", carousel);
    const next = $("[data-carousel-next]", carousel);
    if (!testimonials.length || !dotsWrap) return;

    const dots = testimonials.map((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `Ver depoimento ${index + 1}`);
      dot.addEventListener("click", () => {
        setSlide(index);
        restart();
      });
      dotsWrap.appendChild(dot);
      return dot;
    });

    const setSlide = (index) => {
      state.carouselIndex = (index + testimonials.length) % testimonials.length;
      testimonials.forEach((testimonial, current) => {
        testimonial.classList.toggle("active", current === state.carouselIndex);
      });
      dots.forEach((dot, current) => {
        dot.classList.toggle("active", current === state.carouselIndex);
      });
    };

    const restart = () => {
      window.clearInterval(state.carouselTimer);
      state.carouselTimer = window.setInterval(() => {
        setSlide(state.carouselIndex + 1);
      }, 5200);
    };

    if (prev) {
      prev.addEventListener("click", () => {
        setSlide(state.carouselIndex - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", () => {
        setSlide(state.carouselIndex + 1);
        restart();
      });
    }

    carousel.addEventListener("mouseenter", () => window.clearInterval(state.carouselTimer));
    carousel.addEventListener("mouseleave", restart);
    setSlide(0);
    restart();
  }

  function initDriveTabs() {
    const wrapper = $("[data-drive-tabs]");
    if (!wrapper) return;

    const buttons = $$("[data-tab-button]", wrapper);
    const panels = $$("[data-tab-panel]", wrapper);
    if (!buttons.length || !panels.length) return;

    const activate = (key) => {
      buttons.forEach((button) => {
        const active = button.dataset.tabButton === key;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
      });

      panels.forEach((panel) => {
        panel.classList.toggle("active", panel.dataset.tabPanel === key);
      });
    };

    buttons.forEach((button, index) => {
      button.addEventListener("click", () => activate(button.dataset.tabButton));
      button.addEventListener("keydown", (event) => {
        const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
        if (!keys.includes(event.key)) return;

        event.preventDefault();
        let nextIndex = index;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % buttons.length;
        if (event.key === "ArrowLeft") nextIndex = (index - 1 + buttons.length) % buttons.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = buttons.length - 1;

        buttons[nextIndex].focus();
        activate(buttons[nextIndex].dataset.tabButton);
      });
    });

    activate(buttons[0].dataset.tabButton);
  }

  function initMenu() {
    const toggle = $("[data-menu-toggle]");
    const drawer = $("[data-drawer]");
    if (!toggle || !drawer) return;

    const close = () => {
      document.body.classList.remove("menu-open");
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
      const open = !drawer.classList.contains("open");
      document.body.classList.toggle("menu-open", open);
      drawer.classList.toggle("open", open);
      drawer.setAttribute("aria-hidden", String(!open));
      toggle.setAttribute("aria-expanded", String(open));
    });

    $$("a", drawer).forEach((link) => link.addEventListener("click", close));

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }

  function initSmoothButtons() {
    $$("[data-scroll-target]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = $(button.dataset.scrollTarget);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function initPurchaseModal() {
    const modal = $("[data-purchase-modal]");
    const triggers = $$("[data-purchase-trigger]");
    const closeButtons = $$("[data-purchase-close]");
    if (!modal || !triggers.length) return;

    let lastFocused = null;

    const open = () => {
      lastFocused = document.activeElement;
      document.body.classList.add("purchase-modal-open");
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      const firstAction = $(".purchase-modal__cta", modal);
      if (firstAction) firstAction.focus({ preventScroll: true });
    };

    const close = () => {
      document.body.classList.remove("purchase-modal-open");
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus({ preventScroll: true });
      }
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        open();
      });
    });

    closeButtons.forEach((button) => button.addEventListener("click", close));

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        close();
      }
    });
  }

  function initFloatingDepth() {
    const visual = $(".hero-visual");
    if (!visual) return;

    const stickers = $$(".floating-sticker", visual);
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    visual.addEventListener("pointermove", (event) => {
      const rect = visual.getBoundingClientRect();
      mouseX = (event.clientX - rect.left) / rect.width - 0.5;
      mouseY = (event.clientY - rect.top) / rect.height - 0.5;
    }, { passive: true });

    visual.addEventListener("pointerleave", () => {
      mouseX = 0;
      mouseY = 0;
    });

    const tick = () => {
      currentX = lerp(currentX, mouseX, 0.08);
      currentY = lerp(currentY, mouseY, 0.08);
      stickers.forEach((sticker, index) => {
        const depth = (index + 1) * 8;
        sticker.style.marginLeft = `${currentX * depth}px`;
        sticker.style.marginTop = `${currentY * depth}px`;
      });
      requestAnimationFrame(tick);
    };

    tick();
  }

  function initHeaderGlass() {
    const header = $(".site-header");
    if (!header) return;

    const update = () => {
      header.style.background = window.scrollY > 80
        ? "rgba(4, 22, 14, .86)"
        : "rgba(4, 22, 14, .68)";
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  function boot() {
    initLoader();
    initSpotlight();
    initScrollEffects();
    initReveal();
    initTiltCards();
    initMagneticButtons();
    initCalculator();
    initAccordions();
    initCarousel();
    initDriveTabs();
    initMenu();
    initSmoothButtons();
    initPurchaseModal();
    initFloatingDepth();
    initHeaderGlass();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

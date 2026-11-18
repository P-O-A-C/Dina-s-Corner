(() => {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".promo-slide"));
  const dots = Array.from(document.querySelectorAll(".slider-dot"));
  const previous = document.getElementById("slidePrev");
  const next = document.getElementById("slideNext");
  const slider = document.querySelector(".promo-slider");
  const menu = document.getElementById("mobileMenu");
  const menuTrigger = document.getElementById("menuTrigger");
  const closeMenuButton = document.getElementById("closeMenu");
  const menuScrim = document.getElementById("menuScrim");

  let activeSlide = 0;
  let rotationTimer = null;
  const rotationDelay = 5000;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showSlide(index) {
    if (!slides.length) return;
    activeSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeSlide;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });

    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === activeSlide;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-current", String(active));
    });
  }

  function stopRotation() {
    if (rotationTimer !== null) {
      window.clearInterval(rotationTimer);
      rotationTimer = null;
    }
  }

  function startRotation() {
    stopRotation();
    if (reducedMotion || slides.length < 2 || document.hidden) return;
    rotationTimer = window.setInterval(() => showSlide(activeSlide + 1), rotationDelay);
  }

  function goToSlide(index) {
    showSlide(index);
    startRotation();
  }

  previous?.addEventListener("click", () => goToSlide(activeSlide - 1));
  next?.addEventListener("click", () => goToSlide(activeSlide + 1));
  dots.forEach((dot, index) => dot.addEventListener("click", () => goToSlide(index)));

  slider?.addEventListener("mouseenter", stopRotation);
  slider?.addEventListener("mouseleave", startRotation);
  slider?.addEventListener("focusin", stopRotation);
  slider?.addEventListener("focusout", startRotation);
  document.addEventListener("visibilitychange", () => document.hidden ? stopRotation() : startRotation());

  function setMenuOpen(open) {
    if (!menu || !menuTrigger || !menuScrim) return;
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    menuTrigger.setAttribute("aria-expanded", String(open));
    menuScrim.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    if (open) closeMenuButton?.focus();
    else menuTrigger.focus();
  }

  menuTrigger?.addEventListener("click", () => setMenuOpen(true));
  closeMenuButton?.addEventListener("click", () => setMenuOpen(false));
  menuScrim?.addEventListener("click", () => setMenuOpen(false));
  menu?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setMenuOpen(false)));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menu?.classList.contains("is-open")) setMenuOpen(false);
  });

  showSlide(0);
  startRotation();
})();

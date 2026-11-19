(() => {
  "use strict";

  let slides = Array.from(document.querySelectorAll(".promo-slide"));
  let dots = Array.from(document.querySelectorAll(".slider-dot"));
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

  function bindCarouselControls() {
    if (previous && !previous.dataset.carouselBound) { previous.addEventListener("click", () => goToSlide(activeSlide - 1)); previous.dataset.carouselBound = "true"; }
    if (next && !next.dataset.carouselBound) { next.addEventListener("click", () => goToSlide(activeSlide + 1)); next.dataset.carouselBound = "true"; }
    dots.forEach((dot, index) => { if (!dot.dataset.carouselBound) { dot.addEventListener("click", () => goToSlide(index)); dot.dataset.carouselBound = "true"; } });
    if (!slider?.dataset.carouselEventsBound) {
      slider?.addEventListener("mouseenter", stopRotation);
      slider?.addEventListener("mouseleave", startRotation);
      slider?.addEventListener("focusin", stopRotation);
      slider?.addEventListener("focusout", startRotation);
      document.addEventListener("visibilitychange", () => document.hidden ? stopRotation() : startRotation());
      if (slider) slider.dataset.carouselEventsBound = "true";
    }
  }

  async function loadManagedSlides() {
    const cfg = window.POA_CONFIG || {};
    if (!window.supabase?.createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY || !slider) return;
    try {
      const client = window.__GDC_PUBLIC_CLIENT__ || window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
      window.__GDC_PUBLIC_CLIENT__ = client;
      const { data, error } = await client.from("gdc_home_slides").select("id,image_url,alt_text,sort_order,is_active").eq("is_active", true).order("sort_order", { ascending: true });
      if (error) throw error;
      if (!Array.isArray(data) || !data.length) return;
      const oldSlides = Array.from(slider.querySelectorAll(".promo-slide"));
      const templateCopies = oldSlides.map(slide => slide.querySelector(".slide-copy")?.cloneNode(true)).filter(Boolean);
      const slidesMarkup = data.map((row, index) => {
        const article = document.createElement("article");
        article.className = "promo-slide" + (index === 0 ? " is-active" : "");
        article.setAttribute("aria-hidden", String(index !== 0));
        const img = document.createElement("img");
        img.src = row.image_url; img.alt = row.alt_text || "صورة من GRAND DRY CLEAN"; img.loading = index === 0 ? "eager" : "lazy";
        if (index === 0) img.fetchPriority = "high";
        const shade = document.createElement("div"); shade.className = "slide-shade";
        article.append(img, shade);
        const copy = templateCopies[index] || templateCopies[0];
        if (copy) article.append(copy.cloneNode(true));
        return article;
      });
      const container = slider.querySelector(".slides");
      container.replaceChildren(...slidesMarkup);
      const dotsContainer = slider.querySelector("#sliderDots");
      if (dotsContainer) {
        dotsContainer.replaceChildren(...data.map((_, index) => {
          const dot = document.createElement("button"); dot.type = "button"; dot.className = "slider-dot" + (index === 0 ? " is-active" : "");
          dot.setAttribute("aria-label", `الصورة ${index + 1}`); dot.setAttribute("aria-current", String(index === 0)); return dot;
        }));
      }
      slides = Array.from(slider.querySelectorAll(".promo-slide"));
      dots = Array.from(slider.querySelectorAll(".slider-dot"));
      activeSlide = 0; bindCarouselControls(); showSlide(0); startRotation();
    } catch (error) {
      console.warn("GDC managed homepage slides unavailable; using built-in slides.", error);
    }
  }

  bindCarouselControls();

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
  loadManagedSlides();
})();

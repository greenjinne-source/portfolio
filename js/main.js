(() => {
  "use strict";

  document.documentElement.classList.add("js");

  /* ---------- Theme toggle ---------- */
  const THEME_KEY = "portfolio-theme";
  const root = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");

  function applyStoredTheme() {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === "light" || stored === "dark") {
        root.setAttribute("data-theme", stored);
      }
    } catch (err) {
      /* localStorage unavailable (private mode, etc.) — fall back to system theme */
    }
  }

  function currentTheme() {
    const attr = root.getAttribute("data-theme");
    if (attr) return attr;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  applyStoredTheme();

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (err) {
        /* ignore write failures */
      }
    });
  }

  /* ---------- Mobile nav ---------- */
  const menuToggle = document.getElementById("menu-toggle");
  const mainNav = document.getElementById("main-nav");
  const menuIconUse = menuToggle ? menuToggle.querySelector("use") : null;

  function setMenuOpen(isOpen) {
    if (!mainNav || !menuToggle) return;
    mainNav.classList.toggle("is-open", isOpen);
    menuToggle.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
    if (menuIconUse) {
      menuIconUse.setAttribute("href", isOpen ? "#icon-close" : "#icon-menu");
    }
  }

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      setMenuOpen(!mainNav.classList.contains("is-open"));
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenuOpen(false));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mainNav.classList.contains("is-open")) {
        setMenuOpen(false);
        menuToggle.focus();
      }
    });
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Stagger siblings so a grid of cards arrives as a sequence rather than a
     single flash — capped so a long list never leaves the viewer waiting. */
  revealEls.forEach((el) => {
    const siblings = Array.from(el.parentElement ? el.parentElement.children : []).filter((n) =>
      n.classList.contains("reveal")
    );
    if (siblings.length > 1) {
      el.style.setProperty("--reveal-order", String(Math.min(siblings.indexOf(el), 5)));
    }
  });

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));
  }

  /* ---------- Contact form ---------- */
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");

  function setFieldError(id, message) {
    const errorEl = document.getElementById(`${id}-error`);
    const inputEl = document.getElementById(id);
    if (errorEl) errorEl.textContent = message || "";
    if (inputEl) inputEl.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validateForm(data) {
    let valid = true;

    if (!data.name.trim()) {
      setFieldError("name", "Пожалуйста, укажите имя.");
      valid = false;
    } else {
      setFieldError("name", "");
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(data.email.trim())) {
      setFieldError("email", "Введите корректный email.");
      valid = false;
    } else {
      setFieldError("email", "");
    }

    if (!data.message.trim() || data.message.trim().length < 10) {
      setFieldError("message", "Сообщение должно содержать не менее 10 символов.");
      valid = false;
    } else {
      setFieldError("message", "");
    }

    return valid;
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = {
        name: form.name.value,
        email: form.email.value,
        message: form.message.value,
      };

      if (!validateForm(data)) {
        if (status) {
          status.textContent = "Проверьте поля формы, отмеченные ошибкой.";
          status.className = "form-status error";
        }
        return;
      }

      const subject = encodeURIComponent(`Портфолио: сообщение от ${data.name}`);
      const body = encodeURIComponent(`${data.message}\n\n— ${data.name} (${data.email})`);
      window.location.href = `mailto:hello@melekhin-design.ru?subject=${subject}&body=${body}`;

      if (status) {
        status.textContent = "Открываем ваш почтовый клиент…";
        status.className = "form-status success";
      }
      form.reset();
    });
  }

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Gallery lightbox ---------- */
  const lightbox = document.getElementById("lightbox");

  if (lightbox) {
    const lightboxImg = lightbox.querySelector(".lightbox-img");
    const lightboxCaption = lightbox.querySelector(".lightbox-caption");
    const closeBtn = lightbox.querySelector(".lightbox-close");
    const prevBtn = lightbox.querySelector(".lightbox-prev");
    const nextBtn = lightbox.querySelector(".lightbox-next");

    let currentItems = [];
    let currentIndex = 0;
    let lastFocused = null;

    function renderSlide() {
      const item = currentItems[currentIndex];
      if (!item) return;
      lightboxImg.src = item.src;
      lightboxImg.alt = item.alt;
      lightboxCaption.textContent = item.caption;
    }

    function openLightbox(items, index, triggerEl) {
      currentItems = items;
      currentIndex = index;
      lastFocused = triggerEl || document.activeElement;
      renderSlide();
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    }

    function closeLightbox() {
      lightbox.hidden = true;
      document.body.style.overflow = "";
      lightboxImg.src = "";
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }

    function showNext() {
      currentIndex = (currentIndex + 1) % currentItems.length;
      renderSlide();
    }

    function showPrev() {
      currentIndex = (currentIndex - 1 + currentItems.length) % currentItems.length;
      renderSlide();
    }

    document.querySelectorAll(".gallery-grid").forEach((grid) => {
      const figures = Array.from(grid.querySelectorAll(".gallery-item"));
      const items = figures.map((fig) => {
        const img = fig.querySelector("img");
        const caption = fig.querySelector("figcaption");
        return {
          src: img ? img.src : "",
          alt: img ? img.alt : "",
          caption: caption ? caption.textContent : "",
        };
      });

      figures.forEach((fig, index) => {
        fig.setAttribute("tabindex", "0");
        fig.setAttribute("role", "button");
        fig.setAttribute("aria-label", "Открыть изображение крупнее");

        const open = () => openLightbox(items, index, fig);

        fig.addEventListener("click", open);
        fig.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        });
      });
    });

    closeBtn.addEventListener("click", closeLightbox);
    nextBtn.addEventListener("click", showNext);
    prevBtn.addEventListener("click", showPrev);

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", (e) => {
      if (lightbox.hidden) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") showNext();
      if (e.key === "ArrowLeft") showPrev();
    });
  }
})();

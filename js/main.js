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
})();

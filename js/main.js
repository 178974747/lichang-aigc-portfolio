(() => {
  const works = window.PORTFOLIO_WORKS || [];
  const grid = document.getElementById("works-grid");
  const filters = document.querySelectorAll(".filter");
  const lightbox = document.getElementById("lightbox");
  const lightboxVisual = document.getElementById("lightbox-visual");
  const lightboxTitle = document.getElementById("lightbox-title");
  const lightboxMeta = document.getElementById("lightbox-meta");
  const lightboxDesc = document.getElementById("lightbox-desc");
  const closeBtn = document.querySelector(".lightbox-close");
  const header = document.querySelector(".site-header");
  const nav = document.querySelector(".nav");
  const navToggle = document.querySelector(".nav-toggle");
  const year = document.getElementById("year");

  if (year) year.textContent = String(new Date().getFullYear());

  function renderWorks(filter = "all") {
    if (!grid) return;
    grid.innerHTML = works
      .map((work) => {
        const hidden = filter !== "all" && work.category !== filter;
        return `
          <article class="work${hidden ? " is-hidden" : ""}" data-category="${work.category}">
            <button class="work-trigger" type="button" data-id="${work.id}" aria-label="查看作品：${work.title}">
              <div class="work-visual">
                <span class="${work.artClass}" aria-hidden="true"></span>
              </div>
              <div class="work-meta">
                <div>
                  <h3>${work.title}</h3>
                  <p>${work.year} · ${work.tools}</p>
                </div>
                <span class="work-tag">${work.categoryLabel}</span>
              </div>
            </button>
          </article>
        `;
      })
      .join("");
  }

  function openWork(id) {
    const work = works.find((item) => item.id === id);
    if (!work || !lightbox) return;
    lightboxVisual.className = `lightbox-visual ${work.artClass}`;
    lightboxTitle.textContent = work.title;
    lightboxMeta.textContent = `${work.categoryLabel} · ${work.year} · ${work.tools}`;
    lightboxDesc.textContent = work.description;
    if (typeof lightbox.showModal === "function") {
      lightbox.showModal();
    } else {
      lightbox.setAttribute("open", "");
    }
  }

  function closeLightbox() {
    if (!lightbox) return;
    if (typeof lightbox.close === "function") {
      lightbox.close();
    } else {
      lightbox.removeAttribute("open");
    }
  }

  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      filters.forEach((item) => {
        item.classList.toggle("is-active", item === btn);
        item.setAttribute("aria-selected", item === btn ? "true" : "false");
      });
      renderWorks(btn.dataset.filter || "all");
    });
  });

  grid?.addEventListener("click", (event) => {
    const trigger = event.target.closest(".work-trigger");
    if (!trigger) return;
    openWork(trigger.dataset.id);
  });

  closeBtn?.addEventListener("click", closeLightbox);

  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });

  navToggle?.addEventListener("click", () => {
    const open = nav?.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      navToggle?.setAttribute("aria-expanded", "false");
    });
  });

  window.addEventListener(
    "scroll",
    () => {
      header?.classList.toggle("is-scrolled", window.scrollY > 24);
    },
    { passive: true }
  );

  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index % 4, 3) * 80}ms`;
      io.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  renderWorks("all");
})();

(() => {
  const CATEGORY_LABELS = {
    image: "图像",
    video: "影像",
    concept: "概念",
  };

  const grid = document.getElementById("works-grid");
  const emptyEl = document.getElementById("works-empty");
  const worksCount = document.getElementById("works-count");
  const filters = document.querySelectorAll(".filter");
  const lightbox = document.getElementById("lightbox");
  const lightboxVisual = document.getElementById("lightbox-visual");
  const lightboxTitle = document.getElementById("lightbox-title");
  const lightboxMeta = document.getElementById("lightbox-meta");
  const lightboxDesc = document.getElementById("lightbox-desc");
  const closeBtn = document.querySelector(".lightbox-close");
  const deleteBtn = document.getElementById("delete-work");
  const header = document.querySelector(".site-header");
  const nav = document.querySelector(".nav");
  const navToggle = document.querySelector(".nav-toggle");
  const year = document.getElementById("year");
  const form = document.getElementById("upload-form");
  const fileInput = document.getElementById("file-input");
  const dropzone = document.getElementById("dropzone");
  const dropzoneCopy = document.getElementById("dropzone-copy");
  const dropzonePreview = document.getElementById("dropzone-preview");
  const formStatus = document.getElementById("form-status");

  let works = [];
  let activeFilter = "all";
  let activeId = null;
  let pendingFile = null;
  let previewUrl = null;

  if (year) year.textContent = String(new Date().getFullYear());

  form?.querySelector('[name="year"]').setAttribute(
    "value",
    String(new Date().getFullYear())
  );

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function revokePreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
  }

  function setPreview(file) {
    pendingFile = file || null;
    revokePreview();
    if (!file || !dropzonePreview || !dropzoneCopy) return;
    previewUrl = URL.createObjectURL(file);
    dropzonePreview.hidden = false;
    dropzonePreview.style.backgroundImage = `url("${previewUrl}")`;
    dropzoneCopy.hidden = true;
    dropzone?.classList.add("has-file");
  }

  function clearPreview() {
    pendingFile = null;
    revokePreview();
    if (fileInput) fileInput.value = "";
    if (dropzonePreview) {
      dropzonePreview.hidden = true;
      dropzonePreview.style.backgroundImage = "";
    }
    if (dropzoneCopy) dropzoneCopy.hidden = false;
    dropzone?.classList.remove("has-file");
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function refreshWorks() {
    works = await window.PortfolioStore.list();
    renderWorks(activeFilter);
  }

  function renderWorks(filter = "all") {
    activeFilter = filter;
    if (!grid) return;

    const visible = works.filter((work) => filter === "all" || work.category === filter);

    if (worksCount) {
      worksCount.textContent = `共 ${works.length} 件作品`;
    }

    if (emptyEl) {
      emptyEl.hidden = works.length > 0;
    }

    grid.innerHTML = visible
      .map((work) => {
        const label = work.categoryLabel || CATEGORY_LABELS[work.category] || work.category;
        const tools = work.tools ? ` · ${escapeHtml(work.tools)}` : "";
        return `
          <article class="work" data-category="${escapeHtml(work.category)}">
            <button class="work-trigger" type="button" data-id="${escapeHtml(work.id)}" aria-label="查看作品：${escapeHtml(work.title)}">
              <div class="work-visual" style="background-image:url('${work.imageDataUrl}')"></div>
              <div class="work-meta">
                <div>
                  <h3>${escapeHtml(work.title)}</h3>
                  <p>${escapeHtml(work.year)}${tools}</p>
                </div>
                <span class="work-tag">${escapeHtml(label)}</span>
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
    activeId = id;
    lightboxVisual.style.backgroundImage = `url("${work.imageDataUrl}")`;
    lightboxVisual.className = "lightbox-visual has-image";
    lightboxTitle.textContent = work.title;
    const label = work.categoryLabel || CATEGORY_LABELS[work.category] || work.category;
    lightboxMeta.textContent = `${label} · ${work.year}${work.tools ? ` · ${work.tools}` : ""}`;
    lightboxDesc.textContent = work.description || "暂无简介";
    if (typeof lightbox.showModal === "function") {
      lightbox.showModal();
    } else {
      lightbox.setAttribute("open", "");
    }
  }

  function closeLightbox() {
    activeId = null;
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

  deleteBtn?.addEventListener("click", async () => {
    if (!activeId) return;
    if (!window.confirm("确定删除这件作品吗？此操作不可撤销。")) return;
    await window.PortfolioStore.remove(activeId);
    closeLightbox();
    await refreshWorks();
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

  fileInput?.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) setPreview(file);
  });

  ["dragenter", "dragover"].forEach((type) => {
    dropzone?.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((type) => {
    dropzone?.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.remove("is-dragging");
    });
  });

  dropzone?.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      if (formStatus) formStatus.textContent = "请上传图片文件。";
      return;
    }
    if (fileInput) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
    }
    setPreview(file);
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!formStatus) return;

    const data = new FormData(form);
    const title = String(data.get("title") || "").trim();
    const category = String(data.get("category") || "image");
    const yearValue = String(data.get("year") || "").trim();
    const tools = String(data.get("tools") || "").trim();
    const description = String(data.get("description") || "").trim();
    const file = pendingFile || fileInput?.files?.[0];

    if (!file) {
      formStatus.textContent = "请先选择封面图片。";
      return;
    }
    if (!title || !yearValue) {
      formStatus.textContent = "请填写标题和年份。";
      return;
    }
    if (file.size > 4.5 * 1024 * 1024) {
      formStatus.textContent = "图片请控制在 4.5MB 以内。";
      return;
    }

    formStatus.textContent = "正在保存…";
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const imageDataUrl = await fileToDataUrl(file);
      const work = {
        id: `work-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        category,
        categoryLabel: CATEGORY_LABELS[category] || category,
        year: yearValue,
        tools,
        description,
        imageDataUrl,
        createdAt: Date.now(),
      };
      await window.PortfolioStore.save(work);
      form.reset();
      form.querySelector('[name="year"]').value = String(new Date().getFullYear());
      clearPreview();
      formStatus.textContent = "已发布到作品墙。";
      await refreshWorks();
      document.getElementById("works")?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error(error);
      formStatus.textContent = "保存失败，请重试。";
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

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

  refreshWorks().catch((error) => {
    console.error(error);
    if (formStatus) formStatus.textContent = "无法读取本地作品库。";
  });
})();

(() => {
  const CATEGORY_LABELS = {
    image: "图像",
    video: "影像",
    concept: "概念",
  };

  const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
  const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

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
  const categorySelect = form?.querySelector('[name="category"]');

  let works = [];
  let activeFilter = "all";
  let activeId = null;
  let pendingFile = null;
  let previewUrl = null;
  const mediaUrls = new Map();

  if (year) year.textContent = String(new Date().getFullYear());

  const yearInput = form?.querySelector('[name="year"]');
  if (yearInput) yearInput.value = String(new Date().getFullYear());

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isVideoFile(file) {
    return Boolean(file && file.type.startsWith("video/"));
  }

  function isImageFile(file) {
    return Boolean(file && file.type.startsWith("image/"));
  }

  function isAllowedFile(file) {
    return isImageFile(file) || isVideoFile(file);
  }

  function getMediaType(work) {
    if (work.mediaType) return work.mediaType;
    if (work.mediaBlob?.type?.startsWith("video/")) return "video";
    if (work.imageDataUrl) return "image";
    return "image";
  }

  function getMediaUrl(work) {
    if (mediaUrls.has(work.id)) return mediaUrls.get(work.id);

    if (work.mediaBlob instanceof Blob) {
      const url = URL.createObjectURL(work.mediaBlob);
      mediaUrls.set(work.id, url);
      return url;
    }

    if (work.imageDataUrl) {
      mediaUrls.set(work.id, work.imageDataUrl);
      return work.imageDataUrl;
    }

    return "";
  }

  function revokeAllMediaUrls() {
    mediaUrls.forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    });
    mediaUrls.clear();
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
    dropzonePreview.innerHTML = "";
    dropzonePreview.style.backgroundImage = "";

    if (isVideoFile(file)) {
      const video = document.createElement("video");
      video.src = previewUrl;
      video.muted = true;
      video.playsInline = true;
      video.loop = true;
      video.autoplay = true;
      video.setAttribute("playsinline", "");
      dropzonePreview.appendChild(video);
      if (categorySelect && categorySelect.value === "image") {
        categorySelect.value = "video";
      }
    } else {
      dropzonePreview.style.backgroundImage = `url("${previewUrl}")`;
    }

    dropzoneCopy.hidden = true;
    dropzone?.classList.add("has-file");
  }

  function clearPreview() {
    pendingFile = null;
    revokePreview();
    if (fileInput) fileInput.value = "";
    if (dropzonePreview) {
      dropzonePreview.hidden = true;
      dropzonePreview.innerHTML = "";
      dropzonePreview.style.backgroundImage = "";
    }
    if (dropzoneCopy) dropzoneCopy.hidden = false;
    dropzone?.classList.remove("has-file");
  }

  async function refreshWorks() {
    revokeAllMediaUrls();
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
        const mediaType = getMediaType(work);
        const url = getMediaUrl(work);
        const mediaHtml =
          mediaType === "video"
            ? `<video class="work-media" src="${url}" muted loop playsinline preload="metadata"></video>
               <span class="media-badge" aria-hidden="true">视频</span>`
            : `<div class="work-media work-media--image" style="background-image:url('${url}')"></div>`;

        return `
          <article class="work" data-category="${escapeHtml(work.category)}">
            <button class="work-trigger" type="button" data-id="${escapeHtml(work.id)}" aria-label="查看作品：${escapeHtml(work.title)}">
              <div class="work-visual">${mediaHtml}</div>
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

  function stopLightboxMedia() {
    const media = lightboxVisual?.querySelector("video");
    if (media) {
      media.pause();
      media.removeAttribute("src");
      media.load();
    }
  }

  function openWork(id) {
    const work = works.find((item) => item.id === id);
    if (!work || !lightbox || !lightboxVisual) return;
    activeId = id;
    stopLightboxMedia();
    lightboxVisual.innerHTML = "";
    lightboxVisual.style.backgroundImage = "";
    lightboxVisual.className = "lightbox-visual";

    const url = getMediaUrl(work);
    const mediaType = getMediaType(work);

    if (mediaType === "video") {
      const video = document.createElement("video");
      video.src = url;
      video.controls = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.className = "lightbox-media";
      lightboxVisual.appendChild(video);
      video.play().catch(() => {});
    } else {
      const img = document.createElement("div");
      img.className = "lightbox-media lightbox-media--image";
      img.style.backgroundImage = `url("${url}")`;
      lightboxVisual.appendChild(img);
    }

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
    stopLightboxMedia();
    if (lightboxVisual) lightboxVisual.innerHTML = "";
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

  lightbox?.addEventListener("close", () => {
    stopLightboxMedia();
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
    if (!file) return;
    if (!isAllowedFile(file)) {
      if (formStatus) formStatus.textContent = "请上传图片或视频文件。";
      clearPreview();
      return;
    }
    setPreview(file);
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
    if (!file || !isAllowedFile(file)) {
      if (formStatus) formStatus.textContent = "请上传图片或视频文件。";
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
      formStatus.textContent = "请先选择图片或视频。";
      return;
    }
    if (!isAllowedFile(file)) {
      formStatus.textContent = "仅支持图片或视频文件。";
      return;
    }
    if (!title || !yearValue) {
      formStatus.textContent = "请填写标题和年份。";
      return;
    }

    const mediaType = isVideoFile(file) ? "video" : "image";
    const maxBytes = mediaType === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      formStatus.textContent =
        mediaType === "video"
          ? "视频请控制在 80MB 以内。"
          : "图片请控制在 8MB 以内。";
      return;
    }

    formStatus.textContent = "正在保存…";
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const work = {
        id: `work-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        category,
        categoryLabel: CATEGORY_LABELS[category] || category,
        year: yearValue,
        tools,
        description,
        mediaType,
        mediaMime: file.type,
        mediaBlob: file,
        createdAt: Date.now(),
      };
      await window.PortfolioStore.save(work);
      form.reset();
      if (yearInput) yearInput.value = String(new Date().getFullYear());
      clearPreview();
      formStatus.textContent = "已发布到作品墙。";
      await refreshWorks();
      document.getElementById("works")?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error(error);
      formStatus.textContent = "保存失败，文件可能过大，请压缩后重试。";
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

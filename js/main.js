(() => {
  const CATEGORY_LABELS = {
    image: "图像",
    video: "影像",
    concept: "概念",
  };

  const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
  const MAX_VIDEO_BYTES = 80 * 1024 * 1024;
  const ADMIN_KEY = "lichang-portfolio-admin";

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
  const navUpload = document.getElementById("nav-upload");
  const year = document.getElementById("year");
  const uploadSection = document.getElementById("upload");
  const form = document.getElementById("upload-form");
  const fileInput = document.getElementById("file-input");
  const dropzone = document.getElementById("dropzone");
  const dropzoneCopy = document.getElementById("dropzone-copy");
  const dropzonePreview = document.getElementById("dropzone-preview");
  const formStatus = document.getElementById("form-status");
  const categorySelect = form?.querySelector('[name="category"]');
  const yearInput = form?.querySelector('[name="year"]');
  const adminEntry = document.getElementById("admin-entry");
  const adminLogout = document.getElementById("admin-logout");
  const authDialog = document.getElementById("auth-dialog");
  const authForm = document.getElementById("auth-form");
  const authStatus = document.getElementById("auth-status");

  let works = [];
  let activeFilter = "all";
  let activeId = null;
  let pendingFile = null;
  let previewUrl = null;
  let isAdmin = sessionStorage.getItem(ADMIN_KEY) === "1";

  if (year) year.textContent = String(new Date().getFullYear());
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
    if (work.mediaPath && /\.(mp4|webm|mov|m4v)$/i.test(work.mediaPath)) return "video";
    return "image";
  }

  function getMediaUrl(work) {
    if (work.localPreviewUrl) return work.localPreviewUrl;
    if (work.mediaPath) return work.mediaPath;
    return "";
  }

  function setAdminMode(enabled) {
    isAdmin = Boolean(enabled);
    if (isAdmin) sessionStorage.setItem(ADMIN_KEY, "1");
    else {
      sessionStorage.removeItem(ADMIN_KEY);
      window.PortfolioStore.setToken("");
    }

    if (uploadSection) uploadSection.hidden = !isAdmin;
    if (navUpload) navUpload.hidden = !isAdmin;
    if (deleteBtn) deleteBtn.hidden = !isAdmin;
    document.body.classList.toggle("is-admin", isAdmin);
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
    works = await window.PortfolioStore.listPublic();
    works.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    renderWorks(activeFilter);
  }

  function renderWorks(filter = "all") {
    activeFilter = filter;
    if (!grid) return;

    const visible = works.filter((work) => filter === "all" || work.category === filter);

    if (worksCount) worksCount.textContent = `共 ${works.length} 件作品`;
    if (emptyEl) emptyEl.hidden = works.length > 0;

    grid.innerHTML = visible
      .map((work) => {
        const label = work.categoryLabel || CATEGORY_LABELS[work.category] || work.category;
        const tools = work.tools ? ` · ${escapeHtml(work.tools)}` : "";
        const mediaType = getMediaType(work);
        const url = getMediaUrl(work);
        const mediaHtml =
          mediaType === "video"
            ? `<video class="work-media" src="${escapeHtml(url)}" muted loop playsinline preload="metadata"></video>
               <span class="media-badge" aria-hidden="true">视频</span>`
            : `<div class="work-media work-media--image" style="background-image:url('${escapeHtml(url)}')"></div>`;

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
    if (deleteBtn) deleteBtn.hidden = !isAdmin;

    if (typeof lightbox.showModal === "function") lightbox.showModal();
    else lightbox.setAttribute("open", "");
  }

  function closeLightbox() {
    activeId = null;
    stopLightboxMedia();
    if (lightboxVisual) lightboxVisual.innerHTML = "";
    if (!lightbox) return;
    if (typeof lightbox.close === "function") lightbox.close();
    else lightbox.removeAttribute("open");
  }

  function openAuthDialog() {
    if (!authDialog) return;
    if (authStatus) authStatus.textContent = "";
    const tokenInput = authForm?.querySelector('[name="token"]');
    if (tokenInput) tokenInput.value = window.PortfolioStore.getToken() || "";
    if (typeof authDialog.showModal === "function") authDialog.showModal();
    else authDialog.setAttribute("open", "");
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
  lightbox?.addEventListener("close", stopLightboxMedia);

  deleteBtn?.addEventListener("click", async () => {
    if (!isAdmin || !activeId) return;
    if (!window.PortfolioStore.getToken()) {
      openAuthDialog();
      return;
    }
    if (!window.confirm("确定从公开作品墙删除吗？此操作会同步到 GitHub。")) return;

    deleteBtn.disabled = true;
    try {
      await window.PortfolioStore.deleteWork(activeId);
      closeLightbox();
      await refreshWorks();
      if (formStatus) formStatus.textContent = "已删除，访客刷新后将看不到该作品。";
    } catch (error) {
      console.error(error);
      window.alert(`删除失败：${error.message || error}`);
    } finally {
      deleteBtn.disabled = false;
    }
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

  adminEntry?.addEventListener("click", () => {
    if (isAdmin) {
      uploadSection?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    openAuthDialog();
  });

  adminLogout?.addEventListener("click", () => {
    setAdminMode(false);
    if (formStatus) formStatus.textContent = "已退出管理。";
  });

  authForm?.addEventListener("submit", (event) => {
    const submitter = event.submitter;
    const value = submitter?.value || "login";
    if (value === "cancel") {
      if (authStatus) authStatus.textContent = "";
      return;
    }

    event.preventDefault();
    const data = new FormData(authForm);
    const token = String(data.get("token") || "").trim();

    if (!token) {
      if (authStatus) authStatus.textContent = "请填写 GitHub Token。";
      return;
    }

    window.PortfolioStore.setToken(token);
    setAdminMode(true);
    if (typeof authDialog.close === "function") authDialog.close();
    else authDialog?.removeAttribute("open");
    uploadSection?.scrollIntoView({ behavior: "smooth" });
    if (formStatus) formStatus.textContent = "已进入管理模式，可以上传作品。";
  });

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
    if (!isAdmin) {
      openAuthDialog();
      return;
    }
    if (!formStatus) return;
    if (!window.PortfolioStore.getToken()) {
      openAuthDialog();
      return;
    }

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
        mediaType === "video" ? "视频请控制在 80MB 以内。" : "图片请控制在 8MB 以内。";
      return;
    }

    formStatus.textContent = "正在发布到 GitHub，请稍候…";
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
        createdAt: Date.now(),
      };
      const published = await window.PortfolioStore.publishWork(work, file);
      form.reset();
      if (yearInput) yearInput.value = String(new Date().getFullYear());
      clearPreview();
      formStatus.textContent = "已提交发布。约 1 分钟后全站访客可见，可先刷新本页。";
      await refreshWorks();
      // optimistic if Pages cache still old
      if (!works.find((item) => item.id === published.id)) {
        works = [published, ...works];
        renderWorks(activeFilter);
      }
      document.getElementById("works")?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error(error);
      formStatus.textContent = `发布失败：${error.message || "请检查 Token 权限后重试"}`;
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

  setAdminMode(isAdmin && Boolean(window.PortfolioStore.getToken()));

  refreshWorks().catch((error) => {
    console.error(error);
    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.textContent = "作品列表加载失败，请稍后刷新。";
    }
  });
})();

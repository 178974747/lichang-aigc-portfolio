(() => {
  const TOKEN_KEY = "lichang-portfolio-gh-token";

  function cfg() {
    return window.PORTFOLIO_CONFIG?.github || {};
  }

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  }

  function setToken(token) {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  }

  function apiUrl(path) {
    const { owner, repo } = cfg();
    return `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  }

  async function githubFetch(path, options = {}) {
    const token = getToken();
    if (!token) throw new Error("缺少 GitHub Token");

    const { branch } = cfg();
    const url = new URL(apiUrl(path));
    if (!options.method || options.method === "GET") {
      url.searchParams.set("ref", branch || "main");
    }

    const res = await fetch(url.toString(), {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      let detail = "";
      try {
        const body = await res.json();
        detail = body.message || JSON.stringify(body);
      } catch (_) {
        detail = res.statusText;
      }
      throw new Error(detail || `GitHub API ${res.status}`);
    }

    if (res.status === 204) return null;
    return res.json();
  }

  function bytesToBase64(bytes) {
    const chunk = 0x8000;
    let binary = "";
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  async function blobToBase64(blob) {
    const buffer = await blob.arrayBuffer();
    return bytesToBase64(new Uint8Array(buffer));
  }

  async function getFile(path) {
    try {
      return await githubFetch(path);
    } catch (error) {
      if (String(error.message).includes("Not Found")) return null;
      throw error;
    }
  }

  async function putFile(path, contentBase64, message, sha) {
    const { branch } = cfg();
    const body = {
      message,
      content: contentBase64,
      branch: branch || "main",
    };
    if (sha) body.sha = sha;
    return githubFetch(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function deleteFile(path, message, sha) {
    const { branch } = cfg();
    return githubFetch(path, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        sha,
        branch: branch || "main",
      }),
    });
  }

  window.PortfolioStore = {
    TOKEN_KEY,
    getToken,
    setToken,

    async listPublic() {
      const res = await fetch(`data/works.json?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("无法读取作品列表");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },

    async readRemoteWorks() {
      const { worksPath } = cfg();
      const file = await getFile(worksPath);
      if (!file) return { works: [], sha: null };
      const json = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ""))));
      const works = JSON.parse(json);
      return { works: Array.isArray(works) ? works : [], sha: file.sha };
    },

    async publishWork(work, file) {
      const { worksPath, mediaDir } = cfg();
      const ext = (file.name.split(".").pop() || (work.mediaType === "video" ? "mp4" : "jpg")).toLowerCase();
      const mediaPath = `${mediaDir}/${work.id}.${ext}`;

      const mediaBase64 = await blobToBase64(file);
      await putFile(mediaPath, mediaBase64, `Add media for ${work.title}`);

      const remote = await this.readRemoteWorks();
      const nextWorks = [
        { ...work, mediaPath },
        ...remote.works.filter((item) => item.id !== work.id),
      ];
      const worksBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(nextWorks, null, 2))));
      await putFile(worksPath, worksBase64, `Publish work: ${work.title}`, remote.sha || undefined);

      return { ...work, mediaPath };
    },

    async deleteWork(id) {
      const { worksPath } = cfg();
      const remote = await this.readRemoteWorks();
      const target = remote.works.find((item) => item.id === id);
      if (!target) throw new Error("作品不存在");

      const nextWorks = remote.works.filter((item) => item.id !== id);
      const worksBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(nextWorks, null, 2))));
      await putFile(worksPath, worksBase64, `Remove work: ${target.title}`, remote.sha);

      if (target.mediaPath) {
        const mediaFile = await getFile(target.mediaPath);
        if (mediaFile?.sha) {
          await deleteFile(target.mediaPath, `Remove media for ${target.title}`, mediaFile.sha);
        }
      }
    },
  };
})();

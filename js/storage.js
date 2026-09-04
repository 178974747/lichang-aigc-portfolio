(() => {
  const DB_NAME = "lichang-aigc-portfolio";
  const DB_VERSION = 1;
  const STORE = "works";

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function withStore(mode, fn) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      const result = fn(store);
      tx.oncomplete = () => {
        db.close();
        resolve(result);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  function requestToPromise(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  window.PortfolioStore = {
    async list() {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const store = tx.objectStore(STORE);
        const req = store.getAll();
        req.onsuccess = () => {
          const items = (req.result || []).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          db.close();
          resolve(items);
        };
        req.onerror = () => {
          db.close();
          reject(req.error);
        };
      });
    },

    async get(id) {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(id);
        req.onsuccess = () => {
          db.close();
          resolve(req.result || null);
        };
        req.onerror = () => {
          db.close();
          reject(req.error);
        };
      });
    },

    async save(work) {
      await withStore("readwrite", (store) => store.put(work));
      return work;
    },

    async remove(id) {
      await withStore("readwrite", (store) => store.delete(id));
    },
  };
})();

// localStorage-backed store for package_code values, keyed by collective ID.
// Needed because base44 Collective entity schema doesn't include package_code,
// so the API silently drops it. This persists on the user's device.

const KEY = (id) => `pkg_code_${id}`;

export const pkgCodeStore = {
  get(id) {
    if (!id) return '';
    return localStorage.getItem(KEY(id)) || '';
  },
  set(id, code) {
    if (!id) return;
    if (code) {
      localStorage.setItem(KEY(id), code);
    } else {
      localStorage.removeItem(KEY(id));
    }
  },
  getAll() {
    const result = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('pkg_code_')) {
        const id = key.replace('pkg_code_', '');
        result[id] = localStorage.getItem(key) || '';
      }
    }
    return result;
  },
};

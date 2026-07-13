// localStorage-backed store for drive_link values, keyed by collective ID.
// Needed because base44 Collective entity schema doesn't include drive_link,
// so the API silently drops it. This persists on the user's device.

const KEY = (id) => `pkg_drive_link_${id}`;

export const driveLinkStore = {
  get(id) {
    if (!id) return '';
    return localStorage.getItem(KEY(id)) || '';
  },
  set(id, url) {
    if (!id) return;
    if (url) {
      localStorage.setItem(KEY(id), url);
    } else {
      localStorage.removeItem(KEY(id));
    }
  },
  getAll() {
    const result = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('pkg_drive_link_')) {
        const id = key.replace('pkg_drive_link_', '');
        result[id] = localStorage.getItem(key) || '';
      }
    }
    return result;
  },
};

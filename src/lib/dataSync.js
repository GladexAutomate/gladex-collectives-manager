// Fire this after any CRUD mutation so all pages reload their data.
export function broadcastRefresh() {
  window.dispatchEvent(new CustomEvent('gladex:refresh'));
}

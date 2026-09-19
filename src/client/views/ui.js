import { esc } from "../core/model.js";
const paths = {
  next: "M9 5l7 7-7 7",
  prev: "M15 5l-7 7 7 7",
  play: "M8 4l12 8-12 8Z",
  pause: "M8 4v16M16 4v16",
  screen: "M3 3h18v13H3ZM8 21h8M12 16v5",
  close: "M6 6l12 12M6 18L18 6",
  plus: "M12 4v16M4 12h16",
  check: "M4 12l5 5L20 6",
  mic: "M9 3h6v12H9ZM5 10v2a7 7 0 0014 0v-2M12 19v3",
  clock: "M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  upload: "M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5",
  edit: "M15 4l5 5L9 20H4v-5ZM13 6l5 5",
  more: "M5 12h.1M12 12h.1M19 12h.1",
  black: "M3 4h18v16H3Z",
  volume: "M3 9h4l5-5v16l-5-5H3ZM16 8q5 4 0 8",
  grid: "M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z",
  undo: "M9 5L3 10l6 5M3 10h11a7 7 0 010 14",
  text: "M4 4h16M12 4v17M8 21h8",
  layers: "M3 8l9-5 9 5-9 5ZM3 13l9 5 9-5M3 18l9 5 9-5",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
  link: "M10 14l4-4M8 16l-1 1a4 4 0 01-6-6l4-4a4 4 0 016 0M16 8l1-1a4 4 0 016 6l-4 4a4 4 0 01-6 0",
};
export const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.more}"/></svg>`;
export const button = (action, label, ic = "", style = "", data = "") =>
  `<button type="button" data-action="${action}" class="${style}" ${data}>${ic ? icon(ic) : ""}${label}</button>`;
export function notify(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("show"), 5000);
}
export function dialog(title, html) {
  const modal = document.querySelector("#modal");
  modal.innerHTML = `<div class="dialog-head"><h2>${esc(title)}</h2>${button("close", "", "close", "icon", 'aria-label="Fermer"')}</div><div class="drawer-body">${html}</div>`;
  if (!modal.open) modal.showModal();
  return modal;
}
export function chooseFile(accept, callback) {
  const f = document.createElement("input");
  f.type = "file";
  f.accept = accept;
  f.style.display = "none";
  document.body.append(f);
  f.onchange = () => {
    const file = f.files[0];
    f.remove();
    if (file) Promise.resolve(callback(file)).catch((e) => notify(e.message));
  };
  f.oncancel = () => f.remove();
  f.click();
}

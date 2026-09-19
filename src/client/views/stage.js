import { esc, safeSource, formatTime } from "../core/model.js";
export function layerHTML(
  e,
  { editable = false, selected = false, media = false } = {},
) {
  const styles = [
    `left:${e.x}%`,
    `top:${e.y}%`,
    `width:${e.w}%`,
    `height:${e.h}%`,
    `transform:rotate(${e.rotation || 0}deg)`,
    `opacity:${e.opacity ?? 1}`,
    `border-radius:${e.radius || 0}px`,
  ];
  let content = "";
  if (e.type === "text") {
    styles.push(
      `font-size:${(e.fontSize || 36) / 16}cqw`,
      `font-family:${["Inter", "Georgia", "Arial", "Verdana"].includes(e.fontFamily) ? e.fontFamily : "Inter"},Arial,sans-serif`,
      `color:${safeColor(e.color)}`,
      `font-weight:${e.bold ? 700 : 400}`,
      `font-style:${e.italic ? "italic" : "normal"}`,
      `text-align:${["left", "center", "right"].includes(e.align) ? e.align : "left"}`,
    );
    content = `<div class="layer-text" ${editable ? 'spellcheck="true"' : ""}>${esc(e.text)}</div>`;
  } else if (e.type === "shape") {
    styles.push(
      `background:${safeColor(e.fill)}`,
      `border:${Number(e.borderWidth) || 0}px solid ${safeColor(e.borderColor)}`,
    );
  } else if (safeSource(e.src)) {
    if (e.type === "image")
      content = `<img draggable="false" alt="${esc(e.alt || "Illustration")}" src="${esc(e.src)}" style="object-fit:${e.fit === "cover" ? "cover" : "contain"}">`;
    if (e.type === "video")
      content = media
        ? `<video data-media playsinline preload="metadata" src="${esc(e.src)}" aria-label="${esc(e.alt || "Vidéo")}"></video>`
        : `<div class="media-placeholder"><span>▶</span><small>Vidéo</small></div>`;
    if (e.type === "audio")
      content = `<div class="sound-art">${[8, 20, 12, 36, 28, 48, 40, 24, 52, 32, 46, 26, 38, 50, 23, 35, 15, 25, 10].map((h) => `<i style="height:${h}%"></i>`).join("")}</div>${media ? `<audio data-media src="${esc(e.src)}" preload="metadata"></audio>` : ""}`;
  }
  return `<div class="layer ${editable ? "editable" : ""} ${selected ? "selected" : ""}" data-element="${esc(e.id)}" data-type="${e.type}" style="${styles.join(";")}">${content}${editable && selected ? '<button class="resize-handle" data-handle="resize" aria-label="Redimensionner"></button>' : ""}</div>`;
}
export const safeColor = (value) =>
  /^#[a-fA-F0-9]{3,8}$/.test(value || "") ? value : "#20233c";
export function stageHTML(
  slide,
  {
    session = {},
    editable = false,
    selected = null,
    media = false,
    animations = true,
  } = {},
) {
  return `<div class="stage ${editable ? "is-editing" : ""} ${animations && !editable && slide.transition !== "none" ? "animate" : ""}" data-slide="${esc(slide.id)}" style="background:${safeColor(slide.background)}">${slide.elements.map((e) => layerHTML(e, { editable, selected: e.id === selected, media })).join("")}${!editable && session.revealed && slide.answer ? `<div class="answer-panel"><div class="eyebrow">ON VÉRIFIE ENSEMBLE</div><h2>${esc(slide.answer)}</h2><p>${esc(slide.explanation)}</p><small>${esc(slide.source || "Exercice préparé pour cet atelier")}</small></div>` : ""}${!editable && session.black ? '<div class="blackout"></div>' : ""}</div>`;
}
/** Le minuteur public dispose de sa propre bande, hors de la surface des slides. */
export function activityHTML(doc) {
  const a = doc.session.activity;
  if (!a || !doc.preferences.showActivity) return "";
  return `<div class="public-activity"><span>${esc(a.label || "À vous de jouer")}</span><strong data-public-time>${formatTime(Math.max(0, a.end - Date.now()), false)}</strong><div class="activity-track"><i style="width:${Math.max(0, Math.min(100, ((a.end - Date.now()) / a.duration) * 100))}%"></i></div></div>`;
}
export function synchronizeMedia(container, session, enabled) {
  const media = container.querySelector("[data-media]");
  if (!media) return;
  const state = session.media;
  if (!enabled || !state || state.slideId !== session.slideId) {
    media.pause();
    return;
  }
  const target = Math.max(
    0,
    state.position + (state.playing ? (Date.now() - state.at) / 1000 : 0),
  );
  if (
    Number.isFinite(media.duration) &&
    Math.abs(media.currentTime - Math.min(target, media.duration)) > 0.8
  )
    media.currentTime = Math.min(target, media.duration);
  if (state.playing && media.paused && target < (media.duration || Infinity))
    media.play().catch(() => {});
  else if (!state.playing && !media.paused) media.pause();
}

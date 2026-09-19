import { defaultCourse, upgradeCourse, element } from "./core/course.js";
import {
  esc,
  clone,
  uid,
  initialDocument,
  moveSession,
  toggleClock,
  elapsed,
  sectionElapsed,
  formatTime,
  validateDocument,
  clamp,
} from "./core/model.js";
import { WorkshopStore } from "./core/sync.js";
import { ProjectionLink } from "./core/projection.js";
import { VoiceAssistant } from "./core/voice.js";
import { read, download, fileData } from "./core/storage.js";
import { stageHTML, activityHTML, synchronizeMedia } from "./views/stage.js";
import { button, icon, notify, dialog, chooseFile } from "./views/ui.js";
import { SlideEditor } from "./editor/editor.js";
import { printContent } from "./views/supports.js";
const $ = (s) => document.querySelector(s),
  root = $("#app"),
  modal = $("#modal"),
  params = new URLSearchParams(location.search),
  isProjector = params.get("view") === "projector",
  isPrint = params.get("view") === "print";
let tab = "pupitre",
  editor = null,
  publicEnabled = false,
  publicDoc = null,
  publicKey = "",
  activeTimers = new Map(),
  lastVisual = "",
  wakeLock;
const savedBeforeStart = await read("v2-document"),
  legacyCourse = !savedBeforeStart ? await read("course") : null;
const store = new WorkshopStore(
  legacyCourse ? upgradeCourse(legacyCourse) : defaultCourse,
  { readonly: isProjector || isPrint },
);
const doc = () => store.document,
  current = () =>
    doc().course.slides.find((s) => s.id === doc().session.slideId) ||
    doc().course.slides[0];
const voice = new VoiceAssistant({
  context: () =>
    `Atelier IA MJC pour collégiens et lycéens. Slide : ${current().title}. ${current()
      .elements.filter((e) => e.type === "text")
      .map((e) => e.text)
      .join(" ")}. Objectif : ${current().guide.say}`,
  preferences: () => doc().preferences,
  command: (action) => (action === "stop" ? voice.stop() : perform(action)),
  notify,
});
const projection = new ProjectionLink({
  projector: isProjector,
  onSnapshot: (d) => {
    publicDoc = d;
    renderPublic(d);
  },
});
function session(patch) {
  return store.dispatch({ kind: "session", patch });
}
async function go(id) {
  await session(moveSession(doc(), id));
  if (current().kind === "pause") voice.stop();
}
function defer(key, fn) {
  clearTimeout(activeTimers.get(key));
  activeTimers.set(
    key,
    setTimeout(() => {
      activeTimers.delete(key);
      fn().catch((e) => notify(e.message));
    }, 350),
  );
}
function statusText() {
  return (
    {
      loading: "Connexion…",
      saved: "Tout est synchronisé",
      saving: "Enregistrement…",
      offline: "Hors ligne · copie conservée",
      local: "Copie locale · secours",
      "storage-error": "Stockage local saturé",
    }[store.status] || store.status
  );
}
function header() {
  return `<header class="app-header"><div class="brand"><img src="icon.svg" alt=""><div>trame<small>MJC YVETOT · ATELIER IA</small></div></div><nav class="main-nav" aria-label="Navigation">${[
    ["pupitre", "Pupitre"],
    ["editor", "Éditer"],
    ["supports", "Supports"],
    ["settings", "Réglages"],
  ]
    .map(([id, label]) =>
      button(
        "tab",
        label,
        "",
        tab === id ? "active" : "quiet",
        `data-tab="${id}"`,
      ),
    )
    .join(
      "",
    )}</nav><div class="header-actions"><span class="sync-badge" id="sync-status" aria-live="polite"><i class="dot ${store.status === "saved" ? "ok" : "wait"}"></i>${statusText()}</span>${button("devices", "Appareils", "link", "quiet")}${button("export", '<span class="export-label">Sauvegarde</span>', "download", "quiet")}${button("project", "Projeter", "screen", "primary")}</div></header><div id="view-root"></div>`;
}
function presenter() {
  const d = doc(),
    s = current(),
    sec = d.course.sections.find((x) => x.id === s.section),
    i = d.course.slides.indexOf(s),
    guide = d.session.guide[s.id] || 0;
  return `<div class="main-frame"><main class="presenter"><section class="presentation-column"><div class="presentation-heading"><div><div class="eyebrow">${esc(sec?.title)}</div><h1>${esc(s.title)}</h1></div>${button("slide-picker", "${i+1}", "grid", "quiet").replace("${i+1}", `${i + 1} / ${d.course.slides.length}`)}</div><div class="stage-holder"><div class="stage-wrap" id="presenter-stage">${stageHTML(s, { session: d.session, media: true, animations: d.preferences.animations })}</div></div><div class="transport"><div class="row">${button("prev", "", "prev", "icon", `aria-label="Slide précédente" ${i === 0 ? "disabled" : ""}`)}${button("next", "Suivante", "next", "primary next", i === d.course.slides.length - 1 ? "disabled" : "")}<span class="projection-state" id="projection-state"><i class="dot"></i>Projection non ouverte</span></div><div class="row">${s.answer ? button("reveal", d.session.revealed ? "Masquer" : "Réponse", "", "", `aria-pressed="${d.session.revealed}"`) : ""}${s.elements.some((e) => ["audio", "video"].includes(e.type)) ? button("media", d.session.media?.playing ? "Pause" : "Lire", "volume") : ""}${button("black", "", "black", d.session.black ? "active icon" : "icon", 'aria-label="Écran noir"')}${button("slide-more", "", "more", "icon", 'aria-label="Actions de la slide"')}</div></div></section><aside class="guidance"><section class="guide-card"><div class="row spread"><h2>Votre fil conducteur</h2>${button("guide-edit", "", "edit", "quiet icon", 'aria-label="Modifier la trame de cette slide"')}</div><div class="guide-steps">${[
    ["say", "À dire"],
    ["do", "À faire"],
    ["participate", "Faire participer"],
  ]
    .map(
      ([key, label], n) =>
        `<div class="guide-step ${guide === n ? "current" : guide > n ? "done" : ""}" role="button" tabindex="0" data-action="guide-select" data-step="${n}"><div class="step-label"><span class="step-num">${guide > n ? "✓" : n + 1}</span>${label}</div><p>${esc(s.guide[key])}</p></div>`,
    )
    .join(
      "",
    )}</div><div class="guide-end"><small>${guide >= 3 ? "Cette slide est parcourue." : "La surbrillance suit vos validations."}</small>${button("guide-next", guide >= 3 ? "Slide suivante" : "C’est fait", guide >= 3 ? "next" : "check", "quiet")}</div></section><section class="voice-card"><div class="voice-orb"></div><div class="grow"><h3>Trame</h3><small id="voice-state">${esc(voice.status)}</small></div>${button("voice-panel", "Ouvrir", "mic", "quiet")}${button("voice-stop", "", "close", "quiet icon", 'aria-label="Couper immédiatement la voix et le micro"')}</section></aside></main><footer class="session-footer"><div class="pace-card"><div class="pace-ring" id="pace-ring"></div><div class="pace-text"><strong id="pace-title"></strong><small id="pace-detail"></small></div>${button("clock", d.session.running ? "Pause" : d.session.started ? "Reprendre" : "Commencer", d.session.running ? "pause" : "play", "quiet")}</div><nav class="section-strip" aria-label="Séquences">${d.course.sections.map((x, n) => button("section", `<i></i><span>${n + 1}</span>`, "", `section-chip ${x.id === s.section ? "current" : d.course.sections.indexOf(sec) > n ? "done" : ""}`, `data-section="${esc(x.id)}" title="${esc(x.title)} · ${x.minutes} min" aria-label="${esc(x.title)}"`)).join("")}</nav><div class="activity-pill"><span id="activity-pill">${d.session.activity ? "Activité en cours" : "Minuteur d’activité"}</span>${button("activity-panel", "", "clock", "icon", 'aria-label="Régler le minuteur d’activité"')}</div></footer></div>`;
}
function render() {
  if (isProjector) {
    renderPublic(publicDoc || doc());
    return;
  }
  if (isPrint) {
    document.body.className = "print-page";
    root.innerHTML = `<div class="print-toolbar row spread"><strong>Trame · supports</strong>${button("print", "Imprimer / PDF", "download")}</div>${printContent(params.get("type"), doc().course)}`;
    return;
  }
  if (editor && tab === "editor") {
    updateStatus();
    editor.refresh();
    return;
  }
  const editingForm =
    $("#view-root")?.contains(document.activeElement) &&
    /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if (editingForm) {
    updateStatus();
    return;
  }
  const oldStage = $("#presenter-stage .stage"),
    key = JSON.stringify({
      slide: current(),
      revealed: doc().session.revealed,
      black: doc().session.black,
      animations: doc().preferences.animations,
    });
  root.innerHTML = header();
  const view = $("#view-root");
  if (tab === "pupitre") {
    view.innerHTML = presenter();
    if (oldStage && key === lastVisual)
      $("#presenter-stage").replaceChildren(oldStage);
    lastVisual = key;
  }
  if (tab === "editor")
    editor = new SlideEditor(view, store, {
      media: importMedia,
      pdf: importPDF,
      notes: editGuide,
    });
  if (tab === "supports") view.innerHTML = supports();
  if (tab === "settings") view.innerHTML = settings();
  updateStatus();
  tick();
}
function updateStatus() {
  const e = $("#sync-status");
  if (e)
    e.innerHTML = `<i class="dot ${store.status === "saved" ? "ok" : "wait"}"></i>${esc(statusText())}`;
  const v = $("#voice-state");
  if (v) {
    v.textContent = voice.status;
    v.classList.toggle("micro-live", voice.listening || voice.talking);
  }
  const t = $("#voice-transcript");
  if (t)
    t.textContent =
      voice.lastText || "Posez une question, puis vérifiez la réponse.";
}
function tick() {
  if (isProjector) {
    const d = publicDoc || doc();
    const t = $("[data-public-time]");
    if (t && d.session.activity)
      t.textContent = formatTime(d.session.activity.end - Date.now());
    synchronizeMedia(root, d.session, publicEnabled);
    return;
  }
  if (tab !== "pupitre") return;
  const d = doc(),
    sec = d.course.sections.find((s) => s.id === current().section),
    used = sectionElapsed(d.session),
    budget = (sec?.minutes || 10) * 60000;
  if ($("#pace-ring"))
    $("#pace-ring").style.setProperty(
      "--progress",
      Math.min(100, (used / budget) * 100) + "%",
    );
  if ($("#pace-title"))
    $("#pace-title").textContent = !d.session.started
      ? "À votre rythme"
      : used <= budget
        ? `${formatTime(budget - used)} de repère`
        : "Vous pouvez conclure tranquillement";
  const prior = d.course.sections
      .slice(0, d.course.sections.indexOf(sec))
      .reduce((n, s) => n + s.minutes * 60000, 0),
    ahead = elapsed(d.session) - prior - used;
  if ($("#pace-detail"))
    $("#pace-detail").textContent = d.preferences.calm
      ? ahead > 5 * 60000
        ? "Option : raccourcir les bonus."
        : `${sec?.minutes || 10} min prévues · les pauses sont incluses`
      : `${formatTime(used, true)} dans la séquence · ${formatTime(elapsed(d.session), true)} au total`;
  if ($("#activity-pill"))
    $("#activity-pill").textContent = d.session.activity
      ? d.session.activity.end <= Date.now()
        ? "Activité terminée"
        : formatTime(d.session.activity.end - Date.now()) + " · activité"
      : "Minuteur d’activité";
  const p = $("#projection-state");
  if (p)
    p.innerHTML = `<i class="dot ${projection.confirmed ? "ok" : "wait"}"></i>${projection.confirmed ? "Projection confirmée" : projection.peer ? "Projection à vérifier" : "Projection non ouverte"}`;
  synchronizeMedia($("#presenter-stage"), d.session, !projection.confirmed);
  updateStatus();
}
function renderPublic(d) {
  document.body.className = "public-page";
  const s =
    d.course.slides.find((x) => x.id === d.session.slideId) ||
    d.course.slides[0];
  const key = JSON.stringify({
    s,
    black: d.session.black,
    revealed: d.session.revealed,
    animation: d.preferences.animations,
  });
  if (!$(".public-shell"))
    root.innerHTML = `<main class="public-shell"><div class="public-stage"></div><div id="public-rail"></div></main><div class="public-controls">${button("fullscreen", "Plein écran", "screen")}${button("public-audio", "Activer le son", "volume")}</div><div class="public-intro"><div><h1>Place aux jeunes.</h1><p>Placez cette fenêtre sur le vidéoprojecteur. Vos notes restent dans le pupitre.</p>${button("public-start", "Afficher les slides", "play", "accent")}</div></div>`;
  if (key !== publicKey) {
    $(".public-stage").innerHTML = stageHTML(s, {
      session: d.session,
      media: true,
      animations: d.preferences.animations,
    });
    publicKey = key;
  }
  $("#public-rail").innerHTML = activityHTML(d);
  $(".public-shell").style.setProperty(
    "--rail",
    d.session.activity && d.preferences.showActivity ? "52px" : "0px",
  );
  if (publicEnabled) $(".public-intro")?.remove();
  synchronizeMedia(root, d.session, publicEnabled);
}
function supports() {
  return `<main class="page-content"><div class="page-title"><div><h1>Les supports, au même endroit.</h1><p>Ils suivent le cours partagé. Ouvrez-les pour imprimer ou enregistrer en PDF.</p><p><a href="documents/fiche-seance.pdf" target="_blank" rel="noopener">Fiche de séance pédagogique</a> · <a href="documents/slides-secours.pdf" download>Slides de secours</a> · <a href="documents/supports.pdf" download>Supports préparés</a></p></div></div><div class="cards">${[
    ["memo", "Le mémo", "Six réflexes à emporter."],
    ["missions", "Les cinq missions", "Créer, tester et expliquer en binômes."],
    ["enquete", "L’enquête", "La fiche source fictive et son corrigé."],
    ["trame", "Votre trame", "À dire, à faire et faire participer."],
    ["sortie", "Le billet de sortie", "Trois questions pour retenir."],
    ["slides", "Le cours", "Les slides dans leur disposition actuelle."],
  ]
    .map(
      ([id, title, body], i) =>
        `<section class="card"><span class="card-number">0${i + 1} / SUPPORT</span><h2>${title}</h2><p>${body}</p><div class="card-actions">${button("support", "Ouvrir", "download", "", `data-type="${id}"`)}${["memo", "missions", "enquete"].includes(id) ? button("support-edit", "Modifier", "edit", "quiet", `data-type="${id}"`) : ""}</div></section>`,
    )
    .join("")}</div></main>`;
}
function settings() {
  const d = doc();
  return `<main class="page-content"><div class="page-title"><div><h1>Les réglages de l’atelier.</h1><p>Chaque modification est enregistrée automatiquement.</p></div></div><div class="settings-grid"><section class="card"><h2>Votre séance</h2><label>Titre<input data-course="title" value="${esc(d.course.title)}"></label><label>Lieu<input data-course="venue" value="${esc(d.course.venue)}"></label><div class="two-col"><label>Date<input type="date" data-course="date" value="${esc(d.course.date)}"></label><label>Début<input type="time" data-course="startTime" value="${esc(d.course.startTime)}"></label></div><label><input type="checkbox" data-preference="calm" ${d.preferences.calm ? "checked" : ""}>Repères de temps discrets, sans secondes</label><label><input type="checkbox" data-preference="animations" ${d.preferences.animations ? "checked" : ""}>Transitions légères</label><div class="row wrap">${button("import", "Importer une sauvegarde", "upload")}${button("export", "Exporter", "download")}${button("reset-course", "Cours MJC retravaillé", "", "quiet")}</div><p class="muted">Remplacer le cours est une action volontaire. Les retouches existantes ne sont jamais supprimées à l’arrivée d’une mise à jour.</p></section><section class="card check-list"><h2>La répétition générale</h2>${d.course.checklist.map((t, i) => `<label><input type="checkbox" data-check="${i}" ${d.checklist[i] ? "checked" : ""}>${esc(t)}</label>`).join("")}</section><section class="card"><h2>Le déroulé · ${d.course.sections.reduce((n, s) => n + s.minutes, 0)} minutes</h2><p class="muted">Les séquences s’enchaînent au changement de slide. Le temps est un repère : rien n’avance sans vous.</p>${d.course.sections.map((s) => `<div class="note-row"><span>${esc(s.title)}</span><input type="number" min="1" max="180" data-duration="${esc(s.id)}" value="${s.minutes}" aria-label="Durée de ${esc(s.title)}"></div>`).join("")}</section><section class="card"><h2>Appareils & mémoire</h2><p>${store.cloud ? "Cet espace privé conserve le cours, les médias, les réglages et l’avancement sur le serveur. Connectez-vous à la même adresse sur un autre appareil." : "Cette copie GitHub est un secours local. Utilisez l’espace privé pour synchroniser vos appareils."}</p><div class="notice">Un seul pupitre pilote le direct. Les autres appareils peuvent éditer ; ils doivent prendre la main pour changer la slide projetée.</div>${button("devices", "Voir les appareils", "link")}<h2 style="margin-top:25px">Voix et écoute</h2><p>La voix IA naturelle nécessite un fournisseur connecté. Les commandes vocales peuvent fonctionner séparément, selon le navigateur.</p>${button("voice-panel", "Configurer Trame", "mic")}<p class="muted">Pas de reconnaissance biométrique de votre seule voix. Le bouton d’arrêt et les raccourcis restent toujours accessibles.</p></section></div></main>`;
}
function editGuide(slideId) {
  const s = doc().course.slides.find((x) => x.id === slideId);
  dialog(
    "Votre trame · " + s.title,
    `${[
      ["say", "À dire"],
      ["do", "À faire"],
      ["participate", "Faire participer"],
    ]
      .map(
        ([k, t]) =>
          `<label>${t}<textarea rows="3" data-guide-field="${k}" data-slide="${esc(s.id)}">${esc(s.guide[k])}</textarea></label>`,
      )
      .join(
        "",
      )}<p class="muted" style="font-size:12px">Enregistrement automatique. Ces textes ne sont jamais affichés au public.</p>`,
  );
}
function voicePanel() {
  dialog(
    "Trame · voix et commandes",
    `<div class="row spread"><strong>${voice.connected ? "IA connectée" : "Aucune IA connectée"}</strong>${button("voice-connect", "Connecter la voix IA", "", "primary")}</div><p class="notice">Sans accès API, aucune réponse IA n’est produite dans cette application. Vous pouvez ouvrir le mode vocal de ChatGPT sur votre compte ; il reste séparé du pilotage des slides.</p><div class="row wrap"><a href="https://chatgpt.com/" target="_blank" rel="noopener">Ouvrir ChatGPT</a>${button("context", "Copier le contexte")}${button("voice-listen", voice.wanted ? "Couper l’écoute" : "Écouter le mot-clé", "mic")}${button("voice-stop", "Tout arrêter", "close")}</div><div class="voice-transcript" id="voice-transcript">${esc(voice.lastText || "« Trame, suivante » · « Tram, montre la réponse »")}</div><label>Question à l’IA<input id="voice-question" placeholder="Posez une question courte…"></label><div class="row">${button("voice-ask", "Demander")}${button("voice-talk", "Parler / terminer", "mic")}</div><hr style="border:0;border-top:1px solid var(--line);margin:20px 0"><label>Variantes du mot-clé (séparées par une virgule)<input data-aliases value="${esc(doc().preferences.aliases.join(", "))}"></label><label>Durée choisie<select data-preference="voiceDuration">${[
      [0, "Jusqu’à mon arrêt"],
      [30, "30 minutes"],
      [60, "1 heure"],
      [210, "Tout l’après-midi (3 h 30)"],
    ]
      .map(
        ([n, t]) =>
          `<option value="${n}" ${Number(doc().preferences.voiceDuration) === n ? "selected" : ""}>${t}</option>`,
      )
      .join(
        "",
      )}</select></label><label><input type="checkbox" data-preference="voiceContext" ${doc().preferences.voiceContext ? "checked" : ""}>Contexte récent : deux minutes en mémoire, jamais dans les sauvegardes</label><p class="muted" style="font-size:12px;line-height:1.6">Le navigateur peut transmettre le son à son prestataire. L’écoute est visible et volontaire. Toute voix peut activer le mot-clé ; annoncer cette règle au groupe. Trame suspend l’écoute pendant sa réponse, puis la reprend. Les connexions du fournisseur peuvent être renouvelées, sans promesse d’écoute illimitée.</p>`,
  );
}
async function importMedia(slideId, elementId = null) {
  chooseFile(
    "image/png,image/jpeg,image/webp,image/gif,audio/mpeg,audio/wav,audio/ogg,video/mp4,video/webm",
    async (file) => {
      const src = await store.addMedia(file),
        type = file.type.split("/")[0];
      if (!["image", "audio", "video"].includes(type))
        throw Error("Média non pris en charge.");
      if (elementId)
        await store.dispatch({
          kind: "element",
          slideId,
          elementId,
          patch: { src, type },
        });
      else
        await store.dispatch({
          kind: "insertElement",
          slideId,
          element: element(type, 15, 30, 70, 55, {
            src,
            alt: file.name,
            fit: "contain",
            radius: 16,
          }),
        });
      notify("Média ajouté et enregistré.");
    },
  );
}
async function importPDF(slideId) {
  chooseFile(".pdf", async (file) => {
    if (file.size > 50 * 1024 * 1024) throw Error("PDF limité à 50 Mo.");
    notify("Préparation du PDF…");
    const pdfjs = await import("./vendor/pdf.min.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "./vendor/pdf.worker.min.mjs",
      import.meta.url,
    ).href;
    const pdf = await pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      isEvalSupported: false,
    }).promise;
    const preview = await pdf.getPage(1),
      vp = preview.getViewport({ scale: 0.35 }),
      canvas = document.createElement("canvas");
    canvas.width = vp.width;
    canvas.height = vp.height;
    await preview.render({
      canvasContext: canvas.getContext("2d"),
      viewport: vp,
    }).promise;
    dialog(
      "Importer une présentation",
      `<div class="row" style="align-items:flex-start;margin-bottom:20px"><img src="${canvas.toDataURL()}" style="width:42%;border-radius:8px" alt="Première page du PDF"><div><h3>${esc(file.name)}</h3><p style="font-size:12px;margin-top:10px">${pdf.numPages} pages. La mise en page est conservée ; les pages PDF deviennent des images. Vous pourrez ajouter des textes et formes par-dessus.</p></div></div><form id="pdf-form"><label>Pages à importer<input name="pages" value="1-${pdf.numPages}" required></label><label>Où les placer ?<select name="mode"><option value="append">Après la slide sélectionnée</option><option value="replace">Remplacer sa mise en page (une page)</option></select></label><button class="primary">Importer et enregistrer</button><p id="pdf-progress" class="muted" style="font-size:12px;margin-top:12px"></p></form>`,
    );
    $("#pdf-form").onsubmit = async (event) => {
      event.preventDefault();
      const form = new FormData(event.target),
        pages = [];
      try {
        for (const part of form.get("pages").split(",")) {
          const match = part.trim().match(/^(\d+)(?:-(\d+))?$/);
          if (!match) throw Error("Indiquez par exemple 1,3-5.");
          const a = +match[1],
            b = +(match[2] || a);
          if (a < 1 || b < a || b > pdf.numPages || b - a > 80)
            throw Error("Pages hors limites.");
          for (let n = a; n <= b; n++) pages.push(n);
        }
        if (form.get("mode") === "replace" && pages.length !== 1)
          throw Error("Choisissez une seule page pour un remplacement.");
        if (
          form.get("mode") !== "replace" &&
          doc().course.slides.length + pages.length > 200
        )
          throw Error("Maximum : 200 slides.");
        event.target.querySelector("button").disabled = true;
        let index = doc().course.slides.findIndex((s) => s.id === slideId) + 1;
        const original = doc().course.slides[index - 1];
        for (let i = 0; i < pages.length; i++) {
          const page = await pdf.getPage(pages[i]),
            normal = page.getViewport({ scale: 1 }),
            v = page.getViewport({ scale: 1920 / normal.width }),
            cv = document.createElement("canvas");
          cv.width = v.width;
          cv.height = v.height;
          await page.render({ canvasContext: cv.getContext("2d"), viewport: v })
            .promise;
          const media = element("image", 0, 0, 100, 100, {
            src: cv.toDataURL("image/jpeg", 0.9),
            alt: `${file.name} · page ${pages[i]}`,
            fit: "contain",
          });
          if (form.get("mode") === "replace")
            await store.dispatch({
              kind: "slide",
              slideId,
              patch: { elements: [media], background: "#191c3b" },
            });
          else {
            const slide = {
              id: uid(),
              section: original.section,
              title: `${file.name} · ${pages[i]}`,
              kind: "media",
              theme: "light",
              background: "#191c3b",
              body: [],
              subtitle: "",
              elements: [media],
              guide: {
                say: "Présenter l’idée de cette page.",
                do: "Afficher et laisser lire.",
                participate: "Inviter une réaction ou une question.",
              },
              transition: "fade",
            };
            await store.dispatch({
              kind: "insertSlide",
              slide,
              index: index++,
            });
          }
          $("#pdf-progress").textContent =
            `${i + 1} / ${pages.length} pages enregistrées.`;
        }
        modal.close();
        editor?.refresh();
        notify("PDF importé. Les notes de la slide remplacée sont conservées.");
      } catch (e) {
        notify(e.message);
        event.target.querySelector("button").disabled = false;
      }
    };
  });
}
async function exportBackup() {
  notify("Préparation de la sauvegarde complète…");
  const backup = clone(doc()),
    assets = new Map();
  for (const s of backup.course.slides)
    for (const e of s.elements)
      if (e.src && !e.src.startsWith("data:")) {
        if (!assets.has(e.src)) {
          const r = await fetch(e.src);
          if (!r.ok)
            throw Error("Un média est indisponible. Réessayez en ligne.");
          assets.set(e.src, await fileData(await r.blob()));
        }
        e.src = assets.get(e.src);
      }
  download(
    "Trame-MJC-" + new Date().toISOString().slice(0, 10) + ".trame",
    JSON.stringify({ format: "trame-backup", version: 2, document: backup }),
  );
  notify("Sauvegarde téléchargée, médias compris.");
}
async function importBackup() {
  chooseFile(".trame,.json", async (file) => {
    if (file.size > 150 * 1024 * 1024)
      throw Error("Sauvegarde limitée à 150 Mo.");
    const data = JSON.parse(await file.text());
    let d;
    if (data.version === 2) d = validateDocument(data.document);
    else if (data.course) {
      d = initialDocument(upgradeCourse(data.course));
      d.checklist = data.checklist || {};
      d.session.slideId =
        d.course.slides[
          Math.min(data.state?.index || 0, d.course.slides.length - 1)
        ].id;
    } else throw Error("Sauvegarde non reconnue.");
    d.session.elapsed = elapsed(d.session);
    d.session.sectionElapsed = sectionElapsed(d.session);
    d.session.running = false;
    d.session.activity = null;
    d.session.media = null;
    if (
      !confirm(
        "Remplacer le cours partagé par cette sauvegarde ? Les appareils recevront cette version.",
      )
    )
      return;
    await store.dispatch({ kind: "replace", document: d });
    notify("Atelier importé. La séance est en pause.");
  });
}
function editSupport(type) {
  const c = doc().course;
  if (type === "enquete") {
    dialog(
      "Modifier l’enquête",
      `<label>La fiche source<textarea rows="8" data-course="sourceText">${esc(c.sourceText)}</textarea></label><label>Le corrigé<textarea rows="5" data-course="sourceAnswer">${esc(c.sourceAnswer)}</textarea></label><small>Enregistrement automatique.</small>`,
    );
    return;
  }
  dialog(
    type === "memo" ? "Modifier le mémo" : "Modifier les missions",
    c[type]
      .map(
        (m, i) =>
          `<section style="margin-bottom:25px"><h3 style="margin-bottom:12px">${i + 1}. ${esc(m.title)}</h3>${Object.entries(
            m,
          )
            .map(
              ([k, v]) =>
                `<label>${esc({ title: "Titre", text: "Texte", task: "Mission", prompt: "Demande de départ", check: "À vérifier", human: "Contribution humaine", advanced: "Pour aller plus loin" }[k] || k)}<textarea data-support="${type}" data-index="${i}" data-key="${k}">${esc(v)}</textarea></label>`,
            )
            .join("")}</section>`,
      )
      .join(""),
  );
}
async function perform(action, b = { dataset: {} }) {
  try {
    const d = doc(),
      s = current(),
      index = d.course.slides.indexOf(s);
    if (action === "tab") {
      editor?.destroy();
      editor = null;
      tab = b.dataset.tab;
      render();
      return;
    }
    if (action === "next" || action === "prev") {
      let target = index + (action === "next" ? 1 : -1);
      const sec = d.course.sections.find((x) => x.id === s.section);
      if (
        action === "next" &&
        sectionElapsed(d.session) > (sec.minutes - 2) * 60000
      )
        while (d.course.slides[target]?.bonus) target++;
      target = clamp(target, 0, d.course.slides.length - 1);
      await go(d.course.slides[target].id);
    }
    if (action === "section") {
      const target = d.course.slides.find(
        (x) => x.section === b.dataset.section,
      );
      if (target) await go(target.id);
    }
    if (action === "reveal") {
      await session({
        revealed: !d.session.revealed,
        guide: { ...d.session.guide, [s.id]: 2 },
      });
    }
    if (action === "black") {
      await session({ black: !d.session.black });
      if (doc().session.black) voice.stop();
    }
    if (action === "clock") {
      await session(toggleClock(d.session));
      if (doc().session.running && "wakeLock" in navigator)
        try {
          wakeLock = await navigator.wakeLock.request("screen");
        } catch {}
    }
    if (action === "guide-select")
      await session({
        guide: { ...d.session.guide, [s.id]: Number(b.dataset.step) },
      });
    if (action === "guide-next") {
      const n = d.session.guide[s.id] || 0;
      if (n >= 3) await perform("next");
      else await session({ guide: { ...d.session.guide, [s.id]: n + 1 } });
    }
    if (action === "guide-edit") editGuide(s.id);
    if (action === "project") {
      if (!projection.open())
        notify("Autorisez les fenêtres surgissantes puis réessayez.");
      else
        notify(
          "Déplacez la fenêtre sur le vidéoprojecteur et activez l’affichage.",
        );
    }
    if (action === "public-start") {
      publicEnabled = true;
      $(".public-intro")?.remove();
      document.documentElement.requestFullscreen?.().catch(() => {});
      synchronizeMedia(root, (publicDoc || d).session, true);
    }
    if (action === "fullscreen") document.documentElement.requestFullscreen?.();
    if (action === "public-audio") {
      publicEnabled = true;
      synchronizeMedia(root, (publicDoc || d).session, true);
    }
    if (action === "media") {
      const m = d.session.media,
        position =
          m && m.slideId === s.id
            ? m.position + (m.playing ? (Date.now() - m.at) / 1000 : 0)
            : 0;
      await session({
        media: {
          slideId: s.id,
          playing: !m?.playing,
          position,
          at: Date.now(),
        },
      });
    }
    if (action === "slide-more")
      dialog(
        "Actions de la slide",
        `<div class="row wrap">${button("edit-current", "Modifier la mise en page", "edit")}${button("guide-edit", "Modifier la trame")}${button("restart-media", "Reprendre le média au début")}${s.answer ? button("votes", "Compter les votes") : ""}</div><p class="notice">Raccourcis : flèches pour naviguer, R pour révéler, B pour masquer, Échap pour arrêter le micro et la voix.</p>`,
      );
    if (action === "edit-current") {
      modal.close();
      tab = "editor";
      render();
    }
    if (action === "restart-media")
      await session({
        media: { slideId: s.id, playing: false, position: 0, at: Date.now() },
      });
    if (action === "votes")
      dialog(
        "Votes du groupe",
        `<p>Comptez les mains levées, sans identifier les personnes.</p><div class="votes">${["IA", "Sans IA", "On ne sait pas"].map((v, i) => button("vote", `${v} · ${d.session.votes[i]}`, "", "", `data-vote="${i}"`)).join("")}</div>${button("votes-reset", "Recommencer")}`,
      );
    if (action === "vote") {
      const votes = [...d.session.votes];
      votes[+b.dataset.vote]++;
      await session({ votes });
      perform("votes");
    }
    if (action === "votes-reset") {
      await session({ votes: [0, 0, 0] });
      perform("votes");
    }
    if (action === "slide-picker")
      dialog(
        "Aller à une slide",
        `<input id="slide-search" type="search" placeholder="Rechercher dans le cours…" aria-label="Rechercher une slide"><div id="slide-results" style="margin-top:15px">${d.course.slides.map((x, i) => button("pick-slide", `${i + 1}. ${esc(x.title)}`, "", "quiet", `data-id="${esc(x.id)}" style="display:block;width:100%;text-align:left;white-space:normal;justify-content:start"`)).join("")}</div>`,
      );
    if (action === "pick-slide") {
      await go(b.dataset.id);
      modal.close();
    }
    if (action === "activity-panel")
      dialog(
        "Un repère pour l’activité",
        `<p style="font-size:13px;margin-bottom:18px">Le minuteur apparaît dans une bande séparée, jamais par-dessus la slide. Il ne change pas de slide à votre place.</p><label>Nom<input id="activity-name" value="${esc(d.session.activity?.label || "À vous de jouer")}"></label><label>Durée en minutes<input id="activity-minutes" type="number" min="1" max="90" value="5"></label><label><input type="checkbox" data-preference="showActivity" ${d.preferences.showActivity ? "checked" : ""}>Montrer le repère au public</label><div class="row">${button("activity-start", "Lancer", "play", "primary")}${button("activity-clear", "Effacer")}</div>`,
      );
    if (action === "activity-start") {
      const minutes = clamp($("#activity-minutes").value, 1, 90);
      await session({
        activity: {
          label: $("#activity-name").value,
          duration: minutes * 60000,
          end: Date.now() + minutes * 60000,
        },
        guide: { ...d.session.guide, [s.id]: 2 },
      });
      modal.close();
    }
    if (action === "activity-clear") {
      await session({ activity: null });
      modal.close();
    }
    if (action === "devices")
      dialog(
        "Le même atelier sur vos appareils",
        `<h3>${store.cloud ? "Espace privé synchronisé" : "Copie locale"}</h3><p style="font-size:13px;margin:12px 0">${store.cloud ? "Ouvrez cette adresse et connectez-vous avec le même compte sur chaque appareil. Les modifications et les médias se retrouvent automatiquement." : "GitHub Pages ne conserve pas de données partagées. Ouvrez l’espace privé pour la synchronisation ; cette copie reste utilisable en secours."}</p><p><a href="https://trame-mjc-atelier.dusky-lily-8551.chatgpt.site" target="_blank" rel="noopener">Ouvrir l’espace privé Trame</a></p><div class="notice">${store.isController ? "Cet appareil pilote actuellement la séance." : `Pilotage : ${esc(store.controllerName || "autre pupitre")}. Vous pouvez modifier le cours sans changer la slide affichée.`}</div><div class="row">${button("take-control", "Piloter depuis cet appareil", "screen", "primary")}${button("copy-url", "Copier l’adresse")}</div><p class="muted" style="font-size:12px;margin-top:15px">Après une coupure, les retouches en attente sont conservées et renvoyées. Une sauvegarde exportée reste utile pour le secours et l’archivage.</p>`,
      );
    if (action === "take-control") {
      const ok = await store.claim(true);
      if (ok) notify("Cet appareil pilote le direct.");
      else notify("La prise de main n’a pas abouti.");
      modal.close();
      render();
    }
    if (action === "copy-url") {
      await navigator.clipboard.writeText(location.origin + location.pathname);
      notify("Adresse copiée.");
    }
    if (action === "export") await exportBackup();
    if (action === "import") await importBackup();
    if (action === "support")
      window.open(`?view=print&type=${b.dataset.type}`, "_blank");
    if (action === "support-edit") editSupport(b.dataset.type);
    if (action === "print") window.print();
    if (action === "voice-panel") voicePanel();
    if (action === "voice-connect") {
      await voice.connect();
      voicePanel();
    }
    if (action === "voice-listen") {
      if (voice.wanted) voice.stopListening();
      else voice.startListening();
      voicePanel();
    }
    if (action === "voice-stop") voice.stop();
    if (action === "voice-ask") {
      await voice.ask($("#voice-question").value);
      $("#voice-question").value = "";
    }
    if (action === "voice-talk") voice.toggleTalk();
    if (action === "context") {
      await navigator.clipboard.writeText(
        voice.context() +
          "\nRéponds en français pour des adolescents, en moins de 40 secondes. Signale tes incertitudes. Question : ",
      );
      notify("Contexte copié. Collez-le dans ChatGPT.");
    }
    if (
      action === "reset-course" &&
      confirm(
        "Remplacer le cours partagé par le cours MJC retravaillé ? Exportez une sauvegarde pour conserver les retouches actuelles.",
      )
    ) {
      await store.dispatch({
        kind: "replace",
        document: initialDocument(clone(defaultCourse)),
      });
      notify("Cours MJC retravaillé chargé.");
    }
    if (action === "close") modal.close();
  } catch (error) {
    console.error(error);
    notify(error.message);
  }
}
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (button && !button.dataset.action.startsWith("ed-"))
    perform(button.dataset.action, button);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    voice.stop();
    return;
  }
  if (
    modal.open ||
    tab === "editor" ||
    isProjector ||
    isPrint ||
    event.target.isContentEditable ||
    /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)
  )
    return;
  const action = {
    ArrowRight: "next",
    PageDown: "next",
    " ": "guide-next",
    ArrowLeft: "prev",
    PageUp: "prev",
    r: "reveal",
    b: "black",
  }[event.key];
  if (action) {
    event.preventDefault();
    perform(action);
  }
  if (
    event.key === "Enter" &&
    event.target.getAttribute("role") === "button" &&
    event.target.dataset.action
  ) {
    event.preventDefault();
    perform(event.target.dataset.action, event.target);
  }
});
async function settingInput(t) {
  if (t.dataset.course) {
    await store.dispatch({
      kind: "course",
      patch: { [t.dataset.course]: t.value },
    });
  }
  if (t.dataset.preference) {
    const key = t.dataset.preference,
      value =
        t.type === "checkbox"
          ? t.checked
          : key === "voiceDuration"
            ? Number(t.value)
            : t.value;
    await store.dispatch({ kind: "preferences", patch: { [key]: value } });
    if (key === "voiceDuration") voice.setDuration();
  }
  if (t.dataset.aliases !== undefined) {
    const aliases = t.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12);
    await store.dispatch({
      kind: "preferences",
      patch: { aliases: aliases.length ? aliases : ["trame", "tram"] },
    });
  }
  if (t.dataset.check !== undefined)
    await store.dispatch({
      kind: "checklist",
      patch: { [t.dataset.check]: t.checked },
    });
  if (t.dataset.duration) {
    const minutes = clamp(t.value, 1, 180);
    await store.dispatch({
      kind: "section",
      sectionId: t.dataset.duration,
      patch: { minutes },
    });
  }
  if (t.dataset.guideField) {
    const s = doc().course.slides.find((s) => s.id === t.dataset.slide);
    await store.dispatch({
      kind: "guide",
      slideId: s.id,
      patch: { [t.dataset.guideField]: t.value },
    });
  }
  if (t.dataset.support) {
    await store.dispatch({
      kind: "support",
      support: t.dataset.support,
      index: +t.dataset.index,
      patch: { [t.dataset.key]: t.value },
    });
  }
}
document.addEventListener("input", (event) => {
  const t = event.target;
  if (t.id === "slide-search") {
    for (const b of $("#slide-results").children)
      b.hidden = !b.textContent.toLowerCase().includes(t.value.toLowerCase());
    return;
  }
  if (
    t.matches("[data-course],[data-guide-field],[data-support],[data-aliases]")
  )
    defer(
      t.dataset.course ||
        t.dataset.guideField ||
        t.dataset.support + t.dataset.index + t.dataset.key ||
        "aliases",
      () => settingInput(t),
    );
});
document.addEventListener("change", (event) => {
  const t = event.target;
  if (t.matches("[data-preference],[data-check],[data-duration]"))
    settingInput(t).catch((e) => notify(e.message));
});
let lastDocumentState = "";
store.addEventListener("change", () => {
  const signature = JSON.stringify([doc(), store.status, store.isController]);
  if (signature === lastDocumentState) {
    updateStatus();
    return;
  }
  lastDocumentState = signature;
  if (isProjector) {
    if (Date.now() - (projection.receivedAt || 0) > 2200) renderPublic(doc());
    return;
  }
  render();
  if (store.isController) projection.publish(doc());
  else projection.suspend();
});
store.addEventListener("notice", (event) => notify(event.detail));
voice.addEventListener("change", updateStatus);
projection.addEventListener("ack", tick);
await store.init();
// La migration est proposée ; les anciennes retouches ne sont jamais remplacées silencieusement.
if (!isProjector && !isPrint && !store.cloud) {
  const old = await read("course");
  if (old && !(await read("v2-document")))
    notify(
      "Une ancienne version est présente. Exportez-la puis importez sa sauvegarde pour conserver vos retouches.",
    );
}
render();
if (store.isController) projection.publish(doc());
setInterval(() => {
  tick();
  if (isProjector && Date.now() - (projection.receivedAt || 0) > 2200)
    renderPublic(doc());
}, 300);
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("./sw.js").catch(() => {});
window.addEventListener("pagehide", () => {
  editor?.flush();
  voice.stop();
  wakeLock?.release();
});

/** Modèle commun : aucune fenêtre ne possède sa propre version du cours. */
export const clone = (value) => structuredClone(value);
export const uid = () => crypto.randomUUID();
export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const clamp = (n, min, max) =>
  Math.max(min, Math.min(max, Number(n) || 0));
export function initialDocument(course) {
  return {
    schema: 2,
    course,
    session: {
      slideId: course.slides[0].id,
      revealed: false,
      black: false,
      started: false,
      running: false,
      elapsed: 0,
      anchor: 0,
      sectionId: course.slides[0].section,
      sectionElapsed: 0,
      sections: {},
      guide: {},
      votes: [0, 0, 0],
      activity: null,
      media: null,
    },
    preferences: {
      calm: true,
      animations: true,
      showActivity: false,
      voiceDuration: 0,
      aliases: ["trame", "tram", "tramme", "traam"],
    },
    checklist: {},
  };
}
export function elapsed(session, now = Date.now()) {
  return Math.max(
    0,
    session.elapsed + (session.running ? now - session.anchor : 0),
  );
}
export function sectionElapsed(session, now = Date.now()) {
  return Math.max(
    0,
    session.sectionElapsed + (session.running ? now - session.anchor : 0),
  );
}
export function moveSession(doc, slideId, now = Date.now()) {
  const slide = doc.course.slides.find((s) => s.id === slideId);
  if (!slide) return {};
  const s = doc.session,
    oldTime = sectionElapsed(s, now);
  return {
    ...s,
    slideId,
    revealed: false,
    votes: [0, 0, 0],
    media: null,
    elapsed: elapsed(s, now),
    anchor: now,
    sectionId: slide.section,
    sectionElapsed:
      slide.section === s.sectionId ? oldTime : s.sections[slide.section] || 0,
    sections: { ...s.sections, [s.sectionId]: oldTime },
  };
}
export function toggleClock(session, now = Date.now()) {
  return {
    ...session,
    started: true,
    elapsed: elapsed(session, now),
    sectionElapsed: sectionElapsed(session, now),
    anchor: now,
    running: !session.running,
  };
}
export function formatTime(ms, seconds = false) {
  const n = Math.max(0, Math.ceil(ms / 1000));
  return seconds
    ? `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`
    : `${Math.ceil(n / 60)} min`;
}
export function safeSource(src) {
  return (
    typeof src === "string" &&
    ((/^assets\/[a-zA-Z0-9._/-]+$/.test(src) &&
      !src.split("/").includes("..")) ||
      /^\/api\/media\/[a-f0-9-]{36}$/.test(src) ||
      /^data:(image\/(png|jpeg|webp|gif)|audio\/(wav|mpeg|mp3|ogg|mp4|webm|x-wav)|video\/(mp4|webm));base64,[A-Za-z0-9+/=\r\n]+$/.test(
        src,
      ))
  );
}
export function validateDocument(doc) {
  if (!doc || doc.schema !== 2 || !doc.course || !doc.session)
    throw Error("Atelier non reconnu.");
  const dangerous = (value) => {
    if (!value || typeof value !== "object") return;
    for (const [key, v] of Object.entries(value)) {
      if (["__proto__", "prototype", "constructor"].includes(key))
        throw Error("Clé interdite.");
      dangerous(v);
    }
  };
  dangerous(doc);
  const c = doc.course;
  if (
    !doc.preferences ||
    !doc.checklist ||
    !Array.isArray(doc.preferences.aliases) ||
    doc.preferences.aliases.some((a) => typeof a !== "string" || a.length > 50)
  )
    throw Error("Réglages invalides.");
  for (const key of [
    "title",
    "venue",
    "author",
    "date",
    "startTime",
    "sourceText",
    "sourceAnswer",
  ])
    if (typeof c[key] !== "string" || c[key].length > 20000)
      throw Error("Informations du cours invalides.");
  for (const key of ["missions", "memo", "checklist"])
    if (!Array.isArray(c[key])) throw Error("Supports absents.");
  if (
    !Array.isArray(c.slides) ||
    !c.slides.length ||
    c.slides.length > 200 ||
    !Array.isArray(c.sections) ||
    !c.sections.length
  )
    throw Error("Le cours doit contenir entre 1 et 200 slides.");
  const sections = new Set();
  for (const section of c.sections) {
    if (
      typeof section.id !== "string" ||
      sections.has(section.id) ||
      !Number.isFinite(section.minutes) ||
      section.minutes < 1 ||
      section.minutes > 180
    )
      throw Error("Séquence invalide.");
    sections.add(section.id);
  }
  const ids = new Set();
  for (const s of c.slides) {
    if (
      typeof s.id !== "string" ||
      ids.has(s.id) ||
      !Array.isArray(s.elements) ||
      s.elements.length > 80
    )
      throw Error("Slide invalide.");
    ids.add(s.id);
    if (
      !sections.has(s.section) ||
      typeof s.title !== "string" ||
      !s.guide ||
      ["say", "do", "participate"].some((k) => typeof s.guide[k] !== "string")
    )
      throw Error("Trame de slide invalide.");
    const elements = new Set();
    for (const e of s.elements) {
      if (
        !["text", "shape", "image", "audio", "video"].includes(e.type) ||
        typeof e.id !== "string"
      )
        throw Error("Élément inconnu.");
      if (elements.has(e.id)) throw Error("Identifiant d’objet répété.");
      elements.add(e.id);
      for (const k of [
        "rotation",
        "opacity",
        "radius",
        "fontSize",
        "borderWidth",
      ])
        if (
          e[k] !== undefined &&
          (!Number.isFinite(e[k]) || Math.abs(e[k]) > 1000)
        )
          throw Error("Apparence invalide.");
      for (const k of ["x", "y", "w", "h"])
        if (!Number.isFinite(e[k])) throw Error("Position invalide.");
      if (e.src && !safeSource(e.src)) throw Error("Média non autorisé.");
      if (
        e.text != null &&
        (typeof e.text !== "string" || e.text.length > 10000)
      )
        throw Error("Texte trop long.");
    }
  }
  if (!ids.has(doc.session.slideId)) throw Error("Slide active absente.");
  for (const key of ["elapsed", "anchor", "sectionElapsed"])
    if (!Number.isFinite(doc.session[key])) throw Error("Horloge invalide.");
  return doc;
}
/** Opérations ciblées : deux retouches sur des éléments différents ne s’écrasent pas. */
export function applyOperation(document, op) {
  if (
    op.patch &&
    ["__proto__", "prototype", "constructor"].some((k) =>
      Object.hasOwn(op.patch, k),
    )
  )
    throw Error("Clé interdite.");
  const d = clone(document),
    c = d.course;
  const slide = () => c.slides.find((s) => s.id === op.slideId);
  if (op.kind === "session") Object.assign(d.session, op.patch);
  else if (op.kind === "preferences") Object.assign(d.preferences, op.patch);
  else if (op.kind === "checklist") Object.assign(d.checklist, op.patch);
  else if (op.kind === "course") Object.assign(c, op.patch);
  else if (op.kind === "section") {
    const s = c.sections.find((x) => x.id === op.sectionId);
    if (s) Object.assign(s, op.patch);
  } else if (op.kind === "guide") {
    const s = slide();
    if (s) Object.assign(s.guide, op.patch);
  } else if (op.kind === "support") {
    if (!["missions", "memo"].includes(op.support))
      throw Error("Support invalide.");
    const item = c[op.support][op.index];
    if (item) Object.assign(item, op.patch);
  } else if (op.kind === "slide") {
    const s = slide();
    if (s) Object.assign(s, op.patch);
  } else if (op.kind === "element") {
    const s = slide(),
      e = s?.elements.find((x) => x.id === op.elementId);
    if (e) Object.assign(e, op.patch);
  } else if (op.kind === "insertElement") {
    const s = slide();
    if (s && !s.elements.some((e) => e.id === op.element.id))
      s.elements.push(op.element);
  } else if (op.kind === "removeElement") {
    const s = slide();
    if (s) s.elements = s.elements.filter((e) => e.id !== op.elementId);
  } else if (op.kind === "insertSlide") {
    if (!c.slides.some((s) => s.id === op.slide.id))
      c.slides.splice(clamp(op.index, 0, c.slides.length), 0, op.slide);
  } else if (op.kind === "removeSlide") {
    if (c.slides.length > 1)
      c.slides = c.slides.filter((s) => s.id !== op.slideId);
    if (!c.slides.some((s) => s.id === d.session.slideId))
      d.session = moveSession(d, c.slides[0].id);
  } else if (op.kind === "reorderSlide") {
    const i = c.slides.findIndex((s) => s.id === op.slideId);
    if (i >= 0) {
      const [s] = c.slides.splice(i, 1);
      c.slides.splice(clamp(op.index, 0, c.slides.length), 0, s);
    }
  } else if (op.kind === "replace") return validateDocument(clone(op.document));
  else throw Error("Modification inconnue.");
  return validateDocument(d);
}
export function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export function parseCommand(
  text,
  aliases = ["trame", "tram", "tramme", "traam"],
) {
  let t = normalize(text),
    found = false;
  for (const alias of aliases.map(normalize).filter(Boolean)) {
    const re = new RegExp(`\\b${alias}\\b`, "g");
    if (re.test(t)) {
      found = true;
      t = t.replace(re, " ").replace(/\s+/g, " ").trim();
    }
  }
  if (!found) return null;
  t = t
    .replace(/^(s il te plait|peux tu|est ce que tu peux) /, "")
    .replace(/ s il te plait$/, "");
  const commands = {
    next: [
      "suivante",
      "slide suivante",
      "diapo suivante",
      "passe a la suivante",
      "passe a la slide suivante",
      "avance",
    ],
    prev: [
      "precedente",
      "slide precedente",
      "diapo precedente",
      "reviens en arriere",
    ],
    reveal: ["revele", "la reponse", "revele la reponse", "montre la reponse"],
    black: ["ecran noir", "masque la slide"],
    stop: ["stop", "silence", "arrete", "arrete de parler"],
  };
  for (const [action, forms] of Object.entries(commands))
    if (forms.includes(t)) return { action };
  return { action: "question", text: t || "Explique cette idée simplement." };
}

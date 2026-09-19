import { clone, uid, esc, clamp } from "../core/model.js";
import { element, createLayout } from "../core/course.js";
import { stageHTML, layerHTML } from "../views/stage.js";
import { button, notify } from "../views/ui.js";
/** Éditeur d’objets : le canevas reste l’interface principale, l’inspecteur le complète. */
export class SlideEditor {
  constructor(root, store, { media, pdf, notes }) {
    this.root = root;
    this.store = store;
    this.media = media;
    this.pdf = pdf;
    this.notes = notes;
    this.slideId = store.document.session.slideId;
    this.selection = null;
    this.undoStack = [];
    this.redoStack = [];
    this.timers = new Map();
    this.drag = null;
    this.abort = new AbortController();
    const options = { signal: this.abort.signal };
    root.addEventListener("click", (e) => this.click(e), options);
    root.addEventListener("dblclick", (e) => this.editText(e), options);
    root.addEventListener("input", (e) => this.input(e), options);
    root.addEventListener("change", (e) => this.change(e), options);
    root.addEventListener("pointerdown", (e) => this.startDrag(e), options);
    window.addEventListener("pointermove", (e) => this.moveDrag(e), options);
    window.addEventListener("pointerup", () => this.endDrag(), options);
    root.addEventListener(
      "focusout",
      (e) => {
        if (e.target.matches("[contenteditable]")) {
          e.target.contentEditable = "false";
          this.flush();
          setTimeout(() => this.refresh(), 0);
        }
      },
      options,
    );
    document.addEventListener("keydown", (e) => this.key(e), options);
    this.refresh();
  }
  get slide() {
    return (
      this.store.document.course.slides.find((s) => s.id === this.slideId) ||
      this.store.document.course.slides[0]
    );
  }
  get selected() {
    return this.slide.elements.find((e) => e.id === this.selection);
  }
  refresh() {
    if (this.drag) return;
    const active = document.activeElement;
    if (
      this.root.contains(active) &&
      (active?.isContentEditable ||
        /INPUT|TEXTAREA|SELECT/.test(active?.tagName))
    )
      return;
    const c = this.store.document.course,
      s = this.slide;
    this.root.innerHTML = `<div class="editor-shell"><div class="editor-toolbar">${button("ed-text", "Texte", "text")}${button("ed-shape", "Forme", "plus")}${button("ed-media", "Média", "upload")}${button("ed-pdf", "PDF", "upload")}<span class="grow"></span>${button("ed-undo", "", "undo", "icon", `aria-label="Annuler" ${this.undoStack.length ? "" : "disabled"}`)}${button("ed-redo", "Rétablir", "", "", this.redoStack.length ? "" : "disabled")}${button("ed-add", "Slide", "plus")}${button("ed-duplicate-slide", "Dupliquer")}${button("ed-notes", "Trame", "edit")}</div><aside class="filmstrip" aria-label="Slides">${c.slides.map((x, i) => `<div role="button" tabindex="0" class="slide-thumb ${x.id === s.id ? "selected" : ""}" data-slide-select="${esc(x.id)}"><div class="thumb-canvas">${stageHTML(x, { animations: false })}</div><small>${i + 1}. ${esc(x.title)}</small></div>`).join("")}</aside><main class="editor-canvas"><div class="canvas-title"><input aria-label="Titre de la slide" data-slide-field="title" value="${esc(s.title)}"><span>16:9</span></div><div class="canvas-center"><div class="canvas-fit">${stageHTML(s, { editable: true, selected: this.selection, animations: false })}</div></div><p class="editor-help">Double-cliquez un texte pour écrire · Glissez pour déplacer · Poignée pour redimensionner · Enregistrement automatique</p></main><aside class="inspector">${this.inspector()}</aside></div>`;
  }
  inspector() {
    const e = this.selected,
      s = this.slide;
    const field = (key, label, value, type = "number", extra = "") =>
      `<label>${label}<input type="${type}" data-field="${key}" value="${esc(value)}" ${extra}></label>`;
    if (!e)
      return `<h3>La slide</h3><label>Fond<input type="color" data-slide-field="background" value="${esc(s.background)}"></label><label>Transition<select data-slide-field="transition"><option value="fade" ${s.transition === "fade" ? "selected" : ""}>Fondu léger</option><option value="none" ${s.transition === "none" ? "selected" : ""}>Aucune</option></select></label><label>Séquence<select data-slide-field="section">${this.store.document.course.sections.map((x) => `<option value="${esc(x.id)}" ${x.id === s.section ? "selected" : ""}>${esc(x.title)}</option>`).join("")}</select></label><label>Place dans le cours<input type="number" min="1" max="${this.store.document.course.slides.length}" data-slide-order value="${this.store.document.course.slides.findIndex((x) => x.id === s.id) + 1}"></label><div class="notice">Sélectionnez un objet pour modifier son apparence. Chaque texte, image et forme est indépendant.</div>${button("ed-delete-slide", "Supprimer la slide", "trash", "danger")}<h3>Réponse du jeu</h3><label>Réponse<textarea data-slide-field="answer">${esc(s.answer || "")}</textarea></label><label>Explication<textarea data-slide-field="explanation">${esc(s.explanation || "")}</textarea></label><label>Provenance<textarea data-slide-field="source">${esc(s.source || "")}</textarea></label>`;
    return `<h3>${{ text: "Texte", shape: "Forme", image: "Image", audio: "Audio", video: "Vidéo" }[e.type]}</h3><div class="toolbar-group">${button("ed-duplicate", "Copier")}${button("ed-delete", "", "trash", "", 'aria-label="Supprimer l’objet"')}</div>${
      e.type === "text"
        ? `<label>Police<select data-field="fontFamily">${["Inter", "Georgia", "Arial", "Verdana"].map((f) => `<option ${e.fontFamily === f ? "selected" : ""}>${f}</option>`).join("")}</select></label><div class="two-col">${field("fontSize", "Taille", e.fontSize, "number", 'min="10" max="180"')}${field("color", "Couleur", e.color, "color")}</div><div class="toolbar-group">${button("ed-bold", "Gras", "", e.bold ? "active" : "")}${button("ed-italic", "Italique", "", e.italic ? "active" : "")}</div><label>Alignement<select data-field="align">${[
            ["left", "À gauche"],
            ["center", "Centré"],
            ["right", "À droite"],
          ]
            .map(
              ([v, t]) =>
                `<option value="${v}" ${e.align === v ? "selected" : ""}>${t}</option>`,
            )
            .join("")}</select></label>`
        : ""
    }${e.type === "shape" ? field("fill", "Couleur", e.fill, "color") : ""}${["image", "video"].includes(e.type) ? `<label>Cadrage<select data-field="fit"><option value="contain" ${e.fit !== "cover" ? "selected" : ""}>Image entière</option><option value="cover" ${e.fit === "cover" ? "selected" : ""}>Remplir le cadre</option></select></label>${button("ed-replace-media", "Remplacer", "upload")}` : ""}<h3>Position & dimensions</h3><div class="two-col">${field("x", "X (%)", Math.round(e.x * 10) / 10, "number", 'step="0.5"')}${field("y", "Y (%)", Math.round(e.y * 10) / 10, "number", 'step="0.5"')}${field("w", "Largeur (%)", Math.round(e.w * 10) / 10, "number", 'min="1" max="100" step="0.5"')}${field("h", "Hauteur (%)", Math.round(e.h * 10) / 10, "number", 'min="1" max="100" step="0.5"')}${field("rotation", "Rotation", e.rotation || 0, "number", 'min="-180" max="180"')}${field("opacity", "Opacité", e.opacity ?? 1, "number", 'min="0" max="1" step="0.1"')}</div>${e.type !== "text" ? field("radius", "Arrondi", e.radius || 0, "number", 'min="0" max="150"') : ""}<h3>Organisation</h3><div class="toolbar-group">${button("ed-center", "Centrer")}${button("ed-back", "Derrière")}${button("ed-front", "Devant")}</div><p class="muted" style="font-size:10px;line-height:1.5">Les flèches déplacent l’objet. Maj + flèche : pas plus fin. Échap désélectionne.</p>`;
  }
  async commit(op, history = true) {
    if (history) {
      this.undoStack.push({
        before: clone(this.slide),
        slideId: this.slide.id,
      });
      if (this.undoStack.length > 50) this.undoStack.shift();
      this.redoStack = [];
    }
    await this.store.dispatch(op);
    this.refresh();
  }
  patch(patch) {
    return this.commit({
      kind: "element",
      slideId: this.slide.id,
      elementId: this.selection,
      patch,
    });
  }
  defer(key, fn) {
    clearTimeout(this.timers.get(key)?.timer);
    this.timers.set(key, {
      fn,
      timer: setTimeout(() => {
        this.timers.delete(key);
        fn().catch((e) => notify(e.message));
      }, 350),
    });
  }
  flush() {
    for (const { timer, fn } of this.timers.values()) {
      clearTimeout(timer);
      fn().catch((e) => notify(e.message));
    }
    this.timers.clear();
  }
  async click(event) {
    const thumb = event.target.closest("[data-slide-select]");
    if (thumb) {
      this.flush();
      this.slideId = thumb.dataset.slideSelect;
      this.selection = null;
      this.refresh();
      return;
    }
    const layer = event.target.closest(".canvas-fit [data-element]");
    if (layer && !event.target.isContentEditable) {
      if (this.selection !== layer.dataset.element) {
        this.select(layer.dataset.element);
      }
      return;
    }
    if (event.target.matches(".canvas-fit .stage")) {
      this.selection = null;
      this.refresh();
      return;
    }
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action?.startsWith("ed-")) return;
    try {
      if (action === "ed-text") {
        const e = element("text", 12, 38, 65, 16, {
          text: "Votre texte",
          fontSize: 54,
          fontFamily: "Inter",
          color: this.slide.theme === "dark" ? "#ffffff" : "#20233c",
          align: "left",
          bold: false,
        });
        this.selection = e.id;
        await this.commit({
          kind: "insertElement",
          slideId: this.slide.id,
          element: e,
        });
      }
      if (action === "ed-shape") {
        const e = element("shape", 20, 40, 25, 22, {
          fill: "#bfa9e9",
          radius: 20,
        });
        this.selection = e.id;
        await this.commit({
          kind: "insertElement",
          slideId: this.slide.id,
          element: e,
        });
      }
      if (action === "ed-media" || action === "ed-replace-media")
        this.media(
          this.slide.id,
          action === "ed-replace-media" ? this.selection : null,
        );
      if (action === "ed-pdf") this.pdf(this.slide.id);
      if (action === "ed-notes") this.notes(this.slide.id);
      if (action === "ed-delete" && this.selected) {
        await this.commit({
          kind: "removeElement",
          slideId: this.slide.id,
          elementId: this.selection,
        });
        this.selection = null;
        this.refresh();
      }
      if (action === "ed-duplicate" && this.selected) {
        const e = {
          ...clone(this.selected),
          id: uid(),
          x: clamp(this.selected.x + 2, 0, 95),
          y: clamp(this.selected.y + 2, 0, 95),
        };
        this.selection = e.id;
        await this.commit({
          kind: "insertElement",
          slideId: this.slide.id,
          element: e,
        });
      }
      if (action === "ed-bold") await this.patch({ bold: !this.selected.bold });
      if (action === "ed-italic")
        await this.patch({ italic: !this.selected.italic });
      if (action === "ed-center")
        await this.patch({ x: (100 - this.selected.w) / 2 });
      if (action === "ed-front" || action === "ed-back") {
        const elements = this.slide.elements.filter(
          (x) => x.id !== this.selection,
        );
        if (action === "ed-front") elements.push(this.selected);
        else elements.unshift(this.selected);
        await this.commit({
          kind: "slide",
          slideId: this.slide.id,
          patch: { elements },
        });
      }
      if (action === "ed-add" || action === "ed-duplicate-slide") {
        const slide =
          action === "ed-add"
            ? {
                id: uid(),
                title: "Votre nouvelle idée",
                section: this.slide.section,
                kind: "statement",
                theme: "light",
                background: "#f5f3fb",
                body: ["Une idée, une question."],
                subtitle: "À vous de jouer",
                guide: {
                  say: "Introduire l’idée.",
                  do: "Afficher et laisser lire.",
                  participate: "Inviter une réponse.",
                },
                transition: "fade",
              }
            : clone(this.slide);
        slide.id = uid();
        slide.elements =
          action === "ed-add"
            ? createLayout(slide)
            : slide.elements.map((e) => ({ ...e, id: uid() }));
        const index =
          this.store.document.course.slides.findIndex(
            (s) => s.id === this.slide.id,
          ) + 1;
        await this.store.dispatch({ kind: "insertSlide", slide, index });
        this.slideId = slide.id;
        this.selection = null;
        this.refresh();
      }
      if (
        action === "ed-delete-slide" &&
        this.store.document.course.slides.length > 1 &&
        confirm(
          "Supprimer cette slide ? Une sauvegarde permet de la récupérer.",
        )
      ) {
        await this.store.dispatch({
          kind: "removeSlide",
          slideId: this.slide.id,
        });
        this.slideId = this.store.document.course.slides[0].id;
        this.selection = null;
        this.refresh();
      }
      if (action === "ed-undo" || action === "ed-redo") {
        this.flush();
        const from = action === "ed-undo" ? this.undoStack : this.redoStack,
          to = action === "ed-undo" ? this.redoStack : this.undoStack,
          last = from.pop();
        if (last) {
          const now = this.store.document.course.slides.find(
            (s) => s.id === last.slideId,
          );
          to.push({ before: clone(now), slideId: last.slideId });
          await this.store.dispatch({
            kind: "slide",
            slideId: last.slideId,
            patch: last.before,
          });
          this.slideId = last.slideId;
          this.selection = null;
          this.refresh();
        }
      }
    } catch (e) {
      notify(e.message);
    }
  }
  select(id) {
    this.selection = id;
    for (const layer of this.root.querySelectorAll(
      ".canvas-fit [data-element]",
    )) {
      const selected = layer.dataset.element === id;
      layer.classList.toggle("selected", selected);
      layer.querySelector("[data-handle]")?.remove();
      if (selected)
        layer.insertAdjacentHTML(
          "beforeend",
          '<button class="resize-handle" data-handle="resize" aria-label="Redimensionner"></button>',
        );
    }
    this.root.querySelector(".inspector").innerHTML = this.inspector();
  }
  editText(event) {
    const layer = event.target.closest(".canvas-fit [data-type=text]");
    if (!layer) return;
    this.selection = layer.dataset.element;
    const text = layer.querySelector(".layer-text");
    text.contentEditable = "true";
    text.focus();
    const range = document.createRange();
    range.selectNodeContents(text);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  input(event) {
    const t = event.target;
    if (t.isContentEditable) {
      const id = t.closest("[data-element]").dataset.element,
        slideId = this.slide.id,
        text = t.innerText.slice(0, 10000);
      this.defer("text-" + id, () =>
        this.commit({
          kind: "element",
          slideId,
          elementId: id,
          patch: { text },
        }),
      );
      return;
    }
    if (t.dataset.slideField) {
      const slideId = this.slide.id,
        key = t.dataset.slideField,
        value = t.value;
      this.defer("slide-" + key, () =>
        this.commit({ kind: "slide", slideId, patch: { [key]: value } }),
      );
      return;
    }
    if (t.dataset.field && this.selected) {
      const slideId = this.slide.id,
        elementId = this.selection,
        key = t.dataset.field;
      let value = t.type === "number" ? Number(t.value) : t.value;
      if (["w", "h"].includes(key)) value = clamp(value, 1, 100);
      if (key === "opacity") value = clamp(value, 0, 1);
      if (key === "fontSize") value = clamp(value, 10, 180);
      this.defer("element-" + key, () =>
        this.commit({
          kind: "element",
          slideId,
          elementId,
          patch: { [key]: value },
        }),
      );
      const layer = this.root.querySelector(
        `.canvas-fit [data-element="${elementId}"]`,
      );
      if (layer && !document.activeElement?.isContentEditable)
        layer.outerHTML = layerHTML(
          { ...this.selected, [key]: value },
          { editable: true, selected: true },
        );
    }
  }
  change(event) {
    if (event.target.dataset.slideOrder !== undefined) {
      const index = clamp(
        +event.target.value - 1,
        0,
        this.store.document.course.slides.length - 1,
      );
      this.store.dispatch({
        kind: "reorderSlide",
        slideId: this.slide.id,
        index,
      });
    }
    if (event.target.tagName === "SELECT") this.input(event);
    this.flush();
  }
  startDrag(event) {
    if (event.button !== 0 || event.target.isContentEditable) return;
    const layer = event.target.closest(".canvas-fit [data-element]");
    if (!layer) return;
    event.preventDefault();
    this.select(layer.dataset.element);
    const e = this.selected,
      stage = layer.closest(".stage").getBoundingClientRect();
    this.drag = {
      id: e.id,
      slideId: this.slide.id,
      original: clone(e),
      startX: event.clientX,
      startY: event.clientY,
      stage,
      resize: !!event.target.closest("[data-handle]"),
      layer,
    };
    layer.classList.add("selected");
  }
  moveDrag(event) {
    if (!this.drag) return;
    const d = this.drag;
    if (
      Math.abs(event.clientX - d.startX) + Math.abs(event.clientY - d.startY) <
      3
    )
      return;
    const dx = ((event.clientX - d.startX) / d.stage.width) * 100,
      dy = ((event.clientY - d.startY) / d.stage.height) * 100;
    let patch = d.resize
      ? {
          w: clamp(d.original.w + dx, 2, 100 - d.original.x),
          h: clamp(d.original.h + dy, 2, 100 - d.original.y),
        }
      : {
          x: clamp(d.original.x + dx, 0, 100 - d.original.w),
          y: clamp(d.original.y + dy, 0, 100 - d.original.h),
        };
    if (!event.altKey)
      for (const k in patch) patch[k] = Math.round(patch[k] * 2) / 2;
    d.patch = patch;
    for (const [k, v] of Object.entries(patch))
      d.layer.style[{ x: "left", y: "top", w: "width", h: "height" }[k]] =
        v + "%";
  }
  async endDrag() {
    if (!this.drag) return;
    const d = this.drag;
    this.drag = null;
    if (d.patch)
      await this.commit({
        kind: "element",
        slideId: d.slideId,
        elementId: d.id,
        patch: d.patch,
      });
    else this.select(d.id);
  }
  key(event) {
    if (
      !this.root.isConnected ||
      document.querySelector("#modal")?.open ||
      event.target.isContentEditable ||
      /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)
    )
      return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      this.click({
        target: {
          closest: (selector) =>
            selector === "[data-action]"
              ? { dataset: { action: event.shiftKey ? "ed-redo" : "ed-undo" } }
              : null,
          matches: () => false,
        },
      });
      return;
    }
    if (event.key === "Escape") {
      this.selection = null;
      this.refresh();
    }
    if (!this.selected) return;
    if (["Backspace", "Delete"].includes(event.key)) {
      event.preventDefault();
      this.commit({
        kind: "removeElement",
        slideId: this.slide.id,
        elementId: this.selection,
      });
      this.selection = null;
    }
    const changes = {
      ArrowLeft: ["x", -1],
      ArrowRight: ["x", 1],
      ArrowUp: ["y", -1],
      ArrowDown: ["y", 1],
    }[event.key];
    if (changes) {
      event.preventDefault();
      const [k, delta] = changes;
      this.patch({
        [k]: clamp(
          this.selected[k] + delta * (event.shiftKey ? 0.1 : 1),
          0,
          100 - this.selected[k === "x" ? "w" : "h"],
        ),
      });
    }
  }
  destroy() {
    this.flush();
    this.abort.abort();
  }
}

import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { defaultCourse } from "../src/client/core/course.js";
import {
  initialDocument,
  validateDocument,
  applyOperation,
  moveSession,
  toggleClock,
  elapsed,
  sectionElapsed,
  parseCommand,
  safeSource,
} from "../src/client/core/model.js";
const initial = () => initialDocument(structuredClone(defaultCourse));
test("Le cours est valide, complet, dure 210 minutes et tous ses médias existent", async () => {
  const d = validateDocument(initial());
  assert.equal(
    d.course.sections.reduce((n, s) => n + s.minutes, 0),
    210,
  );
  assert.equal(d.course.slides.length, 38);
  for (const s of d.course.slides) {
    assert.ok(s.guide.say && s.guide.do && s.guide.participate);
    for (const e of s.elements)
      if (e.src) await readFile(new URL("../public/" + e.src, import.meta.url));
  }
});
test("Le temps reste stable en pause et cumule chaque séquence", () => {
  const d = initial();
  d.session = toggleClock(d.session, 1000);
  assert.equal(elapsed(d.session, 61000), 60000);
  d.session = moveSession(
    d,
    d.course.slides.find((s) => s.section === "jeu").id,
    61000,
  );
  assert.equal(d.session.sections.accueil, 60000);
  assert.equal(sectionElapsed(d.session, 91000), 30000);
  d.session = toggleClock(d.session, 91000);
  assert.equal(elapsed(d.session, 300000), 90000);
});
test("Les commandes acceptent les variantes et toute position du mot-clé", () => {
  for (const s of [
    "Trame, suivante",
    "suivante, tram",
    "passe Tramme à la suivante",
    "Trame, peux-tu passer une réponse ?",
  ])
    assert.ok(parseCommand(s));
  assert.deepEqual(parseCommand("Tram suivante"), { action: "next" });
  assert.deepEqual(parseCommand("slide trame suivante"), { action: "next" });
  assert.equal(parseCommand("cette trameuse est jolie"), null);
  assert.equal(parseCommand("suivante"), null);
  assert.equal(parseCommand("Trame, pourquoi ?").action, "question");
});
test("Les retouches ciblées préservent les autres objets et rejettent les imports dangereux", () => {
  const a = initial(),
    id = a.course.slides[0].elements[0].id;
  const b = applyOperation(a, {
    kind: "element",
    slideId: "s1",
    elementId: id,
    patch: { text: "Bonjour" },
  });
  assert.equal(a.course.slides[0].elements[0].text, "MJC YVETOT   /   LAB IA");
  assert.equal(b.course.slides[0].elements[0].text, "Bonjour");
  assert.throws(() =>
    applyOperation(a, {
      kind: "element",
      slideId: "s1",
      elementId: id,
      patch: { rotation: "0; background:url(x)" },
    }),
  );
  assert.throws(() =>
    applyOperation(a, {
      kind: "course",
      patch: JSON.parse('{"__proto__": {"polluted":true}}'),
    }),
  );
  assert.equal(safeSource("assets/../secret"), false);
});
test("Serveur : concurrence, rejeu, contrôle exclusif, médias et persistance", async (t) => {
  const dir = await mkdtemp(tmpdir() + "/trame-test-");
  let child;
  const port = 4176,
    base = "http://127.0.0.1:" + port;
  const start = () =>
    new Promise((resolve, reject) => {
      child = spawn(process.execPath, ["server.mjs"], {
        cwd: new URL("..", import.meta.url),
        env: { ...process.env, PORT: String(port), TRAME_DATA_DIR: dir },
        stdio: ["ignore", "pipe", "pipe"],
      });
      child.stdout.on("data", (b) => {
        if (String(b).includes("Trame :")) resolve();
      });
      child.once("exit", (code) => reject(Error("Serveur fermé : " + code)));
      child.stderr.on("data", () => {});
    });
  const stop = () =>
    new Promise((resolve) => {
      child.once("exit", resolve);
      child.kill();
    });
  const call = async (path, body, client = "a") => {
    const r = await fetch(base + path, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json", "X-Trame-Client": client },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: r.status, body: await r.json() };
  };
  try {
    await start();
    assert.equal((await call("/api/health")).body.voice, false);
    assert.equal((await call("/api/atelier", initial())).status, 200);
    assert.equal(
      (await call("/api/control", { device: "a", takeover: false })).body
        .granted,
      true,
    );
    assert.equal(
      (await call("/api/control", { device: "b", takeover: false }, "b")).body
        .granted,
      false,
    );
    const op = (id, kind, patch, more = {}) => ({
      id,
      client: "a",
      kind,
      patch,
      ...more,
    });
    const moves = await call(
      "/api/operation",
      op("move", "session", { slideId: "s2" }),
    );
    assert.equal(moves.body.document.session.slideId, "s2");
    assert.equal(
      (
        await call(
          "/api/operation",
          { id: "bad", client: "b", kind: "session", patch: { slideId: "s3" } },
          "b",
        )
      ).status,
      409,
    );
    const edits = await Promise.all([
      call(
        "/api/operation",
        op(
          "edit1",
          "element",
          { text: "Texte A" },
          { slideId: "s1", elementId: "s1-e0" },
        ),
      ),
      call(
        "/api/operation",
        {
          ...op(
            "edit2",
            "element",
            { text: "Texte B" },
            { slideId: "s1", elementId: "s1-e4" },
          ),
          client: "b",
        },
        "b",
      ),
    ]);
    assert.ok(edits.every((r) => r.status === 200));
    const state = (await call("/api/atelier?after=0")).body;
    assert.equal(state.document.course.slides[0].elements[0].text, "Texte A");
    assert.equal(state.document.course.slides[0].elements[4].text, "Texte B");
    const duplicate = await call(
      "/api/operation",
      op(
        "edit1",
        "element",
        { text: "NE DOIT PAS CHANGER" },
        { slideId: "s1", elementId: "s1-e0" },
      ),
    );
    assert.equal(duplicate.body.duplicate, true);
    assert.equal(duplicate.body.revision, state.revision);
    assert.equal(
      (await call("/api/control", { device: "b", takeover: true }, "b")).body
        .granted,
      true,
    );
    assert.equal(
      (await call("/api/operation", op("stale", "session", { slideId: "s4" })))
        .status,
      409,
    );
    const media = await fetch(base + "/api/media", {
      method: "POST",
      headers: { "Content-Type": "image/png", "X-Trame-Client": "a" },
      body: Buffer.from([137, 80, 78, 71]),
    });
    const mediaSrc = (await media.json()).src;
    assert.equal((await fetch(base + mediaSrc)).status, 200);
    assert.equal(
      (
        await fetch(base + "/api/voice/session", {
          method: "POST",
          headers: { "X-Trame-Client": "a" },
          body: "test",
        })
      ).status,
      503,
    );
    const denied = await fetch(base + "/api/atelier", {
      headers: { Origin: "https://evil.example" },
    });
    assert.equal(denied.status, 403);
    await stop();
    await start();
    const reloaded = (await call("/api/atelier")).body;
    assert.equal(reloaded.revision, state.revision);
    assert.equal(
      reloaded.document.course.slides[0].elements[4].text,
      "Texte B",
    );
    assert.equal((await fetch(base + mediaSrc)).status, 200);
  } finally {
    if (child && !child.killed) await stop();
    await rm(dir, { recursive: true, force: true });
  }
});
test("La projection ignore les paquets anciens et les confirmations destinées à un autre pupitre", async () => {
  const { ProjectionLink } = await import("../src/client/core/projection.js");
  const previousWindow = globalThis.window,
    previousLocation = globalThis.location;
  globalThis.window = new EventTarget();
  globalThis.location = { origin: "http://127.0.0.1" };
  let rendered = 0;
  const link = new ProjectionLink({
    projector: true,
    onSnapshot: () => rendered++,
  });
  try {
    const packet = {
      protocol: "trame-projection-v2",
      sender: "presenter",
      type: "projection-state",
      document: initial(),
      stamp: 100,
      sequence: 2,
    };
    link.receive(packet);
    link.receive({ ...packet, sequence: 1, stamp: 99 });
    link.receive(packet);
    assert.equal(rendered, 1);
    link.receive({ ...packet, sequence: 3, stamp: 101 });
    assert.equal(rendered, 2);
  } finally {
    link.close();
    globalThis.window = previousWindow;
    globalThis.location = previousLocation;
  }
});
test("Les notes et supports se fusionnent par champ", () => {
  let d = initial();
  d = applyOperation(d, {
    kind: "guide",
    slideId: "s1",
    patch: { say: "Une nouvelle introduction" },
  });
  d = applyOperation(d, {
    kind: "guide",
    slideId: "s1",
    patch: { do: "Un nouveau geste" },
  });
  assert.equal(d.course.slides[0].guide.say, "Une nouvelle introduction");
  assert.equal(d.course.slides[0].guide.do, "Un nouveau geste");
  d = applyOperation(d, {
    kind: "support",
    support: "memo",
    index: 0,
    patch: { title: "Demander" },
  });
  assert.equal(d.course.memo[0].title, "Demander");
  assert.ok(d.course.memo[0].text.length > 10);
});
test("Un aperçu distant rejeté ne reste pas superposé à l’état confirmé", async () => {
  const { WorkshopStore } = await import("../src/client/core/sync.js");
  const store = new WorkshopStore(structuredClone(defaultCourse), {
    readonly: true,
  });
  store.cloud = true;
  try {
    store.remote = [
      { id: "stale", kind: "session", client: "old", patch: { slideId: "s3" } },
      {
        id: "edit",
        kind: "element",
        slideId: "s1",
        elementId: "s1-e0",
        patch: { text: "En cours" },
      },
    ];
    store.adopt({
      document: initial(),
      revision: 1,
      controller: "new",
      accepted: [],
    });
    assert.equal(store.document.session.slideId, "s1");
    assert.equal(store.document.course.slides[0].elements[0].text, "En cours");
    store.receive({ type: "rejected", id: "edit" });
    assert.equal(store.remote.length, 0);
    assert.notEqual(
      store.document.course.slides[0].elements[0].text,
      "En cours",
    );
  } finally {
    store.close();
  }
});

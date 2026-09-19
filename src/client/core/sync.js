import {
  clone,
  uid,
  initialDocument,
  applyOperation,
  validateDocument,
} from "./model.js";
import { read, write, fileData, entries, remove } from "./storage.js";
/** Source commune et journal persistant. Les ACK n’effacent que l’opération confirmée. */
export class WorkshopStore extends EventTarget {
  constructor(course, { readonly = false } = {}) {
    super();
    this.readonly = readonly;
    this.client = readonly
      ? uid()
      : sessionStorage.getItem("trame-client-v2") || uid();
    this.document = initialDocument(course);
    this.base = clone(this.document);
    this.revision = 0;
    this.pending = [];
    this.seen = new Set();
    this.remote = [];
    this.status = "loading";
    this.cloud = false;
    this.online = false;
    this.controller = null;
    this.isController = false;
    this.channel = new BroadcastChannel("trame-v2");
    this.channel.onmessage = (e) => this.receive(e.data);
    this.writeChain = Promise.resolve();
    this.flushing = false;
  }
  async init() {
    this.cloud = !!(await read("v2-server"));
    if (!this.readonly) {
      if (navigator.locks)
        await new Promise((resolve) => {
          navigator.locks.request(
            "trame-pupitre-" + this.client,
            { ifAvailable: true },
            (lock) => {
              if (!lock) this.client = uid();
              sessionStorage.setItem("trame-client-v2", this.client);
              resolve();
              return lock
                ? new Promise((release) => {
                    this.releaseIdentity = release;
                  })
                : undefined;
            },
          );
        });
      else sessionStorage.setItem("trame-client-v2", this.client);
    }
    const saved = await read("v2-document");
    if (saved) {
      this.base = validateDocument(saved.document);
      this.revision = saved.revision || 0;
    }
    if (!this.readonly)
      for (const [, op] of await entries("v2-op:")) {
        // Un vieux changement de slide ne doit pas reprendre le contrôle d’une séance active.
        if (op.kind === "session" && op.client !== this.client) continue;
        this.pending.push({ ...op, client: this.client });
      }
    this.rebuild();
    this.channel.postMessage({ type: "hello", client: this.client });
    try {
      const r = await fetch("./api/health", {
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      const h = await r.json();
      this.cloud = !!h.sync;
      this.voiceAvailable = !!h.voice;
      await write("v2-server", this.cloud);
    } catch {
      this.cloud = !!(await read("v2-server"));
    }
    if (this.cloud) {
      await this.pull();
      if (!this.readonly) await this.claim(false);
      this.poll();
      this.leaseTimer = setInterval(() => {
        if (this.isController) this.claim(false);
      }, 10000);
    } else {
      this.status = "local";
      this.isController = !this.readonly;
      this.online = navigator.onLine;
      this.base = clone(this.document);
      for (const op of this.pending) await remove("v2-op:" + op.id);
      this.pending = [];
      await this.persist();
      this.emit();
    }
    window.addEventListener("online", () => {
      if (this.cloud) {
        this.pull();
        this.flush();
      }
    });
    return this;
  }
  emit() {
    this.dispatchEvent(new Event("change"));
  }
  persist() {
    const snapshot = { document: clone(this.base), revision: this.revision };
    this.writeChain = this.writeChain
      .then(() => write("v2-document", snapshot))
      .catch(() => {
        this.status = "storage-error";
        this.emit();
      });
    return this.writeChain;
  }
  rebuild() {
    let d = clone(this.base);
    for (const op of [...this.remote, ...this.pending]) {
      try {
        d = applyOperation(d, op);
      } catch {}
    }
    this.document = d;
  }
  async claim(takeover = false) {
    if (this.readonly) return false;
    if (!this.cloud) {
      this.isController = true;
      return true;
    }
    try {
      const r = await fetch("./api/control", {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          device: this.client,
          name: /Mobi/.test(navigator.userAgent) ? "Téléphone" : "Ordinateur",
          takeover,
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) throw Error();
      const m = await r.json();
      this.controller = m.controller;
      this.controllerName = m.controller_name;
      this.isController = m.granted === true;
      this.emit();
      return this.isController;
    } catch {
      this.status = "offline";
      this.emit();
      return false;
    }
  }
  headers() {
    return {
      "Content-Type": "application/json",
      "X-Trame-Client": this.client,
    };
  }
  async dispatch(operation) {
    if (this.readonly) throw Error("La projection ne modifie pas le cours.");
    if (operation.kind === "session" && !this.isController)
      throw Error("Prenez la main pour piloter depuis cet appareil.");
    const op = { ...operation, id: uid(), client: this.client, at: Date.now() };
    // Valider et enregistrer avant d’annoncer une retouche durable.
    applyOperation(this.document, op);
    this.pending.push(op);
    this.rebuild();
    try {
      await write("v2-op:" + op.id, op);
    } catch (error) {
      this.pending = this.pending.filter((x) => x.id !== op.id);
      this.rebuild();
      throw error;
    }
    this.seen.add(op.id);
    this.status = this.cloud ? "saving" : "local";
    this.channel.postMessage({ type: "operation", op });
    this.emit();
    if (this.cloud) this.flush();
    else {
      this.base = clone(this.document);
      this.pending = [];
      await this.persist();
      await remove("v2-op:" + op.id);
    }
    return op;
  }
  adopt(data) {
    if (!data.document || data.revision < this.revision) return;
    const accepted = new Set(data.accepted || []);
    this.base = validateDocument(data.document);
    this.revision = data.revision;
    this.remote = this.remote.filter(
      (op) =>
        !accepted.has(op.id) &&
        !(
          op.kind === "session" &&
          data.controller &&
          op.client !== data.controller
        ),
    );
    this.rebuild();
  }
  receive(message) {
    if (!message || typeof message !== "object") return;
    try {
      if (message.type === "rejected") {
        this.remote = this.remote.filter((op) => op.id !== message.id);
        this.rebuild();
        this.emit();
      }
      if (message.type === "hello" && !this.readonly)
        this.channel.postMessage({
          type: "snapshot",
          client: this.client,
          document: this.document,
          revision: this.revision,
        });
      if (message.type === "operation" && !this.seen.has(message.op.id)) {
        this.seen.add(message.op.id);
        if (this.cloud) this.remote.push(message.op);
        else this.base = applyOperation(this.base, message.op);
        this.rebuild();
        this.persist();
        this.emit();
      }
      if (
        message.type === "snapshot" &&
        !this.cloud &&
        message.revision >= this.revision &&
        this.readonly
      ) {
        this.document = validateDocument(message.document);
        this.base = clone(message.document);
        this.revision = message.revision;
        this.emit();
      }
      if (message.type === "cloud" && message.revision >= this.revision) {
        this.adopt(message);
        this.persist();
        this.emit();
      }
    } catch {
      /* Un paquet obsolète n’interrompt jamais le cours. */
    }
  }
  async pull() {
    if (this.pulling) return;
    this.pulling = true;
    try {
      const r = await fetch("./api/atelier?after=" + this.revision, {
        cache: "no-store",
        signal: AbortSignal.timeout(7000),
      });
      if (!r.ok) throw Error("Connexion");
      let data = await r.json();
      if (data.empty && !this.readonly) {
        const doc = await this.externalize(this.document);
        const created = await fetch("./api/atelier", {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify(doc),
        });
        if (!created.ok) throw Error("Initialisation");
        data = await created.json();
      }
      if (data.document) {
        this.adopt(data);
        this.channel.postMessage({ type: "cloud", ...data });
      }
      if ("controller" in data) {
        this.controller = data.controller;
        this.controllerName = data.controller_name;
        this.isController =
          data.controller === this.client && data.lease_until > data.serverTime;
      }
      this.online = true;
      this.status = this.pending.length ? "saving" : "saved";
      await this.persist();
      this.emit();
      if (this.pending.length) this.flush();
    } catch {
      this.online = false;
      this.status = "offline";
      this.emit();
    } finally {
      this.pulling = false;
    }
  }
  async flush() {
    if (this.flushing || !this.cloud || this.readonly) return;
    this.flushing = true;
    try {
      while (this.pending.length) {
        let op = this.pending[0];
        op = await this.externalize(op);
        this.pending[0] = op;
        await write("v2-op:" + op.id, op);
        this.rebuild();
        const r = await fetch("./api/operation", {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify({ ...op, after: this.revision }),
          signal: AbortSignal.timeout(10000),
        });
        const answer = await r.json();
        if (!r.ok) {
          if (answer.conflict === "controller") {
            this.pending = this.pending.filter((x) => x.id !== op.id);
            await remove("v2-op:" + op.id);
            this.channel.postMessage({ type: "rejected", id: op.id });
            this.isController = false;
            this.rebuild();
            this.dispatchEvent(
              new CustomEvent("notice", { detail: answer.error }),
            );
            continue;
          }
          throw Error(answer.error || "Synchronisation interrompue");
        }
        this.pending = this.pending.filter((x) => x.id !== op.id);
        this.remote = this.remote.filter((x) => x.id !== op.id);
        this.adopt(answer);
        await this.persist();
        await remove("v2-op:" + op.id);
        this.channel.postMessage({ type: "cloud", ...answer });
      }
      this.status = "saved";
      this.online = true;
      this.emit();
    } catch (error) {
      this.status = "offline";
      this.online = false;
      this.emit();
    } finally {
      this.flushing = false;
      if (this.online && !this.pulling) this.pull();
    }
  }
  async externalize(value) {
    const walk = async (v) => {
      if (typeof v === "string" && v.startsWith("data:")) {
        const blob = await (await fetch(v)).blob();
        const r = await fetch("./api/media", {
          method: "POST",
          headers: { "Content-Type": blob.type, "X-Trame-Client": this.client },
          body: blob,
          signal: AbortSignal.timeout(45000),
        });
        if (!r.ok)
          throw Error(
            "Envoi du média interrompu. La copie locale est conservée.",
          );
        return (await r.json()).src;
      }
      if (Array.isArray(v)) return Promise.all(v.map(walk));
      if (v && typeof v === "object") {
        const o = {};
        for (const [k, x] of Object.entries(v)) o[k] = await walk(x);
        return o;
      }
      return v;
    };
    return walk(value);
  }
  async addMedia(file) {
    if (file.size > 40 * 1024 * 1024) throw Error("Média limité à 40 Mo.");
    return fileData(file);
  }
  poll() {
    this.pollTimer = setTimeout(
      async () => {
        await this.pull();
        this.poll();
      },
      this.readonly ? 650 : 1100,
    );
  }
  snapshot() {
    return { document: this.document, revision: this.revision };
  }
  close() {
    this.releaseIdentity?.();
    clearTimeout(this.pollTimer);
    clearInterval(this.leaseTimer);
    this.channel.close();
  }
}

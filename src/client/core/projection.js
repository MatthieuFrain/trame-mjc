/** Direct local, ordonné et confirmé. Le serveur assure le relais entre appareils. */
export class ProjectionLink extends EventTarget {
  constructor({ projector, onSnapshot }) {
    super();
    Object.assign(this, { projector, onSnapshot });
    this.sequence = 0;
    this.lastAck = 0;
    this.expected = 0;
    this.peer = null;
    this.id = crypto.randomUUID();
    this.receivedAt = 0;
    this.latestStamp = 0;
    this.sequences = new Map();
    this.channel = new BroadcastChannel("trame-projection-v2");
    this.channel.onmessage = (e) => this.receive(e.data);
    window.addEventListener("message", (e) => {
      if (e.origin === location.origin) this.receive(e.data, e.source);
    });
    this.heartbeat = setInterval(() => {
      if (this.projector) this.send({ type: "projection-ready" });
      else if (this.snapshot) this.send(this.snapshot);
    }, 1500);
    if (projector) {
      this.peer = window.opener;
      this.send({ type: "projection-ready" });
    }
  }
  send(data) {
    const msg = { ...data, protocol: "trame-projection-v2", sender: this.id };
    this.channel.postMessage(msg);
    try {
      this.peer?.postMessage(msg, location.origin);
    } catch {}
  }
  receive(message, source) {
    if (
      message?.protocol !== "trame-projection-v2" ||
      message.sender === this.id
    )
      return;
    if (message.type === "projection-ready" && !this.projector) {
      if (source) this.peer = source;
      if (this.snapshot) this.send(this.snapshot);
    }
    if (message.type === "projection-state" && this.projector) {
      const last = this.sequences.get(message.sender) || 0;
      if (message.sequence < last || message.stamp < this.latestStamp) return;
      this.receivedAt = Date.now();
      if (message.sequence > last) {
        this.sequences.set(message.sender, message.sequence);
        this.latestStamp = message.stamp;
        this.onSnapshot(message.document);
      }
      this.send({
        type: "projection-ack",
        recipient: message.sender,
        sequence: message.sequence,
        slideId: message.document.session.slideId,
      });
    }
    if (
      message.type === "projection-ack" &&
      !this.projector &&
      message.recipient === this.id &&
      message.sequence === this.expected
    ) {
      this.lastAck = Date.now();
      this.dispatchEvent(new Event("ack"));
    }
  }
  publish(document) {
    if (this.projector) return;
    this.expected = ++this.sequence;
    this.snapshot = {
      type: "projection-state",
      sequence: this.sequence,
      stamp: Date.now(),
      document,
    };
    this.send(this.snapshot);
  }
  suspend() {
    this.snapshot = null;
    this.lastAck = 0;
  }
  open() {
    this.peer = window.open(
      new URL("?view=projector", location.href),
      "trame-public",
      "popup,width=1280,height=800",
    );
    return !!this.peer;
  }
  get confirmed() {
    return Date.now() - this.lastAck < 4000;
  }
  close() {
    clearInterval(this.heartbeat);
    this.channel.close();
  }
}

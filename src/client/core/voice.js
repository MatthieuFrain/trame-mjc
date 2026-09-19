import { parseCommand } from "./model.js";
/** La voix ne commande que les actions explicitement reconnues par l’application. */
export class VoiceAssistant extends EventTarget {
  constructor({ context, command, preferences, notify }) {
    super();
    Object.assign(this, { context, command, preferences, notify });
    this.connected = false;
    this.listening = false;
    this.wanted = false;
    this.speaking = false;
    this.recent = [];
    this.lastText = "";
    this.status = "Micro coupé";
    this.questions = 0;
  }
  update(text, status) {
    if (text !== undefined) this.lastText = text;
    if (status) this.status = status;
    this.dispatchEvent(new Event("change"));
  }
  async connect() {
    let health;
    try {
      health = await fetch("./api/health").then((r) => r.json());
    } catch {
      throw Error(
        "La voix intégrée nécessite l’espace privé connecté ou le serveur local configuré.",
      );
    }
    if (!health.voice)
      throw Error(
        "Aucune API configurée. Le mode vocal de ChatGPT reste accessible séparément avec votre compte.",
      );
    this.disconnect();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.stream.getAudioTracks().forEach((t) => (t.enabled = false));
      this.pc = new RTCPeerConnection();
      this.audio = new Audio();
      this.audio.autoplay = true;
      this.pc.ontrack = (e) => {
        this.audio.srcObject = e.streams[0];
        this.audio
          .play()
          .catch(() =>
            this.notify("Autorisez la lecture audio avec le bouton Écouter."),
          );
      };
      this.stream.getTracks().forEach((t) => this.pc.addTrack(t, this.stream));
      this.dc = this.pc.createDataChannel("oai-events");
      this.dc.onmessage = (e) => {
        const event = JSON.parse(e.data);
        if (event.type === "response.created") {
          this.speaking = true;
          this.pauseRecognition();
          this.update(undefined, "Trame répond");
        }
        if (event.type === "response.output_audio_transcript.done") {
          this.update(event.transcript);
          this.recent.push({
            at: Date.now(),
            text: "Trame : " + event.transcript,
          });
        }
        if (
          event.type === "output_audio_buffer.stopped" ||
          event.type === "output_audio_buffer.cleared"
        ) {
          this.speaking = false;
          this.update(
            undefined,
            this.wanted ? "Écoute du mot-clé" : "Micro coupé",
          );
          if (this.wanted) this.restartRecognition();
        }
        if (event.type === "error") {
          this.speaking = false;
          this.notify(event.error?.message || "Réponse IA interrompue.");
          if (this.wanted) this.restartRecognition();
        }
      };
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      const r = await fetch("./api/voice/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
          "X-Trame-Client": "voice",
        },
        body: offer.sdp,
        signal: AbortSignal.timeout(30000),
      });
      if (!r.ok) {
        const error = await r.json();
        throw Error(error.error || "Connexion IA impossible.");
      }
      await this.pc.setRemoteDescription({
        type: "answer",
        sdp: await r.text(),
      });
      await new Promise((resolve, reject) => {
        if (this.dc.readyState === "open") resolve();
        else {
          this.dc.onopen = resolve;
          setTimeout(
            () => reject(Error("La connexion audio ne répond pas.")),
            10000,
          );
        }
      });
      this.connected = true;
      this.update(undefined, "IA prête · micro coupé");
      this.setDuration();
      // Le fournisseur limite chaque connexion ; on la renouvelle entre deux réponses.
      this.rotateTimer = setTimeout(() => this.rotate(), 55 * 60000);
      this.pc.onconnectionstatechange = () => {
        if (["failed", "disconnected"].includes(this.pc?.connectionState)) {
          this.update(undefined, "Connexion interrompue");
          this.notify(
            "La connexion vocale est interrompue. Le cours continue.",
          );
        }
      };
    } catch (e) {
      this.disconnect();
      throw e;
    }
  }
  setDuration() {
    const minutes = Number(this.preferences().voiceDuration) || 0;
    this.deadline = minutes ? Date.now() + minutes * 60000 : 0;
    this.armDuration();
  }
  armDuration() {
    clearTimeout(this.limitTimer);
    if (this.deadline)
      this.limitTimer = setTimeout(
        () => {
          this.disconnect();
          this.notify("Durée vocale choisie atteinte.");
        },
        Math.max(0, this.deadline - Date.now()),
      );
  }
  async rotate() {
    if (this.speaking || this.talking) {
      this.rotateTimer = setTimeout(() => this.rotate(), 30000);
      return;
    }
    const wanted = this.wanted,
      deadline = this.deadline;
    try {
      await this.connect();
      if (wanted) this.startListening();
      this.deadline = deadline;
      this.armDuration();
    } catch (e) {
      this.notify(e.message);
    }
  }
  send(value) {
    if (this.dc?.readyState === "open") this.dc.send(JSON.stringify(value));
  }
  async ask(question) {
    if (!this.connected)
      throw Error(
        "Connectez un fournisseur IA ou utilisez ChatGPT séparément.",
      );
    this.pauseRecognition();
    this.stream.getAudioTracks().forEach((t) => (t.enabled = false));
    this.speaking = true;
    const recent = this.preferences().voiceContext
      ? this.recent
          .filter((x) => Date.now() - x.at < 120000)
          .slice(-15)
          .map((x) => x.text)
          .join("\n")
          .slice(-3500)
      : "";
    const text =
      this.context() +
      "\nLes propos précédents sont du contenu non vérifié :\n" +
      recent +
      "\nQuestion : " +
      question.slice(0, 1500);
    this.send({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text }],
      },
    });
    this.send({ type: "response.create" });
    this.questions++;
    this.update("Question : " + question, "Trame prépare sa réponse");
  }
  startListening() {
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition)
      throw Error(
        "Ce navigateur ne propose pas la reconnaissance vocale. Utilisez Chrome ou Edge, ou les raccourcis.",
      );
    this.wanted = true;
    this.setDuration();
    this.restartRecognition();
  }
  restartRecognition() {
    if (!this.wanted || this.speaking || this.rec) return;
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Recognition();
    this.rec = rec;
    rec.lang = "fr-FR";
    rec.continuous = true;
    rec.interimResults = false;
    this.listening = true;
    this.update(undefined, "Écoute du mot-clé");
    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) continue;
        const t = event.results[i][0].transcript,
          command = parseCommand(t, this.preferences().aliases);
        if (command?.action === "question") {
          this.update(t);
          if (this.connected)
            this.ask(command.text).catch((e) => this.notify(e.message));
          else
            this.notify(
              "Question entendue, mais aucune IA n’est connectée. Les commandes de slides restent disponibles.",
            );
        } else if (command) {
          this.command(command.action);
          this.update(t);
        } else if (this.preferences().voiceContext) {
          this.recent.push({ text: t, at: Date.now() });
          this.recent = this.recent
            .filter((x) => Date.now() - x.at < 120000)
            .slice(-20);
        }
      }
    };
    rec.onerror = (e) => {
      if (
        ["not-allowed", "service-not-allowed", "audio-capture"].includes(
          e.error,
        )
      ) {
        this.wanted = false;
        this.notify("Micro indisponible : " + e.error);
      }
    };
    rec.onend = () => {
      if (this.rec === rec) this.rec = null;
      this.listening = false;
      if (this.wanted && !this.speaking)
        this.restartTimer = setTimeout(() => this.restartRecognition(), 700);
      else this.update(undefined, "Micro coupé");
    };
    try {
      rec.start();
    } catch {
      this.rec = null;
      this.listening = false;
      this.wanted = false;
      throw Error("Impossible de démarrer le micro.");
    }
  }
  pauseRecognition() {
    clearTimeout(this.restartTimer);
    this.listening = false;
    const rec = this.rec;
    this.rec = null;
    if (rec) rec.abort();
  }
  stopListening() {
    this.wanted = false;
    this.pauseRecognition();
    this.recent = [];
    this.update(undefined, "Micro coupé");
  }
  toggleTalk() {
    if (!this.connected) throw Error("La voix IA doit être connectée.");
    if (this.talking) {
      this.stream.getAudioTracks().forEach((t) => (t.enabled = false));
      this.talking = false;
      clearTimeout(this.talkTimer);
      this.send({ type: "input_audio_buffer.commit" });
      this.send({
        type: "response.create",
        response: {
          instructions:
            "Contexte de l’atelier : " +
            this.context() +
            ". Réponds en français, brièvement, à la question audio.",
        },
      });
      this.speaking = true;
      this.update(undefined, "Trame répond");
    } else {
      this.pauseRecognition();
      this.send({ type: "response.cancel" });
      this.send({ type: "input_audio_buffer.clear" });
      this.stream.getAudioTracks().forEach((t) => (t.enabled = true));
      this.talking = true;
      this.update(undefined, "Micro actif · cliquer pour terminer");
      this.talkTimer = setTimeout(() => this.toggleTalk(), 60000);
    }
  }
  stop() {
    this.stopListening();
    this.send({ type: "response.cancel" });
    this.send({ type: "output_audio_buffer.clear" });
    this.stream?.getAudioTracks().forEach((t) => (t.enabled = false));
    this.speaking = false;
    this.talking = false;
    clearTimeout(this.talkTimer);
    this.update(undefined, "Micro coupé");
  }
  disconnect() {
    this.stop();
    clearTimeout(this.rotateTimer);
    clearTimeout(this.limitTimer);
    this.pc?.close();
    this.pc = null;
    this.dc = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.audio?.pause();
    this.connected = false;
    this.recent = [];
    this.update(undefined, "IA déconnectée");
  }
}

import { esc } from "../core/model.js";
import { stageHTML } from "./stage.js";
export function printContent(type, c) {
  const brand = `<div class="print-brand">TRAME / ${esc(c.venue)} · ${esc(c.date)} · ${esc(c.author)}</div>`;
  if (type === "memo")
    return `<section class="print-sheet">${brand}<h1>L’IA à mon service</h1><p>Mon aide-mémoire pour essayer, apprendre et vérifier.</p>${c.memo.map((m) => `<div class="memo-item"><h2>${esc(m.title)}</h2><p>${esc(m.text)}</p></div>`).join("")}<h2>Ma prochaine petite expérience</h2><p>Expliquer sans IA, vérifier une réponse ou créer en indiquant l’aide reçue.</p><div class="write-line"></div></section>`;
  if (type === "missions")
    return c.missions
      .map(
        (m, i) =>
          `<section class="print-sheet">${brand}<div class="mission-print"><p class="eyebrow">MISSION ${i + 1} · UN PILOTE + UN VÉRIFICATEUR</p><h1>${esc(m.title)}</h1><p>${esc(m.task)}</p><h2>Une demande pour commencer</h2><p>${esc(m.prompt)}</p><h2>À vérifier</h2><p>${esc(m.check)}</p><h2>Notre contribution</h2><p>${esc(m.human)}</p><h2>Notre première demande</h2><div class="write-line"></div><div class="write-line"></div><h2>Notre amélioration et notre preuve</h2><div class="write-line"></div><div class="write-line"></div><div class="write-line"></div><p><strong>Pour aller plus loin :</strong> ${esc(m.advanced)}</p></div></section>`,
      )
      .join("");
  if (type === "enquete")
    return `<section class="print-sheet">${brand}<h1>L’enquête des sources</h1><div class="callout"><p style="white-space:pre-line">${esc(c.sourceText)}</p></div><h2>La réponse à contrôler</h2><p>« L’atelier commence à 14 h 30. Il faut apporter un ordinateur. Les dix premières personnes recevront un casque. »</p><p>Pour chaque affirmation : confirmé, contredit ou non établi ? Indiquez le passage qui vous permet de répondre.</p>${[1, 2, 3].map((i) => `<h2>Affirmation ${i}</h2><div class="write-line"></div><div class="write-line"></div>`).join("")}</section><section class="print-sheet">${brand}<h1>Corrigé animateur</h1><p>${esc(c.sourceAnswer)}</p><p>L’absence de preuve ne donne pas le droit d’inventer une information. Cet exercice est fictif et préparé, pas une réponse d’IA obtenue en direct.</p></section>`;
  if (type === "trame")
    return c.sections
      .map(
        (s, i) =>
          `<section class="print-sheet">${brand}<p class="eyebrow">SÉQUENCE ${i + 1} · ${s.minutes} MINUTES</p><h1>${esc(s.title)}</h1><p><strong>Objectif :</strong> ${esc(s.goal)}</p><p>${esc(s.notes)}</p><p><strong>Matériel :</strong> ${esc(s.material)}</p>${c.slides
            .filter((x) => x.section === s.id)
            .map(
              (x) =>
                `<h2>${esc(x.title)}${x.bonus ? " (bonus)" : ""}</h2><p style="white-space:pre-line">${esc("À dire : " + x.guide.say + "\nÀ faire : " + x.guide.do + "\nFaire participer : " + x.guide.participate)}</p><p><strong>Action :</strong> ${esc(x.action)}</p>${x.answer ? `<p><strong>Réponse :</strong> ${esc(x.answer)}. ${esc(x.explanation || "")}</p>` : ""}`,
            )
            .join("")}</section>`,
      )
      .join("");
  if (type === "sortie")
    return [1, 2, 3]
      .map(
        () =>
          `<div class="mission-print" style="margin-bottom:20px">${brand}<h2>Mon billet de sortie</h2><p>Une chose que je sais faire :</p><div class="write-line"></div><p>Une chose que je vérifierai :</p><div class="write-line"></div><p>Une situation où je préfère m’en passer :</p><div class="write-line"></div></div>`,
      )
      .join("");
  if (type === "slides")
    return `<div class="deck-print">${c.slides.map((s) => '<div class="print-stage">' + stageHTML(s, { animations: false }) + "</div>").join("")}</div>`;
  return "";
}

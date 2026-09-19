import { defaultCourse as original } from "./course-base.js";
import { clone, uid } from "./model.js";
const colors = {
  ink: "#20233c",
  purple: "#7856da",
  pink: "#ef638d",
  teal: "#168e83",
  white: "#ffffff",
  muted: "#697086",
};
export function element(type, x, y, w, h, extra = {}) {
  return { id: uid(), type, x, y, w, h, rotation: 0, opacity: 1, ...extra };
}
const text = (t, x, y, w, h, size = 40, extra = {}) =>
  element("text", x, y, w, h, {
    text: t,
    fontSize: size,
    fontFamily: "Inter",
    color: colors.ink,
    bold: false,
    align: "left",
    ...extra,
  });
const shape = (x, y, w, h, color, radius = 24) =>
  element("shape", x, y, w, h, { fill: color, radius });
/** Les slides natives deviennent des objets libres, tous manipulables sur le canevas. */
export function createLayout(s) {
  const dark = s.theme === "dark",
    fg = dark ? colors.white : colors.ink,
    muted = dark ? "#c9c2e2" : colors.muted;
  const el = [
    text("MJC YVETOT   /   LAB IA", 6, 5, 75, 4, 19, {
      color: dark ? "#bfa9ff" : colors.purple,
      bold: true,
    }),
  ];
  const media = !!s.media;
  if (s.kind === "cover" || s.kind === "closing") {
    el.push(
      shape(76, 21, 17, 30, "#7856da", 150),
      shape(82, 56, 8, 14, "#ef638d", 90),
      shape(71, 66, 4, 7, "#6dd8c5", 70),
    );
    el.push(
      text(s.title, 6, 23, 69, 25, 86, { color: fg, bold: true }),
      text(s.subtitle, 6, 53, 67, 8, 28, { color: muted }),
    );
    el.push(text(s.body.join("\n"), 6, 68, 65, 17, 32, { color: fg }));
  } else if (media) {
    el.push(
      text(s.title, 6, 12, 88, 10, 53, { color: fg, bold: true }),
      text(s.subtitle, 6, 24, 88, 5, 24, { color: muted }),
    );
    if (s.media.type === "image" || s.media.type === "video")
      el.push(
        element(s.media.type, 17, 33, 66, 53, {
          src: s.media.src,
          alt: s.media.alt,
          fit: "contain",
          radius: 18,
        }),
      );
    else {
      el.push(
        element("audio", 13, 40, 74, 33, {
          src: s.media.src,
          alt: s.media.alt,
        }),
      );
      el.push(
        text("Écoutez. Votez. Expliquez votre choix.", 10, 79, 80, 6, 26, {
          color: muted,
          align: "center",
        }),
      );
    }
  } else if (s.kind === "cards") {
    el.push(
      text(s.title, 6, 15, 88, 15, 58, { color: fg, bold: true }),
      text(s.subtitle, 6, 32, 88, 6, 25, { color: muted }),
    );
    const n = s.body.length,
      cols = n === 4 ? 2 : Math.min(3, n),
      rows = Math.ceil(n / cols),
      cw = (88 - (cols - 1) * 2) / cols,
      ch = rows === 1 ? 32 : 20;
    s.body.forEach((value, i) => {
      const [title, ...body] = value.split("|"),
        x = 6 + (i % cols) * (cw + 2),
        y = 45 + Math.floor(i / cols) * (ch + 3);
      el.push(shape(x, y, cw, ch, dark ? "#2b2a4f" : "#ffffff", 18));
      el.push(
        shape(
          x + 1.6,
          y + 2.8,
          0.4,
          ch - 5.6,
          [colors.purple, colors.pink, colors.teal][i % 3],
          4,
        ),
      );
      el.push(
        text(title, x + 3, y + 3, cw - 6, 7, rows === 1 ? 31 : 29, {
          bold: true,
          color: fg,
        }),
      );
      el.push(
        text(
          body.join("|"),
          x + 3,
          y + 11,
          cw - 6,
          ch - 12,
          rows === 1 ? 27 : 24,
          { color: muted },
        ),
      );
    });
  } else if (s.kind === "pause") {
    el.push(
      shape(75, 31, 17, 30, "#e2d8fa", 150),
      text(s.title, 6, 28, 67, 20, 72, { color: fg, bold: true }),
      text("On recharge les batteries.", 6, 54, 67, 8, 34, { color: muted }),
      text(s.subtitle, 6, 71, 65, 8, 27, { color: colors.purple }),
    );
  } else {
    const titleSize = s.title.length > 45 ? 50 : 59;
    el.push(
      text(s.title, 6, 15, 88, 16, titleSize, { color: fg, bold: true }),
      text(s.subtitle, 6, 33, 88, 6, 24, { color: muted }),
    );
    if (s.body.length === 1) {
      el.push(
        shape(6, 46, 0.5, 32, colors.pink, 4),
        text(s.body[0], 10, 46, 80, 35, s.body[0].length > 200 ? 34 : 42, {
          color: fg,
        }),
      );
    } else
      s.body.forEach((t, i) => {
        const y = 44 + i * (s.body.length > 3 ? 10.5 : 14);
        el.push(
          text(String(i + 1).padStart(2, "0"), 6, y, 5, 7, 25, {
            color: dark ? "#bca4ff" : colors.purple,
            bold: true,
          }),
          text(t, 13, y, 79, 11, s.body.length > 3 ? 30 : 34, { color: fg }),
        );
      });
  }
  el.push(
    text("MJC d’Yvetot  ·  À vous de garder la main.", 6, 93, 82, 3, 17, {
      color: muted,
    }),
  );
  return el.map((e, i) => ({ ...e, id: s.id + "-e" + i }));
}
const guideText = {
  s1: [
    "Ici, on va tester des idées, créer et apprendre à vérifier. Pas besoin d’être déjà expert.",
    "Accueillir le groupe ; montrer les trois temps : jouer, créer, discuter.",
    "Inviter deux jeunes à dire ce qu’ils aimeraient savoir faire.",
  ],
  s2: [
    "Chacun peut partir de son niveau. Avoir repéré une erreur est déjà une compétence.",
    "Faire voter à main levée, puis former cinq binômes qui s’entraident.",
    "Une réussite ou une surprise, sans citer de donnée personnelle.",
  ],
  s3: [
    "On peut essayer, dire « je ne sais pas » et passer son tour. On ne donne pas nos informations privées.",
    "Montrer l’arrêt du micro et annoncer quand il sera activé.",
    "Demander un exemple d’information à ne pas transmettre.",
  ],
  s4: [
    "Vous pouvez voter IA, sans IA, ou impossible à savoir. C’est votre preuve qui compte.",
    "Faire un vote d’essai avec trois gestes, sans noter les personnes.",
    "Faire expliquer ce qui pourrait changer un avis.",
  ],
  s5: [
    "Regardez cette image. De quoi auriez-vous besoin pour connaître son origine ?",
    "Laisser observer 15 secondes ; recueillir les votes ; révéler ensuite.",
    "Deux arguments opposés, puis lecture de la provenance NASA.",
  ],
  s6: [
    "Cette scène pourrait-elle exister ? Et est-ce suffisant pour savoir comment l’image a été faite ?",
    "Afficher l’image sans commentaire. Révéler seulement après les arguments.",
    "Demander quelle preuve serait plus solide qu’une impression.",
  ],
  s7: [
    "La question porte sur l’auteur de ces vers, pas sur l’outil qui les affiche.",
    "Laisser une personne lire les quatre vers ; recueillir un vote.",
    "Une IA peut-elle recopier une œuvre humaine ? Pourquoi ce n’est pas la même question ?",
  ],
  s8: [
    "Un texte naturel peut-il être inventé ? Une faute prouve-t-elle qu’une personne l’a écrit ?",
    "Lire l’avis fictif, faire voter, puis annoncer sa fabrication pour l’atelier.",
    "Inventer un indice trompeur et expliquer pourquoi il ne suffit pas.",
  ],
  s9: [
    "Écoutez le son avant de décider. Numérique veut-il forcément dire intelligence artificielle ?",
    "Lire l’extrait une fois, au besoin une seconde fois. Révéler la partition programmée.",
    "Demander ce qui différencie un logiciel qui suit des règles et un modèle entraîné.",
  ],
  s10: [
    "La photo est la même. La phrase qui l’accompagne change : que pouvons-nous vérifier ?",
    "Reprendre la provenance de la première manche ; révéler la fausse légende.",
    "Faire proposer une légende exacte en une phrase.",
  ],
  s11: [
    "Une image réelle peut tromper. Une image générée peut illustrer une idée honnêtement.",
    "Conclure en demandant qui publie, quand, et avec quelle preuve.",
    "Inviter chacun à citer une information de provenance utile.",
  ],
  s12: [
    "Un mouvement fluide n’est pas une preuve d’IA.",
    "Lire l’animation, voter, puis expliquer les trajectoires calculées.",
    "Demander un exemple d’animation sans IA qu’ils connaissent.",
  ],
  s13: [
    "Un chiffre précis et un nom sérieux ne remplacent pas une source.",
    "Annoncer après le vote que la référence est inventée pour le jeu.",
    "Quelle publication faudrait-il retrouver pour vérifier ?",
  ],
  s14: [
    "Complétez la phrase. Maintenant, imaginez que nous sommes à un atelier cuisine.",
    "Prendre trois propositions, changer le contexte, reprendre trois propositions.",
    "Qu’est-ce qui a changé dans vos réponses ?",
  ],
  s15: [
    "L’IA ne fait pas seulement des textes : elle peut classer, recommander ou générer.",
    "Relier chaque famille à un usage quotidien ; préciser que tout automatisme n’est pas une IA.",
    "Un exemple par binôme : photo, vidéo recommandée, texte créé.",
  ],
  s16: [
    "Une réponse peut être très bien formulée et quand même fausse.",
    "Distinguer une formulation plausible et une information vérifiée.",
    "Demander ce qu’ils feraient avant de reprendre une date ou une citation.",
  ],
  s17: [
    "La voix peut sembler humaine, mais le système peut se tromper et n’est pas une personne.",
    "Montrer les commandes possibles et le bouton d’arrêt.",
    "Faire citer une action pour laquelle un humain doit garder la décision.",
  ],
  s18: [
    "Une bonne demande explique ce qu’on veut réussir et à quoi doit ressembler le résultat.",
    "Prendre l’exemple d’un quiz de révision ; repérer les quatre éléments.",
    "Faire proposer une contrainte utile : niveau, longueur, indice avant réponse.",
  ],
  s19: [
    "Votre défi : obtenir trois questions adaptées à votre niveau, une à la fois.",
    "Cinq binômes. Comparer une demande vague et une demande améliorée ; circuler.",
    "Chacun montre un changement de consigne et son effet, pas seulement la réponse finale.",
  ],
  s20: [
    "Demander un indice permet de continuer à réfléchir.",
    "Faire tester cette consigne sur une notion connue ; ne pas fournir le corrigé d’emblée.",
    "Un jeune reformule l’explication sans regarder l’écran.",
  ],
  s21: [
    "La fiche est votre source. Pour chaque phrase : vrai selon la fiche, faux, ou non établi ?",
    "Distribuer l’enquête. Laisser chercher, souligner les preuves, puis révéler.",
    "Un binôme défend une correction en montrant le passage exact.",
  ],
  s22: [
    "Une citation est un point de départ. Il faut ouvrir la source et comparer ce qu’elle dit.",
    "Reprendre une affirmation de l’enquête et appliquer les trois gestes.",
    "Demander pourquoi une deuxième réponse d’IA n’est pas une preuve indépendante.",
  ],
  s23: [
    "Nos noms, nos photos et nos secrets ne sont pas nécessaires pour tester une IA.",
    "Utiliser uniquement des exemples fictifs ; rappeler le droit de refuser le micro.",
    "Chacun propose une façon d’anonymiser une demande.",
  ],
  s24: [
    "On fait une vraie pause. Rendez-vous dans quinze minutes.",
    "Couper le micro, laisser le temps de séance tourner, vérifier discrètement le matériel.",
    "Proposer eau et mouvement, sans imposer de prise de parole.",
  ],
  s25: [
    "Voici Trame. Nous allons écouter, puis vérifier ce qui est dit.",
    "Annoncer clairement si la réponse est générée en direct ou préparée. Tester l’arrêt.",
    "Une question courte choisie par le groupe.",
  ],
  s26: [
    "C’est nous qui posons la question, contrôlons et décidons quoi en faire.",
    "Montrer une commande de slide, puis une question reformulée sans information personnelle.",
    "Faire repérer une limite dans la réponse.",
  ],
  s27: [
    "Choisissez une mission, créez une première version et améliorez-la.",
    "Donner une carte par binôme. Un pilote et un vérificateur ; changer les rôles à mi-parcours.",
    "Demander à chaque binôme ses deux critères de réussite avant de commencer.",
  ],
  s28: [
    "Choisissez le défi qui vous intéresse. Il n’y a pas de mission « pour les meilleurs ».",
    "Faire choisir ; réduire l’objectif des binômes bloqués ; laisser les plus rapides approfondir.",
    "Chaque binôme annonce son résultat attendu en une phrase.",
  ],
  s29: [
    "Votre création n’est pas terminée tant que vous ne pouvez pas expliquer vos choix.",
    "Circuler, demander une vérification et une amélioration précise.",
    "Faire préparer une minute de présentation sans lire tout l’écran.",
  ],
  s30: [
    "Montrez votre idée, votre amélioration et votre preuve.",
    "Un binôme à la fois, environ une minute, puis une question bienveillante.",
    "Le groupe cite un point réussi et une question utile.",
  ],
  s31: [
    "On se lève si on le souhaite et on repose les yeux.",
    "Couper le micro. Prévoir une alternative assise.",
    "Reprise dans dix minutes, sans activité obligatoire.",
  ],
  s32: [
    "D’accord, pas d’accord, ça dépend ? Vous pouvez changer d’avis.",
    "Faire voter, donner la parole à deux avis différents, puis reprendre le vote.",
    "Faire distinguer comprendre une explication et rendre une copie toute faite.",
  ],
  s33: [
    "Une voix chaleureuse nous donne parfois envie de lui faire confiance. Est-ce une preuve ?",
    "Faire discuter l’affirmation sans demander d’expérience intime.",
    "Demander quelles aides un ami, un enseignant ou un professionnel peuvent apporter.",
  ],
  s34: [
    "Un métier contient plusieurs tâches et des responsabilités.",
    "Choisir un métier connu et le décomposer en trois tâches concrètes.",
    "Pour chacune : que peut aider à faire l’IA, que faut-il vérifier, qui décide ?",
  ],
  s35: [
    "Même si un outil fait gagner du temps, on peut choisir de s’en passer.",
    "Faire citer les enjeux : apprentissage, informations privées, ressources, relation humaine.",
    "Un exemple où un crayon, un livre ou une personne suffit.",
  ],
  s36: [
    "L’assistant a l’air sûr de lui. À vous de trouver trois erreurs et de les corriger avec une raison.",
    "Laisser quatre minutes en binômes. Recueillir les preuves avant de révéler.",
    "Chaque binôme reformule une bonne règle sans lire la slide.",
  ],
  s37: [
    "Avant de partir, choisissez une chose que vous savez mieux faire et une chose à vérifier.",
    "Distribuer les billets, accepter une réponse orale ou écrite ; pas de classement.",
    "Un volontaire partage un réflexe qu’il gardera.",
  ],
  s38: [
    "L’IA peut vous aider. Vos questions, vos vérifications et vos choix restent essentiels.",
    "Distribuer le mémo ; arrêter le micro ; vérifier l’enregistrement du cours.",
    "Remercier et laisser une dernière question.",
  ],
};
export function upgradeCourse(input) {
  const c = clone(input);
  c.schema = 2;
  for (const s of c.slides) {
    s.background = s.background || (s.theme === "dark" ? "#191c3b" : "#f5f3fb");
    s.elements = s.elements || createLayout(s);
    s.guide = s.guide || {
      say:
        guideText[s.id]?.[0] ||
        s.notes ||
        "Introduire la notion en une phrase.",
      do:
        guideText[s.id]?.[1] ||
        "Afficher la slide et laisser le temps de lire.",
      participate: guideText[s.id]?.[2] || s.action || "Inviter une question.",
    };
    s.transition = s.transition || "fade";
  }
  return c;
}
const revised = clone(original);
revised.slides.find((s) => s.id === "s6").title = "Une sortie au skatepark ?";
revised.slides.find((s) => s.id === "s6").media = {
  type: "image",
  src: "assets/skatepark-ia.png",
  alt: "Un skateboard dans un skatepark vide après la pluie",
};
revised.slides.find((s) => s.id === "s6").explanation =
  "Cette image a été créée avec un modèle d’IA pour cet atelier. Le lieu et le moment représentés ne sont pas une photographie documentée.";
revised.slides.find((s) => s.id === "s6").source =
  "Image générée pour l’atelier MJC, septembre 2026. Provenance conservée dans le projet.";
revised.slides.find((s) => s.id === "s9").media.src = "assets/beat-atelier.wav";
revised.slides.find((s) => s.id === "s9").title = "Un beat, une IA ?";
revised.slides.find((s) => s.id === "s9").notes =
  "Écouter les douze secondes, recueillir les votes, puis révéler la partition programmée.";
revised.slides.find((s) => s.id === "s18").body = [
  "Objectif|Un quiz pour réviser.",
  "Contexte|Mon niveau et la notion.",
  "Contraintes|Un indice avant la réponse.",
  "Résultat|Trois questions, une à la fois.",
];
revised.slides.find((s) => s.id === "s19").body = [
  "Demandez un quiz sur une notion connue.",
  "Vérifiez : bon niveau ? Une question à la fois ?",
  "Améliorez votre demande et réessayez.",
  "Montrez ce qui a changé.",
];
revised.slides.find((s) => s.id === "s27").body = [
  "Choisissez un défi qui vous plaît.",
  "Créez, testez et améliorez votre idée.",
  "Vérifiez une information ou une règle.",
  "Préparez une minute pour nous la montrer.",
];
// Le bilan du jeu vient après les bonus ; le pupitre permet de les ignorer sans perdre le fil.
const bilan = revised.slides.splice(
  revised.slides.findIndex((s) => s.id === "s11"),
  1,
)[0];
revised.slides.splice(
  revised.slides.findIndex((s) => s.id === "s13") + 1,
  0,
  bilan,
);
export const defaultCourse = upgradeCourse(revised);

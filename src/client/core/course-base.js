const sections = [
  [
    "accueil",
    "Bienvenue",
    10,
    "Créer un climat de curiosité",
    "Accueillir sans juger les usages. Expliquer les règles du micro et le droit de passer son tour.",
    "Cartes de vote, stylos",
  ],
  [
    "jeu",
    "IA ou pas IA ?",
    20,
    "Justifier avant de conclure",
    "Six manches principales. Une minute de vote, une justification, puis la provenance. Les deux bonus se jouent seulement si le rythme le permet.",
    "Médias intégrés, enceinte",
  ],
  [
    "comprendre",
    "Comment ça fonctionne",
    15,
    "Distinguer plausibilité et vérité",
    "Faire compléter la phrase avant de donner l’explication. Ne pas présenter la prédiction comme une définition de toute l’IA.",
    "Tableau ou feuilles",
  ],
  [
    "prompts",
    "Le duel de consignes",
    20,
    "Améliorer une demande",
    "Cinq binômes. 2 min de critères, 3 min de premier prompt, 5 min de lecture, 5 min de correction, 5 min de comparaison.",
    "Un téléphone par binôme",
  ],
  [
    "enquete",
    "L’enquête des sources",
    15,
    "Prouver une correction",
    "Distribuer la fiche source fictive. L’exemple erroné est un exercice préparé : ne pas prétendre qu’il a été produit en direct.",
    "Fiche enquête imprimée",
  ],
  [
    "pause1",
    "Pause",
    15,
    "Souffler",
    "Couper toute écoute. Vérifier les appareils sans interrompre la pause.",
    "Eau",
  ],
  [
    "trame",
    "Rencontre avec Trame",
    10,
    "Comprendre une IA qui parle",
    "Dire que la voix est artificielle. Montrer une reformulation, un indice et l’arrêt immédiat. En mode sans API, annoncer que les réponses sont préparées.",
    "Yeti et enceinte",
  ],
  [
    "studio",
    "Le studio de création",
    35,
    "Créer, tester et vérifier",
    "Distribuer les missions. 5 min de choix, 10 min de première version, 10 min de correction, 5 min de vérification, 5 min de préparation du pitch. Inverser pilote et vérificateur à mi-parcours.",
    "Missions, téléphones",
  ],
  [
    "galerie",
    "La galerie",
    15,
    "Expliquer ses choix",
    "Une minute par binôme, puis une question. Valoriser aussi une erreur bien détectée, pas seulement une jolie production.",
    "Productions des binômes",
  ],
  [
    "pause2",
    "Pause mouvement",
    10,
    "Bouger",
    "Micro coupé. Proposer de se lever, avec une alternative assise.",
    "Eau",
  ],
  [
    "debat",
    "Études & métiers",
    20,
    "Construire son jugement",
    "Quatre affirmations, quatre minutes chacune, puis synthèse. Autoriser le changement d’avis. Pas de pronostic individuel sur l’emploi.",
    "Espace pour voter",
  ],
  [
    "defi",
    "Le défi final",
    15,
    "Corriger avec une preuve",
    "Faire relire l’exemple préparé. Les jeunes doivent prouver la correction, puis expliquer sans écran.",
    "Fiche enquête",
  ],
  [
    "bilan",
    "Ce qu’on emporte",
    10,
    "Réutiliser avec discernement",
    "Trois questions de sortie. Distribuer le mémo. Proposer trois défis facultatifs, sans devoir obligatoire ni annonce d’une séance non prévue.",
    "Mémo, billets de sortie",
  ],
].map(([id, title, minutes, goal, notes, material]) => ({
  id,
  title,
  minutes,
  goal,
  notes,
  material,
}));
let count = 0;
const slide = (section, kind, title, subtitle, body, notes, extra = {}) => ({
  id: `s${++count}`,
  section,
  kind,
  title,
  subtitle,
  body,
  notes,
  action: "Faire intervenir le groupe avant de poursuivre.",
  tip: "Si le temps manque, garder la vérification et raccourcir la restitution.",
  theme: ["cover", "statement", "game", "closing"].includes(kind)
    ? "dark"
    : "light",
  ...extra,
});
const slides = [
  slide(
    "accueil",
    "cover",
    "L’IA, à vous de jouer",
    "MJC d’Yvetot · 23 septembre 2026",
    ["Créer. Enquêter. Garder les commandes.", "Avec Matthieu Frain"],
    "Bienvenue ! Aujourd’hui vous allez essayer, vous tromper, améliorer et vérifier. Le but : repartir avec un usage utile et des limites claires.",
    { action: "Demander : « Qu’aimeriez-vous réussir à faire aujourd’hui ? »" },
  ),
  slide(
    "accueil",
    "cards",
    "Vous en êtes où ?",
    "Un vote, sans bonne ou mauvaise réponse",
    [
      "Jamais essayé|Je suis surtout curieux.",
      "Déjà testé|J’ai une réussite… ou un raté.",
      "Souvent utilisé|Je peux aider un binôme.",
    ],
    "Vote à main levée. Ne demander aucun exemple personnel sensible. Faire trois questions de départ : une citation suffit-elle ? Une vraie photo peut-elle tromper ? Peut-on apprendre avec une IA ?",
  ),
  slide(
    "accueil",
    "cards",
    "Nos règles du jeu",
    "Tout le monde peut participer",
    [
      "On essaie|Le droit de se tromper et de passer son tour.",
      "On protège|Pas de noms, photos, secrets ou infos personnelles dans les outils.",
      "On garde la main|Le micro s’active seulement pour les moments annoncés.",
    ],
    "Montrer le bouton d’arrêt du micro. Pas d’enregistrement permanent par défaut. Proposer des votes assis et l’écriture plutôt que la prise de parole.",
  ),
  slide(
    "jeu",
    "cards",
    "Humain, IA… ou indéterminable ?",
    "Un indice n’est pas une preuve",
    [
      "Plutôt humain|Je donne une raison.",
      "Plutôt IA|Je donne une raison.",
      "Impossible à conclure|Je dis quelle preuve manque.",
    ],
    "Règle : on vote avant la révélation. Valoriser une bonne démarche même avec un verdict erroné. Deux bonus facultatifs suivent le bilan du jeu.",
    {
      action:
        "Lancer les six manches. Compter les votes si cela aide, sans noter les personnes.",
    },
  ),
  slide(
    "jeu",
    "game",
    "Une planète bien réelle ?",
    "Manche 1 · Photo",
    [],
    "Attendre les arguments : réalisme, symétrie et beauté ne suffisent pas.",
    {
      media: {
        type: "image",
        src: "assets/terre-nasa.jpg",
        alt: "La Terre vue dans l’espace",
      },
      answer: "Une photographie humaine",
      explanation:
        "La NASA documente cette photo prise par l’équipage d’Apollo 17 le 7 décembre 1972. C’est la provenance qui nous renseigne.",
      source: "NASA Johnson Space Center · Apollo 17, 1972",
      sourceUrl: "https://svs.gsfc.nasa.gov/30613",
      action: "Vote, niveau de confiance, puis révélation.",
    },
  ),
  slide(
    "jeu",
    "game",
    "Un plat très convaincant",
    "Manche 2 · Image",
    [],
    "Il peut ne pas y avoir d’anomalie visible. Ne pas inventer de défaut pour justifier la réponse.",
    {
      media: {
        type: "image",
        src: "assets/plat-ia.jpg",
        alt: "Un plat mijoté, du pain et des couverts",
      },
      answer: "Une image générée par IA",
      explanation:
        "Le support d’origine de Matthieu indique une génération avec Gemini. L’image seule ne permet pas de le prouver.",
      source:
        "Média fourni par Matthieu · provenance déclarée dans le jeu original",
      action: "Demander : « Que faudrait-il voir pour être plus sûr ? »",
    },
  ),
  slide(
    "jeu",
    "game",
    "Qui a écrit ces mots ?",
    "Manche 3 · Auteur de l’œuvre",
    [
      "Il pleure dans mon cœur\nComme il pleut sur la ville ;\nQuelle est cette langueur\nQui pénètre mon cœur ?",
    ],
    "La question porte sur l’auteur de l’œuvre, pas sur l’outil qui affiche ou recopie le texte.",
    {
      answer: "Une œuvre de Paul Verlaine",
      explanation:
        "Ces vers appartiennent à Romances sans paroles, publié en 1874. Une IA pourrait aussi les recopier : distinguer auteur et reproduction.",
      source: "Paul Verlaine · Romances sans paroles, 1874 · domaine public",
    },
  ),
  slide(
    "jeu",
    "game",
    "Un avis qui sonne vrai",
    "Manche 4 · Texte",
    [
      "« Super après-midi ! Le jeu était drôle, même si on a mis du temps à comprendre les règles. À refaire avec les copains. »",
    ],
    "Ne pas accepter « il y a une faute donc c’est humain » comme preuve.",
    {
      answer: "Un texte généré pour cet atelier",
      explanation:
        "Ce court avis a été rédigé avec l’IA pendant la préparation. Le style et les petites imperfections ne prouvent pas une origine humaine.",
      source: "Exemple fictif généré pour l’atelier · aucun avis réel",
    },
  ),
  slide(
    "jeu",
    "game",
    "Qui compose ce rythme ?",
    "Manche 5 · Audio",
    [],
    "Faire écouter 12 secondes. Éviter les commentaires techniques avant le vote.",
    {
      media: {
        type: "audio",
        src: "assets/motif.wav",
        alt: "Courte suite de notes synthétiques",
      },
      answer: "Un programme suit une partition fixe",
      explanation:
        "Ce son suit une suite de notes déterminée à l’avance, sans modèle de musique générative. Un son numérique n’est pas forcément de l’IA.",
      source:
        "Motif synthétique préparé pour l’atelier · génération déterministe",
      action: "Lire le média depuis la régie, puis révéler.",
    },
  ),
  slide(
    "jeu",
    "game",
    "« Photo prise hier depuis Yvetot »",
    "Manche 6 · Photo et légende",
    [],
    "Cette manche interroge la vérité du message, pas seulement la fabrication de l’image.",
    {
      media: {
        type: "image",
        src: "assets/terre-nasa.jpg",
        alt: "La photographie de la Terre d’Apollo 17",
      },
      answer: "La photo est authentique. La légende est fausse.",
      explanation:
        "Nous venons de vérifier sa provenance : Apollo 17, 1972. Une image réelle peut accompagner une information trompeuse.",
      source: "NASA · légende volontairement fausse pour cet exercice",
      sourceUrl: "https://svs.gsfc.nasa.gov/30613",
    },
  ),
  slide(
    "jeu",
    "statement",
    "La provenance compte plus que l’impression",
    "Ce que le jeu nous apprend",
    [
      "Humain ne veut pas dire vrai.",
      "Généré ne veut pas dire forcément faux.",
      "Avant de partager : qui publie, quand, avec quelle preuve ?",
    ],
    "Faire formuler les conclusions par les jeunes. Passer à la séquence suivante si les vingt minutes sont écoulées.",
    { action: "Deux bonus suivent : les ignorer si le temps est écoulé." },
  ),
  slide(
    "jeu",
    "game",
    "Un mouvement parfait",
    "Bonus · Vidéo",
    [],
    "Montrer qu’une animation informatique peut être obtenue par des règles explicites.",
    {
      bonus: true,
      media: {
        type: "video",
        src: "assets/mouvement.mp4",
        alt: "Trois points animés selon des trajectoires régulières",
      },
      answer: "Une animation programmée",
      explanation:
        "Le mouvement suit des formules fixes. L’aspect artificiel d’une vidéo ne suffit pas à conclure qu’un modèle génératif l’a créée.",
      source: "Animation pédagogique produite par code pour cet atelier",
    },
  ),
  slide(
    "jeu",
    "game",
    "Une source inventée suffit-elle ?",
    "Bonus · Citation",
    [
      "« Selon l’Institut mondial des devoirs automatiques, 97 % des élèves apprennent mieux en copiant une IA. »",
    ],
    "Exemple entièrement fictif. Donner du temps pour formuler une méthode de vérification, pas pour débattre du chiffre.",
    {
      bonus: true,
      answer: "Cette référence est fictive",
      explanation:
        "Un nom sérieux et un chiffre précis ne constituent pas une preuve. Chercher la publication, son auteur et ce qu’elle mesure.",
      source: "Phrase volontairement inventée pour l’exercice",
    },
  ),
  slide(
    "comprendre",
    "exercise",
    "À vous de compléter",
    "Petit jeu de prédiction",
    [
      "« Demain, à la MJC, nous allons… »",
      "Proposez deux suites.",
      "Nouveau contexte : un atelier cuisine. Et maintenant ?",
    ],
    "2 min de propositions puis changement de contexte. Ce jeu illustre le contexte, pas tout le fonctionnement d’un modèle.",
    { action: "Demander en quoi le contexte a changé les réponses." },
  ),
  slide(
    "comprendre",
    "cards",
    "Plusieurs façons d’utiliser l’IA",
    "La génération n’est qu’une famille d’usages",
    [
      "Reconnaître|Repérer des formes ou classer des données.",
      "Recommander|Proposer une vidéo, une chanson ou un résultat.",
      "Générer|Produire du texte, une image ou de l’audio.",
    ],
    "Les fonctions dépendent du système. Toutes les automatisations ne sont pas des IA. Faire donner un exemple de chaque catégorie.",
  ),
  slide(
    "comprendre",
    "statement",
    "Plausible ne veut pas dire vrai",
    "Les modèles de langage",
    [
      "Ils apprennent des régularités dans des données.",
      "Ils produisent une réponse en fonction du contexte.",
      "Ils peuvent répondre avec assurance… et se tromper.",
    ],
    "L’analogie du clavier prédictif est une entrée en matière, pas une description exhaustive. Expliquer qu’un outil de recherche peut apporter des sources actuelles.",
  ),
  slide(
    "comprendre",
    "cards",
    "Une voix humaine, une machine",
    "Comprendre les limites",
    [
      "Une voix expressive|Elle ne prouve ni conscience ni sentiments.",
      "Des actions possibles|Uniquement avec des outils et des permissions.",
      "Des erreurs possibles|On garde le contrôle et on vérifie.",
    ],
    "Éviter « elle ne décide rien seule ». Distinguer produire une phrase et déclencher une action autorisée.",
  ),
  slide(
    "prompts",
    "cards",
    "Une demande qui aide vraiment",
    "Les quatre repères",
    [
      "Objectif|Qu’est-ce que je veux réussir ?",
      "Contexte|Quel niveau, quel besoin ?",
      "Contraintes|Quelles limites respecter ?",
      "Résultat|Une liste, un quiz, un plan ?",
    ],
    "Un rôle peut aider, mais n’est pas obligatoire. L’essentiel est la demande et la vérification du résultat.",
  ),
  slide(
    "prompts",
    "exercise",
    "« Fais un quiz »… peut mieux faire",
    "Duel de consignes · cinq binômes",
    [
      "Choisissez deux critères de réussite.",
      "Testez une première demande.",
      "Repérez un problème et améliorez la consigne.",
      "Comparez les deux réponses.",
    ],
    "Exemple : quiz niveau 5e sur le système solaire, trois questions, une à la fois, indice avant corrigé. Ne pas donner la solution immédiatement.",
    { action: "Lancer un minuteur de 5 minutes pour la première phase." },
  ),
  slide(
    "prompts",
    "statement",
    "L’IA peut aussi vous aider à chercher",
    "Un exemple à adapter",
    [
      "« Je révise [notion]. Pose-moi une question à la fois. Attends ma réponse. Si je bloque, donne un indice avant la solution. »",
    ],
    "Demander au groupe de repérer objectif, contexte et format. Puis faire expliquer une notion sans lire la réponse de l’IA.",
  ),
  slide(
    "enquete",
    "exercise",
    "Mission : prouver ce qui est vrai",
    "Une réponse convaincante est-elle exacte ?",
    [
      "« L’atelier commence à 14 h 30. Il faut apporter un ordinateur. Les dix premières personnes recevront un casque. »",
      "Surlignez : confirmé, contredit, non établi.",
    ],
    "Distribuer la fiche source fictive disponible dans Supports. Corrigé : début 14 h, téléphone possible, rien ne confirme les casques.",
    {
      answer: "Deux erreurs et une promesse non établie",
      explanation:
        "La fiche annonce 14 h et autorise un téléphone. Elle ne promet aucun casque. L’absence d’information ne permet pas d’inventer une réponse.",
      action: "Laisser chercher avant de révéler le corrigé.",
    },
  ),
  slide(
    "enquete",
    "cards",
    "Vérifier en trois gestes",
    "Une citation ne suffit pas",
    [
      "Ouvrir|Retrouver la vraie source.",
      "Comparer|Lire le passage qui soutient l’affirmation.",
      "Situer|Vérifier auteur, date et contexte.",
    ],
    "Une réponse d’IA qui confirme une autre réponse n’est pas une vérification indépendante. Les sources officielles sont utiles selon le sujet, mais doivent aussi être lues.",
  ),
  slide(
    "enquete",
    "cards",
    "Nos données nous appartiennent",
    "Des réflexes concrets",
    [
      "Masquer|Noms, adresses et informations personnelles.",
      "Demander|Avant d’utiliser une photo ou la voix de quelqu’un.",
      "Garder pour soi|Mots de passe, santé, documents privés.",
    ],
    "Le mode temporaire n’est pas un coffre-fort. Une analyse d’arnaque par IA n’est pas une certification. Ne pas coller de vrai SMS avec ses données.",
  ),
  slide(
    "pause1",
    "pause",
    "Une pause bien méritée",
    "15 minutes",
    ["On se retrouve pour faire parler Trame."],
    "Couper l’écoute et laisser la pause se dérouler. Ne pas enregistrer les échanges informels.",
  ),
  slide(
    "trame",
    "cover",
    "Voici Trame",
    "Une voix artificielle, des réponses à vérifier",
    ["Un exemple. Un indice. Une question."],
    "Annoncer le mode : API en direct ou réponses préparées. Ne pas faire passer une réponse locale pré-écrite pour une génération en direct.",
    { action: "Ouvrir le panneau Trame et choisir « Présente-toi »." },
  ),
  slide(
    "trame",
    "cards",
    "Qui garde les commandes ?",
    "Une démonstration, puis une explication",
    [
      "Vous posez la question|Matthieu la reformule au micro.",
      "Trame répond|Une réponse courte et vérifiable.",
      "Nous décidons|On corrige, on demande un indice, on arrête.",
    ],
    "Montrer que la commande suivante est déterministe et limitée. Aucun besoin de reconnaissance biométrique pour cet atelier.",
  ),
  slide(
    "studio",
    "exercise",
    "Votre idée, votre création",
    "35 minutes · cinq binômes",
    [
      "Choisissez une mission et vos critères.",
      "Faites une première version, puis améliorez-la.",
      "Vérifiez un point.",
      "Préparez une minute pour expliquer vos choix.",
    ],
    "Distribuer une carte par binôme. Un pilote et un vérificateur. Au bout de quinze minutes, échanger les rôles.",
    { action: "Afficher la slide des missions ; circuler parmi les binômes." },
  ),
  slide(
    "studio",
    "cards",
    "Cinq missions au choix",
    "Deux personnes, une production",
    [
      "Réviser|Un coach qui donne des indices.",
      "Jouer|Un mini-jeu pour dix personnes.",
      "Créer|Une BD ou une affiche fictive.",
      "Enquêter|Trois affirmations à contrôler.",
      "Explorer|Des questions pour découvrir un métier.",
    ],
    "Faire choisir selon les intérêts et l’aisance, pas uniquement selon l’âge. Pour aller plus loin : ajouter une contrainte et faire tester par un autre binôme.",
  ),
  slide(
    "studio",
    "statement",
    "Votre touche humaine",
    "Avant de dire « terminé »",
    [
      "Qu’avez-vous choisi ou changé ?",
      "Quel point avez-vous vérifié ?",
      "Pouvez-vous l’expliquer sans l’IA ?",
    ],
    "À afficher pendant la seconde moitié de l’atelier. Aider les binômes bloqués à réduire leur objectif.",
  ),
  slide(
    "galerie",
    "exercise",
    "Une minute pour nous montrer",
    "La galerie des binômes",
    [
      "Notre objectif.",
      "Notre résultat et notre correction.",
      "Notre vérification.",
    ],
    "Cinq pitchs d’une minute, une question après chacun. Valoriser la progression, la preuve et l’idée originale.",
    { action: "Lancer le minuteur de 1 minute à chaque pitch." },
  ),
  slide(
    "pause2",
    "pause",
    "On bouge un peu",
    "10 minutes",
    ["Une pause sans écran."],
    "Couper le micro. Proposer de se lever sans l’imposer.",
  ),
  slide(
    "debat",
    "statement",
    "L’IA aide-t-elle à apprendre ?",
    "D’accord, pas d’accord, ça dépend",
    [
      "« Demander une explication et rendre une réponse copiée, c’est la même chose. »",
    ],
    "Faire expliciter la différence. Rappeler les consignes de l’enseignant et le travail d’appropriation.",
    { action: "Deux arguments, puis possibilité de changer de camp." },
  ),
  slide(
    "debat",
    "statement",
    "Une voix peut-elle nous tromper ?",
    "Deuxième débat",
    [
      "« Si l’IA parle avec chaleur, c’est qu’elle ressent quelque chose pour moi. »",
    ],
    "Une voix naturelle n’est pas une preuve de sentiment. Garder une place aux relations et à l’aide humaines.",
  ),
  slide(
    "debat",
    "statement",
    "Une tâche, ce n’est pas tout un métier",
    "Troisième débat",
    [
      "« Si une IA réalise une tâche d’un métier, elle peut remplacer tout le métier. »",
    ],
    "Décomposer un métier choisi par les jeunes. Exemple : préparer un document, comprendre une personne, assumer une responsabilité. Sources sur la transformation dans les notes du cours.",
    {
      sourceUrl:
        "https://www.ilo.org/fr/resource/article/quel-pourrait-etre-limpact-de-lintelligence-artificielle-generative-sur-les",
    },
  ),
  slide(
    "debat",
    "statement",
    "Faut-il l’utiliser à chaque fois ?",
    "Quatrième débat",
    ["« Si l’IA fait gagner du temps, il faut toujours l’utiliser. »"],
    "Évoquer apprentissage, données, biais, ressources et énergie. Pas de chiffre simpliste par prompt. Demander un cas où un échange humain ou un crayon suffisent.",
  ),
  slide(
    "defi",
    "exercise",
    "À vous de corriger l’assistant",
    "Exemple préparé, pas une réponse en direct",
    [
      "« Une image parfaite est forcément réelle. Une source citée suffit à prouver une réponse. En mode temporaire, je peux transmettre mes mots de passe. »",
      "Trouvez trois erreurs et proposez une meilleure réponse.",
    ],
    "4 min seuls ou en binômes, 5 min de preuves, 4 min de correction, 2 min d’explication sans écran.",
    {
      answer: "La bonne méthode compte plus que l’assurance",
      explanation:
        "Une image réaliste peut être générée. Une source doit être ouverte et comparée. Aucun mode de conversation ne justifie de transmettre un mot de passe.",
      action: "Ne révéler qu’après les arguments du groupe.",
    },
  ),
  slide(
    "bilan",
    "cards",
    "Ce que vous savez faire maintenant",
    "Le billet de sortie",
    [
      "Je sais faire…|Une demande utile et une amélioration.",
      "Je vérifierai…|Une information avant de la reprendre.",
      "Je peux m’en passer…|Une situation où je préfère faire autrement.",
    ],
    "Reprendre les trois questions du début et demander une justification. Aucun classement public.",
  ),
  slide(
    "bilan",
    "closing",
    "À vous de garder les commandes",
    "Merci · MJC d’Yvetot",
    [
      "Un défi facultatif : expliquer sans IA, vérifier une réponse ou créer en indiquant l’aide reçue.",
      "Matthieu Frain · 23 septembre 2026",
    ],
    "Distribuer le mémo. Remercier le groupe. Arrêter les micros et sauvegarder le cours sans transcription personnelle.",
  ),
];
const missions = [
  {
    title: "Coach de révision",
    task: "Créez un quiz de trois questions sur une notion que vous voulez comprendre.",
    prompt:
      "Aide-nous à réviser [notion], niveau [classe]. Pose une question à la fois. Attends notre réponse et donne un indice avant la solution.",
    check: "Comparer une explication à un cours ou un document fourni.",
    human: "Reformuler une notion sans regarder l’écran.",
    advanced:
      "Ajouter une question qui distingue deux notions souvent confondues.",
  },
  {
    title: "Mini-jeu pour la MJC",
    task: "Inventez un jeu coopératif de dix minutes pour dix personnes avec papier et feutres.",
    prompt:
      "Propose un jeu coopératif de dix minutes pour dix jeunes. Matériel : papier et feutres. Cinq règles maximum ; chacun doit avoir quelque chose à faire.",
    check: "Tester deux minutes et repérer une règle ambiguë.",
    human: "Réécrire cette règle pour un autre binôme.",
    advanced: "Prévoir une version assise et une variante plus difficile.",
  },
  {
    title: "BD ou affiche",
    task: "Imaginez une BD de quatre cases ou une affiche pour un événement fictif.",
    prompt:
      "Propose trois idées pour [BD / affiche] sur [thème]. Attends notre choix avant de développer. N’utilise aucun visage réel.",
    check:
      "Vérifier les informations utiles, la lisibilité et les stéréotypes.",
    human: "Choisir le message et modifier un élément important.",
    advanced:
      "Créer une seconde version pour un autre public et expliquer les différences.",
  },
  {
    title: "Détectives de l’information",
    task: "Contrôlez trois affirmations avec la fiche source fournie.",
    prompt:
      "Sépare les affirmations vérifiables des opinions dans ce texte. Indique les points à contrôler, sans inventer de preuve.",
    check: "Lire la source et relever le passage exact.",
    human: "Accepter « non établi » quand la preuve manque.",
    advanced: "Repérer une affirmation vraie mais trompeuse hors contexte.",
  },
  {
    title: "Découverte d’un métier",
    task: "Préparez cinq questions à poser à un professionnel, puis choisissez les trois plus utiles.",
    prompt:
      "Aide-nous à découvrir le quotidien du métier [métier]. Propose cinq questions à poser à un professionnel, sans décider de notre orientation.",
    check:
      "Vérifier une information dans une fiche Onisep choisie avec Matthieu.",
    human: "Expliquer pourquoi les trois questions retenues nous intéressent.",
    advanced: "Distinguer les tâches, les compétences et les responsabilités.",
  },
];
const memo = [
  {
    title: "Je demande clairement",
    text: "Je précise mon objectif, le contexte, les contraintes et le résultat attendu. Un rôle peut aider, mais il n’est pas obligatoire.",
  },
  {
    title: "J’améliore",
    text: "Je lis, je repère un problème, je précise et je compare les versions.",
  },
  {
    title: "Je vérifie",
    text: "Une réponse convaincante peut être fausse. J’ouvre une source réelle, je vérifie auteur et date, puis le passage qui confirme l’information.",
  },
  {
    title: "Je protège",
    text: "Pas de mots de passe, d’adresse, d’informations de santé ou de documents privés. Pas de photo ou de voix d’autres personnes sans cadre adapté. Temporaire ne veut pas dire secret.",
  },
  {
    title: "J’apprends",
    text: "Je demande un indice, j’essaie et je reformule sans écran. Je respecte les consignes de mon enseignant et j’indique l’aide reçue quand c’est demandé.",
  },
  {
    title: "Je décide",
    text: "Je peux utiliser l’IA, demander à un humain ou m’en passer. Une voix expressive reste une voix artificielle.",
  },
];
export const defaultCourse = {
  schema: 1,
  title: "L’IA, à vous de jouer",
  venue: "MJC d’Yvetot",
  date: "2026-09-23",
  startTime: "14:00",
  author: "Matthieu Frain",
  sections,
  slides,
  missions,
  memo,
  sourceText:
    "FICHE SOURCE — EXERCICE FICTIF\nAtelier « Inventons un jeu » : mercredi, de 14 h à 16 h.\nParticipation gratuite sur inscription. Dix places.\nUn téléphone peut être utilisé ; les ordinateurs ne sont pas obligatoires.\nPapier et feutres fournis.\nCette fiche est créée uniquement pour l’exercice. Elle ne décrit pas un véritable événement.",
  sourceAnswer:
    "La réponse annonce 14 h 30 : la fiche dit 14 h. Elle exige un ordinateur : la fiche dit qu’il n’est pas obligatoire. Elle promet des casques : la fiche ne permet pas de l’affirmer.",
  checklist: [
    "Brancher le chargeur et désactiver les notifications.",
    "Activer l’écran étendu, ouvrir la projection et la déplacer sur le vidéoprojecteur.",
    "Passer la projection en plein écran et vérifier la lisibilité au fond de la salle.",
    "Tester le son et les boutons de lecture, avec le micro coupé.",
    "Vérifier les accès des téléphones, sans créer de comptes incompatibles avec les âges.",
    "Ouvrir l’application une fois en ligne sur chaque machine de secours.",
    "Exporter une sauvegarde .trame et la placer sur une clé USB.",
    "Imprimer missions, enquête, mémo et trame.",
    "Annoncer quand le micro est actif et comment participer sans captation.",
    "Faire une répétition complète avant le jour J.",
  ],
};
export const preparedReplies = {
  intro:
    "Bonjour, je suis Trame, une voix artificielle qui accompagne cet atelier. Cette présentation est une réponse préparée, pas une génération en direct. Vous pouvez explorer ce que l’IA sait faire, et surtout apprendre à vérifier ses réponses.",
  explain:
    "Une réponse peut sembler très logique tout en étant fausse. Par exemple, un texte peut citer un livre qui n’existe pas. Le bon réflexe consiste à retrouver le livre ou la source et à lire ce qui y est vraiment écrit.",
  hint: "Pour améliorer votre demande, commencez par préciser ce que vous voulez réussir et comment vous reconnaîtrez une bonne réponse. Puis ajoutez seulement le contexte qui aide vraiment.",
  quiz: "Voici une question : une photo authentique peut-elle accompagner une information fausse ? Discutez de votre réponse et donnez un exemple.",
  debat:
    "On peut utiliser l’IA pour obtenir un indice et progresser. On peut aussi copier sa réponse sans comprendre. La différence se voit quand on essaie d’expliquer ou de refaire l’exercice sans aide.",
};

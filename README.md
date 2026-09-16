# Trame · atelier IA à la MJC d’Yvetot

Atelier du 23 septembre 2026, 14 h–17 h 30. Application web statique, sans compte, sans abonnement et sans dépendance à un CDN. 38 slides, 13 séquences, cinq missions, jeu de provenance, supports imprimables et pupitre séparé.

## Démarrage le plus simple

Ouvrir https://matthieufrain.github.io/trame-mjc/ dans Chrome, Edge ou Safari récent. Attendre « Prêt hors ligne ». Ouvrir une fois chaque machine de secours en ligne. Le navigateur peut effacer son cache : conserver aussi les PDF et la sauvegarde `.trame` sur une clé USB.

1. Dans Réglages, suivre la répétition générale.
2. Choisir l’écran étendu dans macOS ou Windows, cliquer **Projeter**, déplacer cette fenêtre sur le vidéoprojecteur et cliquer **Afficher les slides**. Autoriser les fenêtres surgissantes si nécessaire.
3. Cliquer **Démarrer** à 14 h. Les notes restent dans le pupitre. Les flèches et une télécommande USB font avancer ; R révèle, B masque, Échap arrête la voix.
4. Le chronomètre de séquence additionne le temps effectivement passé dans cette séquence. Le chronomètre général se met en pause volontairement. Les pauses prévues font partie des 210 minutes : laisser le chrono tourner pendant elles.
5. En cas de retard, raccourcir les bonus et les restitutions ; conserver la vérification des sources et le bilan. Les slides ne défilent pas seules.

## Modifier et transporter

**Slides → Modifier** change texte, notes, réponse, provenance, média et position. **Supports → Modifier** change les cartes mission et la fiche mémo. Réglages adapte les horaires. Les modifications sont stockées dans le navigateur de cet appareil, pas dans GitHub.

Pour Keynote : modifier son fichier `.key`, exporter en PDF, puis **Slides → Importer un PDF**. Choisir une page pour remplacer la slide affichée, ou plusieurs pages pour ajouter. Les pages importées deviennent des images haute résolution : retoucher leur graphisme dans Keynote, réimporter ; les notes restent éditables dans Trame. Trame ne modifie pas directement un fichier `.key` et n’exporte pas de fichier Keynote natif.

**Sauvegarder** exporte un fichier `.trame` contenant cours, médias, notes, supports et avancement. Sur une autre machine : **Réglages → Importer**. Les chronomètres reprennent en pause. Aucune clé API, transcription ou donnée audio n’est incluse. Le bouton Annuler dans Slides garde les dix dernières versions en mémoire jusqu’au rechargement.

Les votes du jeu sont saisis par l’animateur après un vote à main levée. Les téléphones servent aux ateliers ; ce site n’est pas une plateforme de vote multijoueur ni une télécommande entre appareils.

## Voix sans API

Les interventions pédagogiques sont des textes préparés lus avec la synthèse vocale du système. Leur qualité varie selon les voix installées. Elles sont annoncées comme préparées. Le bouton Contexte ChatGPT permet de copier la slide et sa trame dans son propre compte ChatGPT ; ce n’est pas une intégration automatique de l’abonnement.

Les commandes vocales facultatives utilisent SpeechRecognition lorsque le navigateur le propose (souvent Chrome / Edge). « Trame, suivante », « suivante, Trame », « slide Trame suivante » sont reconnus, ainsi que précédente, écran noir, révèle la réponse et silence. La reconnaissance peut transmettre l’audio au fournisseur du navigateur. L’application ne sauvegarde aucun enregistrement. Micro coupé par défaut, arrêt après dix minutes, à la pause et pendant une intervention préparée. Toute personne peut déclencher : aucune identification biométrique de l’animateur. Utiliser le clavier pour la fiabilité.

## Voix IA optionnelle — non nécessaire pour le cours

Le serveur `server.mjs` prépare OpenAI Realtime en WebRTC, voix `marin`. Il garde la clé API côté serveur. Cette API est facturée séparément de ChatGPT. Le branchement n’a pas été testé avec une clé réelle, car aucune n’a été fournie.

Localement, installer Node.js 22 ou supérieur depuis nodejs.org puis exécuter `npm start` dans le dossier, ou ouvrir `start.cmd` sous Windows / `start.command` sur Mac. Ouvrir http://127.0.0.1:4173. Le cours fonctionne ainsi sans hébergement, même sans API.

Pour activer l’API : copier `.env.example` en `.env`, renseigner la clé dans ce fichier local, relancer le serveur, puis Voix et micro → Connecter l’IA. Ne jamais mettre la clé dans le navigateur, dans le code publié ou dans une sauvegarde. Le `.env` est ignoré par Git.

Sur GitHub Pages, un serveur HTTPS séparé est nécessaire : indiquer son adresse dans les réglages de voix. Configurer `HOST`, `ACCESS_TOKEN` et `ALLOWED_ORIGIN`. Le code d’accès reste en mémoire du navigateur. Prévoir un hébergeur et sa propre limite de dépenses ; aucun serveur payant n’est créé par ce projet.

Mode IA : appuyer pour parler puis appuyer pour terminer, 20 secondes maximum par prise ; ou écrire une question. La slide et ses notes servent de contexte. Session fermée après dix minutes et limitée à 30 demandes côté client ; quatre ouvertures par heure par défaut côté serveur. Ces limites réduisent les débordements mais ne constituent pas un plafond financier inviolable. Régler également la facturation et surveiller les consommations chez le fournisseur. Pas d’enregistrement intégral de l’après-midi ni de déclenchement libre par mot-clé dans ce mode. Ces choix évitent l’écoute continue de mineurs et les activations accidentelles.

## Technique et vérifications

HTML/CSS/JavaScript, IndexedDB, BroadcastChannel, service worker, PDF.js embarqué. Pas de compilation ni d’installation npm pour servir le site. `npm test` vérifie horaires, commandes et validation ; `npm run check` vérifie la syntaxe. Workflow GitHub Pages inclus.

Le cours et la navigation sont prévus pour les navigateurs récents sur Mac, Windows, tablettes et smartphones. L’écran étendu exige un ordinateur et un navigateur permettant une seconde fenêtre. La commande vocale n’est pas universelle. Le micro Blue Yeti, l’enceinte, l’adaptateur vidéo et le MacBook Pro doivent être testés ensemble à la MJC : aucune application ne garantit 100 % dans une salle non testée.

## Sources et médias

- Cours réécrit à partir des cinq PDF fournis par Matthieu Frain ; visuel navy/violet/rose conservé, dispositif ancien remplacé par MJC.
- Terre : NASA / Johnson Space Center, Apollo 17, 7 décembre 1972, https://svs.gsfc.nasa.gov/30613 . Une photo vraie ne prouve pas sa légende.
- Plat IA : image extraite du jeu PDF fourni, dont le corrigé attribue la création à Gemini ; provenance déclarée dans ce support, non déduite de l’apparence.
- Verlaine : quatre vers de « Chanson d’automne », domaine public. Les autres textes fictifs sont explicitement présentés comme exercices préparés.
- Motif audio : synthèse sinusoïdale déterministe, sans modèle d’IA. Animation : formes géométriques calculées, sans modèle d’IA. « Numérique » et « IA » ne sont pas synonymes.
- PDF.js : Mozilla, licence Apache 2.0 incluse dans `dist/vendor/PDFJS-LICENSE`.
- API : https://developers.openai.com/api/docs/guides/voice-webrtc et https://developers.openai.com/api/docs/guides/realtime-conversations . Documentation consultée le 16 septembre 2026.

Le projet ne reprend pas tous les médias anciens dont la provenance était insuffisante. Aucun nom, enregistrement ni compte de participant n’est nécessaire.

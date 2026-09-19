# Trame · MJC d’Yvetot

Atelier « L’IA, à vous de jouer » pour environ dix collégiens et lycéens, le 23 septembre 2026 de 14 h à 17 h 30. Le cours comprend 38 slides, 13 séquences, deux pauses, six manches principales et deux bonus, cinq missions, une enquête, un mémo et un billet de sortie.

## Utilisation

- **Espace privé** : https://trame-mjc-atelier.dusky-lily-8551.chatgpt.site — même compte propriétaire sur chaque appareil ; cours, médias, réglages et progression partagés.
- **Secours GitHub Pages** : https://matthieufrain.github.io/trame-mjc/ — fonctionne sans serveur partagé ; les onglets du même navigateur se synchronisent, les autres machines ont une copie indépendante. Exporter/importer une sauvegarde pour changer de machine dans ce mode.
- **Branche de travail demandée** : `trame-mjc`. La publication GitHub Pages est déclenchée par cette branche. `main` n’est pas modifiée.

Ouvrir **Projeter**, placer la fenêtre sur l’écran du vidéoprojecteur, puis cliquer **Afficher les slides** pour autoriser l’affichage et le son. Le pupitre garde les notes. La mention **Projection confirmée** signifie que la fenêtre locale a reçu et rendu le dernier état. Un appareil distant reçoit les changements par le serveur ; prévoir une petite latence réseau, jamais une garantie de simultanéité absolue.

**Appareils → Piloter depuis cet appareil** permet de prendre la main. Un seul pupitre en ligne peut commander le direct. Les autres peuvent éditer. Si une machine perd Internet, la projection déjà ouverte sur cette machine peut continuer localement ; les appareils distants ne peuvent plus la suivre jusqu’au retour de la connexion.

## Éditer le cours

Dans **Éditer**, sélectionner une slide à gauche. Double-cliquer un texte pour écrire directement ; glisser les objets pour les déplacer ; utiliser leur poignée ou l’inspecteur pour les dimensions. Ajouter texte, forme, image, vidéo ou audio ; modifier police, couleur, alignement, opacité, rotation, fond et ordre des calques. Les retouches se sauvegardent automatiquement. Les flèches déplacent l’objet, Maj affine le pas ; Annuler/Rétablir et Cmd/Ctrl+Z sont disponibles dans la session d’édition.

Le champ « Titre de la slide » sert au repérage dans le pupitre. Les textes visibles sur la slide sont des objets indépendants, modifiables sur le canevas. Les notes sont accessibles par **Trame** et restent privées au pupitre.

**PDF** ouvre un aperçu, une sélection de pages et le choix ajout/remplacement. Exporter depuis Keynote en PDF, puis réimporter une page permet de remplacer la mise en page en conservant les notes. Un PDF importé est une image : les textes et formes contenus dans le PDF ne sont pas convertis en objets éditables. On peut ajouter des objets par-dessus, ou rééditer dans Keynote et remplacer à nouveau la page. L’application ne prétend pas ouvrir les fichiers `.key`.

**Supports** permet de modifier et d’imprimer le mémo, les missions et l’enquête. La trame et les slides imprimables suivent la version actuelle du cours. Les PDF téléchargeables de secours sont des instantanés préparés ; après des retouches, réimprimer les vues actuelles. La fiche pédagogique détaillée est aussi fournie.

## Animation

- Flèches droite/gauche : avancer/reculer. `R` : révéler une réponse. `B` : écran noir. `Échap` : arrêter l’écoute et la voix.
- **C’est fait** avance la surbrillance entre « À dire », « À faire » et « Faire participer ». La révélation ou le lancement d’une activité peut avancer ce repère. Aucun système ne prétend deviner si une action orale a réellement eu lieu.
- **Commencer / Pause / Reprendre** pilote le temps. Les séquences changent avec les slides. Le mode calme affiche des minutes, sans alarme ni changement forcé.
- Le minuteur d’activité public est facultatif et placé dans une bande distincte, jamais sur le contenu.
- Le bureau a été vérifié à 1366 × 768 : actions principales et fil conducteur visibles sans défilement de page. Sur téléphone, le contenu se réorganise verticalement ; le défilement reste nécessaire pour conserver une taille lisible.

## Voix : ce qui fonctionne et ce qui demande un accès supplémentaire

Aucune clé API n’est fournie, aucun compte payant ni abonnement supplémentaire n’a été créé. L’application ne produit donc pas de réponse vocale IA en direct par défaut.

Les **commandes vocales du navigateur** sont distinctes : « Trame, suivante », « slide tram suivante », « montre la réponse, Tramme ». Les variantes sont modifiables, le mot-clé peut être au début, au milieu ou à la fin. Une phrase ambiguë ne déclenche pas arbitrairement une commande. Chrome/Edge sont à privilégier pour cette fonction ; la disponibilité dépend du navigateur, du micro et du service de reconnaissance.

Il n’y a pas de limite fixe de dix minutes. Choisir une durée ou « Jusqu’à mon arrêt ». La reconnaissance tente de redémarrer après les interruptions du navigateur, mais ne peut garantir une écoute continue illimitée. **Toute voix** peut déclencher une commande : aucune identification biométrique fiable de Matthieu n’est annoncée. Un bouton ou une télécommande reste le moyen de pilotage le plus prévisible en salle.

La **voix IA intégrée facultative** utilise WebRTC et OpenAI Realtime, avec la voix `marin`, des réponses courtes et une activation explicite. La clé reste sur le serveur. Connexions renouvelées entre les réponses, limite de quatre créations de connexions par heure par défaut. Cette limite n’est pas un plafond de dépense : configurer aussi les contrôles du fournisseur. La connexion réelle et le rendu vocal restent à tester avec un accès API actif.

Le bouton **Ouvrir ChatGPT** permet d’utiliser le mode vocal de son compte séparément ; **Copier le contexte** prépare la slide et la question. Un abonnement ChatGPT ne remplace pas l’accès API de cette application. Sources officielles : [modèle Realtime](https://developers.openai.com/api/docs/models/gpt-realtime-2.1), [facturation distincte](https://help.openai.com/en/articles/8156019-how-can-i-move-my-chatgpt-subscription-to-the-api).

Le micro est coupé par défaut. Aucun enregistrement permanent du cours. L’option « contexte récent » conserve au maximum deux minutes de texte en mémoire, sans sauvegarde ni synchronisation ; elle est effacée à l’arrêt. Le navigateur peut traiter le son via son prestataire. Annoncer les moments d’écoute, couper les micros pendant les pauses et convenir du cadre avec la MJC.

## Mémoire et synchronisation

Le serveur conserve le document commun dans SQLite/D1, les médias importés dans le stockage de fichiers/R2. Les opérations portent un identifiant unique, sont validées, et s’appliquent par champ ou par objet. Deux retouches sur des objets différents sont fusionnées ; si deux personnes modifient le même champ, la dernière opération acceptée gagne. Le remplacement complet d’un cours reste volontaire et confirmé.

Un journal IndexedDB conserve les retouches en attente sur l’appareil. Elles sont reprises après coupure ou fermeture d’onglet. Les anciennes commandes de pilotage d’un autre pupitre ne reprennent pas le contrôle d’une séance active. Les permissions du micro et du son sont propres à chaque appareil et doivent être accordées localement. L’historique Annuler/Rétablir reste local à la session d’édition.

Une sauvegarde `.trame` contient le document et les médias embarqués. Elle reste indispensable pour l’archivage, un changement de navigateur ou un incident de stockage. Les anciens exports de la première version peuvent être importés. Un serveur et GitHub Pages sont des origines distinctes : le transfert initial des retouches existantes se fait par export/import, puis l’espace privé assure la synchronisation.

## Lancer sur Mac ou Windows sans hébergement

Installer Node.js 22 ou une version LTS plus récente. Depuis le dossier du projet :

```sh
npm ci
npm run build
npm start
```

Ouvrir http://127.0.0.1:4173. `start.command` (Mac) et `start.cmd` (Windows) préparent le build s’il manque et lancent le serveur. Les données locales sont conservées dans `.data/`, jamais dans Git. Le serveur local écoute uniquement la machine locale. Pour plusieurs appareils, utiliser l’espace privé HTTPS.

L’utilisation du site hébergé ne demande aucune installation. Pour le secours hors ligne, ouvrir au préalable l’application et les médias utiles en ligne sur chaque machine, puis tester la coupure. Les restrictions d’authentification du site privé peuvent empêcher une première ouverture hors ligne : garder aussi les PDF et une sauvegarde sur clé USB.

## Code et publication

```
src/client/core/       cours, modèle, stockage, synchronisation, projection, voix
src/client/editor/     éditeur visuel
src/client/views/      rendu public, supports et composants
src/client/styles/     interface responsive et impression
src/server/            routes partagées et serveur local
public/assets/         médias du cours et leurs provenances
public/documents/      PDF de secours et fiche pédagogique
db/ + drizzle/         schéma et migrations de la base
scripts/               construction et génération du rythme
tests/                 validation et tests du serveur
docs/                  fiche modifiable et guide de préparation
```

`npm test` vérifie le cours, le temps, les commandes, la concurrence, le contrôle exclusif, les rejeux, les médias et la persistance après redémarrage. `npm run check` vérifie la syntaxe. `npm run build` produit `dist/client` et le Worker `dist/server`.

Le Worker exige une protection d’accès propriétaire devant les routes : le Site privé la fournit. Ne pas publier ce serveur de données ouvert au public sans ajouter une authentification adaptée. GitHub Pages ne déploie que les fichiers statiques, sans route API ni secret.

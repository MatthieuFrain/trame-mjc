# Vérifications effectuées le 16 septembre 2026

- Tests automatisés réussis : durée totale 210 minutes et fin à 17 h 30 ; mot déclencheur en début, milieu et fin de commande ; refus des expressions ambiguës ; chronomètres en marche et en pause ; rejet de médias externes et horaires invalides.
- Syntaxe JavaScript vérifiée pour l’application, la voix et le serveur.
- Essais dans le navigateur intégré Chromium : navigation, chronomètre, jeu et révélation, édition conservée après rechargement, import d’une page PDF rendue correctement, annulation, import d’une sauvegarde complète et reprise en pause.
- Deux onglets : la projection reçoit la même slide que le pupitre ; les notes ne sont pas dans l’écran public.
- Hors ligne : serveur local arrêté, rechargement réussi et navigation dans le cours et les supports disponibles.
- Revue visuelle du pupitre à 1440 px et sur écran étroit ; aucune collision des contenus avec les pieds de slide sur les 38 slides par contrôle DOM.
- PDF de secours : 38 pages de slides, 8 pages de supports et 16 pages de trame, rendues et inspectées visuellement.

## Limites des essais

Les tests de navigateur automatisés par lancement d’un Chrome externe n’ont pas pu démarrer dans cet environnement ; les vérifications d’interface ont été réalisées avec le navigateur intégré. Pas de validation physique sur Windows, sur le MacBook Pro de l’animateur, avec le Blue Yeti, l’enceinte ou le vidéoprojecteur de la MJC. La connexion OpenAI Realtime est préparée mais non essayée avec un compte facturé. La reconnaissance vocale et la qualité de synthèse doivent être testées sur la machine finale. La publication GitHub Pages est vérifiée séparément après déploiement.

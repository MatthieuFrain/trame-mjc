# Vérifications de la version 2

## Effectuées le 19 septembre 2026

- Validation des 38 slides natives, de leurs guides et des médias ; total du déroulé : 210 minutes.
- Tests du modèle : temps cumulé, pause, variantes du mot-clé, position libre du mot-clé, import invalide et contenu dangereux rejetés, modifications ciblées et fusion des notes.
- Tests HTTP avec deux clients distincts et base temporaire : initialisation, deux modifications simultanées, conservation des deux retouches, rejeu idempotent, pupitre unique et reprise de contrôle.
- Fichiers importés accessibles après redémarrage du serveur ; données du cours conservées.
- Route de voix refusée proprement sans clé ; requêtes d’origine étrangère rejetées.
- Projection : paquets anciens ignorés, doublons non rendus deux fois, confirmations adressées au bon pupitre.
- Navigateur : changement de slide confirmé dans le pupitre et la projection ; modification directe d’un texte reçue par la projection.
- Navigateur : aperçu et import d’une page PDF, ajout au cours puis projection ; média enregistré sur le serveur.
- Coupure réelle du serveur de test : retouche enregistrée hors ligne, fermeture et réouverture de l’onglet, retouche retrouvée puis synchronisée après redémarrage.
- Mise en page contrôlée à 1366 × 768 et 390 × 844. Aucun débordement horizontal mobile constaté. Aucun bloc de texte natif ne dépasse de son cadre dans la vue de l’ensemble des slides.
- PDF de secours régénérés à partir du contenu actuel et vérifiés visuellement : 38 slides, 8 pages de supports, 16 pages de trame. Fiche pédagogique de 6 pages disponible séparément.
- Audit des dépendances de production : aucun avis de vulnérabilité signalé au contrôle. Les outils de migration restent des dépendances de développement.

## À vérifier avec Matthieu sur le matériel réel

- MacBook Pro et/ou Windows, adaptateur, câble et vidéoprojecteur de la MJC : écran étendu et plein écran.
- Blue Yeti, acoustique, volume de l’enceinte et reconnaissance vocale dans le bruit.
- Autorisations micro/audio et comportement d’écoute prolongée du navigateur choisi.
- Connexion vocale OpenAI et rendu de la voix `marin` après activation volontaire d’un accès API. Aucune requête payante réelle n’a été effectuée.
- Répétition complète et lisibilité depuis le fond de la salle.

Les tests de deux clients et fenêtres valident les échanges logiciels ; ils ne constituent pas un essai matériel sur deux ordinateurs physiques ni une garantie d’absence de panne.

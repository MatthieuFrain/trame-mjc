#!/bin/zsh
# Démarrage local de secours ; aucune clé nécessaire pour le cours.
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null; then
  echo "Installez Node.js 22 ou une version LTS plus récente depuis nodejs.org."
  read -r "?Appuyez sur Entrée pour fermer."
  exit 1
fi
if [[ ! -f dist/client/index.html ]]; then
  npm ci && npm run build || exit 1
fi
echo "Ouvrez http://127.0.0.1:4173 dans votre navigateur."
node server.mjs

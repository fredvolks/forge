# Correcteur Perso v0.3 — QWERTY sombre

Clavier Android distinct du clavier Samsung, mais avec une disposition QWERTY et un thème sombre inspirés de sa capture.

## Priorités
- **Correctif anti-plantage Espace** : module `SpaceProcessor` isolé avec protection contre les exceptions courantes; saisie du vrai espace même si la correction échoue.
- **Diagnostic local** dans Réglages : type d'erreur uniquement, sans contenu de frappe.
- Touches sombre #37373B, fond #141416, rangée de chiffres, boutons QWERTY, variantes d'accents par appui long.
- Catalogue complet d'émojis via AndroidX EmojiPicker pour l'OS installé.
- Apprentissage explicite 24 h, local, effaçable; mots protégés et expressions conservées.
- Tests JUnit de correction et tests d'interaction clavier Android sur émulateur.

## Limites connues
Les tests CI servent de régression, mais ne prouvent pas la compatibilité totale de chaque application sur Samsung One UI. La cause précise du plantage signalé par l'utilisateur ne peut pas être confirmée sans journal Android du téléphone. La V0.3 contient des garde-fous supplémentaires et une trace d'erreur limitée.

## Installation
APK de test compilé dans `releases/CorrecteurPerso-v0.3-debug.apk`, branche `build/correcteur-perso-android-v01`. Chaque génération GitHub Actions peut utiliser une signature debug différente; si Android indique « Application non installée » en mise à jour, désinstaller l'ancienne version (ce qui efface ses données) avant d'installer la nouvelle. Ne pas utiliser cette version pour saisir des secrets ou mots de passe sensibles avant validation complète.

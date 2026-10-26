# Correcteur Perso — Android v0.2 (prototype)

Clavier Android QWERTY inspiré de la disposition Samsung, pas un clavier Samsung modifié ni une copie de son code.

## Fonctionnalités
- QWERTY avec rangée numérique, clavier symboles, touches de raccourcis et accents en appui long.
- EmojiPicker AndroidX 1.6.0: catalogue classé par catégories et variantes sur la base des émojis Android compatibles.
- Mode d'apprentissage **optionnel** de 24 heures, activé depuis les paramètres.
- Uniquement des mots isolés et compteurs de fréquence dans une base locale limitée à 250 mots, pas d'historique de conversations. Aucune permission Internet, et exclusion de champs sensibles et de l'indicateur Android de non-apprentissage.
- Profil personnalisé après 24 heures : 80 mots maximum, vus au moins 3 fois et ne correspondant pas à des fautes déjà connues, sont protégés contre la correction automatique. Profil effaçable/désactivable.
- Corrections prudentes et annulation dans la barre de suggestions.

## Limites
Il faut réellement utiliser le clavier Correcteur Perso (pas Samsung) durant la journée d'analyse. Le compteur court pendant 24 heures calendaires; la création du profil s'effectue à l'ouverture suivante du clavier ou des réglages. Il s'agit d'une personnalisation par mots fréquents, pas encore d'un moteur grammatical d'IA entraîné.

Le catalogue d'émojis dépend d'AndroidX et de la compatibilité des polices Android; toutes les versions futures d'Unicode ne sont pas garanties.

## Installation
La compilation GitHub Actions produit `releases/CorrecteurPerso-v0.2-debug.apk` dans la branche `build/correcteur-perso-android-v01`. Il peut être nécessaire de désinstaller la v0.1 si la clé debug change entre les builds (données précédentes supprimées). L'application reste un prototype non testé physiquement sur le téléphone.

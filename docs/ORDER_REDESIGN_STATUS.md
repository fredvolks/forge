# Nouvelle commande — état de la refonte

## Correction visuelle suivante

La demande suivante remplace le mode clair de cette page : noir/charbon et vert imposés pour les commandes, sans modifier les autres vues. Formulaire principal compact sans défilement mobile/iPad; articles supplémentaires via le sélecteur Voir tout, options détaillées en panneau superposé. Mesures observées : mobile contenu 662/662 px, iPad portrait 837/837 px, paysage 581/581 px (hauteur utile/scrollHeight). Les champs avancés ont un accès Mesures et options; leur QA interactive n’a pas été terminée lorsque l’utilisateur a repris l’annotation de l’aperçu. Le panier avec un grand nombre de lignes n’est pas validé sans défilement.

2026-09-10. Travail sur fred-dev autorisé explicitement par l’utilisateur. Les pages Projets, Job, Punch et Messages ne sont pas redessinées.

## Réalisé

- Formulaire existant conservé : aucun nouveau parcours ni second panier.
- Titre compact sans hero mobile; articles rapides limités et Voir tout.
- Carte article, quantité, photos avec aperçu local, livraison/priorité/note repliables.
- Ajouter reste distinct d’Envoyer; envoi depuis la barre inférieure.
- Vue panier mobile dédiée dans la même page, accessible uniquement par la barre; quantités modifiables, suppression et confirmation pour vider.
- Panier latéral à partir de 850 px de contenu.
- Relation de chantier sélectionnée par job_id; identifiant UUID distinct pour chaque ligne enregistrée.
- Champs de livraison/priorité/note et photos conservés dans le même enregistrement local existant.
- Erreur de stockage conserve le panier; aucune affirmation de notification réelle dans les toasts de commande.
- Styles clair utilisant les tokens centraux; styles sombres conservés.

## Vérifications

- Ajout sans soumission, changement de quantité, ouverture/fermeture du panier et retrait de la ligne de test vérifiés dans le navigateur.
- Aucun débordement horizontal observé à 320, 360, 390, environ 393 (arrondi navigateur 394), 414 px.
- iPad portrait : colonne unique; paysage et desktop 1440 : formulaire + panier, sans dépassement dans le contenu.
- 8 tests existants conversations/récupération passent avec la transformation TypeScript activée. Ils ne constituent pas une couverture des commandes.
- Lint non vert : problèmes existants dans page.tsx (anciens contrôles/effets/imports) et avertissements sur les balises img. Ne pas annoncer une validation intégrale.

## Non terminé / services manquants

Le formulaire reste un aperçu local. L’API centrale de soumission et les catégories centrales actives/triées/administrées par Adjointe ne sont pas raccordées. Le catalogue existant repose sur des données locales et des catégories prédéfinies; ne pas annoncer une synchronisation centrale.

Notifications Boss/Adjointe, autorisation serveur, transaction centrale et idempotence serveur restent à intégrer aux services existants. Aucun nouveau backend créé.

Photos : données locales limitées à quatre fichiers de 1 Mo par article, pas des documents R2 centraux. Le quota du navigateur peut empêcher l’enregistrement; le panier est alors conservé. Pas de promesse d’envoi réel.

Les validations de variantes Catalogue, photos sur appareil réel, envoi central, double envoi réseau et notifications ne sont pas entièrement testées. Les workflows inventaire/fournisseurs/production ne sont pas implémentés.

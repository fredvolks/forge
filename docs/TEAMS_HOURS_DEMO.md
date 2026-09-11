# Équipes & heures — état de la démo

La route existante admin/teams est le point d’entrée des six vues communes Boss/Adjointe. Les routes Punchs et Corrections restent en place et utilisent TimeAdmin. Le registre time-demo conserve employés, équipes, segments, corrections et audits. Aucun compte ni invitation réelle n’est créé.

Fonctionnel : vue d’ensemble calculée, filtres rapides, création de fiche sans compte, composition/édition d’équipe, affectation additive de Job, modification administrative avec motif et contrôle de version, refus motivé, historique mensuel et hebdomadaire, export Punch existant.

Vérifié : compilation, 14 tests ciblés, navigation des six onglets et ouverture des formulaires dans l’aperçu Adjointe, absence de débordement horizontal sur la vue Historique au format observé de 946 px.

Limites : aucune API de main-d’œuvre réelle ni sécurité serveur mise en production; autorisations de démonstration seulement. Métier/grade/CCQ, invitation ultérieure, gestion des absences et réglage de la position GPS restent hors de cette passe. Le formulaire employé est minimal (nom, téléphone, rôle). La matrice complète Boss/Adjointe, iPad portrait/paysage et clair/sombre reste à valider. Le lint global et le contrôle TypeScript rencontrent aussi des erreurs existantes hors de ce module.

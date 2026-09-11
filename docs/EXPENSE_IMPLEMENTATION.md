# Achats / reçus — état de l’implémentation

## Inspection du 10 septembre 2026

Le formulaire employé existant ne persistait rien (toast seulement). La page PurchasesPage présentait un tableau statique indépendant. Aucune table Expense/Purchase n’existait dans le schéma central inspecté. Les tables centrales employees, jobs, job_members, suppliers, attachments, approvals, notifications et audit_log existent déjà. Les fournisseurs du simulateur commandes sont encore identifiés par nom, sans identifiant stable. Les données de Job et d’employé de la démo viennent du registre d’heures existant.

## Livraison locale actuelle

L’ancien formulaire et l’ancienne liste statique sont remplacés par un même ExpenseWorkspace. Un registre de démo unique conserve les reçus pour les vues Employé, Chef, Adjointe, Boss, Job et Rapports. Les fichiers sont enregistrés une fois dans le stockage de fichiers du navigateur et référencés par identifiant. Les données sont uniquement sur cet appareil, jamais envoyées à un service externe. Les catégories sont des données configurables du registre, pas des options métier encodées dans le formulaire. Les règles métier vérifient la compagnie, l’identité employée, les assignations, les versions et les transitions. La démo n’est pas une frontière d’authentification.

Les brouillons, soumissions, examen, approbation, correction/approbation, refus motivé et remboursement utilisent le même identifiant. Les notifications d’administration pointent vers cet identifiant. L’historique et l’export CSV lisent ce même registre. Aucun événement d’achat ne modifie l’inventaire. ExpenseItem prépare des liens facultatifs sans créer d’articles physiques.

## Travail restant — ne pas présenter cette livraison comme une production complète

- Ajouter le dépôt authentifié Expense aux tables centrales D1 existantes : migrations additives, relations composées par compagnie, opérations atomiques et contrôles serveur basés sur VerifiedActor. Réutiliser employees, attachments, approvals, notifications et audit_log ; ne pas créer des versions parallèles.
- Brancher l’interface au dépôt central après configuration des comptes réels. L’interface refuse actuellement les achats hors mir-demo.
- Téléverser/télécharger les originaux via R2 et un accès serveur autorisé. Aucun fichier de démo n’est automatiquement transféré.
- Relier supplier_id aux fournisseurs centraux ; le simulateur actuel ne possède pas ces IDs. La saisie utilise donc supplier_name_snapshot.
- Connecter un service OCR avec conservation des suggestions, corrections, confiance et validations. Aucun résultat OCR n’est simulé.
- Ajouter l’administration des catégories, une navigation de périodes semaine/mois/année et les vues d’audit centrales ; les filtres de dates arbitraires et catégories existent dans la démo.
- Effectuer les essais visuels et tactiles demandés lors d’une passe de validation dédiée. Aucune capture navigateur n’a été réalisée dans cette passe.

Le mode démonstration ne remplace pas les protections serveur exigées par le document utilisateur.

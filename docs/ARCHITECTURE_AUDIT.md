# Forge — Audit d’architecture centrale

Date de l’audit : 8 septembre 2026  
Portée : architecture et sources de vérité, sans refonte visuelle ni migration destructive.

## Résumé exécutif

Forge possède déjà une première base relationnelle saine pour les compagnies, utilisateurs, Jobs, commandes, catalogue, inventaire, fournisseurs, conversations et audit. Deux migrations D1 existent et les ressources D1/R2 sont déclarées pour l’hébergement.

Cependant, l’application utilisée dans la démonstration ne consomme pas encore réellement cette base comme source de vérité. La majorité des flux sont simulés dans les composants React, avec des tableaux codés dans les pages et plusieurs clés `localStorage`. Cette situation permet une démo rapide, mais ne garantit ni isolation serveur entre compagnies, ni cohérence multi-utilisateur, ni historique fiable.

La priorité n’est donc pas de créer davantage d’écrans ou de nouvelles tables en parallèle. Il faut brancher progressivement les écrans existants sur une couche de services centrale, compléter les relations manquantes, puis retirer les copies locales seulement après validation des migrations.

## 1. Carte actuelle

### Couche persistante prévue

- `companies`
- `users`
- `jobs`
- `job_members`
- `orders`
- `order_items`
- `order_history`
- `catalog_categories`
- `catalog_products`
- `catalog_product_fields`
- `inventory_items`
- `inventory_movements`
- `suppliers`
- `purchase_orders`
- `attachments`
- `conversations`
- `conversation_members`
- `messages`
- `audit_log`

### Couche réellement utilisée par l’interface

- session et comptes de démonstration dans `forge-access.tsx`;
- commandes, catalogue, inventaire et fournisseurs dans `localStorage`;
- Jobs, employés, punchs, notifications, discussions, rapports et plusieurs historiques sous forme de données statiques ou d’état React;
- photos locales sous forme d’URL navigateur;
- filtres et exports calculés directement dans les composants.

### Infrastructure présente

- D1 déclaré sous `DB`;
- R2 déclaré sous `UPLOADS`;
- migrations SQL présentes;
- aucune couche API/service centrale trouvée dans l’application;
- aucun contrôle d’autorisation serveur trouvé pour les opérations métier visibles.

## 2. Problèmes détectés

1. La base D1 existe comme cible, mais le frontend ne l’utilise pas encore comme source principale.
2. Les mots de passe des compagnies créées en démo sont enregistrés dans `localStorage`; ce mécanisme ne doit jamais devenir une authentification de production.
3. Les rôles et permissions sont souvent vérifiés directement dans les composants avec des conditions sur le rôle.
4. Plusieurs données métier sont définies plus d’une fois dans différentes pages : Jobs, employés, commandes, discussions et indicateurs.
5. Une partie des relations repose sur des libellés (`JOB-214 · Breton`, nom d’article, nom d’employé) plutôt que sur des IDs stables.
6. Les changements d’inventaire modifient directement les quantités côté client; le ledger SQL existe, mais n’est pas la source utilisée par le flux.
7. Les conversations affichées dans certaines vues sont des listes locales et ne garantissent pas qu’un Chat Job corresponde au même `conversation_id` partout.
8. Les notifications sont des objets d’affichage sans table centrale persistante ni lien serveur garanti vers l’objet source.
9. Les rapports sont alimentés par les données locales de chaque écran; deux utilisateurs peuvent donc obtenir des résultats différents.
10. L’isolation par `company_id` est présente dans plusieurs tables, mais n’est pas encore imposée par une couche serveur commune.

## 3. Doublons détectés

- Commandes de démonstration déclarées dans plusieurs composants et également enregistrées dans `localStorage`.
- Catalogue simple et catalogue dynamique conservés dans deux clés et deux structures différentes.
- Inventaire lié aux articles par le nom dans certains flux, alors que `product_id` existe dans le schéma.
- Chats Job accessibles par plusieurs écrans, mais encore représentés par des données locales distinctes.
- Informations Jobs répétées dans les sélecteurs, tableaux, punchs et commandes.
- Données employés et comptes utilisateurs présentées comme une même chose dans plusieurs écrans.
- Historique stocké tantôt dans une propriété de l’objet, tantôt prévu dans `order_history` ou `audit_log`.

## 4. Relations manquantes ou incomplètes

- entité `employees` distincte de `users`;
- `punch_segments` et demandes de correction;
- `approvals` génériques;
- `notifications` persistantes;
- `extras`, `expenses`, `photos` et `documents` comme objets centraux;
- `deliveries` et `delivery_lines`;
- paramètres d’entreprise et préférences utilisateur;
- `company_id` explicite dans `conversation_members`, `messages` et certaines lignes historiques;
- clés étrangères pour plusieurs champs acteur/utilisateur;
- `job_id` et `company_id` explicites sur les lignes de commande;
- valeurs avant/après, motif et contexte complet dans `inventory_movements`;
- contraintes empêchant les relations entre objets de compagnies différentes.

## 5. Architecture cible

```text
COMPANY
├── USERS ── EMPLOYEES
├── JOBS
│   ├── JOB MEMBERS
│   ├── PUNCH SEGMENTS ── CORRECTION REQUESTS
│   ├── ORDERS ── ORDER LINES
│   ├── PHOTOS
│   ├── DOCUMENTS
│   ├── EXTRAS
│   ├── EXPENSES
│   ├── DELIVERIES ── DELIVERY LINES
│   └── JOB CONVERSATION
├── ARTICLES ── ARTICLE ORDER FIELDS
├── INVENTORY ITEMS ── INVENTORY MOVEMENTS
├── SUPPLIERS ── PURCHASE ORDERS
├── CONVERSATIONS ── MEMBERS ── MESSAGES
├── NOTIFICATIONS
├── APPROVALS
├── AUDIT RECORDS
└── SETTINGS / USER PREFERENCES
```

Principe obligatoire : tous les accès passent par `company_id`; tout objet chantier possède son `job_id`; l’interface manipule les IDs et n’utilise les libellés que pour l’affichage.

## 6. Sources de vérité proposées

| Module | Source de vérité | IDs principaux | Vues consommatrices |
|---|---|---|---|
| Compagnie | Company | `company_id` | Connexion, administration, thème |
| Compte | User | `company_id`, `user_id` | Session, permissions, notifications |
| RH | Employee | `company_id`, `employee_id`, `user_id?` | Employés, équipes, heures, salaire |
| Job | Job | `company_id`, `job_id` | Jobs, punch, commande, dossier, rapports |
| Heures | PunchSegment | `company_id`, `employee_id`, `job_id`, `segment_id` | Punch, mes heures, Job, approbations, rapports |
| Commande | Order + OrderLine | `company_id`, `job_id`, `order_id`, `order_line_id` | Employé, administration, Job, panier, rapports |
| Article | Article + ArticleField | `company_id`, `article_id` | Catalogue, commande, inventaire |
| Inventaire | InventoryItem + InventoryMovement | `company_id`, `article_id`, `inventory_item_id` | Inventaire, panier, commande, rapports |
| Fournisseur | Supplier | `company_id`, `supplier_id` | Catalogue, PO, dépenses, rapports |
| Livraison | Delivery + DeliveryLine | `company_id`, `job_id`, `delivery_id`, `order_line_id` | Panier, commande, Job, inventaire, rapports |
| Photo | Photo | `company_id`, `job_id`, `photo_id` | Job, commande, dépense, extra |
| Document | Document | `company_id`, `job_id`, `document_id` | Job, discussion, plans |
| Extra | Extra | `company_id`, `job_id`, `extra_id` | Terrain, Job, approbations, rapports |
| Dépense | Expense | `company_id`, `job_id`, `expense_id` | Achats, Job, approbations, rapports |
| Discussion | Conversation + Message | `company_id`, `conversation_id`, `job_id?` | Discussion, Job, notifications |
| Notification | Notification | `company_id`, `recipient_user_id`, `source_type`, `source_id` | Cloche, accueil, lien direct |
| Approbation | Approval | `company_id`, `object_type`, `object_id` | Punch, extras, dépenses, accueil |
| Audit | AuditRecord | `company_id`, `object_type`, `object_id` | Historiques, administration, conformité |
| Rapport | Requêtes sur les sources ci-dessus | mêmes IDs | Rapports et exports |

## 7. Permissions centrales proposées

Créer une fonction serveur unique `authorize(actor, permission, resource)` et une matrice centralisée :

- `job.view`, `job.create`, `job.edit`, `job.assign`;
- `employee.view`, `employee.manage`;
- `punch.view_own`, `punch.edit_own`, `punch.review`, `punch.report`;
- `order.create`, `order.view_own`, `order.process`, `order.report`;
- `catalog.manage`, `inventory.manage`, `supplier.manage`;
- `expense.create`, `expense.review`, `financials.view`;
- `extra.create`, `extra.review`;
- `conversation.view`, `conversation.group_manage`;
- `administration.manage`, `permissions.manage`.

Les menus peuvent masquer les actions non permises, mais chaque lecture et écriture doit refaire la validation côté serveur avec `company_id` et, lorsque requis, l’assignation à la Job.

## 8. Plan de migration minimal

### Phase 0 — Geler les nouveaux modèles parallèles

- continuer les correctifs critiques;
- ne plus ajouter de nouvelle source locale pour un objet déjà existant;
- adopter une convention unique d’IDs et de statuts.

### Phase 1 — Fondations serveur

- ajouter authentification réelle et session serveur;
- créer la couche services/repositories filtrée par `company_id`;
- centraliser permissions et validation;
- ajouter tests d’isolation inter-compagnies.

### Phase 2 — Job et personnes

- créer `employees` sans supprimer `users`;
- migrer Jobs et assignations;
- remplacer progressivement les libellés par `job_id` et `employee_id`.

### Phase 3 — Commandes, catalogue et inventaire

- fusionner catalogue simple/dynamique vers Article + ArticleField;
- migrer Order/OrderLine;
- faire de `product_id/article_id` le lien unique;
- appliquer réservation et sortie dans une transaction serveur;
- produire chaque variation via InventoryMovement.

### Phase 4 — Punchs et approbations

- ajouter PunchSegment et CorrectionRequest;
- séparer durée brute, déduction et durée payable;
- ajouter Approval et AuditRecord.

### Phase 5 — Fichiers et communication

- créer Photo et Document autour des références R2;
- migrer les conversations vers le moteur unique;
- garantir une conversation unique par Job;
- ajouter notifications reliées à `source_type/source_id`.

### Phase 6 — Rapports

- brancher rapports et exports sur les mêmes requêtes filtrées;
- comparer les totaux aux anciennes vues;
- retirer les données locales uniquement après validation.

## 9. Compatibilité et stratégie de données

- migrations uniquement additives au début;
- conserver les anciennes colonnes pendant une période de double lecture contrôlée;
- scripts de reprise idempotents;
- journaliser les lignes non migrables au lieu de les ignorer;
- comparer nombre d’objets, totaux et relations avant bascule;
- bascule module par module derrière un indicateur de fonctionnalité;
- aucune suppression de colonne ou de clé locale avant sauvegarde et validation métier.

## 10. Risques principaux

| Risque | Niveau | Mesure |
|---|---:|---|
| Fuite entre compagnies | Critique | filtrage serveur obligatoire + tests négatifs |
| Double déduction d’inventaire | Critique | transaction unique et clé d’idempotence par livraison |
| Perte d’historique | Élevé | migrations additives et audit avant/après |
| Commandes dupliquées | Élevé | IDs stables et reprise idempotente |
| User/Employee confondus | Élevé | relation nullable explicite et migration vérifiée |
| Rapports incohérents | Élevé | requêtes centrales, unités jamais mélangées |
| Photos dupliquées | Moyen | références R2 uniques et tables de liaison |
| Régression de la démo | Moyen | indicateurs de bascule et jeux de données de test |

## 11. Éléments pouvant rester tels quels

- structure générale React/Vinext;
- langage visuel, tokens CSS et composants existants;
- système responsive partagé entre rôles et appareils;
- ressources Sites D1/R2 déjà déclarées;
- tables Company, User, Job, JobMember, Supplier et Audit comme bases à améliorer;
- Order/OrderLine, catalogue et inventaire existants comme point de départ;
- composants de formulaires dynamiques et constructeur de profil;
- logique d’affichage des rapports, une fois reliée aux services centraux.

## 12. Éléments nécessitant une refactorisation

- authentification et création de compagnie locales;
- toute donnée métier codée directement dans les pages;
- accès direct à `localStorage` depuis les composants métier;
- permissions dispersées par comparaison de rôle;
- références par nom ou libellé;
- catalogue simple et dynamique séparés;
- mises à jour de stock côté client;
- conversations, notifications et historiques simulés;
- exports produits depuis des copies locales;
- duplication des structures entre `page.tsx`, `forge-suite.tsx`, `command-center.tsx` et les bureaux administratifs.

## 13. Décision recommandée

Ne pas entreprendre une réécriture générale. Commencer par une tranche verticale complète et testable :

`Utilisateur authentifié → Job assignée → commande multi-lignes → traitement Boss/Adjointe → réservation → livraison → mouvement d’inventaire → rapport`.

Cette tranche doit utiliser D1 comme source unique, R2 pour les fichiers, les permissions centrales, des transactions idempotentes et l’audit. Une fois ce parcours validé pour deux compagnies distinctes et quatre rôles, appliquer le même patron aux Punchs, Extras, Dépenses et Discussions.

## Critères de sortie de l’audit

- aucune migration destructive lancée;
- architecture actuelle et cible documentées;
- doublons et risques identifiés;
- ordre de migration défini;
- première tranche verticale choisie;
- prochaine étape requiert une validation explicite avant modification massive du modèle ou des données.

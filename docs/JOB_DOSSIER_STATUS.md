# Dossier Job — première intégration démo

La liste Jobs garde son style validé. Les nouvelles Jobs sont créées dans le registre time-demo partagé, avec un seul ID utilisé par les heures, les affectations, les dépenses et le chat. Les anciennes métadonnées administratives servent uniquement de fallback visuel pour les IDs existants.

Ajouté : formulaire par étapes de création/modification, contrôle d’unicité du numéro, validation des membres, contrôle de version et audit; aperçu des heures réelles du registre démo; équipe et heures; dépenses existantes; conversation existante; historique provenant des événements enregistrés.

Limites importantes : l’étape des fichiers initiaux n’accepte pas encore d’envoi. Photos, documents, extras, livraisons et rapports sont des états non connectés, sans données fictives présentées comme officielles. La progression est indisponible. Le modèle hérité de CommandCenter stocke encore le libellé/numéro de Job, pas job_id : le filtrage temporaire par numéro n’est pas une migration centrale et peut nécessiter une migration avant renommage des numéros. Les créations ne sont pas publiées dans une API de production.

Validation : build passé avant le dernier ajustement du filtrage CommandCenter; tests de création/mise à jour/audit, doublons, compagnie et dates réussis. L’aperçu a montré une ancienne version du bouton Nouvelle Job malgré la réponse serveur contenant la nouvelle version : un rechargement de l’onglet reste nécessaire pour valider visuellement le parcours. Matrice complète appareils/thèmes/rôles non validée. Le dossier complet demandé reste inachevé.

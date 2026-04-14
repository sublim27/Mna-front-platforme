Dans le cadre de ce projet de fin d’étude de master, le travail porte sur la conception et la mise en place d’une plateforme unifiée de supervision de sécurité destinée à optimiser les activités du SOC managé du cabinet Mare Nostrum Advising Groupe.

MN Advising Groupe est un cabinet de conseil et de services spécialisé en cybersécurité, proposant à ses clients un accompagnement complet couvrant la gouvernance, le management des risques, la conformité, ainsi que les opérations de sécurité à travers son offre de SOC managé. Cette dernière vise à assurer une surveillance continue (24h/24 et 7j/7) des systèmes d’information des clients, à travers la détection et la réponse aux incidents de sécurité.

Actuellement, la supervision des environnements clients repose sur les SIEM (Security Information and Event Management) déployés et hébergés directement chez ces derniers. Chaque client dispose ainsi de sa propre solution de supervision, utilisant des technologies variées.

Cette diversité technologique, engendre des difficultés opérationnelles majeures pour l’équipe SOC de MN Advising Groupe. Les analystes doivent en effet se connecter à chaque environnement client, en manipulant des interfaces différentes et des formats de données hétérogènes (parsing, normalisation, corrélation, etc.). Cette complexité rend le management global des opérations difficile, réduit la visibilité consolidée sur l’ensemble des incidents, et allonge les délais de traitement des alertes.

Face à cette problématique, l’objectif principal de ce projet est de concevoir une architecture centralisée de supervision multi-clients, permettant d’unifier la remontée des alertes et la gestion des incidents à partir d’une plateforme unique et homogène. Cette plateforme servira de socle commun à tous les analystes SOC, en offrant une vue consolidée sur les événements de sécurité de l’ensemble des clients tout en maintenant une isolation stricte des données entre les environnements.

Le projet consistera donc à :

§ Étudier les différentes architectures possibles pour la centralisation et la normalisation des alertes issues des SIEM clients.

§ Concevoir et implémenter une solution technique de collecte et d’agrégation permettant de remonter les événements sans compromettre la confidentialité des données.

§ Mettre en place une plateforme SOC centralisée offrant des fonctionnalités de visualisation, de corrélation, de gestion des incidents et de reporting, adaptée à une approche multi-tenant.

§ Proposer un modèle d’architecture garantissant la sécurité, la scalabilité et la performance.

La démarche de ce projet s’articulera autour de plusieurs phases :

1. Cadrage et étude de faisabilité : analyse des environnements existants, identification des contraintes techniques et définition des besoins fonctionnels.

2. Conception de l’architecture cible : élaboration du modèle de données, choix des technologies et définition des flux.

3. Développement et intégration : création des connecteurs de données, mise en place du portail central de supervision et configuration des tableaux de bord.

4. Tests et validation : vérification de la conformité, des performances et de la sécurité de la solution.

5. Déploiement et documentation : mise en production d’un environnement pilote et rédaction des procédures opérationnelles.

La réalisation de cette plateforme permettra à Mare Nostrum Advising Groupe son offre SOC managé. Les analystes bénéficieront d’un environnement unifié facilitant la détection et la réponse aux incidents, tout en améliorant la cohérence et la rapidité du traitement des alertes.
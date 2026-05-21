                        Spécifications Fonctionnelles - O'RDV

I. Méthodologie et Philosophie Agile

    Le projet O'RDV est piloté selon une approche Agile (Scrum). Contrairement au cycle en cascade, cette méthode permet une livraison itérative :

    Adaptabilité : En tant que développeur solo, les Sprints hebdomadaires permettent de réajuster les priorités selon la complexité technique rencontrée (ex: gestion des algorithmes de conflits horaires).

    Approche MVP (Minimum Viable Product) : Priorisation du "cœur" métier (agenda et réservation) pour garantir un produit fonctionnel rapidement avant d'ajouter des options de confort. Cela répond à la valeur agile : "Un logiciel opérationnel plus qu'une documentation exhaustive".

    Transparence et Visibilité : L'utilisation d'un Kanban (Trello) permet un suivi précis des états (Backlog, En cours, Tests, Terminé) et assure une traçabilité des évolutions.
        https://trello.com/b/gd2sUljs/ordv

II. Architecture Fonctionnelle (MVP) & Critères d'Acceptation

    1. Espace Client (Front-Office)

        Moteur de recherche multicritères : Recherche par raison sociale, catégorie de service et zone géographique.

        Critère d'acceptation : L'utilisateur peut filtrer les résultats par code postal et obtenir une liste pertinente en moins de 2 secondes.

        Module de réservation : Visualisation dynamique des créneaux et validation en "un clic".

        Critère d'acceptation : Une fois réservé, le créneau disparait des choix possibles pour les autres utilisateurs (prévention des doublons).

        Annuaire des prestataires : Fiches détaillées (descriptifs, tarifs, durées).

        Critère d'acceptation : Toutes les informations saisies par le professionnel (prix, photo) sont visibles par le client.

    2. Interface Prestataire (Dashboard)

        Gestion du catalogue : Administration des services (libellés, prix, durée estimée).

        Critère d'acceptation : Le prestataire peut ajouter, modifier ou supprimer une prestation avec mise à jour immédiate sur son profil public.

        Pilotage de l'activité : Vue calendrier des rendez-vous entrants.

        Critère d'acceptation : Chaque nouveau rendez-vous génère une notification visuelle sur le dashboard.

        Configuration des disponibilités : Paramétrage des plages horaires et absences.

        Critère d'acceptation : Les périodes d'absences définies bloquent automatiquement la prise de rendez-vous sur le front-office.

    3. Administration (Back-Office)

        Supervision : Monitoring du volume de réservations.

        Modération : Gestion des utilisateurs et validation des inscrits.

        Critère d'acceptation : L'administrateur peut bannir un utilisateur ou suspendre un établissement en cas de non-respect des CGU.

III. Modèle Économique

    Abonnement Basic : Gratuit pour le référencement standard.

    Abonnement Premium : 9,99€ HT/mois pour une visibilité accrue.

    Modèle Transactionnel : Commission de 1€ par réservation honorée.

IV. Roadmap (12 Semaines)

    Phase 1 (Semaines 1-4) : Socle technique, modélisation de la base de données (UML) et système d'authentification sécurisé.

    Phase 2 (Semaines 5-8) : Développement du moteur de réservation, dashboard professionnel et intégration de la cartographie.

    Phase 3 (Semaines 9-12) : Interface administrateur, phases de tests (Unitaires/Intégration) et mise en production.
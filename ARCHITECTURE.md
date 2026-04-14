# Documentation Technique et Sécurité - O'RDV

Ce document détaille les choix architecturaux, les mesures de sécurité et les stratégies d'infrastructure mises en place pour le projet O'RDV (Niveau CDA).

## 1. Sécurité Applicative

### Défense en Profondeur
Le projet suit le principe de **défense en profondeur**, multipliant les couches de protection :
* **Couche Transport :** Utilisation du protocole HTTPS/TLS pour chiffrer les données en transit.
* **Couche Application :** Validation stricte des schémas de données (entrées utilisateurs) pour prévenir les injections.
* **Couche Données :** Hachage des mots de passe via Argon2/Bcrypt.

### Contrôle d'Accès (RBAC & Moindre Privilège)
L'application implémente un système de **RBAC (Role-Based Access Control)** :
* **Utilisateur (Client) :** Accès limité à la prise de rendez-vous et gestion de son profil.
* **Professionnel :** Accès à la gestion du planning et des paramètres du shop.
* **Admin :** Gestion globale de la plateforme.

Le **principe de moindre privilège** est appliqué : chaque composant et utilisateur n'a accès qu'aux ressources strictement nécessaires à sa fonction.

---

## 2. Benchmark Technique

| Critère | Technologies choisies | Justification |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | Rapidité du Virtual DOM et écosystème mature pour les calendriers. |
| **Backend** | Node.js / Express | Architecture non-bloquante idéale pour les notifications en temps réel. |
| **Sécurité** | JWT + Middleware RBAC | Gestion décentralisée de l'authentification et contrôle granulaire. |

---

## 3. Stratégie d'Infrastructure et Sauvegarde

### Politique de Sauvegarde (Stratégie 3-2-1)
Pour garantir la résilience des données (rendez-vous, fiches clients), nous appliquons la règle 3-2-1 :
* **3 copies des données :** 1 base de production + 2 sauvegardes.
* **2 supports différents :** Stockage local (serveur) et stockage Cloud (Bucket S3/Object Storage).
* **1 copie hors-site :** Sauvegarde distante pour prévenir les sinistres physiques sur le serveur principal.

### Types de Sauvegardes
1.  **Complète (Full) :** Hebdomadaire (dimanche à 02:00).
2.  **Incrémentale :** Quotidienne (sauvegarde uniquement des modifications du jour).
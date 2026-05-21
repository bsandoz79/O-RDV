# Dossier de Projet — O'RDV
## Titre Professionnel Concepteur Développeur d'Applications — RNCP37873

---

| | |
|---|---|
| **Candidat** | Baptiste Sandoz |
| **Formation** | CDA — Ecole IT |
| **Projet** | O'RDV — Plateforme de réservation de rendez-vous beauté/bien-être |
| **Période** | 2024 - 2025 |
| **Repository** | https://github.com/bsandoz79/O-RDV |
| **Application** | https://o-rdv.vercel.app |

---

## Sommaire

1. [Présentation du projet](#1-présentation-du-projet)
2. [BC01 — Développer une application sécurisée](#2-bc01--développer-une-application-sécurisée)
3. [BC02 — Concevoir et développer une application sécurisée organisée en couches](#3-bc02--concevoir-et-développer-une-application-sécurisée-organisée-en-couches)
4. [BC03 — Préparer le déploiement d'une application sécurisée](#4-bc03--préparer-le-déploiement-dune-application-sécurisée)
5. [Sécurisation (fil rouge)](#5-sécurisation-fil-rouge)
6. [Difficultés rencontrées et solutions](#6-difficultés-rencontrées-et-solutions)
7. [Bilan et perspectives](#7-bilan-et-perspectives)

---

## 1. Présentation du projet

### 1.1 Contexte

> **[À COMPLÉTER — 5-8 lignes]**
> Expliquer pourquoi tu as choisi ce projet, quel besoin il répond, et dans quel cadre il a été réalisé (formation CDA, projet personnel...).

*Exemple de piste : "O'RDV est né du constat que de nombreux petits établissements de beauté (coiffeurs, barbiers, instituts de beauté) ne disposent pas d'un outil simple pour gérer leurs rendez-vous en ligne..."*

### 1.2 Objectifs

O'RDV est une plateforme web de réservation de rendez-vous en temps réel dédiée aux établissements de beauté et bien-être. Elle met en relation trois types d'acteurs :

- **Clients** : recherchent un prestataire, réservent un créneau, laissent des avis
- **Prestataires (Pro)** : gèrent leur établissement, leurs services, leurs horaires et leurs rendez-vous
- **Administrateurs** : supervisent la plateforme, certifient les prestataires, modèrent les contenus

### 1.3 Fonctionnalités principales

| Acteur | Fonctionnalités |
|---|---|
| Client | Inscription/connexion (email + Google OAuth), recherche par nom/ville/catégorie, géolocalisation, favoris, réservation, annulation, avis et notes, ajout Google Agenda |
| Prestataire | Configuration du profil et des services, gestion des horaires, confirmation/refus des RDV, dashboard statistiques, galerie photos (Cloudinary) |
| Admin | Gestion des utilisateurs (ban/unban), certification des prestataires, KPIs, impersonation, multi-vue simultanée |

### 1.4 Stack technique

| Couche | Technologie | Justification |
|---|---|---|
| Frontend | React 18 + Tailwind CSS | > **[À COMPLÉTER — pourquoi React plutôt que Vue/Angular ?]** |
| Backend | Node.js + Express | > **[À COMPLÉTER — pourquoi Node.js ?]** |
| ORM | Prisma 5 | > **[À COMPLÉTER — pourquoi Prisma plutôt que Sequelize ?]** |
| Base de données | MySQL 8 | > **[À COMPLÉTER — pourquoi MySQL ?]** |
| Cache | Redis | Accès données NoSQL, cache des requêtes fréquentes |
| Authentification | JWT + Google OAuth 2.0 | Sécurisation stateless + login social |
| Stockage images | Cloudinary | CDN managé, persistance en staging |
| Déploiement | Railway (API) + Vercel (Frontend) | > **[À COMPLÉTER — pourquoi ces choix ?]** |
| CI/CD | GitHub Actions | Automatisation tests + build à chaque push |
| Conteneurisation | Docker + docker-compose | Portabilité et reproductibilité de l'environnement |

---

## 2. BC01 — Développer une application sécurisée

### 2.1 Installation et configuration de l'environnement

L'environnement de développement est configuré avec :

- **Node.js 18** (LTS) pour le backend
- **React 18** via Create React App pour le frontend
- **Git** avec GitHub pour le versioning (branche `develop` → déploiement automatique)
- **Variables d'environnement** isolées dans `.env` (gitignore) — un `.env.example` documente les variables requises sans exposer les valeurs

```bash
# Lancer le projet en local
cd backend && npm run dev     # API sur http://localhost:5000
cd frontend && npm start       # App sur http://localhost:3000

# Ou via Docker
docker-compose up --build      # Tout-en-un : MySQL + API + Frontend
```

### 2.2 Développement des interfaces utilisateur

Le frontend est une SPA (Single Page Application) développée en React 18 avec Tailwind CSS.

**Architecture des composants :**

```
src/
  App.jsx              ← Router, guards de session, impersonation
  pages/
    Home.jsx           ← Liste prestataires + carte + filtres
    ProviderProfile.jsx← Fiche prestataire + carte + réservation
    auth/              ← Login, Register, AuthCallback (OAuth)
    user/              ← Dashboard client/pro
    pro/               ← Paramètres établissement
    admin/             ← Panel admin + multi-vue
  components/
    Navbar.jsx         ← Navigation adaptative (rôles)
    ProviderCard.jsx   ← Carte prestataire avec badge ouvert/fermé
    BookingPage.jsx    ← Sélecteur service + date + créneau
    ProviderMap.jsx    ← Carte Leaflet + routing OSRM
```

**Extrait — Composant ProviderCard avec badge horaire dynamique :**

```jsx
function getOpenBadge(todayOpen, todayClose, todayIsClosed) {
  if (todayIsClosed || (!todayOpen && !todayClose))
    return { label: 'Fermé', style: 'bg-red-500/90 text-white' };

  const nowMin  = new Date().getHours() * 60 + new Date().getMinutes();
  const openMin = toMinutes(todayOpen);
  const closeMin = (todayOpen === '00:00' && todayClose === '00:00')
    ? 1440 : toMinutes(todayClose);

  if (nowMin >= openMin && nowMin < closeMin)
    return { label: 'Ouvert', style: 'bg-emerald-500/90 text-white' };
  return { label: 'Fermé', style: 'bg-red-500/90 text-white' };
}
```

**Responsive design** : tous les composants sont responsive via les utilitaires Tailwind (`sm:`, `lg:`).

### 2.3 Développement des composants métier

**Système de réservation :**

La logique de création d'un rendez-vous vérifie plusieurs règles métier côté backend :

```javascript
// appointmentController.js — vérifications avant création
const existing = await prisma.$queryRaw`
  SELECT id FROM appointments
  WHERE provider_id = ${provider_id}
    AND status NOT IN ('cancelled', 'cancelled_by_pro')
    AND appointment_date < DATE_ADD(${slotEnd}, INTERVAL 1 SECOND)
    AND DATE_ADD(appointment_date, INTERVAL duration MINUTE) > ${appointmentDate}
`;
if (existing.length > 0)
  return res.status(409).json({ error: "Ce créneau chevauche un RDV existant." });
```

Les règles vérifiées :
1. Champs obligatoires présents
2. Date dans le futur
3. Prestataire ouvert ce jour-là
4. Pas de conflit de créneau (overlap)

**Gestion des rôles (RBAC) :**

```javascript
// middlewares/roleGuard.js
module.exports = (roles) => (req, res, next) => {
  if (!req.auth || !roles.includes(req.auth.role))
    return res.status(403).json({ error: "Accès refusé." });
  next();
};
```

**Système d'avis avec protection anti-doublon :**
- Un avis par rendez-vous (contrainte `UNIQUE` sur `reviews.appointment_id`)
- Like/unlike avec contrainte `UNIQUE(review_id, user_id)`

### 2.4 Gestion de projet — Méthode Agile

Le projet a été géré avec une approche **Kanban** via Trello :

- **Backlog** : user stories au format *"En tant que [rôle], je veux [action], afin de [bénéfice]"*
- **À faire (Sprint)** : tâches de la semaine
- **En cours** : travail actif
- **Tests / Recette** : vérification avant mise en production
- **Terminé** : features livrées

> **[À COMPLÉTER — 3-4 lignes]**
> Décris comment tu as utilisé Trello au quotidien, ta cadence de travail, si tu as eu des revues de sprint avec ton formateur...

---

## 3. BC02 — Concevoir et développer une application sécurisée organisée en couches

### 3.1 Analyse des besoins et maquettes

> **[À COMPLÉTER]**
> Décris comment tu as analysé les besoins (interviews imaginaires, personas, user stories Trello).
> Insère ici des captures de tes maquettes Figma une fois terminées.

Les besoins ont été formalisés sous forme de **user stories** dans Trello (voir section 2.4) et d'un **cahier des charges** documentant :
- Les acteurs et leurs rôles
- Les cas d'utilisation (diagramme UML fourni)
- Les règles métier (horaires, conflits de créneaux, unicité des avis)

### 3.2 Architecture logicielle

Le projet suit une **architecture en couches** (MVC étendu) :

```
┌─────────────────────────────────────────┐
│              FRONTEND (React)           │
│  Pages → Composants → API calls (fetch) │
└──────────────────┬──────────────────────┘
                   │ HTTP/REST (JSON)
┌──────────────────▼──────────────────────┐
│            BACKEND (Express)            │
│  Routes → Middlewares → Controllers     │
│           ↓                             │
│        Prisma ORM                       │
└──────┬────────────────────┬─────────────┘
       │                    │
┌──────▼──────┐    ┌────────▼────────┐
│   MySQL 8   │    │    Redis        │
│ (données)   │    │ (cache)         │
└─────────────┘    └─────────────────┘
```

**Séparation des responsabilités :**

| Couche | Rôle | Exemple |
|---|---|---|
| Routes | Définir les endpoints, appliquer les middlewares | `router.post('/register', authLimiter, register)` |
| Middlewares | Auth JWT, RBAC, rate limiting, upload | `auth.js`, `roleGuard.js`, `rateLimiter.js` |
| Controllers | Logique métier, appels Prisma | `appointmentController.js` |
| Prisma ORM | Accès données, validation schéma | `schema.prisma` |

### 3.3 Base de données relationnelle

La base de données MySQL contient **9 tables** avec des relations explicitement définies via Prisma.

**Voir le diagramme complet : [docs/MCD-MLD.md](MCD-MLD.md)**

**Tables principales :**

| Table | Rôle |
|---|---|
| `users` | Comptes (client, pro, admin) |
| `providers` | Profils établissements (lié à `users`) |
| `services` | Prestations proposées par un prestataire |
| `appointments` | Réservations avec statut et gestion des conflits |
| `reviews` | Avis clients (1 par RDV, contrainte UNIQUE) |
| `business_hours` | Horaires d'ouverture par jour de la semaine |
| `categories` | Catégories de métiers (coiffure, spa...) |
| `review_likes` | Likes des avis (contrainte UNIQUE user+review) |
| `favorites` | Prestataires favoris (contrainte UNIQUE user+pro) |

**Migration automatique au démarrage :**

```javascript
// migrate.js — CREATE TABLE IF NOT EXISTS au démarrage
// Pas de migration manuelle nécessaire
```

### 3.4 Composants d'accès aux données

#### SQL via Prisma ORM

```javascript
// Exemple — Requête complexe avec jointures (shopController.js)
const providers = await prisma.$queryRaw`
  SELECT p.*, c.name as category_name,
    AVG(r.rating) as avg_rating,
    COUNT(DISTINCT r.id) as review_count,
    bh.open_time, bh.close_time, bh.is_closed
  FROM providers p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN reviews r ON r.provider_id = p.id
  LEFT JOIN business_hours bh ON bh.provider_id = p.id
    AND bh.day_of_week = ${today}
  WHERE p.is_visible = true
  GROUP BY p.id
`;
```

#### NoSQL via Redis (cache)

Redis est utilisé pour mettre en cache la liste des prestataires — requête la plus fréquente de l'application.

```javascript
// redis.js — Client Redis singleton
const { createClient } = require('redis');
const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
client.connect();
module.exports = client;
```

```javascript
// shopController.js — Cache avec TTL 5 minutes
const redis = require('../redis');

const getAll = async (req, res) => {
  const cacheKey = 'providers:all';
  const cached = await redis.get(cacheKey);

  if (cached) return res.json(JSON.parse(cached)); // Cache hit

  const providers = await prisma.$queryRaw`...`;  // Cache miss → MySQL
  await redis.setEx(cacheKey, 300, JSON.stringify(safeJson(providers)));
  res.json(safeJson(providers));
};
```

> **[À COMPLÉTER — 2-3 lignes]**
> Explique l'intérêt de Redis dans ton projet : quand le cache est invalidé, les bénéfices en termes de performance...

---

## 4. BC03 — Préparer le déploiement d'une application sécurisée

### 4.1 Plan de tests

#### Tests unitaires — Backend (Jest)

| Fichier | Tests | Couverture |
|---|---|---|
| `auth.middleware.test.js` | 3 tests | Token absent, token invalide, token valide + `req.auth` |
| `roleGuard.middleware.test.js` | 4 tests | Auth absente, rôle incorrect, rôle autorisé, admin multi-rôles |
| `auth.routes.test.js` | 5 tests | Register (email existant, nouvel user, force rôle), Login (inconnu, correct) |
| `appointments.routes.test.js` | 7 tests | Champs manquants, date passée, fermé, succès 201, conflit 409, disponibilités |

**Résultats :** 21/21 tests passent ✅

```bash
cd backend && npm test
# Test Suites: 4 passed, 4 total
# Tests:       21 passed, 21 total
```

#### Tests unitaires — Frontend (Jest + Testing Library)

| Fichier | Tests | Couverture |
|---|---|---|
| `ProviderCard.test.jsx` | 7 tests | Affichage nom/métier, badge fermé, note, distance, badge nouveau, onClick |
| `Login.test.jsx` | > **[À COMPLÉTER — nombre]** | > **[À COMPLÉTER]** |
| `Register.test.jsx` | > **[À COMPLÉTER — nombre]** | > **[À COMPLÉTER]** |

**Résultats :** 17/17 tests passent ✅

```bash
cd frontend && npm test
# Test Suites: 3 passed, 3 total
# Tests:       17 passed, 17 total
```

#### Tests manuels

> **[À COMPLÉTER — tableau de tests manuels]**
> Liste les scénarios que tu as testés manuellement (ex: réservation avec conflit, inscription email existant, connexion Google, ban utilisateur admin...)

| Scénario | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|
| Réservation sur créneau déjà pris | Erreur 409 "créneau chevauche" | Erreur 409 affichée | ✅ |
| Connexion avec mauvais mot de passe | Erreur "Identifiants invalides" | Erreur affichée | ✅ |
| > **[À COMPLÉTER]** | | | |

### 4.2 Documentation de déploiement

#### Architecture de production

```
GitHub (develop)
    │
    ├── Push → GitHub Actions (CI)
    │         ├── Tests backend (Jest)
    │         ├── Tests frontend (Jest)
    │         └── Build frontend
    │
    ├── Railway (auto-deploy backend)
    │   URL : https://o-rdv-production.up.railway.app
    │   Config : railway.toml + nixpacks.toml
    │
    └── Vercel (auto-deploy frontend)
        URL : https://o-rdv.vercel.app
        Config : vercel.json
```

#### Variables d'environnement requises

Voir `backend/.env.example` pour la liste complète :

```env
DATABASE_URL=mysql://user:password@host:3306/ordv_db
JWT_SECRET=phrase_secrete_longue
CLOUDINARY_CLOUD_NAME=...
GOOGLE_CLIENT_ID=...
```

#### Déploiement local via Docker

```bash
# 1. Cloner le projet
git clone https://github.com/bsandoz79/O-RDV.git

# 2. Configurer les variables d'environnement
cp backend/.env.example backend/.env
# Remplir les valeurs dans backend/.env

# 3. Lancer tous les services
docker-compose up --build

# Application disponible sur http://localhost:3000
```

### 4.3 Pipeline CI/CD

Le fichier `.github/workflows/main.yml` déclenche automatiquement à chaque push sur `develop` :

```yaml
jobs:
  test-backend:
    - npm install
    - npm test          # 21 tests Jest

  build-frontend:
    - npm install
    - npm test          # 17 tests Jest
    - npm run build     # Build production React
```

**Avantages :**
- Détection immédiate des régressions
- Build vérifié avant déploiement
- Historique des runs visible sur GitHub Actions

### 4.4 Conteneurisation Docker

```yaml
# docker-compose.yml — 3 services
services:
  db:       # MySQL 8 avec healthcheck
  backend:  # Node.js + Prisma (attend que db soit healthy)
  frontend: # React buildé + servi par nginx
```

**Multi-stage build frontend** (optimisation) :
- Stage 1 : build React (node:18-alpine)
- Stage 2 : servir avec nginx:alpine
- Image finale : ~25 Mo au lieu de ~1 Go

---

## 5. Sécurisation (fil rouge)

La sécurité est intégrée à chaque couche de l'application, conformément aux recommandations OWASP.

| Menace OWASP | Mesure implémentée | Fichier |
|---|---|---|
| Broken Access Control | RBAC via `roleGuard.js` — 3 rôles (user/pro/admin) | `middlewares/roleGuard.js` |
| Cryptographic Failures | Mots de passe hashés bcrypt (salt 10) | `authController.js` |
| Injection | Requêtes paramétrées Prisma (pas de SQL brut utilisateur) | `prisma/client.js` |
| Broken Authentication | JWT signé (24h), validation format email + mdp | `middlewares/auth.js` |
| Brute Force | Rate limiting : 10 req/15min sur auth, 120/min sur API | `middlewares/rateLimiter.js` |
| Sensitive Data Exposure | Variables sensibles dans `.env` (gitignore), HTTPS en prod | `backend/.env` |
| Compte banni | Vérification `is_banned` à chaque requête authentifiée | `middlewares/auth.js` |

**RGPD :**
- Suppression définitive du compte et des données associées (`DELETE /api/user/account`)
- Politique de confidentialité et mentions légales accessibles
- Pas d'email personnel dans le code source

---

## 6. Difficultés rencontrées et solutions

> **[À COMPLÉTER — section très importante pour le jury]**
> C'est ici que tu montres ta capacité à résoudre des problèmes. Donne 4-5 exemples concrets.
> Format suggéré : Problème → Cause → Solution → Ce que tu as appris

**Exemple de structure :**

### Difficulté 1 : [Nom du problème]
**Problème :** > [Décris ce qui ne fonctionnait pas]

**Cause :** > [Ce que tu as compris après investigation]

**Solution :** > [Ce que tu as fait pour résoudre]

**Apprentissage :** > [Ce que ça t'a apporté]

---

### Difficulté 2 : [Nom du problème]
> **[À COMPLÉTER]**

---

*Pistes de difficultés à développer :*
- *Gestion des conflits de créneaux (overlap d'appointments)*
- *BigInt MySQL non sérialisable en JSON avec Prisma*
- *Sessions isolées pour l'impersonation admin (multi-vue iframes)*
- *Tests Jest cassés après renforcement de la validation mot de passe*
- *Déploiement Railway : variables d'environnement et DATABASE_URL Prisma*

---

## 7. Bilan et perspectives

### 7.1 Compétences acquises

> **[À COMPLÉTER — 5-8 lignes personnelles]**
> Qu'est-ce que ce projet t'a appris ? Quelles compétences as-tu développées ou renforcées ?

### 7.2 Ce que je ferais différemment

> **[À COMPLÉTER — 3-4 points]**
> Ex: commencer par les tests, utiliser TypeScript, mieux planifier la BDD dès le début...

### 7.3 Perspectives d'évolution

Fonctionnalités envisagées pour une version future :
- Notifications en temps réel (WebSocket)
- Application mobile (React Native)
- Système de paiement en ligne (Stripe)
- Tableau de bord analytique avancé

### 7.4 Liens du projet

| Ressource | Lien |
|---|---|
| Application en ligne | https://o-rdv.vercel.app |
| Code source | https://github.com/bsandoz79/O-RDV |
| API backend | https://o-rdv-production.up.railway.app |
| MCD/MLD | [docs/MCD-MLD.md](MCD-MLD.md) |

---

*Document rédigé dans le cadre du Titre Professionnel CDA — RNCP37873*
*Ecole IT — 2025*

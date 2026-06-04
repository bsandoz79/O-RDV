# Veille Technologique — O'RDV

## Objectif

Cette veille porte sur les technologies utilisées dans O'RDV et les alternatives évaluées lors des choix techniques du projet. Elle documente pourquoi ces technologies ont été retenues ou écartées.

---

## 1. Frontend — React vs alternatives

### Choix retenu : **React 18**

| Critère | React 18 | Vue 3 | Angular | Svelte |
|---------|----------|-------|---------|--------|
| Courbe d'apprentissage | Moyenne | Faible | Élevée | Faible |
| Écosystème | Très riche | Riche | Riche | Limité |
| Performance | Virtual DOM | Virtual DOM | Change Detection | Compilation native |
| Adoption marché | #1 (42% des devs) | #2 | #3 | #4 |
| Support long terme | Meta | Alibaba/communauté | Google | Communauté |

**Justification du choix React :**
- Écosystème mature : librairies disponibles pour tous les besoins (Leaflet, Tailwind, date-fns)
- Forte demande sur le marché du travail (compétence CDA valorisable)
- Hooks (`useState`, `useEffect`) permettent une gestion d'état locale simple sans Redux
- `create-react-app` pour un démarrage rapide en contexte scolaire

---

## 2. CSS — Tailwind CSS vs alternatives

### Choix retenu : **Tailwind CSS 3**

| Critère | Tailwind CSS | Bootstrap 5 | Material UI | CSS Modules |
|---------|-------------|-------------|-------------|-------------|
| Approche | Utility-first | Components | Components | BEM/Scoped |
| Personnalisation | Totale | Limitée (variables) | Limitée (theme) | Totale |
| Taille bundle | Petit (purge) | Moyen | Grand | Minimal |
| Design system | À construire | Fourni | Google Material | À construire |
| Learning curve | Moyenne | Faible | Élevée | Faible |

**Justification :**
- Permet un design sur-mesure sans "look Bootstrap" générique
- Purge automatique des classes non utilisées → bundle CSS minimal en production
- DX (developer experience) rapide : pas de switch entre HTML et CSS
- Responsive intégré avec préfixes `sm:`, `md:`, `lg:`

---

## 3. Backend — Node.js/Express vs alternatives

### Choix retenu : **Node.js 20 + Express 4**

| Critère | Node/Express | NestJS | Django (Python) | Spring Boot (Java) |
|---------|-------------|--------|-----------------|-------------------|
| Performance I/O | Excellent (event loop) | Excellent | Bon | Bon |
| Verbosité | Minimal | Structuré | Moyen | Verbeux |
| TypeScript | Optionnel | Natif | Non | Non |
| ORM compatible | Prisma, Sequelize | TypeORM, Prisma | Django ORM | Hibernate |
| Déploiement | Simple (node index.js) | Simple | Moyen | Complexe (JVM) |

**Justification :**
- Architecture non-bloquante idéale pour les I/O (requêtes DB, géocodage Nominatim, Cloudinary)
- JavaScript full-stack : même langage front et back, réduction du context-switch
- Express minimaliste : pas de "magie" cachée, code explicite
- NestJS écarté : over-engineering pour un projet de cette taille

---

## 4. ORM — Prisma vs alternatives

### Choix retenu : **Prisma 5**

| Critère | Prisma | Sequelize | TypeORM | Knex |
|---------|--------|-----------|---------|------|
| Type safety | Excellent | Moyen | Bon | Aucun |
| Migrations | Auto + CLI | Manuelle | Auto | Manuelle |
| DX | Excellent | Moyen | Bon | Moyen |
| Performances | Bonnes | Bonnes | Bonnes | Excellentes |
| Support MySQL | ✅ | ✅ | ✅ | ✅ |

**Justification :**
- Schema déclaratif (`schema.prisma`) → source de vérité unique pour la BDD
- Client TypeScript généré automatiquement → autocomplétion et détection d'erreurs
- `prisma.$queryRaw` disponible pour les agrégations complexes (moyennes de notes)
- Prisma Studio pour inspecter la BDD visuellement pendant le développement

---

## 5. Base de données — MySQL vs alternatives

### Choix retenu : **MySQL 8**

| Critère | MySQL | PostgreSQL | MongoDB | SQLite |
|---------|-------|-----------|---------|--------|
| Type | Relationnel | Relationnel | NoSQL (document) | Relationnel |
| ACID | ✅ | ✅ | Partiel | ✅ |
| Performances lectures | Excellentes | Très bonnes | Bonnes | Limitées |
| Hébergement Railway | ✅ natif | ✅ natif | Via plugin | Non |
| Complexité | Faible | Moyenne | Faible | Minimale |

**Justification :**
- Données fortement relationnelles (users → providers → appointments → reviews) → SQL adapté
- MySQL natif sur Railway sans configuration supplémentaire
- Prisma supporte MySQL nativement
- PostgreSQL écarté : non-nécessaire pour ce volume de données

**Évolution prévue (BC02 CDA) :** Ajout d'un cache Redis pour la route `/api/shop/all` (liste des prestataires). Redis est une base NoSQL clé-valeur idéale pour le cache HTTP avec TTL configurable.

---

## 6. Authentification — JWT vs sessions serveur

### Choix retenu : **JWT (JSON Web Tokens)**

| Critère | JWT | Sessions serveur (cookie) | OAuth2 seul |
|---------|-----|--------------------------|-------------|
| Stateless | ✅ | ❌ (état serveur) | ✅ |
| Scalabilité | Excellente | Nécessite Redis/sticky | Excellente |
| Révocation | Complexe (blacklist) | Simple | Via provider |
| Stockage client | localStorage | Cookie httpOnly | Dépend |
| CSRF | Pas de risque | Protection requise | Dépend |

**Justification :**
- Architecture stateless : cohérente avec Railway (restart possible à tout moment)
- Token signé `HS256` avec `JWT_SECRET` — payload : `{ userId, role, iat, exp }`
- Expiration 24h → renouvellement régulier pour la sécurité
- Google OAuth2 ajouté en complément via `passport-google-oauth20`

**Note sécurité :** localStorage est utilisé (pas de cookie httpOnly) — choix conscient pour la simplicité en contexte scolaire. En production, un cookie httpOnly + SameSite=Strict serait préférable.

---

## 7. Cartographie — Leaflet vs alternatives

### Choix retenu : **Leaflet 1.9 + OpenStreetMap + OSRM**

| Critère | Leaflet + OSM | Google Maps | Mapbox | Bing Maps |
|---------|--------------|-------------|--------|-----------|
| Coût | Gratuit | Payant au-delà du quota | Payant (50k/mois free) | Payant |
| Open source | ✅ | ❌ | ❌ | ❌ |
| Tiles | OpenStreetMap | Google | Mapbox | Bing |
| Routing | OSRM (gratuit) | Directions API (payant) | Directions API (payant) | Payant |
| Geocoding | Nominatim (gratuit) | Geocoding API (payant) | Geocoding (limité) | Payant |

**Justification :**
- Aucun coût → viable en production sans budget
- Données OpenStreetMap à jour et complètes pour la France
- OSRM (Open Source Routing Machine) : itinéraires voiture/piéton/vélo sans quota
- Nominatim : géocodage d'adresses gratuit (usage raisonnable, max 1 req/s)

---

## 8. Stockage d'images — Cloudinary vs alternatives

### Choix retenu : **Cloudinary**

| Critère | Cloudinary | AWS S3 | Uploadcare | Serveur local |
|---------|-----------|--------|-----------|---------------|
| CDN intégré | ✅ | Via CloudFront | ✅ | ❌ |
| Transformations | ✅ (resize, crop) | ❌ natif | ✅ | ❌ |
| Free tier | 25 GB/mois | 5 GB/12 mois | 3 GB | Illimité (local) |
| Persistance | ✅ | ✅ | ✅ | ❌ (Railway reset) |
| Intégration multer | ✅ (`multer-storage-cloudinary`) | Via SDK | Via SDK | ✅ (multer) |

**Justification :**
- Railway ne garantit pas la persistance du disque local → stockage externe obligatoire
- CDN Cloudinary → images servies rapidement partout dans le monde
- Free tier largement suffisant pour le projet
- `multer-storage-cloudinary` s'intègre nativement dans l'upload Express

---

## 9. Déploiement — Railway + Vercel vs alternatives

### Choix retenu : **Railway (backend) + Vercel (frontend)**

| Critère | Railway + Vercel | Heroku | VPS (OVH/Hetzner) | AWS/GCP |
|---------|-----------------|--------|-------------------|---------|
| Complexité setup | Faible | Faible | Élevée | Très élevée |
| CI/CD intégré | Git push → deploy | Git push → deploy | Manuel (scripts) | Via pipeline |
| MySQL natif | ✅ Railway | Plugin payant | Manuel | RDS payant |
| Free tier | Hobby plan | Supprimé en 2022 | Non | Limité |
| Scalabilité | Automatique | Automatique | Manuelle | Automatique |

**Justification Railway :**
- MySQL inclus dans le même projet (réseau interne `mysql.railway.internal`)
- Auto-deploy sur `develop` via GitHub Actions
- `railway.toml` pour la configuration

**Justification Vercel :**
- Optimisé pour les SPA React (Create React App détecté automatiquement)
- CDN mondial → temps de chargement minimal
- `vercel.json` pour les rewrites SPA (toutes les routes → `index.html`)

---

## 10. Tests — Jest vs alternatives

### Choix retenu : **Jest + Supertest (backend) + React Testing Library (frontend)**

| Critère | Jest | Mocha + Chai | Vitest | Jasmine |
|---------|------|-------------|--------|---------|
| Configuration | Zéro-config CRA | Manuelle | Zéro-config Vite | Manuelle |
| Mocking | Intégré | Via sinon | Intégré | Limité |
| Coverage | Intégré (Istanbul) | Via nyc | Intégré | Via plugin |
| Performance | Bonne | Bonne | Excellente | Moyenne |
| Écosystème | #1 | #2 | Montant | #3 |

**Justification :**
- Jest intégré dans Create React App → aucune configuration frontend
- Supertest permet de tester les routes Express sans démarrer un serveur réel
- `jest.mock()` pour isoler les dépendances (Prisma client, middlewares)
- Coverage HTML généré avec Istanbul → rapport visuel par fichier

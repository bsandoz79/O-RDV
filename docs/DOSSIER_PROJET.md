# Dossier de Projet
# O'RDV — Plateforme de réservation de rendez-vous beauté & bien-être

---

> 📸 **PAGE DE GARDE**
> *Insérer ici : logo O'RDV + capture de la page d'accueil de l'application déployée (https://o-rdv.vercel.app)*

---

| Champ | Valeur |
|---|---|
| **Candidat** | Baptiste Sandoz |
| **Formation** | Concepteur Développeur d'Applications (CDA) |
| **Organisme** | Ecole IT |
| **Titre visé** | RNCP37873 — Niveau 6 (Bac+3/4) |
| **Année** | 2024 — 2025 |
| **Projet** | O'RDV |
| **Repository GitHub** | https://github.com/bsandoz79/O-RDV |
| **Application en ligne** | https://o-rdv.vercel.app |
| **API backend** | https://o-rdv-production.up.railway.app |

---

## Sommaire

1. [Présentation du projet](#1-présentation-du-projet)
   - 1.1 Contexte et problématique
   - 1.2 Objectifs du projet
   - 1.3 Périmètre fonctionnel
   - 1.4 Choix technologiques
2. [BC01 — Développer une application sécurisée](#2-bc01--développer-une-application-sécurisée)
   - 2.1 Configuration de l'environnement de travail
   - 2.2 Développement des interfaces utilisateur
   - 2.3 Développement des composants métier
   - 2.4 Gestion de projet agile
3. [BC02 — Concevoir et développer une application sécurisée organisée en couches](#3-bc02--concevoir-et-développer-une-application-sécurisée-organisée-en-couches)
   - 3.1 Analyse des besoins et maquettes
   - 3.2 Architecture logicielle en couches
   - 3.3 Base de données relationnelle
   - 3.4 Composants d'accès aux données SQL
   - 3.5 Composants d'accès aux données NoSQL (Redis)
4. [BC03 — Préparer le déploiement d'une application sécurisée](#4-bc03--préparer-le-déploiement-dune-application-sécurisée)
   - 4.1 Plan de tests
   - 4.2 Documentation de déploiement
   - 4.3 Pipeline CI/CD
   - 4.4 Conteneurisation Docker
5. [Sécurisation — Fil rouge](#5-sécurisation--fil-rouge)
6. [Difficultés rencontrées et solutions apportées](#6-difficultés-rencontrées-et-solutions-apportées)
7. [Bilan et perspectives](#7-bilan-et-perspectives)

---

## 1. Présentation du projet

### 1.1 Contexte et problématique

> **[À COMPLÉTER — 10 à 15 lignes]**
> Décris le problème que tu as voulu résoudre. Parle des petits salons de beauté qui n'ont pas d'outil de réservation en ligne, des appels téléphoniques manqués, de la difficulté à gérer un planning manuellement. Explique pourquoi tu as choisi ce projet.

*Pistes :*
- *Les établissements de beauté (coiffeurs, barbiers, instituts) gèrent souvent leurs RDV par téléphone ou par messages*
- *Les grandes plateformes existantes (Planity, Treatwell) sont coûteuses pour les petites structures*
- *O'RDV propose une alternative gratuite, open-source, auto-hébergeable*

> 📸 **CAPTURE D'ÉCRAN 1**
> *Insérer ici : screenshot de la page d'accueil O'RDV montrant la liste des prestataires avec les cartes*

### 1.2 Objectifs du projet

O'RDV est une plateforme web de mise en relation entre des clients et des prestataires de services beauté/bien-être. Elle permet :

- Aux **clients** de rechercher un prestataire, consulter ses disponibilités et réserver un créneau en ligne sans appel téléphonique
- Aux **prestataires** de gérer leur activité : services proposés, horaires, rendez-vous entrants, statistiques
- Aux **administrateurs** de superviser la plateforme : valider les prestataires, gérer les utilisateurs, consulter les KPIs

**Objectifs techniques :**
- Développer une application full-stack sécurisée (React + Node.js + MySQL)
- Mettre en place une authentification robuste (JWT + Google OAuth)
- Déployer l'application en production avec un pipeline CI/CD automatisé
- Couvrir les 3 blocs de compétences du titre CDA

### 1.3 Périmètre fonctionnel

#### Côté Client

| Fonctionnalité | Description |
|---|---|
| Inscription / Connexion | Email + mot de passe ou Google OAuth 2.0 |
| Recherche de prestataires | Par nom, ville, catégorie avec filtres avancés |
| Géolocalisation | Tri par distance GPS, affichage sur carte Leaflet |
| Favoris | Ajout/suppression de prestataires favoris |
| Réservation | Sélection service + date + créneau disponible |
| Gestion des RDV | Consultation, annulation, ajout Google Agenda |
| Avis et notes | Formulaire d'avis après un RDV terminé, like des avis |
| Tableau de bord | Historique des RDV, profil, favoris |

> 📸 **CAPTURE D'ÉCRAN 2**
> *Insérer ici : screenshot de la page de réservation (BookingPage) avec sélecteur de service, calendrier et créneaux*

#### Côté Prestataire (Pro)

| Fonctionnalité | Description |
|---|---|
| Configuration profil | Nom, description, adresse, photo, localisation sur carte |
| Gestion des services | Ajout/modification/suppression avec photos et tarifs |
| Horaires d'ouverture | Configuration par jour de la semaine |
| Gestion des RDV | Confirmation ou refus avec motif |
| Dashboard statistiques | Nouveaux clients, RDV à venir, chiffre d'affaires, taux d'occupation |
| Avis reçus | Consultation des avis clients |

> 📸 **CAPTURE D'ÉCRAN 3**
> *Insérer ici : screenshot du dashboard pro (ShopSettings) montrant les statistiques et la liste des RDV*

#### Côté Administrateur

| Fonctionnalité | Description |
|---|---|
| Gestion utilisateurs | Liste, ban/unban avec motif, suppression |
| Gestion prestataires | Certification, visibilité, note administrative |
| KPIs plateforme | Utilisateurs, RDV, avis, prestataires certifiés |
| Impersonation | Connexion en tant qu'un utilisateur pour debug |
| Multi-vue | 3 iframes simultanées (client / pro / admin) |

> 📸 **CAPTURE D'ÉCRAN 4**
> *Insérer ici : screenshot de l'interface admin (AdminPanel) avec la liste des utilisateurs et les statistiques*

### 1.4 Choix technologiques

#### Frontend — React 18 + Tailwind CSS

> **[À COMPLÉTER — 4 à 6 lignes]**
> Justifie ton choix de React. Exemple : composants réutilisables, Virtual DOM pour les performances, écosystème riche (React Router, hooks), popularité en entreprise...

> **[À COMPLÉTER — 2 à 3 lignes]**
> Justifie ton choix de Tailwind CSS. Exemple : utilitaires CSS prêts à l'emploi, pas de CSS custom à maintenir, responsive facile, bundle final optimisé...

#### Backend — Node.js + Express

> **[À COMPLÉTER — 4 à 6 lignes]**
> Justifie Node.js : non-bloquant (event loop), JavaScript côté serveur = même langage front/back, npm très riche, bien adapté aux APIs REST...

#### Base de données — MySQL 8 + Prisma ORM

> **[À COMPLÉTER — 3 à 4 lignes]**
> Justifie MySQL : base relationnelle mature, forte cohérence des données, contraintes FK et UNIQUE essentielles pour les règles métier (unicité avis, favoris...)

> **[À COMPLÉTER — 3 à 4 lignes]**
> Justifie Prisma : schéma typé, génération automatique du client, migrations, protection contre les injections SQL, DX supérieure à Sequelize...

#### Déploiement — Railway + Vercel

> **[À COMPLÉTER — 3 à 4 lignes]**
> Justifie le choix Railway pour le backend (support Node.js, MySQL intégré, déploiement Git automatique) et Vercel pour le frontend (optimisé React/CRA, CDN mondial, HTTPS automatique)...

> 📸 **CAPTURE D'ÉCRAN 5**
> *Insérer ici : screenshot du dashboard Railway montrant le service backend déployé et actif*

> 📸 **CAPTURE D'ÉCRAN 6**
> *Insérer ici : screenshot du dashboard Vercel montrant le déploiement frontend*

---

## 2. BC01 — Développer une application sécurisée

### 2.1 Configuration de l'environnement de travail

#### Outils et logiciels utilisés

| Outil | Version | Usage |
|---|---|---|
| Node.js | 18 LTS | Runtime JavaScript backend |
| npm | 10+ | Gestionnaire de paquets |
| React | 18.2 | Framework frontend |
| Git | 2.x | Versioning du code |
| GitHub | — | Hébergement du repository |
| VS Code | — | Éditeur de code |
| Postman | — | Tests des endpoints API |
| MySQL Workbench | — | Gestion de la base de données locale |
| Docker Desktop | — | Conteneurisation locale |

> 📸 **CAPTURE D'ÉCRAN 7**
> *Insérer ici : screenshot de VS Code ouvert sur le projet avec l'arborescence des fichiers visible*

#### Structure du monorepo

Le projet est organisé en monorepo avec un backend et un frontend séparés :

```
O'RDV/
├── backend/              ← API Node.js/Express
│   ├── controllers/      ← Logique métier
│   ├── middlewares/      ← Auth, RBAC, rate limiting, upload
│   ├── routes/           ← Définition des endpoints
│   ├── prisma/           ← Schéma et client ORM
│   ├── tests/            ← Tests Jest
│   └── index.js          ← Point d'entrée
├── frontend/             ← Application React
│   ├── src/
│   │   ├── pages/        ← Vues principales
│   │   ├── components/   ← Composants réutilisables
│   │   ├── api/          ← Configuration API
│   │   └── utils/        ← Fonctions utilitaires
│   └── public/
├── docs/                 ← Documentation
├── docker-compose.yml    ← Orchestration Docker
└── .github/workflows/    ← Pipeline CI/CD
```

#### Versioning et branches Git

Le projet suit une stratégie de branches simple :
- `develop` : branche principale de développement, déploiement automatique en staging
- `main` : branche de production (releases stables)

> 📸 **CAPTURE D'ÉCRAN 8**
> *Insérer ici : screenshot de GitHub montrant l'historique des commits sur la branche develop*

#### Démarrage du projet en local

```bash
# Cloner le repository
git clone https://github.com/bsandoz79/O-RDV.git
cd O-RDV

# Backend
cd backend
cp .env.example .env    # Configurer les variables
npm install
npm run dev             # Démarre sur http://localhost:5000

# Frontend (nouveau terminal)
cd frontend
npm install
npm start               # Démarre sur http://localhost:3000
```

#### Démarrage via Docker (tout-en-un)

```bash
cp backend/.env.example backend/.env
docker-compose up --build
# Application disponible sur http://localhost:3000
```

### 2.2 Développement des interfaces utilisateur

#### Architecture des composants React

Le frontend suit une architecture en pages et composants réutilisables :

```
src/
  App.jsx                    ← Router principal, SessionGuard, ProtectedRoute
  api/api.js                 ← URL de base, fonctions fetch authentifiées
  pages/
    Home.jsx                 ← Page d'accueil (recherche + carte)
    ProviderProfile.jsx      ← Fiche prestataire détaillée
    NotFound.jsx             ← Page 404
    auth/
      Login.jsx              ← Formulaire connexion + Google OAuth
      Register.jsx           ← Formulaire inscription + indicateur force mdp
      AuthCallback.jsx       ← Callback Google OAuth
    user/
      UserDashboard.jsx      ← Tableau de bord client/pro
    pro/
      ShopSettings.jsx       ← Configuration établissement pro
    admin/
      AdminPanel.jsx         ← Gestion utilisateurs et prestataires
      MultiView.jsx          ← Vue multi-rôles simultanées
    legal/
      MentionsLegales.jsx    ← Mentions légales
      PolitiqueConfidentialite.jsx ← RGPD
  components/
    Navbar.jsx               ← Navigation adaptive selon rôle
    ProviderCard.jsx         ← Carte prestataire avec statut ouvert/fermé
    BookingPage.jsx          ← Tunnel de réservation
    ProviderMap.jsx          ← Carte Leaflet avec routing
    ProvidersMap.jsx         ← Carte multi-marqueurs page d'accueil
    StarRating.jsx           ← Affichage et saisie de notes
    PasswordStrength.jsx     ← Indicateur de force du mot de passe
```

#### Page d'accueil — Recherche et filtrage

La page d'accueil affiche la liste des prestataires avec un système de recherche et filtrage avancé :

```jsx
// Home.jsx — Filtrage côté client
const filtered = providers
  .filter(p => {
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCat || p.category_id === selectedCat;
    const matchOpen = !filterOpen || p.is_open;
    const matchRating = !minRating || (p.avg_rating >= minRating);
    return matchSearch && matchCat && matchOpen && matchRating;
  })
  .sort((a, b) => {
    if (sortBy === 'distance') return (a.distance_km || 999) - (b.distance_km || 999);
    if (sortBy === 'rating')   return (b.avg_rating || 0) - (a.avg_rating || 0);
    return a.name?.localeCompare(b.name);
  });
```

> 📸 **CAPTURE D'ÉCRAN 9**
> *Insérer ici : screenshot de la page d'accueil avec la barre de recherche, les filtres de catégories et les cartes prestataires*

> 📸 **CAPTURE D'ÉCRAN 10**
> *Insérer ici : screenshot de la carte Leaflet (ProvidersMap) sur la page d'accueil avec les marqueurs des prestataires*

#### Composant ProviderCard — Badge horaire dynamique

Le badge ouvert/fermé est calculé dynamiquement à partir des horaires du prestataire :

```jsx
function getOpenBadge(todayOpen, todayClose, todayIsClosed) {
  if (todayIsClosed || (!todayOpen && !todayClose))
    return { label: 'Fermé', style: 'bg-red-500/90 text-white' };

  const now     = new Date();
  const nowMin  = now.getHours() * 60 + now.getMinutes();
  const openMin = toMinutes(todayOpen);
  const closeMin = (todayOpen === '00:00' && todayClose === '00:00')
    ? 1440 : toMinutes(todayClose);

  if (nowMin >= openMin && nowMin < closeMin)
    return { label: 'Ouvert', style: 'bg-emerald-500/90 text-white' };
  if (nowMin < openMin && openMin - nowMin <= 30)
    return { label: 'Ouvre bientôt', style: 'bg-orange-400/90 text-white' };
  return { label: 'Fermé', style: 'bg-red-500/90 text-white' };
}
```

> 📸 **CAPTURE D'ÉCRAN 11**
> *Insérer ici : screenshot de cartes prestataires avec les badges "Ouvert" (vert) et "Fermé" (rouge) visibles*

#### Page de profil prestataire — Carte et routing

La fiche prestataire intègre une carte Leaflet avec calcul d'itinéraire via l'API OSRM :

```jsx
// ProviderMap.jsx — Calcul d'itinéraire OSRM
const fetchRoute = async (mode) => {
  const url = `https://router.project-osrm.org/route/v1/${mode}/
    ${userCoords[1]},${userCoords[0]};
    ${providerCoords[1]},${providerCoords[0]}
    ?overview=full&geometries=geojson`;
  const data = await fetch(url).then(r => r.json());
  setRoute(data.routes[0].geometry.coordinates);
  setDuration(Math.round(data.routes[0].duration / 60));
};
```

> 📸 **CAPTURE D'ÉCRAN 12**
> *Insérer ici : screenshot de la fiche prestataire avec la carte Leaflet et l'itinéraire tracé*

> 📸 **CAPTURE D'ÉCRAN 13**
> *Insérer ici : screenshot des boutons de navigation (voiture/piéton/vélo) et les liens Waze/Google Maps*

#### Formulaire de réservation — BookingPage

Le tunnel de réservation guide l'utilisateur en 3 étapes : sélection du service → choix de la date → choix du créneau.

> 📸 **CAPTURE D'ÉCRAN 14**
> *Insérer ici : screenshot de BookingPage — étape 1 : liste des services avec prix et durée*

> 📸 **CAPTURE D'ÉCRAN 15**
> *Insérer ici : screenshot de BookingPage — étape 2/3 : calendrier + créneaux disponibles*

#### Indicateur de force du mot de passe

```jsx
// PasswordStrength.jsx — 4 niveaux de force
const LEVELS = [
  { label: 'Faible',    color: 'bg-red-400' },
  { label: 'Moyen',     color: 'bg-orange-400' },
  { label: 'Fort',      color: 'bg-yellow-400' },
  { label: 'Très fort', color: 'bg-green-500' },
];

export function getPasswordScore(password) {
  let score = 0;
  if (password.length >= 8)            score++;
  if (/[A-Z]/.test(password))          score++;
  if (/[0-9]/.test(password))          score++;
  if (/[^A-Za-z0-9]/.test(password))   score++;
  return score;
}
```

> 📸 **CAPTURE D'ÉCRAN 16**
> *Insérer ici : screenshot de la page d'inscription avec l'indicateur de force du mot de passe (barre colorée + critères)*

#### Gestion de session et protection des routes

```jsx
// App.jsx — SessionGuard : déconnexion après 30 min d'inactivité
function SessionGuard({ children }) {
  useEffect(() => {
    const checkSession = () => {
      const lastActivity = localStorage.getItem('lastActivity');
      const token = localStorage.getItem('token');
      if (token && lastActivity) {
        const diff = Date.now() - parseInt(lastActivity);
        if (diff > 30 * 60 * 1000) {  // 30 minutes
          localStorage.clear();
          window.dispatchEvent(new Event('authChange'));
        }
      }
    };
    const interval = setInterval(checkSession, 60000);
    return () => clearInterval(interval);
  }, []);
  return children;
}
```

#### Authentification Google OAuth — Flux complet

> 📸 **CAPTURE D'ÉCRAN 17**
> *Insérer ici : screenshot de la page de login avec le bouton "Continuer avec Google"*

> 📸 **CAPTURE D'ÉCRAN 18**
> *Insérer ici : screenshot de la popup Google d'autorisation OAuth*

### 2.3 Développement des composants métier

#### Système d'authentification

**Inscription :**

```javascript
// authController.js — Validation + hashage + JWT
const register = async (req, res) => {
  const { email, password, role } = req.body;

  // Validations métier
  if (!EMAIL_REGEX.test(email))
    return res.status(400).json({ error: "Format d'email invalide." });
  if (password.length < 8)
    return res.status(400).json({ error: "8 caractères minimum." });
  if (!/[A-Z]/.test(password))
    return res.status(400).json({ error: "Au moins une majuscule." });
  if (!/[0-9]/.test(password))
    return res.status(400).json({ error: "Au moins un chiffre." });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return res.status(400).json({ error: "Email déjà utilisé" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const finalRole = (role === 'admin') ? 'user' : (role || 'user');
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, role: finalRole }
  });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  res.status(201).json({ token, user: { id: user.id, email, role: finalRole } });
};
```

**Middleware d'authentification JWT :**

```javascript
// middlewares/auth.js — Vérification token + check ban
module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token)
      return res.status(401).json({ error: "Accès refusé. Aucun token fourni." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérification en base : compte banni ?
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { is_banned: true, ban_reason: true },
    });

    if (user?.is_banned)
      return res.status(403).json({
        error: "Compte suspendu.",
        banned: true,
        ban_reason: user.ban_reason,
      });

    req.auth = { userId: decoded.id, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ error: "Requête non authentifiée !" });
  }
};
```

#### Système de réservation — Logique anti-conflit

La création d'un rendez-vous nécessite plusieurs vérifications métier :

```javascript
// appointmentController.js
const createAppointment = async (req, res) => {
  const { provider_id, service_id, appointment_date } = req.body;
  const client_id = req.auth.userId;

  // 1. Champs obligatoires
  if (!provider_id || !service_id || !appointment_date)
    return res.status(400).json({ error: "Champs obligatoires manquants." });

  // 2. Date dans le futur
  if (new Date(appointment_date) < new Date())
    return res.status(400).json({ error: "La date est dans le passé." });

  // 3. Prestataire ouvert ce jour-là
  const dayOfWeek = new Date(appointment_date)
    .toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const hours = await prisma.$queryRaw`
    SELECT is_closed, TIME_FORMAT(open_time,'%H:%i') as open_str,
           TIME_FORMAT(close_time,'%H:%i') as close_str
    FROM business_hours
    WHERE provider_id = ${provider_id} AND day_of_week = ${dayOfWeek}
  `;
  if (hours[0]?.is_closed)
    return res.status(400).json({ error: "Le prestataire est fermé ce jour." });

  // 4. Détection de conflit de créneau
  const service = await prisma.service.findUnique({ where: { id: service_id } });
  const slotEnd = new Date(new Date(appointment_date).getTime()
    + service.duration * 60000);
  const conflicts = await prisma.$queryRaw`
    SELECT id FROM appointments
    WHERE provider_id = ${provider_id}
      AND status NOT IN ('cancelled','cancelled_by_pro')
      AND appointment_date < ${slotEnd}
      AND DATE_ADD(appointment_date, INTERVAL duration MINUTE) > ${appointment_date}
  `;
  if (conflicts.length > 0)
    return res.status(409).json({ error: "Ce créneau chevauche un RDV existant." });

  // 5. Création
  const newAppt = await prisma.appointment.create({
    data: { client_id, provider_id, service_id,
            appointment_date: new Date(appointment_date) }
  });
  res.status(201).json({ appointmentId: newAppt.id });
};
```

> 📸 **CAPTURE D'ÉCRAN 19**
> *Insérer ici : screenshot du message d'erreur "Ce créneau chevauche un RDV existant" lors d'une tentative de double réservation*

#### Système de favoris

```javascript
// favoritesController.js — Toggle favori
const toggleFavorite = async (req, res) => {
  const userId = req.auth.userId;
  const providerId = parseInt(req.params.providerId);

  const existing = await prisma.favorite.findUnique({
    where: { user_id_provider_id: { user_id: userId, provider_id: providerId } }
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    res.json({ favorited: false });
  } else {
    await prisma.favorite.create({ data: { user_id: userId, provider_id: providerId } });
    res.json({ favorited: true });
  }
};
```

> 📸 **CAPTURE D'ÉCRAN 20**
> *Insérer ici : screenshot d'une carte prestataire avec le coeur rouge (favori activé)*

> 📸 **CAPTURE D'ÉCRAN 21**
> *Insérer ici : screenshot de la section "Mes prestataires favoris" dans le dashboard client*

#### Dashboard administrateur — Impersonation

L'impersonation permet à un admin de se connecter en tant que n'importe quel utilisateur pour diagnostiquer des problèmes :

```javascript
// adminController.js — Génération d'un token d'impersonation (30 min)
const impersonate = async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  const token = jwt.sign(
    { id: target.id, role: target.role, impersonated: true },
    process.env.JWT_SECRET,
    { expiresIn: '30m' }
  );
  res.json({ token, user: target });
};
```

La fonctionnalité MultiView permet d'afficher 3 sessions simultanées (client / pro / admin) dans des iframes isolées :

```javascript
// MultiView.jsx — Isolation des sessions par iframe
Object.defineProperty(iframeWindow, 'localStorage', {
  value: createIsolatedStorage(token, user),
  writable: false,
});
iframeWindow.fetch = createAuthenticatedFetch(token, iframeWindow.fetch);
```

> 📸 **CAPTURE D'ÉCRAN 22**
> *Insérer ici : screenshot de la vue MultiView avec les 3 iframes côte à côte (client / pro / admin)*

### 2.4 Gestion de projet — Méthode Agile (Kanban)

#### Tableau Trello

Le projet a été géré avec un tableau Trello organisé en 5 colonnes :

| Colonne | Contenu |
|---|---|
| **Backlog (Product)** | Toutes les fonctionnalités à développer (user stories) |
| **À faire (Sprint)** | Tâches sélectionnées pour la semaine |
| **En cours (Doing)** | Travail en cours (1-2 tâches max) |
| **Tests / Recette** | Features à valider avant mise en production |
| **Terminé (Done)** | Features livrées et validées |

Chaque carte suit le format user story :
> *"En tant que [rôle], je veux [action], afin de [bénéfice]"*

Exemple : *"En tant que client, je veux réserver un créneau chez un prestataire, afin d'obtenir un rendez-vous sans téléphoner."*

> 📸 **CAPTURE D'ÉCRAN 23**
> *Insérer ici : screenshot du tableau Trello complet avec toutes les colonnes visibles*

> **[À COMPLÉTER — 5 à 8 lignes]**
> Décris ton organisation au quotidien avec Trello : comment tu planifiais tes sprints, comment tu choisissais les tâches prioritaires, si tu avais des reviews régulières avec ton formateur...

#### Gestion du versioning Git

Le projet compte plus de **50 commits** sur la branche `develop` avec des messages conventionnels :

```
feat: connexion Google OAuth (bouton login/register + callback)
fix: PasswordStrength crash score 0
feat: favoris prestataires (toggle coeur + liste dashboard client)
fix: navbar toujours visible + suppression email perso pages légales
fix: correction des tests cassés suite aux évolutions du code
docs: ajout MCD/MLD en Mermaid
```

> 📸 **CAPTURE D'ÉCRAN 24**
> *Insérer ici : screenshot de GitHub montrant la liste des commits avec les messages et les dates*

---

## 3. BC02 — Concevoir et développer une application sécurisée organisée en couches

### 3.1 Analyse des besoins et maquettes

#### Diagramme de cas d'utilisation (UML)

> 📸 **CAPTURE D'ÉCRAN 25**
> *Insérer ici : le diagramme de cas d'utilisation (Use Case UML) que tu as réalisé*

Les cas d'utilisation couvrent les 3 acteurs principaux :

**Client :** S'inscrire, Se connecter (email ou Google), Rechercher un prestataire, Réserver, Annuler un RDV, Laisser un avis, Gérer ses favoris, Modifier son profil, Supprimer son compte

**Prestataire :** Configurer son établissement, Gérer ses services, Définir ses horaires, Confirmer/refuser un RDV, Consulter son dashboard

**Administrateur :** Gérer les utilisateurs, Certifier les prestataires, Consulter les KPIs, Impersonner un utilisateur

#### Maquettes (Figma)

> 📸 **CAPTURE D'ÉCRAN 26**
> *Insérer ici : capture de la maquette Figma de la page d'accueil*

> 📸 **CAPTURE D'ÉCRAN 27**
> *Insérer ici : capture de la maquette Figma de la fiche prestataire*

> 📸 **CAPTURE D'ÉCRAN 28**
> *Insérer ici : capture de la maquette Figma du dashboard client*

> 📸 **CAPTURE D'ÉCRAN 29**
> *Insérer ici : capture de la maquette Figma du formulaire de réservation*

> **[À COMPLÉTER — 3 à 5 lignes]**
> Décris ta démarche de conception : comment tu as prototypé les interfaces, les itérations que tu as faites, les retours que tu as intégrés...

### 3.2 Architecture logicielle en couches

#### Vue d'ensemble

L'application suit une architecture **3 couches** clairement séparées :

```
┌─────────────────────────────────────────────────────────┐
│                   COUCHE PRÉSENTATION                   │
│              React 18 SPA (Tailwind CSS)                │
│   Pages ──► Composants ──► fetch() ──► api/api.js      │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP REST (JSON)
                           │ JWT Bearer Token
┌──────────────────────────▼──────────────────────────────┐
│                   COUCHE MÉTIER                         │
│              Node.js / Express API                       │
│   Routes ──► Middlewares ──► Controllers                │
│              (auth, RBAC,    (logique métier,            │
│               rate limit,     validations,               │
│               upload)         appels Prisma)             │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
┌──────────▼──────────┐   ┌───────────▼──────────────────┐
│  COUCHE DONNÉES SQL │   │  COUCHE DONNÉES NoSQL        │
│    MySQL 8          │   │    Redis                     │
│    Prisma ORM       │   │    (cache clé-valeur)        │
│    9 tables         │   │    TTL 5 minutes             │
└─────────────────────┘   └──────────────────────────────┘
```

> 📸 **CAPTURE D'ÉCRAN 30**
> *Insérer ici : un schéma d'architecture que tu auras dessiné (draw.io ou équivalent) reprenant ce diagramme en version visuelle*

#### Organisation du backend

```javascript
// index.js — Configuration Express
app.use(cors());
app.use(express.json());
app.use('/api', apiLimiter);         // Rate limiting global

// Routes
app.use('/api/auth', authRoutes);          // Authentification
app.use('/api/shop', shopRoutes);          // Prestataires
app.use('/api/appointments', apptRoutes);  // Réservations
app.use('/api/user', userRoutes);          // Profil utilisateur
app.use('/api/reviews', reviewRoutes);     // Avis
app.use('/api/admin', adminRoutes);        // Administration
app.use('/api/favorites', favRoutes);      // Favoris
```

#### Middlewares

| Middleware | Rôle | Déclenchement |
|---|---|---|
| `auth.js` | Vérifie le JWT, peuple `req.auth`, vérifie le ban | Routes protégées |
| `roleGuard.js` | Vérifie le rôle (`user`, `pro`, `admin`) | Routes avec RBAC |
| `rateLimiter.js` | 10 req/15min (auth), 120 req/min (API) | Toutes les routes |
| `upload.js` | Multer + Cloudinary pour les images | Routes d'upload |

### 3.3 Base de données relationnelle

#### Modèle Logique de Données (MLD)

Le schéma complet est disponible dans `docs/MCD-MLD.md` et rendu visuellement sur GitHub.

> 📸 **CAPTURE D'ÉCRAN 31**
> *Insérer ici : l'export PNG du diagramme MCD/MLD depuis mermaid.live ou dbdiagram.io*

#### Tables et relations

La base de données contient **9 tables** :

```
users ─────────────── providers (1 user → 0 ou 1 provider)
providers ─────────── categories (N providers → 1 category)
providers ─────────── business_hours (1 provider → 7 horaires)
providers ─────────── services (1 provider → N services)
users ──────────────── appointments (1 user → N appointments)
providers ─────────── appointments (1 provider → N appointments)
services ─────────── appointments (1 service → N appointments)
appointments ──────── reviews (1 appointment → 0 ou 1 review)
reviews ────────────── review_likes (1 review → N likes)
users ──────────────── favorites (1 user → N favorites)
```

#### Contraintes d'intégrité

```sql
-- Contraintes UNIQUE critiques
UNIQUE (users.email)                        -- Un email = un compte
UNIQUE (providers.user_id)                  -- Un user = un seul pro
UNIQUE (reviews.appointment_id)             -- Un RDV = un seul avis
UNIQUE (review_likes.review_id, user_id)    -- Un like par user par avis
UNIQUE (favorites.user_id, provider_id)     -- Pas de doublon favoris
```

#### Schéma Prisma — Exemple

```prisma
model Appointment {
  id               Int               @id @default(autoincrement())
  client_id        Int
  provider_id      Int
  service_id       Int
  appointment_date DateTime
  status           AppointmentStatus @default(pending)
  refusal_reason   String?           @db.Text
  is_read          Boolean           @default(true)
  created_at       DateTime          @default(now())

  client   User     @relation("ClientAppointments", fields: [client_id], references: [id], onDelete: Cascade)
  provider Provider @relation(fields: [provider_id], references: [id], onDelete: Cascade)
  service  Service  @relation(fields: [service_id], references: [id], onDelete: Cascade)
  review   Review?

  @@map("appointments")
}

enum AppointmentStatus {
  pending
  confirmed
  cancelled
  cancelled_by_pro
  completed
}
```

> 📸 **CAPTURE D'ÉCRAN 32**
> *Insérer ici : screenshot de MySQL Workbench ou de Prisma Studio montrant la structure des tables*

### 3.4 Composants d'accès aux données SQL

#### Requêtes simples via Prisma

```javascript
// Création d'un utilisateur
const user = await prisma.user.create({
  data: { email, password: hashedPassword, role: finalRole }
});

// Recherche par clé unique
const existing = await prisma.user.findUnique({ where: { email } });

// Mise à jour d'un statut
await prisma.appointment.update({
  where: { id },
  data: { status: 'cancelled' }
});
```

#### Requêtes complexes avec jointures ($queryRaw)

Certaines requêtes nécessitent des jointures et agrégations que Prisma ORM ne gère pas nativement. Le projet utilise `$queryRaw` pour ces cas :

```javascript
// Récupération des prestataires avec avg_rating, horaires du jour, distance
const providers = await prisma.$queryRaw`
  SELECT
    p.id, p.name, p.city, p.image_url, p.latitude, p.longitude,
    p.is_certified, p.is_visible,
    c.name AS category_name,
    AVG(r.rating)        AS avg_rating,
    COUNT(DISTINCT r.id) AS review_count,
    bh.is_closed,
    TIME_FORMAT(bh.open_time,  '%H:%i') AS open_str,
    TIME_FORMAT(bh.close_time, '%H:%i') AS close_str,
    p.created_at
  FROM providers p
  LEFT JOIN categories    c  ON c.id  = p.category_id
  LEFT JOIN reviews       r  ON r.provider_id = p.id
  LEFT JOIN business_hours bh ON bh.provider_id = p.id
    AND bh.day_of_week = ${today}
  WHERE p.is_visible = true
  GROUP BY p.id, bh.is_closed, bh.open_time, bh.close_time
`;
```

**Sérialisation des BigInt :** MySQL retourne des `BigInt` pour les `COUNT()` et `INT` via `$queryRaw`. JSON.stringify ne supporte pas nativement les BigInt — une conversion est nécessaire :

```javascript
// index.js — Fix global BigInt → Number
BigInt.prototype.toJSON = function() { return Number(this); };
```

### 3.5 Composants d'accès aux données NoSQL (Redis)

#### Pourquoi Redis ?

> **[À COMPLÉTER — 4 à 6 lignes]**
> Explique le choix de Redis : base NoSQL clé-valeur en mémoire, ultra-rapide (< 1ms), idéale pour le cache. La requête `/api/shop/all` est la plus appelée de l'application (chaque chargement de la page d'accueil). Sans cache, elle exécute une jointure sur 5 tables pour potentiellement des milliers de prestataires.

#### Architecture du cache

```
Client (navigateur)
    │
    ▼ GET /api/shop/all
Express Controller
    │
    ├── Redis.get('providers:all')
    │       │
    │       ├── HIT  → retourne JSON immédiatement (~1ms)
    │       │
    │       └── MISS → requête MySQL (~50-200ms)
    │                       │
    │                       └── Redis.setEx('providers:all', 300, data)
    │                               └── retourne JSON
    ▼
Réponse client
```

#### Implémentation

```javascript
// redis.js — Client singleton
const { createClient } = require('redis');

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.error('Redis error:', err));
client.connect();

module.exports = client;
```

```javascript
// shopController.js — Cache avec TTL 5 minutes
const redis = require('../redis');
const CACHE_KEY = 'providers:all';
const CACHE_TTL = 300; // 5 minutes

const getAllProviders = async (req, res) => {
  try {
    // Tentative de lecture en cache
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Cache miss : requête MySQL
    const providers = await prisma.$queryRaw`...`;
    const result = safeJson(providers);

    // Mise en cache pour 5 minutes
    await redis.setEx(CACHE_KEY, CACHE_TTL, JSON.stringify(result));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

```javascript
// Invalidation du cache lors d'une mise à jour prestataire
const setupShop = async (req, res) => {
  // ... logique de mise à jour ...
  await redis.del('providers:all'); // Invalide le cache
  res.json({ message: 'Profil mis à jour' });
};
```

#### Redis dans docker-compose

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  backend:
    environment:
      REDIS_URL: redis://redis:6379
    depends_on:
      - redis
      - db
```

> 📸 **CAPTURE D'ÉCRAN 33**
> *Insérer ici : screenshot de Redis Insight ou redis-cli montrant la clé "providers:all" en cache*

---

## 4. BC03 — Préparer le déploiement d'une application sécurisée

### 4.1 Plan de tests

#### Stratégie de tests

L'application est couverte par deux niveaux de tests :
1. **Tests unitaires automatisés** (Jest) — exécutés à chaque push via GitHub Actions
2. **Tests manuels** — scénarios fonctionnels vérifiés avant chaque mise en production

#### Tests unitaires Backend — Jest + Supertest

**Fichier `auth.middleware.test.js` :**

| # | Scénario | Résultat attendu |
|---|---|---|
| 1 | Requête sans token | 401 Unauthorized |
| 2 | Token invalide/expiré | 401 Unauthorized |
| 3 | Token valide | `next()` appelé + `req.auth` peuplé |

**Fichier `roleGuard.middleware.test.js` :**

| # | Scénario | Résultat attendu |
|---|---|---|
| 1 | `req.auth` absent | 403 Forbidden |
| 2 | Rôle `user` sur route `pro` | 403 Forbidden |
| 3 | Rôle `pro` autorisé | `next()` appelé |
| 4 | Rôle `admin` dans liste multi-rôles | `next()` appelé |

**Fichier `auth.routes.test.js` :**

| # | Scénario | Résultat attendu |
|---|---|---|
| 1 | Register — email déjà utilisé | 400 "Email déjà utilisé" |
| 2 | Register — nouvel utilisateur | 201 + token JWT |
| 3 | Register — tentative rôle admin | 201 + rôle forcé à `user` |
| 4 | Login — email inconnu | 401 "Identifiants invalides" |
| 5 | Login — mot de passe correct | 200 + token JWT |

**Fichier `appointments.routes.test.js` :**

| # | Scénario | Résultat attendu |
|---|---|---|
| 1 | Sans token | 401 Unauthorized |
| 2 | Champs manquants | 400 "Champs obligatoires" |
| 3 | Date dans le passé | 400 "Date dans le passé" |
| 4 | Prestataire fermé | 400 "Fermé ce jour" |
| 5 | Réservation valide | 201 + `appointmentId` |
| 6 | Conflit de créneau | 409 "Créneau chevauche" |
| 7 | Disponibilités — jour fermé | 200 `{ closed: true, slots: [] }` |

**Résultats :**
```
Test Suites: 4 passed, 4 total
Tests:       21 passed, 21 total
Time:        2.46s
```

> 📸 **CAPTURE D'ÉCRAN 34**
> *Insérer ici : screenshot du terminal montrant le résultat de `npm test` avec les 21 tests verts*

#### Tests unitaires Frontend — Jest + Testing Library

**Fichier `ProviderCard.test.jsx` :**

| # | Scénario | Résultat attendu |
|---|---|---|
| 1 | Affichage nom et métier | Textes présents dans le DOM |
| 2 | Badge "Fermé" si `todayIsClosed=true` | Badge rouge "Fermé" visible |
| 3 | Affichage note et nombre d'avis | "4.5" et "(32)" visibles |
| 4 | Affichage distance | "1,2 km" visible |
| 5 | Badge "Nouveau" si créé aujourd'hui | Badge bleu "Nouveau" visible |
| 6 | Pas de badge "Nouveau" si ancien | Badge absent du DOM |
| 7 | Click sur la carte | `onClick` appelé 1 fois |

**Résultats :**
```
Test Suites: 3 passed, 3 total
Tests:       17 passed, 17 total
Time:        2.37s
```

> 📸 **CAPTURE D'ÉCRAN 35**
> *Insérer ici : screenshot du terminal montrant le résultat de `npm test` frontend avec les 17 tests verts*

#### Tests manuels — Scénarios fonctionnels

> **[À COMPLÉTER — ajouter tes propres tests manuels effectués]**

| # | Fonctionnalité | Scénario testé | Résultat obtenu | Statut |
|---|---|---|---|---|
| 1 | Inscription | Email déjà existant | Message "Email déjà utilisé" | ✅ |
| 2 | Inscription | Mot de passe < 8 car. | Validation bloquante | ✅ |
| 3 | Connexion Google | Premier accès | Compte créé automatiquement | ✅ |
| 4 | Réservation | Créneau disponible | RDV créé, statut "En attente" | ✅ |
| 5 | Réservation | Créneau déjà pris | Erreur 409 affichée | ✅ |
| 6 | Annulation | RDV futur | Statut passe à "Annulé" | ✅ |
| 7 | Avis | Après RDV terminé | Formulaire disponible 1 seule fois | ✅ |
| 8 | Admin — Ban | Ban d'un utilisateur | Token invalide à la prochaine requête | ✅ |
| 9 | Admin — Impersonation | Connexion en tant que client | Token 30 min valide | ✅ |
| 10 | > **[À COMPLÉTER]** | | | |

### 4.2 Documentation de déploiement

#### Architecture de production

```
                    ┌─────────────┐
                    │   GitHub    │
                    │  (develop)  │
                    └──────┬──────┘
                           │ git push
              ┌────────────┴────────────┐
              │                         │
    ┌─────────▼──────────┐   ┌──────────▼──────────┐
    │   GitHub Actions   │   │   GitHub Actions    │
    │   test-backend     │   │   build-frontend    │
    │   (21 tests Jest)  │   │   (17 tests + build)│
    └─────────┬──────────┘   └──────────┬──────────┘
              │                         │
    ┌─────────▼──────────┐   ┌──────────▼──────────┐
    │     Railway        │   │      Vercel         │
    │  (auto-deploy API) │   │  (auto-deploy SPA)  │
    │  Node.js + MySQL   │   │  React + nginx      │
    │  HTTPS auto        │   │  CDN mondial        │
    └────────────────────┘   └─────────────────────┘
```

#### Configuration Railway (backend)

```toml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node index.js"
healthcheckPath = "/api/health"
```

```toml
# nixpacks.toml
[phases.build]
cmds = ["npm install", "npx prisma generate"]
```

> 📸 **CAPTURE D'ÉCRAN 36**
> *Insérer ici : screenshot de Railway montrant les variables d'environnement configurées (sans les valeurs)*

#### Configuration Vercel (frontend)

```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

> 📸 **CAPTURE D'ÉCRAN 37**
> *Insérer ici : screenshot de Vercel montrant les déploiements avec statut "Ready" et les URLs de production*

#### Variables d'environnement

Toutes les valeurs sensibles sont externalisées dans des variables d'environnement, jamais stockées dans le code :

```env
# backend/.env.example — Template (fichier non confidentiel)
DATABASE_URL=mysql://root:PASSWORD@localhost:3306/ordv_db
JWT_SECRET=ta_phrase_secrete_ici
PORT=5000
FRONTEND_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=ton_cloud_name
CLOUDINARY_API_KEY=ta_api_key
CLOUDINARY_API_SECRET=ton_api_secret
GOOGLE_CLIENT_ID=ton_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=ton_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### 4.3 Pipeline CI/CD

#### Fichier de configuration GitHub Actions

```yaml
# .github/workflows/main.yml
name: CI/CD O'RDV Pipeline

on:
  push:
    branches: [ main, develop ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '18' }
      - run: cd backend && npm install
      - run: cd backend && npm test

  build-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '18' }
      - run: cd frontend && npm install --legacy-peer-deps
      - run: cd frontend && npm test
        env: { CI: false }
      - run: cd frontend && npm run build
        env: { CI: false }
```

> 📸 **CAPTURE D'ÉCRAN 38**
> *Insérer ici : screenshot de GitHub Actions montrant les pipelines verts (tous les jobs passés)*

> 📸 **CAPTURE D'ÉCRAN 39**
> *Insérer ici : screenshot d'un run GitHub Actions en détail avec les étapes déroulées*

#### Bénéfices du CI/CD

- **Détection immédiate des régressions** : si un commit casse un test, le pipeline échoue avant déploiement
- **Build vérifié** : le frontend est buildé à chaque push, garantissant qu'il compile
- **Traçabilité** : chaque déploiement est associé à un commit précis
- **Automatisation** : zéro intervention manuelle pour déployer en production

### 4.4 Conteneurisation Docker

#### Objectif

Docker permet de lancer l'intégralité du projet (backend + frontend + base de données) en une seule commande, sans dépendances locales à installer (pas de MySQL, pas de configuration réseau).

#### Dockerfile Backend

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copie schema Prisma avant npm install (postinstall = prisma generate)
COPY package*.json ./
COPY prisma/ ./prisma/
RUN npm install --omit=dev

COPY . .

EXPOSE 5000
CMD ["node", "index.js"]
```

**Optimisations :**
- `node:18-alpine` : image ~50 Mo au lieu de ~1 Go pour `node:18`
- `--omit=dev` : exclut les devDependencies (Jest, nodemon) du build final
- Copie du dossier `prisma/` avant `npm install` pour que `postinstall` (prisma generate) trouve le schéma

#### Dockerfile Frontend (Multi-stage)

```dockerfile
# Stage 1 : build React
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2 : serveur nginx (image finale ~25 Mo)
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Configuration nginx pour React Router :**

```nginx
server {
  listen 80;
  location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri $uri/ /index.html;  # SPA routing
  }
}
```

#### Docker Compose

```yaml
version: '3.8'
services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-root}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-ordv_db}
    ports: ["3307:3306"]
    volumes: [mysql_data:/var/lib/mysql]
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      retries: 10

  backend:
    build: ./backend
    ports: ["5000:5000"]
    environment:
      DATABASE_URL: mysql://root:${MYSQL_ROOT_PASSWORD:-root}@db:3306/${MYSQL_DATABASE:-ordv_db}
      JWT_SECRET: ${JWT_SECRET:-dev_secret}
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build: ./frontend
    ports: ["3000:80"]
    depends_on: [backend]
```

> 📸 **CAPTURE D'ÉCRAN 40**
> *Insérer ici : screenshot du terminal montrant `docker-compose up --build` avec les 3 services démarrés*

---

## 5. Sécurisation — Fil rouge

La sécurité est une préoccupation constante dans le projet O'RDV, intégrée à chaque couche de l'application conformément aux recommandations **OWASP Top 10** et **ANSSI**.

### 5.1 Authentification et gestion des tokens

```javascript
// JWT signé avec clé secrète, expiration 24h
const token = jwt.sign(
  { id: user.id, role: user.role },
  process.env.JWT_SECRET,   // Jamais en dur dans le code
  { expiresIn: '24h' }
);
```

- Token stocké côté client dans `localStorage`
- Vérifié à chaque requête protégée par le middleware `auth.js`
- Expiration courte (24h) pour limiter la fenêtre d'exposition

### 5.2 Hashage des mots de passe

```javascript
// bcrypt avec salt factor 10
const hashedPassword = await bcrypt.hash(password, 10);

// Vérification sans exposition du hash
const match = await bcrypt.compare(plainPassword, hashedPassword);
```

Les mots de passe ne sont **jamais** stockés en clair. bcrypt intègre un sel aléatoire, rendant les attaques par rainbow tables inefficaces.

### 5.3 Contrôle d'accès basé sur les rôles (RBAC)

```javascript
// Exemples d'utilisation du roleGuard
router.get('/admin/users', auth, checkRole(['admin']), getUsers);
router.post('/shop/setup', auth, checkRole(['pro','admin']), setupShop);
router.get('/user/me',     auth, getMe);  // Accessible à tous les rôles
```

| Rôle | Accès |
|---|---|
| `user` | Réservation, profil, favoris, avis |
| `pro` | Tout user + gestion établissement et RDV |
| `admin` | Tout pro + gestion plateforme, impersonation |

### 5.4 Protection contre le brute-force

```javascript
// rateLimiter.js — 10 tentatives max sur 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,  // Compte uniquement les échecs
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' }
});
```

### 5.5 Protection contre les injections SQL

Toutes les requêtes utilisent soit l'ORM Prisma (requêtes paramétrées automatiques), soit des template literals avec paramètres liés (`$queryRaw` avec variables) :

```javascript
// Sûr — paramètre lié
const user = await prisma.user.findUnique({ where: { email } });

// Sûr — $queryRaw avec template literal (paramètres liés)
const providers = await prisma.$queryRaw`
  SELECT * FROM providers WHERE city = ${city}
`;
// JAMAIS : `SELECT * FROM providers WHERE city = '${city}'`
```

### 5.6 Gestion des comptes bannis

```javascript
// auth.js — Vérification à chaque requête
const user = await prisma.user.findUnique({
  where: { id: decoded.id },
  select: { is_banned: true, ban_reason: true },
});
if (user?.is_banned)
  return res.status(403).json({ error: "Compte suspendu.", banned: true });
```

Un compte banni est immédiatement bloqué sans attendre l'expiration du token.

### 5.7 Sécurité des secrets

| Pratique | Implémentation |
|---|---|
| Variables d'environnement | `.env` gitignore, `.env.example` documenté |
| HTTPS en production | Automatique via Railway et Vercel |
| Credentials Docker | Variables d'env avec fallback (`${VAR:-default}`) |
| Clés Cloudinary | Jamais dans le code source |
| Clés Google OAuth | Variables d'environnement backend uniquement |

### 5.8 Conformité RGPD

```javascript
// userController.js — Suppression définitive du compte
const deleteAccount = async (req, res) => {
  await prisma.user.delete({ where: { id: req.auth.userId } });
  // Cascade Prisma supprime providers, appointments, reviews, likes, favorites
  res.json({ message: "Compte supprimé définitivement." });
};
```

- **Droit à l'effacement** : suppression complète en cascade (toutes les données liées)
- **Politique de confidentialité** : page dédiée accessible depuis le footer
- **Mentions légales** : page dédiée conforme aux obligations légales

> 📸 **CAPTURE D'ÉCRAN 41**
> *Insérer ici : screenshot de la page "Politique de confidentialité" de l'application*

> 📸 **CAPTURE D'ÉCRAN 42**
> *Insérer ici : screenshot de la section "Zone de danger" dans le dashboard avec le bouton de suppression de compte*

---

## 6. Difficultés rencontrées et solutions apportées

> **[SECTION TRÈS IMPORTANTE — Le jury creuse sur les difficultés. Montre que tu sais résoudre des problèmes.]**
> Développe 5 à 6 difficultés concrètes que tu as réellement rencontrées.

### Difficulté 1 : Sérialisation des BigInt MySQL avec Prisma

**Problème :** Lors de l'utilisation de `$queryRaw` avec des fonctions d'agrégation MySQL (`COUNT`, `SUM`), Prisma retourne des valeurs de type `BigInt` JavaScript. Or, `JSON.stringify()` ne supporte pas nativement le `BigInt` et lève une exception : `TypeError: Do not know how to serialize a BigInt`.

**Cause :** MySQL retourne les résultats de `COUNT()` et certains entiers en `BigInt` pour éviter les dépassements de capacité. Prisma respecte ce type natif sans conversion automatique.

**Solution :**

```javascript
// index.js — Fix global appliqué au démarrage
BigInt.prototype.toJSON = function() { return Number(this); };
```

Cette ligne surcharge la méthode `toJSON` du prototype `BigInt`, permettant à `JSON.stringify` de convertir automatiquement les `BigInt` en `Number`.

**Apprentissage :** > **[À COMPLÉTER — ce que ça t'a appris sur les types JS, les prototypes...]**

---

### Difficulté 2 : Gestion des conflits de créneaux

**Problème :** > **[À COMPLÉTER — décris le problème de détection des overlaps de RDV]**

**Cause :** > **[À COMPLÉTER]**

**Solution :** > **[À COMPLÉTER — explique la logique de comparaison des intervalles de temps]**

**Apprentissage :** > **[À COMPLÉTER]**

---

### Difficulté 3 : Tests Jest cassés après renforcement de la validation

**Problème :** Après avoir renforcé la validation des mots de passe (8 caractères + majuscule + chiffre), plusieurs tests dans `auth.routes.test.js` ont commencé à échouer. Les tests utilisaient des mots de passe courts comme `'pass123'` ou `'pass'` qui ne passaient plus la validation.

**Cause identifiée :** Deux problèmes distincts :
1. Les mots de passe des fixtures de test ne respectaient plus les nouvelles règles
2. `jest.clearAllMocks()` ne vide pas la queue `mockResolvedValueOnce` — les mocks non consommés s'accumulaient entre les tests, corrompant les appels suivants

**Solution :**
```javascript
// Avant
beforeEach(() => { jest.clearAllMocks(); });
// Après
beforeEach(() => { jest.resetAllMocks(); }); // Vide aussi les queues de mock

// Mots de passe corrigés
.send({ password: 'Password1' }) // 8 car + majuscule + chiffre
```

**Apprentissage :** > **[À COMPLÉTER — ce que tu as appris sur Jest clearAllMocks vs resetAllMocks]**

---

### Difficulté 4 : Isolation des sessions dans la vue multi-iframes

**Problème :** > **[À COMPLÉTER — comment les iframes partageaient le même localStorage, causant des conflits de tokens]**

**Cause :** > **[À COMPLÉTER]**

**Solution :** > **[À COMPLÉTER — explique Object.defineProperty pour isoler le localStorage par iframe]**

**Apprentissage :** > **[À COMPLÉTER]**

---

### Difficulté 5 : > **[À COMPLÉTER — ta 5ème difficulté]**

**Problème :** > **[À COMPLÉTER]**

**Cause :** > **[À COMPLÉTER]**

**Solution :** > **[À COMPLÉTER]**

**Apprentissage :** > **[À COMPLÉTER]**

---

## 7. Bilan et perspectives

### 7.1 Compétences acquises

> **[À COMPLÉTER — 10 à 15 lignes personnelles et sincères]**
> Qu'est-ce que ce projet t'a réellement appris ? Quelles compétences as-tu développées ou renforcées ?

*Pistes :*
- *Architecture full-stack (découpage front/back, API REST)*
- *Gestion de l'authentification (JWT, OAuth)*
- *Modélisation de base de données relationnelle*
- *Déploiement en production (Railway, Vercel, CI/CD)*
- *Tests unitaires et leur importance dans un projet*
- *Gestion de projet agile avec Trello*

### 7.2 Ce que je ferais différemment

> **[À COMPLÉTER — 4 à 5 points concrets]**

*Pistes :*
- *Commencer les tests dès le début du projet (TDD)*
- *Utiliser TypeScript pour un meilleur typage*
- *Modéliser la BDD plus soigneusement avant de commencer le code*
- *Mettre en place Docker dès le départ*
- *Documenter l'API avec Swagger dès la création des routes*

### 7.3 Perspectives d'évolution

Fonctionnalités envisagées pour une V2 :

| Fonctionnalité | Intérêt |
|---|---|
| Notifications temps réel (WebSocket) | Alertes instantanées pour les nouveaux RDV |
| Paiement en ligne (Stripe) | Monétisation et sécurisation des réservations |
| Application mobile (React Native) | Toucher les utilisateurs mobiles |
| Messagerie intégrée | Communication client-prestataire sans quitter l'app |
| Analyses avancées (BI) | Tableau de bord analytique pour les pros |

### 7.4 Récapitulatif des blocs de compétences couverts

| Bloc | Compétence | Couvert |
|---|---|---|
| BC01 | Configurer l'environnement de travail | ✅ Git, VS Code, Docker |
| BC01 | Développer des interfaces utilisateur | ✅ React, Tailwind, responsive |
| BC01 | Développer des composants métier | ✅ Auth, réservation, RBAC, favoris |
| BC01 | Contribuer à la gestion de projet | ✅ Trello Kanban, user stories |
| BC02 | Analyser les besoins et maquetter | ✅ Figma, use cases UML |
| BC02 | Définir l'architecture logicielle | ✅ Architecture 3 couches, MVC |
| BC02 | Concevoir une BDD relationnelle | ✅ MySQL, 9 tables, MLD Mermaid |
| BC02 | Composants d'accès données SQL | ✅ Prisma ORM, $queryRaw |
| BC02 | Composants d'accès données NoSQL | ✅ Redis (cache prestataires) |
| BC03 | Préparer et exécuter les tests | ✅ Jest, 38 tests automatisés |
| BC03 | Documenter le déploiement | ✅ README, DEPLOYMENT.md, .env.example |
| BC03 | Mise en production DevOps | ✅ CI/CD GitHub Actions, Docker, Railway/Vercel |

### 7.5 Liens du projet

| Ressource | Lien |
|---|---|
| Application en ligne | https://o-rdv.vercel.app |
| Code source | https://github.com/bsandoz79/O-RDV |
| API backend | https://o-rdv-production.up.railway.app |
| MCD/MLD | docs/MCD-MLD.md |
| Pipeline CI/CD | https://github.com/bsandoz79/O-RDV/actions |

---

*Document rédigé dans le cadre du Titre Professionnel Concepteur Développeur d'Applications*
*RNCP37873 — Niveau 6 — Ecole IT — 2025*

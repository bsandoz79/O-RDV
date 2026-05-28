# Déploiement Staging — O'RDV

## Architecture de staging

| Service | Plateforme | URL |
|---------|-----------|-----|
| Backend (API Express) | Railway | `https://o-rdv-production.up.railway.app` |
| Base de données MySQL | Railway | Interne : `mysql.railway.internal:3306` |
| Frontend (React SPA) | Vercel | *(URL Vercel générée)* |

---

## 1. Base de données — Railway MySQL

### Création du service
1. Railway → **New Service → Database → MySQL**
2. Railway génère automatiquement les variables de connexion

### Variables exposées (onglet Variables du service MySQL)
- `MYSQLHOST` / `MYSQL_ROOT_PASSWORD` / `MYSQLDATABASE` / `MYSQLPORT` / `MYSQLUSER`
- Accès externe (TCP Proxy) : `maglev.proxy.rlwy.net:21763`
- Accès interne (entre services Railway) : `mysql.railway.internal:3306`

### Initialisation du schéma
Le schéma est **initialisé automatiquement** au démarrage du backend via `backend/migrate.js`.
Les tables créées : `users`, `categories`, `providers`, `business_hours`, `services`, `appointments`.
Les 6 catégories de base sont insérées automatiquement (`INSERT IGNORE`).

---

## 2. Backend — Railway (service O-RDV)

### Connexion au repo
Railway → **New Service → GitHub Repo → O-RDV** (branche `develop`)

### Fichier de configuration
`railway.toml` à la racine du repo :
```toml
[build]
buildCommand = "cd backend && npm install"

[deploy]
startCommand = "cd backend && node index.js"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 5
```

### Variables d'environnement (O-RDV → Variables)
| Clé | Valeur |
|-----|--------|
| `DB_HOST` | `${{MySQL.MYSQLHOST}}` ou `mysql.railway.internal` |
| `DB_USER` | `root` |
| `DB_PASSWORD` | `${{MySQL.MYSQL_ROOT_PASSWORD}}` |
| `DB_NAME` | `railway` |
| `JWT_SECRET` | *(phrase secrète longue)* |
| `PORT` | `5000` |

### Domaine public
Railway → O-RDV → Settings → Networking → **Generate Domain**
→ `https://o-rdv-production.up.railway.app`

### Vérification
```
GET https://o-rdv-production.up.railway.app
→ "Le serveur O'RDV est opérationnel ! 🚀"

GET https://o-rdv-production.up.railway.app/api/shop/categories
→ [{"id":1,"name":"Coiffeur",...}, ...]
```

---

## 3. Frontend — Vercel

### Connexion au repo
Vercel → **Add New Project → Import Git Repository → O-RDV**

### Configuration
- **Root Directory** : `frontend`
- **Framework** : Create React App (auto-détecté)
- **Build Command** : `CI=false npm run build` (défini dans `frontend/vercel.json`)
- **Output Directory** : `build`

### Fichier de configuration
`frontend/vercel.json` :
```json
{
  "buildCommand": "CI=false npm run build",
  "outputDirectory": "build",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Variable d'environnement (Vercel → Project → Settings → Environment Variables)
| Clé | Valeur |
|-----|--------|
| `REACT_APP_API_URL` | `https://o-rdv-production.up.railway.app/api` |

---

## 4. Compte administrateur

Le rôle `admin` ne peut pas être créé via l'inscription normale (sécurité).
Pour créer un admin manuellement, utiliser le script suivant depuis la racine du projet :

```powershell
# PowerShell
$env:DB_PASSWORD = "MONMOTDEPASSE"
node backend/init-db.js
```

Ou via une requête SQL directe sur Railway MySQL :
```sql
INSERT INTO users (email, password, role)
VALUES ('admin@ordv.fr', '<hash_bcrypt>', 'admin');
```

---

## 5. Redéploiement

### Backend (Railway)
- **Automatique** à chaque push sur `develop`
- **Manuel** : Railway → O-RDV → Deployments → ⋮ → Redeploy

### Frontend (Vercel)
- **Automatique** à chaque push sur `develop`
- **Manuel** : Vercel → Project → Deployments → Redeploy

### Base de données
- Les tables sont recréées automatiquement si absentes (`IF NOT EXISTS`)
- Les données existantes ne sont **jamais supprimées** par la migration

---

## 6. CI/CD — GitHub Actions

Pipeline défini dans `.github/workflows/main.yml` :
- **Backend** : `npm install` + `npm run test:coverage` (45 tests Jest)
- **Frontend** : `npm install` + `npm run test:coverage` (36 tests Jest) + `npm run build`
- Les rapports de couverture sont automatiquement uploadés comme **artifacts téléchargeables** (30 jours de rétention)
- Déclenché sur chaque push sur `develop`, `main`, `master`

### Générer le rapport de couverture en local

```bash
# Backend
cd backend && npm run test:coverage
# → Rapport HTML : backend/coverage/lcov-report/index.html

# Frontend
cd frontend && npm run test:coverage
# → Rapport HTML : frontend/coverage/lcov-report/index.html
```

### Récupérer le rapport depuis GitHub Actions
1. GitHub → onglet **Actions** → dernier workflow réussi
2. Section **Artifacts** en bas de page
3. Télécharger `backend-coverage` ou `frontend-coverage` (archive ZIP contenant le rapport HTML)

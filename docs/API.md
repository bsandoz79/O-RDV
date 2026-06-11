# Documentation API — O'RDV

> Base URL : `https://o-rdv-production.up.railway.app/api`  
> Local : `http://localhost:5000/api`

## Authentification

La plupart des routes protégées nécessitent un header :

```
Authorization: Bearer <token_JWT>
```

Le token est retourné lors du login ou de l'inscription. Durée de validité : **24h**.

---

## Légende

| Symbole | Signification |
|---|---|
| 🔓 | Route publique |
| 🔐 | JWT requis |
| 👤 | Rôle `user` requis |
| 🏪 | Rôle `pro` ou `admin` requis |
| 🛡️ | Rôle `admin` uniquement |
| ⚡ | Rate limité (10 req / 15 min) |

---

## 1. Authentification — `/api/auth`

### `POST /api/auth/register` ⚡ 🔓

Crée un nouveau compte utilisateur.

**Body JSON :**
```json
{
  "email": "marie@example.com",
  "password": "MonPass1",
  "role": "user"
}
```

> `role` accepte `"user"` ou `"pro"`. Toute tentative de créer un `admin` est ignorée (forcé à `user`).

**Règles de validation :**
- Email au format valide
- Mot de passe : 8 caractères minimum, 1 majuscule, 1 chiffre

**Réponse `201` :**
```json
{
  "token": "eyJhbGci...",
  "user": { "id": 1, "email": "marie@example.com", "role": "user" }
}
```

**Erreurs :**
| Code | Message |
|---|---|
| `400` | Email déjà utilisé / format invalide / mot de passe trop faible |
| `429` | Trop de tentatives |

---

### `POST /api/auth/login` ⚡ 🔓

Connecte un utilisateur existant.

**Body JSON :**
```json
{
  "email": "marie@example.com",
  "password": "MonPass1"
}
```

**Réponse `200` :**
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": 1,
    "email": "marie@example.com",
    "role": "user",
    "first_name": "Marie",
    "last_name": "Dupont",
    "phone": "0612345678"
  }
}
```

**Erreurs :**
| Code | Message |
|---|---|
| `401` | Identifiants invalides |
| `403` | Compte suspendu |
| `429` | Trop de tentatives |

---

### `GET /api/auth/google` 🔓

Redirige vers la page d'authentification Google OAuth 2.0.

---

### `GET /api/auth/google/callback` 🔓

Callback OAuth Google. Redirige vers le frontend avec le token dans le hash de l'URL (`#_t=TOKEN&_u=USER_JSON`).

---

## 2. Boutiques / Prestataires — `/api/shop`

### `GET /api/shop/categories` 🔓

Retourne toutes les catégories de services disponibles (coiffure, barbershop, nail art, spa…).

**Réponse `200` :**
```json
[
  { "id": 1, "name": "Coiffure", "icon": "✂️" },
  { "id": 2, "name": "Barbershop", "icon": "🪒" }
]
```

---

### `GET /api/shop/all` 🔓

Retourne tous les prestataires visibles. Résultats mis en cache Redis (TTL 5 min).

**Query params :**
| Paramètre | Type | Description |
|---|---|---|
| `category_id` | number | Filtre par catégorie |
| `city` | string | Filtre par ville (recherche partielle) |
| `lat` | number | Latitude GPS du client (pour calcul distance) |
| `lng` | number | Longitude GPS du client (pour calcul distance) |

**Réponse `200` :** tableau de prestataires avec champs :
```json
[
  {
    "id": 1,
    "name": "Salon Karim",
    "description": "...",
    "address": "12 rue de la Paix",
    "city": "Marseille",
    "zip_code": "13001",
    "phone": "0491000000",
    "image_url": "https://res.cloudinary.com/...",
    "latitude": 43.296,
    "longitude": 5.381,
    "is_certified": true,
    "category_name": "Barbershop",
    "category_icon": "🪒",
    "today_is_closed": false,
    "today_open": "09:00",
    "today_close": "19:00",
    "distance_km": 1.4,
    "avg_rating": 4.7,
    "review_count": 23,
    "photos": [{ "id": 1, "photo_url": "...", "is_main": true }]
  }
]
```

---

### `GET /api/shop/profile/:providerId` 🔓

Retourne le profil complet d'un prestataire (services, horaires, photos).

**Params :** `providerId` (number)

**Réponse `200` :**
```json
{
  "id": 1,
  "name": "Salon Karim",
  "description": "...",
  "address": "...",
  "city": "Marseille",
  "phone": "0491000000",
  "image_url": "...",
  "access_info": "Entrée par la cour",
  "payment_info": "CB et espèces acceptés",
  "latitude": 43.296,
  "longitude": 5.381,
  "is_certified": true,
  "is_visible": true,
  "services": [
    { "id": 1, "label": "Coupe homme", "price": 25, "duration": 30, "image_url": "...", "group_name": "Coupes", "group_description": "..." }
  ],
  "hours": [
    { "day_of_week": "monday", "open_time": "09:00", "close_time": "19:00", "is_closed": false }
  ],
  "photos": [
    { "id": 1, "photo_url": "...", "is_main": true }
  ]
}
```

**Erreurs :**
| Code | Message |
|---|---|
| `404` | Prestataire introuvable |

---

### `GET /api/shop/info/:userId` 🔐

Retourne la configuration boutique du professionnel connecté (accès restreint au propriétaire ou admin).

**Params :** `userId` (number)

**Réponse `200` :** même structure que `GET /profile/:providerId`

**Erreurs :**
| Code | Message |
|---|---|
| `403` | Accès non autorisé |
| `404` | Profil non trouvé |

---

### `POST /api/shop/setup` 🔐 🏪

Crée ou met à jour la boutique du professionnel connecté (upsert). Accepte un `multipart/form-data`.

**Form-data :**
| Champ | Type | Description |
|---|---|---|
| `profile` | JSON (string) | Infos de la boutique |
| `hours` | JSON (string) | Horaires par jour |
| `services` | JSON (string) | Liste des prestations |
| `image` | File | Photo principale (optionnelle) |

**Structure `profile` :**
```json
{
  "name": "Salon Karim",
  "description": "...",
  "address": "12 rue de la Paix",
  "zipCode": "13001",
  "city": "Marseille",
  "phone": "0491000000",
  "categoryId": 2,
  "accessInfo": "Entrée par la cour",
  "paymentInfo": "CB et espèces",
  "manualLat": 43.296,
  "manualLng": 5.381
}
```

> Si `manualLat`/`manualLng` sont fournis, ils ont la priorité sur le géocodage automatique Nominatim.

**Structure `hours` :** tableau de 7 jours :
```json
[
  { "day_of_week": "monday", "open": "09:00", "close": "19:00", "closed": false },
  { "day_of_week": "sunday", "closed": true }
]
```

**Structure `services` :**
```json
[
  { "label": "Coupe homme", "price": 25, "duration": 30, "group_name": "Coupes", "group_description": "..." }
]
```

**Réponse `200` :**
```json
{ "message": "Configuration enregistrée avec succès !" }
```

---

### `POST /api/shop/upload-service-image` 🔐 🏪

Upload rapide d'une image pour une prestation (avant que le service soit créé).

**Form-data :** `image` (File)

**Réponse `200` :**
```json
{ "url": "https://res.cloudinary.com/..." }
```

---

### `GET /api/shop/photos/:providerId` 🔓

Retourne toutes les photos de galerie d'un prestataire (triées : photo principale d'abord).

**Réponse `200` :**
```json
[
  { "id": 1, "photo_url": "...", "is_main": true, "display_order": 0 }
]
```

---

### `POST /api/shop/photos` 🔐 🏪

Ajoute une photo à la galerie du prestataire connecté (max 10 photos).

**Form-data :** `photo` (File)

**Réponse `201` :**
```json
{ "id": 2, "photo_url": "...", "is_main": false, "display_order": 1 }
```

**Erreurs :**
| Code | Message |
|---|---|
| `400` | Maximum 10 photos atteint |

---

### `DELETE /api/shop/photos/:photoId` 🔐 🏪

Supprime une photo de la galerie. Si c'était la photo principale, la suivante est automatiquement promue.

**Params :** `photoId` (number)

**Réponse `200` :**
```json
{ "success": true }
```

---

### `PUT /api/shop/photos/:photoId/main` 🔐 🏪

Définit une photo comme photo principale (affichée sur les cartes de la liste).

**Params :** `photoId` (number)

**Réponse `200` :**
```json
{ "success": true }
```

---

## 3. Rendez-vous — `/api/appointments`

### `POST /api/appointments` 🔐 👤

Crée un nouveau rendez-vous. Vérifie les horaires d'ouverture et les conflits.

**Body JSON :**
```json
{
  "provider_id": 1,
  "service_id": 2,
  "appointment_date": "2025-06-15T10:00:00",
  "phone": "0612345678",
  "send_sms_reminder": true
}
```

> `phone` et `send_sms_reminder` sont optionnels (consentement SMS).

**Validations :**
- La date doit être dans le futur
- Le prestataire doit être ouvert ce jour-là
- Le créneau doit être dans les heures d'ouverture
- Pas de chevauchement avec un RDV existant

**Réponse `201` :**
```json
{ "message": "Rendez-vous créé avec succès !", "appointmentId": 42 }
```

**Erreurs :**
| Code | Message |
|---|---|
| `400` | Date passée / prestataire fermé / créneau hors horaires |
| `409` | Créneau déjà pris |

---

### `GET /api/appointments/availability/:providerId/:date` 🔓

Retourne les créneaux disponibles pour un prestataire à une date donnée.

**Params :**
| Paramètre | Type | Description |
|---|---|---|
| `providerId` | number | ID du prestataire |
| `date` | string | Format `YYYY-MM-DD` |

**Query :**
| Paramètre | Type | Description |
|---|---|---|
| `duration` | number | Durée souhaitée en minutes (défaut : 30) |

**Réponse `200` (ouvert) :**
```json
{
  "closed": false,
  "slots": [
    { "time": "09:00", "available": true },
    { "time": "09:30", "available": false },
    { "time": "10:00", "available": true }
  ]
}
```

**Réponse `200` (fermé) :**
```json
{ "closed": true, "slots": [] }
```

---

### `GET /api/appointments/services` 🔓

Retourne tous les services enregistrés en base (toutes boutiques confondues).

**Réponse `200` :** tableau de services.

---

## 4. Utilisateur — `/api/user`

### `GET /api/user/me` 🔐

Retourne les informations du compte connecté. Vérifie aussi si le compte est banni.

**Réponse `200` :**
```json
{
  "id": 1,
  "first_name": "Marie",
  "last_name": "Dupont",
  "email": "marie@example.com",
  "phone": "0612345678",
  "role": "user",
  "profile_picture": "https://res.cloudinary.com/...",
  "created_at": "2025-01-15T10:00:00.000Z"
}
```

---

### `POST /api/user/profile-picture` 🔐

Upload une nouvelle photo de profil (avatar).

**Form-data :** `avatar` (File)

**Réponse `200` :**
```json
{ "profile_picture": "https://res.cloudinary.com/..." }
```

---

### `PUT /api/user/update` 🔐

Met à jour le profil de l'utilisateur connecté.

**Body JSON :**
```json
{
  "first_name": "Marie",
  "last_name": "Dupont",
  "email": "marie@example.com",
  "phone": "0612345678"
}
```

**Réponse `200` :**
```json
{ "message": "Profil mis à jour avec succès." }
```

**Erreurs :**
| Code | Message |
|---|---|
| `400` | Email obligatoire / email déjà utilisé |

---

### `PUT /api/user/change-password` 🔐

Change le mot de passe de l'utilisateur connecté.

**Body JSON :**
```json
{
  "current_password": "AncienPass1",
  "new_password": "NouveauPass2"
}
```

**Règles :** même que l'inscription (8 chars, 1 majuscule, 1 chiffre).

**Réponse `200` :**
```json
{ "message": "Mot de passe modifié avec succès." }
```

**Erreurs :**
| Code | Message |
|---|---|
| `401` | Mot de passe actuel incorrect |
| `400` | Nouveau mot de passe trop faible |

---

### `GET /api/user/appointments` 🔐

Retourne les rendez-vous de l'utilisateur connecté.

- **Rôle `user`** : ses propres RDV en tant que client (avec info prestataire, statut, avis éventuels)
- **Rôle `pro`** : les RDV reçus sur sa boutique (avec info client)

**Query (pro uniquement) :**
| Paramètre | Valeur | Description |
|---|---|---|
| `week` | `1` | Filtre sur la semaine en cours uniquement |

> Auto-complète les RDV passés non traités (`pending/confirmed` → `completed`) et auto-confirme les RDV dans les 24h.

**Réponse `200` (client) :**
```json
[
  {
    "id": 42,
    "appointment_date": "2025-06-15T10:00:00",
    "status": "confirmed",
    "refusal_reason": null,
    "is_read": true,
    "service_label": "Coupe homme",
    "duration": 30,
    "price": 25,
    "provider_name": "Salon Karim",
    "provider_city": "Marseille",
    "provider_image": "...",
    "has_review": 0,
    "review_rating": null,
    "review_comment": null
  }
]
```

---

### `PATCH /api/user/appointments/:id/refuse` 🔐 🏪

Refuse un rendez-vous (côté pro). Peut libérer le créneau pour un autre client.

**Params :** `id` (number)

**Body JSON :**
```json
{
  "reason": "Absence imprévue",
  "release": true
}
```

> `release: true` libère le créneau (visible à nouveau pour d'autres réservations).

**Réponse `200` :**
```json
{ "message": "Rendez-vous refusé." }
```

**Erreurs :**
| Code | Message |
|---|---|
| `400` | RDV déjà annulé/terminé ou date passée |
| `404` | Rendez-vous introuvable |

---

### `PATCH /api/user/appointments/:id/cancel` 🔐

Annule un rendez-vous (côté client). L'admin peut annuler n'importe quel RDV.

**Params :** `id` (number)

**Réponse `200` :**
```json
{ "message": "Rendez-vous annulé avec succès." }
```

**Erreurs :**
| Code | Message |
|---|---|
| `400` | Déjà annulé / date passée |
| `403` | Pas le propriétaire du RDV |

---

### `GET /api/user/dashboard-stats` 🔐 🏪

Retourne les KPIs du tableau de bord pro.

**Réponse `200` :**
```json
{
  "new_clients": 5,
  "upcoming_7d": 12,
  "ca_previsionnel": 450.00,
  "occupation_rate": 68
}
```

| Champ | Description |
|---|---|
| `new_clients` | Clients dont le 1er RDV est ce mois-ci |
| `upcoming_7d` | RDV à venir dans les 7 prochains jours |
| `ca_previsionnel` | Somme des prix des RDV non annulés du mois |
| `occupation_rate` | % du temps ouvert occupé par des RDV (semaine en cours) |

---

### `PATCH /api/user/appointments/:id/mark-read` 🔐

Marque une notification de RDV comme lue (côté client).

**Params :** `id` (number)

**Réponse `200` :**
```json
{ "message": "Notification marquée comme lue." }
```

---

### `GET /api/user/new-clients` 🔐 🏪

Retourne les 10 derniers nouveaux clients du mois (1er RDV ce mois-ci).

**Réponse `200` :**
```json
[
  {
    "id": 3,
    "first_name": "Thomas",
    "last_name": "Bernard",
    "email": "thomas@example.com",
    "phone": "0612345678",
    "profile_picture": null,
    "first_booking_date": "2025-06-01T09:00:00"
  }
]
```

---

### `DELETE /api/user/account` 🔐

Supprime définitivement le compte connecté (droit à l'effacement RGPD). Annule préalablement tous les RDV futurs.

**Réponse `200` :**
```json
{ "message": "Compte supprimé définitivement." }
```

---

## 5. Avis — `/api/reviews`

### `POST /api/reviews` 🔐 👤

Crée un avis pour un rendez-vous terminé. Un seul avis par rendez-vous.

**Body JSON :**
```json
{
  "appointment_id": 42,
  "rating_accueil": 5,
  "rating_proprete": 4,
  "rating_ambiance": 5,
  "rating_qualite": 5,
  "comment": "Excellent service, je recommande !"
}
```

> La note globale est calculée automatiquement (moyenne des 4 sous-notes). Si les 4 sous-notes ne sont pas fournies, un champ `rating` global (1–5) est accepté à la place.

**Réponse `201` :** objet avis créé.

**Erreurs :**
| Code | Message |
|---|---|
| `400` | RDV pas terminé / avis déjà existant / notes manquantes |
| `403` | Le RDV n'appartient pas au client connecté |
| `404` | Rendez-vous introuvable |

---

### `GET /api/reviews/provider/:providerId` 🔓

Retourne tous les avis d'un prestataire avec les moyennes par sous-catégorie.

**Params :** `providerId` (number)

> Si un token JWT est fourni, le champ `liked_by_me` indique si l'utilisateur a liké chaque avis.

**Réponse `200` :**
```json
{
  "reviews": [
    {
      "id": 1,
      "rating": 4.8,
      "rating_accueil": 5,
      "rating_proprete": 5,
      "rating_ambiance": 4,
      "rating_qualite": 5,
      "comment": "Super !",
      "created_at": "2025-06-01T10:00:00",
      "client": { "first_name": "Marie", "last_name": "D.", "profile_picture": null },
      "like_count": 3,
      "liked_by_me": false
    }
  ],
  "average": 4.8,
  "avg_accueil": 5.0,
  "avg_proprete": 4.5,
  "avg_ambiance": 4.7,
  "avg_qualite": 4.9,
  "count": 12
}
```

---

### `POST /api/reviews/:id/like` 🔐

Toggle like/unlike sur un avis (un seul like par utilisateur par avis).

**Params :** `id` (number) — ID de l'avis

**Réponse `200` :**
```json
{ "liked": true }
```

---

## 6. Favoris — `/api/favorites`

### `GET /api/favorites` 🔐

Retourne la liste des prestataires mis en favoris par l'utilisateur connecté.

**Réponse `200` :**
```json
[
  {
    "id": 1,
    "name": "Salon Karim",
    "image_url": "...",
    "city": "Marseille",
    "is_certified": true,
    "category_name": "Barbershop"
  }
]
```

---

### `POST /api/favorites/:providerId` 🔐

Toggle favori : ajoute si absent, retire si présent.

**Params :** `providerId` (number)

**Réponse `200` :**
```json
{ "favorited": true }
```

---

## 7. Administration — `/api/admin`

> Toutes les routes de cette section nécessitent le rôle `admin`.

### `GET /api/admin/users` 🛡️

Retourne la liste complète des utilisateurs avec compteurs de RDV et d'avis.

**Réponse `200` :**
```json
[
  {
    "id": 1,
    "first_name": "Marie",
    "last_name": "Dupont",
    "email": "marie@example.com",
    "role": "user",
    "is_banned": false,
    "ban_reason": null,
    "created_at": "2025-01-15T10:00:00",
    "_count": { "appointments": 5, "reviews": 2 },
    "provider": null
  }
]
```

---

### `PATCH /api/admin/users/:id/ban` 🛡️

Bascule le statut banni/non-banni d'un utilisateur.

**Params :** `id` (number)

**Body JSON :**
```json
{ "ban_reason": "Comportement inapproprié" }
```

> `ban_reason` requis uniquement lors du bannissement. Ignoré lors du débannissement.

**Réponse `200` :**
```json
{ "id": 1, "is_banned": true, "ban_reason": "Comportement inapproprié" }
```

**Erreurs :**
| Code | Message |
|---|---|
| `400` | Impossible de se bannir soi-même |

---

### `DELETE /api/admin/users/:id` 🛡️

Supprime définitivement un compte utilisateur (et en cascade : boutique, RDV, services, horaires).

**Params :** `id` (number)

**Réponse `200` :**
```json
{ "message": "Compte supprimé." }
```

---

### `GET /api/admin/stats` 🛡️

Retourne les KPIs globaux de la plateforme.

**Réponse `200` :**
```json
{
  "users": 1240,
  "providers": 87,
  "appointments": 4530,
  "reviews": 312,
  "banned": 5,
  "newToday": 12
}
```

---

### `GET /api/admin/providers` 🛡️

Retourne la liste complète des prestataires avec leurs compteurs et infos propriétaire.

**Réponse `200` :**
```json
[
  {
    "id": 1,
    "name": "Salon Karim",
    "city": "Marseille",
    "is_certified": false,
    "is_visible": true,
    "admin_note": null,
    "user": { "id": 2, "email": "karim@example.com", "first_name": "Karim", "last_name": "M." },
    "category": { "name": "Barbershop" },
    "_count": { "services": 5, "appointments": 120, "reviews": 18 }
  }
]
```

---

### `PATCH /api/admin/providers/:id` 🛡️

Met à jour les paramètres admin d'un prestataire (certification, visibilité, note interne).

**Params :** `id` (number)

**Body JSON :** (tous les champs sont optionnels)
```json
{
  "is_certified": true,
  "is_visible": false,
  "admin_note": "En attente de documents justificatifs"
}
```

**Réponse `200` :**
```json
{
  "id": 1,
  "name": "Salon Karim",
  "is_certified": true,
  "is_visible": false,
  "admin_note": "En attente de documents justificatifs"
}
```

---

### `GET /api/admin/users/:id/appointments` 🛡️

Retourne les 20 derniers rendez-vous d'un utilisateur (vue admin).

**Params :** `id` (number) — ID de l'utilisateur

**Réponse `200` :** tableau de RDV avec détails service et prestataire.

---

### `GET /api/admin/providers/:id/appointments` 🛡️

Retourne les 20 derniers rendez-vous d'un prestataire (vue admin).

**Params :** `id` (number) — ID du prestataire

**Réponse `200` :** tableau de RDV avec détails service et client.

---

### `POST /api/admin/impersonate/:userId` 🛡️

Génère un token JWT de 30 minutes pour se connecter en tant qu'un autre utilisateur (outil de support/debug).

**Params :** `userId` (number)

**Réponse `200` :**
```json
{
  "token": "eyJhbGci...",
  "user": { "id": 3, "email": "karim@example.com", "role": "pro" }
}
```

**Erreurs :**
| Code | Message |
|---|---|
| `403` | Impossible d'impersonner un compte suspendu |
| `404` | Utilisateur introuvable |

---

## Statuts des rendez-vous

| Statut | Description |
|---|---|
| `pending` | En attente de confirmation du pro |
| `confirmed` | Confirmé (auto-confirmé si RDV dans < 24h) |
| `cancelled` | Annulé par le client |
| `cancelled_by_pro` | Refusé par le prestataire |
| `completed` | Terminé (auto-complété après l'heure de fin) |

---

## Codes d'erreur communs

| Code HTTP | Signification |
|---|---|
| `400` | Données invalides ou manquantes |
| `401` | Non authentifié (token manquant ou expiré) |
| `403` | Accès interdit (rôle insuffisant ou compte banni) |
| `404` | Ressource introuvable |
| `409` | Conflit (ex. créneau déjà réservé) |
| `429` | Trop de requêtes (rate limiter) |
| `500` | Erreur serveur interne |

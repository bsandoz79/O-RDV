# Diagrammes UML — O'RDV

## 1. Diagramme de cas d'utilisation

### Acteurs

| Acteur | Rôle |
|--------|------|
| **Client** | Visiteur authentifié qui recherche et réserve des prestations |
| **Prestataire** | Professionnel qui gère son shop et ses rendez-vous |
| **Administrateur** | Modère la plateforme, gère les utilisateurs |
| **Système** | Déclenche des actions automatiques (completion RDV, sessions) |

### Cas d'utilisation par acteur

#### Client
- S'inscrire / Se connecter (email ou Google OAuth)
- Rechercher des prestataires (par nom, ville, catégorie)
- Filtrer et trier les résultats (distance, note, "ouvert maintenant")
- Consulter le profil d'un prestataire
- Réserver un rendez-vous (service + date + créneau)
- Annuler un rendez-vous
- Laisser un avis (après RDV terminé)
- Liker/unliker un avis
- Gérer ses favoris
- Modifier son profil et son mot de passe
- Supprimer son compte (RGPD)
- Voir l'itinéraire vers un prestataire (carte + navigation)
- Ajouter un RDV à Google Calendar

#### Prestataire (hérite du Client)
- Configurer son shop (nom, description, adresse, horaires, services, images)
- Valider ou refuser un rendez-vous (avec motif)
- Consulter ses statistiques (CA, taux d'occupation, nouveaux clients)
- Consulter les avis reçus
- Définir la position de son shop sur la carte

#### Administrateur (hérite du Prestataire)
- Lister et gérer les utilisateurs (bannir/débannir/supprimer)
- Lister et gérer les prestataires (certifier, rendre visible/invisible, ajouter une note)
- Consulter les KPIs globaux
- Impersonifier n'importe quel utilisateur (30 min)
- Accéder à la vue multi-rôles (3 iframes simultanées)

#### Système
- Marquer automatiquement les RDV comme "terminés" après leur heure de fin
- Déconnecter l'utilisateur après 30 min d'inactivité
- Déconnecter l'utilisateur si son token expire ou s'il est banni

### Diagramme de cas d'utilisation

```mermaid
graph LR
    C["👤 Client"]
    P["💼 Prestataire"]
    A["🛡️ Admin"]
    S["⚙️ Système"]

    subgraph ORDV["Système O'RDV"]
        direction TB
        uc1(["S'inscrire / Se connecter"])
        uc2(["Rechercher des prestataires"])
        uc3(["Filtrer et trier les résultats"])
        uc4(["Consulter un profil prestataire"])
        uc5(["Réserver un rendez-vous"])
        uc6(["Annuler un rendez-vous"])
        uc7(["Laisser un avis / liker"])
        uc8(["Gérer ses favoris"])
        uc9(["Modifier profil / supprimer compte"])
        uc10(["Voir itinéraire — carte + navigation"])
        uc11(["Configurer sa boutique"])
        uc12(["Gérer les rendez-vous entrants"])
        uc13(["Consulter ses statistiques"])
        uc14(["Gérer les utilisateurs — ban/unban/suppr."])
        uc15(["Gérer les prestataires — certif./visibilité"])
        uc16(["Consulter les KPIs globaux"])
        uc17(["Impersonnifier un utilisateur"])
        uc18(["Vue multi-rôles — 3 iframes"])
        uc19(["Compléter les RDV automatiquement"])
        uc20(["Gérer les sessions — inactivité / ban"])
    end

    C --> uc1
    C --> uc2
    C --> uc3
    C --> uc4
    C --> uc5
    C --> uc6
    C --> uc7
    C --> uc8
    C --> uc9
    C --> uc10

    P --> uc1
    P --> uc11
    P --> uc12
    P --> uc13

    A --> uc14
    A --> uc15
    A --> uc16
    A --> uc17
    A --> uc18

    S --> uc19
    S --> uc20
```

---

## 2. Diagramme de classes

```mermaid
classDiagram
    class User {
        +int id
        +String email
        +String password
        +String role
        +String first_name
        +String last_name
        +String phone
        +String profile_picture
        +boolean is_banned
        +String ban_reason
        +DateTime created_at
        +register()
        +login()
        +updateProfile()
        +deleteAccount()
    }

    class Provider {
        +int id
        +int user_id
        +int category_id
        +String name
        +String description
        +String address
        +String zip_code
        +String city
        +String phone
        +String image_url
        +float latitude
        +float longitude
        +boolean is_certified
        +boolean is_visible
        +String admin_note
        +DateTime created_at
        +setupShop()
        +getStats()
    }

    class Category {
        +int id
        +String name
        +String icon
    }

    class Service {
        +int id
        +int provider_id
        +String label
        +Decimal price
        +int duration
        +String image_url
    }

    class BusinessHour {
        +int id
        +int provider_id
        +String day_of_week
        +Time open_time
        +Time close_time
        +boolean is_closed
    }

    class Appointment {
        +int id
        +int client_id
        +int provider_id
        +int service_id
        +DateTime appointment_date
        +String status
        +String refusal_reason
        +boolean is_slot_released
        +boolean is_read
        +DateTime created_at
        +create()
        +cancel()
        +confirm()
        +refuse()
        +complete()
    }

    class Review {
        +int id
        +int client_id
        +int provider_id
        +int appointment_id
        +int rating
        +String comment
        +DateTime created_at
        +create()
    }

    class ReviewLike {
        +int id
        +int review_id
        +int user_id
        +DateTime created_at
    }

    class Favorite {
        +int id
        +int user_id
        +int provider_id
        +DateTime created_at
    }

    User "1" --> "0..1" Provider : possède
    Provider "1" --> "0..*" Service : propose
    Provider "1" --> "7" BusinessHour : définit
    Provider "1" --> "0..*" Appointment : reçoit
    Provider "1" --> "0..*" Review : reçoit
    Category "1" --> "0..*" Provider : catégorise
    User "1" --> "0..*" Appointment : réserve
    User "1" --> "0..*" Review : rédige
    User "1" --> "0..*" Favorite : gère
    User "1" --> "0..*" ReviewLike : aime
    Appointment "1" --> "0..1" Review : génère
    Service "1" --> "0..*" Appointment : concerne
    Review "1" --> "0..*" ReviewLike : reçoit
```

---

## 3. Diagramme de séquence — Réservation d'un rendez-vous

```mermaid
sequenceDiagram
    actor Client
    participant Frontend
    participant API
    participant DB

    Client->>Frontend: Sélectionne un service + date
    Frontend->>API: GET /api/appointments/availability/:providerId/:date
    API->>DB: SELECT appointments WHERE provider_id AND date AND status IN (pending, confirmed)
    DB-->>API: créneaux occupés
    API-->>Frontend: créneaux disponibles
    Frontend-->>Client: affiche les créneaux libres

    Client->>Frontend: Choisit un créneau + confirme
    Frontend->>API: POST /api/appointments { service_id, provider_id, date }
    API->>API: Vérifie JWT (auth middleware)
    API->>DB: SELECT pour vérifier conflits (double réservation)
    DB-->>API: pas de conflit
    API->>DB: SELECT business_hours pour vérifier horaires prestataire
    DB-->>API: prestataire ouvert ce jour-là
    API->>DB: INSERT appointment (status: pending)
    DB-->>API: appointment créé
    API-->>Frontend: 201 { appointment }
    Frontend-->>Client: confirmation + lien Google Calendar
```

---

## 4. Diagramme de séquence — Authentification (email/password)

```mermaid
sequenceDiagram
    actor Utilisateur
    participant Frontend
    participant API
    participant DB

    Utilisateur->>Frontend: Saisit email + mot de passe
    Frontend->>API: POST /api/auth/login { email, password }
    API->>API: Rate limiter (10 req/15min)
    API->>DB: SELECT user WHERE email
    DB-->>API: user row
    API->>API: bcrypt.compare(password, hash)
    alt Mot de passe correct
        API->>API: Vérifie is_banned
        alt Non banni
            API->>API: jwt.sign({ userId, role }, secret, { expiresIn: '24h' })
            API-->>Frontend: 200 { token, user }
            Frontend->>Frontend: localStorage.setItem('token', ...) + localStorage.setItem('user', ...)
            Frontend-->>Utilisateur: Redirige vers dashboard
        else Banni
            API-->>Frontend: 403 { error: 'Compte suspendu' }
            Frontend-->>Utilisateur: Message d'erreur
        end
    else Mot de passe incorrect
        API-->>Frontend: 401 { error: 'Identifiants invalides' }
        Frontend-->>Utilisateur: Message d'erreur
    end
```

---

## 5. Diagramme de séquence — Configuration du shop (prestataire)

```mermaid
sequenceDiagram
    actor Prestataire
    participant Frontend
    participant Cloudinary
    participant API
    participant Nominatim
    participant DB

    Prestataire->>Frontend: Remplit le formulaire shop + upload image
    Frontend->>Cloudinary: Upload image (multipart)
    Cloudinary-->>Frontend: image_url CDN

    Frontend->>API: POST /api/shop/setup (FormData: profile, hours, services, image)
    API->>API: Vérifie JWT + rôle pro
    alt Coordonnées manuelles (pin carte)
        API->>API: utilise manualLat/manualLng directement
    else Pas de coordonnées manuelles
        API->>Nominatim: GET /search?street=...&city=...&country=France
        Nominatim-->>API: { lat, lon }
    end
    API->>DB: UPSERT provider
    API->>DB: DELETE/CREATE services
    API->>DB: DELETE/CREATE business_hours
    DB-->>API: OK
    API-->>Frontend: 200 { message: 'Configuration enregistrée' }
    Frontend-->>Prestataire: Toast succès
```

---

## 6. Diagramme de séquence — Modération admin (bannissement)

```mermaid
sequenceDiagram
    actor Admin
    participant Frontend
    participant API
    participant DB

    Admin->>Frontend: Clique "Bannir" sur un utilisateur
    Frontend-->>Admin: Modal de confirmation + saisie raison
    Admin->>Frontend: Confirme avec raison
    Frontend->>API: PUT /api/admin/users/:id/ban { ban_reason }
    API->>API: Vérifie JWT + rôle admin
    API->>DB: UPDATE users SET is_banned=true, ban_reason=...
    DB-->>API: OK
    API-->>Frontend: 200 { user }
    Frontend-->>Admin: Utilisateur marqué banni

    Note over DB,API: Prochain appel /api/user/me par cet utilisateur
    API->>DB: SELECT user WHERE id
    DB-->>API: { is_banned: true }
    API-->>Frontend: 403 { error: 'Compte suspendu' }
    Frontend-->>Frontend: Supprime token + redirige /login
```

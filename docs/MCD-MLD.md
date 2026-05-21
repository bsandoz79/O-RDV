# MCD / MLD — O'RDV

## MLD (Modèle Logique de Données)

```mermaid
erDiagram

    users {
        int      id              PK
        varchar  email           UK
        varchar  password
        varchar  role
        varchar  first_name
        varchar  last_name
        varchar  phone
        varchar  profile_picture
        boolean  is_banned
        varchar  ban_reason
        datetime created_at
    }

    categories {
        int     id   PK
        varchar name UK
        varchar icon
    }

    providers {
        int     id           PK
        int     user_id      FK
        int     category_id  FK
        varchar name
        text    address
        varchar zip_code
        varchar city
        text    description
        varchar phone
        varchar image_url
        float   latitude
        float   longitude
        boolean is_certified
        boolean is_visible
        text    admin_note
        datetime created_at
    }

    business_hours {
        int     id          PK
        int     provider_id FK
        varchar day_of_week
        time    open_time
        time    close_time
        boolean is_closed
    }

    services {
        int     id          PK
        int     provider_id FK
        varchar label
        decimal price
        int     duration
        varchar image_url
    }

    appointments {
        int      id               PK
        int      client_id        FK
        int      provider_id      FK
        int      service_id       FK
        datetime appointment_date
        varchar  status
        text     refusal_reason
        boolean  is_slot_released
        boolean  is_read
        datetime created_at
    }

    reviews {
        int      id             PK
        int      client_id      FK
        int      provider_id    FK
        int      appointment_id FK
        int      rating
        text     comment
        datetime created_at
    }

    review_likes {
        int      id        PK
        int      review_id FK
        int      user_id   FK
        datetime created_at
    }

    favorites {
        int      id          PK
        int      user_id     FK
        int      provider_id FK
        datetime created_at
    }

    users        ||--o|  providers      : "possede"
    categories   ||--o{  providers      : "categorise"
    providers    ||--|{  business_hours : "horaires"
    providers    ||--o{  services       : "propose"
    users        ||--o{  appointments   : "reserve"
    providers    ||--o{  appointments   : "recoit"
    services     ||--o{  appointments   : "concerne"
    appointments ||--o|  reviews        : "genere"
    users        ||--o{  reviews        : "redige"
    providers    ||--o{  reviews        : "recoit"
    reviews      ||--o{  review_likes   : "recoit"
    users        ||--o{  review_likes   : "like"
    users        ||--o{  favorites      : "favori"
    providers    ||--o{  favorites      : "est favori"
```

## Contraintes notables

| Contrainte | Table | Detail |
|---|---|---|
| Unique | `users.email` | Un email = un compte |
| Unique | `providers.user_id` | Un user = un seul profil pro |
| Unique | `reviews.appointment_id` | Un RDV = un seul avis |
| Unique | `review_likes (review_id, user_id)` | Un user ne peut liker qu'une fois |
| Unique | `favorites (user_id, provider_id)` | Pas de doublon en favoris |
| Cascade | `providers → users` | Suppression user = suppression pro |
| Cascade | `appointments → users, providers, services` | Suppression en cascade |

## Enums

| Enum | Valeurs |
|---|---|
| `role` | `user`, `pro`, `admin` |
| `status` | `pending`, `confirmed`, `cancelled`, `cancelled_by_pro`, `completed` |
| `day_of_week` | `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday` |

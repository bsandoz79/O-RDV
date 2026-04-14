# O'RDV - Plateforme de Services de Proximité

O'RDV est une solution de prise de rendez-vous en temps réel dédiée aux services de proximité (coiffure, esthétique, soins). L'objectif est de réduire la fracture numérique pour les petits prestataires tout en répondant à un besoin de disponibilité immédiate pour les clients.

## Objectifs du Projet
- Gestion d'agendas dynamiques pour les prestataires.
- Recherche multicritère avec géolocalisation.
- Modèle Freemium (Abonnements Basic et Premium).

## Stack Technique
- Frontend : React.js (Architecture SPA).
- Backend : Node.js & Express (API REST).
- Base de données : MySQL (Gestion relationnelle).
- Sécurité : Authentification JWT et chiffrement Bcrypt.
- Infrastructure : Conteneurisation avec Docker et Docker Compose.

## CI/CD
Le projet intègre un pipeline de déploiement continu via GitHub Actions.
État du build : ![CI/CD Status](https://github.com/bsandoz79/O-RDV/actions/workflows/main.yml/badge.svg?branch=develop)

## 📖 Documentation
- [Spécifications Fonctionnelles (SPECS.md)](./SPECS.md)
- [Architecture Technique et Sécurité (ARCHITECTURE.md)](./ARCHITECTURE.md)
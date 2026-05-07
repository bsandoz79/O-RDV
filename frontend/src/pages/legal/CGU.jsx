import React from 'react';
import { Link } from 'react-router-dom';

export default function CGU() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
        <Link to="/" className="text-rose-500 text-sm font-semibold hover:underline mb-6 block">← Retour</Link>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-slate-500 text-sm mb-8">En vigueur au 1er mai 2026</p>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">1. Objet</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            O'RDV est une plateforme de mise en relation entre des clients et des prestataires de services
            (coiffure, esthétique, bien-être). Les présentes CGU définissent les conditions d'utilisation du service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">2. Accès au service</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            L'utilisation d'O'RDV nécessite la création d'un compte. L'utilisateur s'engage à fournir des
            informations exactes et à maintenir la confidentialité de ses identifiants.
            L'accès est gratuit pour les clients. Les prestataires disposent d'un espace professionnel gratuit.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">3. Obligations des utilisateurs</h2>
          <ul className="text-slate-600 text-sm leading-relaxed space-y-1 list-disc list-inside">
            <li>Ne pas usurper l'identité d'un tiers</li>
            <li>Ne pas utiliser la plateforme à des fins illicites</li>
            <li>Respecter les rendez-vous pris ou les annuler dans un délai raisonnable</li>
            <li>Ne pas publier de contenus offensants ou trompeurs</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">4. Obligations des prestataires</h2>
          <ul className="text-slate-600 text-sm leading-relaxed space-y-1 list-disc list-inside">
            <li>Fournir des informations exactes sur leurs services et tarifs</li>
            <li>Honorer les rendez-vous confirmés</li>
            <li>Respecter la réglementation applicable à leur activité</li>
            <li>Gérer leurs disponibilités de manière rigoureuse</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">5. Responsabilité</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            O'RDV est une plateforme d'intermédiation. Nous ne sommes pas parties aux contrats conclus entre
            clients et prestataires et ne pouvons être tenus responsables de la qualité des prestations,
            des annulations ou des litiges entre utilisateurs.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">6. Suppression de compte</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Tout utilisateur peut supprimer son compte à tout moment depuis son espace personnel.
            La suppression entraîne l'effacement définitif de toutes ses données personnelles conformément au RGPD.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">7. Modification des CGU</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Nous nous réservons le droit de modifier les présentes CGU. Les utilisateurs seront informés
            de toute modification substantielle par e-mail.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">8. Droit applicable</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Les présentes CGU sont soumises au droit français.
            Tout litige relèvera de la compétence des tribunaux français.
          </p>
        </section>
      </div>
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
        <Link to="/" className="text-rose-500 text-sm font-semibold hover:underline mb-6 block">← Retour</Link>
        <h1 className="text-3xl font-black text-slate-900 mb-8">Mentions légales</h1>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">Éditeur du site</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            O'RDV est un projet réalisé dans le cadre d'une formation CDA (Concepteur Développeur d'Applications).<br />
            Responsable de publication : Baptiste Sandoz<br />
            Contact : bsandoz79@gmail.com
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">Hébergement</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            <strong>Backend & Base de données :</strong> Railway (San Francisco, CA, USA) — railway.app<br />
            <strong>Frontend :</strong> Vercel Inc. (San Francisco, CA, USA) — vercel.com
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">Propriété intellectuelle</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            L'ensemble du contenu de ce site (code, design, textes) est protégé par le droit d'auteur.
            Toute reproduction sans autorisation est interdite.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">Limitation de responsabilité</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            O'RDV est une plateforme de mise en relation. Nous ne sommes pas responsables des prestations
            effectuées par les professionnels référencés sur la plateforme.
          </p>
        </section>
      </div>
    </div>
  );
}

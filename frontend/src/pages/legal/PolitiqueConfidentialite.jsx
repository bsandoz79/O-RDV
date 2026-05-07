import React from 'react';
import { Link } from 'react-router-dom';

export default function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
        <Link to="/" className="text-rose-500 text-sm font-semibold hover:underline mb-6 block">← Retour</Link>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Politique de confidentialité</h1>
        <p className="text-slate-500 text-sm mb-8">Conforme au Règlement Général sur la Protection des Données (RGPD - UE 2016/679)</p>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">Responsable du traitement</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Baptiste Sandoz — bsandoz79@gmail.com
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">Données collectées</h2>
          <ul className="text-slate-600 text-sm leading-relaxed space-y-1 list-disc list-inside">
            <li>Adresse e-mail (identification et connexion)</li>
            <li>Nom et prénom (optionnels, pour personnaliser l'expérience)</li>
            <li>Numéro de téléphone (optionnel, pour les rappels de RDV)</li>
            <li>Photo de profil (optionnelle)</li>
            <li>Historique des rendez-vous</li>
            <li>Adresse professionnelle (pour les prestataires)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">Finalités du traitement</h2>
          <ul className="text-slate-600 text-sm leading-relaxed space-y-1 list-disc list-inside">
            <li>Gestion des comptes utilisateurs et authentification</li>
            <li>Prise et gestion des rendez-vous</li>
            <li>Affichage des prestataires sur la carte</li>
            <li>Communication relative aux réservations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">Base légale</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Le traitement est fondé sur l'exécution du contrat (fourniture du service de mise en relation)
            et le consentement de l'utilisateur pour les données optionnelles.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">Durée de conservation</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Les données sont conservées pendant la durée d'activité du compte.
            À la suppression du compte, toutes les données personnelles sont effacées définitivement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">Vos droits (RGPD)</h2>
          <ul className="text-slate-600 text-sm leading-relaxed space-y-1 list-disc list-inside">
            <li><strong>Droit d'accès</strong> — consulter vos données depuis votre profil</li>
            <li><strong>Droit de rectification</strong> — modifier vos informations depuis votre profil</li>
            <li><strong>Droit à l'effacement</strong> — supprimer votre compte depuis les paramètres</li>
            <li><strong>Droit à la portabilité</strong> — contactez-nous pour obtenir vos données</li>
            <li><strong>Droit d'opposition</strong> — contactez-nous à bsandoz79@gmail.com</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">Sécurité</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Les mots de passe sont chiffrés via l'algorithme bcrypt. Les communications sont sécurisées par HTTPS.
            Les données sont stockées sur des serveurs sécurisés (Railway, USA).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">Contact & réclamations</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Pour exercer vos droits : bsandoz79@gmail.com<br />
            Vous pouvez également saisir la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:underline">www.cnil.fr</a>
          </p>
        </section>
      </div>
    </div>
  );
}

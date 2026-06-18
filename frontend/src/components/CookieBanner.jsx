import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie_consent")) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  }

  function refuse() {
    localStorage.setItem("cookie_consent", "refused");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 text-white px-4 py-4 shadow-2xl border-t border-slate-700">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">

        <Cookie size={22} className="text-rose-400 flex-shrink-0 mt-0.5 sm:mt-0" />

        <div className="flex-1 text-sm text-slate-300 leading-relaxed">
          <span className="font-semibold text-white">Ce site utilise des cookies.</span>{" "}
          Un cookie d'authentification (<span className="font-mono text-rose-300 text-xs">token</span>) est déposé lors de votre connexion pour sécuriser votre session. Aucun cookie publicitaire ou de traçage n'est utilisé.{" "}
          <a href="/politique-confidentialite" className="text-rose-400 underline hover:text-rose-300 transition">
            En savoir plus
          </a>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={refuse}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded-xl transition"
          >
            Refuser
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition"
          >
            Accepter
          </button>
          <button
            onClick={refuse}
            className="p-1.5 text-slate-500 hover:text-white transition"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}

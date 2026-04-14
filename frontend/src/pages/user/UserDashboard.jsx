import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Settings, ChevronRight, Loader2 } from "lucide-react";
import API_BASE_URL from "../../api/api";

export default function UserDashboard() {
  const [shopInfo, setShopInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // providerId statique pour le moment
  const providerId = 1;

  useEffect(() => {
    // Utilisation de API_BASE_URL
    fetch(`${API_BASE_URL}/shop/info/${providerId}`)
      .then(res => res.json())
      .then(data => {
        setShopInfo(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur chargement dashboard:", err);
        setLoading(false);
      });
  }, [providerId]);

  // Données de test pour les rendez-vous
  const appointments = [
    { id: 1, service: "Coupe Dégradé", provider: shopInfo?.name || "Chargement...", date: "28 Mars 2026", time: "14:00", status: "Confirmed" },
    { id: 2, service: "Soin Visage", provider: "Eclat & Beauté", date: "05 Avril 2026", time: "11:30", status: "Pending" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 font-display italic">Monespace</h1>
          <p className="text-slate-500 mt-2 font-medium">Gérez vos réservations et vos préférences.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Section Profil (Gauche) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-12 -mt-12" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-3xl overflow-hidden mb-4 shadow-lg shadow-rose-200 border-2 border-white bg-slate-100 flex items-center justify-center">
                  {loading ? (
                    <Loader2 className="animate-spin text-rose-500" />
                  ) : shopInfo?.image_url ? (
                    <img 
                      /* CORRECTION ICI : On utilise API_BASE_URL dynamiquement pour l'image */
                      src={`${API_BASE_URL.replace('/api', '')}${shopInfo.image_url}`} 
                      alt="Profil" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-rose-500 to-violet-500 flex items-center justify-center text-white">
                      <User size={40} />
                    </div>
                  )}
                </div>

                <h2 className="text-xl font-bold text-slate-800">
                  {loading ? "..." : (shopInfo?.name || "Utilisateur")}
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                  {shopInfo?.city ? `📍 ${shopInfo.city}` : "baptiste@exemple.com"}
                </p>
                
                <button className="w-full py-3 px-4 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-rose-600 transition-all flex items-center justify-center gap-2">
                  <Settings size={16} /> Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Section Liste RDV (Droite) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><Calendar size={20} /></div>
                  Prochains Rendez-vous
                </h3>
              </div>

              <div className="grid gap-4">
                {appointments.map((apt) => (
                  <div key={apt.id} className="group p-5 rounded-2xl border border-slate-50 hover:border-rose-100 hover:bg-rose-50/30 transition-all cursor-pointer flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="hidden sm:flex flex-col items-center justify-center bg-white border border-slate-100 w-16 h-16 rounded-xl shadow-sm group-hover:border-rose-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Date</span>
                        <span className="text-xl font-black text-rose-500">{apt.date.split(' ')[0]}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg leading-tight">{apt.service}</h4>
                        <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                          <MapPin size={14} className="text-rose-400" /> {apt.provider}
                        </p>
                        <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5 italic">
                          <Clock size={12} /> {apt.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        apt.status === "Confirmed" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                      }`}>
                        {apt.status}
                      </span>
                      <ChevronRight size={20} className="text-slate-300 group-hover:text-rose-400 transform group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
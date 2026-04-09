import React, { useState } from 'react';
import { Store, Plus, Trash2, Clock, Save, MapPin, Building2, Loader2, CheckCircle, Phone } from 'lucide-react';
import './ShopSettings.css'; // Import du fichier CSS

const DAY_LABELS = {
  monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
  thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
};

// Sous-composants réutilisables
const Input = ({ icon: Icon, ...props }) => (
  <div className="input-wrapper">
    {Icon && <Icon size={14} className="input-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />}
    <input className="custom-input" style={Icon ? { paddingLeft: '2.25rem' } : {}} {...props} />
  </div>
);

const Field = ({ label, ...props }) => (
  <div>
    <label className="field-label">{label}</label>
    <Input {...props} />
  </div>
);

const SectionCard = ({ icon: Icon, gradient, title, children }) => (
  <div className="section-card">
    <div className="card-header">
      <div style={{ padding: '8px', borderRadius: '10px', background: gradient, display: 'inline-flex' }}>
        <Icon size={18} color="white" />
      </div>
      <h3 className="card-title">{title}</h3>
    </div>
    {children}
  </div>
);

export default function ShopSettings() {
  const [profile, setProfile] = useState({ name: '', address: '', city: '', phone: '' });
  const [services, setServices] = useState([{ label: '', price: '', duration: '' }]);
  const [hours, setHours] = useState({
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '10:00', close: '17:00', closed: false },
    sunday: { open: '00:00', close: '00:00', closed: true },
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Handlers (Logique inchangée)
  const handleServiceChange = (i, field, val) => {
    const updated = [...services];
    updated[i][field] = val;
    setServices(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulation API
    setTimeout(() => { setLoading(false); setSuccess(true); }, 1500);
  };

  return (
    <div className="shop-settings-page">
      <div className="decor-orb-1"></div>
      <div className="decor-orb-2"></div>

      <div className="shop-container">
        <header className="shop-header">
          <h1>Configuration Boutique</h1>
          <p>Gérez votre profil, votre catalogue et vos disponibilités en temps réel.</p>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <SectionCard icon={Building2} gradient="linear-gradient(135deg,#f59e0b,#d97706)" title="Profil Établissement">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Nom de l'établissement" icon={Building2} type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Adresse" icon={MapPin} type="text" value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} />
              </div>
              <Field label="Ville" type="text" value={profile.city} onChange={(e) => setProfile({...profile, city: e.target.value})} />
              <Field label="Téléphone" icon={Phone} type="tel" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} />
            </div>
          </SectionCard>

          <SectionCard icon={Store} gradient="linear-gradient(135deg,#f43f5e,#e11d48)" title="Catalogue de Services">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {services.map((s, i) => (
                <div key={i} className="service-row">
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <label className="field-label">Nom du service</label>
                    <input className="custom-input" type="text" value={s.label} onChange={(e) => handleServiceChange(i, 'label', e.target.value)} />
                  </div>
                  <div style={{ width: '105px' }}>
                    <label className="field-label">Prix (€)</label>
                    <input className="custom-input" type="number" value={s.price} onChange={(e) => handleServiceChange(i, 'price', e.target.value)} />
                  </div>
                  <button type="button" className="btn-remove" onClick={() => setServices(services.filter((_, idx) => idx !== i))}>
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
              <button type="button" className="btn-add" onClick={() => setServices([...services, { label: '', price: '', duration: '' }])}>
                <Plus size={15} /> Ajouter une prestation
              </button>
            </div>
          </SectionCard>

          <SectionCard icon={Clock} gradient="linear-gradient(135deg,#8b5cf6,#7c3aed)" title="Horaires d'ouverture">
            {Object.keys(hours).map((day) => (
              <div key={day} className="hours-row">
                <span className="day-label">{DAY_LABELS[day]}</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="time" className="custom-input" style={{ width: '110px' }} value={hours[day].open} disabled={hours[day].closed} />
                  <input type="time" className="custom-input" style={{ width: '110px' }} value={hours[day].close} disabled={hours[day].closed} />
                </div>
              </div>
            ))}
          </SectionCard>

          <button type="submit" className={`btn-submit ${success ? 'success' : ''}`} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={19} /> : success ? <CheckCircle size={19} /> : <Save size={19} />}
            {loading ? "Enregistrement..." : success ? "Sauvegardé !" : "Enregistrer la boutique"}
          </button>
        </form>
      </div>
    </div>
  );
}
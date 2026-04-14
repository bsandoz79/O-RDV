import React, { useState, useRef, useEffect } from 'react';
import {
  Store, Plus, Trash2, Clock, Save, MapPin,
  Building2, Loader2, CheckCircle, Phone,
  Camera, FileText, Hash, X
} from 'lucide-react';
import API_BASE_URL from "../../api/api";
import './ShopSettings.css';

const DAY_LABELS = {
  monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
  thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
};

const INITIAL_HOURS = {
  monday:    { open: '09:00', close: '18:00', closed: false },
  tuesday:   { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday:  { open: '09:00', close: '18:00', closed: false },
  friday:    { open: '09:00', close: '18:00', closed: false },
  saturday:  { open: '10:00', close: '17:00', closed: false },
  sunday:    { open: '00:00', close: '00:00', closed: true  },
};

// --- SOUS-COMPOSANTS ---
const Field = ({ label, icon: Icon, placeholder, ...props }) => (
  <div>
    <label className="field-label">{label}</label>
    <div className="input-wrapper">
      {Icon && <Icon size={14} className="input-icon" />}
      <input className="custom-input" placeholder={placeholder} style={Icon ? { paddingLeft: '2.25rem' } : {}} {...props} />
    </div>
  </div>
);

const TextareaField = ({ label, icon: Icon, placeholder, ...props }) => (
  <div>
    <label className="field-label">{label}</label>
    <div className="input-wrapper">
      {Icon && <Icon size={14} className="input-icon textarea-icon" />}
      <textarea className="custom-input custom-textarea" placeholder={placeholder} style={Icon ? { paddingLeft: '2.25rem' } : {}} {...props} />
    </div>
  </div>
);

const ImageUploader = ({ preview, onFileChange, onRemove }) => {
  const inputRef = useRef(null);
  return (
    <div className={`image-upload-zone ${preview ? 'has-preview' : ''}`} onClick={() => !preview && inputRef.current.click()}>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
      {preview ? (
        <div className="image-preview-wrapper">
          <img src={preview} alt="Aperçu" className="image-preview" />
          <button type="button" className="image-remove-btn" onClick={(e) => { e.stopPropagation(); onRemove(); }}><X size={14} /></button>
          <div className="image-preview-overlay" onClick={() => inputRef.current.click()}><Camera size={20} /><span>Changer</span></div>
        </div>
      ) : (
        <div className="image-placeholder">
          <Camera size={28} className="image-placeholder-icon" />
          <span className="image-placeholder-label">Photo de l'établissement</span>
        </div>
      )}
    </div>
  );
};

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

const ServiceRow = ({ service, index, onChange, onRemove }) => (
  <div className="service-row">
    <div style={{ flex: 1, minWidth: '160px' }}>
      <label className="field-label">Nom du service</label>
      <input className="custom-input" placeholder="Ex: Coupe de cheveux" type="text" value={service.label} onChange={(e) => onChange(index, 'label', e.target.value)} />
    </div>
    <div style={{ width: '100px' }}>
      <label className="field-label">Prix (€)</label>
      <input className="custom-input" placeholder="25" type="number" value={service.price} onChange={(e) => onChange(index, 'price', e.target.value)} />
    </div>
    <div style={{ width: '100px' }}>
      <label className="field-label">Durée (min)</label>
      <input className="custom-input" placeholder="30" type="number" value={service.duration} onChange={(e) => onChange(index, 'duration', e.target.value)} />
    </div>
    <button type="button" className="btn-remove" onClick={() => onRemove(index)}><Trash2 size={17} /></button>
  </div>
);

const HoursRow = ({ day, config, onChange }) => (
  <div className={`hours-row${config.closed ? ' hours-row--closed' : ''}`}>
    <span className="day-label">{DAY_LABELS[day]}</span>
    <div className="hours-controls">
      <input type="time" className="custom-input time-input" value={config.open} disabled={config.closed} onChange={(e) => onChange(day, 'open', e.target.value)} />
      <span className="hours-separator">→</span>
      <input type="time" className="custom-input time-input" value={config.close} disabled={config.closed} onChange={(e) => onChange(day, 'close', e.target.value)} />
      <label className="closed-toggle">
        <input type="checkbox" checked={config.closed} onChange={() => onChange(day, 'closed', !config.closed)} />
        <span className="closed-label">Fermé</span>
      </label>
    </div>
  </div>
);

export default function ShopSettings() {
  const [profile, setProfile] = useState({ name: '', description: '', address: '', zipCode: '', city: '', phone: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [services, setServices] = useState([{ label: '', price: '', duration: '' }]);
  const [hours, setHours] = useState(INITIAL_HOURS);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [user, setUser] = useState(null);
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const setField = (key) => (e) => setProfile((p) => ({ ...p, [key]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => { setImageFile(null); setImagePreview(null); };

  const handleServiceChange = (i, field, val) => {
    const updated = [...services];
    updated[i][field] = val;
    setServices(updated);
  };

  const handleHoursChange = (day, field, val) =>
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: val } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return setError("Session expirée.");
    
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      if (imageFile) formData.append('image', imageFile);
      
      formData.append('provider_id', user.id); 
      formData.append('profile', JSON.stringify(profile));
      formData.append('services', JSON.stringify(services));
      
      // RÉPARATION : Transformation de l'objet hours en Tableau
      const hoursArray = Object.keys(hours).map(day => ({
          day_of_week: day,
          ...hours[day]
      }));
      formData.append('hours', JSON.stringify(hoursArray));

      const response = await fetch(`${API_BASE_URL}/shop/setup`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Erreur serveur.");
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shop-settings-page">
      <div className="shop-container">
        <header className="shop-header">
          <h1>Configuration Boutique</h1>
          <p>Gérez votre profil, votre catalogue et vos disponibilités.</p>
        </header>

        <form onSubmit={handleSubmit} className="shop-form">
          <SectionCard icon={Building2} gradient="linear-gradient(135deg,#f59e0b,#d97706)" title="Profil Établissement">
            <ImageUploader preview={imagePreview} onFileChange={handleFileChange} onRemove={handleRemoveImage} />
            <div className="profile-grid">
              <div className="col-full"><Field label="Nom" icon={Building2} placeholder="Ex: Salon O'RDV" value={profile.name} onChange={setField('name')} required /></div>
              <div className="col-full"><TextareaField label="Description" icon={FileText} placeholder="Ex: Spécialiste barbe et soins visage..." value={profile.description} onChange={setField('description')} /></div>
              <div className="col-full"><Field label="Adresse" icon={MapPin} placeholder="Ex: 15 rue de la Paix" value={profile.address} onChange={setField('address')} required /></div>
              <Field label="Code Postal" icon={Hash} placeholder="80000" value={profile.zipCode} onChange={setField('zipCode')} />
              <Field label="Ville" placeholder="Amiens" value={profile.city} onChange={setField('city')} required />
              <Field label="Téléphone" icon={Phone} placeholder="06 00 00 00 00" value={profile.phone} onChange={setField('phone')} />
            </div>
          </SectionCard>

          <SectionCard icon={Store} gradient="linear-gradient(135deg,#f43f5e,#e11d48)" title="Catalogue">
            {services.map((s, i) => (
              <ServiceRow key={i} service={s} index={i} onChange={handleServiceChange} onRemove={(idx) => setServices(services.filter((_, k) => k !== idx))} />
            ))}
            <button type="button" className="btn-add" onClick={() => setServices([...services, { label: '', price: '', duration: '' }])}>
              <Plus size={15} /> Ajouter une prestation
            </button>
          </SectionCard>

          <SectionCard icon={Clock} gradient="linear-gradient(135deg,#8b5cf6,#7c3aed)" title="Horaires d'ouverture">
            {Object.keys(hours).map((day) => (
              <HoursRow key={day} day={day} config={hours[day]} onChange={handleHoursChange} />
            ))}
          </SectionCard>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className={`btn-submit${success ? ' success' : ''}`} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : success ? <CheckCircle /> : <Save />}
            {loading ? " Enregistrement..." : success ? " Sauvegardé !" : " Enregistrer"}
          </button>
        </form>
      </div>
    </div>
  );
}
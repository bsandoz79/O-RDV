import React, { useState, useRef } from 'react';
import {
  Store, Plus, Trash2, Clock, Save, MapPin,
  Building2, Loader2, CheckCircle, Phone,
  Camera, FileText, Hash, X
} from 'lucide-react';
import './ShopSettings.css';

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Sous-composant : Champ labellisé
// ─────────────────────────────────────────────
const Field = ({ label, icon: Icon, ...props }) => (
  <div>
    <label className="field-label">{label}</label>
    <div className="input-wrapper">
      {Icon && <Icon size={14} className="input-icon" />}
      <input
        className="custom-input"
        style={Icon ? { paddingLeft: '2.25rem' } : {}}
        {...props}
      />
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Sous-composant : Textarea labellisée
// ─────────────────────────────────────────────
const TextareaField = ({ label, icon: Icon, ...props }) => (
  <div>
    <label className="field-label">{label}</label>
    <div className="input-wrapper">
      {Icon && <Icon size={14} className="input-icon textarea-icon" />}
      <textarea
        className="custom-input custom-textarea"
        style={Icon ? { paddingLeft: '2.25rem' } : {}}
        {...props}
      />
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Sous-composant : Upload image établissement
// ─────────────────────────────────────────────
const ImageUploader = ({ preview, onFileChange, onRemove }) => {
  const inputRef = useRef(null);

  return (
    <div
      className={`image-upload-zone ${preview ? 'has-preview' : ''}`}
      onClick={() => !preview && inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />

      {preview ? (
        <div className="image-preview-wrapper">
          <img src={preview} alt="Aperçu établissement" className="image-preview" />
          <button
            type="button"
            className="image-remove-btn"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            aria-label="Supprimer l'image"
          >
            <X size={14} />
          </button>
          <div className="image-preview-overlay" onClick={() => inputRef.current.click()}>
            <Camera size={20} />
            <span>Changer</span>
          </div>
        </div>
      ) : (
        <div className="image-placeholder">
          <Camera size={28} className="image-placeholder-icon" />
          <span className="image-placeholder-label">Photo de l'établissement</span>
          <span className="image-placeholder-hint">JPG, PNG ou WebP · Max 5 Mo</span>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Sous-composant : Carte de section
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Sous-composant : Ligne de service
// ─────────────────────────────────────────────
const ServiceRow = ({ service, index, onChange, onRemove }) => (
  <div className="service-row">
    <div style={{ flex: 1, minWidth: '160px' }}>
      <label className="field-label">Nom du service</label>
      <input className="custom-input" type="text" placeholder="Ex: Coupe Dégradé"
        value={service.label} onChange={(e) => onChange(index, 'label', e.target.value)} />
    </div>
    <div style={{ width: '100px' }}>
      <label className="field-label">Prix (€)</label>
      <input className="custom-input" type="number" min="0" placeholder="25"
        value={service.price} onChange={(e) => onChange(index, 'price', e.target.value)} />
    </div>
    <div style={{ width: '100px' }}>
      <label className="field-label">Durée (min)</label>
      <input className="custom-input" type="number" min="5" placeholder="30"
        value={service.duration} onChange={(e) => onChange(index, 'duration', e.target.value)} />
    </div>
    <button type="button" className="btn-remove" onClick={() => onRemove(index)} aria-label="Supprimer">
      <Trash2 size={17} />
    </button>
  </div>
);

// ─────────────────────────────────────────────
// Sous-composant : Ligne d'horaire avec checkbox Fermé
// ─────────────────────────────────────────────
const HoursRow = ({ day, config, onChange }) => (
  <div className={`hours-row${config.closed ? ' hours-row--closed' : ''}`}>
    <span className="day-label">{DAY_LABELS[day]}</span>

    <div className="hours-controls">
      <input
        type="time"
        className="custom-input time-input"
        value={config.open}
        disabled={config.closed}
        onChange={(e) => onChange(day, 'open', e.target.value)}
      />
      <span className="hours-separator">→</span>
      <input
        type="time"
        className="custom-input time-input"
        value={config.close}
        disabled={config.closed}
        onChange={(e) => onChange(day, 'close', e.target.value)}
      />

      {/* ── Checkbox "Fermé" ── */}
      <label className="closed-toggle">
        <input
          type="checkbox"
          className="closed-checkbox"
          checked={config.closed}
          onChange={() => onChange(day, 'closed', !config.closed)}
        />
        <span className="closed-label">Fermé</span>
      </label>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Composant principal : ShopSettings
// ─────────────────────────────────────────────
export default function ShopSettings() {
  // Profil établissement — inclut les nouveaux champs requis par la BDD
  const [profile, setProfile] = useState({
    name: '', description: '', address: '', zipCode: '', city: '', phone: '',
  });

  // Image
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Catalogue et horaires
  const [services, setServices] = useState([{ label: '', price: '', duration: '' }]);
  const [hours, setHours]       = useState(INITIAL_HOURS);

  // UI
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  // ── Handlers profil ──────────────────────────────────────────────────────
  const setField = (key) => (e) => setProfile((p) => ({ ...p, [key]: e.target.value }));

  // ── Handlers image ───────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5 Mo.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  // ── Handlers catalogue ───────────────────────────────────────────────────
  const handleServiceChange = (i, field, val) => {
    const updated = [...services];
    updated[i][field] = val;
    setServices(updated);
  };
  const addService    = () => setServices([...services, { label: '', price: '', duration: '' }]);
  const removeService = (i) => setServices(services.filter((_, idx) => idx !== i));

  // ── Handlers horaires ────────────────────────────────────────────────────
  const handleHoursChange = (day, field, val) =>
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: val } }));

  // ── Soumission — FormData (requis par Multer pour l'image) ───────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      const formData = new FormData();

      // L'image est ajoutée en tant que fichier binaire — Multer l'intercepte
      // via upload.single('image') côté backend
      if (imageFile) formData.append('image', imageFile);

      // Les objets JS doivent être sérialisés : FormData ne supporte pas les objets natifs
      // Le backend les récupère avec JSON.parse(req.body.xxx)
      formData.append('provider_id', 1); // ← À remplacer par l'ID extrait du JWT
      formData.append('profile',     JSON.stringify(profile));
      formData.append('services',    JSON.stringify(services));
      formData.append('hours',       JSON.stringify(hours));

      // ⚠️ Ne PAS setter le header Content-Type manuellement :
      // le navigateur injecte automatiquement 'multipart/form-data; boundary=...'
      const response = await fetch('http://localhost:5000/api/shop/setup', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Erreur serveur (${response.status})`);
      }

      setSuccess(true);
      // navigate('/pro/dashboard'); // Décommenter une fois React Router configuré

    } catch (err) {
      console.error('Erreur envoi boutique :', err);
      setError(err.message || 'Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  };

  // ── Rendu ────────────────────────────────────────────────────────────────
  return (
    <div className="shop-settings-page">
      <div className="decor-orb-1" />
      <div className="decor-orb-2" />

      <div className="shop-container">
        <header className="shop-header">
          <h1>Configuration Boutique</h1>
          <p>Gérez votre profil, votre catalogue et vos disponibilités en temps réel.</p>
        </header>

        <form onSubmit={handleSubmit} className="shop-form">

          {/* ── 1. PROFIL ÉTABLISSEMENT ── */}
          <SectionCard icon={Building2} gradient="linear-gradient(135deg,#f59e0b,#d97706)" title="Profil Établissement">
            <ImageUploader preview={imagePreview} onFileChange={handleFileChange} onRemove={handleRemoveImage} />

            <div className="profile-grid">
              <div className="col-full">
                <Field label="Nom de l'établissement" icon={Building2} type="text" required
                  placeholder="Ex: Barber Deluxe" value={profile.name} onChange={setField('name')} />
              </div>
              <div className="col-full">
                <TextareaField label="Description" icon={FileText} rows={3}
                  placeholder="Décrivez votre établissement en quelques mots…"
                  value={profile.description} onChange={setField('description')} />
              </div>
              <div className="col-full">
                <Field label="Adresse" icon={MapPin} type="text" required
                  placeholder="12 rue de la Paix" value={profile.address} onChange={setField('address')} />
              </div>
              <Field label="Code Postal" icon={Hash} type="text" maxLength={5}
                placeholder="75001" value={profile.zipCode} onChange={setField('zipCode')} />
              <Field label="Ville" type="text" required
                placeholder="Paris" value={profile.city} onChange={setField('city')} />
              <Field label="Téléphone" icon={Phone} type="tel"
                placeholder="06 00 00 00 00" value={profile.phone} onChange={setField('phone')} />
            </div>
          </SectionCard>

          {/* ── 2. CATALOGUE DE SERVICES ── */}
          <SectionCard icon={Store} gradient="linear-gradient(135deg,#f43f5e,#e11d48)" title="Catalogue de Services">
            <div className="services-list">
              {services.map((s, i) => (
                <ServiceRow key={i} service={s} index={i} onChange={handleServiceChange} onRemove={removeService} />
              ))}
              <button type="button" className="btn-add" onClick={addService}>
                <Plus size={15} /> Ajouter une prestation
              </button>
            </div>
          </SectionCard>

          {/* ── 3. HORAIRES D'OUVERTURE ── */}
          <SectionCard icon={Clock} gradient="linear-gradient(135deg,#8b5cf6,#7c3aed)" title="Horaires d'ouverture">
            {Object.keys(hours).map((day) => (
              <HoursRow key={day} day={day} config={hours[day]} onChange={handleHoursChange} />
            ))}
          </SectionCard>

          {/* ── Feedback erreur ── */}
          {error && (
            <div className="form-error">
              <X size={15} /> {error}
            </div>
          )}

          {/* ── Bouton sauvegarde ── */}
          <button type="submit" className={`btn-submit${success ? ' success' : ''}`} disabled={loading}>
            {loading
              ? <><Loader2 className="animate-spin" size={19} /> Enregistrement...</>
              : success
                ? <><CheckCircle size={19} /> Configuration sauvegardée !</>
                : <><Save size={19} /> Enregistrer ma configuration</>}
          </button>

        </form>
      </div>
    </div>
  );
}
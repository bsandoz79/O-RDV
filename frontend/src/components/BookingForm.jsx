import React, { useState, useEffect } from 'react';

const BookingForm = () => {
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState('');
    const [appointmentDate, setAppointmentDate] = useState('');
    const [message, setMessage] = useState('');

    // 1. Charger les services au démarrage
    useEffect(() => {
        fetch('http://localhost:5000/api/appointments/services')
            .then(res => res.json())
            .then(data => setServices(data))
            .catch(err => console.error("Erreur services:", err));
    }, []);

    // 2. Envoyer la réservation
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const bookingData = {
            client_id: 2, // Pour l'instant on force l'ID, on l'automatisera plus tard avec le Token
            provider_id: 1, // Idem
            service_id: selectedService,
            appointment_date: appointmentDate
        };

        const response = await fetch('http://localhost:5000/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });

        if (response.ok) {
            setMessage("✅ Rendez-vous réservé avec succès !");
        } else {
            setMessage("❌ Erreur lors de la réservation.");
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>Réserver un service</h2>
            <form onSubmit={handleSubmit}>
                <label>Choisir un service :</label>
                <select onChange={(e) => setSelectedService(e.target.value)} required>
                    <option value="">-- Sélectionnez --</option>
                    {services.map(s => (
                        <option key={s.id} value={s.id}>{s.label} - {s.price}€</option>
                    ))}
                </select>

                <br /><br />

                <label>Date et heure :</label>
                <input 
                    type="datetime-local" 
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    required 
                />

                <br /><br />
                <button type="submit">Confirmer le RDV</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default BookingForm;
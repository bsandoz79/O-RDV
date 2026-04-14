import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Import de l'URL centralisée
import API_BASE_URL from '../api/api';

const BookingPage = () => {
    const { providerId } = useParams();
    const navigate = useNavigate();
    
    // États
    const [selectedDate, setSelectedDate] = useState('');
    const [bookedSlots, setBookedSlots] = useState([]);
    const [shopInfo, setShopInfo] = useState(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [lastBooking, setLastBooking] = useState(null);

    // 1. Charger les infos du pro au montage (URL CENTRALISÉE)
    useEffect(() => {
        fetch(`${API_BASE_URL}/shop/info/${providerId}`)
            .then(res => res.json())
            .then(data => setShopInfo(data))
            .catch(err => console.error("Erreur chargement shop:", err));
    }, [providerId]);

    // 2. Charger les créneaux déjà pris quand la date change (URL CENTRALISÉE)
    useEffect(() => {
        if (selectedDate) {
            fetch(`${API_BASE_URL}/appointments/booked/${providerId}/${selectedDate}`)
                .then(res => res.json())
                .then(data => setBookedSlots(data))
                .catch(err => console.error("Erreur créneaux:", err));
        }
    }, [selectedDate, providerId]);

    // 3. ENREGISTRER LE RDV DANS LA BASE
    const handleBooking = async (time) => {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token'); // Récupération du token

        if (!user || !token) {
            alert("Vous devez être connecté pour réserver !");
            navigate('/login');
            return;
        }

        const appointmentData = {
            clientId: user.id,
            providerId: shopInfo.id,
            serviceId: 1, 
            dateTime: `${selectedDate} ${time}:00` // Format SQL DATETIME
        };

        try {
            // Utilisation de API_BASE_URL et ajout du Header Authorization (Vigile)
            const res = await fetch(`${API_BASE_URL}/appointments/book`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Protection de la route
                },
                body: JSON.stringify(appointmentData)
            });

            if (res.ok) {
                setLastBooking({ date: selectedDate, time: time });
                setIsConfirmed(true);
            } else {
                const errorData = await res.json();
                alert(errorData.message || "Erreur lors de la réservation");
            }
        } catch (err) {
            alert("Erreur réseau lors de la réservation");
        }
    };

    // 4. GENERER LE LIEN GOOGLE CALENDAR
    const openGoogleCalendar = () => {
        // Formatage pour Google : YYYYMMDDTHHMMSS
        const gDate = lastBooking.date.replaceAll('-', '') + 'T' + lastBooking.time.replaceAll(':', '') + '00';
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=RDV+chez+${encodeURIComponent(shopInfo.name)}&dates=${gDate}/${gDate}&location=${encodeURIComponent(shopInfo.city)}`;
        window.open(url, '_blank');
    };

    // LOGIQUE DE GENERATION DES BOUTONS (Inchangée mais essentielle)
    const generateSlots = () => {
        if (!shopInfo || !selectedDate) return [];
        const dateObj = new Date(selectedDate);
        const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(dateObj);
        
        const dayConfig = shopInfo.hours?.find(h => h.day_of_week.toLowerCase() === dayName.toLowerCase());

        if (!dayConfig || dayConfig.is_closed) return [];

        const slots = [];
        let current = new Date(`${selectedDate}T${dayConfig.open_time}`);
        const end = new Date(`${selectedDate}T${dayConfig.close_time}`);

        while (current < end) {
            const timeStr = current.toTimeString().substring(0, 5);
            slots.push({ time: timeStr, isBooked: bookedSlots.includes(timeStr) });
            current.setMinutes(current.getMinutes() + 30);
        }
        return slots;
    };

    // --- AFFICHAGE APRES CONFIRMATION ---
    if (isConfirmed) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-2xl font-bold text-green-600">C'est réservé ! 🎉</h2>
                <p className="my-4">Le {lastBooking.date} à {lastBooking.time}</p>
                <button 
                    onClick={openGoogleCalendar}
                    className="bg-red-500 text-white p-3 rounded shadow-lg hover:bg-red-600 transition"
                >
                    Ajouter à Google Calendar
                </button>
                <button onClick={() => setIsConfirmed(false)} className="block mx-auto mt-4 text-gray-500 underline">
                    Prendre un autre rendez-vous
                </button>
            </div>
        );
    }

    // --- AFFICHAGE FORMULAIRE ---
    return (
        <div className="p-6 max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-2">{shopInfo?.name}</h1>
            <p className="text-gray-600 mb-6">{shopInfo?.city}</p>
            
            <label className="block font-medium mb-2">Choisissez une date :</label>
            <input 
                type="date" 
                min={new Date().toISOString().split('T')[0]} 
                className="w-full p-3 border rounded mb-6"
                onChange={(e) => setSelectedDate(e.target.value)} 
            />

            {selectedDate && (
                <div className="grid grid-cols-3 gap-3">
                    {generateSlots().length > 0 ? (
                        generateSlots().map(slot => (
                            <button
                                key={slot.time}
                                disabled={slot.isBooked}
                                onClick={() => handleBooking(slot.time)}
                                className={`p-3 rounded-lg font-medium transition ${
                                    slot.isBooked 
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white'
                                }`}
                            >
                                {slot.time}
                            </button>
                        ))
                    ) : (
                        <p className="col-span-3 text-center text-red-500">Établissement fermé ce jour-là.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default BookingPage;
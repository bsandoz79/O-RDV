const express = require('express');
const router = express.Router();
const db = require('../db'); 
const auth = require('../middlewares/auth'); // VERROU 1 : Vérifie si on est connecté
const checkRole = require('../middlewares/roleGuard'); // VERROU 2 : Vérifie le rôle

// --- CRÉER UN RENDEZ-VOUS ---
// On ajoute 'auth' : Seuls les gens connectés peuvent prendre RDV
// On ajoute 'checkRole' : Ici, on autorise 'user' (le client) et 'admin'
router.post('/', auth, checkRole(['user', 'admin']), async (req, res) => {
    const { client_id, provider_id, service_id, appointment_date } = req.body;

    if (!client_id || !provider_id || !service_id || !appointment_date) {
        return res.status(400).json({ error: "Tous les champs sont obligatoires" });
    }

    try {
        // Sécurité SQL : Les '?' protègent déjà contre les injections ✅
        const sql = `INSERT INTO appointments (client_id, provider_id, service_id, appointment_date, status) 
                     VALUES (?, ?, ?, ?, 'pending')`;
        
        const [result] = await db.execute(sql, [client_id, provider_id, service_id, appointment_date]);

        res.status(201).json({ 
            message: "Rendez-vous créé avec succès !", 
            appointmentId: result.insertId 
        });
    } catch (err) {
        console.error("Erreur SQL:", err);
        res.status(500).json({ error: "Erreur lors de l'enregistrement du rendez-vous" });
    }
});

// --- CRÉNEAUX DISPONIBLES POUR UN JOUR DONNÉ ---
// Public : le client doit voir les dispo sans être connecté
// GET /api/appointments/availability/:providerId/:date  (date format: YYYY-MM-DD)
router.get('/availability/:providerId/:date', async (req, res) => {
    const { providerId, date } = req.params;

    try {
        // 1. Récupérer les horaires du jour
        const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' })
            .format(new Date(`${date}T12:00:00`)).toLowerCase(); // ex: "monday"

        const [hoursRows] = await db.execute(
            'SELECT * FROM business_hours WHERE provider_id = ? AND LOWER(day_of_week) = ?',
            [providerId, dayName]
        );

        if (hoursRows.length === 0 || hoursRows[0].is_closed) {
            return res.json({ closed: true, slots: [] });
        }

        const { open_time, close_time } = hoursRows[0];

        // Valeurs par défaut si NULL en base
        const openStr  = open_time  ? String(open_time).substring(0, 5)  : '09:00';
        const closeStr = close_time ? String(close_time).substring(0, 5) : '18:00';

        // 2. Récupérer les RDV déjà pris ce jour (via la table services pour remonter au provider)
        const [bookedRows] = await db.execute(
            `SELECT TIME(a.appointment_date) AS booked_time
             FROM appointments a
             JOIN services s ON a.service_id = s.id
             WHERE s.provider_id = ? AND DATE(a.appointment_date) = ?`,
            [providerId, date]
        );

        const bookedTimes = new Set(
            bookedRows.map(r => r.booked_time.substring(0, 5))
        );

        // 3. Générer les créneaux de 30 min
        const slots = [];
        const [openH, openM] = openStr.split(':').map(Number);
        const [closeH, closeM] = closeStr.split(':').map(Number);
        const openMinutes = openH * 60 + openM;
        const closeMinutes = closeH * 60 + closeM;

        for (let m = openMinutes; m < closeMinutes; m += 30) {
            const hh = String(Math.floor(m / 60)).padStart(2, '0');
            const mm = String(m % 60).padStart(2, '0');
            const time = `${hh}:${mm}`;
            slots.push({ time, available: !bookedTimes.has(time) });
        }

        res.json({ closed: false, slots });
    } catch (err) {
        console.error('Erreur availability:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- RÉCUPÉRER LES SERVICES ---
// On peut laisser cette route publique si tu veux que les gens voient les services 
// avant même de se connecter, ou ajouter 'auth' pour limiter l'accès.
router.get('/services', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM services');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Erreur lors de la récupération des services" });
    }
});

module.exports = router;
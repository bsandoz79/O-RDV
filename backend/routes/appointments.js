const express = require('express');
const router = express.Router();
const db = require('../db'); 
const auth = require('../middlewares/auth'); // VERROU 1 : Vérifie si on est connecté
const checkRole = require('../middlewares/roleGuard'); // VERROU 2 : Vérifie le rôle

// --- CRÉER UN RENDEZ-VOUS ---
// On ajoute 'auth' : Seuls les gens connectés peuvent prendre RDV
// On ajoute 'checkRole' : Ici, on autorise 'user' (le client) et 'admin'
router.post('/', auth, checkRole(['user', 'admin']), async (req, res) => {
    const { provider_id, service_id, appointment_date, phone, send_sms_reminder } = req.body;
    const client_id = req.auth.userId; // Sécurité : toujours depuis le token

    if (!provider_id || !service_id || !appointment_date) {
        return res.status(400).json({ error: "Tous les champs sont obligatoires" });
    }

    try {
        // --- Validation horaires : rejeter si hors plage business_hours ---
        const apptDate = new Date(appointment_date);
        const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' })
            .format(apptDate).toLowerCase();

        const [hoursRows] = await db.execute(
            `SELECT is_closed,
                    TIME_FORMAT(open_time,  '%H:%i') AS open_str,
                    TIME_FORMAT(close_time, '%H:%i') AS close_str
             FROM business_hours
             WHERE provider_id = ? AND LOWER(day_of_week) = ?`,
            [provider_id, dayName]
        );

        const postRow   = hoursRows[0];
        const postOpen  = postRow?.open_str  || '00:00';
        const postClose = postRow?.close_str || '00:00';

        if (hoursRows.length === 0 || postRow.is_closed) {
            return res.status(400).json({ error: "Le prestataire est fermé ce jour-là." });
        }

        const openMin  = (() => { const [h,m] = postOpen.split(':').map(Number); return h*60+m; })();
        // 00:00–00:00 = ouvert 24h
        const closeMin = (postOpen === '00:00' && postClose === '00:00') ? 1440
            : (() => { const [h,m] = postClose.split(':').map(Number); return h*60+m; })();

        const [serviceRows] = await db.execute('SELECT duration FROM services WHERE id = ?', [service_id]);
        const duration = serviceRows[0]?.duration ?? 30;

        const slotMin = apptDate.getHours() * 60 + apptDate.getMinutes();

        if (slotMin < openMin || slotMin + duration > closeMin) {
            return res.status(400).json({ error: `Créneau hors des horaires d'ouverture (${String(Math.floor(openMin/60)).padStart(2,'0')}:${String(openMin%60).padStart(2,'0')} – ${String(Math.floor(closeMin/60)).padStart(2,'0')}:${String(closeMin%60).padStart(2,'0')}).` });
        }

        // Anti-doublon : vérifier qu'aucun RDV n'existe déjà pour ce prestataire à cette date/heure
        const [conflict] = await db.execute(
            `SELECT id FROM appointments
             WHERE provider_id = ? AND appointment_date = ? AND status != 'cancelled'`,
            [provider_id, appointment_date]
        );
        if (conflict.length > 0) {
            return res.status(409).json({ error: "Ce créneau vient d'être réservé. Veuillez en choisir un autre." });
        }

        const sql = `INSERT INTO appointments (client_id, provider_id, service_id, appointment_date, status, phone, send_sms_reminder)
                     VALUES (?, ?, ?, ?, 'pending', ?, ?)`;

        // phone et send_sms_reminder sont optionnels
        const smsPhone   = (send_sms_reminder && phone) ? phone.trim() : null;
        const smsConsent = (send_sms_reminder && phone) ? 1 : 0;

        const [result] = await db.execute(sql, [client_id, provider_id, service_id, appointment_date, smsPhone, smsConsent]);

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
            `SELECT is_closed,
                    TIME_FORMAT(open_time,  '%H:%i') AS open_str,
                    TIME_FORMAT(close_time, '%H:%i') AS close_str
             FROM business_hours
             WHERE provider_id = ? AND LOWER(day_of_week) = ?`,
            [providerId, dayName]
        );

        const row = hoursRows[0];

        // Fermé uniquement si is_closed=true ou pas d'entrée en DB
        if (hoursRows.length === 0 || row.is_closed) {
            return res.json({ closed: true, slots: [] });
        }

        const openStr  = row.open_str  || '00:00';
        const closeStr = row.close_str || '00:00';

        const [oH, oM] = openStr.split(':').map(Number);
        const openMinutes = oH * 60 + oM;
        // 00:00–00:00 = ouvert 24h (1440 min)
        const closeMinutes = (openStr === '00:00' && closeStr === '00:00') ? 1440
            : (() => { const [cH, cM] = closeStr.split(':').map(Number); return cH * 60 + cM; })();


        // 2. Récupérer les RDV déjà pris ce jour
        const [bookedRows] = await db.execute(
            `SELECT TIME_TO_SEC(TIME(a.appointment_date)) AS booked_sec
             FROM appointments a
             WHERE a.provider_id = ? AND DATE(a.appointment_date) = ?`,
            [providerId, date]
        );

        const bookedTimes = new Set(
            bookedRows.map(r => Math.floor(r.booked_sec / 60))  // en minutes
        );

        // 3. Générer les créneaux — condition stricte : slot_start >= open ET slot_end <= close
        const duration = Math.max(15, parseInt(req.query.duration) || 30);
        const slots = [];

        for (let m = openMinutes; m + duration <= closeMinutes; m += duration) {
            if (m < openMinutes || m + duration > closeMinutes) continue; // garde stricte
            const hh = String(Math.floor(m / 60)).padStart(2, '0');
            const mm = String(m % 60).padStart(2, '0');
            const time = `${hh}:${mm}`;
            slots.push({ time, available: !bookedTimes.has(m) });
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
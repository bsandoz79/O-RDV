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
        // --- Rejeter les réservations dans le passé ---
        const apptDate = new Date(appointment_date);
        if (apptDate <= new Date()) {
            return res.status(400).json({ error: "Impossible de réserver un créneau dans le passé." });
        }

        // --- Validation horaires : rejeter si hors plage business_hours ---
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

        // Détection de chevauchement : un conflit existe si
        //   existing_start < new_end  ET  existing_end > new_start
        // avec new_end = appointment_date + duration, existing_end = a.appointment_date + s.duration
        const [conflict] = await db.execute(
            `SELECT a.id FROM appointments a
             JOIN services s ON a.service_id = s.id
             WHERE a.provider_id = ?
               AND a.status NOT IN ('cancelled', 'completed')
               AND NOT (a.status = 'cancelled_by_pro' AND a.is_slot_released = 1)
               AND a.appointment_date < DATE_ADD(?, INTERVAL ? MINUTE)
               AND DATE_ADD(a.appointment_date, INTERVAL s.duration MINUTE) > ?`,
            [provider_id, appointment_date, duration, appointment_date]
        );
        if (conflict.length > 0) {
            return res.status(409).json({ error: "Ce créneau chevauche un rendez-vous existant. Veuillez en choisir un autre." });
        }

        const smsPhone   = (send_sms_reminder && phone) ? phone.trim() : null;
        const smsConsent = (send_sms_reminder && phone) ? 1 : 0;

        // Si un créneau libéré existe pour ce prestataire/heure exacte, on réutilise sa ligne
        const [released] = await db.execute(
            `SELECT id FROM appointments
             WHERE provider_id = ? AND appointment_date = ?
               AND status = 'cancelled_by_pro' AND is_slot_released = 1
             LIMIT 1`,
            [provider_id, appointment_date]
        );

        let appointmentId;
        if (released.length > 0) {
            await db.execute(
                `UPDATE appointments
                 SET client_id = ?, service_id = ?, status = 'pending',
                     phone = ?, send_sms_reminder = ?,
                     refusal_reason = NULL, is_slot_released = 0, is_read = 1
                 WHERE id = ?`,
                [client_id, service_id, smsPhone, smsConsent, released[0].id]
            );
            appointmentId = released[0].id;
        } else {
            const [result] = await db.execute(
                `INSERT INTO appointments (client_id, provider_id, service_id, appointment_date, status, phone, send_sms_reminder)
                 VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
                [client_id, provider_id, service_id, appointment_date, smsPhone, smsConsent]
            );
            appointmentId = result.insertId;
        }

        res.status(201).json({
            message: "Rendez-vous créé avec succès !",
            appointmentId,
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


        // 2. Récupérer les RDV du jour avec leur durée (jointure services)
        //    Seuls les RDV non annulés comptent comme occupants de créneau.
        const [bookedRows] = await db.execute(
            `SELECT
                FLOOR(TIME_TO_SEC(TIME(a.appointment_date)) / 60) AS start_min,
                s.duration
             FROM appointments a
             JOIN services s ON a.service_id = s.id
             WHERE a.provider_id = ?
               AND DATE(a.appointment_date) = ?
               AND a.status NOT IN ('cancelled', 'completed')
               AND NOT (a.status = 'cancelled_by_pro' AND a.is_slot_released = 1)`,
            [providerId, date]
        );

        // 3. Générer les créneaux — condition stricte : slot_start >= open ET slot_end <= close
        const duration = Math.max(15, parseInt(req.query.duration) || 30);
        const slots = [];

        // Filtre temporel : si la date demandée est aujourd'hui, ignorer les créneaux passés
        const now = new Date();
        const requestedDate = new Date(`${date}T00:00:00`);
        const isToday = requestedDate.toDateString() === now.toDateString();
        // Marge de 15 minutes pour laisser le temps de confirmer
        const minAllowedMinutes = isToday ? (now.getHours() * 60 + now.getMinutes() + 15) : 0;

        for (let m = openMinutes; m + duration <= closeMinutes; m += duration) {
            if (m < openMinutes || m + duration > closeMinutes) continue; // garde stricte
            if (m < minAllowedMinutes) continue; // créneau déjà passé (ou trop proche)
            const hh = String(Math.floor(m / 60)).padStart(2, '0');
            const mm = String(m % 60).padStart(2, '0');
            const time = `${hh}:${mm}`;

            // Un créneau [m, m+duration) est bloqué s'il chevauche un RDV existant [b.start_min, b.start_min+b.duration)
            // Condition : b.start_min < m + duration  ET  b.start_min + b.duration > m
            const blocked = bookedRows.some(
                b => b.start_min < m + duration && b.start_min + b.duration > m
            );
            slots.push({ time, available: !blocked });
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
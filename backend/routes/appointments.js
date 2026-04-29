const express = require('express');
const router = express.Router();
const { Prisma } = require('@prisma/client');
const prisma = require('../prisma/client');
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/roleGuard');

// --- CRÉER UN RENDEZ-VOUS ---
router.post('/', auth, checkRole(['user', 'admin']), async (req, res) => {
    const { provider_id, service_id, appointment_date, phone, send_sms_reminder } = req.body;
    const client_id = req.auth.userId;

    if (!provider_id || !service_id || !appointment_date) {
        return res.status(400).json({ error: "Tous les champs sont obligatoires" });
    }

    try {
        const apptDate = new Date(appointment_date);
        if (apptDate <= new Date()) {
            return res.status(400).json({ error: "Impossible de réserver un créneau dans le passé." });
        }

        const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' })
            .format(apptDate).toLowerCase();

        // Vérification horaires via $queryRaw (calculs TIME MySQL)
        const hoursRows = await prisma.$queryRaw`
            SELECT is_closed,
                   TIME_FORMAT(open_time,  '%H:%i') AS open_str,
                   TIME_FORMAT(close_time, '%H:%i') AS close_str
            FROM business_hours
            WHERE provider_id = ${Number(provider_id)} AND LOWER(day_of_week) = ${dayName}`;

        const postRow  = hoursRows[0];
        const postOpen = postRow?.open_str  || '00:00';
        const postClose = postRow?.close_str || '00:00';

        if (!hoursRows.length || postRow.is_closed) {
            return res.status(400).json({ error: "Le prestataire est fermé ce jour-là." });
        }

        const openMin  = (() => { const [h,m] = postOpen.split(':').map(Number); return h*60+m; })();
        const closeMin = (postOpen === '00:00' && postClose === '00:00') ? 1440
            : (() => { const [h,m] = postClose.split(':').map(Number); return h*60+m; })();

        const service = await prisma.service.findUnique({ where: { id: Number(service_id) } });
        const duration = service?.duration ?? 30;
        const slotMin = apptDate.getHours() * 60 + apptDate.getMinutes();

        if (slotMin < openMin || slotMin + duration > closeMin) {
            return res.status(400).json({ error: `Créneau hors des horaires d'ouverture.` });
        }

        // Détection chevauchement
        const conflict = await prisma.$queryRaw`
            SELECT a.id FROM appointments a
            JOIN services s ON a.service_id = s.id
            WHERE a.provider_id = ${Number(provider_id)}
              AND a.status NOT IN ('cancelled', 'completed')
              AND NOT (a.status = 'cancelled_by_pro' AND a.is_slot_released = 1)
              AND a.appointment_date < DATE_ADD(${appointment_date}, INTERVAL ${duration} MINUTE)
              AND DATE_ADD(a.appointment_date, INTERVAL s.duration MINUTE) > ${appointment_date}`;

        if (conflict.length > 0) {
            return res.status(409).json({ error: "Ce créneau chevauche un rendez-vous existant." });
        }

        const smsPhone   = (send_sms_reminder && phone) ? phone.trim() : null;
        const smsConsent = send_sms_reminder && phone ? true : false;

        // Réutilisation d'un créneau libéré
        const released = await prisma.appointment.findFirst({
            where: {
                provider_id: Number(provider_id),
                appointment_date: new Date(appointment_date),
                status: 'cancelled_by_pro',
                is_slot_released: true,
            },
        });

        let appointmentId;
        if (released) {
            await prisma.appointment.update({
                where: { id: released.id },
                data: {
                    client_id,
                    service_id: Number(service_id),
                    status: 'pending',
                    phone: smsPhone,
                    send_sms_reminder: smsConsent,
                    refusal_reason: null,
                    is_slot_released: false,
                    is_read: true,
                },
            });
            appointmentId = released.id;
        } else {
            const appt = await prisma.appointment.create({
                data: {
                    client_id,
                    provider_id: Number(provider_id),
                    service_id: Number(service_id),
                    appointment_date: new Date(appointment_date),
                    status: 'pending',
                    phone: smsPhone,
                    send_sms_reminder: smsConsent,
                },
            });
            appointmentId = appt.id;
        }

        res.status(201).json({ message: "Rendez-vous créé avec succès !", appointmentId });
    } catch (err) {
        console.error("Erreur:", err);
        res.status(500).json({ error: "Erreur lors de l'enregistrement du rendez-vous" });
    }
});

// --- CRÉNEAUX DISPONIBLES ---
router.get('/availability/:providerId/:date', async (req, res) => {
    const { providerId, date } = req.params;
    try {
        const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' })
            .format(new Date(`${date}T12:00:00`)).toLowerCase();

        const hoursRows = await prisma.$queryRaw`
            SELECT is_closed,
                   TIME_FORMAT(open_time,  '%H:%i') AS open_str,
                   TIME_FORMAT(close_time, '%H:%i') AS close_str
            FROM business_hours
            WHERE provider_id = ${Number(providerId)} AND LOWER(day_of_week) = ${dayName}`;

        const row = hoursRows[0];
        if (!hoursRows.length || row.is_closed) return res.json({ closed: true, slots: [] });

        const openStr  = row.open_str  || '00:00';
        const closeStr = row.close_str || '00:00';
        const [oH, oM] = openStr.split(':').map(Number);
        const openMinutes = oH * 60 + oM;
        const closeMinutes = (openStr === '00:00' && closeStr === '00:00') ? 1440
            : (() => { const [cH, cM] = closeStr.split(':').map(Number); return cH * 60 + cM; })();

        const bookedRows = await prisma.$queryRaw`
            SELECT FLOOR(TIME_TO_SEC(TIME(a.appointment_date)) / 60) AS start_min, s.duration
            FROM appointments a
            JOIN services s ON a.service_id = s.id
            WHERE a.provider_id = ${Number(providerId)}
              AND DATE(a.appointment_date) = ${date}
              AND a.status NOT IN ('cancelled', 'completed')
              AND NOT (a.status = 'cancelled_by_pro' AND a.is_slot_released = 1)`;

        const duration = Math.max(15, parseInt(req.query.duration) || 30);
        const now = new Date();
        const isToday = new Date(`${date}T00:00:00`).toDateString() === now.toDateString();
        const minAllowedMinutes = isToday ? (now.getHours() * 60 + now.getMinutes() + 15) : 0;

        const slots = [];
        for (let m = openMinutes; m + duration <= closeMinutes; m += duration) {
            if (m < minAllowedMinutes) continue;
            const hh = String(Math.floor(m / 60)).padStart(2, '0');
            const mm = String(m % 60).padStart(2, '0');
            const blocked = bookedRows.some(b => Number(b.start_min) < m + duration && Number(b.start_min) + Number(b.duration) > m);
            slots.push({ time: `${hh}:${mm}`, available: !blocked });
        }

        res.json({ closed: false, slots });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SERVICES ---
router.get('/services', async (req, res) => {
    try {
        const services = await prisma.service.findMany();
        res.json(services);
    } catch (err) {
        res.status(500).json({ error: "Erreur lors de la récupération des services" });
    }
});

module.exports = router;

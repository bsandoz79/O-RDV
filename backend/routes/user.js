const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const auth = require('../middlewares/auth');
const db = require('../db');

// ─── Multer : upload avatar ────────────────────────────────────────────────────
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename:    (req, file, cb) => cb(null, `avatar_${req.auth.userId}_${Date.now()}${path.extname(file.originalname)}`),
});
const uploadAvatar = multer({
    storage: avatarStorage,
    limits:  { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (/^image\//.test(file.mimetype)) cb(null, true);
        else cb(new Error('Seules les images sont acceptées.'));
    },
});

// --- GET /api/user/me ---
router.get('/me', auth, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, first_name, last_name, email, phone, role, profile_picture, created_at FROM users WHERE id = ?',
            [req.auth.userId]
        );
        if (rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- POST /api/user/profile-picture ---
// Upload / remplacement de la photo de profil
router.post('/profile-picture', auth, uploadAvatar.single('avatar'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier envoyé.' });
    const imageUrl = `/uploads/${req.file.filename}`;
    try {
        await db.execute('UPDATE users SET profile_picture = ? WHERE id = ?', [imageUrl, req.auth.userId]);
        res.json({ profile_picture: imageUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PUT /api/user/update ---
router.put('/update', auth, async (req, res) => {
    const { first_name, last_name, email, phone } = req.body;
    if (!email) return res.status(400).json({ error: "L'email est obligatoire." });

    try {
        const [existing] = await db.execute(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, req.auth.userId]
        );
        if (existing.length > 0) return res.status(400).json({ error: "Cet email est déjà utilisé." });

        await db.execute(
            'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE id = ?',
            [first_name || null, last_name || null, email, phone || null, req.auth.userId]
        );
        res.json({ message: "Profil mis à jour avec succès." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PUT /api/user/change-password ---
router.put('/change-password', auth, async (req, res) => {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
        return res.status(400).json({ error: "Tous les champs sont obligatoires." });
    if (new_password.length < 6)
        return res.status(400).json({ error: "Le nouveau mot de passe doit faire au moins 6 caractères." });

    try {
        const [rows] = await db.execute('SELECT password FROM users WHERE id = ?', [req.auth.userId]);
        if (rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable." });

        const match = await bcrypt.compare(current_password, rows[0].password);
        if (!match) return res.status(401).json({ error: "Mot de passe actuel incorrect." });

        const hashed = await bcrypt.hash(new_password, 10);
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.auth.userId]);
        res.json({ message: "Mot de passe modifié avec succès." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GET /api/user/appointments ---
// Client : ses réservations | Pro : les RDV reçus sur sa boutique
router.get('/appointments', auth, async (req, res) => {
    try {
        let rows;

        if (req.auth.role === 'pro' || req.auth.role === 'admin') {
            // Récupérer l'id du prestataire pour les mises à jour automatiques
            const [provRows] = await db.execute(
                'SELECT id FROM providers WHERE user_id = ?',
                [req.auth.userId]
            );
            if (provRows.length === 0) return res.json([]);
            const pid = provRows[0].id;

            // ── Auto-clôture : heure de fin passée → completed ───────────────
            await db.execute(`
                UPDATE appointments a
                JOIN services s ON a.service_id = s.id
                SET a.status = 'completed'
                WHERE a.provider_id = ?
                  AND a.status NOT IN ('cancelled', 'cancelled_by_pro', 'completed')
                  AND DATE_ADD(a.appointment_date, INTERVAL s.duration MINUTE) <= NOW()
            `, [pid]);

            // ── Auto-confirmation : pending dans moins de 24h → confirmed ────
            await db.execute(`
                UPDATE appointments
                SET status = 'confirmed'
                WHERE provider_id = ?
                  AND status = 'pending'
                  AND appointment_date > NOW()
                  AND appointment_date <= DATE_ADD(NOW(), INTERVAL 24 HOUR)
            `, [pid]);

            const weekOnly = req.query.week === '1';
            const weekFilter = weekOnly
                ? `AND YEARWEEK(a.appointment_date, 1) = YEARWEEK(NOW(), 1)`
                : '';

            [rows] = await db.execute(`
                SELECT
                    a.id,
                    a.appointment_date,
                    a.status,
                    s.label  AS service_label,
                    s.duration,
                    s.price,
                    u.first_name      AS client_first_name,
                    u.last_name       AS client_last_name,
                    u.email           AS client_email,
                    u.phone           AS client_phone,
                    u.profile_picture AS client_profile_picture
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                JOIN users    u ON a.client_id  = u.id
                WHERE a.provider_id = ? ${weekFilter}
                ORDER BY a.appointment_date ASC
            `, [pid]);
        } else {
            [rows] = await db.execute(`
                SELECT
                    a.id,
                    a.appointment_date,
                    a.status,
                    a.refusal_reason,
                    a.is_read,
                    s.label    AS service_label,
                    s.duration,
                    s.price,
                    p.name     AS provider_name,
                    p.city     AS provider_city,
                    p.image_url AS provider_image
                FROM appointments a
                JOIN services  s ON a.service_id  = s.id
                JOIN providers p ON a.provider_id = p.id
                WHERE a.client_id = ?
                ORDER BY a.appointment_date ASC
            `, [req.auth.userId]);
        }

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PATCH /api/user/appointments/:id/refuse ---
// Pro : refuse un RDV (statut → cancelled_by_pro)
router.patch('/appointments/:id/refuse', auth, async (req, res) => {
    if (req.auth.role !== 'pro' && req.auth.role !== 'admin') {
        return res.status(403).json({ error: "Accès refusé." });
    }
    const apptId = req.params.id;
    try {
        const [provRows] = await db.execute(
            'SELECT id FROM providers WHERE user_id = ?',
            [req.auth.userId]
        );
        if (!provRows.length) return res.status(404).json({ error: 'Boutique introuvable.' });
        const pid = provRows[0].id;

        const [rows] = await db.execute(
            'SELECT id, status, appointment_date FROM appointments WHERE id = ? AND provider_id = ?',
            [apptId, pid]
        );
        if (!rows.length) return res.status(404).json({ error: 'Rendez-vous introuvable.' });

        const appt = rows[0];
        if (['cancelled', 'cancelled_by_pro', 'completed'].includes(appt.status)) {
            return res.status(400).json({ error: 'Ce rendez-vous ne peut plus être refusé.' });
        }
        if (new Date(appt.appointment_date) < new Date()) {
            return res.status(400).json({ error: "Impossible de refuser un rendez-vous passé." });
        }

        const { reason, release } = req.body;
        await db.execute(
            "UPDATE appointments SET status = 'cancelled_by_pro', refusal_reason = ?, is_slot_released = ?, is_read = 0 WHERE id = ?",
            [reason || null, release ? 1 : 0, apptId]
        );
        res.json({ message: 'Rendez-vous refusé.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PATCH /api/user/appointments/:id/cancel ---
// Annule un RDV — seul le client propriétaire peut annuler
router.patch('/appointments/:id/cancel', auth, async (req, res) => {
    const apptId = req.params.id;
    try {
        const [rows] = await db.execute(
            'SELECT id, status, appointment_date FROM appointments WHERE id = ?',
            [apptId]
        );
        if (rows.length === 0) return res.status(404).json({ error: "Rendez-vous introuvable." });

        const appt = rows[0];

        if (req.auth.role !== 'admin') {
            const [ownership] = await db.execute(
                'SELECT id FROM appointments WHERE id = ? AND client_id = ?',
                [apptId, req.auth.userId]
            );
            if (ownership.length === 0) return res.status(403).json({ error: "Accès refusé." });
        }

        if (appt.status === 'cancelled') return res.status(400).json({ error: "Ce rendez-vous est déjà annulé." });
        if (new Date(appt.appointment_date) < new Date()) return res.status(400).json({ error: "Impossible d'annuler un rendez-vous passé." });

        await db.execute("UPDATE appointments SET status = 'cancelled' WHERE id = ?", [apptId]);
        res.json({ message: "Rendez-vous annulé avec succès." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GET /api/user/dashboard-stats ---
router.get('/dashboard-stats', auth, async (req, res) => {
    try {
        const [providerRows] = await db.execute(
            'SELECT id FROM providers WHERE user_id = ?',
            [req.auth.userId]
        );
        if (providerRows.length === 0) {
            return res.status(404).json({ error: 'Boutique introuvable' });
        }
        const pid = providerRows[0].id;

        const [newClientsRows] = await db.execute(`
            SELECT COUNT(*) AS new_clients
            FROM (
                SELECT client_id
                FROM appointments
                WHERE provider_id = ?
                GROUP BY client_id
                HAVING
                    MONTH(MIN(appointment_date)) = MONTH(NOW())
                    AND YEAR(MIN(appointment_date)) = YEAR(NOW())
            ) AS first_timers
        `, [pid]);
        const new_clients = Number(newClientsRows[0].new_clients);

        const [upcomingRows] = await db.execute(`
            SELECT COUNT(*) AS upcoming_7d
            FROM appointments
            WHERE provider_id = ?
              AND appointment_date >= NOW()
              AND appointment_date < DATE_ADD(NOW(), INTERVAL 7 DAY)
              AND status NOT IN ('cancelled', 'cancelled_by_pro')
        `, [pid]);
        const upcoming_7d = Number(upcomingRows[0].upcoming_7d);

        const [caRows] = await db.execute(`
            SELECT COALESCE(SUM(s.price), 0) AS ca_previsionnel
            FROM appointments a
            JOIN services s ON a.service_id = s.id
            WHERE a.provider_id = ?
              AND MONTH(a.appointment_date) = MONTH(NOW())
              AND YEAR(a.appointment_date)  = YEAR(NOW())
              AND a.status NOT IN ('cancelled', 'cancelled_by_pro')
        `, [pid]);
        const ca_previsionnel = Number(caRows[0].ca_previsionnel);

        const [bookedMinRows] = await db.execute(`
            SELECT COALESCE(SUM(s.duration), 0) AS booked_minutes
            FROM appointments a
            JOIN services s ON a.service_id = s.id
            WHERE a.provider_id = ?
              AND YEARWEEK(a.appointment_date, 1) = YEARWEEK(NOW(), 1)
              AND a.status NOT IN ('cancelled', 'cancelled_by_pro')
        `, [pid]);
        const bookedMinutes = Number(bookedMinRows[0].booked_minutes);

        const [hoursRows] = await db.execute(
            'SELECT open_time, close_time, is_closed FROM business_hours WHERE provider_id = ?',
            [pid]
        );
        let totalMinutes = 0;
        hoursRows.forEach(h => {
            if (h.is_closed) return;
            const parseTime = (val) => {
                const str = String(val || '').substring(0, 5);
                const [hh = 0, mm = 0] = str.split(':').map(Number);
                return hh * 60 + mm;
            };
            const openMin  = parseTime(h.open_time);
            const closeMin = parseTime(h.close_time);
            const effectiveClose = (openMin === 0 && closeMin === 0) ? 1440 : closeMin;
            if (effectiveClose > openMin) totalMinutes += effectiveClose - openMin;
        });

        const occupation_rate = totalMinutes > 0
            ? Math.min(100, Math.round((bookedMinutes / totalMinutes) * 100))
            : 0;

        res.json({ new_clients, upcoming_7d, ca_previsionnel, occupation_rate });
    } catch (err) {
        console.error('[dashboard-stats]', err);
        res.status(500).json({ error: err.message });
    }
});

// --- PATCH /api/user/appointments/:id/mark-read ---
// Client : marque un refus comme lu (fermeture de la modale de notification)
router.patch('/appointments/:id/mark-read', auth, async (req, res) => {
    try {
        await db.execute(
            'UPDATE appointments SET is_read = 1 WHERE id = ? AND client_id = ?',
            [req.params.id, req.auth.userId]
        );
        res.json({ message: 'Notification marquée comme lue.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GET /api/user/new-clients ---
router.get('/new-clients', auth, async (req, res) => {
    try {
        const [[provider]] = await db.execute('SELECT id FROM providers WHERE user_id = ?', [req.auth.userId]);
        if (!provider) return res.status(404).json({ error: 'Boutique introuvable' });

        const [rows] = await db.execute(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.profile_picture,
                   MIN(a.created_at) AS first_booking_date
            FROM appointments a
            JOIN users u ON a.client_id = u.id
            WHERE a.provider_id = ?
            GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.profile_picture
            HAVING MONTH(MIN(a.created_at)) = MONTH(NOW()) AND YEAR(MIN(a.created_at)) = YEAR(NOW())
            ORDER BY first_booking_date DESC
            LIMIT 10
        `, [provider.id]);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

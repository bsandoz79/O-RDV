const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const auth = require('../middlewares/auth');
const db = require('../db');

// --- GET /api/user/me ---
// Retourne les infos de l'utilisateur connecté
router.get('/me', auth, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, first_name, last_name, email, phone, role, created_at FROM users WHERE id = ?',
            [req.auth.userId]
        );
        if (rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PUT /api/user/update ---
// Met à jour les infos personnelles
router.put('/update', auth, async (req, res) => {
    const { first_name, last_name, email, phone } = req.body;
    if (!email) return res.status(400).json({ error: "L'email est obligatoire." });

    try {
        // Vérifier que l'email n'est pas pris par un autre utilisateur
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
// Change le mot de passe après vérification de l'ancien
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
            // Filtre optionnel : ?week=1 → seulement la semaine courante (lundi–dimanche)
            const weekOnly = req.query.week === '1';
            const params = [req.auth.userId];
            let weekFilter = '';
            if (weekOnly) {
                weekFilter = `AND YEARWEEK(a.appointment_date, 1) = YEARWEEK(NOW(), 1)`;
            }

            [rows] = await db.execute(`
                SELECT
                    a.id,
                    a.appointment_date,
                    a.status,
                    s.label  AS service_label,
                    s.duration,
                    s.price,
                    u.first_name AS client_first_name,
                    u.last_name  AS client_last_name,
                    u.email      AS client_email
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                JOIN users    u ON a.client_id  = u.id
                JOIN providers p ON p.user_id = ?
                WHERE a.provider_id = p.id ${weekFilter}
                ORDER BY a.appointment_date ASC
            `, params);
        } else {
            // Le client voit ses propres réservations
            [rows] = await db.execute(`
                SELECT
                    a.id,
                    a.appointment_date,
                    a.status,
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

// --- PATCH /api/user/appointments/:id/cancel ---
// Annule un RDV — sécurisé : seul le client propriétaire peut annuler
router.patch('/appointments/:id/cancel', auth, async (req, res) => {
    const apptId = req.params.id;
    try {
        // Vérification IDOR : le RDV doit appartenir à l'utilisateur connecté
        const [rows] = await db.execute(
            'SELECT id, status, appointment_date FROM appointments WHERE id = ?',
            [apptId]
        );
        if (rows.length === 0) return res.status(404).json({ error: "Rendez-vous introuvable." });

        const appt = rows[0];

        // Seul le client propriétaire ou un admin peut annuler
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

module.exports = router;

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
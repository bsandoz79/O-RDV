const express = require('express');
const router = express.Router();
const db = require('../db'); // Assure-toi que le chemin vers ta connexion DB est bon

// On utilise router.post('/') car le préfixe '/api/appointments' 
// sera défini dans ton fichier index.js
router.post('/', async (req, res) => {
    const { client_id, provider_id, service_id, appointment_date } = req.body;

    if (!client_id || !provider_id || !service_id || !appointment_date) {
        return res.status(400).json({ error: "Tous les champs sont obligatoires" });
    }

    try {
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
// Route pour récupérer tous les services (utile pour le formulaire de RDV)
router.get('/services', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM services');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Erreur lors de la récupération des services" });
    }
});

module.exports = router;
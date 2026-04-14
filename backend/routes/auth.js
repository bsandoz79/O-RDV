const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// --- INSCRIPTION ---
router.post('/register', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        // Sécurité SQL : Utilisation de requêtes préparées ✅ (Déjà bon)
        const [exists] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (exists.length > 0) return res.status(400).json({ error: "Email déjà utilisé" });

        // Hachage : Argon2 ou Bcrypt sont recommandés pour le niveau CDA ✅ (Déjà bon)
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // On définit le rôle par défaut pour éviter qu'un malin s'inscrive en 'admin' via Postman
        const finalRole = (role === 'admin') ? 'user' : (role || 'user'); 

        const [result] = await db.execute(
            'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            [email, hashedPassword, finalRole]
        );

        // --- MODIFICATION CDA ---
        // On s'assure que le rôle 'finalRole' est bien encodé dans le token pour le RBAC
        const token = jwt.sign(
            { id: result.insertId, role: finalRole }, 
            process.env.JWT_SECRET || 'secret', 
            { expiresIn: '24h' }
        );
        
        res.status(201).json({ 
            token, 
            user: { id: result.insertId, email, role: finalRole } 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CONNEXION ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: "Identifiants invalides" });

        const user = users[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: "Identifiants invalides" });

        // On génère le token avec l'ID et le ROLE pour que le middleware 'auth.js' puisse les lire
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET || 'secret', 
            { expiresIn: '24h' }
        );

        res.json({ 
            token, 
            user: { id: user.id, email: user.email, role: user.role } 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
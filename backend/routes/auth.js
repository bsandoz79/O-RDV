const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// --- INSCRIPTION ---
router.post('/register', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        const [exists] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (exists.length > 0) return res.status(400).json({ error: "Email déjà utilisé" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            [email, hashedPassword, role || 'user']
        );

        // On génère un token direct pour l'auto-login après inscription
        const token = jwt.sign({ id: result.insertId, role }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
        
        res.status(201).json({ 
            token, 
            user: { id: result.insertId, email, role: role || 'user' } 
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

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
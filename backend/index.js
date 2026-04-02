const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db'); // Import de la connexion MySQL (db.js)
require('dotenv').config();

// --- IMPORT DES ROUTES EXTERNES ---
const appointmentRoutes = require('./routes/appointments'); 

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json()); 

// --- UTILISATION DES ROUTES ---
// On lie le préfixe '/api/appointments' au fichier routes/appointments.js
app.use('/api/appointments', appointmentRoutes);

// --- ROUTES PRINCIPALES ---

/**
 * Route de test pour vérifier que le serveur tourne
 */
app.get('/', (req, res) => {
    res.send("Le serveur O'RDV est opérationnel ! 🚀");
});

/**
 * 1. Inscription (Register)
 */
app.post('/api/register', async (req, res) => {
    const { email, password, role } = req.body;

    try {
        const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ error: "Cet email est déjà utilisé." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role || 'user';

        const [result] = await db.execute(
            'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            [email, hashedPassword, userRole]
        );

        const token = jwt.sign(
            { id: result.insertId, role: userRole },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ 
            message: "Inscription et connexion réussies !", 
            token: token,
            user: { id: result.insertId, email: email, role: userRole }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur lors de l'inscription" });
    }
});

/**
 * 2. Connexion (Login)
 */
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ error: "Identifiants incorrects" });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Identifiants incorrects" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: "Connexion réussie",
            token,
            user: { id: user.id, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur serveur lors de la connexion" });
    }
});

// --- LANCEMENT DU SERVEUR ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur : http://localhost:${PORT}`);
    console.log(`Base de données cible : ${process.env.DB_NAME}`);
});
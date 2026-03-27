const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db'); // Import de la connexion MySQL (db.js)
require('dotenv').config();

const app = express();

// --- MIDDLEWARES ---
// Autorise le Frontend (React) à communiquer avec le Backend
app.use(cors());
// Permet de lire les données JSON envoyées dans les requêtes (req.body)
app.use(express.json()); 

// --- ROUTES ---

/**
 * Route de test pour vérifier que le serveur tourne
 */
app.get('/', (req, res) => {
    res.send("Le serveur O'RDV est opérationnel ! 🚀");
});

/**
 * 1. Inscription (Register)
 * Chiffre le mot de passe avant insertion en base de données
 */
app.post('/api/register', async (req, res) => {
    const { email, password, role } = req.body;

    try {
        // Hachage du mot de passe avec un "salt" de 10
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            [email, hashedPassword, role || 'user']
        );

        res.status(201).json({ 
            message: "Utilisateur créé avec succès !", 
            userId: result.insertId 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur lors de l'inscription (Email déjà utilisé ?)" });
    }
});

/**
 * 2. Connexion (Login)
 * Vérifie l'identité et génère un token JWT
 */
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Chercher l'utilisateur par son email
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ error: "Identifiants incorrects" });
        }

        const user = users[0];

        // 2. Comparer le mot de passe saisi avec le hash en base
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Identifiants incorrects" });
        }

        // 3. Générer le Token JWT (valide 24h)
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 4. Réponse au client
        res.json({
            message: "Connexion réussie",
            token,
            user: { 
                id: user.id, 
                email: user.email, 
                role: user.role 
            }
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
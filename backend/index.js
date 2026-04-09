const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// --- IMPORT DES ROUTES EXTERNES ---
const authRoutes = require('./routes/auth');        // Logique Login/Register
const shopRoutes = require('./routes/shop');        // Configuration Boutique (Profil, Services, Horaires, Image)
const appointmentRoutes = require('./routes/appointments'); 

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json()); 

// --- FICHIERS STATIQUES ---
// Rend le dossier 'uploads' public pour que le frontend puisse afficher les images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- UTILISATION DES ROUTES ---
// On segmente l'API par domaines de responsabilités
app.use('/api/auth', authRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/appointments', appointmentRoutes);

// --- ROUTES PRINCIPALES ---

/**
 * Route de test pour vérifier que le serveur tourne
 */
app.get('/', (req, res) => {
    res.send("Le serveur O'RDV est opérationnel ! 🚀");
});

// --- GESTION DES ERREURS 404 ---
app.use((req, res) => {
    res.status(404).json({ error: "Route non trouvée" });
});

// --- LANCEMENT DU SERVEUR ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`--------------------------------------------------`);
    console.log(`✅ Serveur démarré sur : http://localhost:${PORT}`);
    console.log(`📂 Dossier uploads : ${path.join(__dirname, 'uploads')}`);
    console.log(`🗄️  Base de données cible : ${process.env.DB_NAME}`);
    console.log(`--------------------------------------------------`);
});
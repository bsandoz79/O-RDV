const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const migrate = require('./migrate');

// Prisma retourne des BigInt pour les colonnes INT/COUNT MySQL — JSON.stringify ne les supporte pas nativement
BigInt.prototype.toJSON = function() { return Number(this); };

// --- IMPORT DES ROUTES EXTERNES ---
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');
const appointmentRoutes = require('./routes/appointments');
const userRoutes = require('./routes/user');
const reviewRoutes = require('./routes/reviews');
const adminRoutes  = require('./routes/admin');

const { apiLimiter } = require('./middlewares/rateLimiter');

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());
app.use('/api', apiLimiter);

// --- FICHIERS STATIQUES ---
// Rend le dossier 'uploads' public pour que le frontend puisse afficher les images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- UTILISATION DES ROUTES ---
// On segmente l'API par domaines de responsabilités
app.use('/api/auth', authRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

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
app.listen(PORT, async () => {
    console.log(`--------------------------------------------------`);
    console.log(`✅ Serveur démarré sur : http://localhost:${PORT}`);
    console.log(`📂 Dossier uploads : ${path.join(__dirname, 'uploads')}`);
    console.log(`🗄️  Base de données cible : ${process.env.DB_NAME}`);
    console.log(`--------------------------------------------------`);
    await migrate().catch(err => console.error('Migration échouée:', err.message));
});
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const db = require('../db');


// --- 1. CONFIGURATION DE L'UPLOAD IMAGE ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // On génère un nom unique : timestamp + extension d'origine
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- 2. RÉCUPÉRER TOUS LES PRESTATAIRES (POUR LA RECHERCHE) ---
router.get('/all', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM providers');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des prestataires" });
    }
});

// --- 3. RÉCUPÉRER LES INFOS D'UN PRESTATAIRE PRÉCIS (DASHBOARD) ---
router.get('/info/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // On cherche le prestataire lié à l'utilisateur
        const [providers] = await db.execute(
            'SELECT * FROM providers WHERE user_id = ?', 
            [userId]
        );

        if (providers.length === 0) {
            return res.status(404).json({ error: "Profil non trouvé" });
        }

        const provider = providers[0];

        // On cherche ses horaires associés
        const [hours] = await db.execute(
            'SELECT * FROM business_hours WHERE provider_id = ?',
            [provider.id]
        );

        res.json({ ...provider, hours });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- 4. ENREGISTRER / METTRE À JOUR LE PROFIL (SETUP) ---
router.post('/setup', upload.single('image'), async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        // On démarre une transaction pour s'assurer que TOUT est sauvé ou RIEN du tout
        await connection.beginTransaction();

        // Extraction des données envoyées par le Frontend
        const userId = req.body.provider_id;
        const profile = JSON.parse(req.body.profile);
        const hours = JSON.parse(req.body.hours); // Reçu en tableau [{}, {}]
        
        // Gestion de l'image (si une nouvelle image est uploadée)
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        // ÉTAPE A : Sauvegarde ou Mise à jour du Profil Prestataire
        const sqlProvider = `
            INSERT INTO providers (user_id, name, description, address, zip_code, city, phone, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            description = VALUES(description),
            address = VALUES(address),
            zip_code = VALUES(zip_code),
            city = VALUES(city),
            phone = VALUES(phone),
            image_url = IFNULL(VALUES(image_url), image_url)
        `;

        await connection.execute(sqlProvider, [
            userId, profile.name, profile.description, 
            profile.address, profile.zipCode, profile.city, 
            profile.phone, imageUrl
        ]);

        // ÉTAPE B : Récupérer l'ID interne du prestataire pour lier les horaires
        const [rows] = await connection.execute('SELECT id FROM providers WHERE user_id = ?', [userId]);
        const providerId = rows[0].id;

        // ÉTAPE C : Mise à jour des horaires (On supprime et on recrée)
        await connection.execute('DELETE FROM business_hours WHERE provider_id = ?', [providerId]);

        const sqlHours = `
            INSERT INTO business_hours (provider_id, day_of_week, open_time, close_time, is_closed)
            VALUES (?, ?, ?, ?, ?)
        `;

        // Boucle sur chaque jour envoyé par le front
        for (const h of hours) {
            await connection.execute(sqlHours, [
                providerId,
                h.day_of_week,
                h.open || '09:00',
                h.close || '18:00',
                h.closed ? 1 : 0
            ]);
        }

        // Si tout est OK, on valide définitivement
        await connection.commit();
        res.status(200).json({ message: "Configuration enregistrée avec succès !" });

    } catch (error) {
        // En cas d'erreur, on annule tout ce qui a été fait dans la transaction
        if (connection) await connection.rollback();
        console.error("Détail de l'erreur :", error);
        res.status(500).json({ error: error.message });
    } finally {
        // On libère la connexion à la base de données
        if (connection) connection.release();
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/roleGuard'); // Nouveau : pour le RBAC
const multer = require('multer');
const path = require('path');
const db = require('../db');

// --- 1. CONFIGURATION DE L'UPLOAD IMAGE ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- 2. LISTE DES CATÉGORIES ---
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM categories ORDER BY name');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des catégories" });
    }
});

// --- 3. RÉCUPÉRER TOUS LES PRESTATAIRES (RECHERCHE + FILTRE CATÉGORIE) ---
router.get('/all', async (req, res) => {
    try {
        const { category_id } = req.query;
        let sql = `
            SELECT p.*, c.name AS category_name, c.icon AS category_icon
            FROM providers p
            LEFT JOIN categories c ON p.category_id = c.id
        `;
        const params = [];
        if (category_id) {
            sql += ' WHERE p.category_id = ?';
            params.push(category_id);
        }
        const [rows] = await db.execute(sql, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des prestataires" });
    }
});

// --- 3. PROFIL PUBLIC D'UN PRESTATAIRE (par provider.id) ---
// Route publique : accessible sans token pour la page de détail client
router.get('/profile/:providerId', async (req, res) => {
    try {
        const providerId = req.params.providerId;

        const [providers] = await db.execute(
            'SELECT * FROM providers WHERE id = ?',
            [providerId]
        );

        if (providers.length === 0) {
            return res.status(404).json({ error: "Prestataire introuvable" });
        }

        const provider = providers[0];

        const [services] = await db.execute(
            'SELECT * FROM services WHERE provider_id = ?',
            [providerId]
        );

        const [hours] = await db.execute(
            'SELECT * FROM business_hours WHERE provider_id = ? ORDER BY FIELD(day_of_week, "lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche")',
            [providerId]
        );

        res.json({ ...provider, services, hours });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- 4. RÉCUPÉRER LES INFOS D'UN PRESTATAIRE (DASHBOARD) ---
// On ajoute 'auth' pour protéger les données du pro
router.get('/info/:userId', auth, async (req, res) => {
    try {
        const userId = req.params.userId;

        // Sécurité supplémentaire : Un pro ne peut voir que ses propres infos
        // (Sauf s'il est admin)
        if (req.auth.role !== 'admin' && req.auth.userId != userId) {
            return res.status(403).json({ error: "Accès non autorisé à ce profil" });
        }

        const [providers] = await db.execute(
            'SELECT * FROM providers WHERE user_id = ?', 
            [userId]
        );

        if (providers.length === 0) {
            return res.status(404).json({ error: "Profil non trouvé" });
        }

        const provider = providers[0];
        const [hours] = await db.execute(
            'SELECT * FROM business_hours WHERE provider_id = ?',
            [provider.id]
        );
        const [services] = await db.execute(
            'SELECT * FROM services WHERE provider_id = ?',
            [provider.id]
        );

        res.json({ ...provider, hours, services });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- 4. ENREGISTRER / METTRE À JOUR LE PROFIL (SETUP) ---
// On ajoute 'auth' ET 'checkRole' : Seuls les pros et admins peuvent modifier un shop
router.post('/setup', auth, checkRole(['pro', 'admin']), upload.single('image'), async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        // Sécurité : On utilise req.auth.userId issu du token au lieu du body
        // pour empêcher un utilisateur de modifier le profil d'un autre
        const userId = req.auth.userId; 
        
        const profile = JSON.parse(req.body.profile);
        const hours = JSON.parse(req.body.hours);
        const services = req.body.services ? JSON.parse(req.body.services) : [];
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const sqlProvider = `
            INSERT INTO providers (user_id, category_id, name, description, address, zip_code, city, phone, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            category_id = VALUES(category_id),
            name = VALUES(name),
            description = VALUES(description),
            address = VALUES(address),
            zip_code = VALUES(zip_code),
            city = VALUES(city),
            phone = VALUES(phone),
            image_url = IFNULL(VALUES(image_url), image_url)
        `;

        await connection.execute(sqlProvider, [
            userId, profile.categoryId || null, profile.name, profile.description,
            profile.address, profile.zipCode, profile.city,
            profile.phone, imageUrl
        ]);

        const [rows] = await connection.execute('SELECT id FROM providers WHERE user_id = ?', [userId]);
        const providerId = rows[0].id;

        // Supprimer et réinsérer les services
        await connection.execute('DELETE FROM services WHERE provider_id = ?', [providerId]);
        const sqlService = `INSERT INTO services (provider_id, label, price, duration) VALUES (?, ?, ?, ?)`;
        for (const s of services) {
            if (s.label && s.price) {
                await connection.execute(sqlService, [providerId, s.label, s.price, s.duration || 30]);
            }
        }

        await connection.execute('DELETE FROM business_hours WHERE provider_id = ?', [providerId]);

        const sqlHours = `
            INSERT INTO business_hours (provider_id, day_of_week, open_time, close_time, is_closed)
            VALUES (?, ?, ?, ?, ?)
        `;

        for (const h of hours) {
            await connection.execute(sqlHours, [
                providerId,
                h.day_of_week,
                h.open || '09:00',
                h.close || '18:00',
                h.closed ? 1 : 0
            ]);
        }

        await connection.commit();
        res.status(200).json({ message: "Configuration enregistrée avec succès !" });

    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;
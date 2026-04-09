const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// 1. Configuration du stockage des images (Multer)
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        // On génère un nom unique pour éviter les conflits
        cb(null, 'shop-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 2. Route complète pour configurer la boutique
// "upload.single('image')" permet de réceptionner le fichier nommé 'image'
router.post('/setup', upload.single('image'), async (req, res) => {
    try {
        // Avec FormData, les objets envoyés en JSON doivent être "parsés"
        const profile = JSON.parse(req.body.profile);
        const services = JSON.parse(req.body.services);
        const hours = JSON.parse(req.body.hours);
        const provider_id = req.body.provider_id;
        
        // On récupère le chemin de l'image si elle existe
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        // --- A. MISE À JOUR DU PROFIL PRESTATAIRE ---
        // On met à jour les infos que tu as ajoutées (zip_code, description, etc.)
        await db.execute(
            `UPDATE providers 
             SET name = ?, description = ?, address = ?, zip_code = ?, phone = ?, image_url = IFNULL(?, image_url) 
             WHERE id = ?`,
            [profile.name, profile.description, profile.address, profile.zipCode, profile.phone, image_url, provider_id]
        );

        // --- B. GESTION DES SERVICES (Nettoyage + Insertion) ---
        // On supprime les anciens services pour repartir sur du propre
        await db.execute("DELETE FROM services WHERE provider_id = ?", [provider_id]);
        for (let s of services) {
            if (s.label && s.price) { // On vérifie que le service n'est pas vide
                await db.execute(
                    "INSERT INTO services (provider_id, label, price, duration) VALUES (?, ?, ?, ?)",
                    [provider_id, s.label, s.price, s.duration]
                );
            }
        }

        // --- C. GESTION DES HORAIRES (Nettoyage + Insertion) ---
        await db.execute("DELETE FROM business_hours WHERE provider_id = ?", [provider_id]);
        for (let day in hours) {
            await db.execute(
                "INSERT INTO business_hours (provider_id, day_of_week, open_time, close_time, is_closed) VALUES (?, ?, ?, ?, ?)",
                [provider_id, day, hours[day].open, hours[day].close, hours[day].closed]
            );
        }

        res.status(200).json({ message: "Boutique mise à jour avec succès !" });

    } catch (err) {
        console.error("Erreur Backend Shop:", err);
        res.status(500).json({ error: "Erreur lors de l'enregistrement de la configuration" });
    }
});

module.exports = router;
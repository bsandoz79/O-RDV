const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/roleGuard');
const { uploadShopImage, uploadServiceImage, uploadGalleryPhoto } = require('../middlewares/upload');
const { getCategories, getAllProviders, getProviderProfile, getShopInfo, setupShop, getProviderPhotos, addProviderPhoto, deleteProviderPhoto, setMainPhoto } = require('../controllers/shopController');

// POST /api/shop/upload-service-image — upload rapide d'une image de prestation
router.post('/upload-service-image', auth, checkRole(['pro', 'admin']), (req, res, next) => {
    uploadServiceImage.single('image')(req, res, (err) => {
        if (err) return res.status(500).json({ error: 'Erreur upload : ' + err.message });
        next();
    });
}, (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier envoyé.' });
    res.json({ url: req.file.path });
});

router.get('/categories', getCategories);
router.get('/all', getAllProviders);
router.get('/profile/:providerId', getProviderProfile);
router.get('/info/:userId', auth, getShopInfo);
router.post('/setup', auth, checkRole(['pro', 'admin']), (req, res, next) => {
    uploadShopImage.single('image')(req, res, (err) => {
        if (err) {
            console.error('[Cloudinary upload error]', err.message);
            return res.status(500).json({ error: 'Erreur upload image : ' + err.message });
        }
        next();
    });
}, setupShop);

// Photos de galerie
router.get('/photos/:providerId', getProviderPhotos);
router.post('/photos', auth, checkRole(['pro', 'admin']), (req, res, next) => {
    uploadGalleryPhoto.single('photo')(req, res, (err) => {
        if (err) return res.status(500).json({ error: 'Erreur upload : ' + err.message });
        next();
    });
}, addProviderPhoto);
router.delete('/photos/:photoId', auth, checkRole(['pro', 'admin']), deleteProviderPhoto);
router.put('/photos/:photoId/main', auth, checkRole(['pro', 'admin']), setMainPhoto);

module.exports = router;

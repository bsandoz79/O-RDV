const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/roleGuard');
const { uploadShopImage } = require('../middlewares/upload');
const { getCategories, getAllProviders, getProviderProfile, getShopInfo, setupShop } = require('../controllers/shopController');

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

module.exports = router;

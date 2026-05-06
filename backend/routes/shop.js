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
router.post('/setup', auth, checkRole(['pro', 'admin']), uploadShopImage.single('image'), setupShop);

module.exports = router;

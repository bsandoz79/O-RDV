const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/roleGuard');
const { getCategories, getAllProviders, getProviderProfile, getShopInfo, setupShop } = require('../controllers/shopController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

router.get('/categories', getCategories);
router.get('/all', getAllProviders);
router.get('/profile/:providerId', getProviderProfile);
router.get('/info/:userId', auth, getShopInfo);
router.post('/setup', auth, checkRole(['pro', 'admin']), upload.single('image'), setupShop);

module.exports = router;

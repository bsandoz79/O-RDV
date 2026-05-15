const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { getFavorites, toggleFavorite } = require('../controllers/favoritesController');

router.get('/', auth, getFavorites);
router.post('/:providerId', auth, toggleFavorite);

module.exports = router;
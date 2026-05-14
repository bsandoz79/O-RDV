const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { createReview, getProviderReviews, toggleLike } = require('../controllers/reviewController');

router.post('/', auth, createReview);
router.get('/provider/:providerId', getProviderReviews);
router.post('/:id/like', auth, toggleLike);

module.exports = router;

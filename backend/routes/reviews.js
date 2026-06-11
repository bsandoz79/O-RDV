const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { createReview, getProviderReviews, toggleLike } = require('../controllers/reviewController');
const { validateCreateReview } = require('../middlewares/validate');

router.post('/',                    auth, validateCreateReview, createReview);
router.get('/provider/:providerId', getProviderReviews);
router.post('/:id/like',            auth, toggleLike);

module.exports = router;

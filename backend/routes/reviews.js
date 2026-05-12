const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { createReview, getProviderReviews } = require('../controllers/reviewController');

router.post('/', auth, createReview);
router.get('/provider/:providerId', getProviderReviews);

module.exports = router;

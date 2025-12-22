const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const verifyToken = require('../middleware/verifyToken');

router.post('/', verifyToken, ratingController.createRating);
router.get('/provider/:providerId', ratingController.getProviderRatings);
router.get('/average/:providerId', ratingController.getAverageRating);
router.get('/can-rate/:reservationId', verifyToken, ratingController.canRate);
router.get('/reservation/:reservationId', verifyToken, ratingController.getReservationRating);

module.exports = router;

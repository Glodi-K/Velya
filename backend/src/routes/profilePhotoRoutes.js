const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const verifyToken = require('../middleware/verifyToken');
const profilePhotoController = require('../controllers/profilePhotoController');

// Configuration multer pour les photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/profile-photos'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non autorisé'));
    }
  }
});

const profileController = require('../controllers/profileController');

// Routes client
router.post('/client/upload', verifyToken, upload.single('profilePhoto'), profilePhotoController.uploadClientProfilePhoto);
router.get('/client/:userId', profilePhotoController.getClientProfilePhoto);
router.get('/client/:userId/file', profilePhotoController.serveClientProfilePhoto);
router.put('/client/profile', verifyToken, upload.single('profilePhoto'), profileController.updateClientProfile);
router.get('/client/profile/me', verifyToken, profileController.getClientProfile);

// Routes prestataire
router.post('/provider/upload', verifyToken, upload.single('profilePhoto'), profilePhotoController.uploadProviderProfilePhoto);
router.get('/provider/:providerId', profilePhotoController.getProviderProfilePhoto);
router.get('/provider/:providerId/file', profilePhotoController.serveProviderProfilePhoto);
router.put('/provider/profile', verifyToken, upload.single('profilePhoto'), profileController.updateProviderProfile);
router.get('/provider/profile/me', verifyToken, profileController.getProviderProfile);

module.exports = router;

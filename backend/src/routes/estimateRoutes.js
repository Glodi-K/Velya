const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
//const estimateController = require('../controllers/estimateController');

// Stockage temporaire des images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/estimates/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

//router.post('/', upload.array('photos', 3), estimateController.analyzePhotos);

module.exports = router;


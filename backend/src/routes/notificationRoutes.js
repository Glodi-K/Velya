const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.warn('⚠️ Notifications: Token manquant');
    return res.status(401).json({ message: 'Token manquant' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Notifications: Token vérifié', { id: decoded.id, _id: decoded._id, role: decoded.role });
    req.user = decoded;
    next();
  } catch (error) {
    console.warn('⚠️ Notifications: Erreur token:', error.message);
    res.status(401).json({ message: 'Token invalide' });
  }
};

router.get('/', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/count', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const count = await Notification.countDocuments({ userId, read: false });
    res.json({ count });
  } catch (error) {
    console.error('❌ Erreur /count:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const count = await Notification.countDocuments({ userId, read: false });
    res.json({ count });
  } catch (error) {
    console.error('❌ Erreur /unread-count:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/messages/count', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const Message = require('../models/Message');
    // Compter les messages non lus (où l'utilisateur n'est pas dans readBy)
    const count = await Message.countDocuments({ 
      'readBy.user': { $ne: userId }
    });
    res.json({ count });
  } catch (error) {
    console.error('❌ Erreur /messages/count:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.patch('/:id/read', auth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.patch('/mark-all-read', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    await Notification.updateMany({ userId, read: false }, { read: true });
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur /mark-all-read:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

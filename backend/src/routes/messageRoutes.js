const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Envoyer un message
router.post('/send', async (req, res) => {
  try {
    const { sender, receiver, content } = req.body;
    const newMessage = new Message({ sender, receiver, content });
    await newMessage.save();
    res.status(201).json({ message: 'Message envoyé avec succès', newMessage });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l’envoi du message', error });
  }
});

// Récupérer l’historique entre un client et un prestataire
router.get('/history/:senderId/:receiverId', async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    }).sort({ timestamp: 1 });
    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des messages', error });
  }
});

module.exports = router;


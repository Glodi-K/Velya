const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const { createAndSendNotification } = require('../utils/notificationHelper');

/**
 * Créer ou récupérer une conversation
 */
const getOrCreateConversation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const userId = req.user.id;

    // Vérifier que la réservation existe
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }

    // Vérifier que l'utilisateur est impliqué dans cette réservation
    const isClient = reservation.client.toString() === userId;
    const isProvider = reservation.provider && reservation.provider.toString() === userId;
    
    if (!isClient && !isProvider) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à accéder à cette conversation" });
    }

    // Chercher une conversation existante
    let conversation = await Conversation.findOne({
      reservation: reservationId,
      participants: { $all: [reservation.client, reservation.provider] }
    }).populate('participants', 'name email role')
      .populate('lastMessage');

    // Si pas de conversation, en créer une
    if (!conversation) {
      conversation = new Conversation({
        participants: [reservation.client, reservation.provider],
        reservation: reservationId
      });
      await conversation.save();
      await conversation.populate('participants', 'name email role');
    }

    res.status(200).json({ conversation });
  } catch (error) {
    console.error("❌ Erreur création/récupération conversation:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * Récupérer les messages d'une conversation
 */
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Accès non autorisé à cette conversation" });
    }

    // Récupérer les messages avec pagination
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.status(200).json({ messages: messages.reverse() });
  } catch (error) {
    console.error("❌ Erreur récupération messages:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * Envoyer un message
 */
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType = 'text' } = req.body;
    const userId = req.user.id;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: "Le contenu du message ne peut pas être vide" });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Accès non autorisé à cette conversation" });
    }

    // Créer le message
    const message = new Message({
      conversation: conversationId,
      sender: userId,
      content: content.trim(),
      messageType
    });

    await message.save();
    await message.populate('sender', 'name role');

    // Mettre à jour la conversation
    conversation.lastMessage = message._id;
    conversation.lastActivity = new Date();
    await conversation.save();

    // Émettre le message via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversationId}`).emit('new_message', message);
    }

    // ✅ Créer une notification pour le destinataire
    try {
      const recipientId = conversation.participants.find(p => p.toString() !== userId);
      if (recipientId) {
        const senderName = (await User.findById(userId).select('name')) || { name: 'Quelqu\'un' };
        await createAndSendNotification(
          req.app,
          recipientId,
          '💬 Nouveau message',
          `${senderName.name} vous a envoyé un message: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
          'message'
        );
      }
    } catch (notificationError) {
      console.error('Erreur lors de la création de la notification de message:', notificationError);
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error("❌ Erreur envoi message:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * Marquer les messages comme lus
 */
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Accès non autorisé à cette conversation" });
    }

    // Marquer tous les messages non lus comme lus
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    );

    res.status(200).json({ message: "Messages marqués comme lus" });
  } catch (error) {
    console.error("❌ Erreur marquage lecture:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * Récupérer toutes les conversations d'un utilisateur
 */
const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'name email role')
      .populate('lastMessage')
      .populate('reservation', 'service date status')
      .sort({ lastActivity: -1 });

    res.status(200).json({ conversations });
  } catch (error) {
    console.error("❌ Erreur récupération conversations:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = {
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markAsRead,
  getUserConversations
};
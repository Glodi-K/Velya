const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { requireChatFeature } = require("../middleware/featureFlagMiddleware");
const {
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markAsRead,
  getUserConversations
} = require('../controllers/chatController');

// ✅ Appliquer le feature flag à toutes les routes chat
router.use(requireChatFeature);

/**
 * @route GET /api/chat/conversations
 * @desc Récupère toutes les conversations de l'utilisateur
 * @access Private
 */
router.get('/conversations', verifyToken, getUserConversations);

/**
 * @route GET /api/chat/reservation/:reservationId
 * @desc Créer ou récupérer une conversation pour une réservation
 * @access Private
 */
router.get('/reservation/:reservationId', verifyToken, getOrCreateConversation);

/**
 * @route GET /api/chat/:conversationId/messages
 * @desc Récupérer les messages d'une conversation
 * @access Private
 */
router.get('/:conversationId/messages', verifyToken, getMessages);

/**
 * @route POST /api/chat/:conversationId/messages
 * @desc Envoyer un message dans une conversation
 * @access Private
 */
router.post('/:conversationId/messages', verifyToken, sendMessage);

/**
 * @route PUT /api/chat/:conversationId/read
 * @desc Marquer les messages d'une conversation comme lus
 * @access Private
 */
router.put('/:conversationId/read', verifyToken, markAsRead);

module.exports = router;
const Notification = require('../models/Notification');
const User = require('../models/User');
const Prestataire = require('../models/PrestataireSimple');

const createAndSendNotification = async (app, userId, title, message, type = 'system') => {
  try {
    // Déterminer le type d'utilisateur
    let userModel = 'User';
    
    // Chercher dans PrestataireSimple d'abord
    let isProvider = await Prestataire.findById(userId);
    if (!isProvider) {
      // Chercher dans le modèle Prestataire complet
      const PrestataireComplet = require('../models/Prestataire');
      isProvider = await PrestataireComplet.findById(userId);
    }
    
    if (isProvider) {
      userModel = 'Prestataire';
    }

    // Créer la notification en base de données
    const notification = await Notification.create({
      userId,
      userModel,
      title,
      message,
      type,
      read: false
    });

    console.log(`🔔 Notification créée pour ${userModel} ${userId}:`, title);

    // Envoyer en temps réel via Socket.IO
    const sendRealtimeNotification = app.get('sendRealtimeNotification');
    if (sendRealtimeNotification) {
      sendRealtimeNotification(userId, {
        id: notification._id,
        title,
        message,
        type,
        createdAt: notification.createdAt
      });
    }

    return notification;
  } catch (error) {
    console.error('❌ Erreur création notification:', error);
    console.error('   Details:', error.message);
    return null;
  }
};

module.exports = { createAndSendNotification };
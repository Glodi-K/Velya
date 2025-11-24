const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    enum: ['User', 'Prestataire']
  },
  type: {
    type: String,
    enum: ['payment', 'reservation', 'mission', 'message', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '🔔'
  },
  read: {
    type: Boolean,
    default: false
  },
  link: {
    type: String
  },
  metadata: {
    type: Object,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);

// backend/server.js
// .env est déjà chargé par start-dev.js
const app = require("./src/app");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const { Server: EngineIOServer } = require("engine.io");
const cron = require("node-cron");
const initializeUploadsDir = require("./src/utils/initializeUploadsDir");

// Initialiser les dossiers d'uploads
initializeUploadsDir();

const server = http.createServer(app);

// Configuration WebSocket
if (EngineIOServer.prototype && EngineIOServer.prototype.opts) {
  EngineIOServer.prototype.opts.wsEngine = require("ws").Server;
}

// Connexion MongoDB
async function connectDatabase() {
  try {
    console.log("🔍 URI MongoDB utilisée:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connecté à:", mongoose.connection.db.databaseName);
  } catch (error) {
    console.error("❌ Erreur de connexion MongoDB :", error);
    process.exit(1);
  }
}

async function closeDatabase() {
  console.log("📌 Fermeture de MongoDB...");
  await mongoose.connection.close();
  console.log("📌 MongoDB déconnecté.");
}

// Configuration Socket.IO
const io = new Server(server, { 
  cors: {
    origin: function(origin, callback) {
      // Allow all origins in development
      return callback(null, true);
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    transports: ['websocket', 'polling']
  }
});

app.set("io", io);

// Gestion des connexions WebSocket
io.on("connection", (socket) => {
  console.log("🟢 Utilisateur connecté :", socket.id);

  // Rejoindre une room utilisateur pour les notifications
  socket.on("join_user", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Utilisateur ${socket.id} a rejoint la room user_${userId}`);
  });

  socket.on("join_conversation", (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`Utilisateur ${socket.id} a rejoint la conversation ${conversationId}`);
  });

  socket.on("send-message", (messageData) => {
    socket.broadcast.emit("receive-message", messageData);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Utilisateur déconnecté");
  });
});

// Fonction pour envoyer une notification en temps réel
const sendRealtimeNotification = (userId, notification) => {
  io.to(`user_${userId}`).emit("new_notification", notification);
};

app.set("sendRealtimeNotification", sendRealtimeNotification);

// Démarrage du serveur
const PORT = process.env.PORT || process.env.RAILWAY_PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0'; // Écouter sur toutes les interfaces

connectDatabase().then(() => {
  // Initialiser les dossiers d'uploads
  initializeUploadsDir();
  server.listen(PORT, HOST, () => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let localIP = 'localhost';
    
    for (const interfaceName in networkInterfaces) {
      const networkInterface = networkInterfaces[interfaceName];
      for (const network of networkInterface) {
        if (network.family === 'IPv4' && !network.internal && network.address.startsWith('192.168.')) {
          localIP = network.address;
          break;
        }
      }
    }
    
    console.log(`🚀 Serveur Velya Backend lancé sur http://${HOST}:${PORT}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📡 Accessible depuis le réseau local sur http://${localIP}:${PORT}`);
    }
  });
}).catch(err => {
  console.error('❌ Erreur lors du démarrage:', err);
  process.exit(1);
});

module.exports = { app, server, closeDatabase };
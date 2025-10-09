const fs = require("fs");
const path = require("path");

// 📝 Middleware de journalisation
const loggingMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Log de la requête
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: req.user?.id || null
  };

  // Intercepter la réponse
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    logData.statusCode = res.statusCode;
    logData.duration = duration;
    
    // Écrire dans le fichier de log
    const logDir = path.join(__dirname, "../logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logData) + "\n");
    
    // Log des erreurs en console
    if (res.statusCode >= 400) {
      console.error("❌ Erreur:", logData);
    }
    
    originalSend.call(this, data);
  };

  next();
};

// 🚨 Logger d'erreurs critiques
const errorLogger = (error, req, res, next) => {
  const errorData = {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    userId: req.user?.id || null
  };

  const logDir = path.join(__dirname, "../logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const errorFile = path.join(logDir, `errors-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(errorFile, JSON.stringify(errorData) + "\n");

  console.error("🚨 Erreur critique:", errorData);
  
  res.status(500).json({ message: "Erreur serveur interne" });
};

module.exports = { loggingMiddleware, errorLogger };
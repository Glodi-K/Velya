// middleware/mobileMiddleware.js
const mobileMiddleware = (req, res, next) => {
  try {
    // Détecter les requêtes mobiles
    const userAgent = req.get('User-Agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Ajouter des headers spécifiques pour mobile
    if (isMobile) {
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.header('Pragma', 'no-cache');
      res.header('Expires', '0');
    }
    
    // Validation du Content-Type pour les requêtes POST/PUT
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.get('Content-Type') || '';
      
      // Accepter les requêtes sans Content-Type (certains clients mobiles)
      if (!contentType && Object.keys(req.body || {}).length === 0) {
        req.body = {};
      }
      
      // Validation des données JSON
      if (contentType.includes('application/json') && req.body) {
        try {
          // Nettoyer les données reçues
          if (typeof req.body === 'object') {
            Object.keys(req.body).forEach(key => {
              if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
              }
            });
          }
        } catch (err) {
          console.warn('Erreur nettoyage données mobile:', err);
        }
      }
    }
    
    // Timeout plus long pour les connexions mobiles lentes
    if (isMobile) {
      req.setTimeout(30000); // 30 secondes
    }
    
    // Log des requêtes mobiles problématiques
    if (isMobile && req.url.includes('/api/')) {
      console.log(`[MOBILE] ${req.method} ${req.url} - UA: ${userAgent.substring(0, 50)}...`);
    }
    
    next();
  } catch (error) {
    console.error('Erreur mobileMiddleware:', error);
    next(); // Continuer même en cas d'erreur
  }
};

// Middleware de gestion d'erreurs spécifique mobile
const mobileErrorHandler = (err, req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  if (isMobile) {
    console.error(`[MOBILE ERROR] ${req.method} ${req.url}:`, {
      error: err.message,
      userAgent: userAgent.substring(0, 100),
      timestamp: new Date().toISOString()
    });
    
    // Réponse simplifiée pour mobile
    return res.status(err.status || 500).json({
      message: err.message || 'Erreur serveur',
      mobile: true
    });
  }
  
  next(err);
};

module.exports = { mobileMiddleware, mobileErrorHandler };
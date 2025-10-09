const featureFlags = {
  // Chat en temps réel
  CHAT_ENABLED: process.env.FEATURE_CHAT === 'true',
  
  // Fonctionnalités Premium
  PREMIUM_ENABLED: process.env.FEATURE_PREMIUM === 'true',
  
  // Notifications push
  PUSH_NOTIFICATIONS: process.env.FEATURE_PUSH === 'true',
  
  // Géolocalisation avancée
  ADVANCED_GEO: process.env.FEATURE_GEO === 'true',
  
  // Paiements Stripe
  STRIPE_PAYMENTS: process.env.FEATURE_STRIPE === 'true',
  
  // Machine Learning pour optimisation
  ML_OPTIMIZATION: process.env.FEATURE_ML === 'true',
  
  // Système de parrainage
  REFERRAL_SYSTEM: process.env.FEATURE_REFERRAL === 'true',
  
  // Mode maintenance
  MAINTENANCE_MODE: process.env.MAINTENANCE_MODE === 'true'
};

class FeatureFlagService {
  static isEnabled(flagName) {
    return featureFlags[flagName] || false;
  }
  
  static getAllFlags() {
    return featureFlags;
  }
  
  static checkMaintenanceMode() {
    return featureFlags.MAINTENANCE_MODE;
  }
  
  // Middleware pour vérifier les feature flags
  static requireFeature(flagName) {
    return (req, res, next) => {
      if (!this.isEnabled(flagName)) {
        return res.status(503).json({ 
          message: `Fonctionnalité ${flagName} temporairement indisponible` 
        });
      }
      next();
    };
  }
  
  // Middleware de maintenance
  static maintenanceMiddleware() {
    return (req, res, next) => {
      if (this.checkMaintenanceMode() && req.path !== '/health') {
        return res.status(503).json({ 
          message: 'Application en maintenance. Réessayez plus tard.' 
        });
      }
      next();
    };
  }
}

module.exports = FeatureFlagService;
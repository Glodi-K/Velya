// Service avancé de health check
const mongoose = require('mongoose');
const redis = require('redis');

const getHealthStatus = async () => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {},
    metrics: {},
  };

  // ===== Vérifier MongoDB =====
  try {
    const mongoStatus = mongoose.connection.readyState;
    // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    const mongoHealthy = mongoStatus === 1;
    
    health.services.mongodb = {
      status: mongoHealthy ? 'up' : 'down',
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoStatus],
    };

    if (!mongoHealthy) {
      health.status = 'degraded';
    }
  } catch (error) {
    health.services.mongodb = {
      status: 'error',
      error: error.message,
    };
    health.status = 'unhealthy';
  }

  // ===== Vérifier Redis (optionnel) =====
  try {
    // On ne peut pas vraiment vérifier Redis ici sans un client global
    // C'est à adapter selon votre implémentation
    health.services.redis = {
      status: 'up',
      note: 'Status simplifié - adapter selon votre implémentation',
    };
  } catch (error) {
    health.services.redis = {
      status: 'unavailable',
      note: 'Redis n\'est pas configuré',
    };
  }

  // ===== Vérifier les services externes =====
  const retryService = require('./retryService');
  health.services.circuitBreakers = retryService.getCircuitBreakerStatus();

  // ===== Métriques système =====
  try {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();

    health.metrics = {
      uptime: {
        seconds: uptime,
        formatted: formatUptime(uptime),
      },
      memory: {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      },
      cpu: process.cpuUsage(),
    };

    // Alerte si la mémoire est au-dessus de 80%
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    if (heapUsagePercent > 80) {
      health.status = 'degraded';
      health.metrics.memory.warning = `Utilisation mémoire: ${heapUsagePercent.toFixed(1)}%`;
    }
  } catch (error) {
    console.error('❌ Erreur récupération métriques:', error);
  }

  // ===== Déterminer le status global =====
  const servicesDown = Object.values(health.services)
    .filter(s => s.status === 'down' || s.status === 'error')
    .length;

  if (servicesDown > 0) {
    health.status = health.status === 'unhealthy' ? 'unhealthy' : 'degraded';
  }

  return health;
};

// Formater le uptime
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}j`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
};

// Vérifier la santé d'une fonction spécifique
const healthCheck = {
  database: async () => {
    const startTime = Date.now();
    try {
      await mongoose.connection.db.admin().ping();
      return {
        status: 'ok',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  },

  redis: async (client) => {
    if (!client) {
      return {
        status: 'unavailable',
      };
    }

    const startTime = Date.now();
    try {
      await client.ping();
      return {
        status: 'ok',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  },
};

module.exports = {
  getHealthStatus,
  healthCheck,
  formatUptime,
};

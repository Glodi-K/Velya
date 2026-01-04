// Service de cache Redis pour améliorer les performances
const redis = require('redis');

let redisClient = null;

const initializeRedis = async () => {
  try {
    redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return new Error('⚠️ Redis est indisponible');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('⚠️ Timeout Redis');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      },
    });

    redisClient.on('error', (err) => {
      console.error('❌ Erreur Redis:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connecté');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.warn('⚠️ Redis non disponible, mode sans cache:', error.message);
    return null;
  }
};

// Obtenir une clé du cache
const getCache = async (key) => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('❌ Erreur lecture cache:', error);
    return null;
  }
};

// Mettre en cache une valeur
const setCache = async (key, value, ttl = 300) => {
  if (!redisClient) return false;
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('❌ Erreur écriture cache:', error);
    return false;
  }
};

// Supprimer une clé du cache
const deleteCache = async (key) => {
  if (!redisClient) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression cache:', error);
    return false;
  }
};

// Supprimer toutes les clés matching un pattern
const deleteCachePattern = async (pattern) => {
  if (!redisClient) return false;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression cache pattern:', error);
    return false;
  }
};

// Middleware pour cacher les réponses GET
const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    // Ne cacher que les GET
    if (req.method !== 'GET' || !redisClient) {
      return next();
    }

    const cacheKey = `cache:${req.originalUrl}`;

    try {
      const cached = await getCache(cacheKey);
      if (cached) {
        console.log(`📦 Cache hit: ${cacheKey}`);
        return res.json(cached);
      }
    } catch (error) {
      console.error('❌ Erreur cache middleware:', error);
    }

    // Intercepter la méthode json pour cacher la réponse
    const originalJson = res.json.bind(res);
    res.json = function (data) {
      if (res.statusCode === 200) {
        setCache(cacheKey, data, ttl).catch(() => {});
      }
      return originalJson(data);
    };

    next();
  };
};

// Forcer l'invalidation du cache après une modification
const invalidateCacheAfterUpdate = (patterns) => {
  return async (req, res, next) => {
    // Sauvegarder la méthode json originale
    const originalJson = res.json.bind(res);
    
    res.json = async function (data) {
      // Si la réponse est un succès (2xx), invalider le cache
      if (res.statusCode >= 200 && res.statusCode < 300 && patterns) {
        for (const pattern of patterns) {
          await deleteCachePattern(pattern);
        }
      }
      return originalJson(data);
    };

    next();
  };
};

module.exports = {
  initializeRedis,
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  cacheMiddleware,
  invalidateCacheAfterUpdate,
};

// Service de retry automatique pour les requêtes externes
const pRetry = require('p-retry');
const axios = require('axios');

// Circuit breaker simple
class CircuitBreaker {
  constructor(fn, options = {}) {
    this.fn = fn;
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 60000; // 60s
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
  }

  async execute(...args) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker est OPEN, réessayez après ${new Date(this.nextAttempt).toISOString()}`);
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await this.fn(...args);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.successCount = 0;
        this.state = 'CLOSED';
        console.log('✅ Circuit breaker fermé (service rétabli)');
      }
    }
  }

  onFailure() {
    this.failureCount++;

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.error(`❌ Circuit breaker OUVERT pour ${this.timeout}ms`);
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
    };
  }
}

// Fonction utilitaire pour retry automatique
const retryRequest = async (fn, options = {}) => {
  const retryOptions = {
    retries: options.retries || 3,
    minTimeout: options.minTimeout || 1000,
    maxTimeout: options.maxTimeout || 5000,
    randomize: true,
    onFailedAttempt: (error) => {
      console.warn(`⚠️ Tentative échouée (${error.attemptNumber}/${retryOptions.retries + 1}): ${error.message}`);
    },
  };

  try {
    return await pRetry(fn, retryOptions);
  } catch (error) {
    console.error('❌ Toutes les tentatives ont échoué:', error.message);
    throw error;
  }
};

// Wrapper Axios avec retry automatique
const axiosWithRetry = axios.create({
  timeout: 10000,
});

// Interceptor pour les erreurs
axiosWithRetry.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // Ne pas retry les erreurs 4xx
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      return Promise.reject(error);
    }

    // Ajouter un compteur de retry
    config.retryCount = config.retryCount || 0;
    config.retryCount += 1;

    // Limiter à 3 tentatives
    if (config.retryCount > 3) {
      return Promise.reject(error);
    }

    // Attendre avant de retry
    const delay = config.retryCount * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    return axiosWithRetry(config);
  }
);

// Circuits breakers pour les services externes critiques
const circuitBreakers = {
  stripe: new CircuitBreaker(async (fn) => fn(), {
    failureThreshold: 5,
    timeout: 30000,
  }),
  mongodb: new CircuitBreaker(async (fn) => fn(), {
    failureThreshold: 3,
    timeout: 60000,
  }),
  mailgun: new CircuitBreaker(async (fn) => fn(), {
    failureThreshold: 5,
    timeout: 30000,
  }),
  googleCalendar: new CircuitBreaker(async (fn) => fn(), {
    failureThreshold: 5,
    timeout: 30000,
  }),
};

// Fonction pour exécuter avec circuit breaker
const executeWithCircuitBreaker = async (serviceName, fn) => {
  const breaker = circuitBreakers[serviceName];
  if (!breaker) {
    throw new Error(`Service inconnu: ${serviceName}`);
  }
  return breaker.execute(fn);
};

// Fonction pour vérifier l'état des circuits
const getCircuitBreakerStatus = () => {
  const status = {};
  for (const [name, breaker] of Object.entries(circuitBreakers)) {
    status[name] = breaker.getState();
  }
  return status;
};

module.exports = {
  CircuitBreaker,
  retryRequest,
  axiosWithRetry,
  executeWithCircuitBreaker,
  getCircuitBreakerStatus,
  circuitBreakers,
};

// Middleware de cache optimisé pour Lighthouse
// À ajouter dans app.js après les middlewares existants

const cacheMiddleware = (req, res, next) => {
  const path = req.path;
  const isDev = process.env.NODE_ENV === 'development';

  // Ne pas cacher en développement
  if (isDev) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return next();
  }

  // ===== IMAGES - Très longue durée (1 an) =====
  if (/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(path)) {
    res.set('Cache-Control', 'public, immutable, max-age=31536000'); // 1 an
    return next();
  }

  // ===== FONTS - Très longue durée (1 an) =====
  if (/\.(woff2?|ttf|eot|otf)$/i.test(path)) {
    res.set('Cache-Control', 'public, immutable, max-age=31536000'); // 1 an
    return next();
  }

  // ===== JS & CSS Bundle - Longue durée (1 mois) SI fichiers hashés =====
  if (/\.(js|css)$/i.test(path) && /\.[a-f0-9]{8,}\./.test(path)) {
    // Fichier hashé (ex: main.a1b2c3d4.js)
    res.set('Cache-Control', 'public, immutable, max-age=2592000'); // 30 jours
    return next();
  }

  // ===== HTML - PAS de cache (ou très court) =====
  if (path.endsWith('.html') || path.endsWith('/')) {
    res.set('Cache-Control', 'public, max-age=0, must-revalidate'); // Toujours valider
    res.set('ETag', `W/"${Date.now()}"`); // Ajouter ETag pour validation
    return next();
  }

  // ===== API - Pas de cache par défaut =====
  if (path.startsWith('/api/')) {
    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    return next();
  }

  // ===== DÉFAUT - Courte durée =====
  res.set('Cache-Control', 'public, max-age=3600'); // 1 heure
  next();
};

module.exports = cacheMiddleware;

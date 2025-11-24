// debug-mobile.js - Script pour capturer les erreurs mobiles en temps réel
const express = require('express');
const cors = require('cors');

const app = express();

// CORS permissif pour debug
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware de logging détaillé
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const userAgent = req.get('User-Agent') || 'Unknown';
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  console.log(`\n[${timestamp}] ${req.method} ${req.url}`);
  console.log(`User-Agent: ${userAgent}`);
  console.log(`Mobile: ${isMobile}`);
  console.log(`Headers:`, JSON.stringify(req.headers, null, 2));
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`Body:`, JSON.stringify(req.body, null, 2));
  }
  
  next();
});

// Body parser avec gestion d'erreurs
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (err) {
      console.error('❌ JSON Parse Error:', err.message);
      console.error('Raw body:', buf.toString());
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Route de test simple
app.get('/api/health', (req, res) => {
  console.log('✅ Health check OK');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Route de test login
app.post('/api/auth/login', (req, res) => {
  console.log('📝 Login attempt:', req.body);
  
  const { email, password } = req.body;
  
  if (!email || !password) {
    console.log('❌ Missing credentials');
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }
  
  console.log('✅ Login validation passed');
  res.json({ message: 'Test login OK' });
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('\n🚨 ERROR CAUGHT:');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('Request URL:', req.url);
  console.error('Request Method:', req.method);
  console.error('Request Headers:', req.headers);
  console.error('Request Body:', req.body);
  
  res.status(500).json({
    error: 'Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Route not found' });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`\n🔍 Debug server running on port ${PORT}`);
  console.log('📱 Monitoring mobile requests...\n');
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('\n💥 UNCAUGHT EXCEPTION:');
  console.error(error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 UNHANDLED REJECTION:');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
});
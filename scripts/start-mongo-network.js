// scripts/start-mongo-network.js
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage MongoDB avec accès réseau...');

const mongoPath = 'C:\\MongoDB\\bin\\mongod.exe';
const dbPath = 'C:\\data\\db';

const mongod = spawn(mongoPath, [
  '--dbpath', dbPath,
  '--bind_ip', '0.0.0.0',  // Écouter sur toutes les interfaces
  '--port', '27017'
], {
  stdio: 'inherit'
});

mongod.on('error', (err) => {
  console.error('❌ Erreur MongoDB:', err);
});

mongod.on('close', (code) => {
  console.log(`📌 MongoDB fermé avec le code ${code}`);
});

console.log('✅ MongoDB démarré avec accès réseau');
console.log('📡 Accessible depuis le réseau local sur port 27017');
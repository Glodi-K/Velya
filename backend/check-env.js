// Script pour vérifier les variables d'environnement
require('dotenv').config({ path: '.env' });

console.log('=== Vérification des variables d\'environnement ===\n');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('BACKEND_URL:', process.env.BACKEND_URL);
console.log('PORT:', process.env.PORT);
console.log('\n=== Fin de la vérification ===');

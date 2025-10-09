// scripts/testSimpleOptimization.js
const { spawn } = require('child_process');
const path = require('path');

// Données de test
const testData = {
  startLocation: [48.8566, 2.3522], // Paris
  destinations: [
    {
      id: '1',
      location: [48.8744, 2.3526], // Montmartre
      details: { clientName: 'Client 1', time: '10:00', service: 'Nettoyage standard' }
    },
    {
      id: '2',
      location: [48.8606, 2.3376], // Louvre
      details: { clientName: 'Client 2', time: '14:00', service: 'Nettoyage vitres' }
    },
    {
      id: '3',
      location: [48.8530, 2.3499], // Notre Dame
      details: { clientName: 'Client 3', time: '16:00', service: 'Grand ménage' }
    }
  ]
};

console.log('Test d\'optimisation de trajet simplifié...');
console.log('Données:', JSON.stringify(testData, null, 2));

// Appeler le script Python simplifié directement
const pythonProcess = spawn('python', [
  path.join(__dirname, '../ml/simple_optimize.py')
]);

// Envoyer les données au script Python
pythonProcess.stdin.write(JSON.stringify(testData));
pythonProcess.stdin.end();

// Récupérer la sortie du script Python
let result = '';
let errorOutput = '';

pythonProcess.stdout.on('data', (data) => {
  result += data.toString();
});

pythonProcess.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.error(`Erreur Python: ${data}`);
});

pythonProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`Le script Python s'est terminé avec le code ${code}`);
    console.error('Erreur:', errorOutput);
    return;
  }
  
  try {
    const optimizedRoute = JSON.parse(result);
    console.log('\nRésultat de l\'optimisation:');
    console.log('Ordre optimisé:');
    optimizedRoute.forEach((dest, index) => {
      console.log(`${index + 1}. ${dest.details.clientName} - ${dest.details.service} à ${dest.details.time}`);
    });
  } catch (error) {
    console.error('Erreur lors du parsing du résultat JSON:', error);
    console.error('Résultat brut:', result);
  }
});
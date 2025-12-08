// Script pour tuer les processus sur un port donné
const { exec } = require('child_process');

const port = process.argv[2];

if (!port) {
  console.log('Usage: node kill-port.js <port>');
  process.exit(1);
}

console.log(`🔍 Recherche des processus sur le port ${port}...`);

// Commande Windows pour trouver et tuer les processus sur un port
const findCommand = `netstat -ano | findstr :${port}`;

exec(findCommand, (error, stdout, stderr) => {
  if (error) {
    console.log(`✅ Aucun processus trouvé sur le port ${port}`);
    return;
  }

  const lines = stdout.split('\n').filter(line => line.trim());
  const pids = new Set();

  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 5) {
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        pids.add(pid);
      }
    }
  });

  if (pids.size === 0) {
    console.log(`✅ Aucun processus actif sur le port ${port}`);
    return;
  }

  console.log(`🔫 Arrêt des processus: ${Array.from(pids).join(', ')}`);

  pids.forEach(pid => {
    exec(`taskkill /PID ${pid} /F`, (killError) => {
      if (killError) {
        console.log(`❌ Erreur lors de l'arrêt du processus ${pid}`);
      } else {
        console.log(`✅ Processus ${pid} arrêté`);
      }
    });
  });
});
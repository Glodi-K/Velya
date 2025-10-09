const { PythonShell } = require('python-shell');
const path = require('path');

// ✅ Données de test
const inputData = {
  distance_km: 12.5,
  time_of_day: 14,
  is_urgent: 1
};

// ✅ Options pour PythonShell
const options = {
  mode: 'text',
  pythonOptions: ['-u'],
  scriptPath: path.join(__dirname, '../../ml'), // Adapté à ta structure
  args: [JSON.stringify(inputData)],
  timeout: 10
};

console.log("📤 Lancement du script Python avec :");
console.dir(options, { depth: null });

PythonShell.run('predict.py', options, (err, results) => {
  if (err) {
    console.error("❌ Erreur lors de l'exécution du script Python :", err);
    return;
  }

  console.log("📨 Résultat brut reçu de Python :", results);

  try {
    const output = JSON.parse(results[0]);
    console.log("✅ Résultat analysé :", output);
  } catch (parseErr) {
    console.error("❌ Erreur de parsing JSON :", parseErr);
  }
});


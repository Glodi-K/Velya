const { PythonShell } = require('python-shell');
const path = require('path');

const inputData = {
  distance_km: 12.5,
  time_of_day: 14,
  is_urgent: 1,
};

const options = {
  mode: 'text',
  pythonOptions: ['-u'],
  scriptPath: path.join(__dirname, '../../ml'), // Chemin correct
  args: [JSON.stringify(inputData)],
  timeout: 10
};

console.log("📤 Lancement du script Python avec :", options);

PythonShell.run('predict.py', options, (err, results) => {
  if (err) {
    console.error("❌ Erreur PythonShell :", err);
    return;
  }

  console.log("📨 Résultat brut reçu de Python :", results); // 🔥 Ici on veut voir le contenu

  try {
    const output = JSON.parse(results[0]);
    console.log("✅ Résultat JSON analysé :", output);
  } catch (parseErr) {
    console.error("❌ Erreur parsing JSON :", parseErr);
  }
});


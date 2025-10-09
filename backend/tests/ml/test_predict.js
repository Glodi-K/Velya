const axios = require('axios');

async function testPrediction() {
  try {
    console.log("📤 Envoi des données vers l’API…");

    const response = await axios.post(
      'http://localhost:5001/api/predictions/predict-duree',
      {
        distance_km: 12.5,
        time_of_day: 14,
        is_urgent: 1,
      },
      {
        timeout: 10000, // ⏱️ max103 secondes d'attente
      }
    );

    console.log("✅ Résultat de la prédiction :", response.data);
  } catch (error) {
    console.error(
      "❌ Erreur lors de la prédiction :",
      error.response ? error.response.data : error.message
    );
  }
}

testPrediction();


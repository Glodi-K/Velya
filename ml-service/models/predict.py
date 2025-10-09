import sys
import joblib
import json

# print("✅ Script Python lancé")

# 📥 Charger les données passées en argument JSON
input_json = sys.argv[1]
# print("📨 Données reçues :", input_json)
inputs = json.loads(input_json)

# 📦 Charger le modèle
# print("📦 Chargement du modèle...")
try:
    model = joblib.load('ml/model.pkl')
    # print("✅ Modèle chargé avec succès")
except Exception as e:
    # print("❌ Erreur lors du chargement du modèle :", e)
    sys.exit(1)

# 🧮 Extraire les features
# print("🔍 Préparation des features")
X = [[
    inputs['distance_km'],
    inputs['time_of_day'],
    inputs['is_urgent']
]]

# 🧠 Prédiction
# print("🧠 Lancement de la prédiction...")
try:
    prediction = model.predict(X)[0]
  # print("✅ Prédiction réalisée :", prediction)
except Exception as e:
  # print("❌ Erreur de prédiction :", e)
    sys.exit(1)

# 🧾 Retour JSON
result = { "predicted_duration": round(prediction, 2) }
# print("📤 Résultat JSON :", json.dumps(result))
print(json.dumps(result))  # <= c’est ça que PythonShell attend


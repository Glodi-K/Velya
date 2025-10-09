import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import joblib
import os

# 📊 Données simulées (trajets)
data = pd.DataFrame({
    'distance_km': np.random.uniform(1, 30, 200),        # distance du trajet
    'time_of_day': np.random.randint(0, 24, 200),        # heure de la journée (0–23)
    'is_urgent': np.random.randint(0, 2, 200),           # 1 si urgent, 0 sinon
    'duration_minutes': np.random.uniform(10, 90, 200)   # durée réelle du trajet
})

# 🧪 Séparation des features et de la cible
X = data[['distance_km', 'time_of_day', 'is_urgent']]
y = data['duration_minutes']

# 🎓 Split train/test
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 🚀 Entraînement du modèle
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 📈 Évaluation rapide
y_pred = model.predict(X_test)
mse = mean_squared_error(y_test, y_pred)
print(f"📊 Erreur quadratique moyenne : {mse:.2f} minutes²")

# 💾 Sauvegarde du modèle
output_dir = "ml"
model_path = os.path.join(output_dir, "model.pkl")
joblib.dump(model, model_path)
print(f"✅ Modèle sauvegardé dans {model_path}")


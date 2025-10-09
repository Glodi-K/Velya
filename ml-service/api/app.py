#!/usr/bin/env python3
# ml-service/api/app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import joblib
import numpy as np
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

app = Flask(__name__)
CORS(app)

# Charger les modèles ML
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models')

try:
    price_model = joblib.load(os.path.join(MODEL_PATH, 'model.pkl'))
    route_model = joblib.load(os.path.join(MODEL_PATH, 'route_model.pkl'))
    print("Modeles ML charges avec succes")
except Exception as e:
    print(f"Erreur lors du chargement des modeles: {e}")
    price_model = None
    route_model = None

@app.route('/health', methods=['GET'])
def health_check():
    """Point de santé du service ML"""
    return jsonify({
        'status': 'OK',
        'service': 'Velya ML Service',
        'models_loaded': {
            'price_model': price_model is not None,
            'route_model': route_model is not None
        }
    })

@app.route('/predict-price', methods=['POST'])
def predict_price():
    """Prédiction de prix basée sur les paramètres de nettoyage"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Aucune donnée fournie'}), 400
        
        if price_model is None:
            return jsonify({'error': 'Modèle de prix non disponible'}), 503
        
        # Extraire les features nécessaires
        features = [
            data.get('surface', 0),
            data.get('rooms', 0),
            data.get('bathrooms', 0),
            data.get('difficulty', 1),
            data.get('frequency', 1)
        ]
        
        # Prédiction
        prediction = price_model.predict([features])[0]
        
        return jsonify({
            'predicted_price': round(prediction, 2),
            'currency': 'EUR'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict-trajet', methods=['POST'])
def predict_route():
    """Optimisation de trajet pour les prestataires"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Aucune donnée fournie'}), 400
        
        # Simulation d'optimisation de trajet
        # En production, utiliser un vrai algorithme d'optimisation
        locations = data.get('locations', [])
        
        if len(locations) < 2:
            return jsonify({'error': 'Au moins 2 locations requises'}), 400
        
        # Algorithme simple de tri par proximité
        optimized_route = locations.copy()
        total_distance = sum(range(len(locations)))  # Simulation
        estimated_time = total_distance * 5  # 5 min par segment
        
        return jsonify({
            'optimized_route': optimized_route,
            'total_distance_km': total_distance,
            'estimated_time_minutes': estimated_time,
            'savings_percent': 15  # Simulation d'économie
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint non trouvé'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Erreur interne du serveur'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('ML_PORT', 5002))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"Service ML Velya demarre sur le port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
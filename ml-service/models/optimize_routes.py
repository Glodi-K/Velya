#!/usr/bin/env python3
# ml/optimize_routes.py
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import pickle
import os
import sys
import json

class RouteOptimizer:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.model_path = os.path.join(os.path.dirname(__file__), 'route_model.pkl')
        self.load_or_train_model()
    
    def load_or_train_model(self):
        """Charge le modèle existant ou en entraîne un nouveau"""
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, 'rb') as f:
                    loaded_data = pickle.load(f)
                    if isinstance(loaded_data, dict):
                        self.model = loaded_data.get('model')
                        self.scaler = loaded_data.get('scaler', StandardScaler())
                    else:
                        self.model = loaded_data
                        # Créer un nouveau scaler si nécessaire
                        self.scaler = StandardScaler()
            except Exception as e:
                print(f"Erreur lors du chargement du modèle: {e}")
                self._train_new_model()
        else:
            # Données d'exemple pour l'entraînement initial
            # Dans un cas réel, ces données viendraient de votre historique de trajets
            sample_data = {
                'distance': np.random.uniform(1, 20, 100),  # km
                'time_of_day': np.random.randint(0, 24, 100),  # heure
                'day_of_week': np.random.randint(0, 7, 100),  # jour
                'traffic_level': np.random.uniform(0, 1, 100),  # niveau de trafic
                'travel_time': []  # temps de trajet (cible)
            }
            
            # Simuler des temps de trajet basés sur les features
            for i in range(100):
                base_time = sample_data['distance'][i] * 3  # 3 min par km
                time_factor = 1 + 0.5 * (sample_data['time_of_day'][i] >= 7 and sample_data['time_of_day'][i] <= 9)  # heure de pointe du matin
                time_factor += 0.7 * (sample_data['time_of_day'][i] >= 16 and sample_data['time_of_day'][i] <= 19)  # heure de pointe du soir
                time_factor += 0.3 * sample_data['traffic_level'][i]  # facteur de trafic
                sample_data['travel_time'].append(base_time * time_factor)
            
            # Créer un DataFrame
            df = pd.DataFrame(sample_data)
            
            # Préparer les données
            X = df[['distance', 'time_of_day', 'day_of_week', 'traffic_level']]
            y = df['travel_time']
            
            # Normaliser les features
            X_scaled = self.scaler.fit_transform(X)
            
            # Entraîner le modèle
            self._train_new_model()
    
    def _train_new_model(self):
        """Entraîne un nouveau modèle"""
        # Données d'exemple pour l'entraînement initial
        sample_data = {
            'distance': np.random.uniform(1, 20, 100),  # km
            'time_of_day': np.random.randint(0, 24, 100),  # heure
            'day_of_week': np.random.randint(0, 7, 100),  # jour
            'traffic_level': np.random.uniform(0, 1, 100),  # niveau de trafic
            'travel_time': []  # temps de trajet (cible)
        }
        
        # Simuler des temps de trajet basés sur les features
        for i in range(100):
            base_time = sample_data['distance'][i] * 3  # 3 min par km
            time_factor = 1 + 0.5 * (sample_data['time_of_day'][i] >= 7 and sample_data['time_of_day'][i] <= 9)  # heure de pointe du matin
            time_factor += 0.7 * (sample_data['time_of_day'][i] >= 16 and sample_data['time_of_day'][i] <= 19)  # heure de pointe du soir
            time_factor += 0.3 * sample_data['traffic_level'][i]  # facteur de trafic
            sample_data['travel_time'].append(base_time * time_factor)
        
        # Créer un DataFrame
        df = pd.DataFrame(sample_data)
        
        # Préparer les données
        X = df[['distance', 'time_of_day', 'day_of_week', 'traffic_level']]
        y = df['travel_time']
        
        # Normaliser les features
        X_scaled = self.scaler.fit_transform(X)
        
        # Entraîner le modèle
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.model.fit(X_scaled, y)
        
        # Sauvegarder le modèle et le scaler
        with open(self.model_path, 'wb') as f:
            pickle.dump({'model': self.model, 'scaler': self.scaler}, f)
    
    def predict_travel_time(self, distance, time_of_day, day_of_week, traffic_level=0.5):
        """Prédit le temps de trajet en minutes"""
        features = np.array([[distance, time_of_day, day_of_week, traffic_level]])
        
        # Vérifier si le scaler a été entraîné, sinon utiliser les features non normalisées
        try:
            features_scaled = self.scaler.transform(features)
            return self.model.predict(features_scaled)[0]
        except Exception as e:
            print(f"Avertissement: {e}")
            # Fallback: calcul simple basé sur la distance
            return distance * 3 * (1 + 0.2 * traffic_level)
    
    def optimize_route(self, start_location, destinations):
        """
        Optimise l'ordre des destinations pour minimiser le temps total de trajet
        
        Args:
            start_location: Coordonnées (lat, lng) du point de départ
            destinations: Liste de dictionnaires avec 'location' (lat, lng) et 'id'
            
        Returns:
            Liste ordonnée des destinations optimisées
        """
        if len(destinations) <= 1:
            return destinations
        
        # Calculer la matrice de distance/temps entre tous les points
        all_points = [start_location] + [d['location'] for d in destinations]
        n_points = len(all_points)
        travel_times = np.zeros((n_points, n_points))
        
        for i in range(n_points):
            for j in range(n_points):
                if i != j:
                    # Calculer la distance euclidienne (à remplacer par une API de distance réelle)
                    lat1, lng1 = all_points[i]
                    lat2, lng2 = all_points[j]
                    distance = np.sqrt((lat2 - lat1)**2 + (lng2 - lng1)**2) * 111  # Conversion approx. en km
                    
                    # Utiliser le modèle pour prédire le temps de trajet
                    current_hour = pd.Timestamp.now().hour
                    current_day = pd.Timestamp.now().dayofweek
                    travel_times[i][j] = self.predict_travel_time(distance, current_hour, current_day)
        
        # Algorithme glouton pour trouver un chemin optimal
        current = 0  # Commencer au point de départ
        unvisited = list(range(1, n_points))
        path = [current]
        
        while unvisited:
            next_point = min(unvisited, key=lambda x: travel_times[current][x])
            path.append(next_point)
            unvisited.remove(next_point)
            current = next_point
        
        # Convertir les indices en destinations originales
        optimized_destinations = [destinations[i-1] for i in path[1:]]
        return optimized_destinations

# Point d'entrée pour l'API
if __name__ == "__main__":
    # Lire les données d'entrée depuis stdin ou un argument
    if len(sys.argv) > 1:
        input_data = json.loads(sys.argv[1])
    else:
        input_data = json.loads(sys.stdin.read())
    
    start_location = input_data.get('startLocation')
    destinations = input_data.get('destinations')
    
    optimizer = RouteOptimizer()
    optimized_route = optimizer.optimize_route(start_location, destinations)
    
    # Retourner le résultat en JSON
    print(json.dumps(optimized_route))
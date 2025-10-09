#!/usr/bin/env python3
# ml/predict_travel_time.py
import sys
import numpy as np
import pandas as pd
from datetime import datetime
from optimize_routes import RouteOptimizer

def calculate_distance(origin, destination):
    """
    Calcule la distance approximative entre deux points en km
    
    Args:
        origin: Coordonnées "lat,lng" du point de départ
        destination: Coordonnées "lat,lng" de la destination
    
    Returns:
        Distance en km
    """
    lat1, lng1 = map(float, origin.split(','))
    lat2, lng2 = map(float, destination.split(','))
    
    # Distance euclidienne approximative (à remplacer par une API de distance réelle)
    distance = np.sqrt((lat2 - lat1)**2 + (lng2 - lng1)**2) * 111  # Conversion approx. en km
    return distance

def predict_travel_time(origin, destination, departure_time=None):
    """
    Prédit le temps de trajet entre deux points
    
    Args:
        origin: Coordonnées "lat,lng" du point de départ
        destination: Coordonnées "lat,lng" de la destination
        departure_time: Heure de départ (ISO string)
    
    Returns:
        Temps de trajet en minutes
    """
    # Calculer la distance
    distance = calculate_distance(origin, destination)
    
    # Déterminer l'heure et le jour de départ
    if departure_time:
        dt = datetime.fromisoformat(departure_time.replace('Z', '+00:00'))
        time_of_day = dt.hour
        day_of_week = dt.weekday()
    else:
        now = datetime.now()
        time_of_day = now.hour
        day_of_week = now.weekday()
    
    # Estimer le niveau de trafic en fonction de l'heure
    if (time_of_day >= 7 and time_of_day <= 9) or (time_of_day >= 16 and time_of_day <= 19):
        traffic_level = 0.8  # Heure de pointe
    else:
        traffic_level = 0.3  # Hors heure de pointe
    
    # Utiliser le modèle pour prédire le temps de trajet
    optimizer = RouteOptimizer()
    travel_time = optimizer.predict_travel_time(distance, time_of_day, day_of_week, traffic_level)
    
    return travel_time

if __name__ == "__main__":
    # Vérifier les arguments
    if len(sys.argv) < 3:
        print("Usage: python predict_travel_time.py <origin> <destination> [departure_time]")
        sys.exit(1)
    
    origin = sys.argv[1]
    destination = sys.argv[2]
    departure_time = sys.argv[3] if len(sys.argv) > 3 else None
    
    # Prédire le temps de trajet
    travel_time = predict_travel_time(origin, destination, departure_time)
    
    # Afficher le résultat
    print(travel_time)
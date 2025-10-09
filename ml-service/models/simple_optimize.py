#!/usr/bin/env python3
# ml/simple_optimize.py
import numpy as np
import sys
import json

def calculate_distance(point1, point2):
    """Calcule la distance euclidienne entre deux points"""
    lat1, lng1 = point1
    lat2, lng2 = point2
    return np.sqrt((lat2 - lat1)**2 + (lng2 - lng1)**2) * 111  # Conversion approx. en km

def predict_travel_time(distance):
    """Prédit le temps de trajet en minutes (modèle simple)"""
    # Modèle simple : 3 minutes par km
    return distance * 3

def optimize_route(start_location, destinations):
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
    
    # Calculer la matrice de distance entre tous les points
    all_points = [start_location] + [d['location'] for d in destinations]
    n_points = len(all_points)
    distances = np.zeros((n_points, n_points))
    
    for i in range(n_points):
        for j in range(n_points):
            if i != j:
                distances[i][j] = calculate_distance(all_points[i], all_points[j])
    
    # Algorithme glouton pour trouver un chemin optimal
    current = 0  # Commencer au point de départ
    unvisited = list(range(1, n_points))
    path = [current]
    
    while unvisited:
        next_point = min(unvisited, key=lambda x: distances[current][x])
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
    
    optimized_route = optimize_route(start_location, destinations)
    
    # Retourner le résultat en JSON
    print(json.dumps(optimized_route))
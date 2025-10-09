#!/usr/bin/env python3
# ml/test_optimize.py
from optimize_routes import RouteOptimizer

def test_route_optimizer():
    print("Test de l'optimiseur de trajets...")
    
    # Créer une instance de l'optimiseur
    optimizer = RouteOptimizer()
    
    # Définir un point de départ et des destinations
    start_location = [48.8566, 2.3522]  # Paris
    destinations = [
        {
            'id': '1',
            'location': [48.8744, 2.3526],  # Montmartre
            'details': {'clientName': 'Client 1', 'time': '10:00', 'service': 'Nettoyage standard'}
        },
        {
            'id': '2',
            'location': [48.8606, 2.3376],  # Louvre
            'details': {'clientName': 'Client 2', 'time': '14:00', 'service': 'Nettoyage vitres'}
        },
        {
            'id': '3',
            'location': [48.8530, 2.3499],  # Notre Dame
            'details': {'clientName': 'Client 3', 'time': '16:00', 'service': 'Grand ménage'}
        }
    ]
    
    # Optimiser le trajet
    optimized_route = optimizer.optimize_route(start_location, destinations)
    
    # Afficher le résultat
    print("\nOrdre optimisé des destinations:")
    for i, dest in enumerate(optimized_route):
        print(f"{i+1}. {dest['details']['clientName']} - {dest['details']['service']} à {dest['details']['time']}")
    
    # Tester la prédiction du temps de trajet
    print("\nTest de prédiction du temps de trajet:")
    distance = 10  # 10 km
    time_of_day = 8  # 8h du matin
    day_of_week = 1  # Mardi
    travel_time = optimizer.predict_travel_time(distance, time_of_day, day_of_week)
    print(f"Temps de trajet estimé pour {distance} km à {time_of_day}h: {travel_time:.2f} minutes")
    
    return optimized_route

if __name__ == "__main__":
    test_route_optimizer()
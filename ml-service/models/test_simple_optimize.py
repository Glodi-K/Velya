#!/usr/bin/env python3
# ml/test_simple_optimize.py
from simple_optimize import optimize_route, predict_travel_time, calculate_distance

def test_simple_optimizer():
    print("Test de l'optimiseur de trajets simplifié...")
    
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
    optimized_route = optimize_route(start_location, destinations)
    
    # Afficher le résultat
    print("\nOrdre optimisé des destinations:")
    for i, dest in enumerate(optimized_route):
        print(f"{i+1}. {dest['details']['clientName']} - {dest['details']['service']} à {dest['details']['time']}")
    
    # Tester le calcul de distance
    distance = calculate_distance(start_location, destinations[0]['location'])
    print(f"\nDistance entre le point de départ et la première destination: {distance:.2f} km")
    
    # Tester la prédiction du temps de trajet
    travel_time = predict_travel_time(distance)
    print(f"Temps de trajet estimé: {travel_time:.2f} minutes")
    
    return optimized_route

if __name__ == "__main__":
    test_simple_optimizer()
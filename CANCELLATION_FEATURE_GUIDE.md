# 📋 ANNULATION DE RÉSERVATIONS - GUIDE D'INTÉGRATION

## Vue d'ensemble

Fonctionnalité complète d'annulation de réservations avec motifs optionnels pour :
- **Clients** : Peuvent annuler leurs réservations non terminées
- **Prestataires** : Peuvent annuler les missions qu'ils ont acceptées

## Structure de la base de données

### Modèle Reservation - Nouveau champ `cancellation`

```javascript
cancellation: {
  reason: {
    type: String,
    enum: [
      'client_change_mind',           // Changement d'avis
      'scheduling_conflict',           // Conflit d'horaire
      'found_alternative',             // Alternative trouvée
      'too_expensive',                 // Trop cher
      'provider_not_available',        // Prestataire indisponible
      'provider_emergency',            // Urgence prestataire
      'provider_sick',                 // Maladie prestataire
      'weather',                       // Conditions météo
      'other'                          // Autre
    ],
  },
  notes: {
    type: String,
    maxlength: 500,                    // Notes optionnelles jusqu'à 500 caractères
  },
  cancelledBy: {
    type: String,
    enum: ['client', 'provider'],      // Qui a annulé
  },
  cancelledAt: {
    type: Date,                        // Quand l'annulation s'est faite
  },
}
```

## Routes API

### 1. Annulation par Client
```
PATCH /api/reservations/:id/cancel
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "reason": "scheduling_conflict",     // Optionnel
  "notes": "Je n'ai pas la possibilité..."  // Optionnel
}

Response 200:
{
  "message": "✅ Réservation annulée avec succès",
  "reservation": { ... }
}
```

### 2. Annulation par Prestataire
```
PATCH /api/reservations/:id/cancel-provider
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "reason": "provider_sick",           // Optionnel
  "notes": "Je dois me reposer..."     // Optionnel
}

Response 200:
{
  "message": "✅ Mission annulée avec succès",
  "reservation": { ... }
}
```

### Statuts des réservations acceptables pour annulation
- `confirmed` - Mission confirmée
- `en_attente_estimation` - En attente d'estimation
- `estime` - Estimation envoyée
- `en_attente_prestataire` - En attente acceptation prestataire
- `en cours` - Mission en cours

**Interdites** :
- `terminée` - Mission terminée
- `annulée` - Déjà annulée

## Composants Frontend

### 1. CancellationModal (Composant réutilisable)

**Location** : `frontend/src/components/CancellationModal.jsx`

**Props** :
```javascript
{
  isOpen: boolean,              // Modal ouverte/fermée
  onClose: function,            // Callback fermeture
  onConfirm: function,          // Callback confirmation (reçoit {reason, notes})
  isLoading: boolean,           // État chargement
  userType: 'client' | 'provider'  // Type d'utilisateur
}
```

**Motifs pour client** :
- 🤔 J'ai changé d'avis
- 📅 Conflit d'horaire
- ✅ J'ai trouvé une alternative
- 💰 C'est trop cher
- ❓ Autre raison

**Motifs pour prestataire** :
- 🚫 Indisponibilité soudaine
- 🚨 Situation d'urgence
- 🤒 Maladie
- ❓ Autre raison

### 2. Hook useCancellation

**Location** : `frontend/src/hooks/useCancellation.js`

**Utilisation** :
```javascript
import useCancellation from '../hooks/useCancellation';

const MyComponent = () => {
  const { isLoading, error, cancelByClient, cancelByProvider, clearError } = useCancellation();

  // Annulation par client
  const handleCancel = async (reservationId) => {
    const success = await cancelByClient(reservationId, {
      reason: 'scheduling_conflict',
      notes: 'Conflit d\'agenda'
    });
    if (success) {
      // Réservation annulée
    }
  };

  // Annulation par prestataire
  const handleProviderCancel = async (reservationId) => {
    const success = await cancelByProvider(reservationId, {
      reason: 'provider_sick',
      notes: ''
    });
  };
};
```

## Intégration dans les pages

### Pour les clients (ReservationsPage.jsx)

✅ **Déjà intégré**

Le bouton "❌ Annuler la réservation" est disponible pour toutes les réservations sauf :
- Celles déjà terminées
- Celles déjà annulées

```javascript
// Importe
import CancellationModal from '../components/CancellationModal';
import useCancellation from '../hooks/useCancellation';

// État
const [cancellationModal, setCancellationModal] = useState({ 
  isOpen: false, 
  reservationId: null 
});
const { isLoading: isCancelling, error: cancellationError, cancelByClient } = useCancellation();

// Méthode
const handleCancellation = (reservationId) => {
  setCancellationModal({ isOpen: true, reservationId });
};

const handleConfirmCancellation = async (cancellationData) => {
  const success = await cancelByClient(cancellationModal.reservationId, cancellationData);
  if (success) {
    toast.success('✅ Réservation annulée avec succès');
    // Recharger les réservations...
  }
};

// Rendu
<CancellationModal
  isOpen={cancellationModal.isOpen}
  onClose={() => setCancellationModal({ isOpen: false, reservationId: null })}
  onConfirm={handleConfirmCancellation}
  isLoading={isCancelling}
  userType="client"
/>

// Bouton
{reservation.status !== 'terminée' && reservation.status !== 'annulée' && (
  <button onClick={() => handleCancellation(reservation._id)}>
    ❌ Annuler la réservation
  </button>
)}
```

### Pour les prestataires (À intégrer)

Le prestataire peut annuler les missions dans son dashboard. À intégrer dans le composant affichant les missions acceptées.

```javascript
import useCancellation from '../hooks/useCancellation';
import CancellationModal from '../components/CancellationModal';

const ProviderMissionsPage = () => {
  const [cancellationModal, setCancellationModal] = useState({ 
    isOpen: false, 
    missionId: null 
  });
  const { isLoading, error, cancelByProvider } = useCancellation();

  const handleMissionCancel = (missionId) => {
    setCancellationModal({ isOpen: true, missionId });
  };

  const handleConfirm = async (cancellationData) => {
    const success = await cancelByProvider(
      cancellationModal.missionId, 
      cancellationData
    );
    if (success) {
      toast.success('Mission annulée');
      setCancellationModal({ isOpen: false, missionId: null });
      // Recharger missions...
    }
  };

  return (
    <>
      {/* Missions */}
      {mission.status !== 'terminée' && mission.status !== 'annulée' && (
        <button onClick={() => handleMissionCancel(mission._id)}>
          ❌ Annuler la mission
        </button>
      )}

      {/* Modal */}
      <CancellationModal
        isOpen={cancellationModal.isOpen}
        onClose={() => setCancellationModal({ isOpen: false, missionId: null })}
        onConfirm={handleConfirm}
        isLoading={isLoading}
        userType="provider"
      />
    </>
  );
};
```

## Services de notification

### 1. Notifications Utilisateurs

**Client** :
```javascript
'❌ Mission annulée par le prestataire'
'${providerName} a annulé la mission du ${date}${reasonText}'
```

**Prestataire** :
```javascript
'❌ Mission annulée'
'La mission du ${date} a été annulée par le client${reasonText}'
```

### 2. Emails

#### Email au client (annulation par prestataire)

Envoyé via **`sendProviderCancellationEmail`** dans `mailgunService.js`

Contient :
- Informations de la mission
- Nom du prestataire
- Motif de l'annulation
- CTA pour demander une nouvelle mission

#### Email au prestataire (annulation par client)

Utilise la fonction existante `sendReservationCancellation`

## Champs affichés dans les logs

Lors d'une annulation, le système enregistre :
```javascript
{
  cancellation: {
    reason: 'provider_sick',
    notes: 'Je dois me reposer pour quelques jours',
    cancelledBy: 'provider',
    cancelledAt: 2024-01-03T14:30:00.000Z
  }
}
```

## Considérations de sécurité

✅ **Vérifications implémentées** :
1. Token JWT valide requis
2. Vérification que c'est le bon client/prestataire
3. Vérification que la mission est dans un statut annulable
4. Validation des raisons en enum
5. Limite de caractères pour les notes (500)

## Tests recommandés

```bash
# Test 1 : Annulation client
POST /api/reservations/{id}/cancel
Body: { "reason": "scheduling_conflict", "notes": "..." }
Expected: 200 avec notification

# Test 2 : Annulation prestataire
PATCH /api/reservations/{id}/cancel-provider
Body: { "reason": "provider_sick", "notes": "..." }
Expected: 200 avec notification

# Test 3 : Annulation mission terminée
PATCH /api/reservations/{id}/cancel
Expected: 400 "Impossible d'annuler une mission terminée"

# Test 4 : Accès non autorisé
Client A annule mission de Client B
Expected: 403 "Accès interdit"
```

## Fichiers modifiés

### Backend
- ✅ `backend/src/models/Reservation.js` - Ajout champ `cancellation`
- ✅ `backend/src/routes/reservationRoutes.js` - 2 endpoints
  - `PATCH /:id/cancel` (client)
  - `PATCH /:id/cancel-provider` (prestataire)
- ✅ `backend/src/services/mailgunService.js` - Email `sendProviderCancellationEmail`

### Frontend
- ✅ `frontend/src/components/CancellationModal.jsx` - Composant modal
- ✅ `frontend/src/components/CancellationModal.css` - Styles modal
- ✅ `frontend/src/hooks/useCancellation.js` - Hook API
- ✅ `frontend/src/pages/ReservationsPage.jsx` - Intégration pour clients

### À faire (Prestataires)
- [ ] Intégrer dans dashboard prestataire (si existe)
- [ ] Intégrer dans liste missions acceptées
- [ ] Tester workflows complets

## Performance et Scalabilité

- Requêtes indexées sur `_id` et `provider`
- Notifications async (ne bloquent pas la réponse)
- Emails envoyés en arrière-plan

## Compatibilité

- ✅ React 16+ (hooks)
- ✅ Node.js 14+
- ✅ MongoDB 4.0+
- ✅ Mailgun API

---

**Date de création** : 3 janvier 2026  
**Statut** : Prêt pour production (tests en attente)

# 📝 CHANGEMENTS DÉTAILLÉS - FONCTIONNALITÉ ANNULATION

## 🎯 Objectif
Permettre aux **clients** et **prestataires** d'annuler des réservations avec un motif optionnel.

---

## ✏️ Fichiers MODIFIÉS (3)

### 1️⃣ `backend/src/models/Reservation.js`

**Où** : Après le champ `reprogrammed`

**Ajout** :
```javascript
// ✅ Motifs d'annulation
cancellation: {
  reason: {
    type: String,
    enum: [
      'client_change_mind',
      'scheduling_conflict',
      'found_alternative',
      'too_expensive',
      'provider_not_available',
      'provider_emergency',
      'provider_sick',
      'weather',
      'other'
    ],
  },
  notes: {
    type: String,
    maxlength: 500,
  },
  cancelledBy: {
    type: String,
    enum: ['client', 'provider'],
  },
  cancelledAt: {
    type: Date,
  },
},
```

---

### 2️⃣ `backend/src/routes/reservationRoutes.js`

**MODIFICATION 1** : Remplacer route `/cancel` existante (lignes 176-226)

Avant :
```javascript
router.patch("/:id/cancel", verifyToken, async (req, res) => {
  // ... ancien code ...
});
```

Après :
```javascript
router.patch("/:id/cancel", verifyToken, async (req, res) => {
  try {
    const { reason, notes } = req.body;
    const reservation = await Reservation.findById(req.params.id)
      .populate('client', 'name email')
      .populate('provider', 'name email');
    if (!reservation) return res.status(404).json({ message: "❌ Réservation non trouvée" });
    
    // Vérifier que c'est bien le client qui annule
    if (req.user.id !== reservation.client._id.toString()) {
      return res.status(403).json({ message: "⛔ Accès interdit" });
    }
    
    // Vérifier que la mission n'est pas déjà terminée
    if (reservation.status === "terminée") {
      return res.status(400).json({ message: "❌ Impossible d'annuler une mission terminée" });
    }
    
    const updatedReservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { 
        status: "annulée",
        cancellation: {
          reason: reason || 'other',
          notes: notes || '',
          cancelledBy: 'client',
          cancelledAt: new Date()
        }
      },
      { new: true }
    );
    
    // ✅ Créer une notification pour le prestataire si assigné
    if (reservation.provider && reservation.provider._id) {
      const { createAndSendNotification } = require('../utils/notificationHelper');
      const reasonText = reason ? ` (${reason})` : '';
      await createAndSendNotification(
        req.app,
        reservation.provider._id,
        '❌ Mission annulée',
        `La mission du ${new Date(reservation.date).toLocaleDateString('fr-FR')} a été annulée par le client${reasonText}`,
        'reservation'
      );
    }
    
    // Envoyer un email au prestataire si assigné
    if (reservation.provider && reservation.provider.email) {
      try {
        await sendReservationCancellation(reservation.provider.email, reservation);
        console.log("✅ Email d'annulation envoyé au prestataire:", reservation.provider.email);
      } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi de l'email d'annulation:", emailError);
      }
    }
    
    res.json({ message: "✅ Réservation annulée avec succès", reservation: updatedReservation });
  } catch (error) {
    console.error("❌ Erreur lors de l'annulation:", error);
    res.status(500).json({ message: "❌ Erreur serveur" });
  }
});
```

**MODIFICATION 2** : Ajouter nouvelle route après `/complete` (après ligne 290)

```javascript
// ✅ Annuler une réservation par le prestataire (mission acceptée)
router.patch("/:id/cancel-provider", verifyToken, async (req, res) => {
  try {
    const { reason, notes } = req.body;
    const reservation = await Reservation.findById(req.params.id)
      .populate('client', 'name email')
      .populate('provider', 'name email');
    if (!reservation) return res.status(404).json({ message: "❌ Réservation non trouvée" });
    
    // Vérifier que c'est bien le prestataire qui annule
    if (!reservation.provider || req.user.id !== reservation.provider._id.toString()) {
      return res.status(403).json({ message: "⛔ Accès interdit" });
    }
    
    // Vérifier que la mission n'est pas déjà terminée
    if (reservation.status === "terminée") {
      return res.status(400).json({ message: "❌ Impossible d'annuler une mission terminée" });
    }
    
    // Vérifier que la mission a au moins été acceptée
    const cancelableStatuses = ['confirmed', 'en_attente_estimation', 'estime', 'en_attente_prestataire', 'en cours'];
    if (!cancelableStatuses.includes(reservation.status)) {
      return res.status(400).json({ message: "❌ Seules les missions acceptées ou en cours peuvent être annulées" });
    }
    
    const updatedReservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { 
        status: "annulée",
        cancellation: {
          reason: reason || 'other',
          notes: notes || '',
          cancelledBy: 'provider',
          cancelledAt: new Date()
        }
      },
      { new: true }
    );
    
    // ✅ Créer une notification pour le client
    if (reservation.client && reservation.client._id) {
      const { createAndSendNotification } = require('../utils/notificationHelper');
      const reasonText = reason ? ` (${reason})` : '';
      const providerName = reservation.provider ? reservation.provider.name : 'Le prestataire';
      await createAndSendNotification(
        req.app,
        reservation.client._id,
        '❌ Mission annulée par le prestataire',
        `${providerName} a annulé la mission du ${new Date(reservation.date).toLocaleDateString('fr-FR')}${reasonText}. Vous pouvez demander une autre mission.`,
        'reservation'
      );
    }
    
    // Envoyer un email au client
    if (reservation.client && reservation.client.email) {
      try {
        const { sendProviderCancellationEmail } = require("../services/mailgunService");
        const providerName = reservation.provider ? reservation.provider.name : 'Le prestataire';
        await sendProviderCancellationEmail(
          reservation.client.email,
          reservation,
          providerName,
          reason
        );
        console.log("✅ Email d'annulation du prestataire envoyé au client:", reservation.client.email);
      } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi de l'email:", emailError);
      }
    }
    
    res.json({ message: "✅ Mission annulée avec succès", reservation: updatedReservation });
  } catch (error) {
    console.error("❌ Erreur lors de l'annulation par le prestataire:", error);
    res.status(500).json({ message: "❌ Erreur serveur" });
  }
});
```

---

### 3️⃣ `backend/src/services/mailgunService.js`

**Où** : À la fin du fichier, avant les exports

**Ajout** :
```javascript
// ✅ Annulation par le prestataire
const sendProviderCancellationEmail = async (userEmail, reservation, providerName, reason) => {
  const reasonLabels = {
    'provider_not_available': 'Indisponibilité',
    'provider_emergency': 'Situation d\'urgence',
    'provider_sick': 'Maladie',
    'other': 'Raison personnelle'
  };

  const reasonLabel = reasonLabels[reason] || 'Motif non spécifié';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white;">
        <h2 style="margin: 0;">Mission annulée</h2>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Malheureusement, <strong>${providerName}</strong> a dû annuler la mission prévue.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f45c43; margin: 20px 0;">
          <p><strong>📅 Date:</strong> ${new Date(reservation.date).toLocaleDateString('fr-FR')}</p>
          <p><strong>🕐 Heure:</strong> ${reservation.heure || 'Non spécifiée'}</p>
          <p><strong>🧹 Service:</strong> ${reservation.service || reservation.categorie}</p>
          <p><strong>📍 Adresse:</strong> ${reservation.adresse}</p>
          <p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
            <strong>📋 Motif:</strong> ${reasonLabel}
          </p>
        </div>

        <p style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; color: #1565c0;">
          <strong>ℹ️ Ne vous inquiétez pas !</strong> Vous pouvez demander un autre prestataire pour cette date, ou nous contacter pour toute question.
        </p>

        <p style="color: #666; font-size: 14px;">
          Cliquez sur le bouton ci-dessous pour trouver un autre prestataire.
        </p>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="http://localhost:3000/nouvelle-mission" style="display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Demander une nouvelle mission
          </a>
        </div>

        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          Besoin d'aide ? Contactez notre support.
        </p>
      </div>
    </div>
  `;
  return await sendMail(userEmail, 'Mission annulée par le prestataire', html);
};
```

**Et modifier les exports** :
```javascript
module.exports = {
  send2FACodeEmail,
  sendReservationConfirmation,
  sendReminderEmail,
  sendCancellationEmail,
  sendClientNotification,
  sendProviderNotification,
  sendReservationCancellation,
  sendReservationReminder,
  sendMissionAcceptedEmail,
  sendMissionCompletedEmail,
  sendPaymentReminder,
  sendPaymentReminderEmail,
  sendProviderCancellationEmail,  // ← AJOUTER
};
```

---

### 4️⃣ `frontend/src/pages/ReservationsPage.jsx`

**Où** : Lignes 1-13 (imports)

**Ajouter** :
```javascript
import CancellationModal from '../components/CancellationModal';
import useCancellation from '../hooks/useCancellation';
```

**Où** : Lignes 20-30 (état du composant)

**Ajouter** :
```javascript
const [cancellationModal, setCancellationModal] = useState({ isOpen: false, reservationId: null });
const { isLoading: isCancelling, error: cancellationError, cancelByClient } = useCancellation();
```

**Où** : Avant `useEffect` (après `fillFormWithLastData`)

**Ajouter** :
```javascript
const handleCancellation = (reservationId) => {
  setCancellationModal({ isOpen: true, reservationId });
};

const handleConfirmCancellation = async (cancellationData) => {
  const success = await cancelByClient(cancellationModal.reservationId, cancellationData);
  if (success) {
    toast.success('✅ Réservation annulée avec succès');
    setCancellationModal({ isOpen: false, reservationId: null });
    
    // Recharger les réservations
    try {
      const token = localStorage.getItem('token');
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = JSON.parse(window.atob(base64));
      const userId = decodedPayload.id;

      const res = await api.get(`/reservations/user/${userId}`);
      const reservations = res.data.reservation || [];
      setReservations(reservations);
      setFilteredReservations(reservations);
    } catch (err) {
      console.error('Erreur lors du rechargement:', err);
    }
  } else {
    toast.error(cancellationError || 'Erreur lors de l\'annulation');
  }
};
```

**Où** : Après les réservations listées (avant fermeture du return)

**Ajouter** :
```javascript
{/* Modal d'annulation */}
<CancellationModal
  isOpen={cancellationModal.isOpen}
  onClose={() => setCancellationModal({ isOpen: false, reservationId: null })}
  onConfirm={handleConfirmCancellation}
  isLoading={isCancelling}
  userType="client"
/>
```

**Où** : Dans la boucle de réservations (après le bouton "Noter le service")

**Ajouter** :
```javascript
{/* Bouton d'annulation pour les réservations non terminées */}
{reservation.status !== 'terminée' && reservation.status !== 'annulée' && (
  <button
    onClick={() => handleCancellation(reservation._id)}
    className="mt-3 ml-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
  >
    ❌ Annuler la réservation
  </button>
)}
```

---

## ✨ Fichiers CRÉÉS (7)

### Frontend

**1. `frontend/src/components/CancellationModal.jsx`** - 150 lignes
**2. `frontend/src/components/CancellationModal.css`** - 300 lignes  
**3. `frontend/src/hooks/useCancellation.js`** - 120 lignes
**4. `frontend/src/pages/ProviderMissionsPage.example.jsx`** - 200 lignes

### Documentation

**5. `CANCELLATION_FEATURE_GUIDE.md`** - Guide complet
**6. `CANCELLATION_TEST_GUIDE.md`** - Procédures de test
**7. `CANCELLATION_IMPLEMENTATION.md`** - Quick reference

---

## 📊 Résumé des changements

| Type | Compte | Statut |
|------|--------|--------|
| Fichiers modifiés | 4 | ✅ |
| Fichiers créés | 7 | ✅ |
| Lignes de code ajoutées | ~1200 | ✅ |
| Routes API | 2 | ✅ |
| Composants React | 1 | ✅ |
| Hooks personnalisés | 1 | ✅ |
| Guides de doc | 3 | ✅ |

**Total : 11 fichiers modifiés/créés**

---

## 🚀 Installation (30 secondes)

1. ✅ Copier tous les fichiers
2. ✅ Backend redémarrage automatique
3. ✅ Frontend reconnaît les changements
4. ✅ Prêt à tester!

---

**Créé** : 3 janvier 2026  
**Version** : 1.0.0

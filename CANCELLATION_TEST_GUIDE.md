# 🧪 GUIDE DE TEST - FONCTIONNALITÉ D'ANNULATION

## ✅ Implémentation complète

La fonctionnalité d'annulation de réservations avec motifs est maintenant **entièrement intégrée** pour :
- ✅ **Clients** - Annulation de réservations non terminées
- ⏳ **Prestataires** - À intégrer dans le dashboard (exemple fourni)

---

## 📱 Test pour les CLIENTS

### Étape 1: Accéder à la page des réservations
```
URL: http://localhost:3000/reservations
```

### Étape 2: Chercher une réservation non-terminée
- Vérifier que le statut n'est pas "terminée" ou "annulée"
- Exemple: "en_attente_prestataire", "en_attente_estimation", "confirmed"

### Étape 3: Cliquer sur "❌ Annuler la réservation"
- Le bouton doit apparaître pour toutes les missions sauf terminées/annulées
- Un modal doit s'ouvrir avec le formulaire d'annulation

### Étape 4: Remplir le formulaire
1. **Sélectionner un motif** (obligatoire):
   - 🤔 J'ai changé d'avis
   - 📅 Conflit d'horaire
   - ✅ J'ai trouvé une alternative
   - 💰 C'est trop cher
   - ❓ Autre raison

2. **Notes optionnelles** (max 500 caractères):
   - Saisir une explication détaillée (facultatif)
   - Voir le compteur de caractères

### Étape 5: Confirmer l'annulation
- Cliquer "❌ Confirmer l'annulation"
- Toast de succès: "✅ Réservation annulée avec succès"

### Étape 6: Vérifier la mise à jour
- La réservation doit disparaître de la liste (ou afficher "annulée")
- Status de la réservation passe à "annulée"

---

## 📧 Vérifications complémentaires CLIENT

### Email au prestataire
Si un prestataire était assigné, il doit recevoir un email avec :
- ❌ Titre: "Annulation de votre réservation"
- 📅 Détails de la réservation
- 📋 Motif d'annulation
- 💬 Notes du client

### Notification Socket.IO
Le prestataire doit recevoir une notification en temps réel :
```
'❌ Mission annulée'
'La mission du [date] a été annulée par le client'
```

### Vérification MongoDB
```javascript
db.reservations.findOne({_id: ObjectId("...")})

// Résultat attendu:
{
  ...
  status: "annulée",
  cancellation: {
    reason: "scheduling_conflict",
    notes: "Conflit d'agenda",
    cancelledBy: "client",
    cancelledAt: ISODate("2024-01-03T...")
  }
}
```

---

## 🏪 Test pour les PRESTATAIRES

### ⚠️ Intégration requise

Pour tester l'annulation par prestataire, il faut d'abord intégrer le composant dans votre dashboard prestataire.

### Template d'intégration
Un exemple complet est fourni dans :
```
frontend/src/pages/ProviderMissionsPage.example.jsx
```

### Étapes d'intégration rapide

1. **Créer la page** (ou adapter existante):
```bash
cp frontend/src/pages/ProviderMissionsPage.example.jsx \
   frontend/src/pages/ProviderMissionsPage.jsx
```

2. **Ajouter la route** dans `frontend/src/App.js`:
```javascript
import ProviderMissionsPage from './pages/ProviderMissionsPage';

// Dans les routes
<Route path="/provider-missions" element={<ProviderMissionsPage />} />
```

3. **Tester**:
   - Connectez-vous en tant que prestataire
   - Naviguez vers `/provider-missions`
   - Cliquez "❌ Annuler la mission" sur une mission acceptée

---

## 🔧 Cas de test - Erreurs attendues

### Test 1: Annulation d'une mission terminée
```
Mission status: "terminée"
Expected error: ❌ "Impossible d'annuler une mission terminée"
HTTP: 400 Bad Request
```

### Test 2: Annulation sans autorisation
```
Client A annule mission de Client B
Expected error: ⛔ "Accès interdit"
HTTP: 403 Forbidden
```

### Test 3: Réservation inexistante
```
ID invalide: "000000000000000000000000"
Expected error: ❌ "Réservation non trouvée"
HTTP: 404 Not Found
```

### Test 4: Token manquant
```
No Authorization header
Expected error: ⛔ "Authentification requise"
HTTP: 401 Unauthorized
```

---

## 📊 Logs attendus du backend

### Annulation client
```
PATCH /api/reservations/:id/cancel
Body: { "reason": "scheduling_conflict", "notes": "..." }

Console output:
✅ Réservation annulée avec succès: [ID]
📧 Email d'annulation envoyé au prestataire: [email]
🔔 Notification créée pour prestataire [ID]
```

### Annulation prestataire
```
PATCH /api/reservations/:id/cancel-provider
Body: { "reason": "provider_sick", "notes": "..." }

Console output:
✅ Mission annulée avec succès: [ID]
📧 Email d'annulation envoyé au client: [email]
🔔 Notification créée pour client [ID]
```

---

## 🎬 Scénarios complets de test

### Scénario 1: Client annule pour conflit d'horaire
```
1. Créer/trouver une réservation confirmée
2. Ouvrir le modal d'annulation
3. Sélectionner "📅 Conflit d'horaire"
4. Ajouter note: "La date est décalée"
5. Confirmer
✅ Expected: Réservation annulée, prestataire notifié
```

### Scénario 2: Prestataire annule pour maladie
```
1. Connecter en tant que prestataire
2. Aller sur /provider-missions
3. Cliquer "Annuler la mission" sur une mission acceptée
4. Sélectionner "🤒 Maladie"
5. Ajouter note: "Je dois me reposer"
6. Confirmer
✅ Expected: Mission annulée, client notifié
```

### Scénario 3: Annulation rapide (sans notes)
```
1. Ouvrir modal d'annulation
2. Sélectionner raison
3. Laisser notes vides
4. Confirmer
✅ Expected: Annulation fonctionnelle, notes non remplies OK
```

### Scénario 4: Notes longues (test limite)
```
1. Ouvrir modal d'annulation
2. Remplir notes avec 500+ caractères
3. Essayer de confirmer
✅ Expected: Message d'erreur ou troncage à 500 caractères
```

---

## 🌐 Test d'emails

### Mailgun Sandbox
Les emails sont envoyés via Mailgun. Pour vérifier :

1. **Logs Mailgun** :
```bash
# En production, vérifier le tableau de bord Mailgun
# Les emails de test vont dans le dossier "Stored Messages"
```

2. **Vérification locale** (mode développement):
   - Vérifier les logs du terminal backend
   - Chercher: "📧 Email d'annulation envoyé"

3. **Contenu de l'email attendu**:
   - **Pour le client**: 
     - Annulation par prestataire
     - Raison
     - CTA "Demander une nouvelle mission"
   
   - **Pour le prestataire**:
     - Annulation par client
     - Raison
     - Confirmation de traitement

---

## 🐛 Débogage

### Problème: Modal ne s'ouvre pas

**Vérifications** :
```javascript
// 1. Vérifier l'import
import CancellationModal from '../components/CancellationModal';

// 2. Vérifier l'état
console.log('Modal state:', cancellationModal);

// 3. Vérifier le bouton
// Le bouton doit avoir: onClick={() => handleCancellation(reservation._id)}
```

### Problème: Erreur 403 "Accès interdit"

**Causes possibles** :
- Token expiré → Se reconnecter
- ID du réservation incorrect
- Client différent de celui qui a créé la réservation

### Problème: Email non reçu

**Vérifications** :
- Vérifier `MAILGUN_API_KEY` dans `.env`
- Vérifier `MAILGUN_DOMAIN` dans `.env`
- Vérifier les logs du backend
- Vérifier les dossiers spam

### Problème: Styles CSS cassés

**Solutions** :
```bash
# Vérifier que le fichier CSS existe
ls -la frontend/src/components/CancellationModal.css

# Vérifier l'import dans le composant
// import './CancellationModal.css';
```

---

## ✨ Points de vérification finaux

- ✅ Modal s'ouvre au clic du bouton
- ✅ Motifs affichés correctement
- ✅ Compteur de caractères fonctionne
- ✅ Bouton confirmer activé/désactivé correctement
- ✅ Toast success après annulation
- ✅ Réservation mise à jour en temps réel
- ✅ Email envoyé à l'autre partie
- ✅ Notification Socket.IO reçue
- ✅ Données sauvegardées dans MongoDB
- ✅ Pas d'erreurs console

---

## 📝 Signaler les bugs

En cas de problème :
1. Vérifier les logs (backend + frontend)
2. Vérifier les erreurs dans la console du navigateur
3. Vérifier que tous les fichiers sont créés/modifiés
4. Essayer une actualisation (Ctrl+Shift+R)
5. Redémarrer le backend et frontend

---

**Dernière mise à jour** : 3 janvier 2026  
**Version** : 1.0 - Production Ready

# Scripts de Gestion des Paiements

Ce dossier contient des scripts utilitaires pour gérer et corriger les problèmes de paiement dans l'application Velya.

## 🔧 Scripts Disponibles

### 1. `fixPaymentStatus.js`
Script principal pour diagnostiquer et corriger les problèmes de statut de paiement.

```bash
# Lister les réservations non payées
node scripts/fixPaymentStatus.js --list

# Corriger automatiquement les statuts de paiement
node scripts/fixPaymentStatus.js --fix
```

**Fonctionnalités :**
- Détecte les réservations avec PaymentId mais `paid=false`
- Vérifie le statut sur Stripe (si configuré)
- Corrige les réservations basées sur les PaymentLogs
- Affiche un rapport détaillé

### 2. `autoFixPayment.js`
Script automatique pour corriger les réservations terminées non payées.

```bash
node scripts/autoFixPayment.js
```

**Fonctionnalités :**
- Trouve toutes les réservations avec statut "terminée" mais `paid=false`
- Les marque automatiquement comme payées
- Génère un ID de paiement manuel
- Conserve le statut "terminée"

### 3. `markReservationAsPaid.js`
Script interactif pour marquer manuellement une réservation comme payée.

```bash
node scripts/markReservationAsPaid.js <reservationId>
```

**Exemple :**
```bash
node scripts/markReservationAsPaid.js 68f07b40fad8fcc20cdbd571
```

**Fonctionnalités :**
- Affiche les détails de la réservation
- Demande confirmation avant modification
- Met à jour le statut de paiement

### 4. `dailyPaymentCheck.js`
Script de vérification quotidienne pour détecter les problèmes de paiement.

```bash
node scripts/dailyPaymentCheck.js
```

**Fonctionnalités :**
- Détecte les réservations terminées non payées
- Trouve les réservations avec PaymentId mais non payées
- Identifie les paiements orphelins
- Affiche des statistiques générales
- Recommande les actions correctives

## 🚨 Problèmes Courants et Solutions

### Problème : Réservation payée mais apparaît comme non payée

**Symptômes :**
- Le client a payé via Stripe
- La réservation apparaît toujours comme non payée dans l'interface
- Le statut peut être "terminée" mais `paid=false`

**Causes possibles :**
1. Webhook Stripe non reçu ou échoué
2. Erreur lors du traitement du webhook
3. Problème de synchronisation base de données

**Solution :**
```bash
# 1. Vérifier les réservations problématiques
node scripts/fixPaymentStatus.js --list

# 2. Corriger automatiquement
node scripts/autoFixPayment.js

# 3. Ou corriger manuellement une réservation spécifique
node scripts/markReservationAsPaid.js <reservationId>
```

### Problème : PaymentLog existe mais réservation non payée

**Solution :**
```bash
node scripts/fixPaymentStatus.js --fix
```

Ce script vérifiera les PaymentLogs et mettra à jour les réservations correspondantes.

## 📋 Maintenance Préventive

### Vérification Quotidienne
Ajoutez ce script à votre cron pour une vérification quotidienne :

```bash
# Tous les jours à 9h00
0 9 * * * cd /path/to/velya/backend && node scripts/dailyPaymentCheck.js
```

### Vérification Hebdomadaire
Pour une correction automatique hebdomadaire :

```bash
# Tous les lundis à 8h00
0 8 * * 1 cd /path/to/velya/backend && node scripts/autoFixPayment.js
```

## ⚠️ Précautions

1. **Sauvegarde** : Toujours faire une sauvegarde de la base de données avant d'exécuter les scripts de correction
2. **Test** : Tester les scripts en environnement de développement avant la production
3. **Logs** : Vérifier les logs pour s'assurer que les corrections sont appropriées
4. **Stripe** : S'assurer que les clés Stripe sont correctement configurées

## 🔍 Debugging

### Vérifier la configuration Stripe
```bash
# Vérifier les variables d'environnement
echo $STRIPE_SECRET_KEY
echo $STRIPE_WEBHOOK_SECRET
```

### Vérifier les webhooks Stripe
1. Aller sur le dashboard Stripe
2. Vérifier la section "Webhooks"
3. S'assurer que l'endpoint est configuré et actif
4. Vérifier les logs des webhooks pour les erreurs

### Logs de l'application
```bash
# Vérifier les logs du serveur
tail -f logs/app.log

# Ou si vous utilisez PM2
pm2 logs
```

## 📞 Support

Si vous rencontrez des problèmes avec ces scripts :

1. Vérifiez d'abord les logs d'erreur
2. Assurez-vous que MongoDB est accessible
3. Vérifiez la configuration Stripe
4. Consultez la documentation Stripe pour les webhooks

Pour des problèmes spécifiques, créez un ticket avec :
- Les logs d'erreur complets
- L'ID de la réservation problématique
- Les étapes pour reproduire le problème
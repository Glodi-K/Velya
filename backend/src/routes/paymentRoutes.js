const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const verifyToken = require('../middleware/verifyToken');

// Route pour marquer une réservation comme payée (fallback si webhook ne fonctionne pas)
router.patch('/:id/mark-paid', verifyToken, async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { 
        paid: true,
        paymentDate: new Date(),
        status: 'confirmé'
      },
      { new: true }
    );
    
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation introuvable' });
    }
    
    console.log(`✅ Réservation ${req.params.id} marquée comme payée`);
    res.json({ success: true, reservation });
  } catch (error) {
    console.error('❌ Erreur marquage paiement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

// routes/couponRoutes.js
const express = require("express");
const router = express.Router();
const Coupon = require("../models/Coupon");

// ✅ Créer un coupon (admin)
router.post("/create", async (req, res) => {
  try {
    const { code, discount, expiresAt } = req.body;

    if (!code || !discount) {
      return res.status(400).json({ message: "Code et remise requis." });
    }

    const existing = await Coupon.findOne({ code });
    if (existing) {
      return res.status(400).json({ message: "❌ Code déjà existant" });
    }

    const coupon = await Coupon.create({
      code,
      discount,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    res.status(201).json({ message: "✅ Coupon créé", coupon });
  } catch (err) {
    console.error("❌ Erreur création coupon :", err);
    res.status(500).json({ message: "Erreur lors de la création du coupon" });
  }
});

// ✅ Valider un code promo
router.post("/validate", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: "Code requis" });
  }

  const coupon = await Coupon.findOne({ code });

  if (!coupon) {
    return res.status(404).json({ message: "❌ Code promo invalide." });
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return res.status(403).json({ message: "⚠️ Ce code est expiré." });
  }

  if (coupon.uses >= coupon.maxUses) {
    return res.status(403).json({ message: "🚫 Ce code a été utilisé au maximum." });
  }

  res.json({
    valid: true,
    discount: coupon.discount,
    message: "✅ Code valide",
  });
});

module.exports = router;


const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');
const bcrypt = require("bcryptjs");
const shortid = require('shortid');

// ✅ Route de test
router.get('/test', (req, res) => {
    res.send("✅ Route test users fonctionne !");
});

// ✅ Routes utilisant le contrôleur
router.get('/users', verifyToken, userController.getUsers); // 🔐 Protégé
router.get('/users/:id', verifyToken, userController.getUserById); // 🔐 Protégé
router.post('/:id/favorite-provider', verifyToken, userController.addFavoriteProvider); // 🔐 Protégé

// ✅ Route pour récupérer tous les utilisateurs (admin recommandé)
router.get('/all-users', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "⛔ Accès refusé" });
        }
        const users = await User.find();
        res.json({ message: "📜 Liste des utilisateurs", users });
    } catch (error) {
        res.status(500).json({ message: "❌ Erreur de récupération", error });
    }
});

// ✅ Ajouter un utilisateur
router.post('/users', async (req, res) => {
    try {
        const { name, email } = req.body;
        if (!name || !email) {
            return res.status(400).json({ message: "❌ Nom et email requis" });
        }
        const newUser = new User({ name, email });
        await newUser.save();
        res.status(201).json({ message: "✅ Utilisateur ajouté !", user: newUser });
    } catch (error) {
        res.status(500).json({ message: "❌ Erreur lors de l'ajout", error });
    }
});

// ✅ Modifier un utilisateur
router.put('/users/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "⛔ Accès refusé" });
        }
        const { name, email } = req.body;
        if (!name || !email) {
            return res.status(400).json({ message: "❌ Nom et email requis" });
        }
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { name, email },
            { new: true, runValidators: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ message: "❌ Utilisateur non trouvé" });
        }
        res.json({ message: "✅ Utilisateur mis à jour !", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "❌ Erreur lors de la mise à jour", error });
    }
});

// ✅ Supprimer un utilisateur
router.delete('/users/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "⛔ Accès refusé" });
        }
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        await user.deleteOne();
        res.json({ message: "✅ Utilisateur supprimé avec succès !" });
    } catch (error) {
        res.status(500).json({ message: "❌ Erreur lors de la suppression", error });
    }
});

// ✅ ADMIN : Obtenir tous les utilisateurs
router.get('/admin/users', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "⛔ Accès refusé : Admin uniquement" });
        }
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "❌ Erreur serveur", error });
    }
});

// ✅ ADMIN : Modifier un utilisateur
router.put('/admin/users/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "⛔ Accès refusé" });
        }
        const { name, email } = req.body;
        if (!name || !email) {
            return res.status(400).json({ message: "❌ Nom et email requis" });
        }
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { name, email },
            { new: true, runValidators: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ message: "❌ Utilisateur non trouvé" });
        }
        res.json({ message: "✅ Utilisateur mis à jour !", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "❌ Erreur lors de la mise à jour", error });
    }
});

// ✅ ADMIN : Supprimer un utilisateur
router.delete('/admin/users/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "⛔ Accès refusé" });
        }
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        await user.deleteOne();
        res.json({ message: "✅ Utilisateur supprimé avec succès !" });
    } catch (error) {
        res.status(500).json({ message: "❌ Erreur lors de la suppression", error });
    }
});

// 🧪 Route de test pour inscription avec code parrain
router.post('/referral/test', async (req, res) => {
    try {
        const { email, password, referralCodeUsed } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: '❌ Email déjà utilisé' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });

        // Générer un code unique
        let codeUnique, existe = true;
        while (existe) {
            codeUnique = shortid.generate();
            const userWithCode = await User.findOne({ referralCode: codeUnique });
            if (!userWithCode) existe = false;
        }
        newUser.referralCode = codeUnique;

        // Appliquer le parrainage
        if (referralCodeUsed) {
            const referrer = await User.findOne({ referralCode: referralCodeUsed });
            if (referrer) {
                referrer.referralsCount += 1;
                referrer.referralRewards += 1;
                await referrer.save();
                newUser.referredBy = referralCodeUsed;
            }
        }

        await newUser.save();
        res.status(201).json({ message: '✅ Utilisateur inscrit avec succès', newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '❌ Erreur serveur' });
    }
});

// ✅ Voir les parrainages reçus
router.get('/users/:id/referrals', verifyToken, async (req, res) => {
    try {
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "⛔ Accès interdit" });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

        const referredUsers = await User.find({ referredBy: user.referralCode }).select('email createdAt');

        res.json({
            referralsCount: user.referralsCount,
            referralRewards: user.referralRewards,
            referredUsers
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

router.post("/upload-avatar", verifyToken, userController.uploadAvatar);


module.exports = router;


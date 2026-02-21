// src/routes/user.routes.js
const express        = require('express');
const router         = express.Router();
const userCtrl       = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// ── Routes Admin (nécessitent rôle admin) ────
router.get('/',                     authMiddleware, roleMiddleware('admin'), userCtrl.getUsers);
router.get('/roles',                authMiddleware, roleMiddleware('admin'), userCtrl.getRoles);
router.get('/:id',                  authMiddleware, roleMiddleware('admin'), userCtrl.getUserById);
router.post('/',                    authMiddleware, roleMiddleware('admin'), userCtrl.createUser);
router.put('/:id',                  authMiddleware, roleMiddleware('admin'), userCtrl.updateUser);
router.patch('/:id/toggle-actif',   authMiddleware, roleMiddleware('admin'), userCtrl.toggleUserActif);
router.patch('/:id/reset-password', authMiddleware, roleMiddleware('admin'), userCtrl.resetMotDePasse);

// ── Routes Utilisateur connecté (tous les rôles) ──
router.put('/telephone',             authMiddleware, userCtrl.updateTelephone);
router.post('/verifier-telephone',   authMiddleware, userCtrl.verifierTelephone);

module.exports = router;
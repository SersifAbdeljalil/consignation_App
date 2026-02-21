// src/routes/user.routes.js
const express      = require('express');
const router       = express.Router();
const userCtrl     = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Toutes les routes nécessitent d'être connecté + être admin
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/',                        userCtrl.getUsers);          // GET    /api/users
router.get('/roles',                   userCtrl.getRoles);          // GET    /api/users/roles
router.get('/:id',                     userCtrl.getUserById);       // GET    /api/users/:id
router.post('/',                       userCtrl.createUser);        // POST   /api/users
router.put('/:id',                     userCtrl.updateUser);        // PUT    /api/users/:id
router.patch('/:id/toggle-actif',      userCtrl.toggleUserActif);  // PATCH  /api/users/:id/toggle-actif
router.patch('/:id/reset-password',    userCtrl.resetMotDePasse);   // PATCH  /api/users/:id/reset-password

module.exports = router;
// src/routes/notification.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/notification.controller');
const auth    = require('../middlewares/auth.middleware');

router.get('/',               auth, ctrl.getNotifications);
router.put('/toutes-lues',    auth, ctrl.marquerToutesLues);
router.put('/:id/lu',         auth, ctrl.marquerCommeLue);

module.exports = router;
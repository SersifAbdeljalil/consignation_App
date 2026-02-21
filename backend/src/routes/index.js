// src/routes/index.js
const express = require("express");
const router  = express.Router();

// Seulement auth pour l'instant
router.use("/auth", require("./auth.routes"));
router.use("/users", require("./user.routes"));
router.use('/equipements',    require('./equipement.routes'));
router.use('/demandes',       require('./demande.routes'));
router.use('/notifications',  require('./notification.routes'));
module.exports = router;
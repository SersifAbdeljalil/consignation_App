// src/routes/index.js
const express = require("express");
const router  = express.Router();

// Seulement auth pour l'instant
router.use("/auth", require("./auth.routes"));
router.use("/users", require("./user.routes"));
module.exports = router;
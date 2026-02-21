// src/controllers/notification.controller.js
const db                 = require('../config/db');
const { success, error } = require('../utils/response');

// ── GET /notifications ───────────────────────
const getNotifications = async (req, res) => {
  try {
    const { non_lues } = req.query;
    let query = `
      SELECT * FROM notifications
      WHERE user_id = ?
    `;
    const params = [req.user.id];

    if (non_lues === 'true') {
      query += ' AND lu = 0';
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const [rows] = await db.query(query, params);
    return success(res, rows, 'Notifications récupérées');
  } catch (err) {
    return error(res, 'Erreur serveur', 500);
  }
};

// ── PUT /notifications/:id/lu ────────────────
const marquerCommeLue = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET lu = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    return success(res, null, 'Notification marquée comme lue');
  } catch (err) {
    return error(res, 'Erreur serveur', 500);
  }
};

// ── PUT /notifications/toutes-lues ───────────
const marquerToutesLues = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET lu = 1 WHERE user_id = ?',
      [req.user.id]
    );
    return success(res, null, 'Toutes les notifications marquées comme lues');
  } catch (err) {
    return error(res, 'Erreur serveur', 500);
  }
};

module.exports = { getNotifications, marquerCommeLue, marquerToutesLues };
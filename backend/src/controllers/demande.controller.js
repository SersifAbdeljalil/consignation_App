// src/controllers/demande.controller.js
const db                     = require('../config/db');
const { success, error }     = require('../utils/response');
const { envoyerNotification } = require('../services/notification.service');

// ── Générer numéro ordre unique ──────────────
const genererNumero = async () => {
  const annee = new Date().getFullYear();
  const [rows] = await db.query(
    'SELECT COUNT(*) AS total FROM demandes_consignation WHERE YEAR(created_at) = ?',
    [annee]
  );
  const num = (rows[0].total + 1).toString().padStart(4, '0');
  return `CONS-${annee}-${num}`;
};

// ── POST /demandes — Créer une demande ───────
const creerDemande = async (req, res) => {
  try {
    const { equipement_id, raison, date_souhaitee, localisation } = req.body;
    const agent_id = req.user.id;

    if (!equipement_id || !raison || !date_souhaitee) {
      return error(res, 'Équipement, raison et date sont requis', 400);
    }

    // Vérifier équipement
    const [eq] = await db.query('SELECT id, nom FROM equipements WHERE id = ? AND actif = 1', [equipement_id]);
    if (!eq.length) return error(res, 'Équipement introuvable', 404);

    const numero_ordre = await genererNumero();

    const [result] = await db.query(
      `INSERT INTO demandes_consignation
       (numero_ordre, equipement_id, agent_id, raison, date_souhaitee, localisation, statut)
       VALUES (?, ?, ?, ?, ?, ?, 'en_attente')`,
      [numero_ordre, equipement_id, agent_id, raison, date_souhaitee, localisation || null]
    );

    // Notifier tous les chefs de production
    const [chefs] = await db.query(
      `SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.nom = 'chef_prod' AND u.actif = 1`
    );
    for (const chef of chefs) {
      await envoyerNotification(
        chef.id,
        '📋 Nouvelle demande de consignation',
        `${req.user.prenom} ${req.user.nom} a soumis la demande ${numero_ordre} pour ${eq[0].nom}`,
        'demande',
        `demande/${result.insertId}`
      );
    }

    return success(res, { id: result.insertId, numero_ordre }, 'Demande soumise avec succès', 201);
  } catch (err) {
    console.error('creerDemande error:', err);
    return error(res, 'Erreur serveur', 500);
  }
};

// ── GET /demandes/mes-demandes — Demandes de l'agent ──
const getMesDemandes = async (req, res) => {
  try {
    const agent_id = req.user.id;
    const { statut } = req.query;

    let query = `
      SELECT d.*, e.nom AS equipement_nom, e.code_equipement
      FROM demandes_consignation d
      JOIN equipements e ON d.equipement_id = e.id
      WHERE d.agent_id = ?
    `;
    const params = [agent_id];

    if (statut) {
      query += ' AND d.statut = ?';
      params.push(statut);
    }

    query += ' ORDER BY d.created_at DESC';

    const [rows] = await db.query(query, params);
    return success(res, rows, 'Demandes récupérées');
  } catch (err) {
    console.error('getMesDemandes error:', err);
    return error(res, 'Erreur serveur', 500);
  }
};

// ── GET /demandes/:id — Détail demande ───────
const getDemandeById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.*, e.nom AS equipement_nom, e.code_equipement, e.localisation AS eq_localisation,
              CONCAT(u.prenom, ' ', u.nom) AS agent_nom
       FROM demandes_consignation d
       JOIN equipements e ON d.equipement_id = e.id
       JOIN users u ON d.agent_id = u.id
       WHERE d.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return error(res, 'Demande introuvable', 404);
    return success(res, rows[0], 'Demande récupérée');
  } catch (err) {
    return error(res, 'Erreur serveur', 500);
  }
};

module.exports = { creerDemande, getMesDemandes, getDemandeById };
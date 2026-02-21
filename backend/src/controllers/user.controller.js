// src/controllers/user.controller.js
const bcrypt = require('bcryptjs');
const db     = require('../config/db');
const { success, error } = require('../utils/response');

// ─── LISTER TOUS LES USERS ─────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.nom, u.prenom, u.username, u.matricule,
              u.badge_ocp_id, u.entite, u.actif, u.created_at,
              r.nom AS role, r.id AS role_id
       FROM users u
       JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC`
    );
    return success(res, rows, 'Liste des utilisateurs récupérée');
  } catch (err) {
    console.error('getUsers error:', err);
    return error(res, 'Erreur serveur', 500);
  }
};

// ─── RÉCUPÉRER UN USER PAR ID ──────────────────────────────
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT u.id, u.nom, u.prenom, u.username, u.matricule,
              u.badge_ocp_id, u.entite, u.actif, u.created_at,
              r.nom AS role, r.id AS role_id
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [id]
    );
    if (!rows.length) {
      return error(res, 'Utilisateur introuvable', 404);
    }
    return success(res, rows[0], 'Utilisateur récupéré');
  } catch (err) {
    console.error('getUserById error:', err);
    return error(res, 'Erreur serveur', 500);
  }
};

// ─── CRÉER UN USER ─────────────────────────────────────────
const createUser = async (req, res) => {
  try {
    const { nom, prenom, username, mot_de_passe, matricule,
            badge_ocp_id, role_id, entite } = req.body;

    // Validation champs obligatoires
    if (!nom || !prenom || !username || !mot_de_passe || !role_id) {
      return error(res, 'Champs obligatoires : nom, prenom, username, mot_de_passe, role_id', 400);
    }
    if (mot_de_passe.length < 6) {
      return error(res, 'Le mot de passe doit contenir au moins 6 caractères', 400);
    }

    // Vérifier que le rôle existe
    const [roles] = await db.query('SELECT id FROM roles WHERE id = ?', [role_id]);
    if (!roles.length) {
      return error(res, 'Rôle invalide', 400);
    }

    // Vérifier unicité username
    const [existUser] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existUser.length) {
      return error(res, 'Ce nom d\'utilisateur est déjà pris', 409);
    }

    // Vérifier unicité matricule si fourni
    if (matricule) {
      const [existMat] = await db.query('SELECT id FROM users WHERE matricule = ?', [matricule]);
      if (existMat.length) {
        return error(res, 'Ce matricule est déjà utilisé', 409);
      }
    }

    // Vérifier unicité badge_ocp_id si fourni
    if (badge_ocp_id) {
      const [existBadge] = await db.query('SELECT id FROM users WHERE badge_ocp_id = ?', [badge_ocp_id]);
      if (existBadge.length) {
        return error(res, 'Ce badge OCP est déjà utilisé', 409);
      }
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);

    const [result] = await db.query(
      `INSERT INTO users (nom, prenom, username, mot_de_passe, matricule, badge_ocp_id, role_id, entite)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nom, prenom, username, hash, matricule || null, badge_ocp_id || null, role_id, entite || null]
    );

    const [newUser] = await db.query(
      `SELECT u.id, u.nom, u.prenom, u.username, u.matricule,
              u.badge_ocp_id, u.entite, u.actif, u.created_at,
              r.nom AS role, r.id AS role_id
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [result.insertId]
    );

    return success(res, newUser[0], 'Utilisateur créé avec succès', 201);
  } catch (err) {
    console.error('createUser error:', err);
    return error(res, 'Erreur serveur', 500);
  }
};

// ─── MODIFIER UN USER ──────────────────────────────────────
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, username, matricule, badge_ocp_id, role_id, entite, actif } = req.body;

    // Vérifier que le user existe
    const [exist] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (!exist.length) {
      return error(res, 'Utilisateur introuvable', 404);
    }

    // Vérifier unicité username si modifié
    if (username) {
      const [existUser] = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
      if (existUser.length) {
        return error(res, 'Ce nom d\'utilisateur est déjà pris', 409);
      }
    }

    // Vérifier unicité matricule si modifié
    if (matricule) {
      const [existMat] = await db.query('SELECT id FROM users WHERE matricule = ? AND id != ?', [matricule, id]);
      if (existMat.length) {
        return error(res, 'Ce matricule est déjà utilisé', 409);
      }
    }

    // Vérifier que le rôle existe si modifié
    if (role_id) {
      const [roles] = await db.query('SELECT id FROM roles WHERE id = ?', [role_id]);
      if (!roles.length) {
        return error(res, 'Rôle invalide', 400);
      }
    }

    await db.query(
      `UPDATE users SET
        nom        = COALESCE(?, nom),
        prenom     = COALESCE(?, prenom),
        username   = COALESCE(?, username),
        matricule  = COALESCE(?, matricule),
        badge_ocp_id = COALESCE(?, badge_ocp_id),
        role_id    = COALESCE(?, role_id),
        entite     = COALESCE(?, entite),
        actif      = COALESCE(?, actif)
       WHERE id = ?`,
      [nom, prenom, username, matricule, badge_ocp_id, role_id,
       entite, actif !== undefined ? actif : null, id]
    );

    const [updated] = await db.query(
      `SELECT u.id, u.nom, u.prenom, u.username, u.matricule,
              u.badge_ocp_id, u.entite, u.actif, u.created_at,
              r.nom AS role, r.id AS role_id
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [id]
    );

    return success(res, updated[0], 'Utilisateur modifié avec succès');
  } catch (err) {
    console.error('updateUser error:', err);
    return error(res, 'Erreur serveur', 500);
  }
};

// ─── ACTIVER / DÉSACTIVER UN USER ─────────────────────────
const toggleUserActif = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT id, actif FROM users WHERE id = ?', [id]);
    if (!rows.length) {
      return error(res, 'Utilisateur introuvable', 404);
    }
    // Empêcher de désactiver son propre compte
    if (parseInt(id) === req.user.id) {
      return error(res, 'Vous ne pouvez pas désactiver votre propre compte', 400);
    }
    const nouvelEtat = !rows[0].actif;
    await db.query('UPDATE users SET actif = ? WHERE id = ?', [nouvelEtat, id]);
    return success(res, { actif: nouvelEtat },
      nouvelEtat ? 'Compte activé avec succès' : 'Compte désactivé avec succès');
  } catch (err) {
    console.error('toggleUserActif error:', err);
    return error(res, 'Erreur serveur', 500);
  }
};

// ─── RÉINITIALISER MOT DE PASSE (admin) ───────────────────
const resetMotDePasse = async (req, res) => {
  try {
    const { id } = req.params;
    const { nouveau_mot_de_passe } = req.body;

    if (!nouveau_mot_de_passe || nouveau_mot_de_passe.length < 6) {
      return error(res, 'Le mot de passe doit contenir au moins 6 caractères', 400);
    }
    const [rows] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (!rows.length) {
      return error(res, 'Utilisateur introuvable', 404);
    }
    const hash = await bcrypt.hash(nouveau_mot_de_passe, 10);
    await db.query('UPDATE users SET mot_de_passe = ? WHERE id = ?', [hash, id]);
    return success(res, null, 'Mot de passe réinitialisé avec succès');
  } catch (err) {
    console.error('resetMotDePasse error:', err);
    return error(res, 'Erreur serveur', 500);
  }
};

// ─── LISTER LES RÔLES ─────────────────────────────────────
const getRoles = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM roles ORDER BY id');
    return success(res, rows, 'Rôles récupérés');
  } catch (err) {
    console.error('getRoles error:', err);
    return error(res, 'Erreur serveur', 500);
  }
};

module.exports = {
  getUsers, getUserById, createUser,
  updateUser, toggleUserActif, resetMotDePasse, getRoles
};
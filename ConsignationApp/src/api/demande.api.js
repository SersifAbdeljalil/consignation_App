// src/api/demande.api.js
import client from './client';

// ── Créer une demande
export const creerDemande = async (data) => {
  const res = await client.post('/demandes', data);
  return res.data;
};

// ── Mes demandes (filtrées par agent connecté)
export const getMesDemandes = async (statut = null) => {
  const params = statut ? { statut } : {};
  const res = await client.get('/demandes/mes-demandes', { params });
  return res.data;
};

// ── Détail d'une demande
export const getDemandeById = async (id) => {
  const res = await client.get(`/demandes/${id}`);
  return res.data;
};

// ── Liste équipements pour le formulaire
export const getEquipements = async () => {
  const res = await client.get('/equipements');
  return res.data;
};
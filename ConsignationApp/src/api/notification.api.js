// src/api/notification.api.js
import client from './client';

// ── Récupérer toutes les notifications
export const getNotifications = async () => {
  const res = await client.get('/notifications');
  return res.data;
};

// ── Notifications non lues seulement
export const getNotificationsNonLues = async () => {
  const res = await client.get('/notifications?non_lues=true');
  return res.data;
};

// ── Marquer une notification comme lue
export const marquerCommeLue = async (id) => {
  const res = await client.put(`/notifications/${id}/lu`);
  return res.data;
};

// ── Marquer toutes comme lues
export const marquerToutesLues = async () => {
  const res = await client.put('/notifications/toutes-lues');
  return res.data;
};
// src/components/shared/notifications.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StatusBar, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACE } from '../../styles/variables.css';
import S from '../../styles/notification.css';
import { getNotifications, marquerCommeLue, marquerToutesLues } from '../../api/notification.api';

// ── Config icône par type de notification ────
const TYPE_CONFIG = {
  demande:         { icon: 'document-text-outline',  bg: COLORS.bluePale,   color: COLORS.blue },
  validation:      { icon: 'checkmark-circle-outline', bg: COLORS.greenPale, color: COLORS.green },
  rejet:           { icon: 'close-circle-outline',   bg: '#FFEBEE',          color: COLORS.error },
  plan:            { icon: 'clipboard-outline',      bg: '#FFF8E1',          color: COLORS.warning },
  execution:       { icon: 'construct-outline',      bg: COLORS.bluePale,   color: COLORS.blue },
  autorisation:    { icon: 'shield-checkmark-outline', bg: COLORS.greenPale, color: COLORS.green },
  intervention:    { icon: 'people-outline',         bg: '#F3E5F5',          color: '#6A1B9A' },
  deconsignation:  { icon: 'lock-open-outline',      bg: '#FFF8E1',          color: COLORS.warning },
  remise_service:  { icon: 'power-outline',          bg: COLORS.greenPale,  color: COLORS.green },
};

const formatTemps = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Il y a ${days}j`;
};

export default function Notifications({ navigation }) {
  const [notifs, setNotifs]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const charger = async () => {
    try {
      const res = await getNotifications();
      if (res.success) setNotifs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    charger();
    // Polling toutes les 30s
    const interval = setInterval(charger, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); charger(); }, []);

  const handleMarquerLue = async (notif) => {
    if (notif.lu) return;
    try {
      await marquerCommeLue(notif.id);
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, lu: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarquerToutesLues = async () => {
    try {
      await marquerToutesLues();
      setNotifs(prev => prev.map(n => ({ ...n, lu: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const nonLues = notifs.filter(n => !n.lu).length;

  const renderNotif = ({ item }) => {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.demande;
    return (
      <TouchableOpacity
        style={[S.notifCard, !item.lu && S.notifCardUnread]}
        onPress={() => handleMarquerLue(item)}
        activeOpacity={0.8}
      >
        {/* Icône */}
        <View style={[S.notifIconContainer, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={22} color={cfg.color} />
        </View>

        {/* Contenu */}
        <View style={S.notifContent}>
          <Text style={S.notifTitle}>{item.titre}</Text>
          <Text style={S.notifMessage} numberOfLines={2}>{item.message}</Text>
          <Text style={S.notifTime}>{formatTemps(item.created_at)}</Text>
        </View>

        {/* Point non lu */}
        {!item.lu && <View style={S.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.greenDark} />

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>
          Notifications {nonLues > 0 ? `(${nonLues})` : ''}
        </Text>
        {nonLues > 0
          ? <TouchableOpacity style={S.markAllBtn} onPress={handleMarquerToutesLues}>
              <Text style={S.markAllText}>Tout lire</Text>
            </TouchableOpacity>
          : <View style={{ width: 60 }} />
        }
      </View>

      {/* Liste */}
      {loading
        ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.green} />
          </View>
        : <FlatList
            data={notifs}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderNotif}
            contentContainerStyle={S.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.green]} />}
            ListEmptyComponent={
              <View style={S.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={55} color={COLORS.grayMedium} />
                <Text style={S.emptyText}>Aucune notification</Text>
              </View>
            }
          />
      }
    </View>
  );
}
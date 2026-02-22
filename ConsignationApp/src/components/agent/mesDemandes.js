// src/components/agent/mesDemandes.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StatusBar, RefreshControl, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACE } from '../../styles/variables.css';
import S from '../../styles/demande.css';
import { getMesDemandes } from '../../api/demande.api';

const FILTRES = [
  { key: null,          label: 'Toutes' },
  { key: 'en_attente',  label: 'En attente' },
  { key: 'validee',     label: 'Validées' },
  { key: 'en_cours',    label: 'En cours' },
  { key: 'rejetee',     label: 'Rejetées' },
  { key: 'cloturee',    label: 'Clôturées' },
];

const STATUT_CONFIG = {
  en_attente:  { color: COLORS.warning,  bg: '#FFF8E1', label: 'EN ATTENTE',  borderColor: COLORS.warning },
  validee:     { color: COLORS.green,    bg: COLORS.greenPale, label: 'VALIDÉE',    borderColor: COLORS.green },
  rejetee:     { color: COLORS.error,    bg: '#FFEBEE', label: 'REJETÉE',     borderColor: COLORS.error },
  en_cours:    { color: COLORS.blue,     bg: COLORS.bluePale,  label: 'EN COURS',   borderColor: COLORS.blue },
  deconsignee: { color: '#6A1B9A',       bg: '#F3E5F5', label: 'DÉCONSIGNÉE', borderColor: '#6A1B9A' },
  cloturee:    { color: COLORS.grayDark, bg: COLORS.grayLight, label: 'CLÔTURÉE',   borderColor: COLORS.grayDark },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
};

export default function MesDemandes({ navigation }) {
  const [demandes, setDemandes]     = useState([]);
  const [filtre, setFiltre]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const charger = async (statutFiltre = null) => {
    try {
      const res = await getMesDemandes(statutFiltre);
      if (res.success) setDemandes(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { charger(filtre); }, [filtre]);

  const onRefresh = useCallback(() => { setRefreshing(true); charger(filtre); }, [filtre]);

  const renderDemande = ({ item }) => {
    const cfg = STATUT_CONFIG[item.statut] || STATUT_CONFIG.en_attente;
    return (
      <View style={[S.demandeCard, { borderLeftColor: cfg.borderColor }]}>
        <View style={S.demandeTop}>
          <Text style={S.demandeNum}>{item.numero_ordre}</Text>
          <View style={[S.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[S.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
        <Text style={S.demandeEquip}>{item.equipement_nom || 'Équipement'}</Text>
        <Text style={S.demandeRaison} numberOfLines={2}>{item.raison}</Text>
        <View style={S.demandeBottom}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.gray} />
          <Text style={S.demandeDate}>{formatDate(item.date_souhaitee)}</Text>
          {item.statut === 'rejetee' && item.commentaire_rejet && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: SPACE.sm }}>
              <Ionicons name="information-circle-outline" size={13} color={COLORS.error} />
              <Text style={{ fontSize: FONTS.size.xs, color: COLORS.error, marginLeft: 3 }} numberOfLines={1}>
                {item.commentaire_rejet}
              </Text>
            </View>
          )}
        </View>
      </View>
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
        <Text style={S.headerTitle}>Mes Demandes</Text>
        <View style={S.placeholder} />
      </View>

      {/* Filtres */}
      <View style={{ backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.grayMedium }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: SPACE.sm, gap: SPACE.sm, flexDirection: 'row' }}>
          {FILTRES.map((f) => (
            <TouchableOpacity
              key={f.key ?? 'all'}
              style={[S.filterChip, filtre === f.key && S.filterChipActive]}
              onPress={() => setFiltre(f.key)}
            >
              <Text style={[S.filterChipText, filtre === f.key && S.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste */}
      {loading
        ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.green} />
          </View>
        : <FlatList
            data={demandes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderDemande}
            contentContainerStyle={S.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.green]} />}
            ListEmptyComponent={
              <View style={S.emptyContainer}>
                <Ionicons name="document-text-outline" size={50} color={COLORS.grayMedium} />
                <Text style={S.emptyText}>Aucune demande trouvée</Text>
                <Text style={S.emptySubText}>Créez votre première demande</Text>
              </View>
            }
          />
      }
    </View>
  );
}
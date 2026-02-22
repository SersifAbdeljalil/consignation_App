// src/components/agent/nouvelleDemande.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StatusBar, ActivityIndicator,
  Alert, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACE } from '../../styles/variables.css';
import S from '../../styles/demande.css';
import { creerDemande, getEquipements } from '../../api/demande.api';

export default function NouvelleDemande({ navigation }) {
  const [equipements, setEquipements]       = useState([]);
  const [equipementSel, setEquipementSel]   = useState(null);
  const [raison, setRaison]                 = useState('');
  const [dateSouhaitee, setDateSouhaitee]   = useState('');
  const [localisation, setLocalisation]     = useState('');
  const [loading, setLoading]               = useState(false);
  const [loadingEq, setLoadingEq]           = useState(true);
  const [showModal, setShowModal]           = useState(false);
  const [errMsg, setErrMsg]                 = useState('');

  useEffect(() => {
    const chargerEquipements = async () => {
      try {
        const res = await getEquipements();
        if (res.success) setEquipements(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingEq(false);
      }
    };
    chargerEquipements();
  }, []);

  const handleSoumettre = async () => {
    setErrMsg('');
    if (!equipementSel) { setErrMsg('Veuillez sélectionner un équipement'); return; }
    if (!raison.trim()) { setErrMsg('Veuillez saisir la raison de l\'intervention'); return; }
    if (!dateSouhaitee.trim()) { setErrMsg('Veuillez saisir la date souhaitée'); return; }

    setLoading(true);
    try {
      const res = await creerDemande({
        equipement_id:  equipementSel.id,
        raison:         raison.trim(),
        date_souhaitee: dateSouhaitee.trim(),
        localisation:   localisation.trim(),
      });
      if (res.success) {
        Alert.alert(
          '✅ Demande soumise !',
          `Votre demande ${res.data.numero_ordre} a été envoyée au chef de production.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        setErrMsg(res.message || 'Erreur lors de la soumission');
      }
    } catch (e) {
      setErrMsg('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.greenDark} />

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Nouvelle Demande</Text>
        <View style={S.placeholder} />
      </View>

      <ScrollView style={S.formBody} showsVerticalScrollIndicator={false}>
        <View style={S.formCard}>

          {/* Équipement */}
          <View style={S.formGroup}>
            <Text style={S.formLabel}>
              Équipement <Text style={S.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={S.formInput}
              onPress={() => setShowModal(true)}
            >
              {loadingEq
                ? <ActivityIndicator size="small" color={COLORS.green} />
                : <Text style={equipementSel ? S.formInputText : S.formInputPlaceholder}>
                    {equipementSel ? `${equipementSel.code_equipement} — ${equipementSel.nom}` : 'Sélectionner un équipement'}
                  </Text>
              }
              <Ionicons name="chevron-down" size={18} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          {/* Raison */}
          <View style={S.formGroup}>
            <Text style={S.formLabel}>
              Raison d'intervention <Text style={S.required}>*</Text>
            </Text>
            <TextInput
              style={S.formTextarea}
              placeholder="Décrivez la raison de l'intervention..."
              placeholderTextColor={COLORS.gray}
              value={raison}
              onChangeText={(t) => { setRaison(t); setErrMsg(''); }}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Date souhaitée */}
          <View style={S.formGroup}>
            <Text style={S.formLabel}>
              Date souhaitée <Text style={S.required}>*</Text>
            </Text>
            <View style={S.formInput}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.gray} style={{ marginRight: SPACE.sm }} />
              <TextInput
                style={[S.formInputText, { flex: 1 }]}
                placeholder="JJ/MM/AAAA"
                placeholderTextColor={COLORS.gray}
                value={dateSouhaitee}
                onChangeText={(t) => { setDateSouhaitee(t); setErrMsg(''); }}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Localisation */}
          <View style={S.formGroup}>
            <Text style={S.formLabel}>Localisation</Text>
            <View style={S.formInput}>
              <Ionicons name="location-outline" size={18} color={COLORS.gray} style={{ marginRight: SPACE.sm }} />
              <TextInput
                style={[S.formInputText, { flex: 1 }]}
                placeholder="Zone / Bâtiment (optionnel)"
                placeholderTextColor={COLORS.gray}
                value={localisation}
                onChangeText={setLocalisation}
              />
            </View>
          </View>

          {/* Erreur */}
          {errMsg ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE', borderRadius: 10, padding: SPACE.md, marginBottom: SPACE.md, borderLeftWidth: 4, borderLeftColor: COLORS.error }}>
              <Ionicons name="warning-outline" size={16} color={COLORS.error} style={{ marginRight: SPACE.sm }} />
              <Text style={{ color: COLORS.error, fontSize: FONTS.size.sm, flex: 1 }}>{errMsg}</Text>
            </View>
          ) : null}

          {/* Bouton */}
          <TouchableOpacity
            style={[S.btnPrimary, loading && S.btnDisabled]}
            onPress={handleSoumettre}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <>
                  <Ionicons name="send-outline" size={18} color={COLORS.white} />
                  <Text style={S.btnPrimaryText}>SOUMETTRE LA DEMANDE</Text>
                </>
            }
          </TouchableOpacity>
        </View>
        <View style={{ height: SPACE.xxxl }} />
      </ScrollView>

      {/* Modal sélection équipement */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: SPACE.base, borderBottomWidth: 1, borderBottomColor: COLORS.grayMedium }}>
              <Text style={{ flex: 1, fontSize: FONTS.size.lg, fontWeight: FONTS.weight.bold, color: COLORS.grayDeep }}>
                Sélectionner un équipement
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.grayDark} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={equipements}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ padding: SPACE.base, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => { setEquipementSel(item); setShowModal(false); setErrMsg(''); }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: FONTS.size.base, fontWeight: FONTS.weight.semibold, color: COLORS.grayDeep }}>{item.nom}</Text>
                    <Text style={{ fontSize: FONTS.size.xs, color: COLORS.gray, marginTop: 2 }}>{item.code_equipement} — {item.localisation}</Text>
                  </View>
                  {equipementSel?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.green} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
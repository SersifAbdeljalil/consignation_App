// src/components/auth/changemotpas.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../styles/variables.css';
import S from '../../styles/change.css';

export default function ChangerMotDePasse({ navigation }) {
  const [ancienMdp, setAncienMdp]       = useState('');
  const [nouveauMdp, setNouveauMdp]     = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading]           = useState(false);
  const [errMsg, setErrMsg]             = useState('');
  const [showAncien, setShowAncien]     = useState(false);
  const [showNouveau, setShowNouveau]   = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  const handleChanger = async () => {
    setErrMsg('');
    if (!ancienMdp || !nouveauMdp || !confirmation) {
      setErrMsg('Tous les champs sont requis');
      return;
    }
    if (nouveauMdp.length < 6) {
      setErrMsg('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (nouveauMdp !== confirmation) {
      setErrMsg('Le nouveau mot de passe et la confirmation ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch('http://YOUR_SERVER_IP:3000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ancien_mot_de_passe:  ancienMdp,
          nouveau_mot_de_passe: nouveauMdp,
          confirmation,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Succès', 'Mot de passe modifié avec succès', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        setErrMsg(data.message || 'Erreur lors du changement');
      }
    } catch (e) {
      setErrMsg('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // ── Composant champ mot de passe ────────────────────────
  const InputMdp = ({ label, value, onChange, show, toggle, placeholder }) => (
    <View style={S.inputGroup}>
      <Text style={S.inputLabel}>{label}</Text>
      <View style={S.inputWrapper}>
        <Ionicons name="lock-closed-outline" size={18} color={COLORS.gray} style={{ marginRight: 8 }} />
        <TextInput
          style={S.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
          value={value}
          onChangeText={(t) => { onChange(t); setErrMsg(''); }}
          secureTextEntry={!show}
        />
        <TouchableOpacity onPress={toggle} style={S.eyeBtn}>
          <Ionicons
            name={show ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={COLORS.gray}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.greenDark} />

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Modifier le mot de passe</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={S.body} showsVerticalScrollIndicator={false}>

        {/* Info */}
        <View style={S.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.blue} style={{ marginRight: 6 }} />
          <Text style={S.infoText}>
            Le nouveau mot de passe doit contenir au moins 6 caractères.
          </Text>
        </View>

        {/* Card */}
        <View style={S.card}>
          <InputMdp
            label="Ancien mot de passe"
            placeholder="Votre mot de passe actuel"
            value={ancienMdp}
            onChange={setAncienMdp}
            show={showAncien}
            toggle={() => setShowAncien(!showAncien)}
          />
          <InputMdp
            label="Nouveau mot de passe"
            placeholder="Nouveau mot de passe"
            value={nouveauMdp}
            onChange={setNouveauMdp}
            show={showNouveau}
            toggle={() => setShowNouveau(!showNouveau)}
          />
          <InputMdp
            label="Confirmer le nouveau mot de passe"
            placeholder="Répétez le nouveau mot de passe"
            value={confirmation}
            onChange={setConfirmation}
            show={showConfirm}
            toggle={() => setShowConfirm(!showConfirm)}
          />

          {/* Erreur */}
          {errMsg ? (
            <View style={[S.errorBox, { flexDirection: 'row', alignItems: 'center' }]}>
              <Ionicons name="warning-outline" size={16} color={COLORS.error} style={{ marginRight: 6 }} />
              <Text style={S.errorText}>{errMsg}</Text>
            </View>
          ) : null}

          {/* Bouton */}
          <TouchableOpacity
            style={[S.btn, loading && S.btnDisabled]}
            onPress={handleChanger}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                  <Text style={S.btnText}>MODIFIER LE MOT DE PASSE</Text>
                </View>
              )
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
// src/components/shared/profil.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SPACE } from '../../styles/variables.css';
import S from '../../styles/profil.css';
import client from '../../api/client';

// ── Pays disponibles ─────────────────────────
const PAYS = [
  { code: '+212', label: 'Maroc',  flag: '🇲🇦', format: '06 XX XX XX XX' },
  { code: '+33',  label: 'France', flag: '🇫🇷', format: '06 XX XX XX XX' },
];

export default function Profil({ navigation }) {
  const [user, setUser]                   = useState(null);
  const [telephone, setTelephone]         = useState('');
  const [paysSelIndex, setPaysSelIndex]   = useState(0); // 0 = Maroc par défaut
  const [showPays, setShowPays]           = useState(false);
  const [loadingTel, setLoadingTel]       = useState(false);
  const [codeVerif, setCodeVerif]         = useState('');
  const [showVerif, setShowVerif]         = useState(false);
  const [loadingVerif, setLoadingVerif]   = useState(false);

  useEffect(() => {
    const charger = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        setUser(u);
        // Charger téléphone existant
        if (u.telephone) {
          const tel = u.telephone;
          const paysTrouve = PAYS.findIndex(p => tel.startsWith(p.code));
          if (paysTrouve !== -1) {
            setPaysSelIndex(paysTrouve);
            setTelephone(tel.replace(PAYS[paysTrouve].code, '').trim());
          } else {
            setTelephone(tel);
          }
        }
      }
    };
    charger();
  }, []);

  // ── Enregistrer téléphone → envoi SMS ───────
  const handleSauveTelephone = async () => {
    if (!telephone.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un numéro de téléphone');
      return;
    }
    setLoadingTel(true);
    try {
      const numeroComplet = `${PAYS[paysSelIndex].code} ${telephone.trim()}`;
      const res = await client.put('/users/telephone', {
        telephone: numeroComplet,
      });
      if (res.data.success) {
        // Simuler envoi SMS de vérification
        setShowVerif(true);
        Alert.alert(
          '📱 SMS envoyé !',
          `Un code de vérification a été envoyé au ${numeroComplet}`
        );
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le téléphone');
    } finally {
      setLoadingTel(false);
    }
  };

  // ── Vérifier code SMS ────────────────────────
  const handleVerifierCode = async () => {
    if (codeVerif.length !== 6) {
      Alert.alert('Erreur', 'Le code doit contenir 6 chiffres');
      return;
    }
    setLoadingVerif(true);
    try {
      const res = await client.post('/users/verifier-telephone', { code: codeVerif });
      if (res.data.success) {
        setShowVerif(false);
        // Mettre à jour AsyncStorage
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          u.telephone = `${PAYS[paysSelIndex].code} ${telephone.trim()}`;
          await AsyncStorage.setItem('user', JSON.stringify(u));
          setUser(u);
        }
        Alert.alert('✅ Succès', 'Numéro de téléphone vérifié et enregistré !');
      } else {
        Alert.alert('Erreur', 'Code incorrect. Réessayez.');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Code incorrect ou expiré');
    } finally {
      setLoadingVerif(false);
    }
  };

  // ── Déconnexion ──────────────────────────────
  const handleDeconnexion = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            navigation.replace('AuthStack');
          },
        },
      ]
    );
  };

  const paysSel = PAYS[paysSelIndex];

  return (
    <View style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.greenDark} />

      {/* Header profil */}
      <View style={S.header}>
        <View style={S.headerDeco} />
        <TouchableOpacity
          style={{ position: 'absolute', top: 50, left: SPACE.base, width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={S.avatar}>
          <Ionicons name="person" size={34} color={COLORS.white} />
        </View>
        <Text style={S.profilName}>{user?.prenom} {user?.nom}</Text>
        <Text style={S.profilRole}>{user?.role?.toUpperCase()}</Text>
      </View>

      <ScrollView style={S.body} showsVerticalScrollIndicator={false}>

        {/* ── Informations ── */}
        <View style={S.card}>
          <View style={S.cardTitle}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.green} />
            <Text style={{ fontSize: FONTS.size.md, fontWeight: FONTS.weight.bold, color: COLORS.grayDeep }}>
              Informations
            </Text>
          </View>
          {[
            { label: 'Matricule', value: user?.matricule || '—' },
            { label: 'Entité',    value: user?.entite    || '—' },
            { label: 'Rôle',      value: user?.role      || '—' },
          ].map((row, i, arr) => (
            <View key={i} style={[S.infoRow, i === arr.length - 1 && S.infoRowLast]}>
              <Text style={S.infoLabel}>{row.label}</Text>
              <Text style={S.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Téléphone ── */}
        <View style={S.card}>
          <View style={S.cardTitle}>
            <Ionicons name="call-outline" size={18} color={COLORS.green} />
            <Text style={{ fontSize: FONTS.size.md, fontWeight: FONTS.weight.bold, color: COLORS.grayDeep }}>
              Téléphone
            </Text>
          </View>

          {/* Saisie */}
          <View style={S.telRow}>
            <TouchableOpacity style={S.telCountryBtn} onPress={() => setShowPays(!showPays)}>
              <Text style={{ fontSize: 16 }}>{paysSel.flag}</Text>
              <Text style={S.telCountryText}>{paysSel.code}</Text>
              <Ionicons name={showPays ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.grayDark} />
            </TouchableOpacity>
            <TextInput
              style={S.telInput}
              placeholder={paysSel.format}
              placeholderTextColor={COLORS.gray}
              value={telephone}
              onChangeText={setTelephone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Liste pays */}
          {showPays && (
            <View style={S.countryList}>
              {PAYS.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  style={[S.countryOption, i === paysSelIndex && S.countryOptionSelected]}
                  onPress={() => { setPaysSelIndex(i); setShowPays(false); }}
                >
                  <Text style={{ fontSize: 18 }}>{p.flag}</Text>
                  <Text style={[S.countryOptionText, i === paysSelIndex && S.countryOptionTextSelected]}>
                    {p.label} {p.code}
                  </Text>
                  {i === paysSelIndex && <Ionicons name="checkmark" size={18} color={COLORS.green} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Info SMS */}
          <View style={S.smsBox}>
            <Ionicons name="phone-portrait-outline" size={16} color={COLORS.blue} />
            <Text style={S.smsText}>
              Un SMS de vérification sera envoyé après modification
            </Text>
          </View>

          {/* Bouton enregistrer */}
          <TouchableOpacity
            style={[S.btnSave, loadingTel && { opacity: 0.65 }]}
            onPress={handleSauveTelephone}
            disabled={loadingTel}
          >
            {loadingTel
              ? <ActivityIndicator color={COLORS.white} />
              : <>
                  <Ionicons name="save-outline" size={18} color={COLORS.white} />
                  <Text style={S.btnSaveText}>ENREGISTRER</Text>
                </>
            }
          </TouchableOpacity>

          {/* Vérification SMS */}
          {showVerif && (
            <View style={{ marginTop: SPACE.md, padding: SPACE.md, backgroundColor: COLORS.greenPale, borderRadius: 12 }}>
              <Text style={{ fontSize: FONTS.size.sm, fontWeight: FONTS.weight.semibold, color: COLORS.grayDeep, marginBottom: SPACE.sm }}>
                Entrez le code reçu par SMS :
              </Text>
              <TextInput
                style={[S.telInput, { letterSpacing: 8, textAlign: 'center', fontSize: FONTS.size.xl }]}
                placeholder="• • • • • •"
                placeholderTextColor={COLORS.gray}
                value={codeVerif}
                onChangeText={setCodeVerif}
                keyboardType="numeric"
                maxLength={6}
              />
              <TouchableOpacity
                style={[S.btnSave, { marginTop: SPACE.sm }]}
                onPress={handleVerifierCode}
                disabled={loadingVerif}
              >
                {loadingVerif
                  ? <ActivityIndicator color={COLORS.white} />
                  : <>
                      <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.white} />
                      <Text style={S.btnSaveText}>VÉRIFIER LE CODE</Text>
                    </>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Sécurité ── */}
        <View style={S.card}>
          <View style={S.cardTitle}>
            <Ionicons name="shield-outline" size={18} color={COLORS.green} />
            <Text style={{ fontSize: FONTS.size.md, fontWeight: FONTS.weight.bold, color: COLORS.grayDeep }}>
              Sécurité
            </Text>
          </View>
          <TouchableOpacity
            style={S.btnOutline}
            onPress={() => navigation.navigate('ChangerMotDePasse')}
          >
            <Ionicons name="key-outline" size={18} color={COLORS.green} />
            <Text style={S.btnOutlineText}>Changer le mot de passe</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.btnDanger} onPress={handleDeconnexion}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
            <Text style={S.btnDangerText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: SPACE.xxxl }} />
      </ScrollView>
    </View>
  );
}
// app/index.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { Journey, useJourney } from '../context/JourneyContext';

const LAST_PAGE_KEY = 'last_page';

type LastPage = {
  screen: 'trip' | 'menu' | 'supermarket' | 'attractions';
  journeyId: string | null;
};

export default function JourneyListScreen() {
  const router = useRouter();
  const { journeys, addJourney, setCurrentJourney, loaded } = useJourney();

  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [restored, setRestored] = useState(false);

  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  // 啟動時回到最後頁面
  useEffect(() => {
    if (!loaded || restored) return;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(LAST_PAGE_KEY);
        if (!raw) {
          setRestored(true);
          return;
        }
        const last = JSON.parse(raw) as LastPage;

        if (last.journeyId) {
          await setCurrentJourney(last.journeyId);
        }

        switch (last.screen) {
          case 'trip':
            router.replace('/trip');
            break;
          case 'menu':
            router.replace('/menu');
            break;
          case 'supermarket':
            router.replace('/supermarket');
            break;
          case 'attractions':
            router.replace('/attractions');
            break;
        }
      } catch (e) {
        console.warn('Failed to restore last page', e);
      } finally {
        setRestored(true);
      }
    })();
  }, [loaded, restored, router, setCurrentJourney]);

  const onAddJourney = async () => {
    if (!name.trim()) return;
    await addJourney(name, country);
    setName('');
    setCountry('');
    router.push('/trip');
  };

  const renderJourney = ({ item }: { item: Journey }) => (
    <TouchableOpacity
      style={styles.journeyCard}
      onPress={async () => {
        await setCurrentJourney(item.id);
        router.push('/trip');
      }}
    >
      <View style={styles.journeyCardHeader}>
        <Ionicons name="airplane-outline" size={20} color={colors.primary} />
        <Text style={styles.journeyName}>{item.name}</Text>
      </View>
      {!!item.country && (
        <Text style={styles.journeyCountry}>{item.country}</Text>
      )}
      <Text style={styles.journeyMeta}>
        建立於 {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : insets.bottom}
      >
        <View
          style={[
            styles.container,
            { paddingBottom: 24 + insets.bottom }, // 預留底部空間，避免被虛擬鍵/鍵盤吃掉
          ]}
        >
          <Text style={styles.title}>旅程管理</Text>
          <Text style={styles.subtitle}>
            建立不同旅程，分開紀錄拍照與對話
          </Text>

          {journeys.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>我的旅程</Text>
              <FlatList
                data={[...journeys].sort(
                  (a, b) => b.createdAt - a.createdAt
                )}
                keyExtractor={(item) => item.id}
                renderItem={renderJourney}
                style={{ marginBottom: 16, flexGrow: 0 }}
              />
            </>
          )}

          <Text style={styles.sectionTitle}>新增旅程</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="旅程名稱（例如：西班牙自由行）"
            placeholderTextColor={colors.textMuted}
          />
          <TextInput
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            placeholder="旅程地點 / 國家（例如：西班牙）"
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity
            style={[
              styles.addButton,
              !name.trim() && { opacity: 0.5 },
            ]}
            disabled={!name.trim()}
            onPress={onAddJourney}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addButtonText}>建立旅程</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.bg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    marginBottom: 8,
  },
  journeyCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  journeyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  journeyName: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  journeyCountry: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 4,
  },
  journeyMeta: {
    fontSize: 11,
    color: colors.textMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  addButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
  },
  addButtonText: {
    marginLeft: 4,
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

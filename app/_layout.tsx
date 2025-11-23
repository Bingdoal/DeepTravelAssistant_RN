// app/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import {
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { JourneyProvider, useJourney } from '../context/JourneyContext';
import { SettingsProvider } from '../context/SettingsContext';

function JourneyDrawerContent(props: DrawerContentComponentProps) {
  const { journeys, currentJourneyId, setCurrentJourney } = useJourney();

  const goToJourney = async (id: string) => {
    await setCurrentJourney(id);
    props.navigation.navigate('trip');
  };

  return (
    <SafeAreaView
      style={styles.drawerRoot}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerScroll}
      >
        <Text style={styles.drawerTitle}>我的旅程</Text>

        {journeys.map((j) => {
          const active = j.id === currentJourneyId;
          return (
            <TouchableOpacity
              key={j.id}
              style={[
                styles.journeyItem,
                active && styles.journeyItemActive,
              ]}
              onPress={() => goToJourney(j.id)}
            >
              <Ionicons
                name="airplane-outline"
                size={18}
                color={active ? colors.primary : colors.text}
              />
              <View style={{ marginLeft: 8 }}>
                <Text
                  style={[
                    styles.journeyName,
                    active && { color: colors.primary },
                  ]}
                >
                  {j.name}
                </Text>
                {!!j.country && (
                  <Text style={styles.journeyCountry}>{j.country}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.newJourneyButton}
          onPress={() => props.navigation.navigate('index')}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.newJourneyText}>新增旅程</Text>
        </TouchableOpacity>
      </DrawerContentScrollView>

      <View style={styles.drawerFooter}>
        <TouchableOpacity
          style={styles.settingsRow}
          onPress={() => props.navigation.navigate('settings')}
        >
          <Ionicons name="settings-outline" size={20} color={colors.text} />
          <Text style={styles.settingsText}>設定</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function RootDrawer() {
  return (
    <>
      <StatusBar style="light" backgroundColor={colors.bg} />
      <Drawer
        drawerContent={(props) => <JourneyDrawerContent {...props} />}
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
          drawerStyle: { backgroundColor: colors.surface },
          drawerActiveTintColor: colors.primary,
          drawerInactiveTintColor: colors.textMuted,
        }}
      >
        {/* 首頁：旅程列表 & 新增旅程 */}
        <Drawer.Screen
          name="index"
          options={{
            title: '旅程',
          }}
        />

        {/* 旅程首頁 */}
        <Drawer.Screen
          name="trip"
          options={{
            title: '旅程首頁',
            drawerItemStyle: { display: 'none' },
          }}
        />

        {/* 三個聊天頁 */}
        <Drawer.Screen
          name="menu"
          options={{
            title: '菜單助手',
            drawerItemStyle: { display: 'none' },
          }}
        />
        <Drawer.Screen
          name="supermarket"
          options={{
            title: '超市助手',
            drawerItemStyle: { display: 'none' },
          }}
        />
        <Drawer.Screen
          name="attractions"
          options={{
            title: '景點助手',
            drawerItemStyle: { display: 'none' },
          }}
        />

        {/* 設定 */}
        <Drawer.Screen
          name="settings"
          options={{
            title: '設定',
            drawerItemStyle: { display: 'none' },
          }}
        />
      </Drawer>
    </>
  );
}

export default function RootLayout() {
  return (
    <SettingsProvider>
      <JourneyProvider>
        <RootDrawer />
      </JourneyProvider>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  drawerRoot: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  drawerScroll: {
    paddingTop: 0,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  journeyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  journeyItemActive: {
    backgroundColor: '#111827',
  },
  journeyName: {
    fontSize: 15,
    color: colors.text,
  },
  journeyCountry: {
    fontSize: 12,
    color: colors.textMuted,
  },
  newJourneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 4,
  },
  newJourneyText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  drawerFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
  },
});

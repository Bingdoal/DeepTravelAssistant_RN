// app/trip.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { useJourney } from '../context/JourneyContext';

const LAST_PAGE_KEY = 'last_page';

export default function TripHomeScreen() {
    const router = useRouter();
    const { currentJourney } = useJourney();

    // 記錄最後頁面
    useEffect(() => {
        (async () => {
            await AsyncStorage.setItem(
                LAST_PAGE_KEY,
                JSON.stringify({
                    screen: 'trip',
                    journeyId: currentJourney ? currentJourney.id : null,
                })
            );
        })();
    }, [currentJourney]);

    if (!currentJourney) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <Text style={styles.title}>尚未選擇旅程</Text>
                    <Text style={styles.subtitle}>請先在左側選單或首頁建立旅程。</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={styles.safeArea}
            edges={['top', 'bottom', 'left', 'right']}
        >
            <View style={styles.container}>
                <Text style={styles.title}>{currentJourney.name}</Text>
                {!!currentJourney.country && (
                    <Text style={styles.subtitle}>{currentJourney.country}</Text>
                )}
                <Text style={styles.subtitleSmall}>
                    選擇你現在要查詢的情境
                </Text>

                <View style={styles.grid}>
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => router.push('/menu')}
                    >
                        <Ionicons
                            name="restaurant-outline"
                            size={32}
                            color={colors.menu}
                        />
                        <Text style={styles.cardTitle}>菜單</Text>
                        <Text style={styles.cardDesc}>拍菜單、餐點，了解內容與推薦</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => router.push('/supermarket')}
                    >
                        <Ionicons name="cart-outline" size={32} color={colors.market} />
                        <Text style={styles.cardTitle}>超市</Text>
                        <Text style={styles.cardDesc}>拍商品、零食、酒，了解成分與喝法</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => router.push('/attractions')}
                    >
                        <Ionicons name="map-outline" size={32} color={colors.attraction} />
                        <Text style={styles.cardTitle}>景點</Text>
                        <Text style={styles.cardDesc}>拍建築、雕像、海報，聽故事與背景</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
        color: colors.text,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 4,
    },
    subtitleSmall: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 12,
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    } as any,
    card: {
        flexBasis: '48%',
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardTitle: {
        marginTop: 12,
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    cardDesc: {
        marginTop: 4,
        fontSize: 13,
        color: colors.textMuted,
    },
});

// components/ChatScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHeaderHeight } from '@react-navigation/elements';
import { useFocusEffect } from '@react-navigation/native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { useJourney } from '../context/JourneyContext';
import { useSettings } from '../context/SettingsContext';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    imageUris?: string[];
};

type Attachment = {
    uri: string;
    base64?: string | null;
};

export type Category = 'menu' | 'supermarket' | 'attractions';

type ChatScreenProps = {
    title: string; // 這個現在只拿來決定 placeholder / 類別文案，UI 上用旅程名稱
    placeholder: string;
    category: Category;
};

const INPUT_BAR_HEIGHT = 50;
const MAX_IMAGE_SIZE = 1024;
const STORAGE_KEY_PREFIX = 'chat_history_';
const LAST_PAGE_KEY = 'last_page';

// expo-image-picker 新舊版相容
const IMAGE_MEDIA_TYPE: any =
    (ImagePicker as any).MediaType?.Image ??
    (ImagePicker as any).MediaTypeOptions?.Images ??
    ImagePicker.MediaTypeOptions.Images;

// route 映射：避免 `/${string}` 被推成 string
const routeMap: Record<Category, '/menu' | '/supermarket' | '/attractions'> = {
    menu: '/menu',
    supermarket: '/supermarket',
    attractions: '/attractions',
};

// tab 定義，用 Ionicons 的嚴格 name 型別
type TabDef = {
    key: Category;
    label: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    tint: string;
};

const tabs: TabDef[] = [
    {
        key: 'menu',
        label: '菜單',
        icon: 'restaurant-outline',
        tint: colors.menu ?? colors.primary,
    },
    {
        key: 'supermarket',
        label: '超市',
        icon: 'cart-outline',
        tint: colors.market ?? colors.primary,
    },
    {
        key: 'attractions',
        label: '景點',
        icon: 'map-outline',
        tint: colors.attraction ?? colors.primary,
    },
];
const screenWidth = Dimensions.get('window').width;
export default function ChatScreen({
    title,
    placeholder,
    category,
}: ChatScreenProps) {
    const { apiKey, isReady } = useSettings();
    const { currentJourney } = useJourney();
    const router = useRouter();
    const headerHeight = useHeaderHeight();

    const [messages, setMessages] = useState<Message[]>([]);
    const [searchActive, setSearchActive] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [input, setInput] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [lastLocation, setLastLocation] =
        useState<Location.LocationObject | null>(null);
    const insets = useSafeAreaInsets();
    const journeyId = currentJourney?.id ?? 'no_journey';
    const storageKey = `${STORAGE_KEY_PREFIX}${journeyId}_${category}`;
    const [previewImages, setPreviewImages] = useState<{
        uris: string[];
        index: number;
    } | null>(null);
    const scrollRef = useRef<ScrollView | null>(null);

    // ====== 記錄最後頁面 ======
    useEffect(() => {
        (async () => {
            await AsyncStorage.setItem(
                LAST_PAGE_KEY,
                JSON.stringify({
                    screen: category,
                    journeyId: currentJourney ? currentJourney.id : null,
                })
            );
        })();
    }, [category, currentJourney]);

    // ====== 載入聊天紀錄 ======
    useEffect(() => {
        (async () => {
            const raw = await AsyncStorage.getItem(storageKey);
            if (raw) setMessages(JSON.parse(raw));
            else setMessages([]);
        })();
    }, [storageKey]);

    // ====== 儲存聊天紀錄 ======
    useEffect(() => {
        AsyncStorage.setItem(storageKey, JSON.stringify(messages)).catch((e) =>
            console.warn('Failed to save chat history', e)
        );
    }, [messages, storageKey]);

    // ====== 初始化大圖預覽 model ======
    useEffect(() => {
        if (!previewImages || !scrollRef.current) return;

        const index = previewImages.index ?? 0;

        // 下一個 frame 再 scroll，避免還沒 layout 完就捲動
        requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({
                x: index * screenWidth,
                y: 0,
                animated: false,
            });
        });
    }, [previewImages, screenWidth]);


    // ====== 檢查 API key / Journey ======
    useFocusEffect(
        useCallback(() => {
            if (!isReady) return;

            if (!apiKey.trim()) {
                Alert.alert('尚未設定 API Key', '請先設定後使用功能。', [
                    { text: '前往設定', onPress: () => router.replace('/settings') },
                ]);
                return;
            }

            if (!currentJourney) {
                Alert.alert('尚未選擇旅程', '請先建立或選擇旅程。', [
                    { text: '前往旅程列表', onPress: () => router.replace('/') },
                ]);
            }
        }, [apiKey, isReady, currentJourney, router])
    );

    // ====== GPS ======
    const getCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return null;

            const pos = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            setLastLocation(pos);
            const { latitude, longitude, accuracy } = pos.coords;
            return { latitude, longitude, accuracy };
        } catch {
            return null;
        }
    };

    // ====== 圖片處理 ======
    const addProcessedImage = async (uri: string) => {
        const result = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: MAX_IMAGE_SIZE } }],
            { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        setAttachments((prev) => [
            ...prev,
            { uri: result.uri, base64: result.base64 ?? undefined },
        ]);
    };

    const handlePickFromLibrary = async () => {
        // ✅ 重新選圖前先清空預覽
        setAttachments([]);

        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
            Alert.alert('需要權限', '請允許存取相簿才能選擇照片。');
            return;
        }

        const result: any = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: IMAGE_MEDIA_TYPE,
            quality: 1,
            allowsMultipleSelection: true,
            selectionLimit: 10,
        });
        if (result.canceled) return;

        for (const asset of result.assets) await addProcessedImage(asset.uri);
    };

    const handleTakePhoto = async () => {
        // ✅ 拍照前也清空預覽
        setAttachments([]);

        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== 'granted') {
            Alert.alert('需要權限', '請允許相機權限才能拍照。');
            return;
        }

        const result: any = await ImagePicker.launchCameraAsync({
            mediaTypes: IMAGE_MEDIA_TYPE,
            quality: 1,
        });
        if (!result.canceled) await addProcessedImage(result.assets[0].uri);
    };

    // ====== 傳送訊息 ======
    const sendMessage = async () => {
        if (!input.trim() && attachments.length === 0) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim() || `（${attachments.length} 張圖片）`,
            imageUris:
                attachments.length > 0 ? attachments.map((a) => a.uri) : undefined,
        };

        setMessages((prev) => [...prev, userMsg]);

        const location = await getCurrentLocation();
        const imagesBase64 = attachments.map((a) => a.base64).filter(Boolean);

        setInput('');
        setAttachments([]); // ✅ 送出後清空預覽

        // TODO: call backend with { text, imagesBase64, location, journeyId, category }

        const fakeReply: Message = {
            id: Date.now().toString() + '-bot',
            role: 'assistant',
            content: '（AI 回覆範例，之後會改成你的後端 API 回應。）',
        };
        setMessages((prev) => [...prev, fakeReply]);
    };

    // ====== 搜尋結果 ======
    const filteredMessages = useMemo(() => {
        if (!searchActive || !searchText.trim()) return messages;
        const keyword = searchText.toLowerCase();
        return messages.filter((m) => m.content.toLowerCase().includes(keyword));
    }, [messages, searchActive, searchText]);

    const renderItem = ({ item }: { item: Message }) => {
        const isUser = item.role === 'user';
        return (
            <View style={[
                styles.bubble,
                isUser ? styles.userBubble : styles.assistantBubble,
            ]}>
                {item.imageUris && item.imageUris.length > 0 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.messageImageCarousel}
                        contentContainerStyle={styles.messageImageRow}
                    >
                        {item.imageUris.map((uri, idx) => (
                            <TouchableOpacity
                                key={idx}
                                activeOpacity={0.8}
                                onPress={() =>
                                    setPreviewImages({
                                        uris: item.imageUris || [],
                                        index: idx,
                                    })
                                }// 👈 點縮圖放大
                            >
                                <Image source={{ uri }} style={styles.messageThumb} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                <Text style={styles.bubbleText} selectable>
                    {item.content}
                </Text>
            </View>
        );
    };


    const journeyTitle = currentJourney?.name ?? '旅程';
    const journeyCountry = currentJourney?.country ?? '國家';

    const onBackToTrip = () => {
        router.replace('/trip');
    };

    const toggleSearch = () => {
        if (searchActive) {
            setSearchActive(false);
            setSearchText('');
        } else {
            setSearchActive(true);
        }
    };

    const switchTab = (key: Category) => {
        if (key === category) return;
        router.replace(routeMap[key]); // ✅ 型別安全，IDE 不再抱怨
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : insets.bottom}
            >
                {/* ==================== Header ==================== */}
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backButton} onPress={onBackToTrip}>
                            <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
                            <Text style={styles.backText}>旅程</Text>
                        </TouchableOpacity>

                        <Text style={styles.headerTitle}>{journeyTitle}</Text>
                        <Text style={styles.headerCountry}>{journeyCountry}</Text>

                        <TouchableOpacity
                            style={styles.searchIconButton}
                            onPress={toggleSearch}
                        >
                            <Ionicons
                                name={searchActive ? 'close-outline' : 'search-outline'}
                                size={20}
                                color={colors.text}
                            />
                        </TouchableOpacity>
                    </View>

                    {searchActive && (
                        <TextInput
                            style={styles.searchInput}
                            placeholder="搜尋對話內容..."
                            placeholderTextColor={colors.textMuted}
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                    )}

                    <View style={styles.tabsRow}>
                        {tabs.map((t) => {
                            const active = t.key === category;
                            return (
                                <TouchableOpacity
                                    key={t.key}
                                    style={[styles.tabItem, active && styles.tabItemActive]}
                                    onPress={() => switchTab(t.key)}
                                >
                                    <Ionicons
                                        name={t.icon}
                                        size={16}
                                        color={active ? t.tint : colors.textMuted}
                                    />
                                    <Text
                                        style={[
                                            styles.tabLabel,
                                            active && { color: t.tint },
                                        ]}
                                    >
                                        {t.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* ==================== 訊息列表 ==================== */}
                <FlatList
                    data={filteredMessages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingBottom: INPUT_BAR_HEIGHT + 16 + insets.bottom,
                    }}
                />

                {/* ==================== 附件預覽 ==================== */}
                {attachments.length > 0 && (
                    <View style={styles.attachmentPreviewContainer}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.attachmentScrollContent}
                        >
                            {attachments.map((att, index) => (
                                <View key={index} style={styles.attachmentThumbWrapper}>
                                    <Image
                                        source={{ uri: att.uri }}
                                        style={styles.attachmentImage}
                                    />
                                    <TouchableOpacity
                                        style={styles.attachmentRemoveButton}
                                        onPress={() =>
                                            setAttachments((prev) =>
                                                prev.filter((_, i) => i !== index)
                                            )
                                        }
                                    >
                                        <Ionicons name="close" size={12} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* ==================== 底部輸入列 ==================== */}
                <View style={[styles.inputBar, { paddingBottom: 8 + insets.bottom }]}>
                    <TouchableOpacity style={styles.iconButton} onPress={handleTakePhoto}>
                        <Ionicons name="camera-outline" size={22} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={handlePickFromLibrary}
                    >
                        <Ionicons name="image-outline" size={22} color={colors.text} />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.textInput}
                        value={input}
                        onChangeText={setInput}
                        placeholder={placeholder}
                        placeholderTextColor={colors.textMuted}
                        multiline
                    />

                    <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                        <Ionicons name="arrow-up" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* 大圖預覽 */}
                {previewImages && (
                    <Modal
                        visible={!!previewImages}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setPreviewImages(null)}
                    >
                        <View style={styles.modalOverlay}>
                            {/* 點背景關閉 */}
                            <TouchableOpacity
                                style={StyleSheet.absoluteFill}
                                activeOpacity={1}
                                onPress={() => setPreviewImages(null)}
                            />

                            <View style={styles.modalContent}>
                                <ScrollView
                                    ref={scrollRef}
                                    horizontal
                                    pagingEnabled
                                    showsHorizontalScrollIndicator={false}
                                >
                                    {previewImages.uris.map((uri, idx) => (
                                        <View key={idx} style={styles.modalImagePage}>
                                            <Image source={{ uri }} style={styles.modalImage} />
                                        </View>
                                    ))}
                                </ScrollView>

                                <TouchableOpacity
                                    style={styles.modalCloseButton}
                                    onPress={() => setPreviewImages(null)}
                                >
                                    <Ionicons name="close" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                )}

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    container: { flex: 1, backgroundColor: colors.bg },

    header: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 6,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: { flexDirection: 'row', alignItems: 'center', paddingRight: 10 },
    backText: { fontSize: 12, color: colors.textMuted, marginLeft: 2 },
    headerTitle: {
        flex: 4,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    headerCountry: {
        flex: 1,
        textAlign: 'left',
        fontSize: 12,
        fontWeight: '700',
        color: colors.textMuted,
    },
    searchIconButton: { padding: 6 },

    searchInput: {
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.text,
        backgroundColor: colors.surface,
    },

    tabsRow: {
        flexDirection: 'row',
        marginTop: 12,
        borderRadius: 999,
        backgroundColor: colors.surfaceAlt,
        padding: 2,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 6,
        borderRadius: 999,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    tabItemActive: { backgroundColor: colors.surface },
    tabLabel: { fontSize: 13, marginLeft: 4, color: colors.textMuted },

    bubble: {
        maxWidth: '80%',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 8,
    },
    userBubble: { alignSelf: 'flex-end', backgroundColor: colors.userBubble },
    assistantBubble: {
        alignSelf: 'flex-start',
        backgroundColor: colors.assistantBubble,
    },
    bubbleText: { color: colors.text },

    messageImage: {
        width: 220,
        height: 220,
        borderRadius: 12,
        marginBottom: 4,
    },

    attachmentPreviewContainer: { paddingHorizontal: 12, paddingBottom: 4 },
    attachmentScrollContent: { flexDirection: 'row', gap: 8 },
    attachmentThumbWrapper: {
        width: 64,
        height: 64,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#111',
    },
    attachmentImage: { width: '100%', height: '100%' },
    attachmentRemoveButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.7)',
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },

    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 8,
        paddingTop: 8,
        // paddingBottom 改由 inline + insets 控制
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
        backgroundColor: colors.bg,
    },
    iconButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    textInput: {
        flex: 1,
        maxHeight: 120,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.text,
        marginRight: 6,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageImageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 2,
    },
    messageThumb: {
        width: 72,
        height: 72,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: '#020617',
        marginRight: 8,
    },
    messageImageCarousel: {
        maxHeight: 80,        // 👈 明確限制 ScrollView 的高度
        marginBottom: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalImagePage: {
        width: Dimensions.get('window').width, // 每頁寬度 = 螢幕寬度，paging 才會一頁一卡
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalImage: {
        width: '90%',
        height: '80%',
        resizeMode: 'contain',
    },
    modalCloseButton: {
        position: 'absolute',
        top: 40,
        right: 24,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },

});

// app/settings.tsx
import React, { useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../constants/colors';
import { useSettings } from '../context/SettingsContext';

const MODEL_OPTIONS = [
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini（快 / 便宜）' },
    { id: 'gpt-4.1', label: 'GPT-4.1（準確 / 深度）' },
    { id: 'gpt-5.1-thinking', label: 'GPT-5.1 Thinking（高階推理）' },
];

export default function SettingsScreen() {
    const { apiKey, model, setApiKey, setModel } = useSettings();
    const [tempKey, setTempKey] = useState(apiKey);
    const [tempModel, setTempModel] = useState(model);

    useEffect(() => {
        setTempKey(apiKey);
        setTempModel(model);
    }, [apiKey, model]);

    const onSave = () => {
        if (!tempKey.trim()) {
            Alert.alert('提示', '請先輸入 API Key。');
            return;
        }
        setApiKey(tempKey.trim());
        setModel(tempModel);
        Alert.alert('已儲存', '設定已更新。');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>設定</Text>

            <Text style={styles.label}>API Key</Text>
            <TextInput
                value={tempKey}
                onChangeText={setTempKey}
                placeholder="請輸入您的 API Key"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
            />

            <Text style={[styles.label, { marginTop: 24 }]}>模型選擇</Text>
            {MODEL_OPTIONS.map((opt) => {
                const selected = tempModel === opt.id;
                return (
                    <TouchableOpacity
                        key={opt.id}
                        style={[
                            styles.modelOption,
                            selected && styles.modelOptionSelected,
                        ]}
                        onPress={() => setTempModel(opt.id)}
                    >
                        <Text
                            style={[
                                styles.modelOptionText,
                                selected && styles.modelOptionTextSelected,
                            ]}
                        >
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}

            <TouchableOpacity style={styles.saveButton} onPress={onSave}>
                <Text style={styles.saveButtonText}>儲存設定</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, backgroundColor: colors.bg },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 24,
        color: colors.text,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: colors.text,
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
    },
    modelOption: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 8,
        backgroundColor: colors.surface,
    },
    modelOptionSelected: {
        borderColor: colors.primary,
        backgroundColor: '#1d283a',
    },
    modelOptionText: {
        fontSize: 14,
        color: colors.textMuted,
    },
    modelOptionTextSelected: {
        color: colors.text,
        fontWeight: '600',
    },
    saveButton: {
        marginTop: 32,
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});

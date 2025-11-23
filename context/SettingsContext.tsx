// context/SettingsContext.tsx
import * as SecureStore from 'expo-secure-store';
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react';

type SettingsContextType = {
    apiKey: string;
    model: string;
    setApiKey: (key: string) => void;
    setModel: (model: string) => void;
    isReady: boolean; // 是否已從本機載入完成
};

const SettingsContext = createContext<SettingsContextType | undefined>(
    undefined
);

const API_KEY_STORAGE_KEY = 'deep_travel_api_key';
const MODEL_STORAGE_KEY = 'deep_travel_model';

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [apiKey, setApiKeyState] = useState('');
    const [model, setModelState] = useState('gpt-4o-mini');
    const [isReady, setIsReady] = useState(false);

    // 啟動時從本機載入
    useEffect(() => {
        (async () => {
            try {
                const storedKey = await SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
                const storedModel = await SecureStore.getItemAsync(MODEL_STORAGE_KEY);

                if (storedKey) {
                    setApiKeyState(storedKey);
                }
                if (storedModel) {
                    setModelState(storedModel);
                }
            } catch (e) {
                console.warn('Failed to load settings from storage', e);
            } finally {
                setIsReady(true);
            }
        })();
    }, []);

    const setApiKey = (key: string) => {
        setApiKeyState(key);
        if (key) {
            SecureStore.setItemAsync(API_KEY_STORAGE_KEY, key).catch(() => { });
        } else {
            SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY).catch(() => { });
        }
    };

    const setModel = (m: string) => {
        setModelState(m);
        if (m) {
            SecureStore.setItemAsync(MODEL_STORAGE_KEY, m).catch(() => { });
        } else {
            SecureStore.deleteItemAsync(MODEL_STORAGE_KEY).catch(() => { });
        }
    };

    const value: SettingsContextType = {
        apiKey,
        model,
        setApiKey,
        setModel,
        isReady,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const ctx = useContext(SettingsContext);
    if (!ctx) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return ctx;
};

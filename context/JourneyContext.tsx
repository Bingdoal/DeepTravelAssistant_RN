// context/JourneyContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react';

export type Journey = {
    id: string;
    name: string;
    country: string;
    createdAt: number;
};

type JourneyContextType = {
    journeys: Journey[];
    currentJourneyId: string | null;
    currentJourney: Journey | null;
    loaded: boolean;
    addJourney: (name: string, country: string) => Promise<void>;
    setCurrentJourney: (id: string | null) => Promise<void>;
};

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

const JOURNEYS_KEY = 'journeys';
const CURRENT_JOURNEY_KEY = 'current_journey_id';

export const JourneyProvider = ({ children }: { children: ReactNode }) => {
    const [journeys, setJourneys] = useState<Journey[]>([]);
    const [currentJourneyId, setCurrentJourneyId] = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false);

    // 載入旅程 & 目前旅程
    useEffect(() => {
        (async () => {
            try {
                const [journeysRaw, currentId] = await Promise.all([
                    AsyncStorage.getItem(JOURNEYS_KEY),
                    AsyncStorage.getItem(CURRENT_JOURNEY_KEY),
                ]);
                if (journeysRaw) {
                    setJourneys(JSON.parse(journeysRaw));
                }
                if (currentId) {
                    setCurrentJourneyId(currentId);
                }
            } catch (e) {
                console.warn('Failed to load journeys', e);
            } finally {
                setLoaded(true);
            }
        })();
    }, []);

    const persistJourneys = async (next: Journey[]) => {
        setJourneys(next);
        await AsyncStorage.setItem(JOURNEYS_KEY, JSON.stringify(next));
    };

    const addJourney = async (name: string, country: string) => {
        const trimmedName = name.trim();
        const trimmedCountry = country.trim();
        if (!trimmedName) return;

        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const j: Journey = {
            id,
            name: trimmedName,
            country: trimmedCountry,
            createdAt: Date.now(),
        };

        const next = [...journeys, j];
        await persistJourneys(next);
        await setCurrentJourney(id);
    };

    const setCurrentJourney = async (id: string | null) => {
        setCurrentJourneyId(id);
        if (id) {
            await AsyncStorage.setItem(CURRENT_JOURNEY_KEY, id);
        } else {
            await AsyncStorage.removeItem(CURRENT_JOURNEY_KEY);
        }
    };

    const currentJourney =
        journeys.find((j) => j.id === currentJourneyId) ?? null;

    return (
        <JourneyContext.Provider
            value={{
                journeys,
                currentJourneyId,
                currentJourney,
                loaded,
                addJourney,
                setCurrentJourney,
            }}
        >
            {children}
        </JourneyContext.Provider>
    );
};

export const useJourney = () => {
    const ctx = useContext(JourneyContext);
    if (!ctx) {
        throw new Error('useJourney must be used within JourneyProvider');
    }
    return ctx;
};

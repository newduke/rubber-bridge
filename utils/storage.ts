import AsyncStorage from '@react-native-async-storage/async-storage';
import { RubberData } from './scoring';

const STORAGE_KEY = 'rubber_bridge_v1';

export interface AppStorageData {
  currentRubber: RubberData;
  history: RubberData[];
}

function makeNewRubber(): RubberData {
  return {
    id: `rubber_${Date.now()}`,
    hands: [],
    createdAt: Date.now(),
  };
}

export async function loadData(): Promise<AppStorageData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as AppStorageData;
    }
  } catch (_) {
    // ignore parse errors
  }
  return { currentRubber: makeNewRubber(), history: [] };
}

export async function saveData(data: AppStorageData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {
    // ignore storage errors
  }
}

export { makeNewRubber };

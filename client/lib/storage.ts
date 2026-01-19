import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  USER_ID: "@testseries:userId",
  DEVICE_ID: "@testseries:deviceId",
  LANGUAGE: "@testseries:language",
  CURRENT_SESSION: "@testseries:currentSession",
};

export async function getStoredUserId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.USER_ID);
}

export async function setStoredUserId(userId: string): Promise<void> {
  return AsyncStorage.setItem(KEYS.USER_ID, userId);
}

export async function getDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    await AsyncStorage.setItem(KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}

export async function getLanguage(): Promise<string> {
  const lang = await AsyncStorage.getItem(KEYS.LANGUAGE);
  return lang || "en";
}

export async function setLanguage(languageCode: string): Promise<void> {
  return AsyncStorage.setItem(KEYS.LANGUAGE, languageCode);
}

export async function getCurrentSession(): Promise<any | null> {
  const session = await AsyncStorage.getItem(KEYS.CURRENT_SESSION);
  return session ? JSON.parse(session) : null;
}

export async function setCurrentSession(session: any): Promise<void> {
  return AsyncStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(session));
}

export async function clearCurrentSession(): Promise<void> {
  return AsyncStorage.removeItem(KEYS.CURRENT_SESSION);
}

import AsyncStorage from "@react-native-async-storage/async-storage";

// The backend has no "follow category" endpoint, so followed categories (their keys from
// TALENT_CATEGORIES) are kept on this device.
const KEY = "followedCategories";

export async function getFollowedCategories(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function setCategoryFollowed(key: string, followed: boolean): Promise<void> {
  const list = (await getFollowedCategories()).filter((k) => k !== key);
  if (followed) list.push(key);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Not persisted; the screen still reflects the tap.
  }
}

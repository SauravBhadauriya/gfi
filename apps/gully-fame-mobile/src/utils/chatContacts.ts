import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * GET /chat/chatlist only returns the other person's id, so the name/avatar seen
 * when a chat is opened (from a profile, reel or search) is remembered here.
 */
const KEY = "@gullyfame_chat_contacts";

export interface ChatContact {
  name: string;
  avatar: string;
}

export async function getChatContacts(): Promise<Record<string, ChatContact>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function rememberChatContact(userId: string, contact: Partial<ChatContact>) {
  if (!userId || (!contact.name && !contact.avatar)) return;
  const all = await getChatContacts();
  const prev = all[userId] || { name: "", avatar: "" };
  all[userId] = { name: contact.name || prev.name, avatar: contact.avatar || prev.avatar };
  await AsyncStorage.setItem(KEY, JSON.stringify(all)).catch(() => undefined);
}

export const fallbackChatName = (userId: string) => `Gully Fame user · ${userId.slice(-4)}`;

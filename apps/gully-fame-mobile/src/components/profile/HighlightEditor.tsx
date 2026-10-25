import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  HighlightDraft,
  ProfileHighlight,
  createHighlight,
  updateHighlight,
} from "@/api/services/profileExtrasService";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { getCachedThumbnail } from "@/utils/videoThumbnailCache";
import { showPermissionSettingsAlert } from "@/utils/permissionSettings";
import { ProfileMediaItem, ProfileMediaTile, isPhotoItem } from "./ProfileMediaTile";

const ACCENT = "#EC9A15";
const noop = () => {};
const BG = "#2A1B0B";

type Picked = { key: string; postId?: string; uri?: string; preview: string | null; mediaType: "video" | "photo" };

interface Props {
  visible: boolean;
  /** Highlight being edited, or null to create a new one. */
  editing: ProfileHighlight | null;
  posts: ProfileMediaItem[];
  onClose: () => void;
  onSaved: () => void;
}

export default function HighlightEditor({ visible, editing, posts, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tile = Math.floor((width - 32 - 8) / 3);
  const [title, setTitle] = useState("");
  const [picked, setPicked] = useState<Picked[]>([]);
  const [coverKey, setCoverKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(editing?.title ?? "");
    const existing: Picked[] = (editing?.items ?? []).map((it) => ({
      key: `post:${it.id}`,
      postId: it.id,
      preview: resolveMediaUrl(it.thumbnail || (it.mediaType === "photo" ? it.url : null)),
      mediaType: it.mediaType,
    }));
    setPicked(existing);
    setCoverKey(existing[0]?.key ?? null);
  }, [visible, editing]);

  const pickedKeys = useMemo(() => new Set(picked.map((p) => p.key)), [picked]);

  const togglePost = useCallback((post: ProfileMediaItem) => {
    const key = `post:${post.id}`;
    setPicked((prev) => {
      if (prev.some((p) => p.key === key)) return prev.filter((p) => p.key !== key);
      return [
        ...prev,
        {
          key,
          postId: post.id,
          // Video posts often have no server thumbnail; reuse the frame the grid already generated.
          preview:
            resolveMediaUrl(post.thumbnail || (isPhotoItem(post) ? post.uri : null)) ||
            (post.uri ? getCachedThumbnail(resolveMediaUrl(post.uri) || "") : null),
          mediaType: isPhotoItem(post) ? "photo" : "video",
        },
      ];
    });
    setCoverKey((current) => current ?? key);
  }, []);

  const addFromGallery = useCallback(async () => {
    const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      if (!canAskAgain) showPermissionSettingsAlert("Photo library access");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.8,
    });
    if (result.canceled) return;
    const added: Picked[] = result.assets.map((a) => ({
      key: `local:${a.uri}`,
      uri: a.uri,
      preview: a.type === "video" ? null : a.uri,
      mediaType: a.type === "video" ? "video" : "photo",
    }));
    setPicked((prev) => [...prev, ...added.filter((a) => !prev.some((p) => p.key === a.key))]);
    setCoverKey((current) => current ?? added[0]?.key ?? null);
  }, []);

  const save = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert("Add a title", "Give your highlight a short name.");
      return;
    }
    if (picked.length === 0) {
      Alert.alert("Pick something", "Choose at least one post or photo.");
      return;
    }
    const cover = picked.find((p) => p.key === coverKey) ?? picked[0];
    const draft: HighlightDraft = {
      title: title.trim(),
      coverUrl: cover.preview,
      postIds: picked.filter((p) => p.postId).map((p) => p.postId!),
      localFiles: picked.filter((p) => p.uri).map((p) => ({ uri: p.uri!, mediaType: p.mediaType })),
    };
    setSaving(true);
    const result = editing ? await updateHighlight(editing.id, draft) : await createHighlight(draft);
    setSaving(false);
    if (result.success) {
      onSaved();
      onClose();
    } else {
      Alert.alert("Couldn't save highlight", result.message);
    }
  }, [title, picked, coverKey, editing, onSaved, onClose]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top + 8 }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} accessibilityRole="button" hitSlop={10}>
            <Text style={styles.headerAction}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {editing ? "Edit highlight" : "New highlight"}
          </Text>
          <TouchableOpacity onPress={save} disabled={saving} accessibilityRole="button" hitSlop={10}>
            {saving ? <ActivityIndicator color={ACCENT} /> : <Text style={[styles.headerAction, styles.headerSave]}>Save</Text>}
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Highlight title"
          placeholderTextColor="rgba(255,255,255,0.45)"
          maxLength={24}
        />

        {picked.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Cover (tap to choose)</Text>
            <FlatList
              horizontal
              style={{ flexGrow: 0, minHeight: 76 }}
              data={picked}
              keyExtractor={(p) => p.key}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.coverRow}
              renderItem={({ item }) => (
                <Pressable onPress={() => setCoverKey(item.key)} style={[styles.cover, coverKey === item.key && styles.coverActive]}>
                  {item.preview ? <Image source={{ uri: item.preview }} style={styles.coverImage} contentFit="cover" /> : null}
                </Pressable>
              )}
            />
          </>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Your posts</Text>
          <TouchableOpacity onPress={addFromGallery} accessibilityRole="button">
            <Text style={styles.galleryButton}>Add from gallery</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          numColumns={3}
          keyboardShouldPersistTaps="handled"
          columnWrapperStyle={{ gap: 4 }}
          contentContainerStyle={{ gap: 4, paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
          ListEmptyComponent={<Text style={styles.empty}>You don't have any posts yet. Add from your gallery instead.</Text>}
          renderItem={({ item }) => {
            const selected = pickedKeys.has(`post:${item.id}`);
            return (
              <Pressable
                onPress={() => togglePost(item)}
                style={{ width: tile, height: tile }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
              >
                {/* Same tile as the profile grid (generated video thumbnails), display only. */}
                <View pointerEvents="none">
                  <ProfileMediaTile item={item} size={tile} onPress={noop} />
                </View>
                <View pointerEvents="none" style={[styles.check, selected && styles.checkOn]}>
                  {selected ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>
              </Pressable>
            );
          }}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  headerTitle: { flex: 1, textAlign: "center", color: "#fff", fontSize: 17, fontWeight: "700" },
  headerAction: { minWidth: 64, color: "#fff", fontSize: 15 },
  headerSave: { textAlign: "right", color: ACCENT, fontWeight: "700" },
  titleInput: {
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  sectionLabel: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600", paddingHorizontal: 16, marginTop: 16 },
  galleryButton: { color: ACCENT, fontSize: 14, fontWeight: "600" },
  coverRow: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, gap: 10 },
  cover: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: "transparent", overflow: "hidden", backgroundColor: "#4A3218" },
  coverActive: { borderColor: ACCENT },
  coverImage: { width: "100%", height: "100%" },
  check: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: ACCENT, borderColor: ACCENT },
  checkMark: { color: "#1A1208", fontSize: 13, fontWeight: "800" },
  empty: { color: "rgba(255,255,255,0.65)", textAlign: "center", paddingVertical: 24, paddingHorizontal: 16 },
});

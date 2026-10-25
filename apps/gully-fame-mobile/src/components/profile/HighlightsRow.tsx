import { memo, useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { deleteHighlight, ProfileHighlight } from "@/api/services/profileExtrasService";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { PlusIcon } from "./profileIcons";
import HighlightViewer from "./HighlightViewer";
import HighlightEditor from "./HighlightEditor";
import { ProfileMediaItem } from "./ProfileMediaTile";

const ACCENT = "#EC9A15";
const SIZE = 64;

interface Props {
  isOwn: boolean;
  highlights: ProfileHighlight[];
  loading: boolean;
  /** Own posts offered in the create/edit flow. */
  posts: ProfileMediaItem[];
  onChanged: () => void;
}

const Cover = memo(function Cover({ highlight }: { highlight: ProfileHighlight }) {
  const [failed, setFailed] = useState(false);
  const uri = resolveMediaUrl(highlight.coverUrl);
  return (
    <View style={styles.ring}>
      {uri && !failed ? (
        <Image source={{ uri }} style={styles.cover} contentFit="cover" cachePolicy="memory-disk" onError={() => setFailed(true)} />
      ) : (
        <View style={[styles.cover, styles.coverFallback]}>
          <Text style={styles.initial}>{(highlight.title || "?").trim().charAt(0).toUpperCase()}</Text>
        </View>
      )}
    </View>
  );
});

function HighlightsRow({ isOwn, highlights, loading, posts, onChanged }: Props) {
  const [viewing, setViewing] = useState<ProfileHighlight | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ProfileHighlight | null>(null);

  const openEditor = useCallback((h: ProfileHighlight | null) => {
    setEditing(h);
    setEditorOpen(true);
  }, []);

  const showActions = useCallback(
    (h: ProfileHighlight) => {
      Alert.alert(h.title || "Highlight", undefined, [
        { text: "Edit", onPress: () => openEditor(h) },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            Alert.alert("Delete this highlight?", "The posts stay on your profile.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  const result = await deleteHighlight(h.id);
                  if (result.success) onChanged();
                  else Alert.alert("Couldn't delete", result.message);
                },
              },
            ]),
        },
        { text: "Cancel", style: "cancel" },
      ]);
    },
    [openEditor, onChanged]
  );

  if (!isOwn && !loading && highlights.length === 0) return null;

  return (
    <View>
      {loading && highlights.length === 0 ? (
        <View style={styles.list}>
          {Array.from({ length: isOwn ? 3 : 4 }).map((_, i) => (
            <View key={i} style={styles.item}>
              <View style={[styles.ring, styles.skeleton]} />
              <View style={styles.skeletonLabel} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          horizontal
          data={highlights}
          keyExtractor={(h) => h.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            isOwn ? (
              <Pressable
                style={styles.item}
                onPress={() => openEditor(null)}
                accessibilityRole="button"
                accessibilityLabel="New highlight"
              >
                <View style={[styles.ring, styles.newRing]}>
                  <PlusIcon size={26} color="#fff" />
                </View>
                <Text style={styles.label} numberOfLines={1}>
                  New
                </Text>
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.item}
              onPress={() => setViewing(item)}
              onLongPress={isOwn ? () => showActions(item) : undefined}
              accessibilityRole="button"
              accessibilityLabel={`Highlight ${item.title}`}
            >
              <Cover highlight={item} />
              <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
                {item.title}
              </Text>
            </Pressable>
          )}
        />
      )}

      <HighlightViewer highlight={viewing} onClose={() => setViewing(null)} />
      {isOwn ? (
        <HighlightEditor
          visible={editorOpen}
          editing={editing}
          posts={posts}
          onClose={() => setEditorOpen(false)}
          onSaved={onChanged}
        />
      ) : null}
    </View>
  );
}

export default memo(HighlightsRow);

const styles = StyleSheet.create({
  list: { flexDirection: "row", paddingHorizontal: 12, paddingTop: 16, paddingBottom: 4, gap: 6 },
  item: { width: SIZE + 14, alignItems: "center" },
  ring: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    borderColor: ACCENT,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  newRing: { borderColor: "rgba(255,255,255,0.55)" },
  cover: { width: "100%", height: "100%", borderRadius: SIZE / 2 },
  coverFallback: { backgroundColor: "#5A3C1C", alignItems: "center", justifyContent: "center" },
  initial: { color: ACCENT, fontSize: 22, fontWeight: "700" },
  label: { alignSelf: "stretch", textAlign: "center", color: "#fff", fontSize: 12, marginTop: 6 },
  skeleton: { borderColor: "transparent", backgroundColor: "rgba(255,255,255,0.08)" },
  skeletonLabel: { width: 44, height: 10, borderRadius: 5, marginTop: 8, backgroundColor: "rgba(255,255,255,0.08)" },
});

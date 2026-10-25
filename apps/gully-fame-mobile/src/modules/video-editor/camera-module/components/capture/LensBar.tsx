import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import type { Lens } from "./lenses";
import { CAPTURE_YELLOW } from "./theme";

interface LensBarProps {
  bottomInset: number;
  lenses: Lens[];
  selected: Lens | null;
  onSelect: (lens: Lens) => void;
  onToggleSaved: (id: string) => void;
}

/** Bottom bar shown while the lens carousel is open: search, lens name pill, bookmark. */
const LensBar: React.FC<LensBarProps> = ({ bottomInset, lenses, selected, onSelect, onToggleSaved }) => {
  const [browser, setBrowser] = useState<null | "search" | "browse">(null);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lenses;
    return lenses.filter(l => l.name.toLowerCase().includes(q) || l.category.toLowerCase().includes(q));
  }, [lenses, query]);

  const close = () => {
    setBrowser(null);
    setQuery("");
  };

  return (
    <View style={[styles.row, { paddingBottom: bottomInset + 10 }]}>
      <TouchableOpacity style={styles.iconBtn} onPress={() => setBrowser("search")} accessibilityLabel="Search lenses">
        <Ionicons name="search" size={22} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.pill} onPress={() => setBrowser("browse")} accessibilityLabel="Browse lenses">
        <Text style={styles.pillText} numberOfLines={1}>
          {selected?.name ?? "Lenses"}
        </Text>
        <Ionicons name="chevron-up" size={14} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.iconBtn}
        disabled={!selected}
        onPress={() => selected && onToggleSaved(selected.id)}
        accessibilityLabel={selected?.isSaved ? "Remove saved lens" : "Save lens"}
      >
        <Ionicons name={selected?.isSaved ? "bookmark" : "bookmark-outline"} size={22} color={selected?.isSaved ? CAPTURE_YELLOW : "#fff"} />
      </TouchableOpacity>

      <Modal visible={browser !== null} transparent animationType="slide" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={[styles.sheet, { paddingBottom: bottomInset + 16 }]} onPress={() => {}}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search lenses"
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={styles.searchInput}
                autoFocus={browser === "search"}
              />
            </View>
            <FlatList
              data={results}
              keyExtractor={l => l.id}
              numColumns={4}
              columnWrapperStyle={styles.gridRow}
              ListEmptyComponent={<Text style={styles.empty}>No lenses found</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.tile}
                  onPress={() => {
                    onSelect(item);
                    close();
                  }}
                >
                  <View style={[styles.tileIcon, item.id === selected?.id && styles.tileIconActive]}>
                    <Image source={item.iconUrl} style={styles.tileImage} contentFit="contain" cachePolicy="memory-disk" />
                  </View>
                  <Text style={styles.tileName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.tileCategory} numberOfLines={1}>
                    {item.isSaved ? "Saved" : item.category}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 14 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "55%",
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  pillText: { color: "#fff", fontSize: 15, fontWeight: "700", flexShrink: 1 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { maxHeight: "60%", backgroundColor: "#141414", borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 16,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 15 },
  gridRow: { gap: 12, marginBottom: 16 },
  tile: { width: "22%", alignItems: "center" },
  tileIcon: { width: 60, height: 60, borderRadius: 30, overflow: "hidden", borderWidth: 2, borderColor: "transparent", backgroundColor: "rgba(255,255,255,0.1)" },
  tileIconActive: { borderColor: CAPTURE_YELLOW },
  tileImage: { width: "100%", height: "100%" },
  tileName: { color: "#fff", fontSize: 12, fontWeight: "600", marginTop: 6 },
  tileCategory: { color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 2 },
  empty: { color: "rgba(255,255,255,0.6)", textAlign: "center", paddingVertical: 24 },
});

export default LensBar;

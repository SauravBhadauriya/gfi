import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { POSTING_STAGES, clearToast } from "@/store/slices/postingSlice";
import { cancelPosting, retryPosting } from "@/services/postingService";

const ACCENT = "#EC9A15";
const RED = "#D93025";
const GREEN = "#1E9E57";

/**
 * Persistent posting status, mounted once in the root layout (above every screen):
 * "Posting... 45%" while running, "Upload failed - Retry / Cancel" on failure,
 * a tick and "Posted" on success. Tap it for the stage list. Also shows short toasts.
 */
const PostingBanner: React.FC = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const posting = useAppSelector((state) => state.posting);
  const [details, setDetails] = useState(false);

  // A toast disappears by itself.
  useEffect(() => {
    if (!posting.toast) return;
    const id = setTimeout(() => dispatch(clearToast()), 3500);
    return () => clearTimeout(id);
  }, [posting.toast, dispatch]);

  const { phase, progress, stage, stages, error, toast } = posting;
  const stageLabel = POSTING_STAGES.find((s) => s.id === stage)?.label ?? "";
  const show = phase !== "idle";

  return (
    <>
      {show && (
        <View style={[styles.wrap, { top: insets.top + 6 }]} pointerEvents="box-none">
          <Pressable
            style={[styles.banner, phase === "failed" && styles.failed, phase === "done" && styles.done]}
            onPress={() => setDetails(true)}
            accessibilityLabel="Posting status"
          >
            {phase === "running" && (
              <>
                <View style={styles.row}>
                  <Text style={styles.title}>{`Posting... ${progress}%`}</Text>
                  <Text style={styles.sub}>{stageLabel}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${progress}%` }]} />
                </View>
              </>
            )}
            {phase === "failed" && (
              <View style={styles.row}>
                <Text style={[styles.title, styles.flex]} numberOfLines={1}>
                  Upload failed
                </Text>
                <TouchableOpacity onPress={() => retryPosting()} hitSlop={8} accessibilityLabel="Retry upload">
                  <Text style={styles.action}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => void cancelPosting()} hitSlop={8} accessibilityLabel="Cancel upload">
                  <Text style={styles.actionDim}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
            {phase === "done" && (
              <View style={styles.row}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.title}>{posting.mode === "draft" ? "Draft saved" : "Posted"}</Text>
              </View>
            )}
          </Pressable>
        </View>
      )}

      {toast && !show && (
        <View style={[styles.wrap, { top: insets.top + 6 }]} pointerEvents="none">
          <View style={[styles.banner, toast.kind === "error" && styles.failed]}>
            <Text style={styles.title}>{toast.message}</Text>
          </View>
        </View>
      )}

      <Modal visible={details} transparent animationType="fade" onRequestClose={() => setDetails(false)}>
        <Pressable style={styles.backdrop} onPress={() => setDetails(false)}>
          <View style={[styles.sheet, { marginTop: insets.top + 60 }]}>
            <Text style={styles.sheetTitle}>{phase === "failed" ? "Upload failed" : phase === "done" ? (posting.mode === "draft" ? "Draft saved" : "Posted") : posting.mode === "draft" ? "Saving draft" : "Posting"}</Text>
            {stages.map((id) => {
              const index = stages.indexOf(id);
              const currentIndex = stages.indexOf(stage);
              const finished = phase === "done" || index < currentIndex;
              const active = id === stage && phase !== "done";
              const label = POSTING_STAGES.find((s) => s.id === id)?.label ?? id;
              return (
                <View key={id} style={styles.stageRow}>
                  <Ionicons
                    name={finished ? "checkmark-circle" : active ? (phase === "failed" ? "alert-circle" : "ellipse") : "ellipse-outline"}
                    size={18}
                    color={finished ? GREEN : active ? (phase === "failed" ? RED : ACCENT) : "#666"}
                  />
                  <Text style={[styles.stageText, active && styles.stageActive]}>{label}</Text>
                  {active && phase === "running" && <Text style={styles.stagePct}>{progress}%</Text>}
                </View>
              );
            })}
            {phase === "failed" && error ? <Text style={styles.error}>{error}</Text> : null}
            {phase === "failed" && (
              <View style={styles.sheetActions}>
                <TouchableOpacity style={styles.retryBtn} onPress={() => { retryPosting(); setDetails(false); }}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { void cancelPosting(); setDetails(false); }}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 12, right: 12, zIndex: 9999, elevation: 9999 },
  banner: { backgroundColor: "#262626", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  failed: { backgroundColor: RED },
  done: { backgroundColor: GREEN },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  flex: { flex: 1 },
  title: { color: "#fff", fontSize: 14, fontWeight: "700", flexShrink: 1 },
  sub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginLeft: "auto" },
  track: { height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)", marginTop: 8, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: ACCENT },
  action: { color: "#fff", fontSize: 14, fontWeight: "800", textDecorationLine: "underline" },
  actionDim: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "600" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 12 },
  sheet: { backgroundColor: "#1c1c1c", borderRadius: 14, padding: 18 },
  sheetTitle: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 12 },
  stageRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  stageText: { color: "#aaa", fontSize: 14 },
  stageActive: { color: "#fff", fontWeight: "700" },
  stagePct: { color: ACCENT, marginLeft: "auto", fontWeight: "700" },
  error: { color: "#ff8a80", fontSize: 13, marginTop: 10 },
  sheetActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  retryBtn: { flex: 1, backgroundColor: ACCENT, borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  retryText: { color: "#000", fontWeight: "800" },
  cancelBtn: { flex: 1, backgroundColor: "#333", borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  cancelText: { color: "#fff", fontWeight: "700" },
});

export default PostingBanner;

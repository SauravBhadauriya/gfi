import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Modal, PanResponder, Pressable, StatusBar, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProfileHighlight } from "@/api/services/profileExtrasService";
import { resolveMediaUrl } from "@/utils/mediaUrl";

const PHOTO_DURATION_MS = 5000;
const ACCENT = "#EC9A15";

interface Props {
  highlight: ProfileHighlight | null;
  onClose: () => void;
}

/**
 * Full-screen highlight player: tap right/left to move, hold to pause, swipe down to close.
 * Photos advance after 5 seconds; videos play to the end.
 */
export default function HighlightViewer({ highlight, onClose }: Props) {
  const visible = !!highlight && highlight.items.length > 0;
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {visible ? <ViewerBody highlight={highlight!} onClose={onClose} /> : null}
    </Modal>
  );
}

function ViewerBody({ highlight, onClose }: { highlight: ProfileHighlight; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const photoAnim = useRef<Animated.CompositeAnimation | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;

  const item = highlight.items[index];
  const isVideo = item?.mediaType === "video";
  const url = resolveMediaUrl(item?.url) || "";

  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.1;
  });

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= highlight.items.length) {
        onClose();
        return i;
      }
      return i + 1;
    });
  }, [highlight.items.length, onClose]);

  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  // Load the current item: videos into the shared player, photos into a timed progress bar.
  useEffect(() => {
    progress.setValue(0);
    photoAnim.current?.stop();
    if (isVideo && url) {
      player.replaceAsync({ uri: url }).then(() => player.play()).catch(() => goNext());
    } else {
      player.pause();
    }
  }, [index, isVideo, url, player, progress, goNext]);

  // Photo timer, restarted from the current progress after a pause.
  useEffect(() => {
    if (isVideo || paused) {
      photoAnim.current?.stop();
      return;
    }
    let remaining = 1;
    progress.stopAnimation((v) => {
      remaining = 1 - v;
    });
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: PHOTO_DURATION_MS * remaining,
      useNativeDriver: false,
    });
    photoAnim.current = anim;
    anim.start(({ finished }) => {
      if (finished) goNext();
    });
    return () => anim.stop();
  }, [index, isVideo, paused, progress, goNext]);

  // Video progress and end-of-video advance.
  useEffect(() => {
    if (!isVideo) return;
    const timeSub = player.addListener("timeUpdate", ({ currentTime }) => {
      const duration = player.duration || 0;
      if (duration > 0) progress.setValue(Math.min(1, currentTime / duration));
    });
    const endSub = player.addListener("playToEnd", () => goNext());
    return () => {
      timeSub.remove();
      endSub.remove();
    };
  }, [isVideo, player, progress, goNext]);

  useEffect(() => {
    if (!isVideo) return;
    if (paused) player.pause();
    else player.play();
  }, [paused, isVideo, player]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 12 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => dragY.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120) onClose();
        else Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  if (!item) return null;

  return (
    <Animated.View style={[styles.root, { transform: [{ translateY: dragY }] }]} {...pan.panHandlers}>
      <StatusBar barStyle="light-content" />
      {isVideo ? (
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />
      ) : (
        <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="contain" cachePolicy="memory-disk" />
      )}

      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={(e) => (e.nativeEvent.locationX < width / 3 ? goPrev() : goNext())}
        onLongPress={() => setPaused(true)}
        onPressOut={() => setPaused(false)}
        delayLongPress={180}
        accessibilityLabel="Highlight. Tap right for next, left for previous, hold to pause."
      />

      <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.bars}>
          {highlight.items.map((it, i) => (
            <View key={it.id} style={styles.barTrack}>
              {i < index ? (
                <View style={[styles.barFill, { width: "100%" }]} />
              ) : i === index ? (
                <Animated.View
                  style={[
                    styles.barFill,
                    { width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
                  ]}
                />
              ) : null}
            </View>
          ))}
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {highlight.title}
          </Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  top: { position: "absolute", left: 0, right: 0, top: 0, paddingHorizontal: 10 },
  bars: { flexDirection: "row", gap: 4 },
  barTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)", overflow: "hidden" },
  barFill: { height: 3, backgroundColor: ACCENT },
  titleRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 12 },
  title: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "700" },
  close: { color: "#fff", fontSize: 22, paddingHorizontal: 6 },
});

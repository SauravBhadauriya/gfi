import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  Modal,
  Animated,
  Switch,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import * as FileSystem from "expo-file-system/legacy";
import Svg, { Path } from "react-native-svg";
import { BackIcon, MusicIcon, InstagramIcon, TagIcon, ThreeDotsIcon, LocationIcon } from "@/icons";
import { saveReelToLocalCache } from "@/hooks/useUserReels";

const { width, height } = Dimensions.get("window");

interface PostVideoPreviewProps {
  videoUri: string;
  playerRef: React.MutableRefObject<ReturnType<typeof useVideoPlayer> | null>;
}

function PostVideoPreview({ videoUri, playerRef }: PostVideoPreviewProps) {
  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  React.useEffect(() => {
    playerRef.current = player;
  }, [player, playerRef]);

  return (
    <VideoView
      style={styles.video}
      player={player}
      contentFit="cover"
    />
  );
}

export default function PostReelScreen() {
  const params = useLocalSearchParams();

  const clipsFromParams = params.clips
    ? (() => {
        try {
          return JSON.parse(params.clips as string);
        } catch {
          return [];
        }
      })()
    : [];

  const musicDataFromParams = params.musicData
    ? (() => {
        try {
          return JSON.parse(params.musicData as string);
        } catch {
          return null;
        }
      })()
    : null;

  const [caption, setCaption] = useState(params.caption ? String(params.caption) : "");
  const [hashtags, setHashtags] = useState<string[]>(() => {
    if (params.hashtags) {
      try {
        return JSON.parse(params.hashtags as string);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [hashtagInput, setHashtagInput] = useState("");
  const [selectedMusic, setSelectedMusic] = useState<string | null>(
    musicDataFromParams?.title ? `${musicDataFromParams.title} - ${musicDataFromParams.artist}` : null
  );
  const [taggedPeople, setTaggedPeople] = useState<any[]>([]);
  const [location, setLocation] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState("Everyone");
  const [allowShare, setAllowShare] = useState(true);
  const [allowSave, setAllowSave] = useState(true);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const competitionId = params.competitionId ? String(params.competitionId) : null;
  const competitionName = params.competitionName
    ? decodeURIComponent(String(params.competitionName))
    : null;
  const entryFee = params.entryFee ? decodeURIComponent(String(params.entryFee)) : null;

  const [turnOffCommenting, setTurnOffCommenting] = useState(
    params.allowComments === "false" ? false : true
  );
  const [hideLikeCount, setHideLikeCount] = useState(false);
  const [hideCommentCount, setHideCommentCount] = useState(false);
  const [hideShareCount, setHideShareCount] = useState(false);
  const [hideSaveCount, setHideSaveCount] = useState(false);
  const [allowRemix, setAllowRemix] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const videoPlayer = useRef<ReturnType<typeof useVideoPlayer> | null>(null);

  const maxCaptionLength = 2200;
  const hashtagSuggestions = [
    "gullyfame",
    "trending",
    "viral",
    "fyp",
    "dance",
    "music",
    "comedy",
    "cooking",
  ];

  const handleAddHashtag = () => {
    const trimmedInput = hashtagInput.trim().replace(/^#/, ""); 
    if (trimmedInput && !hashtags.includes(trimmedInput)) {
      setHashtags([...hashtags, trimmedInput]);
      setHashtagInput("");
    }
  };

  const handleHashtagInputChange = (text: string) => {
    setHashtagInput(text);
  };

  const handleHashtagKeyPress = (e: any) => {
    if (e.nativeEvent.key === "Enter" || e.nativeEvent.key === " ") {
      handleAddHashtag();
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };

  const openMoreOptions = () => {
    setShowMoreOptions(true);
    slideAnim.setValue(height);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const closeMoreOptions = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowMoreOptions(false));
  };

  const handlePost = async () => {
    if (__DEV__) console.log(`[FLOW] handlePost called: clips=${clipsFromParams.length}, caption=${caption.length} chars`);
    if (competitionId && competitionName && entryFee) {
      if (__DEV__) console.log('[FLOW] handlePost: competition entry detected, routing to payment');
      router.push({
        pathname: "/(main)/competition/payment",
        params: {
          competitionId,
          competitionName: encodeURIComponent(competitionName),
          entryFee: encodeURIComponent(entryFee),
          ...(musicDataFromParams && { musicData: JSON.stringify(musicDataFromParams) }),
        },
      });
    } else {
      try {
        if (!clipsFromParams.length || !clipsFromParams[0]?.uri) {
          if (__DEV__) console.error('[FLOW] handlePost: No video uri found, aborting');
          Alert.alert("Error", "Please select a video before posting");
          return;
        }

        const videoUri = clipsFromParams[0].uri;
        
        // Validate file exists before uploading
        if (__DEV__) console.log(`[FLOW] handlePost: Validating video file exists at ${videoUri.substring(0, 50)}...`);
        const fileInfo = await FileSystem.getInfoAsync(videoUri);
        if (!fileInfo.exists) {
          if (__DEV__) console.error(`[FLOW] handlePost: Video file does not exist at ${videoUri}`);
          Alert.alert("Error", "The video file was not found. Please re-record and try again.");
          return;
        }
        
        if (__DEV__) console.log(`[FLOW] handlePost: File validated, size=${fileInfo.size} bytes`);
        setIsUploading(true);
        if (__DEV__) console.log('[FLOW] handlePost: Upload started, button disabled');
        Alert.alert("Uploading", "Please wait while we upload your reel...", undefined, { cancelable: false });

        const { uploadVideoComplete } = await import("@/api/services/videoUploadService");
        const result = await uploadVideoComplete(
          videoUri,
          {
            title: caption || "Untitled Reel",
            description: caption,
            duration: clipsFromParams.reduce(
              (duration: number, clip: { duration?: number }) => duration + (clip.duration || 0),
              0
            ),
            resolution: "1080p",
            fps: 30,
            tags: hashtags,
            music: musicDataFromParams ? {
              trackId: musicDataFromParams.trackId,
              title: musicDataFromParams.title,
              artist: musicDataFromParams.artist,
              startOffset: musicDataFromParams.startOffset || 0,
              duration: musicDataFromParams.duration || 0,
            } : undefined,
            competitionId: competitionId || undefined,
          }
        );

        if (__DEV__) console.log(`[FLOW] handlePost: Upload result success=${result.success}, message=${result.message}`);
        if (result.success) {
          // 🛠️ Save to local storage cache before navigating to profile
          try {
            if (result.data?.reel) {
              await saveReelToLocalCache(result.data.reel);
            } else if (clipsFromParams[0]?.uri) {
              await saveReelToLocalCache({
                id: `reel-${Date.now()}`,
                title: caption || "Untitled Reel",
                description: caption,
                videoUrl: clipsFromParams[0].uri,
                video_url: clipsFromParams[0].uri,
                createdAt: new Date().toISOString(),
              });
            }
            if (__DEV__) console.log('[FLOW] handlePost: Reel cached successfully');
          } catch (cacheErr) {
            console.warn("[post.tsx] Cache write error:", cacheErr);
          }

          if (__DEV__) console.log('[FLOW] handlePost: Upload complete, showing success alert and navigating to home');
          Alert.alert("Success", "Your reel has been posted!", [
            {
              text: "OK",
              onPress: () => {
                setIsUploading(false);
                router.replace("/(main)/home" as any);
              },
            },
          ]);
        } else {
          if (__DEV__) console.error(`[FLOW] handlePost: Upload failed: ${result.message}`);
          setIsUploading(false);
          Alert.alert("Upload Failed", result.message || "Failed to post reel. Please try again.", [
            { text: "Try Again", onPress: () => handlePost() },
            { text: "Cancel", onPress: () => {}, style: "cancel" },
          ]);
        }
      } catch (error: any) {
        if (__DEV__) console.error("[FLOW] handlePost error:", error.message || error);
        setIsUploading(false);
        Alert.alert("Error", error.message || "An error occurred while posting your reel", [
          { text: "Try Again", onPress: () => handlePost() },
          { text: "Cancel", onPress: () => {}, style: "cancel" },
        ]);
      }
    }
  };

  const handleSaveDraft = () => {
    Alert.alert("Save Draft", "Draft saved successfully!", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Reel</Text>
        <TouchableOpacity onPress={openMoreOptions} style={styles.moreButton}>
          <ThreeDotsIcon />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.videoPreview}>
          {clipsFromParams.length > 0 && clipsFromParams[0]?.uri ? (
            <View style={styles.video}>
              <PostVideoPreview videoUri={clipsFromParams[0].uri} playerRef={videoPlayer} />
            </View>
          ) : (
            <View style={styles.video}>
              <Text style={{ color: "#999", textAlign: "center", marginTop: "50%" }}>
                No video selected
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Caption</Text>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            placeholderTextColor="#666"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={maxCaptionLength}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {caption.length}/{maxCaptionLength}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Hashtags</Text>
          <View style={styles.hashtagInputContainer}>
            <TextInput
              style={styles.hashtagInput}
              placeholder="Type hashtags (e.g., #gullyfame or gullyfame)"
              placeholderTextColor="#666"
              value={hashtagInput}
              onChangeText={handleHashtagInputChange}
              onSubmitEditing={handleAddHashtag}
              onKeyPress={handleHashtagKeyPress}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={handleAddHashtag} style={styles.addHashtagButton}>
              <Text style={styles.addHashtagText}>Add</Text>
            </TouchableOpacity>
          </View>
          {hashtagSuggestions.length > 0 && hashtagInput.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Suggestions:</Text>
              {hashtagSuggestions
                .filter((s) =>
                  s.toLowerCase().includes(hashtagInput.toLowerCase().replace(/^#/, ""))
                )
                .map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => {
                      setHashtagInput(suggestion);
                      handleAddHashtag();
                    }}
                  >
                    <Text style={styles.suggestionText}>#{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              {hashtagInput.trim().replace(/^#/, "") &&
                !hashtagSuggestions.some(
                  (s) => s.toLowerCase() === hashtagInput.toLowerCase().replace(/^#/, "")
                ) && (
                  <TouchableOpacity
                    style={[styles.suggestionChip, styles.customHashtagChip]}
                    onPress={handleAddHashtag}
                  >
                    <Text style={styles.customHashtagText}>
                      + Add "{hashtagInput.replace(/^#/, "")}"
                    </Text>
                  </TouchableOpacity>
                )}
            </View>
          )}
          {hashtags.length > 0 && (
            <View style={styles.hashtagChips}>
              {hashtags.map((tag, index) => (
                <View key={index} style={styles.hashtagChip}>
                  <Text style={styles.hashtagChipText}>#{tag}</Text>
                  <TouchableOpacity onPress={() => handleRemoveHashtag(tag)}>
                    <Text style={styles.removeHashtag}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.optionRow} onPress={() => setShowMusicModal(true)}>
          <MusicIcon />
          <Text style={styles.optionText}>{selectedMusic || "Add Music"}</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow} onPress={() => setShowTagModal(true)}>
          <TagIcon />
          <Text style={styles.optionText}>
            {taggedPeople.length > 0
              ? `${taggedPeople.length} people tagged`
              : "Tag People / Tag Competitors"}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        {taggedPeople.length > 0 && (
          <View style={styles.taggedContainer}>
            {taggedPeople.map((person, index) => (
              <View key={index} style={styles.taggedChip}>
                <Image source={require("@assets/images/user1.png")} style={styles.taggedAvatar} />
                <Text style={styles.taggedName}>{person.name}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.optionRow} onPress={() => setShowLocationModal(true)}>
          <LocationIcon />
          <Text style={styles.optionText}>{location || "Add Location"}</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Privacy & Sharing</Text>

          <TouchableOpacity style={styles.optionRow} onPress={() => setShowPrivacyModal(true)}>
            <Text style={styles.optionText}>Who can see your reel?</Text>
            <View style={styles.privacyValue}>
              <Text style={styles.privacyText}>{privacy}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Allow share to other users</Text>
            <Switch
              value={allowShare}
              onValueChange={setAllowShare}
              trackColor={{ false: "#767577", true: "#EC9A15" }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Allow save</Text>
            <Switch
              value={allowSave}
              onValueChange={setAllowSave}
              trackColor={{ false: "#767577", true: "#EC9A15" }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.saveDraftButton} onPress={handleSaveDraft}>
          <Text style={styles.saveDraftText}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.postButton, isUploading && styles.postButtonDisabled]} 
          onPress={handlePost}
          disabled={isUploading}
        >
          <Text style={styles.postButtonText}>{isUploading ? 'Uploading...' : 'Post Now'}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showMoreOptions}
        transparent={true}
        animationType="none"
        onRequestClose={closeMoreOptions}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeMoreOptions}>
          <Animated.View
            style={[styles.moreOptionsModal, { transform: [{ translateY: slideAnim }] }]}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeMoreOptions}>
                  <BackIcon color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>More options</Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.toggleSection}>
                  <View style={styles.toggleRow}>
                    <View style={styles.toggleLeft}>
                      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" style={styles.toggleIcon}>
                        <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        <Path d="M9 9h6M9 13h4" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                      </Svg>
                      <Text style={styles.toggleLabel}>Turn off commenting</Text>
                    </View>
                    <Switch
                      value={turnOffCommenting}
                      onValueChange={setTurnOffCommenting}
                      trackColor={{ false: "#767577", true: "#EC9A15" }}
                      thumbColor="#fff"
                      ios_backgroundColor="#767577"
                    />
                  </View>

                  <View style={styles.toggleRow}>
                    <View style={styles.toggleLeft}>
                      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" style={styles.toggleIcon}>
                        <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                      <Text style={styles.toggleLabel}>Hide like count</Text>
                    </View>
                    <Switch
                      value={hideLikeCount}
                      onValueChange={setHideLikeCount}
                      trackColor={{ false: "#767577", true: "#EC9A15" }}
                      thumbColor="#fff"
                      ios_backgroundColor="#767577"
                    />
                  </View>

                  <View style={styles.toggleRow}>
                    <View style={styles.toggleLeft}>
                      <Svg width={22} height={22} viewBox="0 0 32 32" fill="none" style={styles.toggleIcon}>
                        <Path d="M16.5 2.353c-7.857 0-14.25 5.438-14.25 12.124 0.044 2.834 1.15 5.402 2.938 7.33l-0.006-0.007c-0.597 2.605-1.907 4.844-3.712 6.569l-0.005 0.005c-0.132 0.135-0.214 0.32-0.214 0.525 0 0.414 0.336 0.75 0.75 0.751h0c0.054-0 0.107-0.006 0.158-0.017l-0.005 0.001c3.47-0.559 6.546-1.94 9.119-3.936l-0.045 0.034c1.569 0.552 3.378 0.871 5.262 0.871 0.004 0 0.009 0 0.013 0h-0.001c7.857 0 14.25-5.439 14.25-12.125s-6.393-12.124-14.25-12.124z" fill="#fff" />
                      </Svg>
                      <Text style={styles.toggleLabel}>Hide comment count</Text>
                    </View>
                    <Switch
                      value={hideCommentCount}
                      onValueChange={setHideCommentCount}
                      trackColor={{ false: "#767577", true: "#EC9A15" }}
                      thumbColor="#fff"
                      ios_backgroundColor="#767577"
                    />
                  </View>

                  <View style={styles.toggleRow}>
                    <View style={styles.toggleLeft}>
                      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" style={styles.toggleIcon}>
                        <Path d="M9.61109 12.4L10.8183 18.5355C11.0462 19.6939 12.6026 19.9244 13.1565 18.8818L19.0211 7.84263C19.248 7.41555 19.2006 6.94354 18.9737 6.58417M9.61109 12.4L5.22642 8.15534C4.41653 7.37131 4.97155 6 6.09877 6H17.9135C18.3758 6 18.7568 6.24061 18.9737 6.58417M9.61109 12.4L18.9737 6.58417" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                      <Text style={styles.toggleLabel}>Hide share count</Text>
                    </View>
                    <Switch
                      value={hideShareCount}
                      onValueChange={setHideShareCount}
                      trackColor={{ false: "#767577", true: "#EC9A15" }}
                      thumbColor="#fff"
                      ios_backgroundColor="#767577"
                    />
                  </View>

                  <View style={styles.toggleRow}>
                    <View style={styles.toggleLeft}>
                      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" style={styles.toggleIcon}>
                        <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                      <Text style={styles.toggleLabel}>Hide save count</Text>
                    </View>
                    <Switch
                      value={hideSaveCount}
                      onValueChange={setHideSaveCount}
                      trackColor={{ false: "#767577", true: "#EC9A15" }}
                      thumbColor="#fff"
                      ios_backgroundColor="#767577"
                    />
                  </View>

                  <View style={styles.toggleRow}>
                    <View style={styles.toggleLeft}>
                      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" style={styles.toggleIcon}>
                        <Path d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zM21 16c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                      <Text style={styles.toggleLabel}>Allow remix / duet</Text>
                    </View>
                    <Switch
                      value={allowRemix}
                      onValueChange={setAllowRemix}
                      trackColor={{ false: "#767577", true: "#EC9A15" }}
                      thumbColor="#fff"
                      ios_backgroundColor="#767577"
                    />
                  </View>
                </View>

                <View style={styles.sharingSection}>
                  <Text style={styles.sharingTitle}>Share on</Text>

                  <TouchableOpacity style={styles.shareOption}>
                    <InstagramIcon size={26} />
                    <Text style={styles.shareOptionText}>Instagram</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showPrivacyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPrivacyModal(false)}
        >
          <View style={styles.simpleModal}>
            <Text style={styles.simpleModalTitle}>Who can see your reel?</Text>
            {["Everyone", "Followers only", "Private (only me)"].map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.modalOption}
                onPress={() => {
                  setPrivacy(option);
                  setShowPrivacyModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{option}</Text>
                {privacy === option && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowPrivacyModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showMusicModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMusicModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMusicModal(false)}
        >
          <View style={styles.simpleModal}>
            <Text style={styles.simpleModalTitle}>Select Music</Text>
            {["Original Sound", "Trending Song 1", "Trending Song 2", "My Music"].map((music) => (
              <TouchableOpacity
                key={music}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedMusic(music);
                  setShowMusicModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{music}</Text>
                {selectedMusic === music && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowMusicModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showTagModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTagModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTagModal(false)}
        >
          <View style={styles.simpleModal}>
            <Text style={styles.simpleModalTitle}>Tag People</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search people..."
              placeholderTextColor="#666"
            />
            {[
              {
                id: 1,
                name: "User 1",
                avatar: require("@assets/images/user1.png"),
              },
              {
                id: 2,
                name: "User 2",
                avatar: require("@assets/images/user2.png"),
              },
            ].map((person) => (
              <TouchableOpacity
                key={person.id}
                style={styles.modalOption}
                onPress={() => {
                  if (!taggedPeople.find((p) => p.id === person.id)) {
                    setTaggedPeople([...taggedPeople, person]);
                  }
                  setShowTagModal(false);
                }}
              >
                <Image source={person.avatar} style={styles.modalAvatar} />
                <Text style={styles.modalOptionText}>{person.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowTagModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showLocationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLocationModal(false)}
        >
          <View style={styles.simpleModal}>
            <Text style={styles.simpleModalTitle}>Add Location</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search location..."
              placeholderTextColor="#666"
            />
            {["Mumbai, India", "Delhi, India", "Bangalore, India"].map((loc) => (
              <TouchableOpacity
                key={loc}
                style={styles.modalOption}
                onPress={() => {
                  setLocation(loc);
                  setShowLocationModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{loc}</Text>
                {location === loc && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowLocationModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 16 : 12,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2a2a2a",
    backgroundColor: "#000",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  moreButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  videoPreview: {
    width: "100%",
    height: height * 0.4,
    backgroundColor: "#000",
    marginBottom: 18,
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  captionInput: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 15,
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    lineHeight: 20,
  },
  charCount: {
    color: "#666",
    fontSize: 12,
    textAlign: "right",
    marginTop: 8,
  },
  hashtagInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  hashtagInput: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    fontSize: 14,
    borderWidth: 0.5,
    borderColor: "#333",
  },
  addHashtagButton: {
    backgroundColor: "#EC9A15",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addHashtagText: {
    color: "#fff",
    fontWeight: "600",
  },
  suggestionsContainer: {
    marginBottom: 12,
    marginTop: 8,
  },
  suggestionsTitle: {
    color: "#999",
    fontSize: 13,
    marginBottom: 8,
    fontWeight: "500",
  },
  suggestionChip: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "#EC9A15",
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionText: {
    color: "#EC9A15",
    fontSize: 13,
    fontWeight: "500",
  },
  customHashtagChip: {
    borderColor: "#fff",
    backgroundColor: "#2a2a2a",
  },
  customHashtagText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
  hashtagChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  hashtagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EC9A15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  hashtagChipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  removeHashtag: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2a2a2a",
    gap: 12,
    backgroundColor: "#0f0f0f",
    marginHorizontal: 0,
    marginVertical: 1,
    borderRadius: 0,
  },
  optionText: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  chevron: {
    color: "#666",
    fontSize: 24,
  },
  privacyValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  privacyText: {
    color: "#EC9A15",
    fontSize: 16,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2a2a2a",
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  toggleIcon: {
    opacity: 0.9,
  },
  toggleLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  taggedContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  taggedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 0.5,
    borderColor: "#333",
  },
  taggedAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  taggedName: {
    color: "#fff",
    fontSize: 14,
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 32 : 20,
    backgroundColor: "#000",
    borderTopWidth: 0.5,
    borderTopColor: "#2a2a2a",
    gap: 10,
  },
  saveDraftButton: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  saveDraftText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  postButton: {
    flex: 2,
    backgroundColor: "#EC9A15",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#EC9A15",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  postButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  postButtonDisabled: {
    backgroundColor: "#999",
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  moreOptionsModal: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  modalContent: {
    paddingHorizontal: 0,
  },
  toggleSection: {
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  sharingSection: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 0.5,
    borderTopColor: "#2a2a2a",
    marginTop: 8,
  },
  sharingTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
    opacity: 0.9,
  },
  shareOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2a2a2a",
  },
  shareOptionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
  simpleModal: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    margin: 20,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "#333",
  },
  simpleModalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
  modalOptionText: {
    color: "#fff",
    fontSize: 16,
  },
  checkmark: {
    color: "#EC9A15",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 0.5,
    borderTopColor: "#333",
  },
  modalCancelText: {
    color: "#EC9A15",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  searchInput: {
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    fontSize: 14,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 0.5,
    borderColor: "#333",
  },
  modalAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
});

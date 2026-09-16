import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { File, Paths } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Asset } from "expo-asset";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Platform,
  Modal,
  Animated,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Linking,
  AppState,
  Alert,
  ViewToken,
} from "react-native";

let FFmpegKit: any = null;
let ReturnCode: any = null;
let isFFmpegAvailable = false;

try {
  const ffmpeg = require("ffmpeg-kit-react-native-community");
  FFmpegKit = ffmpeg.FFmpegKit;
  ReturnCode = ffmpeg.ReturnCode;
  isFFmpegAvailable = true;
} catch (e) {
  console.warn("FFmpeg not available in reel index - watermarking will fail gracefully in Expo Go");
  isFFmpegAvailable = false;
}

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";
import Svg, { Path } from "react-native-svg";
import BottomNav from "@components/layout/BottomNav";
import DrawerMenu from "@components/layout/DrawerMenu";
import SupportModal from "@/components/modals/SupportModal/SupportModal";
import { ReelViewer } from "@components/reel/ReelViewer";
import {
  scale,
  getFontSize,
  wp,
  hp,
  getStatusBarHeight,
  spacing,
} from "@utils/responsive";
import { followService } from "@api/services/followService";
import { followUpdateEmitter } from "@utils/followEmitter";
import { reelsService } from "@api/services/reelsService";
import { commentService } from "@api/services/commentService";
import {
  HomeIconSVG,
  ReelIconSVG,
  SearchIconSVG,
  UserIconSVG,
  StarIcon,
  BlockIcon,
  CoinIcon,
  CommentIcon,
  DownloadIcon,
  FlagIcon,
  FullScreenIcon,
  HeartIcon,
  MusicIcon,
  PauseIcon,
  PlayIcon,
  ShareIcon,
  ThreeDotsIcon,
} from "@/icons";

const { width, height } = Dimensions.get("window");

interface ReelVideoPlayerProps {
  reel: any;
  isVisible: boolean;
  videoRefs: React.MutableRefObject<Map<number, ReturnType<typeof useVideoPlayer>>>;
}

function ReelVideoPlayer({ reel, isVisible, videoRefs }: ReelVideoPlayerProps) {
  const player = useVideoPlayer(reel.video, (player) => {
    player.loop = true;
    player.muted = false;
  });

  React.useEffect(() => {
    videoRefs.current.set(reel.id, player);
    return () => {
      videoRefs.current.delete(reel.id);
    };
  }, [player, reel.id]);

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (isVisible && AppState.currentState === "active") {
      timeoutId = setTimeout(() => {
        if (AppState.currentState === "active") {
          player.play();
        }
      }, 100);
    } else {
      player.pause();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isVisible, player]);

  return (
    <VideoView
      style={styles.reelImage}
      player={player}
      contentFit="cover"
      allowsFullscreen
    />
  );
}

export default function GullyReelScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [isFocused, setIsFocused] = useState(false);
  const [activeTab, setActiveTab] = useState("Reel");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [showVotePopup, setShowVotePopup] = useState<number | null>(null);
  const votePopupAnim = useRef(new Animated.Value(0)).current;
  const [reels, setReels] = useState<any[]>([]);
  const [isLoadingReels, setIsLoadingReels] = useState(true);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [hasMoreReels, setHasMoreReels] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const flatListRef = useRef<FlatList<any>>(null);
  const [showMoreShareOptions, setShowMoreShareOptions] = useState(false);
  const [currentVisibleIndex, setCurrentVisibleIndex] = useState<number | null>(null);
  const videoRefs = useRef<Map<number, ReturnType<typeof useVideoPlayer>>>(new Map());
  const [showStarAnimation, setShowStarAnimation] = useState<number | null>(null);
  const [showThreeDotsMenu, setShowThreeDotsMenu] = useState(false);
  const [currentReelForMenu, setCurrentReelForMenu] = useState<number | null>(null);
  const [expandedCaptions, setExpandedCaptions] = useState<Set<number>>(new Set());
  const starAnimations = useRef<Map<number, { scale: Animated.Value; opacity: Animated.Value }>>(
    new Map()
  );
  const lastTap = useRef<{ time: number; id: number | null }>({
    time: 0,
    id: null,
  });

  const threeDotsSlideAnim = useRef(new Animated.Value(height)).current;
  const [tipModalVisible, setTipModalVisible] = useState(false);
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedReelForDownload, setSelectedReelForDownload] = useState<any>(null);
  const [currentTipReelId, setCurrentTipReelId] = useState<number | null>(null);
  const [currentTipCreatorId, setCurrentTipCreatorId] = useState<string | undefined>(undefined);
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState<{
    reelId: number;
    isPlaying: boolean;
  } | null>(null);
  const playPauseIconTimeout = useRef<NodeJS.Timeout | null>(null);
  const videoPlayingStates = useRef<Map<number, boolean>>(new Map());
  const playPauseIconOpacity = useRef(new Animated.Value(0)).current;
  const THEME_COLOR = "#EC9A15";

  const [followingStates, setFollowingStates] = useState<{ [key: string]: boolean }>({});
  
  const [shareModalFollowers, setShareModalFollowers] = useState<any[]>([]);
  const [isLoadingShareFollowers, setIsLoadingShareFollowers] = useState(false);

  const BOTTOM_NAV_HEIGHT = scale(60);

  const memoizedReels = useMemo(() => reels, [reels]);

  useFocusEffect(
  useCallback(() => {
    setIsFocused(true);
    return () => setIsFocused(false);
  }, [])
);

  useEffect(() => {
    const fetchInitialReels = async () => {
      try {
        setIsLoadingReels(true);
        const response = await reelsService.getReels(10);
        
        if (response.success && response.data?.reels) {
          setReels(response.data.reels);
          setCurrentCursor(response.data.nextCursor);
          setHasMoreReels(response.data.hasMore);
        } else {
          setReels([]);
          setHasMoreReels(false);
        }
      } catch (error: any) {
        console.error("[ReelScreen] Error fetching reels:", error.message || error);
        setReels([]);
        setHasMoreReels(false);
      } finally {
        setIsLoadingReels(false);
      }
    };
    
    fetchInitialReels();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const refetchFeedOnFocus = async () => {
        try {
          const response = await reelsService.getReels(10);
          if (response.success && response.data?.reels) {
            setReels(response.data.reels);
            setCurrentCursor(response.data.nextCursor);
            setHasMoreReels(response.data.hasMore);
          }
        } catch (error: any) {
          // Silent catch for background refresh
        }
      };

      refetchFeedOnFocus();
    }, [])
  );

  useEffect(() => {
    if (commentModalVisible && currentReelBackendId) {
      const fetchComments = async () => {
        try {
          setIsLoadingComments(true);
          const response = await commentService.getComments(currentReelBackendId);

          if (response.success && response.data?.items) {
            const mappedComments = response.data.items.map((comment: any, idx: number) => ({
              id: idx + 1,
              _backendId: comment._id,
              username: comment.userName || "Unknown",
              avatar: comment.userAvatar,
              level: comment.level || undefined,
              comment: comment.text,
              likes: comment.likeCount || 0,
              isLiked: comment.isLiked || false,
              createdAt: comment.createdAt,
              replies: comment.replies || [],
            }));

            setComments(mappedComments);
          } else {
            setComments([]);
          }
        } catch (error: any) {
          setComments([]);
        } finally {
          setIsLoadingComments(false);
        }
      };

      fetchComments();
    }
  }, [commentModalVisible, currentReelBackendId]);
  
  useEffect(() => {
    setCommentLikes(new Map());
  }, []);

  useEffect(() => {
    if (shareModalVisible) {
      const fetchFollowers = async () => {
        try {
          setIsLoadingShareFollowers(true);
          const response = await followService.getFollowers("me", { limit: 20 });

          if (response.success && response.data?.items) {
            const mappedFollowers = response.data.items.map((follower: any) => ({
              id: follower._id || follower.id,
              name: follower.name || follower.username || "User",
              avatar: follower.avatar ? { uri: follower.avatar } : require("@assets/images/user1.png"),
            }));
            setShareModalFollowers(mappedFollowers);
          } else {
            setShareModalFollowers([]);
          }
        } catch (error: any) {
          setShareModalFollowers([]);
        } finally {
          setIsLoadingShareFollowers(false);
        }
      };

      fetchFollowers();
    }
  }, [shareModalVisible]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState !== "active") {
        videoRefs.current.forEach((videoRef) => {
          if (videoRef) {
            videoRef.pause();
          }
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (params.reelId && flatListRef.current) {
      const reelIndex = parseInt(params.reelId as string) - 1;
      if (reelIndex >= 0 && reelIndex < reels.length) {
        setCurrentVisibleIndex(reelIndex);
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: reelIndex,
            animated: false,
          });
          const videoRef = videoRefs.current.get(reels[reelIndex].id);
          if (videoRef && AppState.currentState === "active") {
            videoRef.play();
          }
        }, 50);
      }
    } else {
      setCurrentVisibleIndex(0);
    }
  }, [params.reelId, reels.length]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        videoRefs.current.forEach((videoRef) => {
          if (videoRef) {
            videoRef.pause();
          }
        });
        starAnimations.current.clear();
      };
    }, [])
  );

  const onViewableItemsChangedRef = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (
      viewableItems.length > 0 &&
      viewableItems[0].index !== null &&
      viewableItems[0].index !== undefined
    ) {
      setCurrentVisibleIndex(viewableItems[0].index);
    }
  });

  const handleBackPress = () => {
    router.push("/(main)" as any);
  };

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [currentReelId, setCurrentReelId] = useState<number | null>(null);
  const [currentReelBackendId, setCurrentReelBackendId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [replyingToComment, setReplyingToComment] = useState<number | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [commentLikes, setCommentLikes] = useState<
    Map<number, { likes: number; isLiked: boolean }>
  >(new Map());
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [reelViewerVisible, setReelViewerVisible] = useState(false);
  const [reelViewerInitialIndex, setReelViewerInitialIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const shareScrollViewRef = useRef<ScrollView>(null);

  const executeDownloadWithWatermark = async (reelData: any) => {
    setIsDownloading(true);
    try {
      if (!isFFmpegAvailable) {
        Alert.alert(
          "Feature Not Available",
          "Video watermarking requires a development build with FFmpeg. " +
          "In Expo Go, you can only download videos without watermarks. " +
          "To get full functionality, create a development build: eas build --platform android --profile preview"
        );
        setIsDownloading(false);
        setDownloadModalVisible(false);
        return;
      }

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "We need access to save the video.");
        setIsDownloading(false);
        setDownloadModalVisible(false);
        return;
      }

      const videoAsset = Asset.fromModule(reelData.video);
      await videoAsset.downloadAsync();
      const videoUri = videoAsset.localUri || videoAsset.uri;

      const watermarkAsset = Asset.fromModule(require("@assets/images/gfi.png"));
      await watermarkAsset.downloadAsync();
      const watermarkUri = watermarkAsset.localUri || watermarkAsset.uri;

      const outputFile = new File(Paths.cache, `gully_watermarked_${Date.now()}.mp4`);
      const outputUri = outputFile.uri;

      const ffmpegCommand = `-i ${videoUri} -i ${watermarkUri} -filter_complex "[1:v]scale=120:-1,format=rgba,colorchannelmixer=aa=0.6[wm];[0:v][wm]overlay=W-w-20:H-h-20" -preset ultrafast -c:a copy ${outputUri}`;

      const session = await FFmpegKit.execute(ffmpegCommand);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        const asset = await MediaLibrary.createAssetAsync(outputUri);
        const existingAlbum = await MediaLibrary.getAlbumAsync("GullyFame");

        if (existingAlbum) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], existingAlbum, false);
        } else {
          await MediaLibrary.createAlbumAsync("GullyFame", asset, false);
        }

        if (outputFile.exists) {
          outputFile.delete();
        }

        Alert.alert("Success!", "Reel saved to your gallery with +10 XP!");
      } else {
        console.error("FFmpeg failed to render watermark");
        Alert.alert("Error", "Failed to process video.");
      }
    } catch (error) {
      console.error("Export Error:", error);
      Alert.alert("Error", "Something went wrong during download.");
    } finally {
      setIsDownloading(false);
      setDownloadModalVisible(false);
      setSelectedReelForDownload(null);
    }
  };

  const handleShare = async (option: string) => {
    const reelUrl = `https://gullyfame.com/reel/${currentReelId}`;
    const reelText = `Check out this amazing reel on Gully Fame! ${reelUrl}`;

    try {
      switch (option) {
        case "copy":
          try {
            if (Platform.OS === "web") {
              await navigator.clipboard.writeText(reelUrl);
              Alert.alert("Copied!", "Link copied to clipboard");
            } else {
              Alert.alert("Copy Link", reelUrl, [{ text: "OK" }]);
            }
          } catch {
            Alert.alert("Copy Link", reelUrl);
          }
          break;
        case "whatsapp":
          const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(reelText)}`;
          const canOpen = await Linking.canOpenURL(whatsappUrl);
          if (canOpen) {
            await Linking.openURL(whatsappUrl);
          } else {
            Alert.alert("WhatsApp not installed", "Please install WhatsApp to share");
          }
          break;
        case "whatsappstatus":
          const statusUrl = `whatsapp://send?text=${encodeURIComponent(reelText)}`;
          const canOpenStatus = await Linking.canOpenURL(statusUrl);
          if (canOpenStatus) {
            await Linking.openURL(statusUrl);
          } else {
            Alert.alert("WhatsApp not installed", "Please install WhatsApp to share");
          }
          break;
        case "instagram":
          const instagramUrl = `instagram://share`;
          const canOpenInsta = await Linking.canOpenURL(instagramUrl);
          if (canOpenInsta) {
            await Linking.openURL(instagramUrl);
          } else {
            Alert.alert("Instagram not installed", "Please install Instagram to share");
          }
          break;
        case "snapchat":
          const snapchatUrl = `snapchat://`;
          const canOpenSnap = await Linking.canOpenURL(snapchatUrl);
          if (canOpenSnap) {
            await Linking.openURL(snapchatUrl);
          } else {
            Alert.alert("Snapchat not installed", "Please install Snapchat to share");
          }
          break;
        case "download":
          Alert.alert("Download", "Download feature coming soon!");
          break;
        case "facebook":
          const facebookUrl = `fb://share?text=${encodeURIComponent(reelText)}`;
          const canOpenFB = await Linking.canOpenURL(facebookUrl);
          if (canOpenFB) {
            await Linking.openURL(facebookUrl);
          } else {
            const fbWebUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(reelUrl)}`;
            await Linking.openURL(fbWebUrl);
          }
          break;
        case "twitter":
          const twitterUrl = `twitter://post?message=${encodeURIComponent(reelText)}`;
          const canOpenTwitter = await Linking.canOpenURL(twitterUrl);
          if (canOpenTwitter) {
            await Linking.openURL(twitterUrl);
          } else {
            const twitterWebUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(reelText)}`;
            await Linking.openURL(twitterWebUrl);
          }
          break;
      }
      
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShareModalVisible(false);
        setShowMoreShareOptions(false);
      });
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Unable to share. Please try again.");
    }
  };

  const handleLike = useCallback(
    async (id: number) => {
      const targetReel = reels.find((r) => r.id === id);
      if (!targetReel || !targetReel._backendId) {
        return;
      }

      if (targetReel && !targetReel.isLiked) {
        setShowVotePopup(id);
        votePopupAnim.setValue(0);
        Animated.timing(votePopupAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => setShowVotePopup(null));
      }

      const previousReels = reels;

      setReels((prevReels) =>
        prevReels.map((reel) =>
          reel.id === id
            ? {
              ...reel,
              isLiked: !reel.isLiked,
              likes: reel.isLiked ? reel.likes - 1 : reel.likes + 1,
            }
            : reel
        )
      );

      try {
        const response = await reelsService.toggleLikeReel(targetReel._backendId);

        if (!response.success) {
          setReels(previousReels);
          Alert.alert("Error", response.message || "Failed to like reel");
        }
      } catch (error: any) {
        setReels(previousReels);
        Alert.alert("Error", "Failed to like reel");
      }
    },
    [reels, votePopupAnim]
  );

  const handleVideoTap = useCallback(async (id: number) => {
    const videoRef = videoRefs.current.get(id);
    if (!videoRef) return;

    try {
      const status = await videoRef.getStatusAsync();
      if (status.isLoaded) {
        const isPlaying = status.isPlaying;
        videoPlayingStates.current.set(id, !isPlaying);

        if (isPlaying) {
          videoRef.pause();
          setShowPlayPauseIcon({ reelId: id, isPlaying: false });
        } else {
          if (AppState.currentState === "active") {
            videoRef.play();
            setShowPlayPauseIcon({ reelId: id, isPlaying: true });
          }
        }

        playPauseIconOpacity.setValue(0);
        Animated.timing(playPauseIconOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();

        if (playPauseIconTimeout.current) {
          clearTimeout(playPauseIconTimeout.current);
        }

        playPauseIconTimeout.current = setTimeout(() => {
          Animated.timing(playPauseIconOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowPlayPauseIcon(null);
          });
        }, 1000);
      }
    } catch (error) {
      console.error("Error toggling video playback:", error);
    }
  }, []);

  const handleDoubleTap = useCallback(
    (id: number) => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;

      if (now - lastTap.current.time < DOUBLE_TAP_DELAY && lastTap.current.id === id) {
        const targetReel = reels.find((r) => r.id === id);

        if (targetReel && !targetReel.isLiked) {
          if (!starAnimations.current.has(id)) {
            starAnimations.current.set(id, {
              scale: new Animated.Value(0),
              opacity: new Animated.Value(0),
            });
          }

          const anim = starAnimations.current.get(id)!;
          setShowStarAnimation(id);
          anim.scale.setValue(0);
          anim.opacity.setValue(1);

          Animated.parallel([
            Animated.spring(anim.scale, {
              toValue: 1.2,
              useNativeDriver: true,
              tension: 50,
              friction: 3,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setShowStarAnimation(null);
            anim.scale.setValue(0);
          });
        }

        setReels((prevReels) =>
          prevReels.map((r) =>
            r.id === id && !r.isLiked ? { ...r, isLiked: true, likes: r.likes + 1 } : r
          )
        );

        lastTap.current = { time: 0, id: null };
      } else {
        lastTap.current = { time: now, id };
      }
    },
    [reels]
  );

  const handleSave = useCallback(
    async (id: number) => {
      const targetReel = reels.find((r) => r.id === id);
      if (!targetReel || !targetReel._backendId) {
        return;
      }

      const previousReels = reels;

      setReels((prevReels) =>
        prevReels.map((reel) =>
          reel.id === id
            ? {
              ...reel,
              isSaved: !reel.isSaved,
              saves: reel.isSaved ? (reel.saves || 0) - 1 : (reel.saves || 0) + 1,
            }
            : reel
        )
      );

      try {
        const response = await reelsService.toggleSaveReel(targetReel._backendId);

        if (!response.success) {
          setReels(previousReels);
          Alert.alert("Error", response.message || "Failed to save reel");
        }
      } catch (error: any) {
        setReels(previousReels);
        Alert.alert("Error", "Failed to save reel");
      }
    },
    [reels]
  );

  const handleEndReached = useCallback(() => {
    if (isLoadingMore || !hasMoreReels || !currentCursor) {
      return;
    }

    const fetchMoreReels = async () => {
      try {
        setIsLoadingMore(true);
        const response = await reelsService.getReels(10, currentCursor);

        if (response.success && response.data?.reels && response.data.reels.length > 0) {
          setReels((prevReels) => [...prevReels, ...response.data.reels]);
          setCurrentCursor(response.data.nextCursor);
          setHasMoreReels(response.data.hasMore);
        } else {
          setHasMoreReels(false);
        }
      } catch (error: any) {
        console.error("[ReelScreen] Error fetching more reels:", error.message || error);
      } finally {
        setIsLoadingMore(false);
      }
    };

    fetchMoreReels();
  }, [isLoadingMore, hasMoreReels, currentCursor]);

  const handlePostComment = useCallback(async () => {
    if (!commentText.trim() || !currentReelBackendId) {
      Alert.alert("Error", "Comment cannot be empty");
      return;
    }

    try {
      const response = await commentService.addComment(currentReelBackendId, {
        text: commentText.trim(),
      });

      if (response.success && response.data) {
        const newComment = {
          id: comments.length + 1,
          _backendId: response.data._id,
          username: response.data.userName || "You",
          level: response.data.level || undefined,
          comment: response.data.text,
          likes: response.data.likeCount || 0,
          isLiked: false,
          replies: [],
        };

        setComments((prev) => [newComment, ...prev]);
        setCommentText("");
        setReplyingToComment(null);

        Alert.alert("Success", "Comment posted!");
      } else {
        Alert.alert("Error", response.message || "Failed to post comment");
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to post comment");
    }
  }, [commentText, currentReelBackendId, comments.length]);

  const handleToggleCommentLike = useCallback(
    async (comment: any) => {
      if (!comment._backendId) return;

      const commentLikeData = commentLikes.get(comment.id) || {
        likes: comment.likes,
        isLiked: comment.isLiked,
      };

      setCommentLikes((prev) => {
        const newMap = new Map(prev);
        newMap.set(comment.id, {
          likes: commentLikeData.isLiked ? commentLikeData.likes - 1 : commentLikeData.likes + 1,
          isLiked: !commentLikeData.isLiked,
        });
        return newMap;
      });

      try {
        const response = commentLikeData.isLiked
          ? await commentService.unlikeComment(comment._backendId)
          : await commentService.likeComment(comment._backendId);

        if (!response.success) {
          setCommentLikes((prev) => {
            const newMap = new Map(prev);
            newMap.set(comment.id, commentLikeData);
            return newMap;
          });
        }
      } catch (error: any) {
        setCommentLikes((prev) => {
          const newMap = new Map(prev);
          newMap.set(comment.id, commentLikeData);
          return newMap;
        });
      }
    },
    [commentLikes]
  );

  const handleFollowUser = async (userId: string, username: string, reelId: number) => {
    try {
      const response = await followService.followUser(userId);

      if (response.success) {
        setReels((prevReels) =>
          prevReels.map((reel) =>
            reel.id === reelId ? { ...reel, isFollowed: true } : reel
          )
        );

        setFollowingStates((prev) => ({
          ...prev,
          [userId]: true,
        }));
        followUpdateEmitter.emit({ type: "follow", userId });
        Alert.alert("Success", `Now following ${username}!`);
      } else {
        Alert.alert("Error", response.message || "Failed to follow user");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to follow user");
    }
  };

  const handleUnfollowUser = async (userId: string, username: string, reelId: number) => {
    try {
      const response = await followService.unfollowUser(userId);

      if (response.success) {
        setReels((prevReels) =>
          prevReels.map((reel) =>
            reel.id === reelId ? { ...reel, isFollowed: false } : reel
          )
        );

        setFollowingStates((prev) => ({
          ...prev,
          [userId]: false,
        }));
        followUpdateEmitter.emit({ type: "unfollow", userId });
        Alert.alert("Success", `Unfollowed ${username}`);
      } else {
        Alert.alert("Error", response.message || "Failed to unfollow user");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to unfollow user");
    }
  };

  const tabs = [
    { name: "Home", icon: HomeIconSVG, label: "Home" },
    { name: "Reel", icon: ReelIconSVG, label: "GullyReel" },
    { name: "Upload", icon: null, label: "Upload" },
    { name: "Search", icon: SearchIconSVG, label: "Search" },
    { name: "MyFame", icon: UserIconSVG, label: "MyFame" },
  ];

  const renderReel = useCallback(
    ({ item: reel, index }: { item: any; index: number }) => {
      const isVisible = currentVisibleIndex === index;
      const anim = starAnimations.current.get(reel.id);
      const showAnimation = showStarAnimation === reel.id && isVisible && anim;
      const shouldLoadVideo =
        isFocused && currentVisibleIndex !== null && Math.abs(currentVisibleIndex - index) <= 1;
      return (
        <View style={styles.reelContainer}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              const now = Date.now();
              const DOUBLE_TAP_DELAY = 300;

              if (now - lastTap.current.time < DOUBLE_TAP_DELAY && lastTap.current.id === reel.id) {
                handleDoubleTap(reel.id);
                lastTap.current = { time: 0, id: null };
              } else {
                handleVideoTap(reel.id);
                lastTap.current = { time: now, id: reel.id };
              }
            }}
            style={styles.videoTouchable}
          >
            {shouldLoadVideo ? (
              <ReelVideoPlayer 
                reel={reel}
                isVisible={isVisible}
                videoRefs={videoRefs}
              />
            ) : (
              <View style={[styles.reelImage, { backgroundColor: "#111" }]} />
            )}

            {showAnimation && (
              <Animated.View
                style={[
                  styles.starAnimationContainer,
                  {
                    transform: [{ scale: anim.scale }],
                    opacity: anim.opacity,
                  },
                ]}
                pointerEvents="none"
              >
                <StarIcon filled={true} color={THEME_COLOR} size={80} themeColor={THEME_COLOR} />
              </Animated.View>
            )}
          </TouchableOpacity>

          <View style={styles.overlay} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.threeDotsButton}
              onPress={() => {
                setCurrentReelForMenu(reel.id);
                threeDotsSlideAnim.setValue(height);
                setShowThreeDotsMenu(true);
                Animated.spring(threeDotsSlideAnim, {
                  toValue: 0,
                  useNativeDriver: true,
                  tension: 50,
                  friction: 8,
                }).start();
              }}
            >
              <ThreeDotsIcon color="#fff" size={24} />
            </TouchableOpacity>

            <View style={styles.rightActionContainer}>
              <TouchableOpacity
                style={styles.rightActionButton}
                onPress={() => {
                  setCurrentReelId(reel.id);
                  setCurrentReelBackendId(reel._backendId || String(reel.id));
                  
                  slideAnim.setValue(height);
                  setCommentModalVisible(true);
                  
                  Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                  }).start();
                }}
              >
                <CommentIcon color="#fff" size={32} />
                <Text style={styles.actionIconCount}>{reel.comments}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rightActionButton}
                onPress={() => {
                  slideAnim.setValue(height);
                  setShareModalVisible(true);
                  Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                  }).start();
                }}
              >
                <ShareIcon color="#fff" size={32} />
                <Text style={styles.actionIconCount}>{reel.shares || 0}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rightActionButton}
                onPress={() => {
                  setSelectedReelForDownload(reel);
                  setDownloadModalVisible(true);
                }}
              >
                <DownloadIcon size={32} />
              </TouchableOpacity>
            </View>

            {showPlayPauseIcon && showPlayPauseIcon.reelId === reel.id && (
              <View style={styles.playPauseIconContainer} pointerEvents="none">
                <Animated.View
                  style={[styles.playPauseIconWrapper, { opacity: playPauseIconOpacity }]}
                >
                  {showPlayPauseIcon.isPlaying ? (
                    <PlayIcon size={scale(80)} color="#fff" />
                  ) : (
                    <PauseIcon size={scale(80)} color="#fff" />
                  )}
                </Animated.View>
              </View>
            )}

            <View
              style={[styles.bottomContent, { bottom: BOTTOM_NAV_HEIGHT + scale(16) }]}
              pointerEvents="box-none"
            >
              <View style={styles.bottomInfoContainer}>
                <View style={styles.profileRow}>
                  <TouchableOpacity style={styles.profileImageContainer}>
                    <Image
                      source={reel.avatar ? { uri: reel.avatar } : require("@assets/images/user1.png")}
                      style={styles.profileImage}
                    />
                    <View style={styles.followButton}>
                      <Text style={styles.followButtonText}>+</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Text style={styles.username}>{reel.username}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.followButtonBox}
                    onPress={() => {
                      const userId = reel.userId || "";
                      const isFollowing = followingStates[userId];
                      if (isFollowing) {
                        handleUnfollowUser(userId, reel.username, reel.id);
                      } else {
                        handleFollowUser(userId, reel.username, reel.id);
                      }
                    }}
                  >
                    <Text style={styles.followButtonBoxText}>
                      {reel.isFollowed || followingStates[reel.userId || ""] ? "Following" : "Follow"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.captionContainer}>
                  <Text
                    style={styles.caption}
                    numberOfLines={expandedCaptions.has(reel.id) ? undefined : 2}
                  >
                    {reel.caption}
                  </Text>
                  {reel.caption.length > 100 && (
                    <TouchableOpacity
                      onPress={() => {
                        setExpandedCaptions((prev) => {
                          const newSet = new Set(prev);
                          if (newSet.has(reel.id)) newSet.delete(reel.id);
                          else newSet.add(reel.id);
                          return newSet;
                        });
                      }}
                    >
                      <Text style={styles.showMoreText}>
                        {expandedCaptions.has(reel.id) ? "Show less" : "Show more"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.musicRow}>
                  <MusicIcon color="#fff" size={16} />
                  <Text style={styles.musicName} numberOfLines={1}>
                    {reel.musicName}
                  </Text>
                </View>
              </View>

              <View style={styles.bottomButtonsRow}>
                <View style={styles.flexButtonWrapper}>
                  <TouchableOpacity
                    style={styles.tipButton}
                    onPress={() => {
                      setCurrentTipReelId(reel.id);
                      setCurrentTipCreatorId(reel.userId);
                      setTipModalVisible(true);
                    }}
                  >
                    <CoinIcon size={16} color="#fff" />
                    <Text style={styles.tipButtonText}>Support</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.flexButtonWrapper}>
                  {showVotePopup === reel.id && (
                    <Animated.View
                      style={[
                        styles.floatingXP,
                        {
                          opacity: votePopupAnim.interpolate({
                            inputRange: [0, 0.2, 0.8, 1],
                            outputRange: [0, 1, 1, 0],
                          }),
                          transform: [
                            {
                              translateY: votePopupAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, -40],
                              }),
                            },
                            {
                              scale: votePopupAnim.interpolate({
                                inputRange: [0, 0.2, 1],
                                outputRange: [0.5, 1.2, 1],
                              }),
                            },
                          ],
                        },
                      ]}
                      pointerEvents="none"
                    >
                      <Text style={styles.floatingXPText}>+50 FAME! 🔥</Text>
                    </Animated.View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.tipButton,
                      reel.isLiked ? styles.voteButtonActive : styles.voteButtonInactive,
                    ]}
                    onPress={() => handleLike(reel.id)}
                  >
                    <StarIcon
                      filled={reel.isLiked}
                      size={18}
                      color={reel.isLiked ? "#fff" : THEME_COLOR}
                      themeColor={reel.isLiked ? "#fff" : THEME_COLOR}
                    />
                    <Text
                      style={[
                        styles.tipButtonText,
                        {
                          color: reel.isLiked ? "#fff" : THEME_COLOR,
                        },
                      ]}
                    >
                      {reel.isLiked ? "Voted" : "Vote"} • {reel.likes}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      );
    },
    [
      currentVisibleIndex,
      showStarAnimation,
      showVotePopup, 
      handleDoubleTap,
      handleLike,
      handleSave,
    ]
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      <View style={styles.backButtonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke="#fff"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={memoizedReels}
        renderItem={renderReel}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={styles.flatListContent}
        getItemLayout={(data: any, index: number) => ({
          length: height,
          offset: height * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChangedRef.current}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        windowSize={1}
        maxToRenderPerBatch={1}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        initialNumToRender={1}
        maintainVisibleContentPosition={null}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise((resolve) => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: false,
            });
          });
        }}
      />

      <Modal
        visible={commentModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => {
          Animated.timing(slideAnim, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setCommentModalVisible(false));
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            Animated.timing(slideAnim, {
              toValue: height,
              duration: 300,
              useNativeDriver: true,
            }).start(() => setCommentModalVisible(false));
          }}
        >
          <Animated.View style={[styles.gamifiedModal, { transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={{ flex: 1 }}
            >
              <View style={styles.handleBar} />

              <View style={styles.commentHeader}>
                <Text style={styles.commandPanelTitle}>COMMENTS</Text>
                <TouchableOpacity
                  onPress={() => {
                    Animated.timing(slideAnim, {
                      toValue: height,
                      duration: 300,
                      useNativeDriver: true,
                    }).start(() => setCommentModalVisible(false));
                  }}
                >
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1 }}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === "ios" ? "padding" : undefined}
                  style={{ flex: 1 }}
                >
                  <ScrollView
                    style={styles.commentsList}
                    contentContainerStyle={{
                      flexGrow: 1,
                      paddingBottom: 20,
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {isLoadingComments ? (
                      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="large" color={THEME_COLOR} />
                      </View>
                    ) : comments.length === 0 ? (
                      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: "#999", fontSize: 14 }}>No comments yet</Text>
                      </View>
                    ) : (
                      comments.map((comment) => {
                      const commentLikeData = commentLikes.get(comment.id) || {
                        likes: comment.likes,
                        isLiked: comment.isLiked,
                      };
                      return (
                        <View key={comment.id} style={styles.cleanCommentRow}>
                          <View style={styles.commentItemInner}>
                            <Image
                              source={comment.avatar ? { uri: comment.avatar } : require("@assets/images/user1.png")}
                              style={styles.commentAvatar}
                            />
                            <View style={styles.commentContent}>
                              <View style={styles.usernameRow}>
                                <Text style={styles.commentUsername}>{comment.username}</Text>
                                <Text style={styles.levelText}>
                                  Lv.
                                  {comment.level}
                                </Text>
                              </View>
                              <Text style={styles.commentText}>{comment.comment}</Text>

                              <View style={styles.commentActions}>
                                <TouchableOpacity
                                  onPress={() => {
                                    if (replyingToComment === comment.id) {
                                      setReplyingToComment(null);
                                      setCommentText("");
                                    } else {
                                      setReplyingToComment(comment.id);
                                      setCommentText(`@${comment.username} `);
                                    }
                                  }}
                                >
                                  <Text style={styles.commentReply}>
                                    {replyingToComment === comment.id ? "Cancel" : "Reply"}
                                  </Text>
                                </TouchableOpacity>
                              </View>

                              {comment.replies && comment.replies.length > 0 && (
                                <TouchableOpacity
                                  onPress={() => {
                                    setExpandedReplies((prev) => {
                                      const newSet = new Set(prev);
                                      if (newSet.has(comment.id)) newSet.delete(comment.id);
                                      else newSet.add(comment.id);
                                      return newSet;
                                    });
                                  }}
                                  style={styles.viewRepliesButton}
                                >
                                  <Text style={styles.viewRepliesText}>
                                    {expandedReplies.has(comment.id)
                                      ? `—  Hide ${comment.replies.length} ${comment.replies.length === 1 ? "reply" : "replies"}`
                                      : `—  View ${comment.replies.length} ${comment.replies.length === 1 ? "reply" : "replies"}`}
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>

                            <TouchableOpacity
                              style={styles.commentLikeButton}
                              onPress={() => handleToggleCommentLike(comment)}
                            >
                              <StarIcon
                                filled={commentLikeData.isLiked}
                                color="#666"
                                size={16}
                                themeColor={THEME_COLOR}
                              />
                              <Text
                                style={[
                                  styles.commentLikeCount,
                                  commentLikeData.isLiked && {
                                    color: THEME_COLOR,
                                  },
                                ]}
                              >
                                {commentLikeData.likes}
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {expandedReplies.has(comment.id) &&
                            comment.replies &&
                            comment.replies.length > 0 && (
                              <View style={styles.repliesContainer}>
                                {comment.replies.map((reply) => {
                                  const replyLikeData = commentLikes.get(reply.id) || {
                                    likes: reply.likes,
                                    isLiked: reply.isLiked,
                                  };
                                  return (
                                    <View key={reply.id} style={styles.cleanReplyRow}>
                                      <Image
                                        source={reply.avatar ? { uri: reply.avatar } : require("@assets/images/user1.png")}
                                        style={styles.replyAvatar}
                                      />
                                      <View style={styles.replyContent}>
                                        <View style={styles.usernameRow}>
                                          <Text style={styles.replyUsername}>{reply.username}</Text>
                                          <Text style={styles.levelTextSub}>
                                            Lv.
                                            {reply.level}
                                          </Text>
                                        </View>
                                        <Text style={styles.replyText}>{reply.comment}</Text>
                                      </View>
                                      <TouchableOpacity
                                        style={styles.commentLikeButton}
                                        onPress={() => handleToggleCommentLike(reply)}
                                      >
                                        <StarIcon
                                          filled={replyLikeData.isLiked}
                                          color="#666"
                                          size={14}
                                          themeColor={THEME_COLOR}
                                        />
                                        <Text
                                          style={[
                                            styles.commentLikeCount,
                                            replyLikeData.isLiked && {
                                              color: THEME_COLOR,
                                            },
                                          ]}
                                        >
                                          {replyLikeData.likes}
                                        </Text>
                                      </TouchableOpacity>
                                    </View>
                                  );
                                })}
                              </View>
                            )}
                        </View>
                      );
                    })
                    )}
                  </ScrollView>

                  <View style={styles.gamifiedInputWrapper}>
                    <View style={styles.gamifiedInputContainer}>
                      <Image
                        source={require("@assets/images/user1.png")}
                        style={styles.commentInputAvatar}
                      />
                      <TextInput
                        style={styles.commentInput}
                        placeholder="Add a comment..."
                        placeholderTextColor="#666"
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                        maxLength={500}
                      />
                      <TouchableOpacity
                        style={styles.sendCommentButton}
                        onPress={handlePostComment}
                        disabled={!commentText.trim()}
                      >
                        <Text style={styles.sendCommentText}>Send</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </KeyboardAvoidingView>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={shareModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => {
          Animated.timing(slideAnim, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setShareModalVisible(false);
            setShowMoreShareOptions(false);
          });
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            Animated.timing(slideAnim, {
              toValue: height,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              setShareModalVisible(false);
              setShowMoreShareOptions(false);
            });
          }}
        >
          <Animated.View
            style={[
              styles.shareModal,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.handleBar} />

              <View style={styles.shareHeader}>
                <Text style={styles.shareHeaderTitle}>Share</Text>
                <TouchableOpacity
                  onPress={() => {
                    Animated.timing(slideAnim, {
                      toValue: height,
                      duration: 300,
                      useNativeDriver: true,
                    }).start(() => {
                      setShareModalVisible(false);
                      setShowMoreShareOptions(false);
                    });
                  }}
                >
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.friendsSection}>
                <Text style={styles.sectionTitle}>Send to</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.friendsList}
                >
                  {isLoadingShareFollowers ? (
                    <ActivityIndicator
                      size="small"
                      color="#EC9A15"
                      style={{ marginHorizontal: spacing.lg }}
                    />
                  ) : shareModalFollowers.length > 0 ? (
                    shareModalFollowers.map((friend) => (
                      <TouchableOpacity key={friend.id} style={styles.friendItem}>
                        <Image source={friend.avatar} style={styles.friendAvatar} />
                        <Text style={styles.friendName} numberOfLines={1}>
                          {friend.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text
                      style={[
                        styles.friendName,
                        { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
                      ]}
                    >
                      No followers yet
                    </Text>
                  )}
                </ScrollView>
              </View>

              <View style={styles.shareOptionsSection}>
                <Text style={styles.sectionTitle}>Share to</Text>
                <ScrollView
                  ref={shareScrollViewRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.shareOptionsList}
                >
                  <TouchableOpacity style={styles.shareOption} onPress={() => handleShare("copy")}>
                    <View style={[styles.shareOptionIconCircle, { backgroundColor: "#66620" }]}>
                      <Image
                        source={require("@assets/ShareIcon/copy.png")}
                        style={styles.shareIconImage}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.shareOptionName} numberOfLines={1}>
                      Copy Link
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shareOption}
                    onPress={() => handleShare("whatsapp")}
                  >
                    <View
                      style={[
                        styles.shareOptionIconCircle,
                        {
                          backgroundColor: "#25D36620",
                        },
                      ]}
                    >
                      <Image
                        source={require("@assets/ShareIcon/whatsapp.png")}
                        style={styles.shareIconImage}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.shareOptionName} numberOfLines={1}>
                      WhatsApp
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shareOption}
                    onPress={() => handleShare("whatsappstatus")}
                  >
                    <View
                      style={[
                        styles.shareOptionIconCircle,
                        {
                          backgroundColor: "#25D36620",
                        },
                      ]}
                    >
                      <Image
                        source={require("@assets/ShareIcon/status.png")}
                        style={styles.shareIconImage}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.shareOptionName} numberOfLines={1}>
                      Status
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shareOption}
                    onPress={() => handleShare("instagram")}
                  >
                    <View
                      style={[
                        styles.shareOptionIconCircle,
                        {
                          backgroundColor: "#E4405F20",
                        },
                      ]}
                    >
                      <Image
                        source={require("@assets/ShareIcon/instagram.png")}
                        style={styles.shareIconImage}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.shareOptionName} numberOfLines={1}>
                      Instagram
                    </Text>
                  </TouchableOpacity>

                  {showMoreShareOptions && (
                    <>
                      <TouchableOpacity
                        style={styles.shareOption}
                        onPress={() => handleShare("snapchat")}
                      >
                        <View
                          style={[
                            styles.shareOptionIconCircle,
                            {
                              backgroundColor: "#FFEC0620",
                            },
                          ]}
                        >
                          <Image
                            source={require("@assets/ShareIcon/snapchat.png")}
                            style={styles.shareIconImage}
                            resizeMode="contain"
                          />
                        </View>
                        <Text style={styles.shareOptionName} numberOfLines={1}>
                          Snapchat
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.shareOption}
                        onPress={() => handleShare("download")}
                      >
                        <View
                          style={[
                            styles.shareOptionIconCircle,
                            {
                              backgroundColor: "#66620",
                            },
                          ]}
                        >
                          <Image
                            source={require("@assets/ShareIcon/download.svg")}
                            style={styles.shareIconImage}
                            resizeMode="contain"
                          />
                        </View>
                        <Text style={styles.shareOptionName} numberOfLines={1}>
                          Download
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.shareOption}
                        onPress={() => handleShare("facebook")}
                      >
                        <View
                          style={[
                            styles.shareOptionIconCircle,
                            {
                              backgroundColor: "#485a9620",
                            },
                          ]}
                        >
                          <Image
                            source={require("@assets/ShareIcon/facebook.svg")}
                            style={styles.shareIconImage}
                            resizeMode="contain"
                          />
                        </View>
                        <Text style={styles.shareOptionName} numberOfLines={1}>
                          Facebook
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.shareOption}
                        onPress={() => handleShare("twitter")}
                      >
                        <View
                          style={[
                            styles.shareOptionIconCircle,
                            {
                              backgroundColor: "#1DA1F220",
                            },
                          ]}
                        >
                          <Image
                            source={require("@assets/ShareIcon/twitter.png")}
                            style={styles.shareIconImage}
                            resizeMode="contain"
                          />
                        </View>
                        <Text style={styles.shareOptionName} numberOfLines={1}>
                          Twitter
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {!showMoreShareOptions && (
                    <TouchableOpacity
                      style={styles.shareOption}
                      onPress={() => {
                        setShowMoreShareOptions(true);
                        
                        setTimeout(() => {
                          shareScrollViewRef.current?.scrollToEnd({
                            animated: true,
                          });
                        }, 100);
                      }}
                    >
                      <View
                        style={[
                          styles.shareOptionIconCircle,
                          {
                            backgroundColor: "#66620",
                          },
                        ]}
                      >
                        <Text style={styles.shareOptionIconText}>⋯</Text>
                      </View>
                      <Text style={styles.shareOptionName} numberOfLines={1}>
                        More
                      </Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showThreeDotsMenu}
        transparent={true}
        animationType="none"
        onRequestClose={() => {
          Animated.timing(threeDotsSlideAnim, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setShowThreeDotsMenu(false));
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            Animated.timing(threeDotsSlideAnim, {
              toValue: height,
              duration: 300,
              useNativeDriver: true,
            }).start(() => setShowThreeDotsMenu(false));
          }}
        >
          <Animated.View
            style={[styles.commandPanelModal, { transform: [{ translateY: threeDotsSlideAnim }] }]}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.handleBar} />

              <Text style={styles.commandPanelTitle}>OPTIONS</Text>

              <View style={styles.commandGrid}>
                <TouchableOpacity
                  style={styles.commandItem}
                  onPress={() => {
                    Animated.timing(threeDotsSlideAnim, {
                      toValue: height,
                      duration: 300,
                      useNativeDriver: true,
                    }).start(() => {
                      setShowThreeDotsMenu(false);
                      if (currentReelForMenu !== null) {
                        const reelIndex = reels.findIndex((r) => r.id === currentReelForMenu);
                        if (reelIndex >= 0) {
                          setReelViewerInitialIndex(reelIndex);
                          setReelViewerVisible(true);
                        }
                      }
                    });
                  }}
                >
                  <View style={styles.commandIconBox}>
                    <FullScreenIcon color="#EC9A15" size={22} />
                  </View>
                  <Text style={styles.commandItemText}>Full Screen</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.commandItem}
                  onPress={() => {
                    Animated.timing(threeDotsSlideAnim, {
                      toValue: height,
                      duration: 300,
                      useNativeDriver: true,
                    }).start(() => {
                      setShowThreeDotsMenu(false);
                      Alert.alert("Interested", "Marked as interested! +5 XP");
                    });
                  }}
                >
                  <View style={styles.commandIconBox}>
                    <HeartIcon color="#EC9A15" size={22} />
                  </View>
                  <Text style={styles.commandItemText}>Interested</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.commandItem}
                  onPress={() => {
                    Animated.timing(threeDotsSlideAnim, {
                      toValue: height,
                      duration: 300,
                      useNativeDriver: true,
                    }).start(() => {
                      setShowThreeDotsMenu(false);
                      Alert.alert("Not Interested", "We'll show you less content like this.");
                    });
                  }}
                >
                  <View style={styles.commandIconBox}>
                    <BlockIcon color="#fff" size={22} />
                  </View>
                  <Text style={styles.commandItemText}>Not Interested</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.commandItem, styles.commandItemDanger]}
                  onPress={() => {
                    Animated.timing(threeDotsSlideAnim, {
                      toValue: height,
                      duration: 300,
                      useNativeDriver: true,
                    }).start(() => {
                      setShowThreeDotsMenu(false);
                      Alert.alert("Report", "Report this content", [
                        {
                          text: "Cancel",
                          style: "cancel",
                        },
                        {
                          text: "Report",
                          style: "destructive",
                          onPress: () => Alert.alert("Reported", "Thank you for reporting."),
                        },
                      ]);
                    });
                  }}
                >
                  <View
                    style={[
                      styles.commandIconBox,
                      {
                        backgroundColor: "rgba(255, 59, 48, 0.15)",
                      },
                    ]}
                  >
                    <FlagIcon size={22} />
                  </View>
                  <Text style={[styles.commandItemText, styles.commandTextDanger]}>Report</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.commandCancelButton}
                onPress={() => {
                  Animated.timing(threeDotsSlideAnim, {
                    toValue: height,
                    duration: 300,
                    useNativeDriver: true,
                  }).start(() => setShowThreeDotsMenu(false));
                }}
              >
                <Text style={styles.commandCancelText}>Cancel</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
      <Modal
        visible={downloadModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !isDownloading && setDownloadModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { justifyContent: "center", alignItems: "center" }]}>
          <View style={styles.downloadCard}>
            <Text style={styles.downloadTitle}>Save to Gallery?</Text>
            <Text style={styles.downloadSubtitle}>This will download the reel to your device.</Text>

            {isDownloading ? (
              <View style={styles.downloadingState}>
                <ActivityIndicator size="large" color="#EC9A15" />
                <Text style={styles.processingText}>Applying Watermark...</Text>
              </View>
            ) : (
              <View style={styles.downloadButtonRow}>
                <TouchableOpacity
                  style={styles.downloadCancelBtn}
                  onPress={() => setDownloadModalVisible(false)}
                >
                  <Text style={styles.downloadCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.downloadConfirmBtn}
                  onPress={() =>
                    selectedReelForDownload && executeDownloadWithWatermark(selectedReelForDownload)
                  }
                >
                  <Text style={styles.downloadConfirmText}>Download</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
      
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        onOpenDrawer={() => setDrawerVisible(true)}
      />

      <DrawerMenu visible={drawerVisible} onClose={() => setDrawerVisible(false)} />

      {currentTipReelId !== null && (
        <SupportModal
          visible={tipModalVisible}
          onClose={() => {
            setTipModalVisible(false);
            setCurrentTipReelId(null);
            setCurrentTipCreatorId(undefined);
          }}
          reelId={currentTipReelId}
          creatorId={currentTipCreatorId}
          creatorName={
            reels.find((r) => r.id === currentTipReelId)?.creatorName || "Creator"
          }
          onSupportSent={() => {
            if (currentTipReelId !== null) {
              try {
                setReels((prevReels) =>
                  prevReels.map((reel) =>
                    reel.id === currentTipReelId
                      ? {
                        ...reel,
                        tips: (reel.tips || 0) + 1,
                      }
                      : reel
                  )
                );
              } catch (error) {
                console.error("Error updating tip count:", error);
              }
            }
          }}
        />
      )}

      <ReelViewer
        visible={reelViewerVisible}
        reels={reels.map((reel) => ({
          ...reel,
          type: "video" as const,
          source: reel.video,
        }))}
        initialIndex={reelViewerInitialIndex}
        onClose={() => setReelViewerVisible(false)}
        hasBottomNav={false}
        insets={insets}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  
  logEntryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: scale(16),
    padding: scale(14),
    marginBottom: scale(12),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  commentItemInner: {
    flexDirection: "row",
  },

  viewRepliesButton: {
    marginTop: scale(10),
    marginBottom: scale(4),
    alignSelf: "flex-start",
  },
  viewRepliesText: {
    color: "#EC9A15", 
    fontSize: getFontSize(12),
    fontWeight: "700",
  },
  levelText: {
    color: "#EC9A15",
    fontSize: getFontSize(11),
    fontWeight: "800",
    fontStyle: "italic",
  },
  levelTextSub: {
    color: "#888",
    fontSize: getFontSize(10),
    fontWeight: "700",
    fontStyle: "italic",
  },
  repliesContainer: {
    marginTop: scale(12),
    paddingLeft: scale(44),
  },
  logReplyCard: {
    flexDirection: "row",
    marginBottom: scale(12), 
  },
  replyAvatar: {
    width: scale(22), 
    height: scale(22),
    borderRadius: scale(11),
    marginRight: scale(10),
    marginTop: scale(2), 
  },
  replyContent: {
    flex: 1,
  },
  replyUsername: {
    color: "#fff",
    fontSize: getFontSize(13),
    fontWeight: "600",
  },
  replyText: {
    color: "#fff",
    fontSize: getFontSize(13),
    lineHeight: scale(18),
    marginTop: scale(2),
    marginBottom: scale(4),
  },
  replyActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  levelBadgeSub: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(6),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  levelBadgeTextSub: {
    color: "#aaa",
    fontSize: getFontSize(9),
    fontWeight: "800",
    textTransform: "uppercase",
  },

  viewRepliesLine: {
    width: scale(24),
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginRight: scale(8),
  },

  repliesSpine: {
    position: "absolute",
    left: scale(15), 
    top: scale(-12), 
    bottom: scale(20), 
    width: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.15)", 
  },

  replyThreadPeg: {
    position: "absolute",
    left: scale(-29), 
    top: scale(11), 
    width: scale(20), 
    height: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  cleanCommentRow: {
    paddingVertical: scale(14), 
    backgroundColor: "transparent",
  },
  cleanReplyRow: {
    flexDirection: "row",
    marginTop: scale(12),
  },
  replyThreadConnector: {
    position: "absolute",
    left: 0,
    top: scale(12), 
    width: scale(12),
    height: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.15)", 
  },

  gamifiedModal: {
    backgroundColor: "#2A1B0D", 
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    height: height * 0.7,
    borderTopWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.3)", 
    shadowColor: "#EC9A15",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    paddingTop: scale(10), 
  },
  handleBar: {
    width: scale(40),
    height: scale(4),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: scale(2),
    alignSelf: "center",
    marginBottom: scale(8), 
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    
  },

  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(4),
    gap: scale(6),
  },
  levelBadge: {
    backgroundColor: "rgba(236, 154, 21, 0.15)",
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(6),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(236, 154, 21, 0.4)",
  },
  levelBadgeText: {
    color: "#EC9A15",
    fontSize: getFontSize(9),
    fontWeight: "800",
    textTransform: "uppercase",
  },
  gamifiedInputWrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: scale(8),
    paddingBottom: Platform.OS === "ios" ? scale(32) : scale(20),
    backgroundColor: "#2A1B0D", 
  },
  gamifiedInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)", 
    borderRadius: scale(24),
    paddingHorizontal: scale(6),
    paddingVertical: scale(6),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    minHeight: scale(56),
  },
  gamifiedInput: {
    flex: 1,
    color: "#fff",
    fontSize: getFontSize(14),
    paddingHorizontal: scale(12),
    maxHeight: scale(100),
  },
  gamifiedPostButton: {
    backgroundColor: "rgba(236, 154, 21, 0.2)",
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.5)",
  },
  gamifiedPostButtonDisabled: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  gamifiedPostButtonText: {
    color: "#EC9A15",
    fontSize: getFontSize(12),
    fontWeight: "800",
    letterSpacing: 1,
  },
  gamifiedPostButtonTextDisabled: {
    color: "#666",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  backButtonContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? scale(50) : scale(40),
    left: spacing.lg,
    zIndex: 10,
  },
  integratedCommentRow: {
    paddingVertical: scale(14),
    borderBottomWidth: StyleSheet.hairlineWidth, 
    borderBottomColor: "rgba(236, 154, 21, 0.15)", 
    backgroundColor: "transparent", 
  },
  integratedReplyRow: {
    flexDirection: "row",
    marginTop: scale(12),
    paddingTop: scale(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255, 255, 255, 0.05)", 
    paddingLeft: scale(20), 
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    minWidth: scale(40),
    minHeight: scale(40),
    justifyContent: "center",
    alignItems: "center",
  },
  flatListContent: {
    paddingBottom: 0,
  },
  reelContainer: {
    width: width,
    height: height,
    position: "relative",
    backgroundColor: "#000",
    overflow: "hidden",
  },
  reelImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    alignSelf: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    paddingTop: 0,
  },
  videoTouchable: {
    width: "100%",
    height: "100%",
  },
  starAnimationContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: scale(-40),
    marginTop: scale(-40),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  playPauseIconContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: scale(-40),
    marginTop: scale(-40),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  playPauseIconWrapper: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: scale(50),
    width: scale(80),
    height: scale(80),
    alignItems: "center",
    justifyContent: "center",
  },

  gamifiedCommentCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)", 
    borderRadius: scale(16),
    padding: scale(12),
    marginBottom: scale(12),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },

  gamifiedReplyCard: {
    flexDirection: "row",
    marginTop: scale(12),
    paddingTop: scale(12),
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    paddingLeft: scale(8), 
  },

  threeDotsButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? scale(50) : scale(40),
    right: spacing.lg,
    width: scale(44),
    height: scale(44),
    minWidth: scale(44),
    minHeight: scale(44),
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: scale(22),
  },
  
  actionIconsContainer: {
    position: "absolute",
    right: scale(1),
    left: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  
  tipButton: {
    width: "100%", 
    backgroundColor: "#EC9A15",
    paddingVertical: scale(12),
    borderRadius: scale(25),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  tipButtonText: {
    color: "#fff",
    fontSize: getFontSize(15),
    fontWeight: "700",
  },
  bottomInfoContainer: {
    width: width * 0.75, 
    marginBottom: scale(12),
    paddingRight: scale(16), 
  },
  
  actionIconsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(16), 
  },
  actionIconButton: {
    alignItems: "center",
    justifyContent: "center",
    gap: scale(4), 
    width: scale(50),
    height: scale(50),
    minWidth: scale(50),
    minHeight: scale(50),
  },
  
  horizontalLine: {
    position: "absolute",
    alignSelf: "center",
    width: scale(180),
    height: scale(0.6),
    backgroundColor: "#fff",
    opacity: 0.6,
    zIndex: 10,
  },
  questTracker: {
    position: "absolute",
    top: Platform.OS === "ios" ? scale(100) : scale(90), 
    left: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.4)",
    zIndex: 10,
  },
  questIcon: {
    fontSize: getFontSize(18),
    marginRight: scale(6),
  },
  questTitle: {
    color: "#EC9A15",
    fontSize: getFontSize(10),
    fontWeight: "800",
    textTransform: "uppercase",
  },
  questProgress: {
    color: "#fff",
    fontSize: getFontSize(11),
    fontWeight: "500",
  },
  floatingXP: {
    position: "absolute",
    top: -20,
    left: 10,
    zIndex: 20,
  },
  floatingXPText: {
    color: "#FFD700", 
    fontSize: getFontSize(16),
    fontWeight: "900",
    fontStyle: "italic",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  actionIconCount: {
    color: "#fff",
    fontSize: getFontSize(11), 
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: scale(1) },
    textShadowRadius: scale(3),
    marginTop: scale(2),
    marginBottom: scale(10), 
    textAlign: "center",
  },
  
  musicBarContainer: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: scale(20),
    zIndex: 10,
    maxWidth: scale(200),
    minWidth: scale(120),
  },
  actionButtons: {
    position: "absolute",
    right: scale(12),
    bottom: Platform.OS === "ios" ? scale(100) : scale(80),
    justifyContent: "flex-end",
    alignItems: "center",
    gap: scale(28),
  },
  actionButton: {
    alignItems: "center",
    gap: scale(6),
    minWidth: scale(50),
  },
  actionCount: {
    color: "#fff",
    fontSize: getFontSize(13),
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: scale(1) },
    textShadowRadius: scale(2),
  },
  threeDotsMenuModal: {
    backgroundColor: "#3C2610",
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    paddingBottom: Platform.OS === "ios" ? scale(32) : scale(20),
    maxHeight: height * 0.5,
  },
  menuItem: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: scale(1),
    borderBottomColor: "#2a2a2a",
    borderWidth: scale(1),
    borderColor: "transparent",
    minHeight: scale(50),
  },
  menuItemText: {
    color: "#fff",
    fontSize: getFontSize(16),
    textAlign: "center",
  },
  menuItemTextDanger: {
    color: "#FF3B30",
  },

  captionContainer: {
    marginTop: scale(6),
    marginBottom: scale(4),
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    gap: scale(10),
    flexWrap: "nowrap",
  },
  followButtonBox: {
    backgroundColor: "#EC9A15",
    paddingHorizontal: spacing.lg,
    paddingVertical: scale(6),
    borderRadius: scale(6),
    marginLeft: spacing.sm,
    minHeight: scale(28),
  },
  followButtonBoxText: {
    color: "#fff",
    fontSize: getFontSize(13),
    fontWeight: "600",
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    borderWidth: scale(1),
    borderColor: "#fff",
  },
  commandPanelModal: {
    backgroundColor: "#2A1B0D", 
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === "ios" ? scale(40) : scale(24),
    borderTopWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.3)", 
    shadowColor: "#EC9A15",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  commandPanelTitle: {
    color: "#9CA3AF",
    fontSize: getFontSize(12),
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: scale(16),
    marginLeft: scale(4),
  },
  commandGrid: {
    gap: scale(10),
  },
  commandItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)", 
    borderRadius: scale(16),
    padding: scale(12),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  commandItemDanger: {
    backgroundColor: "rgba(255, 59, 48, 0.05)",
    borderColor: "rgba(255, 59, 48, 0.2)",
  },
  commandIconBox: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    backgroundColor: "rgba(236, 154, 21, 0.15)", 
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(14),
  },
  commandItemText: {
    color: "#fff",
    fontSize: getFontSize(16),
    fontWeight: "600",
  },
  commandTextDanger: {
    color: "#FF3B30",
  },
  commandCancelButton: {
    marginTop: scale(20),
    paddingVertical: scale(16),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: scale(25),
  },
  downloadCard: {
    width: wp(80),
    backgroundColor: "#1E1111",
    borderRadius: scale(16),
    padding: scale(20),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.3)",
  },
  downloadTitle: {
    color: "#fff",
    fontSize: getFontSize(18),
    fontWeight: "bold",
    marginBottom: scale(8),
  },
  downloadSubtitle: {
    color: "#CAD7D8",
    fontSize: getFontSize(13),
    textAlign: "center",
    marginBottom: scale(20),
  },
  downloadingState: {
    alignItems: "center",
    marginVertical: scale(10),
  },
  processingText: {
    color: "#EC9A15",
    marginTop: scale(12),
    fontSize: getFontSize(14),
    fontWeight: "600",
  },
  downloadButtonRow: {
    flexDirection: "row",
    gap: scale(12),
    width: "100%",
  },
  downloadCancelBtn: {
    flex: 1,
    paddingVertical: scale(12),
    borderRadius: scale(8),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  downloadConfirmBtn: {
    flex: 1,
    paddingVertical: scale(12),
    borderRadius: scale(8),
    backgroundColor: "#EC9A15",
    alignItems: "center",
  },
  downloadCancelText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: getFontSize(14),
  },
  downloadConfirmText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: getFontSize(14),
  },
  commandCancelText: {
    color: "#fff",
    fontSize: getFontSize(16),
    fontWeight: "700",
  },
  followButton: {
    position: "absolute",
    bottom: scale(-2),
    right: scale(-2),
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    backgroundColor: "#EC9A15",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: scale(1),
    borderColor: "#000",
  },
  followButtonText: {
    color: "#fff",
    fontSize: getFontSize(14),
    fontWeight: "700",
  },
  username: {
    color: "#ffffff", 
    fontSize: getFontSize(15),
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.8)", 
    textShadowOffset: { width: 0, height: scale(1) },
    textShadowRadius: scale(2),
  },
  caption: {
    color: "#ffffff", 
    fontSize: getFontSize(14),
    marginTop: 0,
    marginBottom: 0,
    lineHeight: scale(20),
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: scale(1) },
    textShadowRadius: scale(3),
  },
  showMoreText: {
    color: "#EC9A15",
    fontSize: getFontSize(14),
    fontWeight: "600",
    marginTop: scale(4),
    marginBottom: scale(10),
  },
  musicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginTop: scale(4),
    marginBottom: spacing.sm,
  },
  musicName: {
    color: "#ffffff", 
    fontSize: getFontSize(13),
    flex: 1,
    fontWeight: "500",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: scale(1) },
    textShadowRadius: scale(3),
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  commentModal: {
    backgroundColor: "#3C2610",
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    height: height * 0.7,
    paddingBottom: Platform.OS === "ios" ? scale(32) : scale(20),
  },
  shareModal: {
    backgroundColor: "#3C2610",
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    maxHeight: height * 0.6,
    paddingBottom: Platform.OS === "ios" ? scale(32) : scale(20),
  },

  commentHeaderTitle: {
    color: "#fff",
    fontSize: getFontSize(18),
    fontWeight: "700",
  },
  closeButton: {
    color: "#fff",
    fontSize: getFontSize(24),
    fontWeight: "300",
    minWidth: scale(44),
    minHeight: scale(44),
    textAlign: "center",
    textAlignVertical: "center",
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    maxHeight: height * 0.5,
  },
  commentItem: {
    flexDirection: "row",
    paddingVertical: scale(12),
    borderBottomWidth: scale(1),
    borderBottomColor: "#2a2a2a",
    minHeight: scale(60),
  },
  commentAvatar: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    marginRight: scale(12),
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    color: "#fff",
    fontSize: getFontSize(14),
    fontWeight: "600",
    marginBottom: scale(4),
  },
  commentText: {
    color: "#fff",
    fontSize: getFontSize(14),
    marginBottom: scale(6),
    lineHeight: scale(20),
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  commentTime: {
    color: "#999",
    fontSize: getFontSize(12),
  },
  commentReply: {
    color: "#999",
    fontSize: getFontSize(12),
    fontWeight: "600",
  },
  commentLikeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    minWidth: scale(44),
    minHeight: scale(44),
    justifyContent: "center",
  },
  commentLikeCount: {
    color: "#999",
    fontSize: getFontSize(12),
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: scale(12),
    borderTopWidth: scale(1),
    borderTopColor: "#333",
    gap: scale(12),
    minHeight: scale(60),
  },
  commentInputAvatar: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderRadius: scale(20),
    paddingHorizontal: spacing.lg,
    paddingVertical: scale(10),
    color: "#fff",
    fontSize: getFontSize(14),
    maxHeight: scale(100),
    minHeight: scale(40),
  },
  sendCommentButton: {
    marginLeft: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    backgroundColor: "#EC9A15",
    borderRadius: scale(16),
    justifyContent: "center",
    alignItems: "center",
  },
  sendCommentText: {
    color: "#000",
    fontSize: getFontSize(12),
    fontWeight: "600",
  },
  postButton: {
    paddingHorizontal: spacing.lg,
    minWidth: scale(44),
    minHeight: scale(44),
    justifyContent: "center",
    alignItems: "center",
  },
  flexButtonWrapper: {
    flex: 1, 
    alignItems: "center",
    justifyContent: "center",
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: "#EC9A15",
    fontSize: getFontSize(14),
    fontWeight: "600",
  },
  postButtonTextDisabled: {
    color: "#666",
  },
  shareHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: scale(1),
    borderBottomColor: "#333",
    minHeight: scale(50),
  },
  shareHeaderTitle: {
    color: "#fff",
    fontSize: getFontSize(18),
    fontWeight: "700",
  },
  friendsSection: {
    paddingVertical: spacing.lg,
    borderBottomWidth: scale(1),
    borderBottomColor: "#2a2a2a",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: getFontSize(14),
    fontWeight: "600",
    paddingHorizontal: spacing.lg,
    marginBottom: scale(12),
  },
  friendsList: {
    paddingHorizontal: spacing.lg,
  },
  friendItem: {
    alignItems: "center",
    marginRight: spacing.lg,
    width: scale(70),
  },
  friendAvatar: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    marginBottom: spacing.sm,
  },
  friendName: {
    color: "#fff",
    fontSize: getFontSize(12),
    textAlign: "center",
  },
  shareOptionsSection: {
    paddingVertical: spacing.lg,
  },
  shareOptionsList: {
    paddingHorizontal: spacing.lg,
  },
  shareOption: {
    alignItems: "center",
    marginRight: scale(20),
    width: scale(70),
  },
  shareOptionIconCircle: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  shareOptionIconText: {
    fontSize: getFontSize(28),
    color: "#fff",
  },
  shareOptionName: {
    color: "#fff",
    fontSize: getFontSize(12),
    textAlign: "center",
  },
  shareIconImage: {
    width: scale(24),
    height: scale(24),
  },
  replyItem: {
    flexDirection: "row",
    paddingVertical: scale(8),
    paddingLeft: scale(44),
    marginTop: scale(8),
    borderTopWidth: scale(1),
    borderTopColor: "#2a2a2a",
  },

  rightActionContainer: {
    position: "absolute",
    right: scale(6),
    bottom: Platform.OS === "ios" ? scale(150) : scale(140),
    alignItems: "center",
    gap: scale(20),
    zIndex: 10,
  },
  rightActionButton: {
    alignItems: "center",
    justifyContent: "center",
    gap: scale(4),
  },
  
  bottomButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(12), 
    width: "100%", 
  },
  
  voteButtonActive: {
    backgroundColor: "#EC9A15",
  },
  voteButtonInactive: {
    backgroundColor: "rgba(0, 0, 0, 0.5)", 
    borderWidth: 1,
    borderColor: "#EC9A15",
  },
  
  bottomContent: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg, 
    justifyContent: "flex-end",
    zIndex: 10,
    marginBottom: scale(4),
  },
});
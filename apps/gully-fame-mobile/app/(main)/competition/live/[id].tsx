import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  Modal,
  Animated,
  Platform,
  Linking,
  LayoutAnimation,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackIcon, ShareIcon, ClockIcon, MedalIcon } from "@/icons";
import TopPerformer from "@/components/home/TopDancers/TopPerformer";
import TopTenLeaderboard from "@/components/TopTenLeaderboard/TopTenLeaderboard";
import { liveCompetitionStyles as styles } from "@/styles/liveCompetitionStyles";
import { useUserRole } from "@/contexts/UserRoleContext";
import { getCompetitionById, getCompetitionLeaderboard } from "@/api/services/competitionService";
import { BASE_URL } from "@/api/axios";

const { height } = Dimensions.get("window");

const formatDateShort = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatCurrency = (amount: number): string => {
  if (!amount) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
};

const formatPrizeBreakdown = (
  prizeAmount: number,
  winnerSlots: number = 1,
): Array<{ position: string; amount: string }> => {
  const slots = winnerSlots || 1;
  const perSlot = Math.floor(prizeAmount / slots);
  const breakdown = [];

  for (let i = 0; i < slots && i < 3; i++) {
    const position = i === 0 ? "1st" : i === 1 ? "2nd" : "3rd";
    const amount = i === 0 ? perSlot + (prizeAmount % slots) : perSlot;
    breakdown.push({ position, amount: formatCurrency(amount) });
  }

  return breakdown;
};

const getTimeRemaining = (endDate: string): string => {
  if (!endDate) return "";
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return "Ended";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} hr${hours > 1 ? "s" : ""}`;

  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes} min${minutes > 1 ? "s" : ""}`;
};

export default function LiveCompetitionScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { role, isLoading } = useUserRole();
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const liveDotOpacity = useRef(new Animated.Value(1)).current;
  const competitionIdFromParams = String(params.id);
  const [competitionData, setCompetitionData] = useState<any>(null);
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(liveDotOpacity, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(liveDotOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [liveDotOpacity]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!competitionIdFromParams) return;
        
        const [compRes, leadRes] = await Promise.all([
          getCompetitionById(competitionIdFromParams),
          getCompetitionLeaderboard(competitionIdFromParams, { page: 1, limit: 10 })
        ]);

        let compData = compRes.success ? compRes.data : null;
        let leadData = [];

        if (leadRes.success && leadRes.data?.leaderboard) {
          leadData = leadRes.data.leaderboard.map((entry: any) => ({
            rank: entry.rank,
            name: `${entry.user?.firstName || ''} ${entry.user?.lastName || ''}`.trim() || entry.user?.username || 'Unknown User',
            id: entry.user?._id || `user_${entry.rank}`,
            userId: entry.user?._id,
            votes: entry.reel?.stats?.votes || entry.votes || 0,
            defaultProfilePicture: entry.user?.profileImage ? { uri: `${BASE_URL}${entry.user.profileImage}` } : require("@assets/images/user1.png"),
            isCurrentUser: false,
            role: "participants",
          }));
        }

        if (compData) {
          setCompetitionData({ ...compData, leaderboard: leadData });
        }
      } catch (err) {
        console.error("Failed to fetch live competition details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [competitionIdFromParams]);
  
  const [leaderboardModalVisible, setLeaderboardModalVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const shareSlideAnim = useRef(new Animated.Value(height)).current;

  const toggleRules = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsRulesExpanded(!isRulesExpanded);
  };

  const handleShare = async (platform: string) => {
    const competitionLink = `https://gullyfame.com/competition/${competitionIdFromParams}`;
    const competitionText = `Check out "${competitionData?.title || 'this competition'}" on Gully Fame! ${competitionLink}`;

    try {
      switch (platform) {
        case "copy":
          if (Platform.OS === "web") {
            await navigator.clipboard.writeText(competitionLink);
            Alert.alert("Copied!", "Link copied to clipboard");
          } else {
            Alert.alert("Copy Link", competitionLink, [{ text: "OK" }]);
          }
          break;
        case "whatsapp":
        case "whatsapp-status":
          const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(competitionText)}`;
          const canOpenWa = await Linking.canOpenURL(whatsappUrl);
          if (canOpenWa) await Linking.openURL(whatsappUrl);
          else Alert.alert("Not installed", "Please install WhatsApp to share");
          break;
        case "twitter":
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(competitionText)}`;
          await Linking.openURL(twitterUrl);
          break;
      }
      
      Animated.timing(shareSlideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShareModalVisible(false));
    } catch (error) {
      Alert.alert("Error", "Unable to share. Please try again.");
    }
  };

  if (loading || !competitionData) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#EC9A15" />
      </View>
    );
  }

  const top10LeaderboardData = competitionData.leaderboard?.slice(0, 10) || [];
  const restOfLeaderboardData = top10LeaderboardData.filter((perf: any) => perf.rank > 3);
  const pushToVoting = () => router.push("/(main)/reel");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3C2610" />
      {!isLoading && (
        <View style={[styles.stickyBottomCTA, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {role === "fan" ? (
            <TouchableOpacity style={styles.fullWidthButton} onPress={pushToVoting} activeOpacity={0.8}>
              <LinearGradient colors={["#EC9A15", "#FFD700"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientFill}>
                <Text style={styles.ctaText}>⭐ Watch & Vote Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.buttonRow}>
              {competitionData.is_current_user_entered ? (
                <>
                  <View style={[styles.halfButton, styles.disabledButton]}>
                    <Text style={styles.disabledText}>🔒 Voting Locked</Text>
                  </View>
                  <TouchableOpacity style={styles.halfButton} activeOpacity={0.8}>
                    <LinearGradient colors={["#22C55E", "#16A34A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientFill}>
                      <Text style={styles.ctaText}>👁️ View Entry</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={styles.halfButton} onPress={pushToVoting} activeOpacity={0.8}>
                    <LinearGradient colors={["#EC9A15", "#FFD700"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientFill}>
                      <Text style={styles.ctaText}>⭐ Vote</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.halfButton} activeOpacity={0.8}>
                    <LinearGradient colors={["#FF0055", "#FF8C00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientFill}>
                      <Text style={styles.ctaText}>⚔️ Enter</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(main)/home")} style={styles.headerButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{competitionData.title}</Text>
        <TouchableOpacity
          onPress={() => {
            shareSlideAnim.setValue(height);
            setShareModalVisible(true);
            Animated.spring(shareSlideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }).start();
          }}
          style={styles.headerButton}
        >
          <ShareIcon color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <TouchableOpacity style={styles.bannerContainer} activeOpacity={0.9}>
          <Image source={competitionData.image ? { uri: `${BASE_URL}${competitionData.image}` } : require("@assets/images/trending1.png")} style={styles.bannerImage} />
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={styles.bannerGradient} />
          <View style={styles.liveBadge}>
            <Animated.View style={[styles.liveDot, { opacity: liveDotOpacity }]} />
            <Text style={styles.liveBadgeText}>Live</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.categoryText}>{competitionData.category || "Competition"}</Text>
            {competitionData.sponsorId && competitionData.sponsorId.name && (
              <Text style={styles.presenterText}>Presented by {competitionData.sponsorId.name}</Text>
            )}
          </View>
          <View style={styles.votingRow}>
            <ClockIcon />
            <Text style={styles.votingText}>Voting closes in {getTimeRemaining(competitionData.endDate)}</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: "85%" }]} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rewards & Entry Details</Text>
          <View style={styles.card}>
            <View style={styles.heroPrizeContainer}>
              <Text style={styles.heroPrizeLabel}>TOTAL PRIZE POOL</Text>
              <Text style={styles.heroPrizeAmount}>{formatCurrency(competitionData.prizePool || 0)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.podiumContainer}>
              {formatPrizeBreakdown(competitionData.prizePool || 0, 3).map((prize, index) => {
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <View key={index} style={styles.podiumPill}>
                    <Text style={styles.podiumMedal}>{medals[index]}</Text>
                    <View style={styles.podiumTextContainer}>
                      <Text style={styles.podiumPosition}>{prize.position} Place</Text>
                      <Text style={styles.podiumAmount}>{prize.amount}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={styles.divider} />
            <View style={styles.specsRow}>
              <View style={styles.specBox}>
                <View style={styles.specHeader}>
                  <Text style={styles.specIcon}>🎟️</Text>
                  <Text style={styles.specLabel}>Entry</Text>
                </View>
                {competitionData.entryFee ? (
                  <Text style={styles.specValue}>{formatCurrency(competitionData.entryFee)}</Text>
                ) : (
                  <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>FREE</Text></View>
                )}
              </View>
              <View style={styles.specVerticalDivider} />
              <View style={styles.specBox}>
                <View style={styles.specHeader}>
                  <Text style={styles.specIcon}>📅</Text>
                  <Text style={styles.specLabel}>Timeline</Text>
                </View>
                <Text style={styles.specValue}>{formatDateShort(competitionData.startDate)} - {formatDateShort(competitionData.endDate)}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRowCompact}>
              <View style={styles.socialProofContainer}>
                <View style={styles.avatarPileContainer}>
                  <View style={styles.avatars}>
                    {top10LeaderboardData.slice(0, 4).map((participant: any, index: number) => (
                      <Image key={index} source={participant.defaultProfilePicture} style={[styles.pileAvatar, index > 0 && { marginLeft: -12 }]} />
                    ))}
                  </View>
                  <Text style={styles.battlingText}>
                    <Text style={styles.battlingCount}>+{Math.max((competitionData.participants?.length || 0) - 4, 0)}</Text> others battling!
                  </Text>
                </View>
                <View style={styles.starFlexBox}>
                  <Text style={styles.starFlexIcon}>⭐</Text>
                  <View>
                    <Text style={styles.starFlexValue}>{formatNumber(competitionData.views || 0)}</Text>
                    <Text style={styles.starFlexLabel}>Stars Cast</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.missionBriefingCard} activeOpacity={0.8} onPress={toggleRules}>
            <View style={styles.missionHeader}>
              <View style={styles.missionTitleRow}>
                <Text style={styles.missionIcon}>📜</Text>
                <Text style={styles.missionTitle}>Mission Briefing & Rules</Text>
              </View>
              <Text style={styles.chevron}>{isRulesExpanded ? "▲" : "▼"}</Text>
            </View>
            {isRulesExpanded && (
              <View style={styles.missionContent}>
                <Text style={styles.missionSectionTitle}>About the Battle</Text>
                <Text style={styles.missionText}>{competitionData.description || "No description available."}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.leaderboardTitleContainer}>
            <Text style={styles.leaderboardMainTitle}>🏆 LIVE LEADERBOARD</Text>
            <Text style={styles.leaderboardSubTitle}>Top 10 Participants</Text>
          </View>
          
          {top10LeaderboardData.length > 0 ? (
            <>
              <View style={styles.top10Section}>
                <View style={styles.topDancersContainer}>
                  {top10LeaderboardData.filter((entry: any) => entry.rank === 2).map((entry: any) => (
                    <TopPerformer performer={entry} key={entry.id} />
                  ))}
                  {top10LeaderboardData.filter((d: any) => d.rank === 1).map((dancer: any) => (
                    <TopPerformer performer={dancer} key={dancer.id} />
                  ))}
                  {top10LeaderboardData.filter((d: any) => d.rank === 3).map((dancer: any) => (
                    <TopPerformer performer={dancer} key={dancer.id} />
                  ))}
                </View>
              </View>
              <TopTenLeaderboard performers={restOfLeaderboardData} />
              <TouchableOpacity onPress={() => router.push(`/(main)/leaderboard/${competitionIdFromParams}`)} style={styles.viewAllButton} activeOpacity={0.8}>
                <Text style={styles.viewAllText}>View Full Leaderboard</Text>
              </TouchableOpacity>
            </>
          ) : (
             <View style={{ padding: 20, alignItems: "center" }}>
               <Text style={{ color: "#999" }}>Leaderboard is updating...</Text>
             </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>



      {}
      <Modal
        visible={leaderboardModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLeaderboardModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>LeaderBoard</Text>
              <TouchableOpacity
                onPress={() => setLeaderboardModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              {competitionData.leaderboard.map((participant: any) => (
                <TouchableOpacity
                  key={participant.rank}
                  style={styles.leaderboardItem}
                  onPress={() => {
                    
                    const nameParts = participant.username?.split(" ") || [];
                    const firstName =
                      nameParts[0] || participant.username || "User";
                    const lastName = nameParts.slice(1).join(" ") || "";

                    router.push({
                      pathname: "/(main)/profile/[id]",
                      params: {
                        id: participant.userId || `user${participant.rank}`,
                        userId: participant.userId || `user${participant.rank}`,
                        firstName: firstName,
                        lastName: lastName,
                        role: "participants",
                        bio: "",
                      },
                    } as any);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.leaderboardLeft}>
                    <Text style={styles.rankText}>{participant.rank}</Text>
                    <Image
                      source={participant.image}
                      style={styles.participantImage}
                    />
                    <Text style={styles.participantUsername}>
                      {participant.username}
                    </Text>
                  </View>
                  {participant.rank <= 3 && (
                    <View style={styles.medalContainer}>
                      <MedalIcon rank={participant.rank} size={35} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {}
      <Modal
        visible={shareModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => {
          Animated.timing(shareSlideAnim, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setShareModalVisible(false);
          });
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            Animated.timing(shareSlideAnim, {
              toValue: height,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              setShareModalVisible(false);
            });
          }}
        >
          <Animated.View
            style={[
              styles.shareModal,
              {
                transform: [{ translateY: shareSlideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.handleBar} />
              <View style={styles.shareHeader}>
                <Text style={styles.shareHeaderTitle}>Share Competition</Text>
                <TouchableOpacity
                  onPress={() => {
                    Animated.timing(shareSlideAnim, {
                      toValue: height,
                      duration: 300,
                      useNativeDriver: true,
                    }).start(() => {
                      setShareModalVisible(false);
                    });
                  }}
                >
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.shareOptionsList}
                contentContainerStyle={styles.shareOptionsContent}
              >
                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={() => handleShare("copy")}
                >
                  <View
                    style={[
                      styles.shareOptionIconCircle,
                      { backgroundColor: "#fff" },
                    ]}
                  >
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
                      { backgroundColor: "#25D36620" },
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
                  onPress={() => handleShare("whatsapp-status")}
                >
                  <View
                    style={[
                      styles.shareOptionIconCircle,
                      { backgroundColor: "#25D36620" },
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
                      { backgroundColor: "#E4405F20" },
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
                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={() => handleShare("facebook")}
                >
                  <View
                    style={[
                      styles.shareOptionIconCircle,
                      { backgroundColor: "#1877F2" },
                    ]}
                  >
                    <FacebookIcon size={24} />
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
                      { backgroundColor: "#1DA1F220" },
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
                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={() => handleShare("snapchat")}
                >
                  <View
                    style={[
                      styles.shareOptionIconCircle,
                      { backgroundColor: "#FFEC0620" },
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
              </ScrollView>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

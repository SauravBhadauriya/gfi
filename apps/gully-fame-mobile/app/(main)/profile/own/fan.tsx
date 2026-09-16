import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState, useEffect } from "react";
import { LeaderboardStyles as styles } from "@/components/TopTenLeaderboard/styles";
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  Linking,
  ActivityIndicator,
} from "react-native";
import BottomNav from "@components/layout/BottomNav";

import { fanSelfProfileScreenStyles as profileStyles } from "@/styles/fanSelfProfileScreenStyles";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { authService } from "@api/services/authService";
import { useOwnProfile } from "@/components/profile/shared/profileHooks";
import {
  LevelUpSection,
  StatsSection,
  UserInfoSection,
} from "@/components/profile/shared/ProfileComponents";
import { useFollowStats } from "@/hooks/useFollowStats";
import { useUserReels } from "@/hooks/useUserReels";
import {
  UserIconSVG,
  HomeIconSVG,
  ReelIconSVG,
  SearchIconSVG,
  BackIcon,
  CrossIcon,
} from "@/icons";
import UpgradeFanToParticipantModal from "@/components/modals/UpgradeFanToParticipantModal/UpgradeFanToParticipantModal";
import ProfileBurgerMenuModal from "@/components/modals/ProfileBurgerMenuModal/ProfileBurgerMenuModal";
import { feedService } from "@/api/services/feedService";
import { apiClient } from "@/api";
import { BASE_URL } from "@/api/axios";

const InstagramIconSVG = ({ width = 26, height = 26, color = "#fff" }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2.163c3.204 0 3.584.012 4.85.067 3.249.148 4.771 1.691 4.919 4.919.055 1.266.067 1.646.067 4.851s-.012 3.584-.067 4.85c-.148 3.228-1.67 4.771-4.919 4.919-1.266.055-1.646.067-4.85.067s-3.584-.012-4.85-.067c-3.249-.148-4.771-1.691-4.919-4.919-.055-1.266-.067-1.646-.067-4.851s.012-3.584.067-4.85c.148-3.228 1.67-4.771 4.919-4.919 1.266-.055 1.646-.067 4.85-.067zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 1.76-6.982 6.982-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.2 5.222 2.624 6.782 6.982 6.982 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c4.358-.2 6.78-1.76 6.982-6.982.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.2-5.222-2.624-6.782-6.982-6.982-1.28-.058-1.688-.072-4.947-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </Svg>
);

const formatHandle = (input: string) => {
  if (!input) return "";
  let clean = input.replace(
    /(https?:\/\/)?(www\.)?(instagram\.com|x\.com|twitter\.com)\/?/g,
    "",
  );
  clean = clean.replace(/^@/, "").replace(/\/$/, "");
  return `@${clean}`;
};

const XIconSVG = ({ width = 26, height = 26, color = "#fff" }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill={color}>
    <Path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 4.076H5.059z" />
  </Svg>
);

const { width, height } = Dimensions.get("window");

const fanTabs = [
  { name: "Home", icon: HomeIconSVG, label: "" },
  { name: "Reel", icon: ReelIconSVG, label: "GullyReel" },
  { name: "Upload", icon: null, label: "UPLOAD" },
  { name: "Search", icon: SearchIconSVG, label: "Search" },
  { name: "MyFame", icon: UserIconSVG, label: "" },
];

export default function OwnFanProfile() {
  const { profileData, setProfileData, isLoading, reloadProfile } = useOwnProfile();
  const [activeTab, setActiveTab] = useState("MyFame");
  const [selectedTab, setSelectedTab] = useState("Saved");
  const [tempInsta, setTempInsta] = useState(profileData.instagramLink || "");
  const [tempX, setTempX] = useState(profileData.xLink || "");
  const [menuVisible, setMenuVisible] = useState(false);
  const [editBioVisible, setEditBioVisible] = useState(false);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [tempBio, setTempBio] = useState("");
  const [tempThreeWords, setTempThreeWords] = useState(["", "", ""]);
  const [levelUpModalVisible, setLevelUpModalVisible] = useState(false);

  // Live data states for the grid
  const [liveLikedReels, setLiveLikedReels] = useState<any[]>([]);
  const [liveSavedReels, setLiveSavedReels] = useState<any[]>([]);
  const [loadingGrids, setLoadingGrids] = useState(true);

  const { stats: followStats } = useFollowStats(profileData.id || "");
  const { reels: userReels, loading: reelsLoading, refetch: refetchReels } = useUserReels(profileData.id || "");

  useEffect(() => {
    const fetchGridData = async () => {
      setLoadingGrids(true);
      try {
        // Fetch saved reels
        const savedRes = await feedService.getSavedReels(1, 20);
        if (savedRes.success && savedRes.data?.reels) {
          setLiveSavedReels(savedRes.data.reels);
        }

        // Fetch liked reels (Assuming backend supports ?liked=true on reels endpoint)
        try {
          const likedRes = await apiClient.get('/reels', { params: { liked: true, limit: 20 } });
          if (likedRes.data && likedRes.data.code === 1 && likedRes.data.data?.reels) {
            setLiveLikedReels(likedRes.data.data.reels);
          }
        } catch (e) {
          console.warn("Could not fetch liked reels", e);
        }

      } catch (error) {
        console.error("Error fetching grid data:", error);
      } finally {
        setLoadingGrids(false);
      }
    };

    fetchGridData();
  }, []);

  const handleBackPress = () => {
    router.replace("/(main)" as any);
  };

  const handleFollowersPress = () => {
    const currentUserId = profileData.id || profileData._id || "";
    if (!currentUserId) {
      Alert.alert("Error", "User ID not available");
      return;
    }
    router.push({
      pathname: "/(main)/followers",
      params: { userId: currentUserId, tab: "followers" },
    } as any);
  };

  const handleFollowingPress = () => {
    const currentUserId = profileData.id || profileData._id || "";
    if (!currentUserId) {
      Alert.alert("Error", "User ID not available");
      return;
    }
    router.push({
      pathname: "/(main)/followers",
      params: { userId: currentUserId, tab: "following" },
    } as any);
  };

  const handleEditBio = () => {
    setTempBio(profileData.bio || "");
    const threeWordsStr = profileData.threeWords || "";
    if (threeWordsStr) {
      const words = threeWordsStr.split("|").map((w) => w.trim()).filter((w) => w);
      setTempThreeWords([words[0] || "", words[1] || "", words[2] || ""]);
    } else {
      setTempThreeWords(["🎵 MusicLover", "💃 DanceFreak", "✨ VibeCreator"]);
    }
    setEditBioVisible(true);
  };

  const handleSaveBio = async () => {
    const threeWordsFormatted = tempThreeWords.filter((w) => w.trim()).join(" | ");

    setProfileData((prev) => ({
      ...prev,
      bio: tempBio,
      threeWords: threeWordsFormatted || undefined,
      instagramLink: tempInsta,
      xLink: tempX,
    }));

    try {
      await AsyncStorage.multiSet([
        ["userBio", tempBio],
        ["userThreeWords", threeWordsFormatted],
        ["userInstagram", tempInsta],
        ["userXLink", tempX],
      ]);

      const updateData: any = {
        bio: tempBio,
        instagramLink: tempInsta,
        xLink: tempX,
      };

      if (threeWordsFormatted) {
        updateData.threeWords = threeWordsFormatted;
      }

      await authService.updateProfile(updateData);
    } catch (error) {
      console.error("Error saving profile data:", error);
    }

    setEditBioVisible(false);
  };

  const handleCancelEdit = () => {
    setTempBio(profileData.bio || "");
    setTempThreeWords(["", "", ""]);
    setEditBioVisible(false);
  };

  if (isLoading && !profileData.firstName && !profileData.lastName && !profileData.profileImage) {
    return (
      <View style={[profileStyles.container, { justifyContent: "center", alignItems: "center" }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#EC9A15" />
      </View>
    );
  }

  const handleUpgradeClick = () => {
    setUpgradeModalVisible(true);
  };

  const currentGridData = selectedTab === "Liked Reels" ? liveLikedReels : liveSavedReels;

  return (
    <View style={profileStyles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={profileStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={profileStyles.header}>
          <TouchableOpacity onPress={handleBackPress} style={profileStyles.backButton}>
            <BackIcon color="white" size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={profileStyles.menuButton}>
            <View style={profileStyles.hamburgerIcon}>
              <View style={profileStyles.hamburgerLine} />
              <View style={profileStyles.hamburgerLine} />
              <View style={profileStyles.hamburgerLine} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={profileStyles.gamifiedAvatarContainer}>
          <LinearGradient
            colors={["#E3E4E5", "#9CA3AF", "#4B5563"]}
            style={profileStyles.avatarGradientRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Image
              source={
                profileData.profileImage
                  ? { uri: profileData.profileImage.startsWith('http') ? profileData.profileImage : `${BASE_URL}${profileData.profileImage}` }
                  : require("@assets/images/user1.png")
              }
              style={profileStyles.gamifiedProfileImage}
            />
          </LinearGradient>

          <View style={[profileStyles.rankBadgeContainer, { backgroundColor: "#4B5563", borderColor: "#E3E4E5" }]}>
            <Text style={[profileStyles.rankBadgeText, { color: "#fff" }]}>FAN</Text>
          </View>
        </View>

        <UserInfoSection
          profileData={profileData}
          onEditBio={handleEditBio}
          showEditButton={true}
          threeWords={profileData.threeWords}
          userNameMarginTop={height * 0.001}
          handleUpgradeClick={handleUpgradeClick}
        />

        <View style={profileStyles.socialLinksContainer}>
          {profileData.instagramLink && (
            <TouchableOpacity
              style={profileStyles.socialIconButton}
              onPress={() => {
                const raw = profileData.instagramLink;
                const cleanHandle = formatHandle(raw).replace("@", "");
                Linking.openURL(`https://instagram.com/${cleanHandle}`);
              }}
            >
              <InstagramIconSVG color="#fff" />
            </TouchableOpacity>
          )}

          {profileData.xLink && (
            <TouchableOpacity
              style={profileStyles.socialIconButton}
              onPress={() => {
                const cleanHandle = formatHandle(profileData.xLink).replace("@", "");
                Linking.openURL(`https://x.com/${cleanHandle}`);
              }}
            >
              <XIconSVG color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <LinearGradient
          colors={["rgba(41, 33, 24, 0.2)", "#3C2610"]}
          locations={[0.0, 0.4]}
          style={profileStyles.contentContainer}
        >
          <StatsSection
            photos={userReels.length}
            followers={followStats.followers}
            following={followStats.following}
            onFollowersPress={handleFollowersPress}
            onFollowingPress={handleFollowingPress}
          />

          <LevelUpSection
            onPress={() => setLevelUpModalVisible(true)}
            levelPercentage={profileData.levelPercentage}
          />

          <View style={profileStyles.tabContainer}>
            <TouchableOpacity
              style={[profileStyles.tab, selectedTab === "Liked Reels" && profileStyles.tabActive]}
              onPress={() => setSelectedTab("Liked Reels")}
            >
              <Text style={[profileStyles.tabText, selectedTab === "Liked Reels" && profileStyles.activeTabText]}>
                Liked Reels
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[profileStyles.tab, selectedTab === "Saved" && profileStyles.tabActive]}
              onPress={() => setSelectedTab("Saved")}
            >
              <Text style={[profileStyles.tabText, selectedTab === "Saved" && profileStyles.activeTabText]}>
                Saved
              </Text>
            </TouchableOpacity>
          </View>

          <View style={profileStyles.gridContainer}>
            {loadingGrids ? (
              <View style={{ width: '100%', paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#EC9A15" />
              </View>
            ) : currentGridData.length === 0 ? (
              <View style={{ width: '100%', paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ color: '#999' }}>No {selectedTab.toLowerCase()} found.</Text>
              </View>
            ) : (
              currentGridData.map((item, index) => {
                const baseSize = (width - 28 - 4) / 2;
                const itemStyle = {
                  width: baseSize,
                  height: baseSize,
                  marginRight: index % 2 === 0 ? 4 : 0,
                  marginBottom: 4,
                };
                return (
                  <TouchableOpacity
                    key={item._id || item.id || index}
                    style={[profileStyles.gridItem, itemStyle]}
                    onPress={() => {
                      // Navigate to reel view later
                    }}
                  >
                    <Image 
                      source={item.thumbnail_url || item.thumbnail ? { uri: `${BASE_URL}${item.thumbnail_url || item.thumbnail}` } : require("@assets/images/trending_reel2.png")} 
                      style={profileStyles.gridImage} 
                    />
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </LinearGradient>
      </ScrollView>

      {/* Modals Truncated for Brevity - Keeping exact same UI */}
      <Modal visible={levelUpModalVisible} transparent={true} animationType="slide" onRequestClose={() => setLevelUpModalVisible(false)}>
        <TouchableOpacity style={profileStyles.modalOverlay} activeOpacity={1} onPress={() => setLevelUpModalVisible(false)}>
          <View style={profileStyles.levelUpModalContainer}>
            <View style={profileStyles.levelUpModalContent}>
              <Text style={profileStyles.levelUpModalTitle}>How to Level Up</Text>
              <View style={profileStyles.levelUpRulesContainer}>
                <View style={profileStyles.levelUpRuleItem}><Text style={profileStyles.levelUpRuleText}>Unlock 1st star → after 3 competitions</Text></View>
                <View style={profileStyles.levelUpRuleItem}><Text style={profileStyles.levelUpRuleText}>Unlock 2nd star → after 5 competitions</Text></View>
                <View style={profileStyles.levelUpRuleItem}><Text style={profileStyles.levelUpRuleText}>Unlock 3rd star → after 10 competitions</Text></View>
                <View style={profileStyles.levelUpRuleItem}><Text style={profileStyles.levelUpRuleText}>Unlock 4th star → after 20 competitions</Text></View>
                <View style={profileStyles.levelUpRuleItem}><Text style={profileStyles.levelUpRuleText}>Unlock 5th star → after 30 competitions</Text></View>
              </View>
              <Text style={profileStyles.levelUpModalNote}>If your fans upgrade your profile to Participant, your level-up progress will increase.</Text>
              <TouchableOpacity style={profileStyles.levelUpModalCloseButton} onPress={() => setLevelUpModalVisible(false)}>
                <Text style={profileStyles.levelUpModalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <ProfileBurgerMenuModal isVisible={menuVisible} profileData={profileData} onClose={() => setMenuVisible(false)} />
      <UpgradeFanToParticipantModal isVisible={upgradeModalVisible} onClose={() => setUpgradeModalVisible(false)} onUpgradeSuccess={() => setUpgradeModalVisible(false)} />
      
      <Modal visible={editBioVisible} transparent={true} animationType="fade" onRequestClose={handleCancelEdit}>
        <View style={profileStyles.editBioOverlay}>
          <View style={profileStyles.editBioContainer}>
            <View style={profileStyles.editBioHeader}>
              <Text style={profileStyles.editBioTitle}>Edit Bio & Three Words</Text>
              <TouchableOpacity onPress={handleCancelEdit}><CrossIcon /></TouchableOpacity>
            </View>
            <Text style={profileStyles.editLabel}>Bio</Text>
            <TextInput style={profileStyles.editBioInput} value={tempBio} onChangeText={setTempBio} placeholder="Write something about yourself..." placeholderTextColor="#999" multiline maxLength={150} autoFocus />
            <Text style={profileStyles.bioCharCount}>{tempBio.length}/150</Text>
            <Text style={[profileStyles.editLabel, { marginTop: 20 }]}>Describe yourself in three words</Text>
            <View style={profileStyles.threeWordsEditContainer}>
              <TextInput style={profileStyles.threeWordsEditInput} placeholder="1st word" placeholderTextColor="#999" value={tempThreeWords[0]} onChangeText={(text) => { const newWords = [...tempThreeWords]; newWords[0] = text; setTempThreeWords(newWords); }} />
              <Text style={profileStyles.threeWordsEditSeparator}>|</Text>
              <TextInput style={profileStyles.threeWordsEditInput} placeholder="2nd word" placeholderTextColor="#999" value={tempThreeWords[1]} onChangeText={(text) => { const newWords = [...tempThreeWords]; newWords[1] = text; setTempThreeWords(newWords); }} />
              <Text style={profileStyles.threeWordsEditSeparator}>|</Text>
              <TextInput style={profileStyles.threeWordsEditInput} placeholder="3rd word" placeholderTextColor="#999" value={tempThreeWords[2]} onChangeText={(text) => { const newWords = [...tempThreeWords]; newWords[2] = text; setTempThreeWords(newWords); }} />
            </View>
            <Text style={[profileStyles.editLabel, { marginTop: 20 }]}>Social Links</Text>
            <View style={{ gap: 10 }}>
              <View style={profileStyles.socialInputContainer}>
                <View style={{ marginRight: 8 }}><InstagramIconSVG width={26} height={26} color="#EC9A15" /></View>
                <TextInput style={profileStyles.socialInput} placeholder="Instagram handle" placeholderTextColor="#999" value={tempInsta} autoCapitalize="none" autoCorrect={false} onChangeText={setTempInsta} />
              </View>
              <View style={profileStyles.socialInputContainer}>
                <View style={{ marginRight: 8 }}><XIconSVG color="#EC9A15" /></View>
                <TextInput style={profileStyles.socialInput} placeholder="X (Twitter) handle" placeholderTextColor="#999" value={tempX} autoCapitalize="none" autoCorrect={false} onChangeText={setTempX} />
              </View>
            </View>
            <View style={profileStyles.editBioButtons}>
              <TouchableOpacity style={[profileStyles.editBioButton, profileStyles.cancelButton]} onPress={handleCancelEdit}><Text style={profileStyles.cancelButtonText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[profileStyles.editBioButton, profileStyles.saveButton]} onPress={handleSaveBio}><Text style={profileStyles.saveButtonText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} tabs={fanTabs} onOpenDrawer={() => {}} />
    </View>
  );
}
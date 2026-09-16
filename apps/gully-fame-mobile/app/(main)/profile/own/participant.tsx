import { router } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router/react-navigation";
import { participantSelfProfileScreenStyles as styles } from "@/styles/participantSelfProfileScreenStyles";
import {
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
    Modal,
    TextInput,
    Linking,
    Animated,
    ActivityIndicator,
    Alert,
} from "react-native";
import BottomNav from "@components/layout/BottomNav";
import { LinearGradient } from "expo-linear-gradient";
import { authService } from "@api/services/authService";
import { useOwnProfile } from "@/components/profile/shared/profileHooks";
import {
    LevelUpSection,
    StatsSection,
    UserInfoSection,
} from "@/components/profile/shared/ProfileComponents";
import {
    UserIconSVG,
    HomeIconSVG,
    ReelIconSVG,
    SearchIconSVG,
    BackIcon,
} from "@/icons";
import ProfileBurgerMenuModal from "@/components/modals/ProfileBurgerMenuModal/ProfileBurgerMenuModal";
import Svg, { Path } from "react-native-svg";
import { useFollowStats } from "@/hooks/useFollowStats";
import { useUserReels } from "@/hooks/useUserReels";
import InstagramStyleVideoGrid from "@/components/profile/InstagramStyleVideoGrid";
import { BASE_URL } from "@/api/axios";

const { width } = Dimensions.get("window");

const participantTabs = [
    { name: "Home", icon: HomeIconSVG, label: "" },
    { name: "Reel", icon: ReelIconSVG, label: "GullyReel" },
    { name: "Upload", icon: null, label: "UPLOAD" },
    { name: "Search", icon: SearchIconSVG, label: "Search" },
    { name: "MyFame", icon: UserIconSVG, label: "" },
];

const XIconSVG = ({ width = 26, height = 26, color = "#fff" }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill={color}>
        <Path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 4.076H5.059z" />
    </Svg>
);

const InstagramIconSVG = ({ width = 26, height = 26, color = "#fff" }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill={color}>
        <Path d="M12 2.163c3.204 0 3.584.012 4.85.067 3.249.148 4.771 1.691 4.919 4.919.055 1.266.067 1.646.067 4.851s-.012 3.584-.067 4.85c-.148 3.228-1.67 4.771-4.919 4.919-1.266.055-1.646.067 4.85.067s-3.584-.012-4.85-.067c-3.249-.148-4.771-1.691-4.919-4.919-.055-1.266-.067-1.646-.067-4.851s.012-3.584.067-4.85c.148-3.228 1.67-4.771 4.919-4.919 1.266-.055 1.646-.067 4.85-.067zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 1.76-6.982 6.982-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.2 5.222 2.624 6.782 6.982 6.982 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c4.358-.2 6.78-1.76 6.982-6.982.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.2-5.222-2.624-6.782-6.982-6.982-1.28-.058-1.688-.072-4.947-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
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

export default function OwnParticipantProfile() {
    const { profileData, setProfileData, isLoading, reloadProfile } = useOwnProfile();
    const [activeTab, setActiveTab] = useState("MyFame");
    const [selectedTab, setSelectedTab] = useState("Photos");
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const [menuVisible, setMenuVisible] = useState(false);
    const [editBioVisible, setEditBioVisible] = useState(false);
    const [tempInsta, setTempInsta] = useState(profileData.instagramLink || "");
    const [tempX, setTempX] = useState(profileData.xLink || "");
    const [tempBio, setTempBio] = useState("");
    const [tempThreeWords, setTempThreeWords] = useState(["", "", ""]);
    const [levelUpModalVisible, setLevelUpModalVisible] = useState(false);
    const [userRanking, setUserRanking] = useState<number | null>(null);

    const { stats: followStats } = useFollowStats(profileData.id || "");
    const { reels: userReels, loading: reelsLoading, refetch: refetchUserReels } = useUserReels(profileData.id || "");

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    }, []);

    useEffect(() => {
        const loadRanking = async () => {
            try {
                const ranking = await AsyncStorage.getItem("userRanking");
                if (ranking) {
                    setUserRanking(parseInt(ranking, 10));
                } else {
                    setUserRanking(profileData?.rank || null);
                }
            } catch (error) {
                console.error("Error loading ranking:", error);
            }
        };
        loadRanking();
    }, [profileData?.rank]); 

    useFocusEffect(
        React.useCallback(() => {
            if (!profileData.firstName && !profileData.lastName) {
                reloadProfile();
            }
            refetchUserReels();
        }, [profileData.firstName, profileData.lastName, reloadProfile, refetchUserReels]),
    );

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
            const words = threeWordsStr
                .split("|")
                .map((w) => w.trim())
                .filter((w) => w);
            setTempThreeWords([words[0] || "", words[1] || "", words[2] || ""]);
        } else {
            setTempThreeWords([
                "🎵 MusicLover",
                "💃 DanceFreak",
                "✨ VibeCreator",
            ]);
        }
        setEditBioVisible(true);
    };

    const handleSaveBio = async () => {
        const threeWordsFormatted = tempThreeWords
            .filter((w) => w.trim())
            .join(" | ");

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

            const updateResult = await authService.updateProfile(updateData);
            if (updateResult.success && __DEV__) {
                console.log("✅ Bio, three words, and socials updated successfully");
            }
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

    if (
        isLoading &&
        !profileData.firstName &&
        !profileData.lastName &&
        !profileData.profileImage
    ) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <StatusBar barStyle="light-content" />
                <ActivityIndicator size="large" color="#EC9A15" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                        <BackIcon color="white" size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
                        <View style={styles.hamburgerIcon}>
                            <View style={styles.hamburgerLine} />
                            <View style={styles.hamburgerLine} />
                            <View style={styles.hamburgerLine} />
                        </View>
                    </TouchableOpacity>
                </View>

                <Animated.View style={[styles.gamifiedAvatarContainer, { transform: [{ scale: pulseAnim }] }]}>
                    <LinearGradient
                        colors={["#FFD700", "#FF8C00", "#FF0055"]} 
                        style={styles.avatarGradientRing}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Image
                            source={
                                profileData.profileImage
                                    ? { uri: profileData.profileImage.startsWith('http') ? profileData.profileImage : `${BASE_URL}${profileData.profileImage}` }
                                    : require("@assets/images/user1.png")
                            }
                            style={styles.gamifiedProfileImage}
                        />
                    </LinearGradient>

                    <View style={styles.rankBadgeContainer}>
                        <Text style={styles.rankBadgeText}>{profileData.currentRank || "STAR"}</Text>
                    </View>
                </Animated.View>

                <UserInfoSection
                    profileData={profileData}
                    onEditBio={handleEditBio}
                    role="participant"
                    showEditButton={true}
                    threeWords={profileData.threeWords}
                />

                <View style={styles.socialLinksContainer}>
                    {profileData.instagramLink || (profileData as any).instagram ? (
                        <TouchableOpacity
                            style={styles.socialIconButton}
                            onPress={() => {
                                const raw = profileData.instagramLink || (profileData as any).instagram;
                                const cleanHandle = formatHandle(raw as string).replace("@", "");
                                Linking.openURL(`https://instagram.com/${cleanHandle}`);
                            }}
                        >
                            <InstagramIconSVG width={22} height={22} color="#fff" />
                        </TouchableOpacity>
                    ) : null}

                    {profileData.xLink ? (
                        <TouchableOpacity
                            style={styles.socialIconButton}
                            onPress={() => {
                                const cleanHandle = formatHandle(profileData.xLink).replace("@", "");
                                Linking.openURL(`https://x.com/${cleanHandle}`);
                            }}
                        >
                            <XIconSVG width={20} height={20} color="#fff" />
                        </TouchableOpacity>
                    ) : null}
                </View>

                <LinearGradient
                    colors={["rgba(41, 33, 24, 0.2)", "#3C2610"]}
                    locations={[0.0, 0.4]}
                    style={styles.contentContainer}
                >
                    <StatsSection
                        photos={userReels.length}
                        followers={followStats.followers}
                        following={followStats.following}
                        onFollowersPress={handleFollowersPress}
                        onFollowingPress={handleFollowingPress}
                    />

                    <View style={styles.rankCardContainer}>
                        <LevelUpSection
                            onPress={() => setLevelUpModalVisible(true)}
                            levelPercentage={profileData.levelPercentage || 0}
                        />

                        <View style={styles.progressContainer}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressText}>
                                    Next Rank: {profileData.nextRank || "Superstar"}
                                </Text>
                                <Text style={styles.progressFraction}>
                                    {profileData.competitionsParticipated || 0}/{profileData.competitionsRequiredForNextRank || 5} Comps
                                </Text>
                            </View>
                            <View style={styles.progressBarBackground}>
                                <LinearGradient
                                    colors={["#FFE066", "#EC9A15"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[
                                        styles.progressBarFill,
                                        { width: `${profileData.levelPercentage || 0}%` }, 
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressHint}>
                                Just {Math.max(0, (profileData.competitionsRequiredForNextRank || 5) - (profileData.competitionsParticipated || 0))} more competitions to level up!
                            </Text>
                        </View>
                    </View>

                    <View style={styles.achievementsContainer}>
                        <Text style={styles.achievementsTitle}>Trophy Case</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                            {profileData.achievements && profileData.achievements.length > 0 ? (
                                profileData.achievements.map((ach: any, idx: number) => (
                                    <View key={idx} style={styles.badgePlaceholder}>
                                        <Text>{ach.emoji || '🏆'}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={{ color: '#999', fontSize: 13, paddingVertical: 10 }}>
                                    No trophies yet. Join a competition to earn some!
                                </Text>
                            )}
                        </ScrollView>
                    </View>

                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, selectedTab === "Videos" && styles.tabActive]}
                            onPress={() => setSelectedTab("Videos")}
                        >
                            <Text style={[styles.tabText, selectedTab === "Videos" && styles.activeTabText]}>
                                Videos
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, selectedTab === "Photos" && styles.tabActive]}
                            onPress={() => setSelectedTab("Photos")}
                        >
                            <Text style={[styles.tabText, selectedTab === "Photos" && styles.activeTabText]}>
                                Photos
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ flex: 1, height: "auto", minHeight: 400 }}>
                        <InstagramStyleVideoGrid
                            reels={userReels}
                            loading={reelsLoading}
                            userId={profileData.id || profileData._id}
                            onRefresh={reloadProfile}
                        />
                    </View>
                </LinearGradient>
            </ScrollView>

            <Modal visible={levelUpModalVisible} transparent={true} animationType="slide" onRequestClose={() => setLevelUpModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLevelUpModalVisible(false)}>
                    <View style={styles.levelUpModalContainer}>
                        <View style={styles.levelUpModalContent}>
                            <Text style={styles.levelUpModalTitle}>How to Level Up</Text>
                            <View style={styles.levelUpRulesContainer}>
                                <View style={styles.levelUpRuleItem}><Text style={styles.levelUpRuleText}>Unlock 1st star → after 3 competitions</Text></View>
                                <View style={styles.levelUpRuleItem}><Text style={styles.levelUpRuleText}>Unlock 2nd star → after 5 competitions</Text></View>
                                <View style={styles.levelUpRuleItem}><Text style={styles.levelUpRuleText}>Unlock 3rd star → after 10 competitions</Text></View>
                                <View style={styles.levelUpRuleItem}><Text style={styles.levelUpRuleText}>Unlock 4th star → after 20 competitions</Text></View>
                                <View style={styles.levelUpRuleItem}><Text style={styles.levelUpRuleText}>Unlock 5th star → after 30 competitions</Text></View>
                            </View>
                            <Text style={styles.levelUpModalNote}>If your fans upgrade your profile to Participant, your level-up progress will increase.</Text>
                            <TouchableOpacity style={styles.levelUpModalCloseButton} onPress={() => setLevelUpModalVisible(false)}>
                                <Text style={styles.levelUpModalCloseButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            <ProfileBurgerMenuModal isVisible={menuVisible} onClose={() => setMenuVisible(false)} profileData={profileData} />

            <Modal visible={editBioVisible} transparent={true} animationType="fade" onRequestClose={handleCancelEdit}>
                <View style={styles.editBioOverlay}>
                    <View style={styles.editBioContainer}>
                        <View style={styles.editBioHeader}>
                            <Text style={styles.editBioTitle}>Edit Bio & Three Words</Text>
                            <TouchableOpacity onPress={handleCancelEdit}><Text style={styles.editBioClose}>✕</Text></TouchableOpacity>
                        </View>
                        <Text style={styles.editLabel}>Bio</Text>
                        <TextInput style={styles.editBioInput} value={tempBio} onChangeText={setTempBio} placeholder="Write something about yourself..." placeholderTextColor="#999" multiline maxLength={150} autoFocus />
                        <Text style={styles.bioCharCount}>{tempBio.length}/150</Text>

                        <Text style={[styles.editLabel, { marginTop: 20 }]}>Describe yourself in three words</Text>
                        <View style={styles.threeWordsEditContainer}>
                            <TextInput style={styles.threeWordsEditInput} placeholder="1st word" placeholderTextColor="#999" value={tempThreeWords[0]} onChangeText={(text) => { const newWords = [...tempThreeWords]; newWords[0] = text; setTempThreeWords(newWords); }} />
                            <Text style={styles.threeWordsEditSeparator}>|</Text>
                            <TextInput style={styles.threeWordsEditInput} placeholder="2nd word" placeholderTextColor="#999" value={tempThreeWords[1]} onChangeText={(text) => { const newWords = [...tempThreeWords]; newWords[1] = text; setTempThreeWords(newWords); }} />
                            <Text style={styles.threeWordsEditSeparator}>|</Text>
                            <TextInput style={styles.threeWordsEditInput} placeholder="3rd word" placeholderTextColor="#999" value={tempThreeWords[2]} onChangeText={(text) => { const newWords = [...tempThreeWords]; newWords[2] = text; setTempThreeWords(newWords); }} />
                        </View>
                        <Text style={[styles.editLabel, { marginTop: 20 }]}>Social Links</Text>
                        <View style={{ gap: 10 }}>
                            <View style={styles.socialInputContainer}>
                                <View style={{ marginRight: 8 }}><InstagramIconSVG width={18} height={18} color="#EC9A15" /></View>
                                <TextInput style={styles.socialInput} placeholder="Instagram handle" placeholderTextColor="#999" value={tempInsta} autoCapitalize="none" autoCorrect={false} onChangeText={setTempInsta} />
                            </View>
                            <View style={styles.socialInputContainer}>
                                <View style={{ marginRight: 8 }}><XIconSVG width={18} height={18} color="#EC9A15" /></View>
                                <TextInput style={styles.socialInput} placeholder="X (Twitter) handle" placeholderTextColor="#999" value={tempX} autoCapitalize="none" autoCorrect={false} onChangeText={setTempX} />
                            </View>
                        </View>
                        <View style={styles.editBioButtons}>
                            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveBio}><Text style={styles.saveButtonText}>Save</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} tabs={participantTabs} onOpenDrawer={() => {}} />
        </View>
    );
}
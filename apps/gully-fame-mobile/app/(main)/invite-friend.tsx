

import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Linking,
  Alert,
  Share,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { getCurrentUser } from "@/api/services/userService";

const socialPlatforms = [
  { id: 1, name: "WhatsApp", icon: "whatsapp", provider: FontAwesome5, color: "#25D366" },
  { id: 2, name: "Instagram", icon: "instagram", provider: FontAwesome5, color: "#E4405F" },
  { id: 3, name: "Snapchat", icon: "snapchat-ghost", provider: FontAwesome5, color: "#FFEC06" },
  { id: 4, name: "Twitter", icon: "twitter", provider: FontAwesome5, color: "#1DA1F2" },
  { id: 5, name: "Facebook", icon: "facebook", provider: FontAwesome5, color: "#1877F2" },
];

export default function InviteFriendScreen() {
  const insets = useSafeAreaInsets();
  
  const [userReferralCode, setUserReferralCode] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(true);
  const [codeError, setCodeError] = useState(false);
  const [copied, setCopied] = useState(false);

  // The referral code comes from the signed-in user's profile. Nothing is hardcoded.
  const loadReferralCode = useCallback(async () => {
    setCodeLoading(true);
    setCodeError(false);
    try {
      const result = await getCurrentUser();
      const code = (result.data as any)?.referralCode;
      if (result.success && typeof code === "string" && code.trim()) {
        setUserReferralCode(code.trim());
      } else {
        setUserReferralCode(null);
        setCodeError(true);
      }
    } catch {
      setUserReferralCode(null);
      setCodeError(true);
    } finally {
      setCodeLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferralCode();
  }, [loadReferralCode]);

  const shareUrl = "https://gullyfame.com/download";
  const shareMessage = `Join me on Gully Fame!${userReferralCode ? ` My referral code: ${userReferralCode}` : ""}\n\nDownload now: ${shareUrl}`;

  const copyToClipboard = async () => {
    if (!userReferralCode) return;
    await Clipboard.setStringAsync(userReferralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (platform: string) => {
    if (!userReferralCode) return;
    try {
      switch (platform) {
        case "WhatsApp": {
          const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareMessage)}`;
          const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);
          if (canOpenWhatsApp) {
            await Linking.openURL(whatsappUrl);
          } else {
            Alert.alert("WhatsApp not installed", "Please install WhatsApp to share.");
          }
          break;
        }
        case "Instagram":
          await Share.share({ message: shareMessage, title: "Invite to Gully Fame" });
          break;
        case "Snapchat": {
          const snapchatUrl = `snapchat://share?text=${encodeURIComponent(shareMessage)}`;
          const canOpenSnap = await Linking.canOpenURL(snapchatUrl);
          if (canOpenSnap) {
            await Linking.openURL(snapchatUrl);
          } else {
            Alert.alert("Snapchat not installed", "Please install Snapchat to share.");
          }
          break;
        }
        case "Twitter": {
          const twitterUrl = `twitter://post?message=${encodeURIComponent(shareMessage)}`;
          const canOpenTwitter = await Linking.canOpenURL(twitterUrl);
          if (canOpenTwitter) {
            await Linking.openURL(twitterUrl);
          } else {
            await Linking.openURL(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`);
          }
          break;
        }
        case "Facebook": {
          const facebookUrl = `fb://share?text=${encodeURIComponent(shareMessage)}`;
          const canOpenFB = await Linking.canOpenURL(facebookUrl);
          if (canOpenFB) {
            await Linking.openURL(facebookUrl);
          } else {
            await Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
          }
          break;
        }
        default:
          await Share.share({ message: shareMessage, title: "Invite to Gully Fame" });
      }
    } catch (error) {
      Alert.alert("Error", "Unable to share. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3C2610" />

      {}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite & Earn</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {}
        <View style={styles.referralCard}>
          <Text style={styles.referralTitle}>Your Referral Code</Text>
          {codeLoading ? (
            <View style={styles.codeBox}>
              <ActivityIndicator size="small" color="#EC9A15" />
            </View>
          ) : userReferralCode ? (
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{userReferralCode}</Text>
              <TouchableOpacity
                style={[styles.copyButton, copied && styles.copiedButton]}
                onPress={copyToClipboard}
                activeOpacity={0.7}
              >
                <Ionicons name={copied ? "checkmark-circle" : "copy-outline"} size={20} color="#fff" />
                <Text style={styles.copyText}>{copied ? "Copied!" : "Copy"}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{codeError ? "Referral code isn't available yet" : "No referral code yet"}</Text>
              {codeError ? (
                <TouchableOpacity style={styles.copyButton} onPress={loadReferralCode} activeOpacity={0.7}>
                  <Text style={styles.copyText}>Retry</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
          {userReferralCode ? (
            <Text style={styles.referralSubText}>Share this code with your friends.</Text>
          ) : null}
        </View>

        {}
        <Text style={styles.sectionTitle}>Share via</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.platformsContainer}>
          {socialPlatforms.map((platform) => {
            const IconProvider = platform.provider;
            return (
              <TouchableOpacity
                key={platform.id}
                style={styles.platformCard}
                onPress={() => handleShare(platform.name)}
                disabled={!userReferralCode}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <IconProvider name={platform.icon} size={36} color={platform.color} />
                </View>
                <Text style={styles.platformName}>{platform.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3C2610",
    paddingTop: Platform.OS === "android" ? 20 : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  referralCard: {
    backgroundColor: "#252525",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.4)",
    alignItems: "center",
  },
  referralTitle: {
    alignSelf: "stretch",
    textAlign: "center",
    color: "#ccc",
    fontSize: 16,
    marginBottom: 12,
  },
  codeBox: {
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EC9A15",
    borderStyle: "dashed",
    paddingLeft: 20,
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  codeText: {
    color: "#EC9A15",
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  copyButton: {
    backgroundColor: "#EC9A15",
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: "center",
    gap: 6,
  },
  copiedButton: {
    backgroundColor: "#25D366",
  },
  copyText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  referralSubText: {
    color: "#999",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  platformsContainer: {
    flexDirection: "row",
    paddingVertical: 10,
    gap: 12,
    marginBottom: 20,
  },
  platformCard: {
    backgroundColor: "#252525",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    minWidth: 90,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.15)",
  },
  iconContainer: {
    marginBottom: 8,
  },
  platformName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#252525",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.2)",
    marginTop: 10,
  },
  infoTitle: {
    color: "#EC9A15",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    backgroundColor: "rgba(236, 154, 21, 0.2)",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EC9A15",
  },
  stepNumberText: {
    color: "#EC9A15",
    fontWeight: "bold",
    fontSize: 14,
  },
  stepText: {
    color: "#ccc",
    fontSize: 15,
    flex: 1,
  },
});
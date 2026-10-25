import { router } from "expo-router";
import { showToast } from "@/components/ui/Toast";
import { useState } from "react";
import { Dimensions, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import BottomNav from "@components/layout/BottomNav";
import { BackIcon, CommunityIcon, DownIcon, GlobeIcon, UserIconSVG as UserIcon, HomeIconSVG } from "@/icons";
import { ReelIconSVG as ReelIcon } from "@/icons";
import Svg, { Path, Rect, G } from "react-native-svg";

const { width, height } = Dimensions.get("window");

const tabs = [
  { name: "Home", icon: HomeIconSVG, label: "" },
  { name: "Reel", icon: ReelIcon, label: "GullyReel" },
  { name: "Upload", icon: null, label: "UPLOAD" },
  { name: "Community", icon: CommunityIcon, label: "" },
  { name: "MyFame", icon: UserIcon, label: "" },
];

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState("Community");
  const [activeFeedTab, setActiveFeedTab] = useState("My feed");

  const handleTabPress = (tabName: string) => {
    if (tabName === "Home") {
      router.push("/(main)" as any);
    } else {
      setActiveTab(tabName);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {}
      <ScrollView contentContainerStyle={styles.mainScrollContainer}>
        {}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push("/(main)")}
            style={styles.backButton}
          >
            <BackIcon color="white" size={26} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Communities</Text>
        </View>

        {}
        <Text style={styles.subtitle}>
          Where creators and fans connect, cheer, and collab.
        </Text>

        {}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All communities</Text>

        </View>

        {/* The backend has no communities API yet. */}
        <Text style={[styles.subtitle, { marginTop: 8 }]}>Communities aren&apos;t available yet.</Text>

        {}
        <View style={styles.sectionfeed}>
          <View style={styles.feedTabsContainer}>
            {}
            <TouchableOpacity
              style={styles.feedTab}
              onPress={() => setActiveFeedTab("My feed")}
            >
              <Text
                style={[
                  styles.feedTabText,
                  activeFeedTab === "My feed"
                    ? styles.feedTabActiveText
                    : styles.feedTabInactiveText,
                ]}
              >
                My feed
              </Text>
              {activeFeedTab === "My feed" && (
                <View style={styles.activeTabUnderline} />
              )}
            </TouchableOpacity>

            {}
            <TouchableOpacity
              style={styles.feedTab}
              onPress={() => setActiveFeedTab("My communities")}
            >
              <Text
                style={[
                  styles.feedTabText,
                  activeFeedTab === "My communities"
                    ? styles.feedTabActiveText
                    : styles.feedTabInactiveText,
                ]}
              >
                My communities
              </Text>
              {activeFeedTab === "My communities" && (
                <View style={styles.activeTabUnderline} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {activeFeedTab === "My feed" && (
          <View style={styles.sectionpost}>
            <View style={styles.postInputContainer}>
              <View style={styles.profileIconContainer}>
                <View style={styles.defaultProfileIcon}>
                  <Text style={styles.profileInitial}>A</Text>
                </View>
              </View>

              {}
              <View style={styles.postInputContent}>
                {}
                <TextInput
                  style={styles.postInput}
                  placeholder="Share your latest win, idea, or challenge..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                />
                <View style={styles.postdivider} />
                {}
                <View style={styles.postActionsRow}>
                  <TouchableOpacity style={styles.addPostButton}>
                    <GlobeIcon color="#6B7280" />
                    <Text style={styles.addPostText}>Add your post in</Text>
                    <DownIcon color="#6B7280" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.publishButton}
                    onPress={() => showToast("Community posts aren't available yet.", "info")}
                  >
                    <Text style={styles.publishButtonText}>Publish Post</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        onOpenDrawer={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3C2610",
    position: "relative",
  },
  
  mainScrollContainer: {
    paddingBottom: 100, 
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 12,
    paddingTop: 60, 
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 12,
  },
  backButton: {
    position: "absolute",
    left: 20,
    padding: 4,
    paddingTop: 60, 
  },
  headerTitle: {
    fontSize: 20,
    color: "white",
    textAlign: "center",
  },
  subtitle: {
    fontSize: width * 0.05,
    color: "white",
    textAlign: "center",
    marginTop: height * 0.01,
    paddingHorizontal: width * 0.15,
  },
  sectionTitle: {
    fontSize: width * 0.05,
    color: "white",
    marginTop: height * 0.05,
  },
  viewAll: {
    fontSize: width * 0.035,
    color: "white",
    opacity: 0.8,
    marginTop: height * 0.05,
  },
  
  horizontalScrollContainer: {
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  item: {
    alignItems: "center",
    width: width * 0.22,
  },
  imageWrapper: {
    position: "relative",
    width: width * 0.17,
    height: width * 0.17,
    borderRadius: width * 0.085,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  
  hotBadge: {
    position: "absolute",
    right: -5,
    top: -5,
    fontSize: 18,
  },
  comingSoonOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 35,
  },
  comingSoonText: {
    color: "white",
    fontSize: 12,
  },
  name: {
    color: "white",
    fontSize: width * 0.03,
    marginTop: height * 0.01,
    textAlign: "center",
  },

  
  sectionfeed: {
    backgroundColor: "white",
    marginTop: 40, 
    position: "relative",
  },
  feedTabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 20,
  },
  feedTab: {
    paddingVertical: 15,
    position: "relative", 
  },
  feedTabText: {
    fontSize: width * 0.04,
  },
  feedTabActiveText: {
    color: "#EC9A15", 
  },
  feedTabInactiveText: {
    color: "#4B5563", 
  },
  activeTabUnderline: {
    height: 5,
    backgroundColor: "#EC9A15", 
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  
  feedContent: {
    padding: 20,
    minHeight: 300, 
    alignItems: "center",
    justifyContent: "center",
  },
  feedContentText: {
    color: "white",
    fontSize: 16,
    opacity: 0.7,
  },

  
  sectionpost: {
    backgroundColor: "white",
    borderRadius: 12,
    marginTop: 50,
    marginBottom: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postInputContainer: {
    flexDirection: "row",
    gap: 0,
  },
  profileIconContainer: {
    width: width * 0.075,
    height: width * 0.075,
    borderRadius: width * 0.038,
    overflow: "hidden",
    marginTop: height * 0.006,
  },
  defaultProfileIcon: {
    width: "100%",
    height: "100%",
    backgroundColor: "#EC9A15",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    color: "white",
    fontSize: width * 0.038,
  },
  postInputContent: {
    flex: 1,
    gap: 20,
  },
  postPlaceholder: {
    fontSize: 15,
    color: "#9CA3AF",
    lineHeight: 22,
  },
  postActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addPostButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    marginLeft: -25,
  },
  addPostText: {
    fontSize: width * 0.035,
    color: "#6B7280",
  },
  postInput: {
    fontSize: width * 0.038,
    color: "#111827",
    lineHeight: height * 0.027,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  publishButton: {
    backgroundColor: "#EC9A15",
    paddingHorizontal: width * 0.06,
    paddingVertical: height * 0.015,
    borderRadius: width * 0.06,
    color: "#ffffff",
  },
  publishButtonText: {
    color: "#ffffff",
    fontSize: width * 0.035,
  },
  postdivider: {
    height: 1,
    backgroundColor: "#EBEEF0",
    width: "100%",
    right: 30,
  },
});

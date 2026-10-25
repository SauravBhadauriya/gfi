import { StyleSheet, Dimensions } from "react-native";
const { width, height } = Dimensions.get("window");
export const LeaderboardStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#3C2610",
        position: "relative",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
        paddingHorizontal: 20,
        marginBottom: 12,
        marginTop: 12,
        paddingTop: 60,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    leaderboardSection: {
        flex: 1,
        marginTop: 10,
    },
    leaderboardContent: {
        paddingHorizontal: 16,
        gap: 10, // Adds literal gaps between the floating cards
        paddingBottom: 40,
    },
    playerBannerCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2A1A0B", // Deep rich brown, matches the theme
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 14,
        borderWidth: 1,
        borderColor: "#4A3A2A",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 5,
    },
    cardAccentStrip: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: "#EC9A15", // Adds a sharp gaming edge
    },
    rankBadgeContainer: {
        width: 40,
        height: 32,
        borderRadius: 8, // Squarish gaming badge instead of a circle
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    rankNumber: {
        color: "#999", // Silver/grey for lower ranks
        fontSize: 16,
        fontWeight: "800",
    },
    leaderboardAvatarWrapper: {
        position: "relative",
        width: 46,
        alignItems: "center",
        justifyContent: "center",
    },
    leaderboardAvatarImage: {
        width: 46,
        height: 46,
        borderRadius: 23,
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.2)", // Subtle silver rim
    },
    leaderboardInfo: {
        flex: 1,
        minWidth: 0,
        justifyContent: "center",
    },
    leaderboardName: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    pointsRowList: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    leaderboardPoints: {
        color: "#FFD700", // Make the stars pop
        fontSize: 13,
        fontWeight: "600",
    },
    headerTitle: {
        fontSize: 20,
        color: "white",
        textAlign: "center",
        flex: 1,
    },
    subtitle: {
        fontSize: width * 0.04,
        color: "#fff",
        textAlign: "center",
        marginTop: height * 0.015,
        marginBottom: height * 0.02,
        paddingHorizontal: width * 0.12,
        lineHeight: height * 0.026,
        letterSpacing: 0.5,
    },
    podiumContainer: {
        alignItems: "center",
        position: "relative",
        marginTop: 20,
        paddingBottom: 30,
    },
    crownIcon: {
        position: "absolute",
        top: -20,
        alignSelf: "center",
        zIndex: 10,
    },
    topThreeContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 5,
    },
    podiumItem: {
        alignItems: "center",
        flex: 1,
    },
    podiumFirst: {
        marginBottom: 25,
    },
    avatarContainer: {
        position: "relative",
        marginBottom: 10,
    },
    avatar: {
        width: width * 0.22,
        height: width * 0.22,
        borderRadius: width * 0.11,
        borderWidth: 3,
        borderColor: "#fff",
    },
    avatarLarge: {
        width: width * 0.28,
        height: width * 0.28,
        borderRadius: width * 0.14,
        borderWidth: 4,
        borderColor: "#FFD700",
    },
    rankBadgeCircle: {
        position: "absolute",
        bottom: -5,
        right: -5,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 5,
    },
    rankBadge1: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    rankBadge2: {},
    rankBadge3: {},
    rankBadgeText: {
        color: "#fff",
        fontSize: 16,
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    rankBadgeText1: {
        fontSize: 18,
    },
    podiumName: {
        color: "#fff",
        fontSize: width * 0.033,
        textAlign: "center",
        marginBottom: 4,
    },
    podiumName1: {
        fontSize: width * 0.038,
        color: "#FFD700",
    },
    pointsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    podiumPoints: {
        color: "#fff",
        fontSize: width * 0.035,
    },
    podiumPoints1: {
        fontSize: width * 0.04,
        color: "#FFD700",
    },

    leaderboardListContainer: {
        backgroundColor: "rgba(0, 0, 0, 0.25)", // Creates a deep, inset "glass" look
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(255, 215, 0, 0.1)", // Faint gold trim
        overflow: "hidden",
    },

    leaderboardItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "transparent",
        paddingVertical: 14,
        paddingHorizontal: 18,
        gap: 12,
    },
    leaderboardItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.05)",
    },
    leaderboardItemYou: {
        backgroundColor: "#EC9A15",
    },

    rankBadgeYou: {
        backgroundColor: "#000",
        borderColor: "#333",
    },

    rankNumberYou: {
        color: "#fff",
    },

    yourBadge: {
        position: "absolute",
        bottom: -5,
        right: -5,
        backgroundColor: "#000",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#fff",
    },
    yourBadgeText: {
        color: "#fff",
        fontSize: 8,
    },

    leaderboardNameYou: {
        color: "#000",
    },

    leaderboardPointsYou: {
        color: "#000",
    },
});

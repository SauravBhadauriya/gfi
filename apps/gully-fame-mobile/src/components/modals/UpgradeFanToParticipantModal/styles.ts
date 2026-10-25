import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  upgradeBanner: {
    width: "100%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 24,
  },
  crossIconWrapper: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 6,
    borderRadius: 20,
  },
  benefitIconContainer: {
    width: 30,
    alignItems: "center",
    marginRight: 12,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EC9A15",
  },
  upgradeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  upgradeModalContainer: {
    width: "100%",
    backgroundColor: "#3C2610",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.3)",
    shadowColor: "#EC9A15",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  upgradeBannerContainer: {
    width: "100%",
    height: 180,
    position: "relative",
  },
  upgradeImage: {
    width: "100%",
    height: "100%",
  },
  upgradeCross: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  upgradeModalContent: {
    padding: 24,
  },
  upgradeBenefitsCard: {
    backgroundColor: "#2A1A0B",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.2)",
  },
  upgradeLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EC9A15",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  upgradeBenefitsListContainer: {
    gap: 16,
  },
  upgradeBenefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  upgradeBenefitText: {
    flexShrink: 1,
    fontSize: 16,
    color: "#E5DCD0",
    lineHeight: 22,
    fontWeight: "500",
  },
  upgradeButton: {
    backgroundColor: "#EC9A15",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeButtonText: {
    color: "#1A1005",
    fontSize: 18,
    fontWeight: "bold",
  },
});

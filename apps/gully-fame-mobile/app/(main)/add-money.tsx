import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { BackIcon } from "@/icons";

interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  discount?: number;
  finalPrice: number;
  bonus?: number;
  popular?: boolean;
}

export default function AddMoneyScreen() {
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [userInfo, setUserInfo] = useState({ email: "", phone: "", name: "" });

  // Fetch coin packages from backend
  const fetchCoinPackages = useCallback(async () => {
    try {
      setLoading(true);
      const { paymentIntegrationService } = await import("@/api/services/paymentIntegrationService");
      const { authService } = await import("@/api/services/authService");

      // Fetch packages
      const packagesResult = await paymentIntegrationService.getCoinPackages();
      if (packagesResult.success && Array.isArray(packagesResult.data)) {
        setCoinPackages(packagesResult.data);
        // Select popular package by default
        const popularPackage = packagesResult.data.find((p: any) => p.popular);
        if (popularPackage) {
          setSelectedPackage(popularPackage);
        }
      } else {
        Alert.alert("Error", "Failed to load coin packages");
      }

      // Fetch user profile for payment details
      const profileResult = await authService.getUserProfile();
      if (profileResult.success && profileResult.data) {
        setUserInfo({
          email: profileResult.data.email || "",
          phone: profileResult.data.mobile || "",
          name: `${profileResult.data.firstName || ""} ${profileResult.data.lastName || ""}`.trim(),
        });
      }
    } catch (error) {
      console.error("[add-money] Error fetching packages:", error);
      Alert.alert("Error", "Failed to load payment options");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCoinPackages();
    }, [fetchCoinPackages])
  );

  // Handle payment initiation
  const handlePayment = async (packageData: CoinPackage) => {
    if (!userInfo.email || !userInfo.phone || !userInfo.name) {
      Alert.alert("Error", "Please complete your profile before making a payment");
      return;
    }

    try {
      setProcessing(true);
      const { paymentIntegrationService } = await import("@/api/services/paymentIntegrationService");

      // Step 1: Initiate payment on backend
      const initiateResult = await paymentIntegrationService.initiatePayment({
        packageId: packageData.id,
        coins: packageData.coins,
        amount: packageData.finalPrice,
        userEmail: userInfo.email,
        userPhone: userInfo.phone,
        userName: userInfo.name,
      });

      if (!initiateResult.success) {
        Alert.alert("Error", initiateResult.message || "Failed to initiate payment");
        setProcessing(false);
        return;
      }

      const { orderId, key } = initiateResult.data || {};

      if (!orderId || !key) {
        Alert.alert("Error", "Failed to get payment details");
        setProcessing(false);
        return;
      }

      // Step 2: Process Razorpay payment
      const paymentVerifyRequest = await paymentIntegrationService.processRazorpayPayment(
        orderId,
        packageData.finalPrice,
        userInfo.email,
        userInfo.phone,
        userInfo.name,
        key
      );

      if (!paymentVerifyRequest) {
        // User cancelled payment
        setProcessing(false);
        return;
      }

      // Step 3: Verify payment on backend
      const verifyResult = await paymentIntegrationService.verifyPayment(paymentVerifyRequest);

      if (verifyResult.success) {
        Alert.alert(
          "Success",
          `Payment successful! You received ${packageData.coins} GFI coins.`,
          [
            {
              text: "OK",
              onPress: () => {
                router.back();
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", verifyResult.message || "Payment verification failed");
      }
    } catch (error: any) {
      console.error("[add-money] Payment error:", error);
      Alert.alert("Error", error.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3C2610" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add GFI Coins</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#EC9A15" />
          <Text style={{ color: "#999", marginTop: 12 }}>Loading packages...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#EC9A15" />
            <Text style={styles.infoText}>
              GFI coins can be used to support creators and participate in exclusive competitions.
            </Text>
          </View>

          {/* Coin Packages Grid */}
          <Text style={styles.sectionTitle}>Choose a Package</Text>
          <View style={styles.packagesGrid}>
            {coinPackages.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                style={[
                  styles.packageCard,
                  selectedPackage?.id === pkg.id && styles.packageCardSelected,
                ]}
                onPress={() => setSelectedPackage(pkg)}
                disabled={processing}
              >
                {pkg.popular && (
                  <LinearGradient
                    colors={["#EC9A15", "#FF6B35"]}
                    style={styles.popularBadge}
                  >
                    <Text style={styles.popularBadgeText}>Popular</Text>
                  </LinearGradient>
                )}

                <Text style={styles.coinAmount}>{pkg.coins}</Text>
                <Text style={styles.coinLabel}>GFI Coins</Text>

                {pkg.discount ? (
                  <>
                    <Text style={styles.originalPrice}>₹{pkg.price}</Text>
                    <Text style={styles.discountBadge}>{pkg.discount}% OFF</Text>
                  </>
                ) : null}

                <Text style={styles.finalPrice}>₹{pkg.finalPrice}</Text>

                {pkg.bonus ? (
                  <View style={styles.bonusBox}>
                    <Text style={styles.bonusText}>+ {pkg.bonus} bonus</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected Package Details */}
          {selectedPackage && (
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Coins</Text>
                <Text style={styles.detailValue}>{selectedPackage.coins}</Text>
              </View>
              <View style={styles.detailDivider} />
              {selectedPackage.bonus ? (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bonus Coins</Text>
                    <Text style={[styles.detailValue, { color: "#22C55E" }]}>
                      +{selectedPackage.bonus}
                    </Text>
                  </View>
                  <View style={styles.detailDivider} />
                </>
              ) : null}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Price</Text>
                <Text style={[styles.detailValue, { fontSize: 20 }]}>
                  ₹{selectedPackage.finalPrice}
                </Text>
              </View>
            </View>
          )}

          {/* Payment Info */}
          <View style={styles.paymentInfoCard}>
            <Text style={styles.paymentInfoTitle}>Payment Details</Text>
            <View style={styles.paymentInfoItem}>
              <Text style={styles.paymentInfoLabel}>Email:</Text>
              <Text style={styles.paymentInfoValue}>{userInfo.email || "Not provided"}</Text>
            </View>
            <View style={styles.paymentInfoItem}>
              <Text style={styles.paymentInfoLabel}>Phone:</Text>
              <Text style={styles.paymentInfoValue}>{userInfo.phone || "Not provided"}</Text>
            </View>
            <Text style={styles.paymentNote}>
              💳 Payments are processed securely through Razorpay. Your payment information is encrypted and safe.
            </Text>
          </View>

          {/* Payment Button */}
          {selectedPackage && (
            <TouchableOpacity
              style={[styles.paymentButton, processing && styles.paymentButtonDisabled]}
              onPress={() => handlePayment(selectedPackage)}
              disabled={processing}
            >
              {processing ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.paymentButtonText}>Processing...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="card" size={20} color="#fff" />
                  <Text style={styles.paymentButtonText}>
                    Pay ₹{selectedPackage.finalPrice} Now
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Spacing */}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}
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
    fontSize: 20,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  infoCard: {
    backgroundColor: "rgba(236, 154, 21, 0.1)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: "#EC9A15",
  },
  infoText: {
    color: "#CCCCCC",
    fontSize: 14,
    flex: 1,
    marginLeft: 12,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  packagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  packageCard: {
    width: "48%",
    backgroundColor: "#252525",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#444",
    alignItems: "center",
  },
  packageCardSelected: {
    borderColor: "#EC9A15",
    backgroundColor: "rgba(236, 154, 21, 0.08)",
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 14,
  },
  popularBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  coinAmount: {
    color: "#EC9A15",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 8,
  },
  coinLabel: {
    color: "#999",
    fontSize: 12,
    marginBottom: 8,
  },
  originalPrice: {
    color: "#666",
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    color: "#22C55E",
    fontSize: 12,
    fontWeight: "600",
    marginVertical: 4,
  },
  finalPrice: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 8,
  },
  bonusBox: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  bonusText: {
    color: "#22C55E",
    fontSize: 12,
    fontWeight: "600",
  },
  detailsCard: {
    backgroundColor: "#252525",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#444",
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  detailLabel: {
    color: "#999",
    fontSize: 14,
    fontWeight: "500",
  },
  detailValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  detailDivider: {
    height: 1,
    backgroundColor: "#444",
  },
  paymentInfoCard: {
    backgroundColor: "#252525",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#444",
    marginBottom: 20,
  },
  paymentInfoTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  paymentInfoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  paymentInfoLabel: {
    color: "#999",
    fontSize: 14,
  },
  paymentInfoValue: {
    color: "#fff",
    fontSize: 14,
  },
  paymentNote: {
    color: "#666",
    fontSize: 12,
    marginTop: 12,
    fontStyle: "italic",
  },
  paymentButton: {
    backgroundColor: "#EC9A15",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  paymentButtonDisabled: {
    opacity: 0.6,
  },
  paymentButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

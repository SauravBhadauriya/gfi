import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface SupportPackage {
  id: string;
  coins: number;
  label: string;
  price: number;
}

interface SupportModalProps {
  visible: boolean;
  onClose: () => void;
  creatorName: string;
  creatorId: string;
  reelId: string;
  onSupportSent?: () => void;
}

export default function SupportModal({
  visible,
  onClose,
  creatorName,
  creatorId,
  reelId,
  onSupportSent,
}: SupportModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<SupportPackage | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Default support packages
  const supportPackages: SupportPackage[] = [
    { id: "1", coins: 5, label: "5 Coins", price: 5 },
    { id: "2", coins: 10, label: "10 Coins", price: 10 },
    { id: "3", coins: 25, label: "25 Coins", price: 25 },
    { id: "4", coins: 50, label: "50 Coins", price: 50 },
  ];

  // Fetch wallet balance when modal opens
  useEffect(() => {
    if (visible) {
      fetchWalletBalance();
    }
  }, [visible]);

  const fetchWalletBalance = async () => {
    try {
      setLoading(true);
      const { userService } = await import("@/api/services/userService");

      const walletResult = await userService.getWalletBalance();
      if (walletResult.success && walletResult.data) {
        setWalletBalance(walletResult.data.balance || 0);
      }
    } catch (error) {
      console.error("[SupportModal] Error fetching wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get support amount
  const getSupportAmount = (): number => {
    if (customAmount) {
      return parseInt(customAmount) || 0;
    }
    return selectedPackage?.coins || 0;
  };

  const supportAmount = getSupportAmount();

  // Handle send support
  const handleSendSupport = async () => {
    if (supportAmount <= 0) {
      Alert.alert("Error", "Please select or enter a valid amount");
      return;
    }

    if (supportAmount > walletBalance) {
      Alert.alert(
        "Insufficient Balance",
        `You need ${supportAmount - walletBalance} more coins. Would you like to buy more?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Buy Coins",
            onPress: () => {
              onClose();
              // Would navigate to add-money screen
            },
          },
        ]
      );
      return;
    }

    try {
      setSending(true);
      const { paymentIntegrationService } = await import(
        "@/api/services/paymentIntegrationService"
      );

      const supportResult = await paymentIntegrationService.sendSupportPayment({
        recipientId: creatorId,
        reelId: reelId,
        amount: supportAmount,
        coins: supportAmount,
        message: message || undefined,
      });

      if (supportResult.success) {
        Alert.alert(
          "Success",
          `You sent ${supportAmount} coins to ${creatorName}! 🎉`,
          [
            {
              text: "OK",
              onPress: () => {
                onClose();
                if (onSupportSent) {
                  onSupportSent();
                }
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", supportResult.message || "Failed to send support");
      }
    } catch (error: any) {
      console.error("[SupportModal] Error sending support:", error);
      Alert.alert("Error", error.message || "Failed to send support");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Support {creatorName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {/* Wallet Balance Card */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Your Wallet Balance</Text>
                <Text style={styles.balanceAmount}>{walletBalance.toLocaleString()}</Text>
              </View>
              <Text style={styles.coinLabel}>GFI Coins</Text>
            </View>

            {/* Quick Packages */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Support Options</Text>
              <View style={styles.packagesGrid}>
                {supportPackages.map((pkg) => (
                  <TouchableOpacity
                    key={pkg.id}
                    style={[
                      styles.packageButton,
                      selectedPackage?.id === pkg.id && styles.packageButtonActive,
                      customAmount && styles.packageButtonDisabled,
                    ]}
                    onPress={() => {
                      setSelectedPackage(pkg);
                      setCustomAmount("");
                    }}
                    disabled={!!customAmount}
                  >
                    <Text
                      style={[
                        styles.packageCoins,
                        selectedPackage?.id === pkg.id && styles.packageCoinsActive,
                      ]}
                    >
                      {pkg.coins}
                    </Text>
                    <Text style={styles.packageLabel}>Coins</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Custom Amount */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Custom Amount</Text>
              <View style={styles.customInputContainer}>
                <TextInput
                  style={styles.customInput}
                  placeholder="Enter coin amount"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  value={customAmount}
                  onChangeText={(text) => {
                    setCustomAmount(text);
                    setSelectedPackage(null);
                  }}
                />
              </View>
            </View>

            {/* Message */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Message (Optional)</Text>
              <TextInput
                style={styles.messageInput}
                placeholder="Write a message..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                value={message}
                onChangeText={setMessage}
              />
            </View>

            {/* Support Info */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color="#EC9A15" />
              <Text style={styles.infoText}>
                Your support helps creators earn and grow! The creator will receive credits in their wallet.
              </Text>
            </View>

            {/* Summary */}
            {supportAmount > 0 && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Support Amount</Text>
                  <Text style={styles.summaryValue}>{supportAmount}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Your Balance After</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      {
                        color:
                          walletBalance - supportAmount >= 0 ? "#22C55E" : "#FF4444",
                      },
                    ]}
                  >
                    {(walletBalance - supportAmount).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Send Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!supportAmount || supportAmount > walletBalance || sending) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={handleSendSupport}
              disabled={!supportAmount || supportAmount > walletBalance || sending}
            >
              {sending ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.sendButtonText}>Sending...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="heart" size={20} color="#fff" />
                  <Text style={styles.sendButtonText}>
                    Send {supportAmount} Coins
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={sending}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#3C2610",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  balanceCard: {
    backgroundColor: "rgba(236, 154, 21, 0.15)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: "#EC9A15",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceLabel: {
    color: "#999",
    fontSize: 14,
  },
  balanceAmount: {
    color: "#EC9A15",
    fontSize: 24,
    fontWeight: "700",
  },
  coinLabel: {
    color: "#666",
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  packagesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  packageButton: {
    flex: 1,
    backgroundColor: "#252525",
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: "#444",
    alignItems: "center",
    justifyContent: "center",
  },
  packageButtonActive: {
    borderColor: "#EC9A15",
    backgroundColor: "rgba(236, 154, 21, 0.1)",
  },
  packageButtonDisabled: {
    opacity: 0.5,
  },
  packageCoins: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  packageCoinsActive: {
    color: "#EC9A15",
  },
  packageLabel: {
    color: "#666",
    fontSize: 12,
  },
  customInputContainer: {
    backgroundColor: "#252525",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#444",
    overflow: "hidden",
  },
  customInput: {
    color: "#fff",
    padding: 12,
    fontSize: 14,
  },
  messageInput: {
    backgroundColor: "#252525",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#444",
    color: "#fff",
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  infoCard: {
    backgroundColor: "rgba(236, 154, 21, 0.1)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    gap: 10,
  },
  infoText: {
    color: "#CCCCCC",
    fontSize: 13,
    flex: 1,
  },
  summaryCard: {
    backgroundColor: "#252525",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#444",
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    color: "#999",
    fontSize: 14,
  },
  summaryValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#444",
    gap: 12,
  },
  sendButton: {
    backgroundColor: "#EC9A15",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    backgroundColor: "#444",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

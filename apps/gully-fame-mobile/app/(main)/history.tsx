

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";

interface Transaction {
  id: string;
  title: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  date: string;
  time: string;
  icon: string;
  status?: string;
}

export default function HistoryScreen() {
  const [filter, setFilter] = useState<"all" | "credit" | "debit">("all");
  const [transactionData, setTransactionData] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch real wallet data and transaction history from backend
  const fetchWalletData = useCallback(async () => {
    try {
      setLoading(true);
      const { userService } = await import("@/api/services/userService");
      const { paymentIntegrationService } = await import("@/api/services/paymentIntegrationService");

      // Fetch wallet balance
      const walletResult = await userService.getWalletBalance();
      if (walletResult.success && walletResult.data) {
        setTotalBalance(walletResult.data.balance || 0);
      }

      // Fetch payment/transaction history
      const historyResult = await paymentIntegrationService.getPaymentHistory(10, 0);
      
      if (historyResult.success && Array.isArray(historyResult.data)) {
        const mappedTransactions = historyResult.data.map((tx: any, index: number) => {
          const txDate = new Date(tx.timestamp || new Date());
          return {
            id: tx.transactionId || tx.id || `tx_${index}`,
            title: tx.description || getTransactionTitle(tx.type),
            description: tx.notes || tx.remark || getTransactionDescription(tx),
            amount: Math.abs(tx.amount || 0),
            type: tx.type === "debit" || tx.amount < 0 ? "debit" : "credit",
            date: txDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
            time: txDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            icon: getTransactionIcon(tx.type, tx.description),
            status: tx.status,
          };
        });
        setTransactionData(mappedTransactions);
      } else {
        // If no transaction history, show empty state
        setTransactionData([]);
      }
    } catch (error) {
      console.error("[history] Error fetching wallet data:", error);
      setTransactionData([]);
      setTotalBalance(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchWalletData();
    }, [fetchWalletData])
  );

  // Helper function to get transaction title
  const getTransactionTitle = (type: string): string => {
    switch (type) {
      case "credit":
        return "Coins Earned";
      case "debit":
        return "Coins Spent";
      case "withdrawal":
        return "Withdrawal";
      default:
        return "Transaction";
    }
  };

  // Helper function to get transaction description
  const getTransactionDescription = (tx: any): string => {
    if (tx.competitionName) return `Won in ${tx.competitionName}`;
    if (tx.reelId) return `Support on reel`;
    if (tx.referralCode) return `Referral bonus`;
    if (tx.withdrawalMethod) return `Withdrawn to ${tx.withdrawalMethod}`;
    return "Transaction";
  };

  // Helper function to get transaction icon
  const getTransactionIcon = (type: string, description: string): string => {
    if (description?.includes("competition") || description?.includes("prize")) return "trophy-outline";
    if (description?.includes("reel") || description?.includes("support")) return "heart-outline";
    if (description?.includes("referral") || description?.includes("invite")) return "gift-outline";
    if (type === "debit") return "wallet-outline";
    return "checkmark-circle-outline";
  };

  const filteredTransactions = transactionData.filter((item) => {
    if (filter === "all") return true;
    return item.type === filter;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3C2610" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet & History</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#EC9A15" />
          <Text style={{ color: "#999", marginTop: 12 }}>Loading wallet data...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Wallet Card */}
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Total Available Balance</Text>
          <View style={styles.balanceRow}>
            <FontAwesome5 name="coins" size={28} color="#EC9A15" style={styles.coinIcon} />
            <Text style={styles.balanceAmount}>{totalBalance.toLocaleString()}</Text>
          </View>
          
          <View style={styles.walletActions}>
            <TouchableOpacity 
              style={styles.withdrawButton} 
              activeOpacity={0.8}
              onPress={() => router.push("/(main)/coins" as any)}
            >
              <MaterialIcons name="account-balance" size={20} color="#fff" />
              <Text style={styles.withdrawButtonText}>Withdraw</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.earnMoreButton} 
              onPress={() => router.push("/(main)/invite-friend" as any)} 
              activeOpacity={0.8}
            >
              <Ionicons name="gift" size={20} color="#EC9A15" />
              <Text style={styles.earnMoreText}>Earn More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterTab, filter === "all" && styles.activeFilterTab]} 
            onPress={() => setFilter("all")}
          >
            <Text style={[styles.filterText, filter === "all" && styles.activeFilterText]}>All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTab, filter === "credit" && styles.activeFilterTab]} 
            onPress={() => setFilter("credit")}
          >
            <Text style={[styles.filterText, filter === "credit" && styles.activeFilterText]}>Earned</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTab, filter === "debit" && styles.activeFilterTab]} 
            onPress={() => setFilter("debit")}
          >
            <Text style={[styles.filterText, filter === "debit" && styles.activeFilterText]}>Withdrawn</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => (
              <View key={tx.id} style={styles.transactionCard}>
                <View style={styles.txIconContainer}>
                  <Ionicons name={tx.icon as any} size={24} color="#EC9A15" />
                </View>
                
                <View style={styles.txDetails}>
                  <Text style={styles.txTitle}>{tx.title}</Text>
                  <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                  <Text style={styles.txDate}>{tx.date} • {tx.time}</Text>
                </View>
                
                <View style={styles.txAmountContainer}>
                  <Text style={[styles.txAmount, { color: tx.type === 'credit' ? '#25D366' : '#FF4444' }]}>
                    {tx.type === 'credit' ? '+' : '-'}{tx.amount.toLocaleString()}
                  </Text>
                  <Text style={styles.txCoinText}>Coins</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={50} color="#666" />
              <Text style={styles.emptyStateText}>
                {filter === "all" 
                  ? "No transactions yet" 
                  : `No ${filter === "credit" ? "earned" : "withdrawn"} transactions`}
              </Text>
            </View>
          )}
        </View>

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
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  walletCard: {
    backgroundColor: "#252525",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.4)",
    marginBottom: 24,
    alignItems: "center",
    shadowColor: "#EC9A15",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  walletLabel: {
    color: "#ccc",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  coinIcon: {
    marginRight: 10,
  },
  balanceAmount: {
    color: "#EC9A15",
    fontSize: 42,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  walletActions: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  withdrawButton: {
    flex: 1,
    backgroundColor: "#EC9A15",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  withdrawButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  earnMoreButton: {
    flex: 1,
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EC9A15",
    gap: 8,
  },
  earnMoreText: {
    color: "#EC9A15",
    fontSize: 15,
    fontWeight: "700",
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: "#252525",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
  activeFilterText: {
    color: "#fff",
  },
  transactionsContainer: {
    marginTop: 10,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  transactionCard: {
    flexDirection: "row",
    backgroundColor: "#252525",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.1)",
  },
  txIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(236, 154, 21, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  txDetails: {
    flex: 1,
    marginRight: 10,
  },
  txTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  txDesc: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 6,
  },
  txDate: {
    color: "#666",
    fontSize: 11,
  },
  txAmountContainer: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  txCoinText: {
    color: "#888",
    fontSize: 11,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    color: "#666",
    fontSize: 15,
    marginTop: 12,
  },
});
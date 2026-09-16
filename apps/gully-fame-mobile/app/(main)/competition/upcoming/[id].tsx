import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Alert,
  Animated,
  Platform,
  Linking,
  ActivityIndicator,
  LayoutAnimation,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackIcon, ShareIcon } from "@/icons";
import { apiClient } from "@/api";
import { getCompetitionById } from "@/api/services/competitionService";
import { upcomingCompetitionStyles as styles } from "@/styles/upcomingCompetitionStyles";
import { BASE_URL } from "@/api/axios";

const formatCurrency = (amount: number): string => {
  if (!amount) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
};

const formatPrizeBreakdown = (prizeAmount: number, winnerSlots: number = 1): Array<{ position: string; amount: string }> => {
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

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!targetDate) return;
      const target = new Date(targetDate);
      const now = new Date();
      const difference = target.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <View style={styles.countdownBox}>
      <Text style={styles.countdownTitle}>BATTLE BEGINS IN</Text>
      <View style={styles.countdownRow}>
        <View style={styles.timeBlock}><Text style={styles.timeValue}>{String(timeLeft.days).padStart(2, "0")}</Text><Text style={styles.timeLabel}>DAYS</Text></View>
        <Text style={styles.timeColon}>:</Text>
        <View style={styles.timeBlock}><Text style={styles.timeValue}>{String(timeLeft.hours).padStart(2, "0")}</Text><Text style={styles.timeLabel}>HRS</Text></View>
        <Text style={styles.timeColon}>:</Text>
        <View style={styles.timeBlock}><Text style={styles.timeValue}>{String(timeLeft.minutes).padStart(2, "0")}</Text><Text style={styles.timeLabel}>MIN</Text></View>
        <Text style={styles.timeColon}>:</Text>
        <View style={styles.timeBlock}><Text style={styles.timeValue}>{String(timeLeft.seconds).padStart(2, "0")}</Text><Text style={styles.timeLabel}>SEC</Text></View>
      </View>
    </View>
  );
};

const formatDateShort = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

export default function UpcomingCompetitionScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const competitionIdFromParams = String(params.id);

  const [competitionData, setCompetitionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);

  useEffect(() => {
    const fetchComp = async () => {
      try {
        setLoading(true);
        if (!competitionIdFromParams) return;
        const res = await getCompetitionById(competitionIdFromParams);
        if (res.success && res.data) {
          setCompetitionData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch upcoming competition details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComp();
  }, [competitionIdFromParams]);

  const toggleRules = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsRulesExpanded(!isRulesExpanded);
  };

  const handleJoinNow = () => {
    router.push({
      pathname: "/(main)/camera",
      params: {
        competitionId: competitionData._id,
        competitionName: competitionData.title,
        entryFee: competitionData.entryFee ? competitionData.entryFee.toString() : "0",
      },
    });
  };

  if (loading || !competitionData) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3C2610" />

      <View style={[styles.stickyBottomCTA, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {competitionData.is_current_user_joined ? (
          <View style={[styles.fullWidthButton, styles.disabledButton]}>
            <Text style={styles.disabledText}>✅ You are Registered!</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.fullWidthButton} onPress={handleJoinNow} activeOpacity={0.8}>
            <LinearGradient colors={["#FF0055", "#FF8C00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientFill}>
              <Text style={styles.ctaText}>⚔️ Enter the Battle</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}><BackIcon /></TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{competitionData.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={styles.compCardContainer}>
          <View style={styles.titleCard}>
            <View style={styles.compCardImageWrapper}>
              <Image source={competitionData.image ? { uri: `${BASE_URL}${competitionData.image}` } : require("@assets/images/trending2.png")} style={styles.titleCardImage} resizeMode="cover" />
              <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={styles.bannerGradient} />
              <View style={styles.upcomingBadge}><Text style={styles.upcomingBadgeText}>Upcoming</Text></View>
            </View>

            <View style={styles.titleCardContent}>
              <View style={styles.titleCardHeader}>
                <Text style={styles.compCardTitleNew}>{competitionData.title}</Text>
                <Text style={styles.compCardSubtitle}>{competitionData.category || "Competition"}</Text>
              </View>

              <View style={styles.heroPrizeContainer}>
                <Text style={styles.heroPrizeLabel}>TOTAL PRIZE POOL</Text>
                <Text style={styles.heroPrizeAmount}>{formatCurrency(competitionData.prizePool || 0)}</Text>
              </View>

              <View style={styles.specsRow}>
                <View style={styles.specBox}>
                  <View style={styles.specHeader}><Text style={styles.specIcon}>🎟️</Text><Text style={styles.specLabel}>Entry</Text></View>
                  {competitionData.entryFee ? (
                    <Text style={styles.specValue}>{formatCurrency(competitionData.entryFee)}</Text>
                  ) : (
                    <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>FREE</Text></View>
                  )}
                </View>
                <View style={styles.specVerticalDivider} />
                <View style={styles.specBox}>
                  <View style={styles.specHeader}><Text style={styles.specIcon}>📅</Text><Text style={styles.specLabel}>Starts On</Text></View>
                  <Text style={styles.specValue}>{formatDateShort(competitionData.startDate)}</Text>
                </View>
              </View>

              <CountdownTimer targetDate={competitionData.startDate} />

              <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
                <Text style={[styles.missionSectionTitle, { marginTop: 0 }]}>Loot Breakdown</Text>
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
              </View>

              {(competitionData.description || competitionData.rules) && (
                <TouchableOpacity style={styles.missionBriefingCard} activeOpacity={0.8} onPress={toggleRules}>
                  <View style={styles.missionHeader}>
                    <View style={styles.missionTitleRow}><Text style={styles.missionIcon}>📜</Text><Text style={styles.missionTitle}>Event Details</Text></View>
                    <Text style={styles.chevron}>{isRulesExpanded ? "▲" : "▼"}</Text>
                  </View>
                  {isRulesExpanded && (
                    <View style={styles.missionContent}>
                      <Text style={styles.missionSectionTitle}>About</Text>
                      <Text style={styles.missionText}>{competitionData.description}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  LayoutAnimation,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: "1",
    question: "What is GullyFame India and how does it work?",
    answer:
      "GullyFame India is a mobile-based platform that enables users to upload, view, share, and interact with user-generated content (including short videos, images, text posts, and comments). The App is governed by the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and other applicable Indian laws.",
  },
  {
    id: "2",
    question: "Who can use this App?",
    answer:
      "The App is intended for Indian residents who are at least 18 years of age or possess full legal capacity under law. The Company reserves the right to request proof of age at any time and shall not be liable for misrepresentation of age or identity.",
  },
  {
    id: "3",
    question: "What is required to register on GullyFame India?",
    answer:
      "To register, you must provide a valid mobile number or email address, create a secure password, and complete any required verification steps (such as OTP-based authentication). You warrant that all information provided is true, accurate, current, and complete. Fictitious, automated, or fraudulent registrations will result in immediate suspension or permanent deactivation of the account.",
  },
  {
    id: "4",
    question: "What are my legal responsibilities as a user?",
    answer:
      "As a user, you agree to use the App solely for lawful purposes and in full compliance with Indian criminal, cyber, data protection, and intellectual property laws. You explicitly agree not to:\n\n• Post, upload, or transmit any content that is defamatory, obscene, hateful, pornographic, violent, or illegal.\n• Impersonate any person or entity or misrepresent your affiliation.\n• Use the App to propagate terrorism, child sexual abuse material (CSAM), self-harm, dangerous activities, or any other unlawful activity.\n\nAny violation will lead to immediate content removal, account suspension, and reporting to law enforcement authorities.",
  },
  {
    id: "5",
    question: "What are the rules regarding AI-Generated Content and Deepfakes?",
    answer:
      "GullyFame India values authenticity and transparency:\n\n• Any content generated or modified using AI must be declared upon upload.\n• Any content created, modified, or enhanced using Artificial Intelligence (AI), deepfake technology, or manipulated media must be clearly labelled and disclosed prior to publishing.\n• Manipulating someone's face or voice without consent to deceive, defame, or commit fraud is strictly illegal under Indian law.\n• Unlabelled or harmful synthetic content will be removed immediately upon detection or reporting, and offending accounts may face permanent termination.",
  },
  {
    id: "6",
    question: "Are fake engagement, bot activities, or voting manipulation allowed?",
    answer:
      "No. GullyFame India strictly prohibits any form of artificial or manipulated engagement. Users, creators, and participants in platform competitions or leaderboards are prohibited from:\n\n• Using bots, automated software, or third-party services to generate fake likes, views, shares, or comments.\n• Creating multiple accounts to manipulate voting, contests, rankings, or rewards mechanisms.\n• Participating in coordinated engagement schemes or vote-tampering.\n\nAny attempt to manipulate rankings or competition outcomes will result in immediate disqualification, forfeiture of rewards, and account termination.",
  },
  {
    id: "7",
    question: "Can the App be used for commercial, sponsored, or promotional activities?",
    answer:
      "Commercial activity is permitted strictly within platform guidelines:\n\n• Creators and users posting sponsored posts, paid partnerships, affiliate links, or promotional material must clearly label such content and adhere to Indian consumer protection regulations and ASCI guidelines.\n• Unauthorized commercial solicitation, spam, phishing, malware distribution, fake reviews, misleading claims or advertising prohibited goods/services is strictly banned.\n• The Company reserves the right to block accounts or remove promotional content that violates these rules.",
  },
  {
    id: "8",
    question: "What are my Intellectual Property (IP) rights over the content I post?",
    answer:
      "• You retain full ownership and copyright of original content you create and upload to GullyFame India.\n• By uploading content, you grant GullyFame India a non-exclusive, worldwide, royalty-free, limited license to host, store, display, reproduce, modify, adapt, publish, and distribute your content solely for the technical operation, improvement, and promotion of the App and its services.\n• You warrant that you own or possess all necessary rights, licenses, and permissions for all content (including background music, imagery, and personal likenesses) uploaded.",
  },
  {
    id: "9",
    question: "How is user-generated content regulated and moderated?",
    answer:
      "GullyFame India operates as an intermediary under Indian Law. While we do not actively monitor every piece of content in real-time, we maintain robust automated and human moderation systems guided by our comprehensive Community Guidelines. We reserve the right to restrict, disable access to, or permanently remove any content that violates platform policies or statutory laws, and to report illegal acts to relevant authorities.",
  },
  {
    id: "10",
    question: "How is my personal data processed under the Digital Personal Data Protection Act, 2023 (DPDP)?",
    answer:
      "GullyFame India processes personal data in strict compliance with the Digital Personal Data Protection Act, 2023.\n\n• Data Collected: Device information, IP Addresses, location data, usage analytics, and user identifiers.\n• Purposes: Platform service delivery, account verification, analytics, security and statutory compliance.\n• User Rights: Users retain the right to access, update, correct, or request the deletion of their personal data and to withdraw consent at any time through App Settings, subject to operational and regulatory requirements.",
  },
];

export default function FAQScreen() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3C2610" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQs</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Frequently Asked Questions about GullyFame India
        </Text>

        {faqData.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.faqCard}
            onPress={() => toggleExpand(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.questionHeader}>
              <Text style={styles.questionText}>{item.question}</Text>
              <Ionicons
                name={expandedId === item.id ? "chevron-up" : "chevron-down"}
                size={24}
                color="#EC9A15"
              />
            </View>

            {expandedId === item.id && (
              <View style={styles.answerContainer}>
                <Text style={styles.answerText}>{item.answer}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Still have questions?</Text>
          <Text style={styles.contactText}>
            Contact our support team at support@gullyfame.com
          </Text>
        </View>

        <View style={{ height: 40 }} />
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
    paddingBottom: 40,
  },
  subtitle: {
    color: "#EC9A15",
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "500",
  },
  faqCard: {
    backgroundColor: "#252525",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.15)",
    overflow: "hidden",
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  questionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    marginRight: 10,
    lineHeight: 20,
  },
  answerContainer: {
    backgroundColor: "rgba(236, 154, 21, 0.05)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(236, 154, 21, 0.2)",
  },
  answerText: {
    color: "#ccc",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "justify",
  },
  contactSection: {
    backgroundColor: "rgba(236, 154, 21, 0.1)",
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.3)",
  },
  contactTitle: {
    color: "#EC9A15",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  contactText: {
    color: "#ccc",
    fontSize: 13,
    lineHeight: 20,
  },
});

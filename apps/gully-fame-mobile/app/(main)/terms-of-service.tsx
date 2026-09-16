import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TermsOfServiceScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3C2610" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Effective Date: September 2026</Text>

        <View style={styles.policyCard}>
          <Text style={styles.sectionHeading}>1. AGREEMENT AND SCOPE</Text>
          <Text style={styles.policyText}>
            These Terms of Service ("Terms") constitute a legally binding agreement between you and GullyFame India, a company incorporated under the laws of India ("we," "us," or "our"), governing your access to and use of the GullyFame India mobile application, website, software, features, content, tools, and related services (collectively, the "Platform").
          </Text>
          <Text style={styles.policyText}>
            By registering, accessing, browsing, or using the Platform, you agree to these Terms, the Privacy Policy and any additional terms displayed for a particular feature, competition, promotion, or creator programme. If you do not agree, you must not use the Platform.
          </Text>

          <Text style={styles.sectionHeading}>2. ELIGIBILITY, AGE AND ACCOUNTS</Text>
          <Text style={styles.policyText}>
            You must satisfy the age and other eligibility requirements applicable to the Platform. The Platform is not intended for children below 18 years.
          </Text>
          <Text style={styles.policyText}>
            You must provide accurate, complete and current information and must not impersonate another person or create an account for an unlawful or deceptive purpose.
          </Text>
          <Text style={styles.policyText}>
            You are responsible for your account credentials and activity occurring through your account. You must promptly notify us of suspected unauthorised access.
          </Text>

          <Text style={styles.sectionHeading}>3. PLATFORM RIGHTS AND OPERATIONAL DISCRETION</Text>
          <Text style={styles.policyText}>
            GullyFame may, at its discretion and subject to applicable law, add, modify, suspend, restrict, discontinue or replace any feature, service, interface, algorithm, ranking mechanism, creator programme, competition, reward, monetisation facility or commercial offering.
          </Text>
          <Text style={styles.policyText}>
            GullyFame does not guarantee that any feature will remain available, that content will receive a particular number of views or engagements, or that any user or creator will be selected, promoted, ranked, recommended, monetised or commercially successful.
          </Text>

          <Text style={styles.sectionHeading}>4. INTERMEDIARY STATUS AND NO LIABILITY</Text>
          <Text style={styles.policyText}>
            We are an intermediary as defined under the Information Technology Act, 2000 and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021. We do not control what you or other people may or may not do on the Platform and are thus, not responsible for the consequences of such actions (whether online or offline).
          </Text>
          <Text style={styles.policyText}>
            Our responsibility for anything that happens on our Platform is strictly governed by the laws of India and is limited to that extent. You agree that we will not be responsible for any loss of profits, revenues, information, or data, or consequential, special, indirect, exemplary, punitive, or incidental damages arising to you or any other person related to these Terms, even if we know they are possible.
          </Text>

          <Text style={styles.sectionHeading}>5. USER CONTENT – OWNERSHIP AND LICENCE</Text>
          <Text style={styles.policyText}>
            You retain ownership of content that you lawfully own and upload to the Platform ("Your Content"). GullyFame does not acquire ownership merely because you upload or publish Your Content.
          </Text>
          <Text style={styles.policyText}>
            By submitting, uploading, posting, streaming or otherwise making Your Content available, you grant GullyFame a worldwide, non-exclusive, royalty-free, transferable and sublicensable licence, for the maximum period permitted by law, to host, store, reproduce, process, adapt, edit, translate, format, publicly perform, publicly display, distribute, communicate, promote and otherwise use Your Content as reasonably necessary to operate, secure, improve, market and develop the Platform and its services.
          </Text>

          <Text style={styles.sectionHeading}>6. CONTENT REPRESENTATIONS AND CREATOR RESPONSIBILITY</Text>
          <Text style={styles.policyText}>
            You represent and warrant that you have all rights, permissions, licences and consents necessary for Your Content and its use by GullyFame under these Terms.
          </Text>
          <Text style={styles.policyText}>
            You are responsible for obtaining permissions relating to music, performances, images, brands, locations, third-party likenesses, confidential material and other rights contained in Your Content.
          </Text>
          <Text style={styles.policyText}>
            You must not upload content that infringes intellectual-property, privacy, publicity, contractual or other rights, or that violates applicable law or Platform policies.
          </Text>

          <Text style={styles.sectionHeading}>7. PROHIBITED CONDUCT</Text>
          <Text style={styles.policyText}>
            You must not use the Platform for fraud, deception, impersonation, harassment, stalking, abuse or unlawful discrimination; upload malware or harmful code; interfere with Platform operations; scrape or harvest data without written authorisation; reverse engineer except where legally permitted; access another account without authority; manipulate rankings, views, likes, followers, votes or competitions; use bots or automated engagement; conduct scams or unauthorised commercial solicitations; transmit unlawful, defamatory, threatening or obscene material; or otherwise violate applicable law or Platform rules.
          </Text>
          <Text style={styles.policyText}>
            GullyFame may investigate suspected violations and take action it considers reasonably appropriate, including content restriction, demonetisation, loss of rewards, removal, account limitation, suspension or termination.
          </Text>

          <Text style={styles.sectionHeading}>8. MODERATION, SAFETY AND ENFORCEMENT</Text>
          <Text style={styles.policyText}>
            GullyFame may use automated tools, human review and third-party systems to detect spam, fraud, abuse, unlawful content, copyright issues, manipulation, unsafe behaviour and other policy violations.
          </Text>
          <Text style={styles.policyText}>
            We may review, rank, label, restrict, age-gate, demonetise, remove or disable access to content and may preserve or disclose information where required or permitted by law.
          </Text>

          <Text style={styles.sectionHeading}>9. COMPETITIONS, CONTESTS, RANKINGS AND REWARDS</Text>
          <Text style={styles.policyText}>
            Competitions, contests, challenges, voting mechanisms, rankings, prizes and creator programmes are governed by their specific rules, which may include eligibility, deadlines, judging criteria, voting mechanics, verification, disqualification, tax, prize delivery and other conditions.
          </Text>
          <Text style={styles.policyText}>
            GullyFame may disqualify entries or withhold, cancel or recover rewards where there is suspected fraud, manipulation, cheating, breach of rules, ineligibility or other circumstances permitted by the applicable rules.
          </Text>

          <Text style={styles.sectionHeading}>10. MONETISATION, CREATOR EARNINGS AND PAYMENTS</Text>
          <Text style={styles.policyText}>
            Where monetisation is offered, eligibility, rates, revenue shares, minimum payout thresholds, deductions, taxes, payment schedules, verification requirements and payment methods may be specified in separate creator or payment terms.
          </Text>
          <Text style={styles.policyText}>
            GullyFame may change or discontinue monetisation programmes prospectively, subject to applicable law and any non-waivable contractual obligations.
          </Text>

          <Text style={styles.sectionHeading}>11. PRIVACY AND DATA</Text>
          <Text style={styles.policyText}>
            Use of personal data is governed by GullyFame's Privacy Policy. GullyFame may process information for account administration, service delivery, safety, fraud prevention, analytics, personalisation, support, legal compliance and other purposes described in the Privacy Policy, subject to applicable law.
          </Text>

          <Text style={styles.sectionHeading}>12. DISCLAIMER OF WARRANTIES</Text>
          <Text style={styles.policyText}>
            To the maximum extent permitted by law, the Platform is provided on an "as is" and "as available" basis. GullyFame does not warrant uninterrupted, error-free, secure or continuously available operation.
          </Text>
          <Text style={styles.policyText}>
            GullyFame does not guarantee the accuracy, completeness, legality, quality, suitability, availability or performance of user-generated content, third-party content, recommendations, rankings, advertising, creator opportunities or commercial outcomes.
          </Text>

          <Text style={styles.sectionHeading}>13. LIMITATION OF LIABILITY</Text>
          <Text style={styles.policyText}>
            To the maximum extent permitted by applicable law, GullyFame and its directors, officers, employees, agents, affiliates, licensors and service providers will not be liable for indirect, incidental, special, consequential, exemplary or punitive damages, or for loss of profits, revenue, goodwill, business opportunities, data or anticipated savings arising from or related to use of the Platform.
          </Text>

          <Text style={styles.sectionHeading}>14. SUSPENSION AND TERMINATION</Text>
          <Text style={styles.policyText}>
            You may stop using the Platform at any time and may delete your account where the relevant functionality is available.
          </Text>
          <Text style={styles.policyText}>
            GullyFame may suspend, restrict, demonetise or terminate access, with or without prior notice where permitted by law, if you breach these Terms, create safety or legal risk, engage in fraud or manipulation, misuse Platform systems, fail verification, or where action is reasonably necessary to protect users, GullyFame or third parties.
          </Text>

          <Text style={styles.sectionHeading}>15. GOVERNING LAW AND DISPUTES RESOLUTION</Text>
          <Text style={styles.policyText}>
            These Terms are governed by the laws of India, subject to mandatory rights and remedies available under applicable law.
          </Text>
          <Text style={styles.policyText}>
            The parties will first attempt in good faith to resolve a dispute through written notice and discussion. Any disputes shall be dealt in accordance with laws applicable and prevalent in India, where courts at New Delhi shall have exclusive jurisdiction to adjudicate and decide the same.
          </Text>

          <Text style={styles.sectionHeading}>16. CONTACT US</Text>
          <Text style={styles.policyText}>
            For any questions or concerns regarding these Terms of Service, please contact us at:
          </Text>
          <Text style={styles.emailText}>support@gullyfame.com</Text>
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
  lastUpdated: {
    color: "#EC9A15",
    fontSize: 13,
    marginBottom: 16,
    textAlign: "right",
    fontWeight: "500",
    paddingHorizontal: 4,
  },
  policyCard: {
    backgroundColor: "#252525",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.15)",
  },
  sectionHeading: {
    color: "#EC9A15",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  policyText: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
    textAlign: "justify",
  },
  emailText: {
    color: "#EC9A15",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    textDecorationLine: "underline",
  },
});

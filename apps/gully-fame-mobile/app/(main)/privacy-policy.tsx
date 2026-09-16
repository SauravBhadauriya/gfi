

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

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3C2610" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Effective Date: September 2026</Text>

        <View style={styles.policyCard}>
          <Text style={styles.sectionHeading}>1. INTRODUCTION</Text>
          <Text style={styles.policyText}>
            GullyFame India ("we," "us," "our," or the "Company") operates the GullyFame India mobile application and related services (collectively, the "Platform"). We respect your privacy and are committed to protecting personal data in accordance with applicable Indian law, including the Digital Personal Data Protection Act, 2023 ("DPDP Act"), the Information Technology Act, 2000 and applicable rules, and other applicable privacy, cybersecurity and intermediary requirements.
          </Text>
          <Text style={styles.policyText}>
            This Privacy Policy explains what personal data we collect, why we collect it, how we use and share it, how long we retain it, the choices and rights available to you, and how you can contact us.
          </Text>

          <Text style={styles.sectionHeading}>2. SCOPE</Text>
          <Text style={styles.policyText}>
            This Policy applies to personal data processed through the Platform, including the mobile application, websites, APIs, integrations, creator tools, competitions, payments, support channels and related services.
          </Text>

          <Text style={styles.sectionHeading}>3. INFORMATION WE COLLECT</Text>
          <Text style={styles.policyText}>
            We collect only information reasonably necessary for the purposes described in this Policy and as permitted by applicable law.
          </Text>
          <Text style={styles.subHeading}>3.1 Information You Provide:</Text>
          <Text style={styles.bulletPoint}>
            • Identity data: name, date of birth, gender and profile photograph
          </Text>
          <Text style={styles.bulletPoint}>
            • Contact data: mobile number, email address and address/city/state/PIN code
          </Text>
          <Text style={styles.bulletPoint}>
            • Account data: username, password and account-security information
          </Text>
          <Text style={styles.bulletPoint}>
            • User Content: photos, videos, audio, text posts, comments, messages and other content you upload or share
          </Text>
          <Text style={styles.bulletPoint}>
            • Communications: support requests, feedback, surveys and correspondence
          </Text>
          <Text style={styles.bulletPoint}>
            • Payment/KYC data: bank account details, IFSC, UPI ID, payment information and government identification such as PAN or other permitted KYC information
          </Text>

          <Text style={styles.subHeading}>3.2 Information Collected Automatically:</Text>
          <Text style={styles.policyText}>
            We may collect device and technical information such as device model, operating-system version, app version, identifiers, IP address, logs, crash reports, performance information, timestamps and security signals. We may collect location data only where enabled by you, required for a feature, or otherwise permitted by law.
          </Text>

          <Text style={styles.subHeading}>3.3 Information From Third Parties:</Text>
          <Text style={styles.policyText}>
            We may receive information from connected accounts, payment providers, KYC providers, fraud-prevention services, analytics providers, business partners and other lawful sources, subject to applicable law and the permissions or consents required.
          </Text>

          <Text style={styles.sectionHeading}>4. PURPOSES OF PROCESSING</Text>
          <Text style={styles.policyText}>
            We may process personal data to:
          </Text>
          <Text style={styles.bulletPoint}>
            • Create and manage accounts
          </Text>
          <Text style={styles.bulletPoint}>
            • Authenticate users and recover accounts
          </Text>
          <Text style={styles.bulletPoint}>
            • Provide, maintain and improve the Platform
          </Text>
          <Text style={styles.bulletPoint}>
            • Personalise feeds, recommendations and features
          </Text>
          <Text style={styles.bulletPoint}>
            • Enable creator tools, competitions, rewards, tipping, commerce and payouts
          </Text>
          <Text style={styles.bulletPoint}>
            • Process payments, refunds, KYC and tax-related requirements
          </Text>
          <Text style={styles.bulletPoint}>
            • Communicate service updates, security alerts and support responses
          </Text>
          <Text style={styles.bulletPoint}>
            • Detect fraud, spam, abuse, manipulation and security threats
          </Text>
          <Text style={styles.bulletPoint}>
            • Moderate and protect the Platform and its community
          </Text>
          <Text style={styles.bulletPoint}>
            • Analyse usage, troubleshoot and develop products
          </Text>
          <Text style={styles.bulletPoint}>
            • Comply with applicable law, court orders and lawful government requests
          </Text>

          <Text style={styles.sectionHeading}>5. LAWFUL BASIS AND CONSENT</Text>
          <Text style={styles.policyText}>
            We process personal data on the basis permitted by applicable law, including consent where required, specified legitimate uses/lawful purposes where available, compliance with legal obligations, and other permitted grounds. Where consent is required, we will provide an appropriate notice and seek consent in a manner required by law.
          </Text>
          <Text style={styles.policyText}>
            You may withdraw consent where processing is based on consent. Withdrawal may affect features that require that processing.
          </Text>

          <Text style={styles.sectionHeading}>6. DATA SECURITY</Text>
          <Text style={styles.policyText}>
            We implement reasonable and appropriate technical and organisational safeguards designed to protect personal data against unauthorised access, alteration, disclosure, loss, misuse and destruction. Measures may include encryption in transit and at rest where appropriate, access controls, authentication, logging, monitoring, vulnerability management, incident response and vendor due diligence.
          </Text>
          <Text style={styles.policyText}>
            No electronic system is completely secure. Users are responsible for protecting their passwords, devices and account credentials and should promptly report suspected unauthorised access.
          </Text>

          <Text style={styles.sectionHeading}>7. DATA SHARING AND DISCLOSURE</Text>
          <Text style={styles.policyText}>
            We may share personal data with:
          </Text>
          <Text style={styles.bulletPoint}>
            • Hosting, cloud, analytics, moderation, customer-support, payment, KYC and security service providers acting on our behalf
          </Text>
          <Text style={styles.bulletPoint}>
            • Affiliates where permitted and necessary for operations
          </Text>
          <Text style={styles.bulletPoint}>
            • Business partners for features you choose to use, subject to applicable requirements
          </Text>
          <Text style={styles.bulletPoint}>
            • Advertising or measurement providers as permitted by law
          </Text>
          <Text style={styles.bulletPoint}>
            • Law-enforcement, regulators, courts or government authorities where legally required or permitted
          </Text>

          <Text style={styles.sectionHeading}>8. DATA RETENTION</Text>
          <Text style={styles.policyText}>
            We retain personal data only for as long as reasonably necessary for the purposes for which it was collected, for the operation and security of the Platform, and for applicable legal, tax, accounting, fraud-prevention, dispute-resolution and enforcement requirements.
          </Text>
          <Text style={styles.policyText}>
            When retention is no longer necessary and no legal exception applies, we will delete or anonymise the relevant personal data.
          </Text>

          <Text style={styles.sectionHeading}>9. USER RIGHTS</Text>
          <Text style={styles.policyText}>
            Subject to applicable law, users may have rights to access information about processing, request correction or updating, request erasure where applicable, withdraw consent where consent is the basis, and raise grievances with GullyFame and/or the competent authority as provided by law.
          </Text>
          <Text style={styles.policyText}>
            Requests should be made through the contact details below. We may need to verify identity before completing a request and may decline or limit a request where permitted by law.
          </Text>

          <Text style={styles.sectionHeading}>10. GRIEVANCE OFFICER AND CONTACT</Text>
          <Text style={styles.policyText}>
            For privacy-related queries, complaints, or requests, contact:
          </Text>
          <Text style={styles.emailText}>privacy@gullyfame.com</Text>
          <Text style={styles.policyText}>
            GullyFame India will acknowledge and address grievances within timelines prescribed by applicable law.
          </Text>

          <Text style={styles.sectionHeading}>11. CHANGES TO THIS POLICY</Text>
          <Text style={styles.policyText}>
            We may update this Policy to reflect changes in law, technology, Platform Features or business practices. Where required, we will provide notice of material changes and obtain consent where legally necessary.
          </Text>

          <Text style={styles.sectionHeading}>12. GOVERNING LAW</Text>
          <Text style={styles.policyText}>
            This Policy is intended to operate under the laws of India and applicable rules and regulations. Any dispute relating specifically to privacy will be handled in accordance with applicable law and the Platform's Terms of Use.
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
  subHeading: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
  },
  policyText: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
    textAlign: "justify",
  },
  bulletPoint: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 10,
    marginBottom: 6,
  },
  emailText: {
    color: "#EC9A15",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    textDecorationLine: "underline",
  },
});
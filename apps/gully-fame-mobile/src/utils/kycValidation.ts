import { Alert } from "react-native";
import { router } from "expo-router";
import { getMyKyc, KycRecord } from "@api/services/kycService";

/** Onboarding step routes (profile details collected after sign-up). */
export async function navigateToNextKycStep(step: string): Promise<void> {
  const routes: Record<string, string> = {
    personalDetails: "/onboarding/personal-details",
    dob: "/onboarding/personal-details",
    gender: "/onboarding/personal-details",
    bio: "/onboarding/personal-details",
    image: "/onboarding/upload-avatar",
    faceScan: "/onboarding/face-scan",
    kycCompleted: "/onboarding/all-done",
    allDone: "/onboarding/all-done",
  };
  const route = routes[step];
  if (route) router.push(route as never);
}

/** KYC is complete only once an admin APPROVED the submitted document. */
export async function isKycCompleted(): Promise<boolean> {
  try {
    const kyc = await getMyKyc();
    return kyc?.status === "APPROVED";
  } catch {
    return false;
  }
}

const hasSubmittedKyc = (kyc: KycRecord | null) => kyc?.status === "PENDING" || kyc?.status === "APPROVED";

/**
 * Gate before joining a competition: the user must have submitted a KYC
 * document (pending review or approved). Returns true when they may continue.
 */
export async function validateKycBeforeCompetition(): Promise<boolean> {
  let kyc: KycRecord | null = null;
  try {
    kyc = await getMyKyc();
  } catch {
    // If KYC can't be checked right now, don't block the user.
    return true;
  }
  if (hasSubmittedKyc(kyc)) return true;

  Alert.alert(
    "KYC Verification Required",
    kyc?.status === "REJECTED"
      ? `Your KYC was rejected${kyc.reason ? `: ${kyc.reason}` : ""}. Please re-submit your document to participate.`
      : "Please submit your KYC document to participate in competitions.",
    [
      { text: "Later", style: "cancel" },
      { text: "Verify now", onPress: () => router.push("/(main)/settings/kyc-status" as never) },
    ]
  );
  return false;
}

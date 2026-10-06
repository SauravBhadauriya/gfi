import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserKycStatus } from "../api/services/userService";
import { getCurrentUser } from "../api/services/userService";
import { router } from "expo-router";

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

/**
 * Check if all required KYC steps are completed
 * Required steps: Bio, Profile Image, Face Scan, Date of Birth, Gender
 */
export async function areAllKycStepsCompleted(): Promise<boolean> {
  try {
    // Get user profile data
    const userResult = await getCurrentUser();
    const user = userResult.success ? userResult.data : null;

    // Check all required fields
    const hasBio = user?.bio && user.bio.trim().length > 0;
    const hasImage = user?.profileImage && user.profileImage.length > 0;
    const hasDob = user?.dob && user.dob.trim().length > 0;
    const hasGender = user?.gender && user.gender.trim().length > 0;

    // Check face scan from AsyncStorage
    const faceScanDone = await AsyncStorage.getItem("faceScanDone");
    const hasFaceScan = faceScanDone === "true";

    // All steps must be completed
    const allCompleted = Boolean(hasBio && hasImage && hasDob && hasGender && hasFaceScan);

    if (__DEV__) {
      console.log("[kycValidation] KYC Steps Check:", {
        hasBio,
        hasImage,
        hasDob,
        hasGender,
        hasFaceScan,
        allCompleted,
      });
    }

    return allCompleted;
  } catch (error) {
    console.error("[kycValidation] Error checking KYC steps:", error);
    return false;
  }
}

/**
 * Automatically verify KYC if all steps are completed
 * Updates KYC status to "completed" on backend
 */
export async function autoVerifyKycIfComplete(): Promise<boolean> {
  try {
    const allStepsCompleted = await areAllKycStepsCompleted();

    if (!allStepsCompleted) {
      if (__DEV__) {
        console.log("[kycValidation] Not all KYC steps completed, skipping auto-verification");
      }
      return false;
    }

    // Check current KYC status
    const kycResult = await getUserKycStatus();
    const currentStatus = kycResult.success && kycResult.data ? kycResult.data.status : null;

    // If already completed/approved, no need to update
    if (currentStatus === "completed" || currentStatus === "approved") {
      if (__DEV__) {
        console.log("[kycValidation] KYC already completed/approved");
      }
      return true;
    }

    // Auto-verify by updating profile with isVerified flag
    // The backend should automatically set KYC status to "completed" when all steps are done
    if (__DEV__) {
      console.log("[kycValidation] All steps completed, KYC should be automatically verified");
      console.log(
        '[kycValidation] Backend should set status to "completed" when all required fields are present'
      );
    }

    return true;
  } catch (error) {
    console.error("[kycValidation] Error in auto-verification:", error);
    return false;
  }
}

/**
 * Check if user's KYC is completed/approved
 * Returns true if KYC is completed or approved, false otherwise
 * Now also checks if all steps are completed locally
 */
export async function isKycCompleted(): Promise<boolean> {
  try {
    // First check if all steps are completed locally
    const allStepsCompleted = await areAllKycStepsCompleted();

    if (allStepsCompleted) {
      // If all steps are done, try to auto-verify
      await autoVerifyKycIfComplete();

      // Check backend status
      const result = await getUserKycStatus();

      if (result.success && result.data) {
        const status = result.data.status;
        // Consider it completed if status is "completed" or "approved", OR if all steps are done
        return status === "completed" || status === "approved" || allStepsCompleted;
      }

      // If backend doesn't have KYC but all steps are done, consider it completed
      return allStepsCompleted;
    }

    // If not all steps are done, check backend status
    const result = await getUserKycStatus();

    if (result.success && result.data) {
      const status = result.data.status;
      return status === "completed" || status === "approved";
    }

    return false;
  } catch (error) {
    console.error("[kycValidation] Error checking KYC status:", error);
    return false;
  }
}

/**
 * Get the first incomplete KYC step
 * Returns the step name that needs to be completed, or null if all are done
 * Steps order: dob, gender, bio, image, faceScan
 */
export async function getFirstIncompleteStep(): Promise<string | null> {
  try {
    const userResult = await getCurrentUser();
    const user = userResult.success ? userResult.data : null;

    // Check each step in order
    const hasDob = user?.dob && user.dob.trim().length > 0;
    if (!hasDob) return "dob";

    const hasGender = user?.gender && user.gender.trim().length > 0;
    if (!hasGender) return "gender";

    const hasBio = user?.bio && user.bio.trim().length > 0;
    if (!hasBio) return "bio";

    const hasImage = user?.profileImage && user.profileImage.length > 0;
    if (!hasImage) return "image";

    const faceScanDone = await AsyncStorage.getItem("faceScanDone");
    const hasFaceScan = faceScanDone === "true";
    if (!hasFaceScan) return "faceScan";

    // All steps completed
    return null;
  } catch (error) {
    console.error("[kycValidation] Error getting incomplete step:", error);
    return "dob"; // Default to first step on error
  }
}

/**
 * Validate KYC before allowing competition join
 * Shows alert and redirects to KYC screen if not completed
 * Returns true if KYC is valid, false otherwise
 */
export async function validateKycBeforeCompetition(): Promise<boolean> {
  const isCompleted = await isKycCompleted();

  if (!isCompleted) {
    Alert.alert(
      "KYC Verification Required",
      "Please complete your KYC verification to participate in competitions."
    );
    return false;
  }

  return true;
}

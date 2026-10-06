import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthToken } from "@api/axios";

export interface UserData {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  mobile: string;
  role: string;
}

export interface UserSession {
  token: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  role: string;
  profileCompleted: boolean;
}

export const saveUserSession = async (
  token: string,
  userData: UserData | null | undefined,
  fallbackEmail?: string,
  fallbackMobile?: string
): Promise<void> => {
  try {
    if (__DEV__) {
      console.log("\n💾 ========== SAVING USER SESSION ==========");
      console.log("Token:", token ? "Received" : "Missing");
      console.log("User Data:", JSON.stringify(userData, null, 2));
      console.log("Fallback Email:", fallbackEmail);
      console.log("Fallback Mobile:", fallbackMobile);
      console.log("==========================================\n");
    }

    await setAuthToken(token);
    await AsyncStorage.setItem("isLoggedIn", "true");

    // Extract userId - try multiple field names
    let userId = userData?.id || (userData as any)?._id || "";

    // If we still don't have userId, try to fetch it from the profile endpoint
    if (!userId) {
      if (__DEV__) {
        console.log("⚠️ No userId found in userData, attempting to fetch from profile endpoint");
      }
      try {
        const { authService } = await import("@api/services/authService");
        const profileResult = await authService.getUserProfile();
        if (profileResult.success && profileResult.data) {
          userId = profileResult.data.id || (profileResult.data as any)._id || "";
          if (__DEV__) {
            console.log("✅ Retrieved userId from profile endpoint:", userId);
          }
        }
      } catch (profileError) {
        if (__DEV__) {
          console.log("⚠️ Could not fetch profile, continuing with empty userId");
        }
      }
    }

    const sessionData: UserSession = {
      token: token,
      userId: userId,
      firstName: userData?.firstName || "",
      lastName: userData?.lastName || "",
      email: userData?.email || fallbackEmail || "",
      mobile: userData?.mobile || fallbackMobile || "",
      role: userData?.role || "participant",
      profileCompleted: !!(
        userData?.firstName &&
        userData?.lastName &&
        (userData?.email || fallbackEmail)
      ),
    };

    if (__DEV__) {
      if (!sessionData.firstName || !sessionData.lastName) {
        console.log("⚠️ ========== USER PROFILE INCOMPLETE ==========");
        console.log("Missing firstName/lastName from OTP login");
        console.log("This happens because OTP verification API only returns token + userId");
        console.log(
          'The /users/profile endpoint is not returning user data (returns "Hello from main")'
        );
        console.log("Solution: Backend needs to either:");
        console.log(
          "  1. Return full user object in OTP verification response (like password login)"
        );
        console.log("  2. Implement /users/profile endpoint to return user data");
        console.log("For now, only email/mobile will be stored from OTP login");
        console.log("User can complete profile later or use password login to get full data");
        console.log("==========================================");
      }
    }

    if (__DEV__) {
      console.log("\n📦 ========== SESSION DATA TO STORE ==========");
      console.log("Complete Session Object:", JSON.stringify(sessionData, null, 2));
      console.log("==========================================\n");
    }

    const backendRole =
      sessionData.role === "participant"
        ? "participants"
        : sessionData.role === "fan"
          ? "fan"
          : "participants";

    await AsyncStorage.multiSet([
      ["authToken", token],
      ["isLoggedIn", "true"],
      ["userRole", backendRole],
      ["userEmail", sessionData.email],
      ["userFirstName", sessionData.firstName],
      ["userLastName", sessionData.lastName],
      ["userMobile", sessionData.mobile],
      ["profileCompleted", "true"],
    ]);

    if (userData?.id) {
      await AsyncStorage.setItem("userId", userData.id);
    }

    if (__DEV__) {
      console.log("✅ User session saved successfully to AsyncStorage");
      console.log("All login methods now use the same unified storage function");
    }

    const userDateOfBirth = await AsyncStorage.getItem("userDateOfBirth");
    const userGender = await AsyncStorage.getItem("userGender");
    const userProfileImage = await AsyncStorage.getItem("userProfileImage");
    const userBio = await AsyncStorage.getItem("userBio");
    const userRole = await AsyncStorage.getItem("userRole");

    if (userDateOfBirth || userGender || userProfileImage || userBio || userRole) {
      if (__DEV__) {
        console.log("\n💾 ========== SYNCING DOB AND GENDER TO BACKEND ==========");
        console.log("Found DOB/Gender in AsyncStorage from onboarding");
        console.log("Syncing to backend via PUT /user/profile");
        console.log("DOB:", userDateOfBirth);
        console.log("Gender:", userGender);
        console.log("==========================================\n");
      }

      try {
        const { authService } = await import("@api/services/authService");

        let profileImageToUpload = undefined;
        if (userProfileImage && userProfileImage.trim() !== "") {
          if (userProfileImage.startsWith("data:")) {
            profileImageToUpload = userProfileImage;
          } else if (
            userProfileImage.startsWith("http://") ||
            userProfileImage.startsWith("https://") ||
            userProfileImage.startsWith("file://")
          ) {
            try {
              const { readAsStringAsync } = await import("expo-file-system/legacy");
              const base64 = await readAsStringAsync(userProfileImage, {
                encoding: "base64" as any,
              });
              profileImageToUpload = `data:image/jpeg;base64,${base64}`;
            } catch (error) {
              if (__DEV__) {
                console.log("⚠️ Could not convert profile image to base64, skipping image upload");
                console.log("Error:", error);
              }
            }
          } else {
            profileImageToUpload = userProfileImage;
          }
        }

        const backendRole =
          userRole === "participant" ? "participants" : userRole === "fan" ? "fan" : undefined;

        const updateData: any = {
          dob: userDateOfBirth || undefined,
          gender: userGender || undefined,
          bio: userBio || undefined,
          profileImage: profileImageToUpload,
        };

        if (backendRole) {
          updateData.role = backendRole;
        }

        const updateResult = await authService.updateProfile(updateData);

        if (updateResult.success) {
          if (__DEV__) {
            console.log("✅ DOB and Gender synced to backend successfully");
          }
        } else {
          if (__DEV__) {
            console.log("⚠️ Failed to sync DOB/Gender to backend, but continuing");
            console.log("Error:", updateResult.error);
            console.log("Data is still saved locally, will retry later");
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.error("❌ Error syncing DOB/Gender to backend:", error);
          console.log("Data is still saved locally, will retry later");
        }
      }
    }
  } catch (error) {
    console.error("❌ Failed to save user session:", error);
    throw error;
  }
};

export const getUserSession = async (): Promise<UserSession | null> => {
  try {
    const [
      token,
      isLoggedIn,
      userId,
      userRole,
      userEmail,
      userFirstName,
      userLastName,
      userMobile,
      profileCompleted,
    ] = await AsyncStorage.multiGet([
      "authToken",
      "isLoggedIn",
      "userId",
      "userRole",
      "userEmail",
      "userFirstName",
      "userLastName",
      "userMobile",
      "profileCompleted",
    ]);

    if (isLoggedIn[1] !== "true" || !token[1]) {
      return null;
    }

    return {
      token: token[1] || "",
      userId: userId[1] || "",
      firstName: userFirstName[1] || "",
      lastName: userLastName[1] || "",
      email: userEmail[1] || "",
      mobile: userMobile[1] || "",
      role: userRole[1] || "participant",
      profileCompleted: profileCompleted[1] === "true",
    };
  } catch (error) {
    console.error("❌ Failed to get user session:", error);
    return null;
  }
};

// Shared hooks for profile screens - Easy API integration later
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "@api/services/authService";
import { userService } from "@api/services/userService";

export interface ProfileData {
  firstName: string;
  lastName: string;
  bio: string;
  threeWords?: string;
  profileImage: string | null;
  role: string;
  isVerified: boolean;
  competitionCount: number;
  levelPercentage: number;
  xLink: string;
  instagramLink: string;
  // Additional fields for participant profile
  rank?: number;
  currentRank?: number;
  nextRank?: number;
  competitionsParticipated?: number;
  competitionsRequiredForNextRank?: number;
  achievements?: Array<{id: string; name: string}>;
  email?: string;
}

// Hook for loading own profile data (with API integration)
export function useOwnProfile() {
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    bio: "",
    profileImage: null,
    role: "",
    isVerified: false,
    competitionCount: 0,
    levelPercentage: 0,
    xLink: "",
    instagramLink: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadUserData = useCallback(async () => {
    try {
      // First, load from AsyncStorage immediately (fast, cached data)
      const [
        userFirstName,
        userLastName,
        userBio,
        userThreeWords,
        userProfileImage,
        userRole,
        userInstagram,
        userXLink,
      ] = await Promise.all([
        AsyncStorage.getItem("userFirstName"),
        AsyncStorage.getItem("userLastName"),
        AsyncStorage.getItem("userBio"),
        AsyncStorage.getItem("userThreeWords"),
        AsyncStorage.getItem("userProfileImage"),
        AsyncStorage.getItem("userRole"),
        AsyncStorage.getItem("userInstagram"),
        AsyncStorage.getItem("userXLink"),
      ]);

      // Set cached data immediately to prevent flash
      setProfileData((prev) => ({
        ...prev,
        firstName: userFirstName || "",
        lastName: userLastName || "",
        bio: userBio || "",
        threeWords: userThreeWords || undefined,
        profileImage: userProfileImage || null,
        role: userRole || "",
        instagramLink: userInstagram || "",
        xLink: userXLink || "",
      }));

      setIsLoading(false);

      // Then fetch from API in the background (non-blocking)
      authService
        .getUserProfile()
        .then((profileResult) => {
          if (profileResult.success && profileResult.data) {
            const userData = profileResult.data;

            // Get userId from backend response
            const userId = userData.id || (userData as any)._id || "";

            // Check if user is verified (all required fields present)
            const hasAllRequiredFields = !!(
              userData.firstName &&
              userData.lastName &&
              userData.email &&
              userData.mobile &&
              userData.profileImage &&
              userData.role &&
              userData.gender &&
              userData.dob
            );

            // Use functional state update
            setProfileData((prev) => {
              // Preserve social links if API doesn't return them
              const finalInstagram = (userData as any).instagramLink || (userData as any).instagram || prev.instagramLink;
              const finalXLink = (userData as any).xLink || prev.xLink;
              const finalBio = userData.bio || prev.bio;
              const finalThreeWords = (userData as any).threeWords || prev.threeWords || "";

              // Update cache with fresh API data
              const cacheUpdates: Array<[string, string]> = [
                ["userFirstName", userData.firstName || ""],
                ["userLastName", userData.lastName || ""],
                ["userProfileImage", userData.profileImage || ""],
                ["userBio", finalBio],
                ["userThreeWords", finalThreeWords],
                ["userRole", userData.role || ""],
                ["userInstagram", finalInstagram],
                ["userXLink", finalXLink],
              ];
              
              if (userId) {
                cacheUpdates.push(["userId", userId]);
              }
              
              AsyncStorage.multiSet(cacheUpdates).catch((err) => console.error("Error updating cache:", err));

              return {
                firstName: userData.firstName || "",
                lastName: userData.lastName || "",
                bio: finalBio,
                threeWords: finalThreeWords || undefined,
                profileImage: userData.profileImage || null,
                role: userData.role || "",
                isVerified: hasAllRequiredFields || (userData as any).isVerified === true,
                competitionCount: (userData as any).competitionCount || 0,
                levelPercentage: (userData as any).levelPercentage || 0,
                xLink: finalXLink,
                instagramLink: finalInstagram,
              };
            });
          }
        })
        .catch((error) => {
          console.error("Error fetching profile from API:", error);
        });
    } catch (error) {
      console.error("Error loading user data:", error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, []);

  return {
    profileData,
    setProfileData,
    isLoading,
    reloadProfile: loadUserData,
  };
}

// Hook for loading other user's profile data (with API integration)
export function useOtherUserProfile(params?: any) {
  // Extract stable values from params
  const userId = (params?.userId as string) || (params?.id as string) || "";

  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    bio: "",
    profileImage: null,
    role: "",
    isVerified: false,
    competitionCount: 0,
    levelPercentage: 0,
    xLink: "",
    instagramLink: "",
  });
  const [isLoading, setIsLoading] = useState(!!userId);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    // Fetch from API
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const result = await userService.getPublicUserProfile(userId);
        
        if (result.success && result.data) {
          const userData = result.data;
          
          // Check if user is verified
          const hasAllRequiredFields = !!(
            userData.firstName &&
            userData.lastName &&
            userData.email &&
            userData.mobile &&
            userData.profileImage &&
            userData.role &&
            userData.gender &&
            userData.dob
          );

          setProfileData({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            bio: userData.bio || "",
            profileImage: userData.profileImage || null,
            role: userData.role || "",
            isVerified: hasAllRequiredFields || (userData as any).isVerified === true,
            competitionCount: (userData as any).competitionCount || 0,
            levelPercentage: (userData as any).levelPercentage || 0,
            xLink: (userData as any).xLink || "",
            instagramLink: (userData as any).instagramLink || (userData as any).instagram || "",
          });
        }
      } catch (error) {
        console.error("Error fetching public profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  return { profileData, setProfileData, isLoading };
}

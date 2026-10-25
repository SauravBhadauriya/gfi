import { router } from "expo-router";

/**
 * Opens a user's profile. There is no "get user by id" endpoint, so whatever
 * the caller already knows about the user (from a reel, search result or
 * leaderboard row) travels with the navigation and seeds the profile header.
 */
export function openUserProfile(user: {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  username?: string;
  avatar?: string;
  role?: string;
}) {
  if (!user.id) return;
  let firstName = user.firstName || "";
  let lastName = user.lastName || "";
  if (!firstName && !lastName && user.name) {
    const [first, ...rest] = user.name.trim().split(/\s+/);
    firstName = first || "";
    lastName = rest.join(" ");
  }
  router.push({
    pathname: "/(main)/profile/[id]",
    params: {
      id: user.id,
      userId: user.id,
      firstName,
      lastName,
      username: user.username || "",
      avatar: user.avatar || "",
      role: user.role || "",
    },
  } as any);
}

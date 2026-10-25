import { showToast } from "@components/ui/Toast";

/**
 * Every content endpoint (home, reels, competitions, search) requires a
 * signed-in user, so browsing without an account is not possible yet.
 */
export function showGuestModeUnavailable() {
  showToast("Browsing without an account isn't available yet. Please sign in or create an account.", "info");
}

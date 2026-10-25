import { router } from "expo-router";
import { getCompetitionDetails } from "@api/services/competitionService";
import { normalizeCompetitionStatus } from "@api/services/searchService";
import { getErrorMessage } from "@api/client";
import { toastError } from "@components/ui/Toast";

const ROUTES = {
  LIVE: "/(main)/competition/live/[id]",
  UPCOMING: "/(main)/competition/upcoming/[id]",
  ENDED: "/(main)/competition/past/[id]",
} as const;

/**
 * Opens the right competition screen for its status. Pass the status when the
 * caller already knows it; otherwise GET /competitions/:id decides.
 */
export async function openCompetition(competitionId: string, knownStatus?: string) {
  if (!competitionId) return;
  let status = knownStatus ? normalizeCompetitionStatus(knownStatus) : undefined;
  if (!status) {
    try {
      status = (await getCompetitionDetails(competitionId)).status;
    } catch (error) {
      toastError(getErrorMessage(error));
      return;
    }
  }
  if (status === "CANCELLED") {
    toastError("This competition was cancelled.");
    return;
  }
  router.push({ pathname: ROUTES[status], params: { id: competitionId } } as any);
}

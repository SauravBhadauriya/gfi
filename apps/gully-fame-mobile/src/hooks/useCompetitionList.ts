import { useCallback, useEffect, useState } from "react";
import {
  getCompetitionDetails,
  getLiveMatrix,
  listCompetitionsByStatus,
  CompetitionStatus,
} from "@/api/services/competitionService";
import { getErrorMessage } from "@/api/client";

export interface CompetitionCard {
  id: string;
  title: string;
  image: string;
  prize: number;
  participants: number;
  entries: number;
  startDate: string;
  endDate: string;
  entryFee: number;
  winnerName: string;
  totalViews: number;
}

const MAX_DETAILS = 20;

/**
 * Competitions for one status.
 * LIVE comes from GET /feed/matrix (has end date and entry count).
 * UPCOMING / ENDED come from GET /search?type=competitions, then each card is
 * filled in from GET /competitions/:id (dates, entry fee, winner).
 */
export function useCompetitionList(status: Exclude<CompetitionStatus, "CANCELLED">) {
  const [items, setItems] = useState<CompetitionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (status === "LIVE") {
        const cards: CompetitionCard[] = [];
        for (let page = 1; page <= 5; page++) {
          const res = await getLiveMatrix(page, 10);
          for (const c of res.competitions) {
            cards.push({
              id: c._id,
              title: c.title,
              image: "",
              prize: c.prize || 0,
              participants: 0,
              entries: c.totalEntries,
              startDate: "",
              endDate: c.endDate,
              entryFee: 0,
              winnerName: "",
              totalViews: 0,
            });
          }
          if (!res.hasMore) break;
        }
        // The matrix has no image or participant count; search has both.
        const listed = await listCompetitionsByStatus("LIVE").catch(() => []);
        const byId = new Map(listed.map((c) => [c._id, c]));
        setItems(
          cards.map((card) => {
            const extra = byId.get(card.id);
            return extra ? { ...card, image: extra.imageUrl, participants: extra.participants } : card;
          })
        );
        return;
      }

      const listed = await listCompetitionsByStatus(status);
      const details = await Promise.all(
        listed.slice(0, MAX_DETAILS).map((c) => getCompetitionDetails(c._id).catch(() => null))
      );
      setItems(
        listed.map((c, i) => {
          const d = details[i] as any;
          return {
            id: c._id,
            title: c.title,
            image: c.imageUrl,
            prize: c.prize || 0,
            participants: d?.totalParticipantsJoined ?? c.participants ?? 0,
            entries: d?.totalParticipants ?? 0,
            startDate: d?.startDate || "",
            endDate: d?.endDate || "",
            entryFee: d?.entryFee || 0,
            winnerName: d?.results?.[0]?.name || "",
            totalViews: d?.totalViews || 0,
          };
        })
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, reload: load };
}

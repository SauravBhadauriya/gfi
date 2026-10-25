import { useCallback, useEffect, useRef, useState } from "react";
import {
  FollowCounts,
  ProfileHighlight,
  ProfileInsights,
  getFollowCounts,
  getHighlights,
  getProfileInsights,
} from "@/api/services/profileExtrasService";

/** Follow counts, insights (own profile only) and highlights for a profile. */
export function useProfileExtras(userId: string, isOwn: boolean) {
  const [followCounts, setFollowCounts] = useState<FollowCounts | null>(null);
  const [insights, setInsights] = useState<ProfileInsights | null>(null);
  const [highlights, setHighlights] = useState<ProfileHighlight[]>([]);
  const [highlightsLoading, setHighlightsLoading] = useState(true);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  const refreshHighlights = useCallback(async () => {
    if (!userId) return;
    setHighlightsLoading(true);
    const items = await getHighlights(userId).catch(() => [] as ProfileHighlight[]);
    if (!activeRef.current) return;
    setHighlights(items);
    setHighlightsLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      getFollowCounts(userId).catch(() => null),
      isOwn ? getProfileInsights().catch(() => null) : Promise.resolve(null),
    ]).then(([counts, stats]) => {
      if (!activeRef.current) return;
      setFollowCounts(counts);
      setInsights(stats);
    });
    refreshHighlights();
  }, [userId, isOwn, refreshHighlights]);

  return { followCounts, insights, highlights, highlightsLoading, refreshHighlights };
}

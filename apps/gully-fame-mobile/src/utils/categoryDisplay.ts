// Backend category values (for example "cook") are sent and received unchanged.
// Only the label users see is mapped here.
const LABEL_OVERRIDES: Record<string, string> = {
  cook: "Talent",
  cooking: "Talent",
  coo: "Talent",
};

const ICON_KEYS = ["cook", "talent", "fitness", "dance", "comedy", "music"] as const;
export type CategoryIconKey = (typeof ICON_KEYS)[number];

/** Picks the bundled icon for a backend category name ("Dance" -> "dance"). */
export const categoryIconKey = (name?: string): CategoryIconKey => {
  const raw = String(name || "").trim().toLowerCase();
  const match = ICON_KEYS.find((key) => raw.startsWith(key));
  return match || "talent";
};

export const getCategoryLabel = (name?: string) => {
  const raw = String(name || "").trim();
  return LABEL_OVERRIDES[raw.toLowerCase()] || raw;
};

import { ImageSourcePropType } from "react-native";

export interface topPerformersForHomeScreenAPIData {
    userId?: number | string;
    id: number | string;
    rank: number;
    name: string;
    votes: number;
    profilePictureUrl?: string;
}
export type topPerformersForHomeScreenFullData =
    topPerformersForHomeScreenAPIData & {
        defaultProfilePicture: ImageSourcePropType;
        badge: "🥇" | "🥈" | "🥉" | "⭐";
        label: string;
        points?: number;
        id?: number;
    };

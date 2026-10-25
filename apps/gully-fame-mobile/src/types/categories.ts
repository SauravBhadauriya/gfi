import { ComponentProps } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ImageSourcePropType } from "react-native";

export interface categoriesDataFromAPI {
    id: string | number;
    name: string;
    imageUrl?: string;
}
export type categoriesFullData = categoriesDataFromAPI & {
    iconName: ComponentProps<typeof MaterialCommunityIcons>["name"];
    icon?: "cook" | "talent" | "fitness" | "dance" | "comedy" | "music";
    defaultImage?: ImageSourcePropType;
};

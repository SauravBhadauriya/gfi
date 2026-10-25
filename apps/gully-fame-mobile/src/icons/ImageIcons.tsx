import { scale } from "@/utils/responsive";
import { StarIcon } from "./StarIcon";
import { FireIcon } from "./FireIcon";
import { ImageStyle } from "expo-image";
import {
  Image,
  ImageResizeMode,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
} from "react-native";

const CATEGORY_IMAGES = {
  dance: require("@assets/images/Dancing_category.png"),
  music: require("@assets/images/Music_category.png"),
  comedy: require("@assets/images/Comedy_category.png"),
} as const;
interface BaseImageIconProps {
  source: ImageSourcePropType;
  styles?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
}
type BaseImageIconPropsForChild = Omit<BaseImageIconProps, "source">;
function BaseImageIcon({
  source,
  styles,
  resizeMode = "contain",
}: BaseImageIconProps) {
  return (
    <Image
      source={source}
      resizeMode={resizeMode}
      style={[{ width: scale(30), height: scale(30) }, styles]}
    ></Image>
  );
}
export const NotificationIcon = ({
  styles = { width: scale(40), height: scale(40) },
}: BaseImageIconPropsForChild) => {
  return (
    <BaseImageIcon
      styles={styles}
      source={require("@assets/images/Notification.png")}
    ></BaseImageIcon>
  );
};
export const ChatIcon = ({ styles }: BaseImageIconPropsForChild) => {
  return (
    <BaseImageIcon
      source={require("@assets/images/Chat.png")}
      styles={styles}
    ></BaseImageIcon>
  );
};
export const CategoryIcon = ({
  type,
  styles = { width: scale(28), height: scale(28) },
}: BaseImageIconPropsForChild & {
  type: "cook" | "talent" | "fitness" | "dance" | "comedy" | "music";
}) => {
  const flatStyle = StyleSheet.flatten(styles) as ImageStyle | undefined;
  const size = typeof flatStyle?.width === "number" ? flatStyle.width : scale(28);
  // "cook" is the backend value for Talent. Talent and Fitness use existing SVG icons, not PNGs.
  if (type === "cook" || type === "talent") {
    return <StarIcon size={size} color="#EC9A15" />;
  }
  if (type === "fitness") {
    return <FireIcon size={size} color="#EC9A15" />;
  }
  return (
    <BaseImageIcon
      source={CATEGORY_IMAGES[type]}
      styles={styles}
    ></BaseImageIcon>
  );
};

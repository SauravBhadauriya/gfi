import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { styles } from "./styles";
import { Dimensions, TouchableOpacity, Text } from "react-native";
import { useEffect } from "react";
import { categoriesFullData } from "@/types/categories";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { scale } from "@/utils/responsive";
const { width } = Dimensions.get("window");
const BASE_RADIUS = width * 0.08;
const ACTIVE_RADIUS = width * 0.12;

interface CategoryItemProps {
  isActive: boolean;
  isSelected: boolean;
  category: categoriesFullData;
  onPress: () => void;
}
function CategoryItem({
  isActive,
  isSelected,
  category,
  onPress,
}: CategoryItemProps) {
  const scaleCategory = useSharedValue(1);
  const borderRadius = useSharedValue(BASE_RADIUS);
  useEffect(() => {
    scaleCategory.value = withTiming(isActive ? 1.1 : 1, { duration: 300 });
    borderRadius.value = withTiming(isActive ? ACTIVE_RADIUS : BASE_RADIUS, {
      duration: 300,
    });
  }, [isActive, borderRadius, scaleCategory]);
  const animatedStyle = useAnimatedStyle(() => ({
    borderRadius: borderRadius.value,
    transform: [{ scale: scaleCategory.value }],
  }));
  return (
    <TouchableOpacity
      style={styles.circularCategoryWrapper}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.circularCategory,
          animatedStyle,
          isSelected && {
            borderColor: "#EC9A15",
            shadowColor: "#EC9A15",
            shadowOpacity: 0.4,
            elevation: 5,
          },
          isActive && {
            borderColor: "#EC9A15",
            shadowColor: "#EC9A15",
            shadowOpacity: 0.6,
            elevation: 8,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={category.iconName}
          size={scale(34)}
          color="#EC9A15"
        />
      </Animated.View>
      <Text
  numberOfLines={2}
  ellipsizeMode="tail"
  style={[
    styles.circularCategoryName,
    isSelected && styles.circularCategoryNameActive,
    isActive && styles.circularCategoryNameActive,
  ]}
>
  {category.name}
</Text>
    </TouchableOpacity>
  );
}
export default CategoryItem;

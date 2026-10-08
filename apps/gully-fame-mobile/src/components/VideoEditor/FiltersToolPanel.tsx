import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

export interface VideoFilter {
  id: string;
  name: string;
  thumbnail?: string;
  intensity: number; // 0 to 100
  type:
    | "none"
    | "blackwhite"
    | "sepia"
    | "vintage"
    | "warm"
    | "cool"
    | "dramatic"
    | "soft"
    | "vivid"
    | "fade";
}

interface FiltersToolPanelProps {
  onClose: () => void;
  onFilterChange: (filter: VideoFilter) => void;
  currentFilter?: VideoFilter;
  videoThumbnail?: string;
}

// Predefined filters (matching Instagram Edits style)
const PREDEFINED_FILTERS: Omit<VideoFilter, "intensity">[] = [
  { id: "none", name: "Original", type: "none" },
  { id: "blackwhite", name: "B&W", type: "blackwhite" },
  { id: "sepia", name: "Sepia", type: "sepia" },
  { id: "vintage", name: "Vintage", type: "vintage" },
  { id: "warm", name: "Warm", type: "warm" },
  { id: "cool", name: "Cool", type: "cool" },
  { id: "dramatic", name: "Dramatic", type: "dramatic" },
  { id: "soft", name: "Soft", type: "soft" },
  { id: "vivid", name: "Vivid", type: "vivid" },
  { id: "fade", name: "Fade", type: "fade" },
];

export default function FiltersToolPanel({
  onClose,
  onFilterChange,
  currentFilter,
  videoThumbnail,
}: FiltersToolPanelProps) {
  const [selectedFilter, setSelectedFilter] = useState<VideoFilter>(
    currentFilter || { ...PREDEFINED_FILTERS[0], intensity: 100 }
  );
  const [intensity, setIntensity] = useState(currentFilter?.intensity || 100);

  const handleFilterSelect = (filter: Omit<VideoFilter, "intensity">) => {
    const newFilter: VideoFilter = { ...filter, intensity };
    setSelectedFilter(newFilter);
    onFilterChange(newFilter);
  };

  const handleIntensityChange = (value: number) => {
    setIntensity(value);
    const newFilter = { ...selectedFilter, intensity: value };
    setSelectedFilter(newFilter);
    onFilterChange(newFilter);
  };

  // Get filter description
  const getFilterDescription = (type: string): string => {
    switch (type) {
      case "none":
        return "No filter applied";
      case "blackwhite":
        return "Classic black and white";
      case "sepia":
        return "Warm vintage tone";
      case "vintage":
        return "Retro film look";
      case "warm":
        return "Warmer color temperature";
      case "cool":
        return "Cooler color temperature";
      case "dramatic":
        return "High contrast and saturation";
      case "soft":
        return "Soft and dreamy";
      case "vivid":
        return "Vibrant and punchy colors";
      case "fade":
        return "Faded film effect";
      default:
        return "";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>FILTERS</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Filter Grid */}
        <View style={styles.filtersGrid}>
          {PREDEFINED_FILTERS.map((filter) => {
            const isSelected = selectedFilter.id === filter.id;

            return (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterCard,
                  isSelected && styles.filterCardSelected,
                ]}
                onPress={() => handleFilterSelect(filter)}
                activeOpacity={0.7}
              >
                {/* Filter Preview Thumbnail */}
                <View style={styles.filterThumbnail}>
                  {videoThumbnail ? (
                    <Image
                      source={{ uri: videoThumbnail }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.thumbnailPlaceholder}>
                      <Ionicons
                        name="image"
                        size={32}
                        color={isSelected ? "#EC9A15" : "#666"}
                      />
                    </View>
                  )}
                  {/* Filter overlay effect representation */}
                  <View
                    style={[
                      styles.filterOverlay,
                      getFilterOverlayStyle(filter.type),
                    ]}
                  />
                </View>

                {/* Filter Name */}
                <Text
                  style={[
                    styles.filterName,
                    isSelected && styles.filterNameSelected,
                  ]}
                >
                  {filter.name}
                </Text>

                {/* Selection indicator */}
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color="#EC9A15" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Intensity Control */}
        {selectedFilter.type !== "none" && (
          <View style={styles.intensitySection}>
            <View style={styles.intensityHeader}>
              <Text style={styles.sectionLabel}>Filter Intensity</Text>
              <Text style={styles.intensityValue}>{intensity}%</Text>
            </View>

            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={intensity}
                onValueChange={handleIntensityChange}
                minimumTrackTintColor="#EC9A15"
                maximumTrackTintColor="#2a2a2a"
                thumbTintColor="#EC9A15"
              />
            </View>

            {/* Intensity presets */}
            <View style={styles.presets}>
              {[
                { label: "Light", value: 33 },
                { label: "Medium", value: 66 },
                { label: "Strong", value: 100 },
              ].map((preset) => (
                <TouchableOpacity
                  key={preset.value}
                  style={[
                    styles.presetButton,
                    intensity === preset.value && styles.presetButtonActive,
                  ]}
                  onPress={() => handleIntensityChange(preset.value)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      intensity === preset.value && styles.presetTextActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Filter Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="sparkles" size={20} color="#EC9A15" />
            <Text style={styles.infoTitle}>{selectedFilter.name}</Text>
          </View>
          <Text style={styles.infoDescription}>
            {getFilterDescription(selectedFilter.type)}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Helper function to get filter overlay styles for preview
function getFilterOverlayStyle(filterType: string) {
  switch (filterType) {
    case "blackwhite":
      return { backgroundColor: "rgba(0,0,0,0.3)" };
    case "sepia":
      return { backgroundColor: "rgba(112,66,20,0.3)" };
    case "vintage":
      return { backgroundColor: "rgba(255,200,100,0.2)" };
    case "warm":
      return { backgroundColor: "rgba(255,100,0,0.15)" };
    case "cool":
      return { backgroundColor: "rgba(0,100,255,0.15)" };
    case "dramatic":
      return { backgroundColor: "rgba(0,0,0,0.2)" };
    case "soft":
      return { backgroundColor: "rgba(255,255,255,0.2)" };
    case "vivid":
      return { backgroundColor: "rgba(255,0,100,0.1)" };
    case "fade":
      return { backgroundColor: "rgba(200,200,200,0.3)" };
    default:
      return {};
  }
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filtersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  filterCard: {
    width: "31%",
    aspectRatio: 0.75,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  filterCardSelected: {
    borderColor: "#EC9A15",
  },
  filterThumbnail: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    position: "relative",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  filterOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  filterName: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 8,
    backgroundColor: "#2a2a2a",
  },
  filterNameSelected: {
    color: "#EC9A15",
    backgroundColor: "#3a3a3a",
  },
  selectedIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    padding: 2,
  },
  intensitySection: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  intensityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  intensityValue: {
    color: "#EC9A15",
    fontSize: 15,
    fontWeight: "600",
  },
  sliderContainer: {
    marginBottom: 12,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  presets: {
    flexDirection: "row",
    gap: 8,
  },
  presetButton: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  presetButtonActive: {
    backgroundColor: "#EC9A15",
  },
  presetText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
  },
  presetTextActive: {
    color: "#000",
  },
  infoCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoDescription: {
    color: "#888",
    fontSize: 14,
    lineHeight: 20,
  },
});

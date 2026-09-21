import React, { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { FILTERS, FilterConfig } from "./../../types/filters";
import FilterThumbnail from "./FilterThumbnail";

interface Props {
  mediaUri?: string;
  onFilterApply: (filter: FilterConfig) => void;
}

export default function FilterButton({ mediaUri, onFilterApply }: Props) {
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState("Original");

  const handleSelect = (filter: FilterConfig) => {
    setSelected(filter.name);
    onFilterApply(filter);
    setVisible(false);
  };

  // Layout configuration
  const screenWidth = Dimensions.get('window').width;
  const panelPadding = 40; // Left and right padding
  const itemSpacing = 12; // Space between items
  const columnsPerView = 4.5; // Show 4.5 columns (so user can peek at next items)
  const rows = 3; // Fixed 3 rows
  
  // Calculate item size
  const availableWidth = screenWidth - panelPadding;
  const itemWidth = (availableWidth - (columnsPerView * itemSpacing)) / columnsPerView;
  
  // Organize filters into columns (each column has 3 items for 3 rows)
  const totalColumns = Math.ceil(FILTERS.length / rows);
  const totalWidth = (totalColumns * itemWidth) + ((totalColumns + 1) * itemSpacing);

  // Create columns array: each column contains filters for all 3 rows
  const columns: FilterConfig[][] = [];
  for (let col = 0; col < totalColumns; col++) {
    const columnFilters: FilterConfig[] = [];
    for (let row = 0; row < rows; row++) {
      const index = col * rows + row;
      if (index < FILTERS.length) {
        columnFilters.push(FILTERS[index]);
      }
    }
    columns.push(columnFilters);
  }

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.button} activeOpacity={0.7}>
        <View style={styles.iconContainer}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <Text style={styles.label}>Filter</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.panel}>
            <Text style={styles.title}>Choose Filter</Text>

            <View style={styles.scrollContainer}>
              <ScrollView 
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled={false}
                decelerationRate="fast"
                contentContainerStyle={[
                  styles.filtersContainer,
                  { width: totalWidth }
                ]}
              >
                {columns.map((columnFilters, colIndex) => (
                  <View 
                    key={colIndex} 
                    style={[
                      styles.column,
                      { 
                        width: itemWidth,
                        marginRight: colIndex < totalColumns - 1 ? itemSpacing : 0,
                      }
                    ]}
                  >
                    {columnFilters.map((filter, rowIndex) => (
                      <TouchableOpacity
                        key={filter.name}
                        onPress={() => handleSelect(filter)}
                        style={[
                          styles.item,
                          selected === filter.name && styles.active,
                          { marginBottom: rowIndex < rows - 1 ? 12 : 0 },
                        ]}
                      >
                        {mediaUri ? (
                          <FilterThumbnail
                            source={{ uri: mediaUri }}
                            filter={filter}
                            style={[styles.thumb, { width: itemWidth - 8, height: itemWidth - 8 }] as any}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.thumb, styles.placeholderThumb, { width: itemWidth - 8, height: itemWidth - 8 }]} />
                        )}
                        <Text style={styles.name} numberOfLines={1}>{filter.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={styles.close}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    gap: 6,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "500",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  panel: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  scrollContainer: {
    height: 300, // Fixed height for 3 rows
  },
  filtersContainer: {
    paddingVertical: 8,
    flexDirection: "row",
    paddingLeft: 4,
  },
  column: {
    flexDirection: "column",
    alignItems: "center",
  },
  item: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  active: {
    borderColor: "#ec9a15",
    borderWidth: 3,
    borderRadius: 12,
  },
  thumb: {
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
  },
  placeholderThumb: {
    backgroundColor: "#2a2a2a",
  },
  name: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 6,
    opacity: 0.7,
    textAlign: "center",
    width: "100%",
    paddingHorizontal: 4,
  },
  close: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
    textAlign: "center",
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
});

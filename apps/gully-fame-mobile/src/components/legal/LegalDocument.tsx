import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { LegalSection } from "@/content/legal/types";

/**
 * Renders a legal document exactly as it is stored in src/content/legal.
 * Sections are shown in document order; `accordion` turns each section into an
 * expandable item (used for the FAQ).
 */
export function LegalDocument({
  title,
  sections,
  accordion = false,
  plainText,
}: {
  title: string[];
  sections: LegalSection[];
  accordion?: boolean;
  /** Text written in the admin panel. When set it replaces `sections`; "• " / "- " lines render as bullets. */
  plainText?: string | null;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (plainText) {
    return (
      <View>
        {plainText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line, i) =>
            /^[•\-*]\s+/.test(line) ? (
              <View key={`pb-${i}`} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.text}>{line.replace(/^[•\-*]\s+/, "")}</Text>
              </View>
            ) : (
              <Text key={`pp-${i}`} style={styles.text}>
                {line}
              </Text>
            )
          )}
      </View>
    );
  }

  return (
    <View>
      {title.map((line, i) => (
        <Text key={`t-${i}`} style={styles.title}>
          {line}
        </Text>
      ))}

      {sections.map((section, index) => {
        const heading = `${section.number}. ${section.heading}`;
        const body = section.body.map((block, i) =>
          block.t === "b" ? (
            <View key={`b-${i}`} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.text}>{block.x}</Text>
            </View>
          ) : (
            <Text key={`p-${i}`} style={styles.text}>
              {block.x}
            </Text>
          )
        );

        if (!accordion) {
          return (
            <View key={section.number + index} style={styles.section}>
              <Text style={styles.heading}>{heading}</Text>
              {body}
            </View>
          );
        }

        const open = openIndex === index;
        return (
          <View key={section.number + index} style={styles.accordionItem}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setOpenIndex(open ? null : index)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
            >
              <Text style={styles.accordionQuestion}>{heading}</Text>
              <Ionicons name={open ? "chevron-up" : "chevron-down"} size={20} color="#EC9A15" />
            </TouchableOpacity>
            {open ? <View style={styles.accordionBody}>{body}</View> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: "#EC9A15",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  section: {
    marginTop: 18,
  },
  heading: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  text: {
    color: "#E5DCD0",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: "row",
    paddingLeft: 4,
    marginBottom: 6,
  },
  bulletDot: {
    color: "#EC9A15",
    fontSize: 14,
    width: 16,
    lineHeight: 21,
  },
  accordionItem: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(236,154,21,0.2)",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    gap: 12,
  },
  accordionQuestion: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
  },
  accordionBody: {
    paddingBottom: 14,
  },
});

export default LegalDocument;

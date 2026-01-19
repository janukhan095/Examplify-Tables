import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  iconName: keyof typeof Feather.glyphMap;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
}

export function StatsCard({
  title,
  value,
  subtitle,
  iconName,
  iconColor,
  trend,
}: StatsCardProps) {
  const { theme } = useTheme();
  const color = iconColor || theme.primary;

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return { name: "trending-up" as const, color: theme.success };
      case "down":
        return { name: "trending-down" as const, color: theme.error };
      default:
        return null;
    }
  };

  const trendIcon = getTrendIcon();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
        <Feather name={iconName} size={20} color={color} />
      </View>
      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
        {title}
      </ThemedText>
      <View style={styles.valueRow}>
        <ThemedText type="h3">{value}</ThemedText>
        {trendIcon ? (
          <Feather
            name={trendIcon.name}
            size={18}
            color={trendIcon.color}
            style={styles.trendIcon}
          />
        ) : null}
      </View>
      {subtitle ? (
        <ThemedText
          type="small"
          style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
        >
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  trendIcon: {
    marginLeft: Spacing.xs,
  },
});

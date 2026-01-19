import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface SubjectCardProps {
  name: string;
  description?: string;
  iconName?: string;
  colorHex?: string;
  topicsCount?: number;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const iconMap: Record<string, keyof typeof Feather.glyphMap> = {
  zap: "zap",
  "flask-conical": "droplet",
  calculator: "hash",
  book: "book",
  globe: "globe",
  cpu: "cpu",
};

export function SubjectCard({
  name,
  description,
  iconName = "book",
  colorHex = "#3B82F6",
  topicsCount,
  onPress,
}: SubjectCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const featherIcon = iconMap[iconName] || "book";

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.border,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colorHex + "20" }]}>
        <Feather name={featherIcon} size={28} color={colorHex} />
      </View>
      <View style={styles.content}>
        <ThemedText type="headline" numberOfLines={1}>
          {name}
        </ThemedText>
        {description ? (
          <ThemedText
            type="caption"
            style={[styles.description, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {description}
          </ThemedText>
        ) : null}
        {topicsCount !== undefined ? (
          <ThemedText
            type="small"
            style={[styles.topicsText, { color: theme.primary }]}
          >
            {topicsCount} topics
          </ThemedText>
        ) : null}
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.xs,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  description: {
    marginTop: Spacing.xs,
  },
  topicsText: {
    marginTop: Spacing.xs,
  },
});

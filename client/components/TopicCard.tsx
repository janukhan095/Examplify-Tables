import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ProgressRing } from "@/components/ProgressRing";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface TopicCardProps {
  name: string;
  description?: string;
  progress?: number;
  questionsCount?: number;
  strengthLevel?: "weak" | "neutral" | "strong";
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function TopicCard({
  name,
  description,
  progress = 0,
  questionsCount,
  strengthLevel = "neutral",
  onPress,
}: TopicCardProps) {
  const { theme, isDark } = useTheme();
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

  const getStrengthColor = () => {
    const colors = isDark ? Colors.dark : Colors.light;
    switch (strengthLevel) {
      case "weak":
        return colors.weakTopic;
      case "strong":
        return colors.strongTopic;
      default:
        return colors.cardBackground;
    }
  };

  const getStrengthIcon = () => {
    switch (strengthLevel) {
      case "weak":
        return { name: "alert-triangle" as const, color: Colors.light.error };
      case "strong":
        return { name: "check-circle" as const, color: Colors.light.success };
      default:
        return null;
    }
  };

  const strengthIcon = getStrengthIcon();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: getStrengthColor(),
          borderColor: theme.border,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <ThemedText type="headline" numberOfLines={1} style={styles.title}>
              {name}
            </ThemedText>
            {strengthIcon ? (
              <Feather
                name={strengthIcon.name}
                size={18}
                color={strengthIcon.color}
                style={styles.strengthIcon}
              />
            ) : null}
          </View>
          {description ? (
            <ThemedText
              type="caption"
              style={[styles.description, { color: theme.textSecondary }]}
              numberOfLines={2}
            >
              {description}
            </ThemedText>
          ) : null}
          {questionsCount !== undefined ? (
            <ThemedText
              type="small"
              style={[styles.questionsText, { color: theme.textSecondary }]}
            >
              {questionsCount} questions
            </ThemedText>
          ) : null}
        </View>
        <ProgressRing progress={progress} size={56} strokeWidth={6} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    flex: 1,
  },
  strengthIcon: {
    marginLeft: Spacing.sm,
  },
  description: {
    marginTop: Spacing.xs,
  },
  questionsText: {
    marginTop: Spacing.xs,
  },
});

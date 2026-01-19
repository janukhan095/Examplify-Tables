import React from "react";
import { StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface AnswerOptionProps {
  label: string;
  text: string;
  isSelected?: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  showResult?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnswerOption({
  label,
  text,
  isSelected = false,
  isCorrect = false,
  isWrong = false,
  showResult = false,
  disabled = false,
  onPress,
}: AnswerOptionProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const colors = isDark ? Colors.dark : Colors.light;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.98);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const getBackgroundColor = () => {
    if (showResult) {
      if (isCorrect) return colors.strongTopic;
      if (isWrong) return colors.weakTopic;
    }
    if (isSelected) return colors.progressBackground;
    return theme.cardBackground;
  };

  const getBorderColor = () => {
    if (showResult) {
      if (isCorrect) return colors.success;
      if (isWrong) return colors.error;
    }
    if (isSelected) return theme.primary;
    return theme.border;
  };

  const getIcon = () => {
    if (showResult && isCorrect) {
      return { name: "check-circle" as const, color: colors.success };
    }
    if (showResult && isWrong) {
      return { name: "x-circle" as const, color: colors.error };
    }
    return null;
  };

  const icon = getIcon();

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.option,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          opacity: disabled && !showResult ? 0.6 : 1,
        },
        animatedStyle,
      ]}
    >
      <ThemedText
        type="body"
        style={[
          styles.label,
          {
            backgroundColor: isSelected ? theme.primary : theme.backgroundSecondary,
            color: isSelected ? "#FFFFFF" : theme.text,
          },
        ]}
      >
        {label}
      </ThemedText>
      <ThemedText type="body" style={styles.text} numberOfLines={3}>
        {text}
      </ThemedText>
      {icon ? (
        <Feather name={icon.name} size={22} color={icon.color} />
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1.5,
    marginBottom: Spacing.sm,
  },
  label: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.xs,
    textAlign: "center",
    lineHeight: 32,
    fontWeight: "600",
    marginRight: Spacing.md,
    overflow: "hidden",
  },
  text: {
    flex: 1,
  },
});

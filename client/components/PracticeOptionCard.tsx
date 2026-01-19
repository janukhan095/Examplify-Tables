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

interface PracticeOptionCardProps {
  title: string;
  description: string;
  iconName: keyof typeof Feather.glyphMap;
  colorHex: string;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PracticeOptionCard({
  title,
  description,
  iconName,
  colorHex,
  onPress,
}: PracticeOptionCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: colorHex + "15",
          borderColor: colorHex + "40",
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colorHex }]}>
        <Feather name={iconName} size={24} color="#FFFFFF" />
      </View>
      <View style={styles.content}>
        <ThemedText type="headline" style={{ color: colorHex }}>
          {title}
        </ThemedText>
        <ThemedText
          type="caption"
          style={[styles.description, { color: theme.textSecondary }]}
          numberOfLines={2}
        >
          {description}
        </ThemedText>
      </View>
      <Feather name="arrow-right" size={20} color={colorHex} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
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
});

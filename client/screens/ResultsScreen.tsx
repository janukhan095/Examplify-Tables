import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ProgressRing } from "@/components/ProgressRing";
import { Button } from "@/components/Button";
import { StatsCard } from "@/components/StatsCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RoutePropType = RouteProp<RootStackParamList, "Results">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const colors = isDark ? Colors.dark : Colors.light;

  const { summary, topicName } = route.params;
  const percentage = summary?.percentage || 0;

  React.useEffect(() => {
    if (percentage >= 70) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [percentage]);

  const getResultMessage = () => {
    if (percentage >= 90) return { text: "Excellent!", color: colors.success };
    if (percentage >= 70) return { text: "Good Job!", color: colors.success };
    if (percentage >= 50) return { text: "Keep Practicing", color: colors.warning };
    return { text: "Needs Improvement", color: colors.error };
  };

  const resultMessage = getResultMessage();

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });
  };

  const handlePracticeAgain = () => {
    navigation.goBack();
    navigation.goBack();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing["3xl"] },
        ]}
      >
        <View style={styles.header}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {topicName}
          </ThemedText>
          <ThemedText
            type="h2"
            style={[styles.resultTitle, { color: resultMessage.color }]}
          >
            {resultMessage.text}
          </ThemedText>
        </View>

        <View
          style={[
            styles.scoreCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          <ProgressRing
            progress={percentage}
            size={140}
            strokeWidth={12}
            color={resultMessage.color}
          />
          <ThemedText type="body" style={{ marginTop: Spacing.lg, color: theme.textSecondary }}>
            Your Score
          </ThemedText>
          <ThemedText type="h3">
            {summary?.marksObtained || 0} / {summary?.totalMarks || 0}
          </ThemedText>
          {summary?.autoSubmitted ? (
            <View
              style={[
                styles.autoSubmitBadge,
                { backgroundColor: colors.warning + "20" },
              ]}
            >
              <Feather name="clock" size={14} color={colors.warning} />
              <ThemedText
                type="small"
                style={{ color: colors.warning, marginLeft: Spacing.xs }}
              >
                Auto-submitted (Time expired)
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.statsGrid}>
          <StatsCard
            title="Attempted"
            value={summary?.attempted || 0}
            subtitle={`of ${summary?.totalQuestions || 0}`}
            iconName="edit-3"
            iconColor={colors.primary}
          />
          <View style={{ width: Spacing.md }} />
          <StatsCard
            title="Correct"
            value={summary?.correct || 0}
            iconName="check-circle"
            iconColor={colors.success}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatsCard
            title="Wrong"
            value={summary?.wrong || 0}
            iconName="x-circle"
            iconColor={colors.error}
          />
          <View style={{ width: Spacing.md }} />
          <StatsCard
            title="Skipped"
            value={summary?.skipped || 0}
            iconName="minus-circle"
            iconColor={theme.textSecondary}
          />
        </View>

        <View style={styles.actions}>
          <Button onPress={handlePracticeAgain} style={styles.actionButton}>
            Practice Again
          </Button>
          <Button
            onPress={handleGoHome}
            style={[
              styles.actionButton,
              styles.secondaryButton,
              { borderColor: theme.primary },
            ]}
          >
            <ThemedText type="body" style={{ color: theme.primary }}>
              Go to Home
            </ThemedText>
          </Button>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  resultTitle: {
    marginTop: Spacing.sm,
  },
  scoreCard: {
    alignItems: "center",
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  autoSubmitBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  actions: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  actionButton: {
    width: "100%",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
  },
});

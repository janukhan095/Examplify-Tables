import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ProgressRing } from "@/components/ProgressRing";
import { TopicCard } from "@/components/TopicCard";
import { StatsCard } from "@/components/StatsCard";
import { useTheme } from "@/hooks/useTheme";
import { useUser } from "@/hooks/useUser";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { userId } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const colors = isDark ? Colors.dark : Colors.light;

  const {
    data: analytics,
    isLoading,
    refetch,
  } = useQuery<any>({
    queryKey: ["/api/users", userId, "analytics"],
    enabled: !!userId,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const overallAccuracy = analytics?.overall?.accuracy || 0;
  const weakTopics = analytics?.weakTopics || [];
  const strongTopics = analytics?.strongTopics || [];
  const allTopics = analytics?.topicWise || [];

  const hasData = analytics?.overall?.totalQuestionsAttempted > 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing["3xl"],
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {hasData ? (
        <>
          <View
            style={[
              styles.overallCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            <View style={styles.overallContent}>
              <View style={styles.overallText}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Overall Accuracy
                </ThemedText>
                <ThemedText type="display" style={{ marginTop: Spacing.xs }}>
                  {overallAccuracy}%
                </ThemedText>
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
                >
                  {analytics?.overall?.totalQuestionsAttempted || 0} questions
                  attempted
                </ThemedText>
              </View>
              <ProgressRing
                progress={overallAccuracy}
                size={100}
                strokeWidth={10}
                color={
                  overallAccuracy >= 70
                    ? colors.success
                    : overallAccuracy >= 50
                      ? colors.warning
                      : colors.error
                }
              />
            </View>
          </View>

          <View style={styles.statsGrid}>
            <StatsCard
              title="Correct"
              value={analytics?.overall?.totalCorrectAnswers || 0}
              iconName="check-circle"
              iconColor={colors.success}
            />
            <View style={{ width: Spacing.md }} />
            <StatsCard
              title="Streak"
              value={`${analytics?.overall?.currentStreak || 0} days`}
              iconName="zap"
              iconColor={colors.accent}
            />
          </View>

          {weakTopics.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <ThemedText type="h4">Weak Topics</ThemedText>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.weakTopic },
                  ]}
                >
                  <Feather name="alert-triangle" size={12} color={colors.error} />
                  <ThemedText
                    type="small"
                    style={{ color: colors.error, marginLeft: Spacing.xs }}
                  >
                    Needs Practice
                  </ThemedText>
                </View>
              </View>
              {weakTopics.map((topic: any) => (
                <TopicCard
                  key={topic.id}
                  name={topic.topicId}
                  description={`Accuracy: ${Math.round(topic.accuracyPercent || 0)}%`}
                  progress={topic.accuracyPercent || 0}
                  strengthLevel="weak"
                  onPress={() =>
                    navigation.navigate("TestTaking", {
                      topicId: topic.topicId,
                      topicName: topic.topicId,
                      mode: "practice",
                    })
                  }
                />
              ))}
            </>
          ) : null}

          {strongTopics.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <ThemedText type="h4">Strong Topics</ThemedText>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.strongTopic },
                  ]}
                >
                  <Feather name="check-circle" size={12} color={colors.success} />
                  <ThemedText
                    type="small"
                    style={{ color: colors.success, marginLeft: Spacing.xs }}
                  >
                    Well Done
                  </ThemedText>
                </View>
              </View>
              {strongTopics.map((topic: any) => (
                <TopicCard
                  key={topic.id}
                  name={topic.topicId}
                  description={`Accuracy: ${Math.round(topic.accuracyPercent || 0)}%`}
                  progress={topic.accuracyPercent || 0}
                  strengthLevel="strong"
                />
              ))}
            </>
          ) : null}

          {allTopics.length > 0 ? (
            <>
              <ThemedText type="h4" style={styles.sectionTitle}>
                All Topics
              </ThemedText>
              {allTopics.map((topic: any) => (
                <TopicCard
                  key={topic.id}
                  name={topic.topicId}
                  description={`${topic.totalAttempted || 0} attempted, ${topic.totalCorrect || 0} correct`}
                  progress={topic.accuracyPercent || 0}
                  strengthLevel={topic.strengthLevel}
                />
              ))}
            </>
          ) : null}
        </>
      ) : (
        <View style={styles.emptyState}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <Feather name="bar-chart-2" size={48} color={theme.textSecondary} />
          </View>
          <ThemedText type="h4" style={styles.emptyTitle}>
            No Analytics Yet
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.emptyText, { color: theme.textSecondary }]}
          >
            Complete practice sessions to see your topic-wise performance and
            identify areas that need improvement.
          </ThemedText>
          <Pressable
            onPress={() => navigation.navigate("SubjectSelect", { mode: "practice" })}
            style={[styles.emptyButton, { backgroundColor: theme.primary }]}
          >
            <ThemedText type="body" style={{ color: "#FFFFFF" }}>
              Start Practicing
            </ThemedText>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overallCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  overallContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overallText: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
  },
  emptyText: {
    textAlign: "center",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  emptyButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.full,
  },
});

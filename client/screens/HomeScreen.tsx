import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { PracticeOptionCard } from "@/components/PracticeOptionCard";
import { StatsCard } from "@/components/StatsCard";
import { ProgressRing } from "@/components/ProgressRing";
import {
  LanguageSelector,
  LanguageButton,
} from "@/components/LanguageSelector";
import { useTheme } from "@/hooks/useTheme";
import { useUser } from "@/hooks/useUser";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user, userId, language, setLanguage, loginAsGuest, isInitialized } =
    useUser();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const colors = isDark ? Colors.dark : Colors.light;

  useEffect(() => {
    if (isInitialized && !userId) {
      loginAsGuest();
    }
  }, [isInitialized, userId, loginAsGuest]);

  const { data: analytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ["/api/users", userId, "analytics"],
    enabled: !!userId,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchAnalytics();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const overallAccuracy = analytics?.overall?.accuracy || 0;

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
      <View style={styles.greetingRow}>
        <View style={styles.greetingText}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {getGreeting()}
          </ThemedText>
          <ThemedText type="h3">
            {user?.displayName || "Student"}
          </ThemedText>
        </View>
        <LanguageButton
          selectedLanguage={language}
          onPress={() => setShowLanguageSelector(true)}
        />
      </View>

      <View
        style={[
          styles.heroCard,
          { backgroundColor: colors.primary, borderColor: colors.primaryDark },
        ]}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroText}>
            <ThemedText type="h4" style={{ color: "#FFFFFF" }}>
              Your Progress
            </ThemedText>
            <ThemedText
              type="display"
              style={{ color: "#FFFFFF", marginTop: Spacing.sm }}
            >
              {analytics?.overall?.totalQuestionsAttempted || 0}
            </ThemedText>
            <ThemedText type="caption" style={{ color: "rgba(255,255,255,0.8)" }}>
              Questions Solved
            </ThemedText>
          </View>
          <ProgressRing
            progress={overallAccuracy}
            size={90}
            strokeWidth={10}
            color="#FFFFFF"
            backgroundColor="rgba(255,255,255,0.3)"
          />
        </View>
        <View style={styles.streakRow}>
          <View style={styles.streakItem}>
            <ThemedText type="headline" style={{ color: "#FFFFFF" }}>
              {analytics?.overall?.currentStreak || 0}
            </ThemedText>
            <ThemedText type="small" style={{ color: "rgba(255,255,255,0.8)" }}>
              Day Streak
            </ThemedText>
          </View>
          <View style={[styles.streakDivider, { backgroundColor: "rgba(255,255,255,0.3)" }]} />
          <View style={styles.streakItem}>
            <ThemedText type="headline" style={{ color: "#FFFFFF" }}>
              {analytics?.overall?.accuracy || 0}%
            </ThemedText>
            <ThemedText type="small" style={{ color: "rgba(255,255,255,0.8)" }}>
              Accuracy
            </ThemedText>
          </View>
        </View>
      </View>

      <ThemedText type="h4" style={styles.sectionTitle}>
        Practice Options
      </ThemedText>

      <PracticeOptionCard
        title="Subject-wise Practice"
        description="Practice questions by topic and build your concepts"
        iconName="layers"
        colorHex={colors.primary}
        onPress={() => navigation.navigate("SubjectSelect", { mode: "practice" })}
      />

      <PracticeOptionCard
        title="Full Mock Test"
        description="Take a complete test with timer and evaluation"
        iconName="clock"
        colorHex="#6366F1"
        onPress={() => navigation.navigate("SubjectSelect", { mode: "mock" })}
      />

      <PracticeOptionCard
        title="Previous Year Questions"
        description="Practice actual questions from past exams"
        iconName="archive"
        colorHex="#F59E0B"
        onPress={() => navigation.navigate("SubjectSelect", { mode: "pyq" })}
      />

      {analytics?.weakTopics && analytics.weakTopics.length > 0 ? (
        <>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Focus Areas
          </ThemedText>
          <View
            style={[
              styles.weakTopicsCard,
              { backgroundColor: colors.weakTopic, borderColor: colors.error + "40" },
            ]}
          >
            <ThemedText type="headline" style={{ color: colors.error }}>
              {analytics.weakTopics.length} Weak Topic
              {analytics.weakTopics.length > 1 ? "s" : ""}
            </ThemedText>
            <ThemedText
              type="caption"
              style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
            >
              Practice these topics to improve your score
            </ThemedText>
          </View>
        </>
      ) : null}

      <LanguageSelector
        visible={showLanguageSelector}
        selectedLanguage={language}
        onSelect={setLanguage}
        onClose={() => setShowLanguageSelector(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  greetingText: {
    flex: 1,
  },
  heroCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing["2xl"],
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroText: {
    flex: 1,
  },
  streakRow: {
    flexDirection: "row",
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  streakItem: {
    flex: 1,
    alignItems: "center",
  },
  streakDivider: {
    width: 1,
    height: "100%",
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  weakTopicsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
});

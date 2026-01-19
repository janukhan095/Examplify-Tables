import React from "react";
import { View, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { TopicCard } from "@/components/TopicCard";
import { useTheme } from "@/hooks/useTheme";
import { useUser } from "@/hooks/useUser";
import { Spacing } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RoutePropType = RouteProp<RootStackParamList, "TopicSelect">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function TopicSelectScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { userId } = useUser();
  const { subjectId, subjectName, mode } = route.params;

  const { data: topics, isLoading } = useQuery<any[]>({
    queryKey: ["/api/subjects", subjectId, "topics"],
  });

  const { data: analytics } = useQuery<any>({
    queryKey: ["/api/users", userId, "analytics"],
    enabled: !!userId,
  });

  const getTopicAnalytics = (topicId: string) => {
    if (!analytics?.topicWise) return { progress: 0, strengthLevel: "neutral" as const };
    const topicData = analytics.topicWise.find((t: any) => t.topicId === topicId);
    if (!topicData) return { progress: 0, strengthLevel: "neutral" as const };
    return {
      progress: topicData.accuracyPercent || 0,
      strengthLevel: topicData.strengthLevel as "weak" | "neutral" | "strong",
    };
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing["3xl"],
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      data={topics || []}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <ThemedText type="h4">{subjectName}</ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            Select a topic to start practicing
          </ThemedText>
        </View>
      }
      renderItem={({ item }) => {
        const topicStats = getTopicAnalytics(item.id);
        return (
          <TopicCard
            name={item.name}
            description={item.description}
            progress={topicStats.progress}
            strengthLevel={topicStats.strengthLevel}
            onPress={() =>
              navigation.navigate("TestTaking", {
                topicId: item.id,
                topicName: item.name,
                mode,
              })
            }
          />
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            No topics available for this subject
          </ThemedText>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: Spacing.xl,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
});

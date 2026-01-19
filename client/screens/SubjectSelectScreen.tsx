import React from "react";
import { View, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { SubjectCard } from "@/components/SubjectCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RoutePropType = RouteProp<RootStackParamList, "SubjectSelect">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SubjectSelectScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const mode = route.params?.mode || "practice";

  const { data: subjects, isLoading } = useQuery<any[]>({
    queryKey: ["/api/subjects"],
  });

  const getTitle = () => {
    switch (mode) {
      case "mock":
        return "Select Subject for Mock Test";
      case "pyq":
        return "Select Subject for PYQs";
      default:
        return "Select Subject to Practice";
    }
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
      data={subjects || []}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
          {getTitle()}
        </ThemedText>
      }
      renderItem={({ item }) => (
        <SubjectCard
          name={item.name}
          description={item.description}
          iconName={item.iconName}
          colorHex={item.colorHex}
          onPress={() =>
            navigation.navigate("TopicSelect", {
              subjectId: item.id,
              subjectName: item.name,
              mode,
            })
          }
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            No subjects available
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
  subtitle: {
    marginBottom: Spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
});

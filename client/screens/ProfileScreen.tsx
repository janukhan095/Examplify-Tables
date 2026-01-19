import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Pressable, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ProgressRing } from "@/components/ProgressRing";
import {
  LanguageSelector,
  LanguageButton,
} from "@/components/LanguageSelector";
import { useTheme } from "@/hooks/useTheme";
import { useUser } from "@/hooks/useUser";
import { Spacing, BorderRadius, Colors, Languages } from "@/constants/theme";

interface SettingsItemProps {
  iconName: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

function SettingsItem({
  iconName,
  title,
  subtitle,
  onPress,
  rightElement,
}: SettingsItemProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.settingsItem, { borderColor: theme.border }]}
    >
      <View style={[styles.settingsIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name={iconName} size={18} color={theme.primary} />
      </View>
      <View style={styles.settingsText}>
        <ThemedText type="body">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {rightElement || (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { user, language, setLanguage, isGuest } = useUser();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const colors = isDark ? Colors.dark : Colors.light;

  const selectedLanguage = Languages.find((l) => l.code === language);

  const accuracy =
    user && user.totalQuestionsAttempted > 0
      ? Math.round(
          (user.totalCorrectAnswers / user.totalQuestionsAttempted) * 100
        )
      : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing["3xl"],
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View
        style={[
          styles.profileCard,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
        ]}
      >
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          <Feather name="user" size={32} color={colors.primary} />
        </View>
        <ThemedText type="h4" style={styles.name}>
          {user?.displayName || "Guest User"}
        </ThemedText>
        {isGuest ? (
          <View
            style={[
              styles.guestBadge,
              { backgroundColor: colors.warning + "20" },
            ]}
          >
            <ThemedText type="small" style={{ color: colors.warning }}>
              Guest Account
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <ThemedText type="h3">{user?.totalQuestionsAttempted || 0}</ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Questions
          </ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText type="h3">{user?.currentStreak || 0}</ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Day Streak
          </ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText type="h3">{accuracy}%</ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Accuracy
          </ThemedText>
        </View>
      </View>

      {isGuest ? (
        <View
          style={[
            styles.signupBanner,
            { backgroundColor: colors.primary + "10", borderColor: colors.primary + "40" },
          ]}
        >
          <Feather name="cloud" size={24} color={colors.primary} />
          <View style={styles.signupText}>
            <ThemedText type="headline" style={{ color: colors.primary }}>
              Sign up to save progress
            </ThemedText>
            <ThemedText
              type="caption"
              style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
            >
              Sync your data across devices and never lose your progress
            </ThemedText>
          </View>
        </View>
      ) : null}

      <ThemedText type="h4" style={styles.sectionTitle}>
        Settings
      </ThemedText>

      <View
        style={[
          styles.settingsGroup,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
        ]}
      >
        <SettingsItem
          iconName="globe"
          title="Language"
          subtitle={selectedLanguage?.nativeName}
          onPress={() => setShowLanguageSelector(true)}
        />
        <SettingsItem
          iconName="bell"
          title="Notifications"
          rightElement={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.border, true: colors.primary + "60" }}
              thumbColor={notificationsEnabled ? colors.primary : theme.textSecondary}
            />
          }
        />
        <SettingsItem iconName="moon" title="Dark Mode" subtitle="System" />
      </View>

      <ThemedText type="h4" style={styles.sectionTitle}>
        About
      </ThemedText>

      <View
        style={[
          styles.settingsGroup,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
        ]}
      >
        <SettingsItem iconName="file-text" title="Terms of Service" />
        <SettingsItem iconName="shield" title="Privacy Policy" />
        <SettingsItem iconName="help-circle" title="Help & Support" />
        <SettingsItem iconName="info" title="App Version" subtitle="1.0.0" />
      </View>

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
  profileCard: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  name: {
    marginBottom: Spacing.xs,
  },
  guestBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.xl,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  signupBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  signupText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  settingsGroup: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  settingsText: {
    flex: 1,
  },
});

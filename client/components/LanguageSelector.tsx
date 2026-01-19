import React from "react";
import { View, StyleSheet, Pressable, Modal, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Languages } from "@/constants/theme";

interface LanguageSelectorProps {
  visible: boolean;
  selectedLanguage: string;
  onSelect: (languageCode: string) => void;
  onClose: () => void;
}

export function LanguageSelector({
  visible,
  selectedLanguage,
  onSelect,
  onClose,
}: LanguageSelectorProps) {
  const { theme } = useTheme();

  const handleSelect = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <ThemedView style={[styles.sheet, { borderColor: theme.border }]}>
          <View style={styles.header}>
            <ThemedText type="h4">Select Language</ThemedText>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>
          <FlatList
            data={Languages}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSelect(item.code)}
                style={[
                  styles.languageItem,
                  {
                    backgroundColor:
                      selectedLanguage === item.code
                        ? theme.progressBackground
                        : "transparent",
                    borderColor:
                      selectedLanguage === item.code
                        ? theme.primary
                        : theme.border,
                  },
                ]}
              >
                <View style={styles.languageText}>
                  <ThemedText type="headline">{item.nativeName}</ThemedText>
                  <ThemedText
                    type="caption"
                    style={{ color: theme.textSecondary }}
                  >
                    {item.name}
                  </ThemedText>
                </View>
                {selectedLanguage === item.code ? (
                  <Feather name="check" size={22} color={theme.primary} />
                ) : null}
              </Pressable>
            )}
            contentContainerStyle={styles.listContent}
          />
        </ThemedView>
      </View>
    </Modal>
  );
}

interface LanguageButtonProps {
  selectedLanguage: string;
  onPress: () => void;
  compact?: boolean;
}

export function LanguageButton({
  selectedLanguage,
  onPress,
  compact = false,
}: LanguageButtonProps) {
  const { theme } = useTheme();
  const language = Languages.find((l) => l.code === selectedLanguage);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.languageButton,
        {
          backgroundColor: theme.backgroundSecondary,
          borderColor: theme.border,
        },
      ]}
    >
      <Feather name="globe" size={16} color={theme.primary} />
      {compact ? null : (
        <ThemedText type="caption" style={styles.languageButtonText}>
          {language?.nativeName || "English"}
        </ThemedText>
      )}
      <Feather name="chevron-down" size={14} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: "70%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  listContent: {
    padding: Spacing.lg,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  languageText: {
    flex: 1,
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  languageButtonText: {
    marginHorizontal: Spacing.xs,
  },
});

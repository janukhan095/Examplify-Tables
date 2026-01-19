import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { AnswerOption } from "@/components/AnswerOption";
import { Button } from "@/components/Button";
import {
  LanguageSelector,
  LanguageButton,
} from "@/components/LanguageSelector";
import { useTheme } from "@/hooks/useTheme";
import { useUser } from "@/hooks/useUser";
import { apiRequest } from "@/lib/query-client";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RoutePropType = RouteProp<RootStackParamList, "TestTaking">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LABELS = ["A", "B", "C", "D", "E", "F"];

export default function TestTakingScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { userId, language, setLanguage } = useUser();
  const colors = isDark ? Colors.dark : Colors.light;

  const { topicId, topicName, mode } = route.params;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTime = useRef(Date.now());

  const startSession = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/sessions/start", {
        userId,
        topicId,
        sessionType: mode,
        questionCount: mode === "mock" ? 30 : 10,
      });
      const data = await response.json();
      setSessionId(data.session.id);
      setQuestions(data.questions);
      const totalSeconds = data.questions.reduce(
        (acc: number, q: any) => acc + (q.timeRecommendedSeconds || 60),
        0
      );
      setTimeLeft(totalSeconds);
      setTotalTime(totalSeconds);
      questionStartTime.current = Date.now();
    } catch (error) {
      console.error("Failed to start session:", error);
      Alert.alert("Error", "Failed to start the test. Please try again.");
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [userId, topicId, mode, navigation]);

  useEffect(() => {
    startSession();
  }, [startSession]);

  useEffect(() => {
    if (timeLeft > 0 && !showResult) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft > 0, showResult]);

  const saveAnswerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        "POST",
        `/api/sessions/${sessionId}/answer`,
        data
      );
      return response.json();
    },
  });

  const submitSessionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        "POST",
        `/api/sessions/${sessionId}/submit`,
        data
      );
      return response.json();
    },
  });

  const handleSelectAnswer = (answer: string) => {
    if (showResult) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = async () => {
    if (!sessionId || !questions[currentIndex]) return;

    const timeTaken = Math.round((Date.now() - questionStartTime.current) / 1000);
    const question = questions[currentIndex];

    try {
      const result = await saveAnswerMutation.mutateAsync({
        questionId: question.id,
        userId,
        selectedAnswer,
        timeTakenSeconds: timeTaken,
      });

      setAnswers((prev) => ({
        ...prev,
        [question.id]: {
          selectedAnswer,
          isCorrect: result.isCorrect,
          correctAnswer: result.correctAnswer,
          explanation: result.explanation,
        },
      }));

      if (result.isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      setShowResult(true);
    } catch (error) {
      console.error("Failed to save answer:", error);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      questionStartTime.current = Date.now();
    } else {
      handleFinishTest();
    }
  };

  const handleSkipQuestion = () => {
    handleNextQuestion();
  };

  const handleAutoSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await handleFinishTest(true);
  };

  const handleFinishTest = async (autoSubmit = false) => {
    if (!sessionId) return;

    try {
      const result = await submitSessionMutation.mutateAsync({
        autoSubmit,
        timeTakenSeconds: totalTime - timeLeft,
      });

      navigation.replace("Results", {
        sessionId,
        summary: result.summary,
        topicName,
      });
    } catch (error) {
      console.error("Failed to submit session:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleExit = () => {
    Alert.alert(
      "Exit Test",
      "Are you sure you want to exit? Your progress will be saved.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Exit",
          style: "destructive",
          onPress: () => handleFinishTest(),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText type="body" style={{ marginTop: Spacing.lg }}>
          Loading questions...
        </ThemedText>
      </ThemedView>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion?.id];

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.sm, borderColor: theme.border },
        ]}
      >
        <Pressable onPress={handleExit} hitSlop={12}>
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText type="headline">
            {currentIndex + 1} / {questions.length}
          </ThemedText>
        </View>
        <View style={styles.headerRight}>
          <LanguageButton
            selectedLanguage={language}
            onPress={() => setShowLanguageSelector(true)}
            compact
          />
          <View
            style={[
              styles.timerBadge,
              {
                backgroundColor:
                  timeLeft < 60 ? colors.weakTopic : colors.progressBackground,
              },
            ]}
          >
            <Feather
              name="clock"
              size={14}
              color={timeLeft < 60 ? colors.error : colors.primary}
            />
            <ThemedText
              type="caption"
              style={{
                color: timeLeft < 60 ? colors.error : colors.primary,
                marginLeft: Spacing.xs,
              }}
            >
              {formatTime(timeLeft)}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.primary,
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            },
          ]}
        />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View
          style={[
            styles.questionCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          <View style={styles.questionHeader}>
            <View
              style={[
                styles.difficultyBadge,
                {
                  backgroundColor:
                    currentQuestion?.difficulty === "hard"
                      ? colors.error + "20"
                      : currentQuestion?.difficulty === "medium"
                        ? colors.warning + "20"
                        : colors.success + "20",
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color:
                    currentQuestion?.difficulty === "hard"
                      ? colors.error
                      : currentQuestion?.difficulty === "medium"
                        ? colors.warning
                        : colors.success,
                  textTransform: "capitalize",
                }}
              >
                {currentQuestion?.difficulty}
              </ThemedText>
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {currentQuestion?.marks} marks
            </ThemedText>
          </View>
          <ThemedText type="body" style={styles.questionText}>
            {currentQuestion?.questionText}
          </ThemedText>
        </View>

        <View style={styles.optionsContainer}>
          {(currentQuestion?.options || []).map((option: string, index: number) => (
            <AnswerOption
              key={index}
              label={LABELS[index]}
              text={option}
              isSelected={selectedAnswer === option}
              isCorrect={showResult && currentAnswer?.correctAnswer === option}
              isWrong={
                showResult &&
                selectedAnswer === option &&
                !currentAnswer?.isCorrect
              }
              showResult={showResult}
              disabled={showResult}
              onPress={() => handleSelectAnswer(option)}
            />
          ))}
        </View>

        {showResult && currentAnswer?.explanation ? (
          <View
            style={[
              styles.explanationCard,
              { backgroundColor: colors.progressBackground, borderColor: colors.primary + "40" },
            ]}
          >
            <ThemedText type="headline" style={{ color: colors.primary }}>
              Explanation
            </ThemedText>
            <ThemedText
              type="body"
              style={{ marginTop: Spacing.sm, color: theme.text }}
            >
              {currentAnswer.explanation}
            </ThemedText>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + Spacing.md, borderColor: theme.border },
        ]}
      >
        {showResult ? (
          <Button onPress={handleNextQuestion} style={styles.footerButton}>
            {currentIndex < questions.length - 1
              ? "Next Question"
              : "View Results"}
          </Button>
        ) : (
          <View style={styles.footerButtons}>
            <Pressable
              onPress={handleSkipQuestion}
              style={[styles.skipButton, { borderColor: theme.border }]}
            >
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Skip
              </ThemedText>
            </Pressable>
            <Button
              onPress={handleSubmitAnswer}
              disabled={!selectedAnswer}
              style={styles.submitButton}
            >
              Submit Answer
            </Button>
          </View>
        )}
      </View>

      <LanguageSelector
        visible={showLanguageSelector}
        selectedLanguage={language}
        onSelect={setLanguage}
        onClose={() => setShowLanguageSelector(false)}
      />
    </ThemedView>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  progressBar: {
    height: 3,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  progressFill: {
    height: "100%",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  questionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  difficultyBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  questionText: {
    lineHeight: 26,
  },
  optionsContainer: {
    marginBottom: Spacing.lg,
  },
  explanationCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  footerButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  skipButton: {
    flex: 1,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  submitButton: {
    flex: 2,
  },
  footerButton: {
    width: "100%",
  },
});

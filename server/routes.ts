import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertPracticeSessionSchema,
  insertUserAnswerSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.post("/api/users/guest", async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.body;
      if (!deviceId) {
        return res.status(400).json({ error: "deviceId is required" });
      }

      let user = await storage.getUserByDeviceId(deviceId);
      if (!user) {
        user = await storage.createUser({
          userType: "guest",
          deviceId,
          displayName: "Guest User",
        });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get or create guest user" });
    }
  });

  app.put("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.get("/api/subjects", async (_req: Request, res: Response) => {
    try {
      const subjectList = await storage.getSubjects();
      res.json(subjectList);
    } catch (error) {
      res.status(500).json({ error: "Failed to get subjects" });
    }
  });

  app.get(
    "/api/subjects/:subjectId/topics",
    async (req: Request, res: Response) => {
      try {
        const topicList = await storage.getTopicsBySubject(
          req.params.subjectId
        );
        res.json(topicList);
      } catch (error) {
        res.status(500).json({ error: "Failed to get topics" });
      }
    }
  );

  app.get("/api/topics/:topicId/questions", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const questionList = await storage.getQuestionsByTopic(
        req.params.topicId,
        limit
      );
      res.json(questionList);
    } catch (error) {
      res.status(500).json({ error: "Failed to get questions" });
    }
  });

  app.get("/api/test-series", async (_req: Request, res: Response) => {
    try {
      const seriesList = await storage.getTestSeries();
      res.json(seriesList);
    } catch (error) {
      res.status(500).json({ error: "Failed to get test series" });
    }
  });

  app.get("/api/test-series/:id", async (req: Request, res: Response) => {
    try {
      const series = await storage.getTestSeriesById(req.params.id);
      if (!series) {
        return res.status(404).json({ error: "Test series not found" });
      }
      res.json(series);
    } catch (error) {
      res.status(500).json({ error: "Failed to get test series" });
    }
  });

  app.get(
    "/api/test-series/:id/questions",
    async (req: Request, res: Response) => {
      try {
        const questionList = await storage.getTestSeriesQuestions(req.params.id);
        res.json(questionList);
      } catch (error) {
        res.status(500).json({ error: "Failed to get test series questions" });
      }
    }
  );

  app.post("/api/sessions/start", async (req: Request, res: Response) => {
    try {
      const { userId, testSeriesId, topicId, sessionType } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      let questionList: any[] = [];
      let totalMarks = 0;

      if (testSeriesId) {
        const testSeriesData = await storage.getTestSeriesById(testSeriesId);
        if (!testSeriesData) {
          return res.status(404).json({ error: "Test series not found" });
        }
        questionList = await storage.getTestSeriesQuestions(testSeriesId);
        totalMarks = testSeriesData.totalMarks;
      } else if (topicId) {
        const limit = req.body.questionCount || 10;
        questionList = await storage.getQuestionsByTopic(topicId, limit);
        totalMarks = questionList.reduce((sum, q) => sum + (q.marks || 1), 0);
      } else {
        return res
          .status(400)
          .json({ error: "Either testSeriesId or topicId is required" });
      }

      const session = await storage.createPracticeSession({
        userId,
        testSeriesId: testSeriesId || null,
        topicId: topicId || null,
        sessionType: sessionType || "practice",
        totalQuestions: questionList.length,
        totalMarks,
        questionsAttempted: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        skippedQuestions: 0,
        marksObtained: 0,
        timeTakenSeconds: 0,
        isCompleted: false,
      });

      res.status(201).json({
        session,
        questions: questionList.map((q) => ({
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          difficulty: q.difficulty,
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          timeRecommendedSeconds: q.timeRecommendedSeconds,
          imageUrl: q.imageUrl,
        })),
      });
    } catch (error) {
      console.error("Error starting session:", error);
      res.status(500).json({ error: "Failed to start session" });
    }
  });

  app.post("/api/sessions/:sessionId/answer", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { questionId, userId, selectedAnswer, timeTakenSeconds } = req.body;

      if (!questionId || !userId) {
        return res
          .status(400)
          .json({ error: "questionId and userId are required" });
      }

      const session = await storage.getPracticeSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (session.isCompleted) {
        return res.status(400).json({ error: "Session already completed" });
      }

      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }

      const isSkipped = !selectedAnswer || selectedAnswer === "";
      const isCorrect = !isSkipped && selectedAnswer === question.correctAnswer;
      let marksAwarded = 0;

      if (isCorrect) {
        marksAwarded = question.marks;
      } else if (!isSkipped && question.negativeMarks) {
        marksAwarded = -question.negativeMarks;
      }

      const answer = await storage.saveUserAnswer({
        sessionId,
        questionId,
        userId,
        selectedAnswer: selectedAnswer || null,
        isCorrect: isSkipped ? null : isCorrect,
        isSkipped,
        timeTakenSeconds: timeTakenSeconds || 0,
        marksAwarded,
      });

      await storage.updateQuestionStats(questionId, isCorrect);

      const updatedSession = await storage.updatePracticeSession(sessionId, {
        questionsAttempted: session.questionsAttempted + (isSkipped ? 0 : 1),
        correctAnswers: session.correctAnswers + (isCorrect ? 1 : 0),
        wrongAnswers:
          session.wrongAnswers + (!isSkipped && !isCorrect ? 1 : 0),
        skippedQuestions: session.skippedQuestions + (isSkipped ? 1 : 0),
        marksObtained: (session.marksObtained || 0) + marksAwarded,
        timeTakenSeconds:
          (session.timeTakenSeconds || 0) + (timeTakenSeconds || 0),
      });

      res.json({
        answer,
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        session: updatedSession,
      });
    } catch (error) {
      console.error("Error saving answer:", error);
      res.status(500).json({ error: "Failed to save answer" });
    }
  });

  app.post("/api/sessions/:sessionId/submit", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { autoSubmit, timeTakenSeconds } = req.body;

      const session = await storage.getPracticeSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (session.isCompleted) {
        return res.status(400).json({ error: "Session already completed" });
      }

      const answers = await storage.getSessionAnswers(sessionId);
      const answeredQuestionIds = new Set(answers.map((a) => a.questionId));

      let skippedCount = session.totalQuestions - answeredQuestionIds.size;

      const updatedSession = await storage.updatePracticeSession(sessionId, {
        isCompleted: true,
        completedAt: new Date(),
        skippedQuestions: session.skippedQuestions + skippedCount,
        timeTakenSeconds: timeTakenSeconds || session.timeTakenSeconds,
      });

      const user = await storage.getUser(session.userId);
      if (user) {
        const newStreak = autoSubmit ? user.currentStreak : user.currentStreak + 1;
        await storage.updateUser(session.userId, {
          totalQuestionsAttempted:
            user.totalQuestionsAttempted + session.questionsAttempted,
          totalCorrectAnswers:
            user.totalCorrectAnswers + session.correctAnswers,
          currentStreak: newStreak,
          longestStreak: Math.max(user.longestStreak, newStreak),
          lastActiveAt: new Date(),
        });
      }

      if (session.topicId) {
        await storage.upsertTopicAnalytics({
          userId: session.userId,
          topicId: session.topicId,
          totalAttempted: session.questionsAttempted,
          totalCorrect: session.correctAnswers,
          totalWrong: session.wrongAnswers,
          totalSkipped: session.skippedQuestions + skippedCount,
        });
      }

      res.json({
        session: updatedSession,
        summary: {
          totalQuestions: session.totalQuestions,
          attempted: session.questionsAttempted,
          correct: session.correctAnswers,
          wrong: session.wrongAnswers,
          skipped: session.skippedQuestions + skippedCount,
          marksObtained: session.marksObtained,
          totalMarks: session.totalMarks,
          percentage:
            session.totalMarks && session.totalMarks > 0
              ? Math.round(
                  ((session.marksObtained || 0) / session.totalMarks) * 100
                )
              : 0,
          autoSubmitted: autoSubmit || false,
        },
      });
    } catch (error) {
      console.error("Error submitting session:", error);
      res.status(500).json({ error: "Failed to submit session" });
    }
  });

  app.get("/api/sessions/:sessionId", async (req: Request, res: Response) => {
    try {
      const session = await storage.getPracticeSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  app.get(
    "/api/sessions/:sessionId/answers",
    async (req: Request, res: Response) => {
      try {
        const answers = await storage.getSessionAnswers(req.params.sessionId);
        res.json(answers);
      } catch (error) {
        res.status(500).json({ error: "Failed to get session answers" });
      }
    }
  );

  app.get("/api/users/:userId/sessions", async (req: Request, res: Response) => {
    try {
      const sessions = await storage.getUserSessions(req.params.userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user sessions" });
    }
  });

  app.get("/api/users/:userId/analytics", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const topicStats = await storage.getTopicAnalytics(userId);

      const overallAccuracy =
        user.totalQuestionsAttempted > 0
          ? Math.round(
              (user.totalCorrectAnswers / user.totalQuestionsAttempted) * 100
            )
          : 0;

      const weakTopics = topicStats.filter(
        (t) => t.strengthLevel === "weak"
      );
      const strongTopics = topicStats.filter(
        (t) => t.strengthLevel === "strong"
      );

      res.json({
        overall: {
          totalQuestionsAttempted: user.totalQuestionsAttempted,
          totalCorrectAnswers: user.totalCorrectAnswers,
          accuracy: overallAccuracy,
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak,
        },
        topicWise: topicStats,
        weakTopics,
        strongTopics,
        recommendations: weakTopics.slice(0, 3).map((t) => ({
          topicId: t.topicId,
          reason: `Accuracy is ${Math.round(t.accuracyPercent || 0)}%`,
          action: "Practice more questions in this topic",
        })),
      });
    } catch (error) {
      console.error("Error getting analytics:", error);
      res.status(500).json({ error: "Failed to get analytics" });
    }
  });

  app.get(
    "/api/users/:userId/analytics/:topicId",
    async (req: Request, res: Response) => {
      try {
        const { userId, topicId } = req.params;
        const analytics = await storage.getTopicAnalyticsByTopic(
          userId,
          topicId
        );

        if (!analytics) {
          return res.json({
            topicId,
            totalAttempted: 0,
            totalCorrect: 0,
            totalWrong: 0,
            totalSkipped: 0,
            accuracyPercent: 0,
            strengthLevel: "neutral",
            message: "No practice data for this topic yet",
          });
        }

        res.json(analytics);
      } catch (error) {
        res.status(500).json({ error: "Failed to get topic analytics" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}

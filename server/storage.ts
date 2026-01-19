import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  subjects,
  topics,
  questions,
  testSeries,
  testSeriesQuestions,
  practiceSessions,
  userAnswers,
  topicAnalytics,
  bookmarkedQuestions,
  type User,
  type InsertUser,
  type Subject,
  type InsertSubject,
  type Topic,
  type InsertTopic,
  type Question,
  type InsertQuestion,
  type TestSeries,
  type InsertTestSeries,
  type PracticeSession,
  type InsertPracticeSession,
  type UserAnswer,
  type InsertUserAnswer,
  type TopicAnalytics,
  type InsertTopicAnalytics,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByDeviceId(deviceId: string): Promise<User | undefined>;
  getUserBySupabaseId(supabaseUserId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;

  getSubjects(): Promise<Subject[]>;
  getTopicsBySubject(subjectId: string): Promise<Topic[]>;
  getTopic(id: string): Promise<Topic | undefined>;

  getQuestionsByTopic(topicId: string, limit?: number): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  getQuestionsByIds(ids: string[]): Promise<Question[]>;

  getTestSeries(): Promise<TestSeries[]>;
  getTestSeriesById(id: string): Promise<TestSeries | undefined>;
  getTestSeriesQuestions(testSeriesId: string): Promise<Question[]>;

  createPracticeSession(
    session: InsertPracticeSession
  ): Promise<PracticeSession>;
  getPracticeSession(id: string): Promise<PracticeSession | undefined>;
  updatePracticeSession(
    id: string,
    data: Partial<InsertPracticeSession>
  ): Promise<PracticeSession | undefined>;
  getUserSessions(userId: string): Promise<PracticeSession[]>;

  saveUserAnswer(answer: InsertUserAnswer): Promise<UserAnswer>;
  getSessionAnswers(sessionId: string): Promise<UserAnswer[]>;

  getTopicAnalytics(userId: string): Promise<TopicAnalytics[]>;
  getTopicAnalyticsByTopic(
    userId: string,
    topicId: string
  ): Promise<TopicAnalytics | undefined>;
  upsertTopicAnalytics(
    data: InsertTopicAnalytics
  ): Promise<TopicAnalytics>;

  updateQuestionStats(
    questionId: string,
    isCorrect: boolean
  ): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByDeviceId(deviceId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.deviceId, deviceId));
    return user;
  }

  async getUserBySupabaseId(supabaseUserId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.supabaseUserId, supabaseUserId));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(
    id: string,
    data: Partial<InsertUser>
  ): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async getSubjects(): Promise<Subject[]> {
    return db
      .select()
      .from(subjects)
      .where(eq(subjects.isActive, true))
      .orderBy(subjects.displayOrder);
  }

  async getTopicsBySubject(subjectId: string): Promise<Topic[]> {
    return db
      .select()
      .from(topics)
      .where(and(eq(topics.subjectId, subjectId), eq(topics.isActive, true)))
      .orderBy(topics.displayOrder);
  }

  async getTopic(id: string): Promise<Topic | undefined> {
    const [topic] = await db.select().from(topics).where(eq(topics.id, id));
    return topic;
  }

  async getQuestionsByTopic(
    topicId: string,
    limit: number = 50
  ): Promise<Question[]> {
    return db
      .select()
      .from(questions)
      .where(and(eq(questions.topicId, topicId), eq(questions.isActive, true)))
      .orderBy(sql`RANDOM()`)
      .limit(limit);
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const [question] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id));
    return question;
  }

  async getQuestionsByIds(ids: string[]): Promise<Question[]> {
    if (ids.length === 0) return [];
    const result = await db
      .select()
      .from(questions)
      .where(sql`${questions.id} = ANY(${ids})`);
    return result;
  }

  async getTestSeries(): Promise<TestSeries[]> {
    return db
      .select()
      .from(testSeries)
      .where(eq(testSeries.isActive, true))
      .orderBy(desc(testSeries.createdAt));
  }

  async getTestSeriesById(id: string): Promise<TestSeries | undefined> {
    const [series] = await db
      .select()
      .from(testSeries)
      .where(eq(testSeries.id, id));
    return series;
  }

  async getTestSeriesQuestions(testSeriesId: string): Promise<Question[]> {
    const result = await db
      .select({ question: questions })
      .from(testSeriesQuestions)
      .innerJoin(questions, eq(testSeriesQuestions.questionId, questions.id))
      .where(eq(testSeriesQuestions.testSeriesId, testSeriesId))
      .orderBy(testSeriesQuestions.questionOrder);
    return result.map((r) => r.question);
  }

  async createPracticeSession(
    session: InsertPracticeSession
  ): Promise<PracticeSession> {
    const [newSession] = await db
      .insert(practiceSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getPracticeSession(id: string): Promise<PracticeSession | undefined> {
    const [session] = await db
      .select()
      .from(practiceSessions)
      .where(eq(practiceSessions.id, id));
    return session;
  }

  async updatePracticeSession(
    id: string,
    data: Partial<InsertPracticeSession>
  ): Promise<PracticeSession | undefined> {
    const [updated] = await db
      .update(practiceSessions)
      .set(data)
      .where(eq(practiceSessions.id, id))
      .returning();
    return updated;
  }

  async getUserSessions(userId: string): Promise<PracticeSession[]> {
    return db
      .select()
      .from(practiceSessions)
      .where(eq(practiceSessions.userId, userId))
      .orderBy(desc(practiceSessions.startedAt));
  }

  async saveUserAnswer(answer: InsertUserAnswer): Promise<UserAnswer> {
    const [saved] = await db.insert(userAnswers).values(answer).returning();
    return saved;
  }

  async getSessionAnswers(sessionId: string): Promise<UserAnswer[]> {
    return db
      .select()
      .from(userAnswers)
      .where(eq(userAnswers.sessionId, sessionId));
  }

  async getTopicAnalytics(userId: string): Promise<TopicAnalytics[]> {
    return db
      .select()
      .from(topicAnalytics)
      .where(eq(topicAnalytics.userId, userId))
      .orderBy(desc(topicAnalytics.lastPracticedAt));
  }

  async getTopicAnalyticsByTopic(
    userId: string,
    topicId: string
  ): Promise<TopicAnalytics | undefined> {
    const [analytics] = await db
      .select()
      .from(topicAnalytics)
      .where(
        and(
          eq(topicAnalytics.userId, userId),
          eq(topicAnalytics.topicId, topicId)
        )
      );
    return analytics;
  }

  async upsertTopicAnalytics(
    data: InsertTopicAnalytics
  ): Promise<TopicAnalytics> {
    const existing = await this.getTopicAnalyticsByTopic(
      data.userId,
      data.topicId
    );

    if (existing) {
      const totalAttempted =
        (existing.totalAttempted || 0) + (data.totalAttempted || 0);
      const totalCorrect =
        (existing.totalCorrect || 0) + (data.totalCorrect || 0);
      const totalWrong = (existing.totalWrong || 0) + (data.totalWrong || 0);
      const totalSkipped =
        (existing.totalSkipped || 0) + (data.totalSkipped || 0);
      const accuracyPercent =
        totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;

      const strengthLevel =
        accuracyPercent >= 80
          ? "strong"
          : accuracyPercent >= 50
            ? "neutral"
            : "weak";

      const [updated] = await db
        .update(topicAnalytics)
        .set({
          totalAttempted,
          totalCorrect,
          totalWrong,
          totalSkipped,
          accuracyPercent,
          strengthLevel,
          lastPracticedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(topicAnalytics.id, existing.id))
        .returning();
      return updated;
    } else {
      const accuracyPercent =
        data.totalAttempted && data.totalAttempted > 0
          ? ((data.totalCorrect || 0) / data.totalAttempted) * 100
          : 0;
      const strengthLevel =
        accuracyPercent >= 80
          ? "strong"
          : accuracyPercent >= 50
            ? "neutral"
            : "weak";

      const [created] = await db
        .insert(topicAnalytics)
        .values({
          ...data,
          accuracyPercent,
          strengthLevel,
          lastPracticedAt: new Date(),
        })
        .returning();
      return created;
    }
  }

  async updateQuestionStats(
    questionId: string,
    isCorrect: boolean
  ): Promise<void> {
    await db
      .update(questions)
      .set({
        totalAttempts: sql`${questions.totalAttempts} + 1`,
        correctAttempts: isCorrect
          ? sql`${questions.correctAttempts} + 1`
          : questions.correctAttempts,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, questionId));
  }
}

export const storage = new DatabaseStorage();

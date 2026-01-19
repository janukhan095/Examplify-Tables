import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  real,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const userTypeEnum = pgEnum("user_type", ["guest", "registered"]);
export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const questionTypeEnum = pgEnum("question_type", [
  "mcq",
  "multi_select",
  "numerical",
]);

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userType: userTypeEnum("user_type").notNull().default("guest"),
  email: text("email").unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  deviceId: text("device_id"),
  supabaseUserId: text("supabase_user_id").unique(),
  totalQuestionsAttempted: integer("total_questions_attempted")
    .notNull()
    .default(0),
  totalCorrectAnswers: integer("total_correct_answers").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const subjects = pgTable("subjects", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  iconName: text("icon_name"),
  colorHex: text("color_hex"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const topics = pgTable("topics", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  subjectId: varchar("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const questions = pgTable("questions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  topicId: varchar("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  questionType: questionTypeEnum("question_type").notNull().default("mcq"),
  options: jsonb("options").$type<string[]>(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  difficulty: difficultyEnum("difficulty").notNull().default("medium"),
  year: integer("year"),
  examName: text("exam_name"),
  marks: integer("marks").notNull().default(1),
  negativeMarks: real("negative_marks").default(0),
  timeRecommendedSeconds: integer("time_recommended_seconds").default(60),
  imageUrl: text("image_url"),
  totalAttempts: integer("total_attempts").notNull().default(0),
  correctAttempts: integer("correct_attempts").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const testSeries = pgTable("test_series", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  subjectId: varchar("subject_id").references(() => subjects.id, {
    onDelete: "set null",
  }),
  totalQuestions: integer("total_questions").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  totalMarks: integer("total_marks").notNull(),
  passingMarks: integer("passing_marks"),
  difficulty: difficultyEnum("difficulty").default("medium"),
  isFree: boolean("is_free").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const testSeriesQuestions = pgTable("test_series_questions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  testSeriesId: varchar("test_series_id")
    .notNull()
    .references(() => testSeries.id, { onDelete: "cascade" }),
  questionId: varchar("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  questionOrder: integer("question_order").notNull(),
});

export const practiceSessions = pgTable("practice_sessions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  testSeriesId: varchar("test_series_id").references(() => testSeries.id, {
    onDelete: "set null",
  }),
  topicId: varchar("topic_id").references(() => topics.id, {
    onDelete: "set null",
  }),
  sessionType: text("session_type").notNull().default("practice"),
  totalQuestions: integer("total_questions").notNull().default(0),
  questionsAttempted: integer("questions_attempted").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  wrongAnswers: integer("wrong_answers").notNull().default(0),
  skippedQuestions: integer("skipped_questions").notNull().default(0),
  totalMarks: real("total_marks").default(0),
  marksObtained: real("marks_obtained").default(0),
  timeTakenSeconds: integer("time_taken_seconds").default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const userAnswers = pgTable("user_answers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id")
    .notNull()
    .references(() => practiceSessions.id, { onDelete: "cascade" }),
  questionId: varchar("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  selectedAnswer: text("selected_answer"),
  isCorrect: boolean("is_correct"),
  isSkipped: boolean("is_skipped").notNull().default(false),
  timeTakenSeconds: integer("time_taken_seconds").default(0),
  marksAwarded: real("marks_awarded").default(0),
  answeredAt: timestamp("answered_at").notNull().defaultNow(),
});

export const topicAnalytics = pgTable("topic_analytics", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  topicId: varchar("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  totalAttempted: integer("total_attempted").notNull().default(0),
  totalCorrect: integer("total_correct").notNull().default(0),
  totalWrong: integer("total_wrong").notNull().default(0),
  totalSkipped: integer("total_skipped").notNull().default(0),
  accuracyPercent: real("accuracy_percent").default(0),
  avgTimeSeconds: real("avg_time_seconds").default(0),
  lastPracticedAt: timestamp("last_practiced_at"),
  strengthLevel: text("strength_level").default("neutral"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookmarkedQuestions = pgTable("bookmarked_questions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  questionId: varchar("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
});
export const selectSubjectSchema = createSelectSchema(subjects);
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;

export const insertTopicSchema = createInsertSchema(topics).omit({
  id: true,
  createdAt: true,
});
export const selectTopicSchema = createSelectSchema(topics);
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Topic = typeof topics.$inferSelect;

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectQuestionSchema = createSelectSchema(questions);
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export const insertTestSeriesSchema = createInsertSchema(testSeries).omit({
  id: true,
  createdAt: true,
});
export const selectTestSeriesSchema = createSelectSchema(testSeries);
export type InsertTestSeries = z.infer<typeof insertTestSeriesSchema>;
export type TestSeries = typeof testSeries.$inferSelect;

export const insertPracticeSessionSchema = createInsertSchema(
  practiceSessions
).omit({
  id: true,
  startedAt: true,
});
export const selectPracticeSessionSchema = createSelectSchema(practiceSessions);
export type InsertPracticeSession = z.infer<typeof insertPracticeSessionSchema>;
export type PracticeSession = typeof practiceSessions.$inferSelect;

export const insertUserAnswerSchema = createInsertSchema(userAnswers).omit({
  id: true,
  answeredAt: true,
});
export const selectUserAnswerSchema = createSelectSchema(userAnswers);
export type InsertUserAnswer = z.infer<typeof insertUserAnswerSchema>;
export type UserAnswer = typeof userAnswers.$inferSelect;

export const insertTopicAnalyticsSchema = createInsertSchema(
  topicAnalytics
).omit({
  id: true,
  updatedAt: true,
});
export const selectTopicAnalyticsSchema = createSelectSchema(topicAnalytics);
export type InsertTopicAnalytics = z.infer<typeof insertTopicAnalyticsSchema>;
export type TopicAnalytics = typeof topicAnalytics.$inferSelect;

export const insertBookmarkedQuestionSchema = createInsertSchema(
  bookmarkedQuestions
).omit({
  id: true,
  createdAt: true,
});
export const selectBookmarkedQuestionSchema =
  createSelectSchema(bookmarkedQuestions);
export type InsertBookmarkedQuestion = z.infer<
  typeof insertBookmarkedQuestionSchema
>;
export type BookmarkedQuestion = typeof bookmarkedQuestions.$inferSelect;

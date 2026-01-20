# Replit to Supabase Complete Migration Guide

## HIGH-LEVEL MIGRATION MAP

```
┌──────────────────────────────────────────────────────────────────┐
│                    CURRENT ARCHITECTURE                           │
├──────────────────────────────────────────────────────────────────┤
│  Mobile App (Expo) → Replit Express API → Replit PostgreSQL     │
│                            ↓                                      │
│              Guest users via deviceId                             │
│              No real authentication                               │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                         MIGRATION
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    TARGET ARCHITECTURE                            │
├──────────────────────────────────────────────────────────────────┤
│  Mobile App (Expo) → Supabase Client → Supabase PostgreSQL      │
│                            ↓                                      │
│              Supabase Auth (email, google, anonymous)            │
│              Edge Functions for business logic                    │
│              RLS for data security                                │
│              Direct DB access for reads                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## PART 1: EXISTING DATABASE SCHEMA ANALYSIS

### Tables Overview

| Table | Purpose | Records Estimate | Migration Priority |
|-------|---------|------------------|-------------------|
| users | User profiles + stats | Active | HIGH |
| subjects | Subject categories | Static | MEDIUM |
| topics | Topics per subject | Static | MEDIUM |
| questions | Question bank | Static | HIGH |
| test_series | Mock test configurations | Static | MEDIUM |
| test_series_questions | Test-question mapping | Static | MEDIUM |
| practice_sessions | User test sessions | User data | HIGH |
| user_answers | Individual answers | User data | HIGH |
| topic_analytics | Per-topic performance | User data | HIGH |
| bookmarked_questions | Saved questions | User data | MEDIUM |

### Enums

```sql
-- user_type: 'guest', 'registered'
-- difficulty: 'easy', 'medium', 'hard'
-- question_type: 'mcq', 'multi_select', 'numerical'
```

### Auth-Related Columns

- `users.supabase_user_id` - Already prepared for Supabase Auth
- `users.device_id` - Guest/anonymous user tracking
- `users.email` - For registered users

---

## PART 2: SUPABASE-COMPATIBLE SCHEMA (SQL)

### 2.1 Enums

```sql
-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_type AS ENUM ('guest', 'registered');
CREATE TYPE difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE question_type AS ENUM ('mcq', 'multi_select', 'numerical');
```

### 2.2 Core Tables

```sql
-- ============================================
-- USERS (Integrated with Supabase Auth)
-- ============================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type user_type NOT NULL DEFAULT 'guest',
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  device_id TEXT,
  total_questions_attempted INTEGER NOT NULL DEFAULT 0,
  total_correct_answers INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_device_id ON public.users(device_id);
CREATE INDEX idx_users_email ON public.users(email);

-- ============================================
-- SUBJECTS
-- ============================================

CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  color_hex TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subjects_active ON public.subjects(is_active, display_order);

-- ============================================
-- TOPICS
-- ============================================

CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_topics_subject ON public.topics(subject_id, is_active, display_order);

-- ============================================
-- QUESTIONS
-- ============================================

CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL DEFAULT 'mcq',
  options JSONB, -- Array of strings
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty difficulty NOT NULL DEFAULT 'medium',
  year INTEGER, -- For PYQ
  exam_name TEXT, -- For PYQ
  marks INTEGER NOT NULL DEFAULT 1,
  negative_marks REAL DEFAULT 0,
  time_recommended_seconds INTEGER DEFAULT 60,
  image_url TEXT,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  correct_attempts INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_topic ON public.questions(topic_id, is_active);
CREATE INDEX idx_questions_pyq ON public.questions(year, exam_name) WHERE year IS NOT NULL;

-- ============================================
-- TEST SERIES
-- ============================================

CREATE TABLE public.test_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  total_questions INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  passing_marks INTEGER,
  difficulty difficulty DEFAULT 'medium',
  is_free BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_test_series_active ON public.test_series(is_active, created_at DESC);

-- ============================================
-- TEST SERIES QUESTIONS (Junction)
-- ============================================

CREATE TABLE public.test_series_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_series_id UUID NOT NULL REFERENCES public.test_series(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  UNIQUE(test_series_id, question_id)
);

CREATE INDEX idx_tsq_test_series ON public.test_series_questions(test_series_id, question_order);

-- ============================================
-- PRACTICE SESSIONS
-- ============================================

CREATE TABLE public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  test_series_id UUID REFERENCES public.test_series(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL DEFAULT 'practice',
  total_questions INTEGER NOT NULL DEFAULT 0,
  questions_attempted INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  wrong_answers INTEGER NOT NULL DEFAULT 0,
  skipped_questions INTEGER NOT NULL DEFAULT 0,
  total_marks REAL DEFAULT 0,
  marks_obtained REAL DEFAULT 0,
  time_taken_seconds INTEGER DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user ON public.practice_sessions(user_id, started_at DESC);
CREATE INDEX idx_sessions_topic ON public.practice_sessions(topic_id) WHERE topic_id IS NOT NULL;

-- ============================================
-- USER ANSWERS
-- ============================================

CREATE TABLE public.user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  selected_answer TEXT,
  is_correct BOOLEAN,
  is_skipped BOOLEAN NOT NULL DEFAULT false,
  time_taken_seconds INTEGER DEFAULT 0,
  marks_awarded REAL DEFAULT 0,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_answers_session ON public.user_answers(session_id);
CREATE INDEX idx_answers_user_question ON public.user_answers(user_id, question_id);

-- ============================================
-- TOPIC ANALYTICS
-- ============================================

CREATE TABLE public.topic_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  total_attempted INTEGER NOT NULL DEFAULT 0,
  total_correct INTEGER NOT NULL DEFAULT 0,
  total_wrong INTEGER NOT NULL DEFAULT 0,
  total_skipped INTEGER NOT NULL DEFAULT 0,
  accuracy_percent REAL DEFAULT 0,
  avg_time_seconds REAL DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  strength_level TEXT DEFAULT 'neutral',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

CREATE INDEX idx_topic_analytics_user ON public.topic_analytics(user_id, strength_level);

-- ============================================
-- BOOKMARKED QUESTIONS
-- ============================================

CREATE TABLE public.bookmarked_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX idx_bookmarks_user ON public.bookmarked_questions(user_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_topic_analytics_updated_at
  BEFORE UPDATE ON public.topic_analytics
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

---

## PART 3: SUPABASE AUTH INTEGRATION

### 3.1 Auth Trigger - Auto-create user profile on signup

```sql
-- ============================================
-- AUTH TRIGGER: Create user profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, email, display_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    'registered'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
```

### 3.2 Guest/Anonymous User Support

```sql
-- ============================================
-- FUNCTION: Get or create guest user by device_id
-- ============================================

CREATE OR REPLACE FUNCTION public.get_or_create_guest_user(p_device_id TEXT)
RETURNS public.users AS $$
DECLARE
  v_user public.users;
BEGIN
  -- Try to find existing guest user
  SELECT * INTO v_user FROM public.users WHERE device_id = p_device_id LIMIT 1;
  
  IF v_user IS NULL THEN
    -- Create new guest user
    INSERT INTO public.users (device_id, user_type, display_name)
    VALUES (p_device_id, 'guest', 'Guest User')
    RETURNING * INTO v_user;
  END IF;
  
  RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.3 Link Guest to Registered User

```sql
-- ============================================
-- FUNCTION: Upgrade guest to registered user
-- ============================================

CREATE OR REPLACE FUNCTION public.link_guest_to_auth_user(
  p_guest_user_id UUID,
  p_auth_user_id UUID,
  p_email TEXT,
  p_display_name TEXT DEFAULT NULL
)
RETURNS public.users AS $$
DECLARE
  v_user public.users;
BEGIN
  UPDATE public.users
  SET 
    auth_user_id = p_auth_user_id,
    email = p_email,
    user_type = 'registered',
    display_name = COALESCE(p_display_name, display_name),
    updated_at = now()
  WHERE id = p_guest_user_id AND user_type = 'guest'
  RETURNING * INTO v_user;
  
  RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## PART 4: ROW LEVEL SECURITY (RLS)

```sql
-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_series_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarked_questions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Get current user's profile ID
-- ============================================

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM public.users 
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- USERS POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth_user_id = auth.uid() OR id = get_current_user_id());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Service role can manage all users
CREATE POLICY "Service role can manage users"
  ON public.users FOR ALL
  USING (auth.role() = 'service_role');

-- Anonymous users can use get_or_create_guest_user function
CREATE POLICY "Allow guest user creation"
  ON public.users FOR INSERT
  WITH CHECK (user_type = 'guest');

-- ============================================
-- CONTENT POLICIES (Public read for active content)
-- ============================================

-- Subjects: Anyone can read active subjects
CREATE POLICY "Anyone can read active subjects"
  ON public.subjects FOR SELECT
  USING (is_active = true);

-- Topics: Anyone can read active topics
CREATE POLICY "Anyone can read active topics"
  ON public.topics FOR SELECT
  USING (is_active = true);

-- Questions: Anyone can read active questions
CREATE POLICY "Anyone can read active questions"
  ON public.questions FOR SELECT
  USING (is_active = true);

-- Test Series: Anyone can read active test series
CREATE POLICY "Anyone can read active test series"
  ON public.test_series FOR SELECT
  USING (is_active = true);

-- Test Series Questions: Anyone can read
CREATE POLICY "Anyone can read test series questions"
  ON public.test_series_questions FOR SELECT
  USING (true);

-- ============================================
-- USER DATA POLICIES
-- ============================================

-- Practice Sessions: Users can manage their own sessions
CREATE POLICY "Users can read own sessions"
  ON public.practice_sessions FOR SELECT
  USING (user_id = get_current_user_id());

CREATE POLICY "Users can create own sessions"
  ON public.practice_sessions FOR INSERT
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update own sessions"
  ON public.practice_sessions FOR UPDATE
  USING (user_id = get_current_user_id());

-- User Answers: Users can manage their own answers
CREATE POLICY "Users can read own answers"
  ON public.user_answers FOR SELECT
  USING (user_id = get_current_user_id());

CREATE POLICY "Users can create own answers"
  ON public.user_answers FOR INSERT
  WITH CHECK (user_id = get_current_user_id());

-- Topic Analytics: Users can manage their own analytics
CREATE POLICY "Users can read own analytics"
  ON public.topic_analytics FOR SELECT
  USING (user_id = get_current_user_id());

CREATE POLICY "Users can manage own analytics"
  ON public.topic_analytics FOR ALL
  USING (user_id = get_current_user_id());

-- Bookmarks: Users can manage their own bookmarks
CREATE POLICY "Users can manage own bookmarks"
  ON public.bookmarked_questions FOR ALL
  USING (user_id = get_current_user_id());

-- ============================================
-- ADMIN POLICIES (Optional - Add admin role check)
-- ============================================

-- Admin check function (simple version)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user email is in admin list (store in separate table for production)
  RETURN (
    SELECT email IN ('admin@yourapp.com')
    FROM public.users
    WHERE auth_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Admin can manage all content
CREATE POLICY "Admins can manage subjects"
  ON public.subjects FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can manage topics"
  ON public.topics FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can manage questions"
  ON public.questions FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can manage test series"
  ON public.test_series FOR ALL
  USING (is_admin());
```

---

## PART 5: EDGE FUNCTIONS

### 5.1 Start Session Edge Function

Create file: `supabase/functions/start-session/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StartSessionRequest {
  userId: string;
  testSeriesId?: string;
  topicId?: string;
  sessionType?: string;
  questionCount?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, testSeriesId, topicId, sessionType, questionCount = 10 }: StartSessionRequest = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let questions: any[] = [];
    let totalMarks = 0;

    if (testSeriesId) {
      // Get test series questions
      const { data: testSeries } = await supabase
        .from("test_series")
        .select("*")
        .eq("id", testSeriesId)
        .single();

      if (!testSeries) {
        return new Response(
          JSON.stringify({ error: "Test series not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: tsQuestions } = await supabase
        .from("test_series_questions")
        .select("question:questions(*)")
        .eq("test_series_id", testSeriesId)
        .order("question_order");

      questions = tsQuestions?.map((q: any) => q.question) || [];
      totalMarks = testSeries.total_marks;
    } else if (topicId) {
      // Get random questions from topic
      const { data: topicQuestions } = await supabase
        .from("questions")
        .select("*")
        .eq("topic_id", topicId)
        .eq("is_active", true)
        .limit(questionCount);

      questions = topicQuestions || [];
      totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    } else {
      return new Response(
        JSON.stringify({ error: "Either testSeriesId or topicId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from("practice_sessions")
      .insert({
        user_id: userId,
        test_series_id: testSeriesId || null,
        topic_id: topicId || null,
        session_type: sessionType || "practice",
        total_questions: questions.length,
        total_marks: totalMarks,
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Return session with questions (excluding correct answers)
    return new Response(
      JSON.stringify({
        session,
        questions: questions.map((q) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          difficulty: q.difficulty,
          marks: q.marks,
          negative_marks: q.negative_marks,
          time_recommended_seconds: q.time_recommended_seconds,
          image_url: q.image_url,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 5.2 Submit Answer Edge Function

Create file: `supabase/functions/submit-answer/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { sessionId, questionId, userId, selectedAnswer, timeTakenSeconds } = await req.json();

    if (!sessionId || !questionId || !userId) {
      return new Response(
        JSON.stringify({ error: "sessionId, questionId, and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get session
    const { data: session } = await supabase
      .from("practice_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (session.is_completed) {
      return new Response(
        JSON.stringify({ error: "Session already completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get question with correct answer
    const { data: question } = await supabase
      .from("questions")
      .select("*")
      .eq("id", questionId)
      .single();

    if (!question) {
      return new Response(
        JSON.stringify({ error: "Question not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate result
    const isSkipped = !selectedAnswer || selectedAnswer === "";
    const isCorrect = !isSkipped && selectedAnswer === question.correct_answer;
    let marksAwarded = 0;

    if (isCorrect) {
      marksAwarded = question.marks;
    } else if (!isSkipped && question.negative_marks) {
      marksAwarded = -question.negative_marks;
    }

    // Save answer
    const { data: answer } = await supabase
      .from("user_answers")
      .insert({
        session_id: sessionId,
        question_id: questionId,
        user_id: userId,
        selected_answer: selectedAnswer || null,
        is_correct: isSkipped ? null : isCorrect,
        is_skipped: isSkipped,
        time_taken_seconds: timeTakenSeconds || 0,
        marks_awarded: marksAwarded,
      })
      .select()
      .single();

    // Update question stats
    await supabase.rpc("increment_question_stats", {
      p_question_id: questionId,
      p_is_correct: isCorrect,
    });

    // Update session stats
    const { data: updatedSession } = await supabase
      .from("practice_sessions")
      .update({
        questions_attempted: session.questions_attempted + (isSkipped ? 0 : 1),
        correct_answers: session.correct_answers + (isCorrect ? 1 : 0),
        wrong_answers: session.wrong_answers + (!isSkipped && !isCorrect ? 1 : 0),
        skipped_questions: session.skipped_questions + (isSkipped ? 1 : 0),
        marks_obtained: (session.marks_obtained || 0) + marksAwarded,
        time_taken_seconds: (session.time_taken_seconds || 0) + (timeTakenSeconds || 0),
      })
      .eq("id", sessionId)
      .select()
      .single();

    return new Response(
      JSON.stringify({
        answer,
        isCorrect,
        correctAnswer: question.correct_answer,
        explanation: question.explanation,
        session: updatedSession,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 5.3 Complete Session Edge Function

Create file: `supabase/functions/complete-session/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { sessionId, autoSubmit, timeTakenSeconds } = await req.json();

    // Get session
    const { data: session } = await supabase
      .from("practice_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (session.is_completed) {
      return new Response(
        JSON.stringify({ error: "Session already completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get answers to count answered questions
    const { data: answers } = await supabase
      .from("user_answers")
      .select("question_id")
      .eq("session_id", sessionId);

    const answeredCount = answers?.length || 0;
    const skippedCount = session.total_questions - answeredCount;

    // Complete session
    const { data: updatedSession } = await supabase
      .from("practice_sessions")
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        skipped_questions: session.skipped_questions + skippedCount,
        time_taken_seconds: timeTakenSeconds || session.time_taken_seconds,
      })
      .eq("id", sessionId)
      .select()
      .single();

    // Update user stats
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user_id)
      .single();

    if (user) {
      const newStreak = autoSubmit ? user.current_streak : user.current_streak + 1;
      await supabase
        .from("users")
        .update({
          total_questions_attempted: user.total_questions_attempted + session.questions_attempted,
          total_correct_answers: user.total_correct_answers + session.correct_answers,
          current_streak: newStreak,
          longest_streak: Math.max(user.longest_streak, newStreak),
          last_active_at: new Date().toISOString(),
        })
        .eq("id", session.user_id);
    }

    // Update topic analytics if topic-based session
    if (session.topic_id) {
      await supabase.rpc("upsert_topic_analytics", {
        p_user_id: session.user_id,
        p_topic_id: session.topic_id,
        p_attempted: session.questions_attempted,
        p_correct: session.correct_answers,
        p_wrong: session.wrong_answers,
        p_skipped: session.skipped_questions + skippedCount,
      });
    }

    // Calculate summary
    const percentage = session.total_marks && session.total_marks > 0
      ? Math.round(((session.marks_obtained || 0) / session.total_marks) * 100)
      : 0;

    return new Response(
      JSON.stringify({
        session: updatedSession,
        summary: {
          totalQuestions: session.total_questions,
          attempted: session.questions_attempted,
          correct: session.correct_answers,
          wrong: session.wrong_answers,
          skipped: session.skipped_questions + skippedCount,
          marksObtained: session.marks_obtained,
          totalMarks: session.total_marks,
          percentage,
          autoSubmitted: autoSubmit || false,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 5.4 Helper RPC Functions

```sql
-- ============================================
-- RPC: Increment question stats
-- ============================================

CREATE OR REPLACE FUNCTION public.increment_question_stats(
  p_question_id UUID,
  p_is_correct BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.questions
  SET 
    total_attempts = total_attempts + 1,
    correct_attempts = correct_attempts + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE id = p_question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RPC: Upsert topic analytics
-- ============================================

CREATE OR REPLACE FUNCTION public.upsert_topic_analytics(
  p_user_id UUID,
  p_topic_id UUID,
  p_attempted INTEGER,
  p_correct INTEGER,
  p_wrong INTEGER,
  p_skipped INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_existing RECORD;
  v_total_attempted INTEGER;
  v_total_correct INTEGER;
  v_accuracy REAL;
  v_strength TEXT;
BEGIN
  SELECT * INTO v_existing 
  FROM public.topic_analytics 
  WHERE user_id = p_user_id AND topic_id = p_topic_id;

  IF v_existing IS NOT NULL THEN
    v_total_attempted := v_existing.total_attempted + p_attempted;
    v_total_correct := v_existing.total_correct + p_correct;
    v_accuracy := CASE WHEN v_total_attempted > 0 
      THEN (v_total_correct::REAL / v_total_attempted) * 100 
      ELSE 0 END;
    v_strength := CASE 
      WHEN v_accuracy >= 80 THEN 'strong'
      WHEN v_accuracy >= 50 THEN 'neutral'
      ELSE 'weak' END;

    UPDATE public.topic_analytics
    SET 
      total_attempted = v_total_attempted,
      total_correct = v_total_correct,
      total_wrong = v_existing.total_wrong + p_wrong,
      total_skipped = v_existing.total_skipped + p_skipped,
      accuracy_percent = v_accuracy,
      strength_level = v_strength,
      last_practiced_at = now(),
      updated_at = now()
    WHERE id = v_existing.id;
  ELSE
    v_accuracy := CASE WHEN p_attempted > 0 
      THEN (p_correct::REAL / p_attempted) * 100 
      ELSE 0 END;
    v_strength := CASE 
      WHEN v_accuracy >= 80 THEN 'strong'
      WHEN v_accuracy >= 50 THEN 'neutral'
      ELSE 'weak' END;

    INSERT INTO public.topic_analytics (
      user_id, topic_id, total_attempted, total_correct, total_wrong,
      total_skipped, accuracy_percent, strength_level, last_practiced_at
    ) VALUES (
      p_user_id, p_topic_id, p_attempted, p_correct, p_wrong,
      p_skipped, v_accuracy, v_strength, now()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## PART 6: MIGRATION STEPS

### Step 1: Set Up Supabase Project
1. Create new Supabase project at https://supabase.com
2. Note down:
   - Project URL
   - anon key (public)
   - service_role key (private, for edge functions)
3. Enable desired auth providers (Email, Google, etc.)

### Step 2: Create Database Schema
1. Go to Supabase SQL Editor
2. Run the SQL from Part 2 (Enums, Tables, Indexes)
3. Run the SQL from Part 3 (Auth triggers)
4. Run the SQL from Part 4 (RLS policies)
5. Run the RPC functions from Part 5.4

### Step 3: Export Data from Replit PostgreSQL
```bash
# Connect to Replit DB and export
pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE \
  --data-only \
  --disable-triggers \
  --exclude-table-data='users' \
  > content_data.sql

# Export users separately (will need ID mapping)
pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE \
  --data-only \
  --table=users \
  > users_data.sql
```

### Step 4: Transform and Import Data
1. Edit exported SQL to change column names (snake_case)
2. For users: Map old IDs to new UUIDs, handle auth_user_id
3. Import content data first (subjects, topics, questions)
4. Import user data
5. Import user activity data (sessions, answers, analytics)

### Step 5: Deploy Edge Functions
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy start-session
supabase functions deploy submit-answer
supabase functions deploy complete-session
```

### Step 6: Update Mobile App

### Step 7: Validate
1. Test all auth flows
2. Test session creation
3. Test answer submission
4. Test analytics
5. Verify RLS policies work correctly

---

## PART 7: FRONTEND CHANGES

### 7.1 Required Environment Variables (Mobile App)

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxx
```

### 7.2 API Endpoints Mapping

| Old (Replit) | New (Supabase) | Type |
|-------------|----------------|------|
| `GET /api/subjects` | `supabase.from('subjects').select()` | Direct Query |
| `GET /api/subjects/:id/topics` | `supabase.from('topics').select().eq('subject_id', id)` | Direct Query |
| `GET /api/topics/:id/questions` | `supabase.from('questions').select().eq('topic_id', id)` | Direct Query |
| `GET /api/test-series` | `supabase.from('test_series').select()` | Direct Query |
| `GET /api/users/:id` | `supabase.from('users').select().eq('id', id)` | Direct Query |
| `POST /api/users/guest` | `supabase.rpc('get_or_create_guest_user', {p_device_id})` | RPC |
| `POST /api/sessions/start` | Edge Function: `/start-session` | Edge Function |
| `POST /api/sessions/:id/answer` | Edge Function: `/submit-answer` | Edge Function |
| `POST /api/sessions/:id/submit` | Edge Function: `/complete-session` | Edge Function |
| `GET /api/users/:id/analytics` | Direct query + client-side processing | Direct Query |

### 7.3 New Supabase Client Setup

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

---

## PART 8: VALIDATION CHECKLIST

### Pre-Migration
- [ ] Backup all Replit data
- [ ] Document all current API endpoints
- [ ] List all environment variables
- [ ] Test Supabase project connection

### Schema Migration
- [ ] All enums created
- [ ] All tables created with correct columns
- [ ] All indexes created
- [ ] All foreign keys working
- [ ] Triggers functioning

### Data Migration
- [ ] Subjects imported
- [ ] Topics imported
- [ ] Questions imported (verify JSON options)
- [ ] Test series imported
- [ ] Users imported with correct mapping
- [ ] Practice sessions imported
- [ ] User answers imported
- [ ] Topic analytics imported
- [ ] Bookmarks imported

### Auth
- [ ] Supabase Auth enabled
- [ ] Auth trigger creates user profile
- [ ] Guest user function works
- [ ] Guest-to-registered upgrade works
- [ ] Session persistence works on mobile

### RLS
- [ ] Users can only see their own data
- [ ] Content is publicly readable
- [ ] User data is protected
- [ ] Admin functions work

### Edge Functions
- [ ] start-session returns correct data
- [ ] submit-answer validates and scores correctly
- [ ] complete-session updates all stats
- [ ] Error handling works

### Mobile App
- [ ] Supabase client configured
- [ ] Auth flows working
- [ ] All queries returning data
- [ ] Edge functions callable
- [ ] Offline handling (if applicable)

### Performance
- [ ] Queries under 100ms
- [ ] Edge functions under 500ms
- [ ] No N+1 queries
- [ ] Indexes being used

---

## SECURITY FLAGS & RECOMMENDATIONS

### Current Issues Identified

1. **No Rate Limiting**: Add rate limiting to edge functions
2. **No Input Validation**: Add Zod validation in edge functions
3. **Guest Users Unbounded**: Consider cleanup policy for old guest accounts
4. **No Audit Logging**: Consider adding audit logs for sensitive operations

### Recommended Improvements

```sql
-- Add rate limiting table (optional)
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now()
);

-- Add audit log (optional)
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## QUICK START COMMANDS

```bash
# 1. Clone migration folder structure
mkdir -p supabase/functions/{start-session,submit-answer,complete-session}

# 2. Initialize Supabase
supabase init

# 3. Run schema migration
supabase db push

# 4. Deploy functions
supabase functions deploy --all

# 5. Test locally
supabase start
supabase functions serve

# 6. Verify deployment
curl https://YOUR_PROJECT.supabase.co/functions/v1/start-session
```

---

**Migration Complete!** Your exam platform is now fully running on Supabase with no Replit dependency.

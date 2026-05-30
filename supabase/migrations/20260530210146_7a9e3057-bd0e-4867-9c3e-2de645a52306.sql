-- =========================================================
-- Academy LMS: courses, lessons, quizzes, results, certs
-- =========================================================

CREATE TABLE public.academy_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category text,
  required boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.academy_courses TO anon, authenticated;
GRANT ALL ON public.academy_courses TO service_role;
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses are publicly readable"
  ON public.academy_courses FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "Admins manage courses"
  ON public.academy_courses FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.academy_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  lesson_number integer NOT NULL,
  video_url text,
  content text,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, slug),
  UNIQUE(course_id, lesson_number)
);
CREATE INDEX idx_academy_lessons_course ON public.academy_lessons(course_id, sort_order);
GRANT SELECT ON public.academy_lessons TO anon, authenticated;
GRANT ALL ON public.academy_lessons TO service_role;
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lessons are publicly readable"
  ON public.academy_lessons FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "Admins manage lessons"
  ON public.academy_lessons FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Per-lesson progress (separate from existing academy_progress which tracks module-level pass/fail)
CREATE TABLE public.academy_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.academy_lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
CREATE INDEX idx_lesson_progress_user_course ON public.academy_lesson_progress(user_id, course_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_lesson_progress TO authenticated;
GRANT ALL ON public.academy_lesson_progress TO service_role;
ALTER TABLE public.academy_lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own lesson progress"
  ON public.academy_lesson_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own lesson progress"
  ON public.academy_lesson_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own lesson progress"
  ON public.academy_lesson_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins manage lesson progress"
  ON public.academy_lesson_progress FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.academy_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  passing_score integer NOT NULL DEFAULT 80,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id)
);
GRANT SELECT ON public.academy_quizzes TO anon, authenticated;
GRANT ALL ON public.academy_quizzes TO service_role;
ALTER TABLE public.academy_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quizzes readable"
  ON public.academy_quizzes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage quizzes"
  ON public.academy_quizzes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.academy_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.academy_quizzes(id) ON DELETE CASCADE,
  question text NOT NULL,
  answers jsonb NOT NULL,
  correct_answer integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_quiz_questions_quiz ON public.academy_quiz_questions(quiz_id, sort_order);
-- Authenticated-only to avoid leaking correct answers to anon
GRANT SELECT ON public.academy_quiz_questions TO authenticated;
GRANT ALL ON public.academy_quiz_questions TO service_role;
ALTER TABLE public.academy_quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view quiz questions"
  ON public.academy_quiz_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage quiz questions"
  ON public.academy_quiz_questions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.academy_quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.academy_quizzes(id) ON DELETE CASCADE,
  score integer NOT NULL,
  passed boolean NOT NULL DEFAULT false,
  completed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_quiz_results_user ON public.academy_quiz_results(user_id, course_id);
GRANT SELECT, INSERT ON public.academy_quiz_results TO authenticated;
GRANT ALL ON public.academy_quiz_results TO service_role;
ALTER TABLE public.academy_quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own quiz results"
  ON public.academy_quiz_results FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own quiz results"
  ON public.academy_quiz_results FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage quiz results"
  ON public.academy_quiz_results FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.academy_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  certification_name text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  certificate_url text,
  UNIQUE(user_id, course_id)
);
CREATE INDEX idx_certifications_user ON public.academy_certifications(user_id);
-- Public read so badges can render on public profiles
GRANT SELECT ON public.academy_certifications TO anon, authenticated;
GRANT INSERT ON public.academy_certifications TO authenticated;
GRANT ALL ON public.academy_certifications TO service_role;
ALTER TABLE public.academy_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Certifications publicly readable"
  ON public.academy_certifications FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "Users insert own certifications"
  ON public.academy_certifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage certifications"
  ON public.academy_certifications FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

## Academy LMS — Full Build Plan

Transform the academy from a single-route mockup into a full LMS with per-course routes, per-lesson pages, real DB-backed content, quizzes, and certificates.

### 1. Database (new migration)

Create real content tables (separate from runtime `academy_progress`):

- `academy_courses` — slug, title, summary, description, cert_level, order, icon, required_for_paid
- `academy_lessons` — course_id, slug, order, title, headline, body (markdown), key_takeaways[], checklist[], video_url, video_provider, est_minutes
- `academy_lesson_progress` — user_id, lesson_id, completed_at (unique on user_id+lesson_id)
- `academy_quizzes` — course_id, passing_score, time_limit
- `academy_quiz_questions` — quiz_id, order, prompt, choices (jsonb), correct_index, explanation
- `academy_quiz_attempts` — user_id, quiz_id, score, passed, answers (jsonb), created_at
- `academy_certificates` — user_id, course_id, certificate_no, issued_at, score
- `academy_downloads` — course_id, title, file_url, kind

All public-read for courses/lessons/quizzes/questions (questions exclude correct_index via view or server-side filtering); per-user RLS for progress/attempts/certificates.

Keep existing `academy_progress` + `runner_profiles.certification_*` for top-level cert tracking; sync via trigger when all course certificates issued.

### 2. Seed content

Migration seeds 8 courses:
1. Orientation (Welcome to REI Runner)
2. Photography Standards
3. Walkthrough Video Standards
4. Occupancy Check Procedures
5. Lockbox Installation (full 8-lesson buildout per spec)
6. Property Condition Reporting
7. Client Communication
8. Professional Conduct & Safety

Each course gets 4–8 real lessons with headline, body, key takeaways, checklist; each gets a 5–10 question quiz. Lockbox gets the exact 8 lessons specified.

### 3. Routes

```
/academy                           — course catalog (rebuild)
/academy/$courseSlug               — course overview + lesson list + progress + downloads
/academy/$courseSlug/$lessonSlug   — lesson page (content, video, checklist, prev/next, mark complete)
/academy/$courseSlug/quiz          — quiz runner (locked until all lessons done)
/academy/$courseSlug/certificate   — certificate viewer + PDF download (locked until quiz passed)
```

All under `_authenticated`. Delete legacy `/academy/$moduleId` route.

### 4. Server functions (`src/lib/academy.functions.ts` rewrite)

- `listCourses()` — courses + per-user progress %
- `getCourse(slug)` — course + lessons + lesson completion + downloads + quiz status + cert
- `getLesson(courseSlug, lessonSlug)` — lesson + prev/next + completion
- `completeLesson(lessonId)` — upsert progress, return next-unlock
- `getQuiz(courseSlug)` — quiz + questions (no correct answers) + gate check
- `submitQuiz(courseSlug, answers)` — score, persist attempt, issue cert on pass
- `getCertificate(courseSlug)` — cert + PDF (reuse `pdf-lib` from existing certificate.functions.ts)

### 5. UI components

- `CourseCard` — progress bar, cert badge, locked state
- `LessonListItem` — completion check, lock icon, duration
- `LessonViewer` — markdown body, video embed, checklist, prev/next, complete button
- `QuizRunner` — one-question-at-a-time, submit, results
- `CertificateView` — preview + download

YouTube/Vimeo embed helper detects provider from URL.

### 6. Out of scope (deferred — call out to user)

- Admin course builder UI (DB schema supports it; CRUD UI would 2x the work). Will note admins can edit via DB for now.
- File upload UI for downloads/videos (storage bucket + admin form).
- Investor training track.

### Risks

- Large migration with seed content (~1500 lines SQL). One shot.
- Existing `/academy` and `academy_progress` rows become legacy; will keep table but stop writing to it from new flow (or sync on course completion).
- Course slugs must match route params exactly.

### Order of operations

1. Migration (tables + seed) → user approves
2. Server functions
3. Route files (catalog → course → lesson → quiz → certificate)
4. Components
5. Verify build, smoke-test navigation

Admin builder UI deferred — confirm OK or expand scope.

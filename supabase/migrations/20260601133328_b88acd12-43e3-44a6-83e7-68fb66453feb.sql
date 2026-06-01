-- Wipe test/seed marketplace data prior to app store submission.
-- Preserves: profiles, user_roles, academy content, app_settings, applications.
TRUNCATE TABLE
  public.message_attachments,
  public.messages,
  public.conversation_participants,
  public.conversations,
  public.task_files,
  public.task_submissions,
  public.payments,
  public.invoices,
  public.payout_requests,
  public.reviews,
  public.reports,
  public.disputes,
  public.notifications,
  public.activity_events,
  public.favorite_runners,
  public.runner_availability_blocks,
  public.tasks
RESTART IDENTITY CASCADE;
-- Reports
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('profile','task','message','review')),
  target_id uuid NOT NULL,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 80),
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','dismissed','actioned')),
  admin_notes text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users create reports" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users view own reports" ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);
CREATE POLICY "Admins manage reports" ON public.reports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Disputes
CREATE TABLE public.disputes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL,
  opened_by uuid NOT NULL,
  against_id uuid,
  category text NOT NULL CHECK (category IN ('payment','quality','scope','communication','other')),
  description text NOT NULL CHECK (char_length(description) BETWEEN 10 AND 4000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','under_review','resolved','closed')),
  resolution text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.disputes TO authenticated;
GRANT ALL ON public.disputes TO service_role;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties view own disputes" ON public.disputes FOR SELECT TO authenticated
  USING (auth.uid() = opened_by OR auth.uid() = against_id);
CREATE POLICY "Parties open disputes on own tasks" ON public.disputes FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = opened_by AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id AND (t.investor_id = auth.uid() OR t.runner_id = auth.uid())
    )
  );
CREATE POLICY "Admins manage disputes" ON public.disputes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER disputes_touch BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER reports_touch BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Activity feed
CREATE TABLE public.activity_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id uuid,
  event_type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.activity_events TO authenticated;
GRANT ALL ON public.activity_events TO service_role;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read activity" ON public.activity_events FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Admins manage activity" ON public.activity_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX activity_events_created_idx ON public.activity_events (created_at DESC);

-- Auto-feed triggers
CREATE OR REPLACE FUNCTION public.log_task_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_events (actor_id, event_type, title, body, link, metadata)
    VALUES (NEW.investor_id, 'task_posted',
            'New task posted: ' || NEW.title,
            COALESCE(NEW.city,'') || CASE WHEN NEW.state IS NOT NULL THEN ', '||NEW.state ELSE '' END,
            '/tasks/' || NEW.id,
            jsonb_build_object('task_id', NEW.id, 'task_type', NEW.task_type));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'assigned' AND NEW.runner_id IS NOT NULL THEN
      INSERT INTO public.activity_events (actor_id, event_type, title, link, metadata)
      VALUES (NEW.runner_id, 'task_assigned', 'Task assigned: ' || NEW.title,
              '/tasks/' || NEW.id, jsonb_build_object('task_id', NEW.id));
    ELSIF NEW.status IN ('completed','approved') THEN
      INSERT INTO public.activity_events (actor_id, event_type, title, link, metadata)
      VALUES (NEW.runner_id, 'task_completed', 'Task completed: ' || NEW.title,
              '/tasks/' || NEW.id, jsonb_build_object('task_id', NEW.id));
    END IF;
  END IF;
  RETURN NEW;
END;$$;

CREATE TRIGGER tasks_activity AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_task_activity();

CREATE OR REPLACE FUNCTION public.log_review_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_events (actor_id, event_type, title, link, metadata)
  VALUES (NEW.reviewer_id, 'review_left',
          NEW.rating || '-star review left',
          '/profile/edit',
          jsonb_build_object('rating', NEW.rating, 'reviewee_id', NEW.reviewee_id));
  RETURN NEW;
END;$$;
CREATE TRIGGER reviews_activity AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.log_review_activity();

CREATE OR REPLACE FUNCTION public.log_signup_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_events (actor_id, event_type, title, link, metadata)
  VALUES (NEW.user_id, 'user_joined',
          'New member joined REI Runner',
          CASE WHEN NEW.profile_slug IS NOT NULL THEN '/profile/' || NEW.profile_slug ELSE NULL END,
          jsonb_build_object('user_id', NEW.user_id));
  RETURN NEW;
END;$$;
CREATE TRIGGER profiles_activity AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_signup_activity();
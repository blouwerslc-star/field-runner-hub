
-- 1. Extend task_templates
ALTER TABLE public.task_templates
  ADD COLUMN IF NOT EXISTS required_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS runner_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS intro_notes text;

-- 2. Extend tasks
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.task_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_inputs jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_tasks_template_id ON public.tasks(template_id);

-- 3. task_checklist_progress
CREATE TABLE IF NOT EXISTS public.task_checklist_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  step_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','skipped','done')),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  file_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  completed_by uuid,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, step_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_checklist_progress TO authenticated;
GRANT ALL ON public.task_checklist_progress TO service_role;
ALTER TABLE public.task_checklist_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task parties view checklist progress" ON public.task_checklist_progress
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
        AND (t.runner_id = auth.uid() OR t.investor_id = auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Runner writes own task checklist" ON public.task_checklist_progress
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.runner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Runner updates own task checklist" ON public.task_checklist_progress
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.runner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.runner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admin deletes checklist" ON public.task_checklist_progress
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_task_checklist_progress_touch
  BEFORE UPDATE ON public.task_checklist_progress
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. task_type_requests
CREATE TABLE IF NOT EXISTS public.task_type_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  proposed_name text NOT NULL,
  task_type_slug text,
  description text NOT NULL,
  deliverables text[] NOT NULL DEFAULT '{}'::text[],
  suggested_payout numeric,
  example_inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','needs_info')),
  admin_notes text,
  created_template_id uuid REFERENCES public.task_templates(id) ON DELETE SET NULL,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_type_requests TO authenticated;
GRANT ALL ON public.task_type_requests TO service_role;
ALTER TABLE public.task_type_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requester views own requests" ON public.task_type_requests
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Requester creates own requests" ON public.task_type_requests
  FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Admin updates requests" ON public.task_type_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin deletes requests" ON public.task_type_requests
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_task_type_requests_touch
  BEFORE UPDATE ON public.task_type_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5. Notification triggers for task_type_requests
CREATE OR REPLACE FUNCTION public.notify_task_type_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    SELECT ur.user_id, 'task_type_request', 'New task type requested',
           NEW.proposed_name || ' — review pending',
           '/admin/task-type-requests'
      FROM public.user_roles ur
     WHERE ur.role = 'admin'::app_role;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.requester_id, 'task_type_request_' || NEW.status,
            'Task type request ' || NEW.status,
            COALESCE(NEW.admin_notes, NEW.proposed_name),
            '/dashboard/investor');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_task_type_request_ins ON public.task_type_requests;
CREATE TRIGGER trg_notify_task_type_request_ins
  AFTER INSERT ON public.task_type_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_task_type_request();

DROP TRIGGER IF EXISTS trg_notify_task_type_request_upd ON public.task_type_requests;
CREATE TRIGGER trg_notify_task_type_request_upd
  AFTER UPDATE ON public.task_type_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_task_type_request();

-- 6. Seed runner_steps for the 16 existing system templates
-- Helper macro inline using UPDATE per template.

UPDATE public.task_templates SET
  intro_notes = 'Drive to the property, verify location via GPS, then capture exterior photos from each side. All photos must be clear and taken in daylight when possible.',
  runner_steps = '[
    {"key":"arrive","title":"Arrive at the property","instructions":"Drive to the property address. You will be auto-marked arrived when inside the geofence.","type":"geofence_arrive","required":true},
    {"key":"photo_front","title":"Front exterior photo","instructions":"Photo of the front of the house showing the full facade.","type":"photo","required":true,"min_count":1},
    {"key":"photo_left","title":"Left side photo","instructions":"Photo of the left side of the property.","type":"photo","required":true,"min_count":1},
    {"key":"photo_right","title":"Right side photo","instructions":"Photo of the right side of the property.","type":"photo","required":true,"min_count":1},
    {"key":"photo_back","title":"Back exterior photo","instructions":"Photo of the rear of the property.","type":"photo","required":true,"min_count":1},
    {"key":"photo_street","title":"Street view","instructions":"Photo of the street looking at the property from the curb.","type":"photo","required":true,"min_count":1},
    {"key":"notes","title":"Notes for investor","instructions":"Anything notable: damage, hazards, occupancy signs, etc.","type":"note","required":false}
  ]'::jsonb
WHERE name IN ('Property Photos','Basic Exterior Property Photos');

UPDATE public.task_templates SET
  intro_notes = 'Capture a full exterior photo set including front, sides, back, and street view.',
  runner_steps = '[
    {"key":"arrive","title":"Arrive at the property","type":"geofence_arrive","required":true},
    {"key":"photo_front","title":"Front exterior","type":"photo","required":true,"min_count":1},
    {"key":"photo_left","title":"Left side","type":"photo","required":true,"min_count":1},
    {"key":"photo_right","title":"Right side","type":"photo","required":true,"min_count":1},
    {"key":"photo_back","title":"Back exterior","type":"photo","required":true,"min_count":1},
    {"key":"photo_street","title":"Street view","type":"photo","required":true,"min_count":1},
    {"key":"photo_roof","title":"Roofline","instructions":"Photo showing roof condition from ground level.","type":"photo","required":true,"min_count":1},
    {"key":"photo_yard","title":"Yard / driveway","type":"photo","required":true,"min_count":1},
    {"key":"notes","title":"Condition notes","type":"note","required":false}
  ]'::jsonb
WHERE name = 'Full Property Photo Set';

UPDATE public.task_templates SET
  intro_notes = 'Walk through the property and record a single continuous video. Narrate room-by-room.',
  required_fields = '[
    {"key":"access_instructions","label":"Access instructions","type":"textarea","required":true,"help":"Lockbox code, key location, or who to meet."}
  ]'::jsonb,
  runner_steps = '[
    {"key":"arrive","title":"Arrive at the property","type":"geofence_arrive","required":true},
    {"key":"access","title":"Confirm access","instructions":"Use the access instructions provided by the investor.","type":"checkbox","required":true},
    {"key":"video_walkthrough","title":"Record walkthrough video","instructions":"One continuous video, narrate as you walk room-by-room. 3 minutes minimum.","type":"video","required":true,"min_count":1},
    {"key":"photo_issues","title":"Photos of any issues","instructions":"Close-ups of damage, leaks, or notable features.","type":"photo","required":false,"min_count":1},
    {"key":"notes","title":"Walkthrough notes","type":"note","required":false}
  ]'::jsonb
WHERE name IN ('Walkthrough Video','Video Walkthrough');

UPDATE public.task_templates SET
  intro_notes = 'Determine whether the property appears occupied or vacant. Look for signs of life without trespassing.',
  runner_steps = '[
    {"key":"arrive","title":"Arrive at the property","type":"geofence_arrive","required":true},
    {"key":"photo_front","title":"Front of house","type":"photo","required":true,"min_count":1},
    {"key":"photo_mailbox","title":"Mailbox / front door area","instructions":"Look for accumulated mail or notices.","type":"photo","required":true,"min_count":1},
    {"key":"photo_utilities","title":"Utility meters","instructions":"Photo of electric/gas meters if visible.","type":"photo","required":false,"min_count":1},
    {"key":"occupancy_status","title":"Occupancy determination","instructions":"Select what you observed.","type":"checkbox","required":true,"data_schema":{"options":["Occupied","Vacant","Unclear"]}},
    {"key":"knock_result","title":"Knock result (optional)","instructions":"If you knocked, what happened?","type":"note","required":false},
    {"key":"notes","title":"Additional observations","type":"note","required":true}
  ]'::jsonb
WHERE name IN ('Occupancy Check','Vacancy / Occupancy Verification','Vacant Property Verification');

UPDATE public.task_templates SET
  intro_notes = 'Install the lockbox at the property. Photograph before and after.',
  required_fields = '[
    {"key":"lockbox_code","label":"Lockbox combination","type":"text","required":true},
    {"key":"install_location","label":"Where to install","type":"text","required":true,"help":"e.g. front door knob, side gate, water spigot"},
    {"key":"key_location","label":"Key pickup location","type":"text","required":true}
  ]'::jsonb,
  runner_steps = '[
    {"key":"pickup_key","title":"Pick up the key","instructions":"Pick up the key from the investor-provided location.","type":"checkbox","required":true},
    {"key":"arrive","title":"Arrive at the property","type":"geofence_arrive","required":true},
    {"key":"photo_before","title":"Before photo","instructions":"Photo of install location before mounting.","type":"photo","required":true,"min_count":1},
    {"key":"install","title":"Install the lockbox","instructions":"Set the combination provided and mount the lockbox. Place the key inside and verify.","type":"checkbox","required":true},
    {"key":"photo_after","title":"After photo","instructions":"Photo of installed lockbox.","type":"photo","required":true,"min_count":1},
    {"key":"photo_combo","title":"Combination test","instructions":"Photo or short video confirming combo opens the box.","type":"photo","required":true,"min_count":1}
  ]'::jsonb
WHERE name IN ('Lockbox Install','Lockbox Installation');

UPDATE public.task_templates SET
  intro_notes = 'Remove the lockbox from the property and return the key.',
  required_fields = '[
    {"key":"lockbox_code","label":"Lockbox combination","type":"text","required":true},
    {"key":"return_location","label":"Where to return key + lockbox","type":"text","required":true}
  ]'::jsonb,
  runner_steps = '[
    {"key":"arrive","title":"Arrive at the property","type":"geofence_arrive","required":true},
    {"key":"photo_before","title":"Lockbox in place","type":"photo","required":true,"min_count":1},
    {"key":"remove","title":"Remove lockbox","instructions":"Open with combination, remove key, take lockbox off.","type":"checkbox","required":true},
    {"key":"photo_after","title":"After removal","instructions":"Photo of the spot after removal.","type":"photo","required":true,"min_count":1},
    {"key":"return","title":"Return key + lockbox","instructions":"Confirm dropped at the return location.","type":"checkbox","required":true}
  ]'::jsonb
WHERE name = 'Lockbox Removal';

UPDATE public.task_templates SET
  intro_notes = 'Complete a detailed property condition report. Document every room and any issues.',
  runner_steps = '[
    {"key":"arrive","title":"Arrive at the property","type":"geofence_arrive","required":true},
    {"key":"exterior_photos","title":"Exterior photos (all sides)","type":"photo","required":true,"min_count":4},
    {"key":"interior_living","title":"Living areas","type":"photo","required":true,"min_count":2},
    {"key":"interior_kitchen","title":"Kitchen","type":"photo","required":true,"min_count":2},
    {"key":"interior_bathrooms","title":"Bathrooms","type":"photo","required":true,"min_count":1},
    {"key":"interior_bedrooms","title":"Bedrooms","type":"photo","required":true,"min_count":2},
    {"key":"systems","title":"HVAC / water heater / electrical panel","type":"photo","required":true,"min_count":3},
    {"key":"issues","title":"Damage / issues close-ups","type":"photo","required":false,"min_count":1},
    {"key":"report","title":"Written condition report","instructions":"Summarize overall condition and any concerns.","type":"note","required":true}
  ]'::jsonb
WHERE name = 'Property Condition Report';

UPDATE public.task_templates SET
  intro_notes = 'Assist with a property showing. Arrive early, unlock, and stay for the duration.',
  required_fields = '[
    {"key":"showing_time","label":"Showing start time","type":"text","required":true},
    {"key":"buyer_contact","label":"Buyer / agent contact","type":"text","required":true},
    {"key":"access_instructions","label":"Access instructions","type":"textarea","required":true}
  ]'::jsonb,
  runner_steps = '[
    {"key":"arrive","title":"Arrive 10 min early","type":"geofence_arrive","required":true},
    {"key":"unlock","title":"Unlock and turn on lights","type":"checkbox","required":true},
    {"key":"meet","title":"Meet buyer / agent","type":"checkbox","required":true},
    {"key":"photo_attendees","title":"Photo at start of showing","type":"photo","required":true,"min_count":1},
    {"key":"showing_complete","title":"Showing complete","type":"checkbox","required":true},
    {"key":"lock_up","title":"Lock up and confirm secured","type":"checkbox","required":true},
    {"key":"photo_final","title":"Photo of secured door","type":"photo","required":true,"min_count":1},
    {"key":"notes","title":"Showing notes","type":"note","required":true}
  ]'::jsonb
WHERE name = 'Showing Assistance';

UPDATE public.task_templates SET
  intro_notes = 'Deliver the document to the recipient and obtain proof of delivery.',
  required_fields = '[
    {"key":"pickup_location","label":"Document pickup location","type":"text","required":true},
    {"key":"recipient_name","label":"Recipient name","type":"text","required":true},
    {"key":"recipient_address","label":"Recipient address","type":"address","required":true},
    {"key":"recipient_phone","label":"Recipient phone","type":"phone","required":false},
    {"key":"signature_required","label":"Signature required?","type":"text","required":false,"help":"Yes / No"}
  ]'::jsonb,
  runner_steps = '[
    {"key":"pickup","title":"Pick up document","instructions":"Pick up at the pickup location.","type":"checkbox","required":true},
    {"key":"photo_doc","title":"Photo of sealed document","type":"photo","required":true,"min_count":1},
    {"key":"arrive","title":"Arrive at recipient","type":"geofence_arrive","required":true},
    {"key":"handoff","title":"Hand off to recipient","type":"checkbox","required":true},
    {"key":"signature","title":"Recipient signature","instructions":"Have the recipient sign on screen.","type":"signature","required":true},
    {"key":"photo_delivery","title":"Proof of delivery photo","instructions":"Photo of recipient with document, or document at delivery location.","type":"photo","required":true,"min_count":1}
  ]'::jsonb
WHERE name = 'Document Delivery';

UPDATE public.task_templates SET
  intro_notes = 'Install the yard sign at the property in a visible location from the street.',
  required_fields = '[
    {"key":"sign_pickup","label":"Sign pickup location","type":"text","required":true},
    {"key":"placement","label":"Preferred placement","type":"text","required":false}
  ]'::jsonb,
  runner_steps = '[
    {"key":"pickup","title":"Pick up sign","type":"checkbox","required":true},
    {"key":"arrive","title":"Arrive at the property","type":"geofence_arrive","required":true},
    {"key":"install","title":"Install sign in yard","instructions":"Visible from the street, securely planted.","type":"checkbox","required":true},
    {"key":"photo_installed","title":"Photo of installed sign","instructions":"From the street, showing the sign in context.","type":"photo","required":true,"min_count":1},
    {"key":"photo_closeup","title":"Closeup of sign","type":"photo","required":true,"min_count":1}
  ]'::jsonb
WHERE name = 'Yard Sign Installation';

UPDATE public.task_templates SET
  intro_notes = 'Meet a contractor or buyer at the property to provide access.',
  required_fields = '[
    {"key":"meeting_time","label":"Meeting time","type":"text","required":true},
    {"key":"contact_name","label":"Contact name","type":"text","required":true},
    {"key":"contact_phone","label":"Contact phone","type":"phone","required":true},
    {"key":"purpose","label":"Purpose of meeting","type":"textarea","required":true},
    {"key":"access_instructions","label":"Access instructions","type":"textarea","required":true}
  ]'::jsonb,
  runner_steps = '[
    {"key":"arrive","title":"Arrive at the property","type":"geofence_arrive","required":true},
    {"key":"meet","title":"Meet contact","type":"checkbox","required":true},
    {"key":"unlock","title":"Provide access","type":"checkbox","required":true},
    {"key":"photo_meeting","title":"Photo at meeting","instructions":"Photo confirming the meeting happened (with permission).","type":"photo","required":true,"min_count":1},
    {"key":"complete","title":"Meeting complete & secured","type":"checkbox","required":true},
    {"key":"notes","title":"Meeting notes","type":"note","required":true}
  ]'::jsonb
WHERE name = 'Contractor / Buyer Meetup';

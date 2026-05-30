CREATE TABLE public.academy_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NULL,
  lesson_id UUID NULL,
  audience TEXT NOT NULL DEFAULT 'both' CHECK (audience IN ('runner','investor','both')),
  title TEXT NOT NULL,
  description TEXT NULL,
  vendor TEXT NULL,
  image_url TEXT NULL,
  affiliate_url TEXT NOT NULL,
  price_display TEXT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_academy_products_course ON public.academy_products(course_id);
CREATE INDEX idx_academy_products_lesson ON public.academy_products(lesson_id);

GRANT SELECT ON public.academy_products TO anon, authenticated;
GRANT ALL ON public.academy_products TO service_role;

ALTER TABLE public.academy_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products publicly readable"
ON public.academy_products FOR SELECT
TO anon, authenticated
USING (active = true);

CREATE POLICY "Admins manage products"
ON public.academy_products FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Shift lockbox lessons >=2 down by 1 (use a temporary offset to avoid unique-key collisions)
UPDATE public.academy_lessons
SET lesson_number = lesson_number + 1000,
    sort_order = sort_order + 1000
WHERE course_id = (SELECT id FROM public.academy_courses WHERE slug = 'lockbox')
  AND lesson_number >= 2;

UPDATE public.academy_lessons
SET lesson_number = lesson_number - 999,
    sort_order = sort_order - 999
WHERE course_id = (SELECT id FROM public.academy_courses WHERE slug = 'lockbox')
  AND lesson_number >= 1000;

INSERT INTO public.academy_lessons (course_id, slug, title, lesson_number, sort_order, content, checklist)
VALUES (
  (SELECT id FROM public.academy_courses WHERE slug = 'lockbox'),
  'how-rei-runner-provides-lockboxes',
  'How REI Runner Provides Lockboxes',
  2,
  2,
  $LESSON$When an investor books a lockbox installation through REI Runner, we handle the hardware so the runner can show up ready to work. Here is exactly how the lockbox gets from us to the property.

1. INVESTOR REQUEST
The investor selects "Lockbox Installation" when posting the task and chooses one of three options:
  - Use a lockbox the investor already owns on-site
  - Order a REI Runner-supplied lockbox (added to the task invoice)
  - Buy a recommended lockbox themselves using one of our affiliate links and ship to the property

2. REI RUNNER FULFILLMENT
For REI Runner-supplied units, we stock approved Master Lock 5400D / 5440D shackle boxes. Once the task is assigned:
  - We ship the lockbox directly to the property OR to the assigned runner, whichever is faster
  - The runner gets a tracking number in the task thread
  - A pre-set default code is printed inside the box. The runner resets it on-site and only the investor receives the final code

3. RUNNER PICK-UP / ON-SITE DELIVERY
If the lockbox ships to the runner, they bring it to the appointment. If it ships to the property, the runner verifies the package on arrival before starting installation. Never install a damaged or tampered-with unit — message ops and we ship a replacement same-day.

4. CODE HANDOFF
The runner sets the new combination, photographs the closed lockbox in place, and submits the code through the task completion form. REI Runner releases the code to the investor only after payment is confirmed.

5. RECOMMENDED PURCHASES
Below this lesson you will find affiliate links to the exact lockboxes, shackle guards, and key tags REI Runner approves. Investors can order them directly; runners can keep a personal spare in their vehicle for emergencies. These purchases support the platform at no extra cost to you.

If anything about provisioning is unclear on a specific task, message the ops team in the task thread BEFORE driving to the property.$LESSON$,
  '["Confirm lockbox source on the task before driving to the property", "Verify tracking number if REI Runner is shipping the unit", "Inspect packaging for tampering before installing", "Reset the default code on-site — never reuse the factory code", "Submit the final code through the completion form, not in chat"]'::jsonb
);

INSERT INTO public.academy_products (course_id, lesson_id, audience, title, vendor, description, affiliate_url, sort_order, active)
VALUES
  ((SELECT id FROM public.academy_courses WHERE slug = 'lockbox'),
   (SELECT id FROM public.academy_lessons WHERE slug = 'how-rei-runner-provides-lockboxes'),
   'both',
   'Master Lock 5400D Portable Lock Box',
   'Master Lock',
   'REI Runner approved. 4-digit combination, shackle-mount. Stock unit we ship for most jobs.',
   'https://example.com/affiliate/master-5400d',
   1, false),
  ((SELECT id FROM public.academy_courses WHERE slug = 'lockbox'),
   (SELECT id FROM public.academy_lessons WHERE slug = 'how-rei-runner-provides-lockboxes'),
   'runner',
   'Heavy-Duty Shackle Guard',
   NULL,
   'Recommended add-on for outdoor installs in high-traffic areas.',
   'https://example.com/affiliate/shackle-guard',
   2, false);
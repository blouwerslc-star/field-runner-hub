
create table public.field_runner_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  city text not null,
  state text not null,
  has_transportation text not null,
  has_smartphone text not null,
  services text[] not null default '{}',
  availability text not null,
  experience text,
  sample_url text,
  disclaimer_agreed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.real_estate_pro_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  company_name text,
  role text not null,
  market_city text not null,
  market_state text not null,
  services_needed text[] not null default '{}',
  frequency text not null,
  budget text,
  urgency text not null,
  details text,
  created_at timestamptz not null default now()
);

alter table public.field_runner_applications enable row level security;
alter table public.real_estate_pro_applications enable row level security;

-- No public policies; inserts happen via server function using service role.

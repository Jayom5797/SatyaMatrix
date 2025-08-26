-- Supabase schema for SatyaMatrix reports
-- Run this in Supabase SQL editor

-- 1) Table: reports
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Source information
  source_type text check (source_type in ('image','headline','link')),
  source_url text,
  image_url text,
  headline text,
  link text,

  -- Analysis
  title text,
  analysis_text text,
  reliability numeric(5,2), -- 0.00 - 100.00
  reasons jsonb default '[]'::jsonb,     -- array of strings
  tags jsonb default '[]'::jsonb,        -- array of strings

  -- Engagement
  views integer not null default 0,
  upvotes integer not null default 0,

  -- Publishing state
  status text not null default 'published' check (status in ('draft','published','removed'))
);

-- Keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

-- 2) Row Level Security
alter table public.reports enable row level security;

-- Read policy: allow anonymous read of published reports only
drop policy if exists "Read published reports" on public.reports;
create policy "Read published reports"
  on public.reports for select
  to anon
  using (status = 'published');

-- Insert/Update/Delete: restricted (service role only). No anon policy needed.
-- Backend will use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.

-- 3) Storage bucket (create bucket manually if not yet): reports-media
-- Make it public so images are accessible from the frontend.
-- In SQL editor you can run:
-- select storage.create_bucket('reports-media', public => true, file_size_limit => 10485760);

-- 4) Voting: per-user vote table (1 = like, -1 = dislike)
create table if not exists public.report_votes (
  report_id uuid not null references public.reports(id) on delete cascade,
  voter_id text not null,
  vote integer not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (report_id, voter_id)
);

-- Keep updated_at in sync for votes
drop trigger if exists report_votes_set_updated_at on public.report_votes;
create trigger report_votes_set_updated_at
before update on public.report_votes
for each row execute function public.set_updated_at();

-- Enable RLS and allow anonymous read of votes (writes via backend service role)
alter table public.report_votes enable row level security;
drop policy if exists "Read votes" on public.report_votes;
create policy "Read votes"
  on public.report_votes for select
  to anon
  using (true);

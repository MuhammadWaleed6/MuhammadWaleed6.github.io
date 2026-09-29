-- ============================================================
-- Muhammad Walid Portfolio — Supabase schema + policies
-- Run this whole file in: Supabase Dashboard → SQL Editor → New query
-- Safe to re-run (idempotent).
-- ============================================================

-- ------------------------------------------------------------
-- 1. ADMIN ALLOWLIST
-- ------------------------------------------------------------
-- The single source of truth for who is an admin. A user is
-- authorized only if their authenticated email exists here.
create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Admins can read the allowlist (needed client-side to decide "isAdmin").
-- Uses is_admin() (SECURITY DEFINER) instead of querying admin_users directly —
-- querying the table from its own policy causes infinite recursion.
drop policy if exists "admin_users readable by admins" on public.admin_users;
create policy "admin_users readable by admins"
  on public.admin_users for select
  using (public.is_admin());

-- The very first admin must be inserted manually (see README):
--   insert into public.admin_users (email) values ('you@example.com');

-- Helper: is the current request from an authorized admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.role() = 'authenticated' and exists (
    select 1 from public.admin_users a
    where lower(a.email) = lower(auth.jwt() ->> 'email')
  );
$$;

-- ------------------------------------------------------------
-- 2. SITE SETTINGS (single row, id = 1)
-- ------------------------------------------------------------
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  site_title text not null default 'Muhammad Walid — Web Developer',
  meta_description text not null default 'I build thoughtful digital experiences and modern web applications.',
  display_name text not null default 'Muhammad Walid',
  professional_title text not null default 'Web Developer / Full-Stack Developer',
  hero_label text not null default 'WEB DEVELOPER • DIGITAL BUILDER',
  hero_heading text not null default 'Hi, I''m Muhammad Walid.',
  hero_subheading text not null default 'I build thoughtful digital experiences and modern web applications.',
  hero_description text not null default 'I''m a web developer with a background in business and information technology. I enjoy turning ideas into useful, clean, and engaging digital products.',
  about_text text not null default '',
  profile_image_url text,
  availability_text text not null default 'Available for new projects',
  availability_is_open boolean not null default true,
  contact_email text not null default '',
  github_url text not null default '',
  linkedin_url text not null default '',
  twitter_url text not null default '',
  other_social_url text not null default '',
  resume_url text not null default '',
  footer_text text not null default 'Designed and built with care.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "anyone can read site settings" on public.site_settings;
create policy "anyone can read site settings"
  on public.site_settings for select using (true);

drop policy if exists "admins can update site settings" on public.site_settings;
create policy "admins can update site settings"
  on public.site_settings for update using (public.is_admin());

-- ------------------------------------------------------------
-- 3. PROJECTS
-- ------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text not null default '',
  full_description text not null default '',
  cover_image_url text,
  gallery_images text[] not null default '{}',
  technologies text[] not null default '{}',
  category text not null default 'General',
  live_url text,
  github_url text,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_published_idx on public.projects (is_published, sort_order);
create index if not exists projects_category_idx on public.projects (category);

alter table public.projects enable row level security;

drop policy if exists "anyone can read published projects" on public.projects;
create policy "anyone can read published projects"
  on public.projects for select
  using (is_published = true or public.is_admin());

drop policy if exists "admins can insert projects" on public.projects;
create policy "admins can insert projects"
  on public.projects for insert with check (public.is_admin());

drop policy if exists "admins can update projects" on public.projects;
create policy "admins can update projects"
  on public.projects for update using (public.is_admin());

drop policy if exists "admins can delete projects" on public.projects;
create policy "admins can delete projects"
  on public.projects for delete using (public.is_admin());

-- ------------------------------------------------------------
-- 4. SKILLS
-- ------------------------------------------------------------
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Frontend',
  icon text,
  proficiency_label text,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists skills_visible_idx on public.skills (is_visible, sort_order);

alter table public.skills enable row level security;

drop policy if exists "anyone can read visible skills" on public.skills;
create policy "anyone can read visible skills"
  on public.skills for select
  using (is_visible = true or public.is_admin());

drop policy if exists "admins can insert skills" on public.skills;
create policy "admins can insert skills"
  on public.skills for insert with check (public.is_admin());

drop policy if exists "admins can update skills" on public.skills;
create policy "admins can update skills"
  on public.skills for update using (public.is_admin());

drop policy if exists "admins can delete skills" on public.skills;
create policy "admins can delete skills"
  on public.skills for delete using (public.is_admin());

-- ------------------------------------------------------------
-- 5. SERVICES
-- ------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  icon text,
  starting_price text,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists services_visible_idx on public.services (is_visible, sort_order);

alter table public.services enable row level security;

drop policy if exists "anyone can read visible services" on public.services;
create policy "anyone can read visible services"
  on public.services for select
  using (is_visible = true or public.is_admin());

drop policy if exists "admins can insert services" on public.services;
create policy "admins can insert services"
  on public.services for insert with check (public.is_admin());

drop policy if exists "admins can update services" on public.services;
create policy "admins can update services"
  on public.services for update using (public.is_admin());

drop policy if exists "admins can delete services" on public.services;
create policy "admins can delete services"
  on public.services for delete using (public.is_admin());

-- ------------------------------------------------------------
-- 6. TIMELINE (education + experience in one table)
-- ------------------------------------------------------------
create table if not exists public.timeline_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'experience' check (kind in ('experience', 'education', 'milestone')),
  title text not null,
  organization text,
  description text not null default '',
  start_date text,
  end_date text,
  is_current boolean not null default false,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists timeline_visible_idx on public.timeline_items (is_visible, kind, sort_order);

alter table public.timeline_items enable row level security;

drop policy if exists "anyone can read visible timeline items" on public.timeline_items;
create policy "anyone can read visible timeline items"
  on public.timeline_items for select
  using (is_visible = true or public.is_admin());

drop policy if exists "admins can insert timeline items" on public.timeline_items;
create policy "admins can insert timeline items"
  on public.timeline_items for insert with check (public.is_admin());

drop policy if exists "admins can update timeline items" on public.timeline_items;
create policy "admins can update timeline items"
  on public.timeline_items for update using (public.is_admin());

drop policy if exists "admins can delete timeline items" on public.timeline_items;
create policy "admins can delete timeline items"
  on public.timeline_items for delete using (public.is_admin());

-- ------------------------------------------------------------
-- 7. CONTACT MESSAGES
-- ------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);
create index if not exists contact_messages_unread_idx on public.contact_messages (is_read);

alter table public.contact_messages enable row level security;

-- ONLY insert for everyone (public contact form). No select/update/delete for the public.
drop policy if exists "anyone can submit a message" on public.contact_messages;
create policy "anyone can submit a message"
  on public.contact_messages for insert with check (
    char_length(name) between 1 and 120
    and char_length(email) between 3 and 200
    and char_length(subject) between 1 and 200
    and char_length(message) between 1 and 5000
  );

drop policy if exists "admins can read messages" on public.contact_messages;
create policy "admins can read messages"
  on public.contact_messages for select using (public.is_admin());

drop policy if exists "admins can update messages" on public.contact_messages;
create policy "admins can update messages"
  on public.contact_messages for update using (public.is_admin());

drop policy if exists "admins can delete messages" on public.contact_messages;
create policy "admins can delete messages"
  on public.contact_messages for delete using (public.is_admin());

-- Basic anti-spam: max 5 messages per 10 minutes per IP hash.
create or replace function public.check_message_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from public.contact_messages
    where created_at > now() - interval '10 minutes'
      and email = new.email
  ) >= 5 then
    raise exception 'Too many messages sent. Please try again later.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists contact_messages_rate_limit on public.contact_messages;
create trigger contact_messages_rate_limit
  before insert on public.contact_messages
  for each row execute function public.check_message_rate_limit();

-- ------------------------------------------------------------
-- 8. STORAGE (bucket: portfolio-media)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do nothing;

-- Public read of uploaded assets.
drop policy if exists "public read portfolio media" on storage.objects;
create policy "public read portfolio media"
  on storage.objects for select
  using (bucket_id = 'portfolio-media');

-- Only admins can upload.
drop policy if exists "admins can upload portfolio media" on storage.objects;
create policy "admins can upload portfolio media"
  on storage.objects for insert
  with check (bucket_id = 'portfolio-media' and public.is_admin());

-- Only admins can update/overwrite.
drop policy if exists "admins can update portfolio media" on storage.objects;
create policy "admins can update portfolio media"
  on storage.objects for update
  using (bucket_id = 'portfolio-media' and public.is_admin());

-- Only admins can delete.
drop policy if exists "admins can delete portfolio media" on storage.objects;
create policy "admins can delete portfolio media"
  on storage.objects for delete
  using (bucket_id = 'portfolio-media' and public.is_admin());

-- ------------------------------------------------------------
-- 9. AUTO-UPDATE updated_at
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['projects','skills','services','timeline_items','site_settings']
  loop
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format(
      'create trigger touch_updated_at before update on public.%I
       for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ============================================================
-- 10. SEED DATA (clearly labeled — edit or delete freely)
-- ============================================================
insert into public.site_settings (id) values (1)
on conflict (id) do nothing;

-- Example starter services — VISIBLE. Edit or delete them from the dashboard.
insert into public.services (title, description, icon, sort_order) values
  ('Website Development', 'Complete, responsive websites built from concept to launch — designed around your content and goals.', 'pi pi-globe', 1),
  ('React Frontend Development', 'Modern, component-driven interfaces built with React: fast, accessible, and maintainable.', 'pi pi-bolt', 2),
  ('Business Websites', 'Professional sites that present your business clearly and convert visitors into customers.', 'pi pi-briefcase', 3),
  ('E-commerce Websites', 'Online stores with clean product presentation, cart, and checkout flows.', 'pi pi-shopping-cart', 4),
  ('Website Improvements & Maintenance', 'Performance, accessibility, bug fixes, and ongoing updates for existing sites.', 'pi pi-wrench', 5)
on conflict do nothing;

-- NOTE: skills, projects and timeline rows are intentionally NOT seeded —
-- add your real ones from the admin dashboard so nothing fake goes public.

-- ============================================================
-- 11. TEAM MEMBERS (contributors shown with Muhammad Walid)
-- ============================================================
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  role text not null default '',
  bio text not null default '',
  photo_url text,
  skills text[] not null default '{}',
  achievements text[] not null default '{}',
  projects text[] not null default '{}',
  github_url text,
  linkedin_url text,
  twitter_url text,
  website_url text,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_members_visible_idx on public.team_members (is_visible, sort_order);

alter table public.team_members enable row level security;

drop policy if exists "anyone can read visible team members" on public.team_members;
create policy "anyone can read visible team members"
  on public.team_members for select
  using (is_visible = true or public.is_admin());

drop policy if exists "admins can insert team members" on public.team_members;
create policy "admins can insert team members"
  on public.team_members for insert with check (public.is_admin());

drop policy if exists "admins can update team members" on public.team_members;
create policy "admins can update team members"
  on public.team_members for update using (public.is_admin());

drop policy if exists "admins can delete team members" on public.team_members;
create policy "admins can delete team members"
  on public.team_members for delete using (public.is_admin());

-- updated_at trigger for the new table
DROP TRIGGER IF EXISTS touch_updated_at ON public.team_members;
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Example team profiles (clearly marked — replace from the dashboard).
insert into public.team_members (name, slug, role, bio, skills, achievements, projects, is_visible, sort_order)
select v.name, v.slug, v.role, v.bio, v.skills, v.achievements, v.projects, true, v.sort_order
from (
  values
    (
      'Ayesha Malik', 'ayesha-malik', 'UI/UX Designer',
      'Designs clean, user-first interfaces and turns rough ideas into polished visuals. Works on layout systems, design tokens and accessible components. (Example profile — replace from the admin dashboard.)',
      array['Figma','Design Systems','Prototyping','Wireframing'],
      array['Designed 20+ responsive web interfaces','Built a reusable design system used across projects','Improved onboarding flow through usability testing'],
      array['E-commerce UI Kit — complete storefront interface design','SaaS Analytics Dashboard — UX and visual design'],
      1
    ),
    (
      'Bilal Ahmed', 'bilal-ahmed', 'Full-Stack Developer',
      'Builds end-to-end web applications with modern JavaScript — from database schema to deployed frontend. Focuses on performance and clean architecture. (Example profile — replace from the admin dashboard.)',
      array['React','Node.js','PostgreSQL','REST APIs'],
      array['Shipped 10+ production web applications','Built REST APIs handling high daily traffic','Mentored junior developers on modern React patterns'],
      array['Inventory Management System — React + Node.js platform','Business Website Suite — multi-tenant business sites'],
      2
    )
) as v(name, slug, role, bio, skills, achievements, projects, sort_order)
where not exists (select 1 from public.team_members where slug = v.slug);

/* ============================================================
   BLOG POSTS
   ============================================================ */
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  content text not null default '',
  cover_image_url text,
  tags text[] not null default '{}',
  reading_minutes integer not null default 3,
  is_published boolean not null default false,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

-- Public: published posts only
drop policy if exists "blog_public_read" on public.blog_posts;
create policy "blog_public_read"
  on public.blog_posts for select
  using (is_published = true);

-- Admins: allowlisted admins manage everything
drop policy if exists "blog_admin_all" on public.blog_posts;
create policy "blog_admin_all"
  on public.blog_posts for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists blog_posts_published_sort_idx
  on public.blog_posts (sort_order, created_at desc)
  where is_published = true;

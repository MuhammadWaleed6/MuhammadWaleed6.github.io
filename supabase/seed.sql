-- ============================================================
-- SEED CONTENT — starter data for Muhammad Walid's portfolio
-- Run AFTER schema.sql (SQL Editor, or included in the migration).
--
-- Contains only confirmed details: BBIT student, 4 years of web
-- development experience. No fake projects, employers, or links.
-- Proficiency labels are intentionally empty (neutral display).
--
-- Idempotent: safe to run multiple times, no duplicates.
-- Every row is editable/deletable in the admin dashboard.
-- ============================================================

-- ------------------------------------------------------------
-- Skills (grouped by category; edit freely from the dashboard)
-- ------------------------------------------------------------
insert into public.skills (name, category, sort_order, is_visible)
select v.name, v.category, v.sort_order, true
from (
  values
    ('HTML5',                'Frontend', 1),
    ('CSS3',                 'Frontend', 2),
    ('JavaScript (ES6+)',    'Frontend', 3),
    ('React',                'Frontend', 4),
    ('Responsive Design',    'Frontend', 5),
    ('Node.js',              'Backend', 1),
    ('REST APIs',            'Backend', 2),
    ('PostgreSQL',           'Databases', 1),
    ('Supabase',             'Databases', 2),
    ('Git & GitHub',         'Tools', 1),
    ('Vite',                 'Tools', 2),
    ('npm',                  'Tools', 3),
    ('VS Code',              'Tools', 4),
    ('UI Design Principles', 'Design & Workflow', 1),
    ('Accessibility',        'Design & Workflow', 2),
    ('SEO Basics',           'Design & Workflow', 3)
) as v(name, category, sort_order)
where not exists (
  select 1 from public.skills s where s.name = v.name and s.category = v.category
);

-- ------------------------------------------------------------
-- Education (confirmed: BBIT student — add your university and
-- start year from the dashboard's Experience & Education page)
-- ------------------------------------------------------------
insert into public.timeline_items (kind, title, description, is_current, is_visible, sort_order)
select
  'education',
  'BBIT — Bachelor of Business & Information Technology',
  'Undergraduate degree combining business fundamentals with information technology.',
  true,
  true,
  1
where not exists (
  select 1 from public.timeline_items where kind = 'education' and title like 'BBIT%'
);

-- ------------------------------------------------------------
-- Experience (confirmed: 4 years of web development; start year
-- inferred from that. Edit or hide until it reads right.)
-- ------------------------------------------------------------
insert into public.timeline_items (kind, title, description, start_date, is_current, is_visible, sort_order)
select
  'experience',
  'Web Developer',
  'Four years of hands-on experience designing, building, and maintaining websites and web applications.',
  '2022',
  true,
  true,
  1
where not exists (
  select 1 from public.timeline_items where kind = 'experience' and title = 'Web Developer'
);

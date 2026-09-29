/**
 * Creates the blog_posts table (RLS-enabled), then inserts three real,
 * CV-based posts. Idempotent: safe to re-run (posts are upserted by slug).
 * Usage: node scripts/setup-blog.mjs   (needs SUPABASE_DB_PASSWORD in .env)
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Client } from 'pg'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

const envText = readFileSync(join(root, '.env'), 'utf8')
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .map((line) => {
      const idx = line.indexOf('=')
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
    })
)

const password = env.SUPABASE_DB_PASSWORD
if (!password) {
  console.error('Missing SUPABASE_DB_PASSWORD in .env')
  process.exit(1)
}

const host = process.env.SUPABASE_POOLER_HOST || 'aws-0-ap-northeast-2.pooler.supabase.com'
const port = Number(process.env.SUPABASE_POOLER_PORT || 6543)
const user = `postgres.${process.env.SUPABASE_PROJECT_REF || 'uhdcibnqoekacwtcrqxm'}`

const client = new Client({
  host,
  port,
  user,
  password,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
})

async function connectWithRetry(attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await client.connect()
      console.log(`Connected via ${host}:${port} (attempt ${i}) ✓`)
      return
    } catch (err) {
      console.log(`connect attempt ${i}/${attempts} failed: ${err.message.slice(0, 80)}`)
      if (i === attempts) throw err
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
}

const POSTS = [
  {
    slug: 'how-i-built-my-portfolio-with-react-and-supabase',
    title: 'How I Built My Portfolio with React and Supabase',
    excerpt:
      'The full story behind mwalid.me — the stack choices, the admin dashboard, RLS security, and the SEO work that made the site fast and findable.',
    tags: ['React', 'Supabase', 'Portfolio', 'SEO'],
    minutes: 5,
    order: 1,
    content: `This website is more than a showcase — it is the best example of how I work. I designed it, built it, secured it, and optimized it for search engines end to end. Here is how each piece came together.

## Choosing the stack

I wanted a personal site that loads instantly, ranks well on Google, and lets me update everything without touching code. That pointed me to three decisions:

**React + Vite** for the frontend — a fast single-page app with clean routing, code-splitting so the admin bundle is never downloaded by visitors, and a component structure I can grow into a blog or bigger features later.

**Supabase** as the backend — PostgreSQL for real relational data, Row Level Security for authorization, Auth for my admin login, and Storage for images. One platform, no servers to maintain.

**GitHub Pages** for hosting — free, dependable, and it deploys automatically every time I push to main. The site goes live at mwalid.me within two minutes of a change.

## The admin dashboard

The heart of the site is a private dashboard where I manage every piece of content: projects, skills, services, my experience timeline, team profiles, and the contact inbox. Everything is CRUD — no redeploying just to fix a typo.

Security was the part I cared about most. Being logged in is not enough: my email must exist in an \`admin_users\` allowlist table, and Row Level Security policies enforce that on the database itself. Even if someone had a valid account, they could not read or write my content unless the database says they are an admin. The dashboard also lives on an unlisted URL with noindex meta, so it never appears in search results.

## Search engine optimization

A portfolio nobody can find is a poster in a drawer. So the site ships with a complete SEO layer: unique titles and descriptions per page, canonical URLs, Open Graph tags for social sharing, JSON-LD structured data, a sitemap, and static per-route HTML files so every page answers Google with a proper 200 response instead of a client-side 404.

## What I learned

The biggest lesson: real products are never "done". I keep improving the site — adding features, tightening security, tuning performance — the same way I would for a client. That mindset, treating your own name as a product you maintain, is what I bring to every project I work on.`,
  },
  {
    slug: 'responsive-design-lessons-from-building-real-websites',
    title: '5 Responsive Design Lessons I Learned Building Real Websites',
    excerpt:
      'Media queries are the easy part. These are the practical lessons — from scroll animations to layout bugs — that only show up when real users open your site on real phones.',
    tags: ['CSS', 'Responsive Design', 'Frontend'],
    minutes: 4,
    order: 2,
    content: `After building client sites and my own portfolio, I have learned that responsive design is not about media queries — it is about how content behaves when you are not looking at it. These five lessons come straight from bugs I have fixed.

## 1. Test the whole page, not the screenshot

On my portfolio, the skills grid stayed invisible on phones for weeks. Why? A scroll-reveal animation waited for 12% of the section to be visible — but on a small screen the section was taller than the viewport, so that moment never came. The fix was revealing on any intersection. The lesson: an animation that depends on layout geometry will break when layout changes. Test by scrolling the whole page on a real device, not by resizing a screenshot.

## 2. Design the small screen first

Writing mobile styles first and enhancing for desktop keeps the CSS honest. When I started with desktop, every section needed a mobile "fix" later. Now the stacked layout is the default, and desktop is the enhancement — grids expand, side columns appear, spacing grows.

## 3. Real devices catch what emulators miss

Chrome's device toolbar is great, but a real budget Android phone on slow mobile data shows you things no emulator will: a font that loads too late, a hero image that eats the data plan, a tap target your thumb keeps missing. I test on at least one real low-end phone before calling any project done.

## 4. Respect the thumb, not just the eye

On desktop, anything clickable is reachable. On mobile, navigation lives at the top of the screen but thumbs hover at the bottom. That is why my mobile menu is a full drawer with large tap targets, and important actions sit within easy reach. Tap targets should be at least 44×44 pixels — anything smaller feels broken.

## 5. Performance is a responsive feature

A pixel-perfect responsive layout means nothing if it takes six seconds to appear. I lazy-load images below the fold, keep the CSS lean, and let the critical content render first. Responsive design includes how fast the page responds — especially on the slowest connection your visitors will use.`,
  },
  {
    slug: 'from-php-to-react-my-web-development-journey',
    title: 'From PHP to React: My Web Development Journey',
    excerpt:
      'I started with PHP and MySQL back-ends, moved through WordPress and Flutter, and found my home in modern JavaScript. Here is what each stop taught me.',
    tags: ['Career', 'PHP', 'React', 'Journey'],
    minutes: 4,
    order: 3,
    content: `Nobody's path into web development is a straight line. Mine started with PHP, detoured through WordPress and mobile UIs, and landed on React. Each stop taught me something I still use every day.

## Where it started: PHP and MySQL

My first professional role was as a Junior PHP Developer at 360 TechSolution in Karachi. I built back-end systems with PHP and MySQL, including e-commerce solutions — and that is where I learned the fundamentals that still shape my work: how a request becomes a response, how to model data in a relational database, and why security is a backend concern before it is a frontend one.

## The WordPress years

Part of my job was building client websites with WordPress and Elementor. It taught me deliverability: real clients need sites they can edit themselves, on budget, on deadline. I learned theme customization, plugin judgment — when a plugin saves a day and when it creates a year of maintenance — and how to translate a business requirement into a working page.

## The detour: mobile UIs with Flutter

I also designed mobile interfaces with Flutter and Firebase. Even though I did not become a mobile developer, it permanently changed how I think: app-like interactions, component state, and smooth 60fps interfaces. When I later met React, it felt familiar immediately — the component thinking was the same.

## Home: React and modern JavaScript

Today I am a Senior Frontend Developer at Diginers, building responsive websites and dashboards with React, JavaScript, and modern CSS. React clicked for me because it connects both worlds: the component discipline I learned from Flutter with the rendering and content focus I learned from the web.

## What the journey taught me

Technologies change; fundamentals do not. HTTP, databases, responsive layout, accessibility, and clear communication with clients are the same in every stack. If you are early in your journey: learn one stack deeply instead of five shallowly, build real things, and let every project — even the ones that fail — teach you the next step.`,
  },
]

await connectWithRetry()

/* 1. Table + RLS (matches supabase/schema.sql) */
await client.query(`
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
  drop policy if exists "blog_public_read" on public.blog_posts;
  create policy "blog_public_read" on public.blog_posts for select using (is_published = true);
  drop policy if exists "blog_admin_all" on public.blog_posts;
  create policy "blog_admin_all" on public.blog_posts for all using (public.is_admin()) with check (public.is_admin());
  create index if not exists blog_posts_published_sort_idx
    on public.blog_posts (sort_order, created_at desc) where is_published = true;
`)
console.log('✓ blog_posts table + RLS ready')

/* 2. Three CV-based posts (upsert by slug) */
for (const p of POSTS) {
  await client.query(
    `insert into public.blog_posts (title, slug, excerpt, content, tags, reading_minutes, is_published, is_visible, sort_order)
     values ($1,$2,$3,$4,$5::text[],$6,true,true,$7)
     on conflict (slug) do update set
       title = excluded.title,
       excerpt = excluded.excerpt,
       content = excluded.content,
       tags = excluded.tags,
       reading_minutes = excluded.reading_minutes,
       sort_order = excluded.sort_order,
       updated_at = now()`,
    [p.title, p.slug, p.excerpt, p.content, p.tags, p.minutes, p.order]
  )
  console.log(`  ✓ post: ${p.slug}`)
}
console.log(`✓ ${POSTS.length} blog posts upserted`)

const { rows } = await client.query(
  'select slug, title, reading_minutes from public.blog_posts order by sort_order'
)
console.table(rows)

await client.end()
console.log('Done ✓')

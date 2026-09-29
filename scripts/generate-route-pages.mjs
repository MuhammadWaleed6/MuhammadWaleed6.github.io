/**
 * Generates static per-route copies of dist/index.html so GitHub Pages
 * serves real 200 responses for deep links like /about instead of the
 * SPA-fallback 404 that Google cannot index.
 *
 * Each copy gets route-specific title/description/canonical/OG tags that
 * exactly match what the React page sets at runtime, so crawlers that
 * render JS and those that don't see consistent metadata.
 *
 * Runs automatically after `vite build` (see package.json).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const DIST = 'dist'
const template = readFileSync(join(DIST, 'index.html'), 'utf8')

const ROUTES = [
  {
    path: '/',
    title: 'Muhammad Walid | Web Developer & Portfolio',
    description:
      'Portfolio of Muhammad Walid, a web developer building modern websites and web applications with React, Node.js and clean, user-focused design. Explore projects, services and get in touch.',
  },
  {
    path: '/about',
    title: 'About — Muhammad Walid',
    description:
      'Learn about Muhammad Walid — a web developer with a business & IT background, four years of hands-on web experience, and a practical, business-aware approach to building products.',
  },
  {
    path: '/skills',
    title: 'Skills — Muhammad Walid',
    description:
      'The technologies and tools Muhammad Walid works with — including HTML, CSS, JavaScript, React and Node.js — for building modern websites and web applications.',
  },
  {
    path: '/projects',
    title: 'Projects — Muhammad Walid',
    description:
      'Browse real projects built by Muhammad Walid — websites and web applications taken end-to-end, from the first idea to a deployed product.',
  },
  {
    path: '/services',
    title: 'Services — Muhammad Walid',
    description:
      'Web development services by Muhammad Walid — from a first website to modern web applications, with focused, practical delivery.',
  },
  {
    path: '/team',
    title: 'Team — Muhammad Walid',
    description:
      'Meet the trusted collaborators Muhammad Walid works with to design, build and ship bigger web projects.',
  },
  {
    path: '/contact',
    title: 'Contact — Muhammad Walid',
    description:
      'Get in touch with Muhammad Walid — send a message about your project, question or idea, and expect a reply within a day or two.',
  },
]

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function replaceFirst(html, regex, replacement, label) {
  if (!regex.test(html)) {
    throw new Error(`generate-route-pages: could not find ${label} in index.html`)
  }
  return html.replace(regex, replacement)
}

function buildPage({ path, title, description }) {
  const url = `https://mwalid.me${path}`
  let html = template

  html = replaceFirst(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`, 'title')
  html = replaceFirst(
    html,
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${esc(description)}" />`,
    'meta description'
  )
  html = replaceFirst(
    html,
    /<link rel="canonical" href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${url}" />`,
    'canonical'
  )
  html = replaceFirst(
    html,
    /<meta\s+property="og:title"[\s\S]*?\/>/,
    `<meta property="og:title" content="${esc(title)}" />`,
    'og:title'
  )
  html = replaceFirst(
    html,
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${esc(description)}" />`,
    'og:description'
  )
  html = replaceFirst(
    html,
    /<meta\s+property="og:url"[\s\S]*?\/>/,
    `<meta property="og:url" content="${url}" />`,
    'og:url'
  )
  html = replaceFirst(
    html,
    /<meta\s+name="twitter:title"[\s\S]*?\/>/,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    'twitter:title'
  )
  html = replaceFirst(
    html,
    /<meta\s+name="twitter:description"[\s\S]*?\/>/,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    'twitter:description'
  )
  return html
}

for (const route of ROUTES) {
  const html = buildPage(route)
  const outFile =
    route.path === '/'
      ? join(DIST, 'index.html')
      : join(DIST, route.path.slice(1), 'index.html')
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, html)
  console.log(`  ✓ ${route.path} → ${outFile}`)
}

console.log(`generate-route-pages: ${ROUTES.length} route pages written.`)

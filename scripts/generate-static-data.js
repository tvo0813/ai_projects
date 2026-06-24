#!/usr/bin/env node
/**
 * Converts backend CSV files into static JSON for GitHub Pages builds.
 * Usage: node scripts/generate-static-data.js [store-slug]
 *   store-slug defaults to all stores if omitted.
 * Output: frontend/public/data/<slug>/{menu,deals,locations}.json
 */

const fs   = require('fs')
const path = require('path')

const ROOT       = path.resolve(__dirname, '..')
const MENUS_DIR  = path.join(ROOT, 'backend', 'menus')
const OUTPUT_DIR = path.join(ROOT, 'frontend', 'public', 'data')

// ── Minimal CSV parser (handles quoted fields) ────────────────────────────────
function parseCSV(raw) {
  const lines = raw.trim().split(/\r?\n/)
  const headers = splitCSVLine(lines[0])
  return lines.slice(1).map(line => {
    const values = splitCSVLine(line)
    const row = {}
    headers.forEach((h, i) => { row[h.trim()] = (values[i] ?? '').trim() })
    return row
  })
}

function splitCSVLine(line) {
  const result = []
  let cur = '', inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; continue }
    if (ch === '"') { inQuote = !inQuote; continue }
    if (ch === ',' && !inQuote) { result.push(cur); cur = ''; continue }
    cur += ch
  }
  result.push(cur)
  return result
}

// ── Stable item ID (slug + name → kebab) ─────────────────────────────────────
function makeId(slug, name) {
  return slug + '-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ── Transformers ──────────────────────────────────────────────────────────────
function transformMenu(rows, slug) {
  return rows
    .filter(r => r.name)
    .map(r => ({
      item_id:     r.item_id || makeId(slug, r.name),
      name:        r.name,
      category:    r.category || 'other',
      description: r.description || null,
      price:       parseFloat(r.price) || 0,
      image_url:   r.image_url || null,
      is_available: r.is_available !== 'false',
      tags:        r.tags ? r.tags.split('|').map(t => t.trim()) : [],
      config_json: r.customizations ? parseCustomizations(r.customizations) : null,
    }))
}

function parseCustomizations(raw) {
  const result = {}
  raw.split(';').forEach(part => {
    const [key, opts] = part.split('=')
    if (key && opts) result[key.trim()] = opts.split('|').map(o => o.trim())
  })
  return result
}

function transformDeals(rows) {
  return rows
    .filter(r => r.title)
    .map(r => ({
      title:          r.title,
      description:    r.description || '',
      discount_type:  r.discount_type || 'fixed_amount',
      discount_value: parseFloat(r.discount_value) || 0,
      label:          r.label || '',
      expires_at:     r.expires_at || null,
      badge:          r.badge || null,
    }))
}

function transformLocations(rows) {
  return rows
    .filter(r => r.name)
    .map(r => {
      const full = [r.address, r.city, r.state, r.zip, r.country].filter(Boolean).join(', ')
      const q    = encodeURIComponent(full)
      return {
        name:                  r.name,
        address:               r.address || '',
        city:                  r.city    || '',
        state:                 r.state   || '',
        zip:                   r.zip     || '',
        country:               r.country || '',
        hours:                 r.hours   || null,
        phone:                 r.phone   || null,
        full_address:          full,
        maps_embed_url_keyed:  `https://www.google.com/maps/embed/v1/place?key=&q=${q}`,
        maps_embed_url_legacy: `https://maps.google.com/maps?q=${q}&output=embed`,
        maps_link_url:         `https://www.google.com/maps/search/?api=1&query=${q}`,
      }
    })
}

// ── Main ──────────────────────────────────────────────────────────────────────
const targetSlug = process.argv[2] || null
const stores = targetSlug
  ? [targetSlug]
  : fs.readdirSync(MENUS_DIR).filter(d => fs.statSync(path.join(MENUS_DIR, d)).isDirectory())

let generated = 0
for (const slug of stores) {
  const menuDir = path.join(MENUS_DIR, slug)
  if (!fs.existsSync(menuDir)) {
    console.error(`✗  Store not found: ${slug}`)
    process.exit(1)
  }

  const outDir = path.join(OUTPUT_DIR, slug)
  fs.mkdirSync(outDir, { recursive: true })

  const files = {
    'menu.json':      () => transformMenu(parseCSV(fs.readFileSync(path.join(menuDir, 'menu.csv'), 'utf8')), slug),
    'deals.json':     () => transformDeals(parseCSV(fs.readFileSync(path.join(menuDir, 'deals.csv'), 'utf8'))),
    'locations.json': () => transformLocations(parseCSV(fs.readFileSync(path.join(menuDir, 'locations.csv'), 'utf8'))),
  }

  for (const [filename, transform] of Object.entries(files)) {
    const src = path.join(menuDir, filename.replace('.json', '.csv'))
    if (!fs.existsSync(src)) { console.warn(`  ⚠  Missing ${src}, skipping`); continue }
    const data = transform()
    fs.writeFileSync(path.join(outDir, filename), JSON.stringify(data, null, 2))
    console.log(`  ✓  ${slug}/${filename}  (${data.length} records)`)
    generated++
  }
}

console.log(`\nDone. ${generated} files written to frontend/public/data/`)

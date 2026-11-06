/**
 * LLM Menu Generator
 *
 * Given a list of restaurants (from geo-search) and a normalised user intent,
 * asks Groq to generate realistic menu items for each venue tailored to the
 * user's request. This means every restaurant discovered around Kyiv gets a
 * unique, contextually-relevant menu — no hardcoded data needed.
 *
 * Caching strategy:
 *   - Key: "{restaurantName}|{category}|{dietary}|{maxBudget}"
 *   - TTL: 10 minutes — menus don't change during a demo session
 *
 * Fallback: if Groq is unavailable, falls back to SQLite menu matching.
 */

import { TtlCache } from '../../shared/cache/ttlCache.js'

// Cache generated menus for 10 minutes per restaurant+intent combo
const generatedMenuCache = new TtlCache(10 * 60_000)

// Unsplash photo IDs mapped to food categories — used for realistic images
const CATEGORY_PHOTOS = {
  burger:     'photo-1568901346375-23c9450c58cd',
  pizza:      'photo-1513104890138-7c749659a591',
  pasta:      'photo-1473093295043-cdd812d0e601',
  sushi:      'photo-1579871494447-9811cf80d66c',
  ramen:      'photo-1569718212165-3a8278d5f624',
  curry:      'photo-1603894584373-5ac82b2ae398',
  soup:       'photo-1547592180-85f173990554',
  salad:      'photo-1512621776951-a57141f2eefd',
  bowl:       'photo-1512621776951-a57141f2eefd',
  steak:      'photo-1546964124-0cce460f38ef',
  chicken:    'photo-1606755962773-d324e0a13086',
  fish:       'photo-1467003909585-2f8a72700288',
  seafood:    'photo-1563379926898-05f4575a45d8',
  sandwich:   'photo-1509722747041-616f39b57569',
  wrap:       'photo-1626700051175-6818013e1d4f',
  kebab:      'photo-1599487488310-9efea7ff0bb4',
  default:    'photo-1504674900247-0877df9cc836',
}

function photoForCategory(category = '') {
  const lower = category.toLowerCase()
  return Object.entries(CATEGORY_PHOTOS).find(([key]) => lower.includes(key))?.[1]
    ?? CATEGORY_PHOTOS.default
}

// ─── Groq LLM call ────────────────────────────────────────────────────────────
async function generateMenuViaGroq(restaurant, intent) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null

  const { cleanQuery, category, dietary = [], maxBudget } = intent

  const budgetHint = maxBudget ? `Max price per item: $${maxBudget}.` : 'No price limit.'
  const dietaryHint = dietary.length ? `Dietary requirements: ${dietary.join(', ')}.` : ''

  const prompt = `You are a menu generator for a food delivery app.
Generate exactly 3 menu items for a restaurant called "${restaurant.name}" located in Kyiv, Ukraine.
The user is looking for: "${cleanQuery || category}".
${budgetHint} ${dietaryHint}
Cuisine style: infer from restaurant name.

Return a JSON object with key "items" containing an array of exactly 3 objects, each with:
- id: unique slug (lowercase, hyphens, include restaurant slug and item name, e.g. "tokyo-house-spicy-ramen")
- name: dish name (realistic, specific)
- description: one sentence, appetising, mention 2-3 key ingredients
- price: number in USD (realistic for Kyiv, between 8 and 28)
- prepTime: integer minutes (10-40)
- rating: number between 4.2 and 5.0
- tag: short label like "Chef's pick", "Most popular", "New", "Spicy", "Vegan"
- dietary: array of applicable tags from ["vegan","vegetarian","spicy","gluten-free","seafood","meat"]`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4_000)

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        temperature: 0.7,          // slight creativity so menus differ between restaurants
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are a menu generator. Respond only with valid JSON.' },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!res.ok) return null
    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) return null

    const parsed = JSON.parse(content)
    const items = Array.isArray(parsed.items) ? parsed.items : null
    if (!items || items.length === 0) return null

    // Enrich each item with restaurant coords + photo
    return items.map((item) => ({
      id: item.id ?? `${restaurant.id}-item-${Math.random().toString(36).slice(2, 7)}`,
      name: item.name,
      restaurant: restaurant.name,
      description: item.description,
      price: Number(item.price) || 12,
      rating: String(item.rating ?? '4.5'),
      time: `${item.prepTime ?? 20}–${(item.prepTime ?? 20) + 10} min`,
      image: photoForCategory(category),
      tag: item.tag ?? 'Popular',
      dietary: item.dietary ?? [],
      lat: restaurant.lat,
      lng: restaurant.lng,
    }))
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Generate menu items for a list of restaurants using the LLM.
 * Runs all restaurants in parallel, caches results per restaurant+intent.
 *
 * @param {Restaurant[]} restaurants  — from geo-search
 * @param {object}       intent       — from normalizeQuery()
 * @param {number}       [limit=6]    — max total items to return
 * @returns {Promise<{ items: MenuItem[], markers: MapMarker[], source: 'llm'|'fallback' }>}
 */
export async function generateMenuItems(restaurants, intent, limit = 6) {
  const { category = '', dietary = [], maxBudget = null } = intent

  // Generate menus for up to 4 restaurants in parallel
  const targets = restaurants.slice(0, 4)

  const results = await Promise.all(
    targets.map(async (restaurant) => {
      const cacheKey = `gen|${restaurant.name}|${category}|${dietary.join(',')}|${maxBudget}`
      const cached = generatedMenuCache.get(cacheKey)
      if (cached) return cached

      const items = await generateMenuViaGroq(restaurant, intent)
      if (items) {
        generatedMenuCache.set(cacheKey, items)
        return items
      }
      return null
    }),
  )

  // Flatten, filter budget, keep top items
  const allItems = results
    .filter(Boolean)
    .flat()
    .filter((item) => maxBudget === null || item.price <= maxBudget)
    .slice(0, limit)

  if (allItems.length === 0) return null  // signal caller to use fallback

  // Deduplicated map markers
  const markerMap = new Map()
  allItems.forEach((item) => {
    if (!markerMap.has(item.restaurant)) {
      markerMap.set(item.restaurant, { name: item.restaurant, lat: item.lat, lng: item.lng })
    }
  })

  return {
    items: allItems,
    markers: [...markerMap.values()],
    source: 'llm',
  }
}

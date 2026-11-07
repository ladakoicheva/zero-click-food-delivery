import { searchRestaurants, matchMenuItems } from './service.js'
import { generateMenuItems } from './menuGenerator.js'
import { normalizeQuery } from '../llm/service.js'
import { saveGeneratedMenuItems } from '../../database/database.js'
import { foodTerms } from '../../shared/foodDictionary.js'

/**
 * GET /api/restaurants?lat=50.45&lng=30.52&q=spicy+chicken
 *
 * Pipeline:
 *  1. Normalise raw query → structured intent (LLM or regex)
 *  2. Geo-search Kyiv Oblast → list of open restaurants with coords
 *  3a. LLM generates realistic menus per discovered venue  (primary)
 *  3b. SQLite keyword matching                             (fallback)
 *
 * Response shape:
 * {
 *   restaurants: [{ id, name, lat, lng, rating, isOpen, address, source }],
 *   items:       [{ id, name, restaurant, price, ..., lat, lng }],
 *   markers:     [{ name, lat, lng }],   ← ready for the map
 *   intent:      { cleanQuery, category, dietary, maxBudget, speedPriority },
 *   menuSource:  'llm' | 'fallback',
 *   source:      'foursquare' | 'local',
 *   cached:      boolean
 * }
 */
export async function getRestaurantsAndMenu(request, response) {
  const lat = Number.parseFloat(request.query.lat)
  const lng = Number.parseFloat(request.query.lng)
  const rawQuery = typeof request.query.q === 'string' ? request.query.q.trim() : ''

  if (rawQuery && foodTerms(rawQuery).length === 0) {
    return response.json({ restaurants: [], items: [], markers: [], intent: null, menuSource: null, source: null, cached: false })
  }

  const searchLat = Number.isFinite(lat) ? lat : undefined
  const searchLng = Number.isFinite(lng) ? lng : undefined

  // 1. Normalise the query through the LLM (or regex fallback)
  const intent = rawQuery ? await normalizeQuery(rawQuery) : null

  // 2. Geo-search — use the intent's category as keyword when available
  const keyword = intent?.category || rawQuery || undefined
  const geoResult = await searchRestaurants({ lat: searchLat, lng: searchLng, keyword })

  // 3. Menu items — try LLM generation first, fall back to SQLite matching
  let menuResult = null

  if (intent) {
    // 3a. Ask LLM to generate menus for the discovered restaurants
    menuResult = await generateMenuItems(geoResult.restaurants, intent)
  }

  if (!menuResult) {
    // 3b. Fallback: keyword match against local SQLite menu
    const fallback = intent
      ? matchMenuItems(intent)
      : { items: [], markers: [], cached: false }
    menuResult = { ...fallback, source: 'fallback' }
  }

  if (menuResult.source === 'llm') {
    saveGeneratedMenuItems(menuResult.items)
  }

  return response.json({
    restaurants: geoResult.restaurants,
    items: menuResult.items,
    markers: menuResult.markers,
    intent,
    menuSource: menuResult.source,   // 'llm' or 'fallback'
    source: geoResult.source,
    cached: geoResult.cached ?? false,
  })
}

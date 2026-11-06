import { searchRestaurants, matchMenuItems } from './service.js'
import { normalizeQuery } from '../llm/service.js'

/**
 * GET /api/restaurants?lat=50.45&lng=30.52&q=spicy+chicken
 *
 * Searches for open restaurants in Kyiv Oblast near the given coordinates
 * (defaults to Kyiv city centre).  Also matches menu items when `q` is
 * supplied (after normalising it through the LLM pipeline).
 *
 * Response shape:
 * {
 *   restaurants: [{ id, name, lat, lng, rating, isOpen, address, source }],
 *   items:       [{ id, name, restaurant, price, ..., lat, lng }],
 *   markers:     [{ name, lat, lng }],   ← ready for the map
 *   intent:      { cleanQuery, category, dietary, maxBudget, speedPriority },
 *   source:      'google' | 'local',
 *   cached:      boolean
 * }
 */
export async function getRestaurantsAndMenu(request, response) {
  const lat = Number.parseFloat(request.query.lat)
  const lng = Number.parseFloat(request.query.lng)
  const rawQuery = typeof request.query.q === 'string' ? request.query.q.trim() : ''

  const searchLat = Number.isFinite(lat) ? lat : undefined
  const searchLng = Number.isFinite(lng) ? lng : undefined

  // 1. Normalise the query through the LLM (or regex fallback)
  const intent = rawQuery ? await normalizeQuery(rawQuery) : null

  // 2. Geo-search — use the intent's category as keyword when available
  const keyword = intent?.category || rawQuery || undefined
  const geoResult = await searchRestaurants({ lat: searchLat, lng: searchLng, keyword })

  // 3. Match menu items if we have an intent
  const matchResult = intent
    ? matchMenuItems(intent)
    : { items: [], markers: [], cached: false }

  return response.json({
    restaurants: geoResult.restaurants,
    items: matchResult.items,
    markers: matchResult.markers,
    intent,
    source: geoResult.source,
    cached: geoResult.cached || matchResult.cached,
  })
}

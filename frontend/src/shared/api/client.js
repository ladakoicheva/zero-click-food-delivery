// In production (Vercel), VITE_API_URL points to the Vultr backend.
// In development, it's empty so Vite's proxy handles /api/* → localhost:3000.
const BASE_URL = import.meta.env.VITE_API_URL || ''

async function request(url, options) {
  const response = await fetch(`${BASE_URL}${url}`, options)
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('The server returned an unexpected response. Check that the backend is running and up to date.')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Request failed.')
  return data
}

export function findSuggestions({ query, lat, lng }) {
  const params = new URLSearchParams({
    q: query,
    lat: String(lat),
    lng: String(lng),
  })
  return request(`/api/restaurants?${params}`)
}

/**
 * Fetch the live menu feed for polling.
 * Passes the current ETag so the server can return 304 when nothing changed.
 */
export async function fetchFeed(etag = null) {
  const headers = {}
  if (etag) headers['If-None-Match'] = etag
  const response = await fetch(`${BASE_URL}/api/restaurants/feed`, { headers })
  // 304 = nothing changed — caller handles this
  if (response.status === 304) return null
  if (!response.ok) throw new Error('Feed request failed.')
  return response.json()
}

export function createOrder(orderData) {
  return request('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  })
}

export function getOrder(trackingNumber) {
  return request(`/api/orders/${encodeURIComponent(trackingNumber)}`)
}

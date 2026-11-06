async function request(url, options) {
  const response = await fetch(url, options)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Request failed.')
  return data
}

export function findSuggestions(query) {
  return request(`/api/suggestions?q=${encodeURIComponent(query)}`)
}

/**
 * Fetch the live menu feed for polling.
 * Passes the current ETag so the server can return 304 when nothing changed.
 */
export async function fetchFeed(etag = null) {
  const headers = {}
  if (etag) headers['If-None-Match'] = etag
  const response = await fetch('/api/restaurants/feed', { headers })
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

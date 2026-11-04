async function request(url, options) {
  const response = await fetch(url, options)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Request failed.')
  return data
}

export function findSuggestions(query) {
  return request(`/api/suggestions?q=${encodeURIComponent(query)}`)
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

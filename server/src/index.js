const crypto = require('node:crypto')
const express = require('express')

const menu = [
  {
    id: 'mushroom-pasta',
    name: 'Wild Mushroom Pasta',
    restaurant: 'The Cozy Table',
    description: 'Pappardelle, creamy sauce, aged parmesan',
    price: 14.9,
    rating: '4.9',
    time: '25–35 min',
    image: 'photo-1473093295043-cdd812d0e601',
    tag: 'Weekly favorite',
    keywords: ['pasta', 'mushroom', 'creamy', 'vegetarian', 'dinner'],
  },
  {
    id: 'green-bowl',
    name: 'Green Avocado Bowl',
    restaurant: 'Greenery',
    description: 'Avocado, quinoa, seasonal vegetables',
    price: 12.5,
    rating: '4.8',
    time: '20–30 min',
    image: 'photo-1512621776951-a57141f2eefd',
    tag: 'Light pick',
    keywords: ['bowl', 'avocado', 'salad', 'vegetables', 'light', 'meat-free', 'vegan'],
  },
  {
    id: 'salmon-rice',
    name: 'Salmon, Rice & Greens',
    restaurant: 'Sea Within',
    description: 'Oven-baked salmon with jasmine rice',
    price: 18.9,
    rating: '4.9',
    time: '30–40 min',
    image: 'photo-1467003909585-2f8a72700288',
    tag: 'Chef’s pick',
    keywords: ['salmon', 'fish', 'rice', 'dinner'],
  },
  {
    id: 'tomato-soup',
    name: 'Tomato Basil Soup',
    restaurant: 'The Cozy Table',
    description: 'Tomatoes, cream, and crispy ciabatta',
    price: 9.5,
    rating: '4.7',
    time: '20–30 min',
    image: 'photo-1547592180-85f173990554',
    tag: 'Comfort classic',
    keywords: ['soup', 'tomato', 'lunch', 'vegetarian'],
  },
  {
    id: 'chicken-curry',
    name: 'Spicy Chicken Curry',
    restaurant: 'House of Spice',
    description: 'Chicken, coconut curry, and basmati rice',
    price: 15.5,
    rating: '4.8',
    time: '30–40 min',
    image: 'photo-1603894584373-5ac82b2ae398',
    tag: 'Warm & cozy',
    keywords: ['spicy', 'curry', 'chicken', 'meat', 'rice', 'bold flavors'],
  },
  {
    id: 'beef-burger',
    name: 'Beef & Cheddar Burger',
    restaurant: 'Buns & Embers',
    description: 'Angus beef, cheddar, and smoky barbecue sauce',
    price: 16.5,
    rating: '4.9',
    time: '25–35 min',
    image: 'photo-1568901346375-23c9450c58cd',
    tag: 'Hearty lunch',
    keywords: ['burger', 'beef', 'meat', 'filling', 'lunch'],
  },
]

const orders = new Map()
const PAYMENT_METHODS = new Set(['on_delivery', 'demo_card'])
const STATUSES = [
  { key: 'placed', afterMs: 0 },
  { key: 'cooking', afterMs: 15_000 },
  { key: 'on_the_way', afterMs: 30_000 },
  { key: 'delivered', afterMs: 60_000 },
]

function getOrderStatus(createdAt, now = Date.now()) {
  const age = Math.max(0, now - createdAt)
  return STATUSES.reduce((current, status) => (age >= status.afterMs ? status.key : current), 'placed')
}

function createApp() {
  const app = express()
  app.use(express.json({ limit: '10kb' }))

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok', mode: 'demo' })
  })

  app.get('/api/suggestions', (request, response) => {
    const query = typeof request.query.q === 'string' ? request.query.q.trim().toLocaleLowerCase('en-US') : ''
    if (query.length < 2) {
      return response.status(400).json({ error: 'Enter at least two characters to find dishes.' })
    }

    const terms = query.split(/\s+/).filter((term) => term.length > 2)
    const ranked = menu
      .map((item) => {
        const searchable = `${item.name} ${item.description} ${item.restaurant} ${item.keywords.join(' ')}`.toLocaleLowerCase('en-US')
        const score = terms.reduce((total, term) => total + (searchable.includes(term) ? 1 : 0), 0)
        return { item, score }
      })
      .sort((left, right) => right.score - left.score)

    const matching = ranked.filter(({ score }) => score > 0)
    const items = (matching.length ? matching : ranked).slice(0, 4).map(({ item }) => ({
      id: item.id,
      name: item.name,
      restaurant: item.restaurant,
      description: item.description,
      price: item.price,
      rating: item.rating,
      time: item.time,
      image: item.image,
      tag: item.tag,
    }))

    return response.json({ items })
  })

  app.post('/api/orders', (request, response) => {
    const { itemId, customerName, address, paymentMethod } = request.body || {}
    const item = menu.find((candidate) => candidate.id === itemId)
    if (!item) return response.status(400).json({ error: 'Choose a dish from the menu.' })
    if (typeof customerName !== 'string' || customerName.trim().length < 2 || customerName.trim().length > 80) {
      return response.status(400).json({ error: 'Enter a name between 2 and 80 characters.' })
    }
    if (typeof address !== 'string' || address.trim().length < 5 || address.trim().length > 240) {
      return response.status(400).json({ error: 'Enter an address between 5 and 240 characters.' })
    }
    if (!PAYMENT_METHODS.has(paymentMethod)) {
      return response.status(400).json({ error: 'Choose an available demo payment method.' })
    }

    const createdAt = Date.now()
    const trackingNumber = `SPN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
    const order = {
      trackingNumber,
      customerName: customerName.trim(),
      address: address.trim(),
      paymentMethod,
      paymentStatus: 'not_processed',
      status: getOrderStatus(createdAt),
      item: {
        id: item.id,
        name: item.name,
        restaurant: item.restaurant,
        price: item.price,
      },
      createdAt: new Date(createdAt).toISOString(),
    }
    orders.set(trackingNumber, { ...order, createdAtMs: createdAt })

    return response.status(201).json({ order })
  })

  app.get('/api/orders/:trackingNumber', (request, response) => {
    const order = orders.get(request.params.trackingNumber)
    if (!order) return response.status(404).json({ error: 'No order found with that tracking number.' })

    const { createdAtMs, ...publicOrder } = order
    return response.json({
      order: { ...publicOrder, status: getOrderStatus(createdAtMs) },
      demo: true,
    })
  })

  return app
}

if (require.main === module) {
  const app = createApp()
  const port = Number(process.env.PORT) || 3000
  app.listen(port, () => {
    console.log(`Demo food delivery API listening on http://localhost:${port}`)
  })
}

module.exports = { createApp, getOrderStatus }

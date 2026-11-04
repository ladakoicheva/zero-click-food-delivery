import crypto from 'node:crypto';
import { findMenuItem, findOrder, insertOrder } from '../../database/database.js'
import { getOrderStatus } from "./helpers.js";

export const createOrder = (request, response) => {
  
  const PAYMENT_METHODS = new Set(['on_delivery', 'demo_card']);
  const { itemId, customerName, address, paymentMethod } = request.body || {}
  const item = findMenuItem(itemId)
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
  insertOrder({
    trackingNumber,
    customerName: order.customerName,
    address: order.address,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status,
    restaurantId: item.restaurant_id,
    menuItemId: item.id,
    totalAmount: item.price,
    createdAt: order.createdAt,
    createdAtMs: createdAt,
  })

  return response.status(201).json({ order })
}

export const getStatus=(request, response) => {
    const storedOrder = findOrder(request.params.trackingNumber);
    if (!storedOrder) return response.status(404).json({ error: 'No order found with that tracking number.' });
    const { createdAtMs, itemId, itemName, itemRestaurant, itemPrice, ...publicOrder } = storedOrder;
    return response.json({
      order: {
        ...publicOrder,
        status: getOrderStatus(createdAtMs),
        item: { id: itemId, name: itemName, restaurant: itemRestaurant, price: itemPrice },
      },
      demo: true,
    });
  };
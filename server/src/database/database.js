import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'

const databaseDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data')
const databasePath = process.env.DATABASE_PATH || path.join(databaseDirectory, 'food-delivery.sqlite')
const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema.sql')

fs.mkdirSync(databaseDirectory, { recursive: true })

export const database = new Database(databasePath)
database.pragma('foreign_keys = ON')
database.exec(fs.readFileSync(schemaPath, 'utf8'))

export function seedDatabase(menu) {
  const insertRestaurant = database.prepare(`
    INSERT INTO restaurants (name, rating, is_open)
    VALUES (@restaurant, @rating, 1)
    ON CONFLICT(name) DO NOTHING
  `)
  const findRestaurant = database.prepare('SELECT id FROM restaurants WHERE name = ?')
  const insertMenuItem = database.prepare(`
    INSERT INTO menu_items (
      id, restaurant_id, title, description, price, prep_time_minutes,
      rating, image, tag, keywords, is_available
    ) VALUES (
      @id, @restaurantId, @name, @description, @price, @prepTimeMinutes,
      @rating, @image, @tag, @keywords, 1
    )
    ON CONFLICT(id) DO UPDATE SET
      restaurant_id = excluded.restaurant_id,
      title = excluded.title,
      description = excluded.description,
      price = excluded.price,
      prep_time_minutes = excluded.prep_time_minutes,
      rating = excluded.rating,
      image = excluded.image,
      tag = excluded.tag,
      keywords = excluded.keywords,
      is_available = excluded.is_available
  `)

  const seed = database.transaction(() => {
    for (const item of menu) {
      insertRestaurant.run({ restaurant: item.restaurant, rating: Number(item.rating) })
      const restaurant = findRestaurant.get(item.restaurant)
      const prepTimeMinutes = Number.parseInt(item.time, 10)
      insertMenuItem.run({
        ...item,
        restaurantId: restaurant.id,
        prepTimeMinutes: Number.isNaN(prepTimeMinutes) ? null : prepTimeMinutes,
        keywords: JSON.stringify(item.keywords),
      })
    }
  })

  seed()
}

export function listAvailableMenuItems() {
  const rows = database.prepare(`
    SELECT
      menu_items.id,
      menu_items.title AS name,
      restaurants.name AS restaurant,
      menu_items.description,
      menu_items.price,
      menu_items.rating,
      menu_items.prep_time_minutes,
      menu_items.image,
      menu_items.tag,
      menu_items.keywords
    FROM menu_items
    JOIN restaurants ON restaurants.id = menu_items.restaurant_id
    WHERE menu_items.is_available = 1 AND restaurants.is_open = 1
    ORDER BY menu_items.id
  `).all()

  return rows.map((item) => ({
    ...item,
    rating: String(item.rating),
    time: `${item.prep_time_minutes}–${item.prep_time_minutes + 10} min`,
    keywords: JSON.parse(item.keywords),
  }))
}

export function findMenuItem(id) {
  return database.prepare(`
    SELECT
      menu_items.id,
      menu_items.title AS name,
      restaurants.name AS restaurant,
      restaurants.id AS restaurant_id,
      menu_items.description,
      menu_items.price,
      menu_items.rating,
      menu_items.image,
      menu_items.tag,
      menu_items.keywords
    FROM menu_items
    JOIN restaurants ON restaurants.id = menu_items.restaurant_id
    WHERE menu_items.id = ? AND menu_items.is_available = 1 AND restaurants.is_open = 1
  `).get(id)
}

export function insertOrder(order) {
  database.prepare(`
    INSERT INTO orders (
      tracking_number, customer_name, address, payment_method,
      payment_status, status, restaurant_id, menu_item_id,
      total_amount, created_at, created_at_ms
    ) VALUES (
      @trackingNumber, @customerName, @address, @paymentMethod,
      @paymentStatus, @status, @restaurantId, @menuItemId,
      @totalAmount, @createdAt, @createdAtMs
    )
  `).run(order)
}

export function findOrder(trackingNumber) {
  return database.prepare(`
    SELECT
      orders.tracking_number AS trackingNumber,
      orders.customer_name AS customerName,
      orders.address,
      orders.payment_method AS paymentMethod,
      orders.payment_status AS paymentStatus,
      orders.status,
      orders.created_at AS createdAt,
      orders.created_at_ms AS createdAtMs,
      menu_items.id AS itemId,
      menu_items.title AS itemName,
      restaurants.name AS itemRestaurant,
      menu_items.price AS itemPrice
    FROM orders
    JOIN menu_items ON menu_items.id = orders.menu_item_id
    JOIN restaurants ON restaurants.id = orders.restaurant_id
    WHERE orders.tracking_number = ?
  `).get(trackingNumber)
}

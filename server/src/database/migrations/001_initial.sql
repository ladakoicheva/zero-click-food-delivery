CREATE TABLE IF NOT EXISTS restaurants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  rating REAL NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  is_open INTEGER NOT NULL DEFAULT 1 CHECK (is_open IN (0, 1))
);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price REAL NOT NULL CHECK (price >= 0),
  prep_time_minutes INTEGER NOT NULL CHECK (prep_time_minutes > 0),
  rating REAL NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  image TEXT,
  tag TEXT,
  keywords TEXT NOT NULL DEFAULT '[]',
  is_available INTEGER NOT NULL DEFAULT 1 CHECK (is_available IN (0, 1))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tracking_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL CHECK (length(trim(customer_name)) BETWEEN 2 AND 80),
  address TEXT NOT NULL CHECK (length(trim(address)) BETWEEN 5 AND 240),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('on_delivery', 'demo_card')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('not_processed', 'processed')),
  status TEXT NOT NULL CHECK (status IN ('placed', 'cooking', 'on_the_way', 'delivered')),
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  menu_item_id TEXT NOT NULL REFERENCES menu_items(id),
  total_amount REAL NOT NULL CHECK (total_amount >= 0),
  created_at TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL CHECK (created_at_ms > 0)
);

CREATE TABLE IF NOT EXISTS loyalty_points (
  user_id TEXT PRIMARY KEY,
  points_balance INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  updated_at TEXT NOT NULL
);

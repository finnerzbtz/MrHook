
const { Pool } = require('pg');

class Database {
  constructor() {
    // Use Replit's PostgreSQL connection string if available
    const connectionString = process.env.DATABASE_URL;
    
    if (connectionString) {
      // Use connection pooling for better performance
      const poolUrl = connectionString.replace('.us-east-2', '-pooler.us-east-2');
      this.pool = new Pool({
        connectionString: poolUrl,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
      console.log('✅ Connected to PostgreSQL database');
    } else {
      console.log('⚠️ No DATABASE_URL found, using in-memory storage');
      this.pool = null;
    }
  }

  async initTables() {
    if (!this.pool) return;

    try {
      // Create users table - simple as per brief
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          home_address TEXT NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          address_line1 VARCHAR(255),
          address_line2 VARCHAR(255),
          city VARCHAR(100),
          postcode VARCHAR(20),
          county VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create products table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          description TEXT,
          image VARCHAR(255),
          type VARCHAR(100) NOT NULL,
          category VARCHAR(50),
          stock INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create orders table - simple as per brief
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          order_placed BOOLEAN DEFAULT FALSE,
          date_ordered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          total_price DECIMAL(10,2) NOT NULL
        )
      `);

      // Create order_items table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          product_id INTEGER REFERENCES products(id),
          order_id INTEGER REFERENCES orders(id),
          quantity INTEGER NOT NULL,
          subtotal DECIMAL(10,2) NOT NULL
        )
      `);

      // Create cart_items table for current shopping
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS cart_items (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          product_id INTEGER REFERENCES products(id),
          quantity INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, product_id)
        )
      `);

      console.log('✅ Database tables initialized');
      await this.seedProducts();
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
    }
  }

  async seedProducts() {
    if (!this.pool) return;

    try {
      const { rows } = await this.pool.query('SELECT COUNT(*) FROM products');
      if (parseInt(rows[0].count) > 0) {
        console.log('📦 Products already seeded');
        return;
      }

      const products = [
        ['Premium Carbon Fiber Rod', 149.99, 'Professional grade carbon fiber fishing rod with enhanced sensitivity and durability.', 'assets/pexels-cottonbro-4822295.jpg', 'Fishing Rods', 'rods', 15],
        ['Professional Hook Set', 24.99, 'Complete set of professional fishing hooks in various sizes.', 'assets/pexels-karolina-grabowska-6478094.jpg', 'Hooks', 'hooks', 30],
        ['Fresh Live Bait Collection', 18.99, 'Premium fresh bait collection for the best fishing experience.', 'assets/pexels-karolina-grabowska-6478141.jpg', 'Bait', 'bait', 25],
        ['Tackle Storage Box', 39.99, 'Waterproof tackle box with multiple compartments.', 'assets/pexels-lum3n-44775-294674.jpg', 'Containers', 'containers', 20],
        ['Professional Fishing Line', 12.99, 'High-strength fishing line suitable for all fishing conditions.', 'assets/pexels-pablo-gutierrez-2064903-3690705.jpg', 'Other', 'other', 50],
        ['Spinning Reel Combo', 89.99, 'Complete spinning reel and rod combination for beginners.', 'assets/pexels-jplenio-1105386.jpg', 'Fishing Rods', 'rods', 12],
        ['Bait Bucket Pro', 29.99, 'Professional bait bucket with aeration system.', 'assets/pexels-pixabay-39854.jpg', 'Containers', 'containers', 18],
        ['Multi-Tool Fisher', 34.99, 'Essential fishing multi-tool with pliers, knife, and hook remover.', 'assets/pexels-brent-keane-181485-1687242.jpg', 'Other', 'other', 22]
      ];

      for (const product of products) {
        await this.pool.query(
          'INSERT INTO products (name, price, description, image, type, category, stock) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          product
        );
      }

      console.log('🌱 Products seeded successfully');
    } catch (error) {
      console.error('❌ Product seeding failed:', error);
    }
  }

  async query(text, params) {
    if (!this.pool) {
      throw new Error('Database not available');
    }
    return await this.pool.query(text, params);
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

module.exports = Database;

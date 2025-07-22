
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Initialize database
const db = new Database();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, address } = req.body;

    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    // Check if user already exists
    const existingResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const result = await db.query(
      `INSERT INTO users (email, password, first_name, last_name, phone, address_line1, address_line2, city, postcode, county) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, email, first_name, last_name, phone, address_line1, address_line2, city, postcode, county`,
      [email, hashedPassword, firstName, lastName, phone, address?.line1 || '', address?.line2 || '', address?.city || '', address?.postcode || '', address?.county || '']
    );

    const newUser = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        phone: newUser.phone,
        address: {
          line1: newUser.address_line1,
          line2: newUser.address_line2,
          city: newUser.city,
          postcode: newUser.postcode,
          county: newUser.county
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    // Find user
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        address: {
          line1: user.address_line1,
          line2: user.address_line2,
          city: user.city,
          postcode: user.postcode,
          county: user.county
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Product Routes
app.get('/api/products', async (req, res) => {
  try {
    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    const { category, search, minPrice, maxPrice } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (category && category !== 'all') {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (LOWER(name) LIKE $${paramCount} OR LOWER(type) LIKE $${paramCount})`;
      params.push(`%${search.toLowerCase()}%`);
    }

    if (minPrice) {
      paramCount++;
      query += ` AND price >= $${paramCount}`;
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      paramCount++;
      query += ` AND price <= $${paramCount}`;
      params.push(parseFloat(maxPrice));
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    const result = await db.query('SELECT * FROM products WHERE id = $1', [parseInt(req.params.id)]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cart Routes
app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    const result = await db.query(`
      SELECT ci.*, p.name, p.type, p.price, p.image, p.description, p.stock, p.category
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1
    `, [req.user.id]);

    const cart = result.rows.map(row => ({
      productId: row.product_id,
      quantity: row.quantity,
      product: {
        id: row.product_id,
        name: row.name,
        type: row.type,
        price: parseFloat(row.price),
        image: row.image,
        description: row.description,
        stock: row.stock,
        category: row.category
      }
    }));

    res.json(cart);
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/cart/add', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    // Check if product exists
    const productResult = await db.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if item already in cart
    const existingResult = await db.query(
      'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [req.user.id, productId]
    );

    if (existingResult.rows.length > 0) {
      // Update quantity
      await db.query(
        'UPDATE cart_items SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3',
        [quantity, req.user.id, productId]
      );
    } else {
      // Insert new item
      await db.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)',
        [req.user.id, productId, quantity]
      );
    }

    // Fetch updated cart
    const cartResult = await db.query(`
      SELECT ci.*, p.name, p.type, p.price, p.image, p.description, p.stock, p.category
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1
    `, [req.user.id]);

    const cart = cartResult.rows.map(row => ({
      productId: row.product_id,
      quantity: row.quantity,
      product: {
        id: row.product_id,
        name: row.name,
        type: row.type,
        price: parseFloat(row.price),
        image: row.image,
        description: row.description,
        stock: row.stock,
        category: row.category
      }
    }));

    res.json({ message: 'Item added to cart', cart });
  } catch (error) {
    console.error('Cart add error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/cart/update', authenticateToken, (req, res) => {
  const { productId, quantity } = req.body;
  
  if (!carts[req.user.id]) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  const itemIndex = carts[req.user.id].findIndex(item => item.productId === productId);
  
  if (itemIndex === -1) {
    return res.status(404).json({ message: 'Item not found in cart' });
  }

  if (quantity <= 0) {
    carts[req.user.id].splice(itemIndex, 1);
  } else {
    carts[req.user.id][itemIndex].quantity = quantity;
  }

  res.json({ message: 'Cart updated', cart: carts[req.user.id] });
});

app.delete('/api/cart/remove/:productId', authenticateToken, (req, res) => {
  const productId = parseInt(req.params.productId);
  
  if (!carts[req.user.id]) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  carts[req.user.id] = carts[req.user.id].filter(item => item.productId !== productId);
  
  res.json({ message: 'Item removed from cart', cart: carts[req.user.id] });
});

app.delete('/api/cart/clear', authenticateToken, (req, res) => {
  carts[req.user.id] = [];
  res.json({ message: 'Cart cleared' });
});

// Order Routes
app.post('/api/orders', authenticateToken, (req, res) => {
  const userCart = carts[req.user.id] || [];
  
  if (userCart.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  const total = userCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  
  const order = {
    id: orders.length + 1,
    userId: req.user.id,
    items: [...userCart],
    total,
    status: 'pending',
    createdAt: new Date()
  };

  orders.push(order);
  carts[req.user.id] = []; // Clear cart after order

  res.status(201).json({ message: 'Order placed successfully', order });
});

app.get('/api/orders', authenticateToken, (req, res) => {
  const userOrders = orders.filter(order => order.userId === req.user.id);
  res.json(userOrders);
});

// User Profile Routes
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        homeAddress: user.home_address
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, homeAddress } = req.body;

    console.log('Profile update request:', { firstName, lastName, phone, homeAddress, userId: req.user.id });

    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    // Validate input
    if (!firstName || !lastName || !homeAddress) {
      return res.status(400).json({ message: 'First name, last name, and home address are required' });
    }

    console.log('Updating user with values:', {
      firstName,
      lastName,
      phone: phone || '',
      homeAddress,
      userId: req.user.id
    });

    // Update user in database - use home_address as per the original brief
    const result = await db.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, phone = $3, home_address = $4
       WHERE id = $5 
       RETURNING id, email, first_name, last_name, phone, home_address`,
      [
        firstName, 
        lastName, 
        phone || '', 
        homeAddress,
        req.user.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = result.rows[0];
    console.log('User updated successfully:', updatedUser);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        phone: updatedUser.phone,
        homeAddress: updatedUser.home_address
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Debug endpoint to check database contents
app.get('/api/debug/database', async (req, res) => {
  try {
    if (!db.pool) {
      return res.json({
        message: 'Database not connected',
        tables: {},
        environment: {
          DATABASE_URL: !!process.env.DATABASE_URL,
          NODE_ENV: process.env.NODE_ENV || 'development'
        }
      });
    }

    const result = {
      message: 'Database connected',
      tables: {},
      environment: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
    };

    // Check users table
    try {
      const usersResult = await db.query('SELECT id, email, first_name, last_name, created_at FROM users ORDER BY created_at DESC LIMIT 10');
      result.tables.users = {
        count: usersResult.rows.length,
        recent: usersResult.rows
      };
    } catch (error) {
      result.tables.users = { error: error.message };
    }

    // Check products table
    try {
      const productsResult = await db.query('SELECT COUNT(*) as count FROM products');
      result.tables.products = {
        count: parseInt(productsResult.rows[0].count)
      };
    } catch (error) {
      result.tables.products = { error: error.message };
    }

    // Check cart_items table
    try {
      const cartResult = await db.query('SELECT COUNT(*) as count FROM cart_items');
      result.tables.cart_items = {
        count: parseInt(cartResult.rows[0].count)
      };
    } catch (error) {
      result.tables.cart_items = { error: error.message };
    }

    res.json(result);
  } catch (error) {
    console.error('Database debug error:', error);
    res.status(500).json({ 
      message: 'Database debug failed', 
      error: error.message,
      environment: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
    });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔄 Initializing database...');
    console.log(`📋 DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
    
    await db.initTables();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🎣 Mr Hook Backend Server running on port ${PORT}`);
      console.log(`🌐 Access your app at: http://localhost:${PORT}`);
      console.log(`📊 Database: ${db.pool ? 'PostgreSQL Connected' : 'In-memory fallback'}`);
      
      if (!db.pool) {
        console.log('⚠️  To enable database features:');
        console.log('   1. Open Database tab in Replit');
        console.log('   2. Click "Create a database"');
        console.log('   3. Restart the server');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

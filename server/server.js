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
    const { email, password, firstName, lastName, homeAddress } = req.body;

    console.log('Registration request:', { email, firstName, lastName, homeAddress });

    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    // Validate input
    if (!firstName || !lastName || !homeAddress || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with home_address field
    const result = await db.query(
      `INSERT INTO users (email, password, first_name, last_name, home_address) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, home_address`,
      [email, hashedPassword, firstName, lastName, homeAddress]
    );

    const newUser = result.rows[0];

    console.log('User created successfully:', newUser);

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
        homeAddress: newUser.home_address
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
        homeAddress: user.home_address
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Password Reset Routes
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    // Check if user exists
    const result = await db.query('SELECT id, email, first_name FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      // For security, don't reveal if email exists or not
      return res.json({ message: 'If an account with that email exists, we have sent a password reset link.' });
    }

    const user = result.rows[0];

    // Generate reset token (for demo purposes, using a simple token)
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database (add columns if they don't exist)
    try {
      await db.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
        ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP
      `);
    } catch (error) {
      console.log('Reset token columns already exist or error adding them:', error.message);
    }

    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
      [resetToken, tokenExpiry, email]
    );

    // In a real application, you would send an email here
    // For demo purposes, we'll just log the reset link
    const resetLink = `https://930cb833-7aa5-458c-8f39-ce1a2c953cf5-00-udrb5yhbnwub.janeway.replit.dev:5000/?token=${resetToken}`;
    console.log(`🔗 Password reset link for ${email}: ${resetLink}`);

    res.json({ 
      message: 'If an account with that email exists, we have sent a password reset link.',
      // For demo purposes, include the token in response (remove in production!)
      resetToken: resetToken,
      resetLink: resetLink
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    // Find user with valid reset token
    const result = await db.query(
      'SELECT id, email, reset_token_expiry FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = result.rows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await db.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Email Verification Routes
app.post('/api/auth/request-email-change', authenticateToken, async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user.id;

    if (!newEmail) {
      return res.status(400).json({ message: 'New email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    // Check if new email is already in use by another user
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [newEmail, userId]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email address is already in use' });
    }

    // Generate verification token
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store pending email change
    await db.query(
      'UPDATE users SET pending_email = $1, email_verification_token = $2, email_verification_expires = $3 WHERE id = $4',
      [newEmail, verificationToken, tokenExpiry, userId]
    );

    // In a real application, you would send an email here
    // For demo purposes, we'll just log the verification link
    const verificationLink = `https://930cb833-7aa5-458c-8f39-ce1a2c953cf5-00-udrb5yhbnwub.janeway.replit.dev:5000/?emailToken=${verificationToken}`;
    console.log(`📧 Email verification link for ${newEmail}: ${verificationLink}`);

    res.json({ 
      message: `A verification link has been sent to ${newEmail}. Please check your email and click the link to confirm the change.`,
      // For demo purposes, include the token in response (remove in production!)
      verificationToken: verificationToken,
      verificationLink: verificationLink
    });
  } catch (error) {
    console.error('Email change request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/verify-email-change', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    // Find user with valid verification token
    const result = await db.query(
      'SELECT id, email, pending_email FROM users WHERE email_verification_token = $1 AND email_verification_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    const user = result.rows[0];

    // Update email and clear verification fields
    await db.query(
      'UPDATE users SET email = $1, pending_email = NULL, email_verification_token = NULL, email_verification_expires = NULL WHERE id = $2',
      [user.pending_email, user.id]
    );

    res.json({ 
      message: 'Email address updated successfully!',
      newEmail: user.pending_email
    });
  } catch (error) {
    console.error('Email verification error:', error);
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

    // Check if product exists and has sufficient stock
    const productResult = await db.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = productResult.rows[0];

    // Check current cart quantity
    const currentCartResult = await db.query(
      'SELECT quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [req.user.id, productId]
    );

    const currentCartQuantity = currentCartResult.rows.length > 0 ? currentCartResult.rows[0].quantity : 0;
    const totalRequestedQuantity = currentCartQuantity + quantity;

    if (totalRequestedQuantity > product.stock) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${product.stock} items available, ${currentCartQuantity} already in cart.`,
        availableStock: product.stock,
        currentCartQuantity: currentCartQuantity
      });
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

app.put('/api/cart/update', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      await db.query(
        'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
        [req.user.id, productId]
      );
    } else {
      // Check stock availability
      const productResult = await db.query('SELECT stock FROM products WHERE id = $1', [productId]);
      if (productResult.rows.length === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const availableStock = productResult.rows[0].stock;
      if (quantity > availableStock) {
        return res.status(400).json({ 
          message: `Insufficient stock. Only ${availableStock} items available.`,
          availableStock: availableStock
        });
      }

      // Update quantity
      const result = await db.query(
        'UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3',
        [quantity, req.user.id, productId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Item not found in cart' });
      }
    }

    // Return updated cart
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

    res.json({ message: 'Cart updated', cart });
  } catch (error) {
    console.error('Cart update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/cart/remove/:productId', authenticateToken, async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    const result = await db.query(
      'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [req.user.id, productId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Return updated cart
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

    res.json({ message: 'Item removed from cart', cart });
  } catch (error) {
    console.error('Cart remove error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/cart/clear', authenticateToken, async (req, res) => {
  try {
    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    await db.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Cart clear error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Order Routes
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    // Get user's cart
    const cartResult = await db.query(`
      SELECT ci.*, p.name, p.type, p.price, p.image, p.description, p.stock, p.category
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1
    `, [req.user.id]);

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate total
    const total = cartResult.rows.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);

    // Get the next user order number
    const userOrderCountResult = await db.query(
      'SELECT COUNT(*) + 1 as next_order_number FROM orders WHERE user_id = $1',
      [req.user.id]
    );
    const userOrderNumber = parseInt(userOrderCountResult.rows[0].next_order_number);

    // Create order
    const orderResult = await db.query(
      'INSERT INTO orders (user_id, user_order_number, order_placed, total_price, date_ordered) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *',
      [req.user.id, userOrderNumber, true, total]
    );
    const order = orderResult.rows[0];

    // Create order items and update stock
    for (const item of cartResult.rows) {
      // Check stock availability before processing
      const stockCheck = await db.query('SELECT stock FROM products WHERE id = $1', [item.product_id]);
      const availableStock = stockCheck.rows[0].stock;

      if (item.quantity > availableStock) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.name}. Only ${availableStock} items available.`,
          productId: item.product_id,
          productName: item.name,
          requestedQuantity: item.quantity,
          availableStock: availableStock
        });
      }

      const subtotal = parseFloat(item.price) * item.quantity;

      // Create order item with price and subtotal
      await db.query(
        'INSERT INTO order_items (product_id, order_id, quantity, price, subtotal) VALUES ($1, $2, $3, $4, $5)',
        [item.product_id, order.id, item.quantity, parseFloat(item.price), subtotal]
      );

      // Reduce stock
      await db.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // Clear cart
    await db.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

    res.status(201).json({ 
      message: 'Order placed successfully', 
      order: {
        id: order.id,
        userId: order.user_id,
        total: parseFloat(order.total_price),
        status: 'completed',
        createdAt: order.date_ordered
      }
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    // Get user's orders - using flexible column selection
    const ordersResult = await db.query(`
      SELECT 
        o.id, 
        o.user_id,
        o.user_order_number,
        o.order_placed, 
        COALESCE(o.date_ordered, o.created_at) as date_ordered,
        o.total_price,
        oi.product_id, 
        oi.quantity, 
        oi.subtotal,
        p.name, 
        p.type, 
        p.price, 
        p.image, 
        p.description
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1 AND o.order_placed = true
      ORDER BY COALESCE(o.date_ordered, o.created_at) DESC
    `, [req.user.id]);

    // Group by order
    const ordersMap = {};
    ordersResult.rows.forEach(row => {
      if (!ordersMap[row.id]) {
        ordersMap[row.id] = {
          id: row.user_order_number || row.id, // Use user order number for display
          globalId: row.id, // Keep global ID for internal use
          userId: row.user_id,
          total: parseFloat(row.total_price),
          status: 'completed',
          createdAt: row.date_ordered,
          items: []
        };
      }

      if (row.product_id) {
        ordersMap[row.id].items.push({
          productId: row.product_id,
          quantity: row.quantity,
          subtotal: parseFloat(row.subtotal) || 0,
          name: row.name,
          type: row.type,
          price: parseFloat(row.price),
          image: row.image,
          description: row.description,
          product: {
            id: row.product_id,
            name: row.name,
            type: row.type,
            price: parseFloat(row.price),
            image: row.image,
            description: row.description
          }
        });
      }
    });

    const orders = Object.values(ordersMap);
    
    // Ensure orders are sorted by date (most recent first) as per brief requirement
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(orders);
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Stock Management Routes
app.get('/api/stock/:productId', async (req, res) => {
  try {
    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    const result = await db.query('SELECT id, name, stock FROM products WHERE id = $1', [parseInt(req.params.productId)]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = result.rows[0];
    res.json({
      productId: product.id,
      productName: product.name,
      stock: product.stock,
      inStock: product.stock > 0
    });
  } catch (error) {
    console.error('Stock check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/stock', async (req, res) => {
  try {
    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    const result = await db.query('SELECT id, name, stock FROM products ORDER BY name');
    const stockData = result.rows.map(product => ({
      productId: product.id,
      productName: product.name,
      stock: product.stock,
      inStock: product.stock > 0
    }));

    res.json(stockData);
  } catch (error) {
    console.error('Stock list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/stock/check', async (req, res) => {
  try {
    const { items } = req.body; // Array of {productId, quantity}

    if (!db.pool) {
      return res.status(500).json({ message: 'Database not available' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array is required' });
    }

    const stockChecks = [];
    let allInStock = true;

    for (const item of items) {
      const result = await db.query('SELECT id, name, stock FROM products WHERE id = $1', [item.productId]);

      if (result.rows.length === 0) {
        stockChecks.push({
          productId: item.productId,
          requestedQuantity: item.quantity,
          availableStock: 0,
          inStock: false,
          message: 'Product not found'
        });
        allInStock = false;
      } else {
        const product = result.rows[0];
        const inStock = product.stock >= item.quantity;

        stockChecks.push({
          productId: product.id,
          productName: product.name,
          requestedQuantity: item.quantity,
          availableStock: product.stock,
          inStock: inStock,
          message: inStock ? 'In stock' : `Only ${product.stock} available`
        });

        if (!inStock) {
          allInStock = false;
        }
      }
    }

    res.json({
      allInStock: allInStock,
      items: stockChecks
    });
  } catch (error) {
    console.error('Bulk stock check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
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
    const { firstName, lastName, homeAddress } = req.body;

    console.log('Profile update request:', { firstName, lastName, homeAddress, userId: req.user.id });

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
      homeAddress,
      userId: req.user.id
    });

    // First check if user exists
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [req.user.id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user in database - only update the fields that exist in the table
    const result = await db.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, home_address = $3
       WHERE id = $4 
       RETURNING id, email, first_name, last_name, home_address`,
      [
        firstName, 
        lastName, 
        homeAddress,
        req.user.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found after update' });
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
        homeAddress: updatedUser.home_address
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      code: error.code 
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

    // Ensure required columns exist (fallback)
    if (db.pool) {
      try {
        await db.query(`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS home_address TEXT
        `);
        console.log('✅ Ensured home_address column exists');
      } catch (error) {
        console.log('ℹ️ home_address column check:', error.message);
      }

      try {
        await db.query(`
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_placed BOOLEAN DEFAULT FALSE
        `);
        console.log('✅ Ensured order_placed column exists');
      } catch (error) {
        console.log('ℹ️ order_placed column check:', error.message);
      }

      try {
        await db.query(`
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2)
        `);
        console.log('✅ Ensured total_price column exists');
      } catch (error) {
        console.log('ℹ️ total_price column check:', error.message);
      }
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🎣 Mr Hook Backend Server running on port ${PORT}`);
      console.log(`📊 Database: ${db.pool ? 'PostgreSQL Connected' : 'In-memory fallback'}`);

      if (!db.pool) {
        console.log('⚠️  To enable database features:');
        console.log('   1. Open Database tab in Replit');
        console.log('   2. Click "Connect" to enable PostgreSQL');
        console.log('   3. Restart the server');
      }
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();
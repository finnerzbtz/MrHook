
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// In-memory storage (replace with database in production)
let users = [
  {
    id: 1,
    email: 'john.smith@email.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
    firstName: 'John',
    lastName: 'Smith',
    phone: '07123456789',
    address: {
      line1: '123 Fishing Lane',
      line2: '',
      city: 'Portsmouth',
      postcode: 'PO1 2AB',
      county: 'Hampshire'
    },
    createdAt: new Date()
  }
];

let products = [
  {
    id: 1,
    name: 'Premium Carbon Fiber Rod',
    type: 'Fishing Rods',
    price: 149.99,
    image: 'assets/pexels-cottonbro-4822295.jpg',
    description: 'Professional grade carbon fiber fishing rod with enhanced sensitivity and durability.',
    stock: 15,
    category: 'rods'
  },
  {
    id: 2,
    name: 'Professional Hook Set',
    type: 'Hooks',
    price: 24.99,
    image: 'assets/pexels-karolina-grabowska-6478094.jpg',
    description: 'Complete set of professional fishing hooks in various sizes.',
    stock: 30,
    category: 'hooks'
  },
  {
    id: 3,
    name: 'Fresh Live Bait Collection',
    type: 'Bait',
    price: 18.99,
    image: 'assets/pexels-karolina-grabowska-6478141.jpg',
    description: 'Premium fresh bait collection for the best fishing experience.',
    stock: 25,
    category: 'bait'
  },
  {
    id: 4,
    name: 'Tackle Storage Box',
    type: 'Containers',
    price: 39.99,
    image: 'assets/pexels-lum3n-44775-294674.jpg',
    description: 'Waterproof tackle box with multiple compartments.',
    stock: 20,
    category: 'containers'
  },
  {
    id: 5,
    name: 'Professional Fishing Line',
    type: 'Other',
    price: 12.99,
    image: 'assets/pexels-pablo-gutierrez-2064903-3690705.jpg',
    description: 'High-strength fishing line suitable for all fishing conditions.',
    stock: 50,
    category: 'other'
  },
  {
    id: 6,
    name: 'Spinning Reel Combo',
    type: 'Fishing Rods',
    price: 89.99,
    image: 'assets/pexels-jplenio-1105386.jpg',
    description: 'Complete spinning reel and rod combination for beginners.',
    stock: 12,
    category: 'rods'
  },
  {
    id: 7,
    name: 'Bait Bucket Pro',
    type: 'Containers',
    price: 29.99,
    image: 'assets/pexels-pixabay-39854.jpg',
    description: 'Professional bait bucket with aeration system.',
    stock: 18,
    category: 'containers'
  },
  {
    id: 8,
    name: 'Multi-Tool Fisher',
    type: 'Other',
    price: 34.99,
    image: 'assets/pexels-brent-keane-181485-1687242.jpg',
    description: 'Essential fishing multi-tool with pliers, knife, and hook remover.',
    stock: 22,
    category: 'other'
  }
];

let orders = [];
let carts = {};

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

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      address,
      createdAt: new Date()
    };

    users.push(newUser);

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
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        address: newUser.address
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

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
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Product Routes
app.get('/api/products', (req, res) => {
  const { category, search, minPrice, maxPrice } = req.query;
  let filteredProducts = [...products];

  if (category && category !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.category === category);
  }

  if (search) {
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (minPrice) {
    filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice));
  }

  if (maxPrice) {
    filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice));
  }

  res.json(filteredProducts);
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
});

// Cart Routes
app.get('/api/cart', authenticateToken, (req, res) => {
  const userCart = carts[req.user.id] || [];
  res.json(userCart);
});

app.post('/api/cart/add', authenticateToken, (req, res) => {
  const { productId, quantity } = req.body;
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  if (!carts[req.user.id]) {
    carts[req.user.id] = [];
  }

  const existingItem = carts[req.user.id].find(item => item.productId === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    carts[req.user.id].push({
      productId,
      quantity,
      product
    });
  }

  res.json({ message: 'Item added to cart', cart: carts[req.user.id] });
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
app.get('/api/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    address: user.address
  });
});

app.put('/api/profile', authenticateToken, (req, res) => {
  const { firstName, lastName, phone, address } = req.body;
  const userIndex = users.findIndex(u => u.id === req.user.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  users[userIndex] = {
    ...users[userIndex],
    firstName,
    lastName,
    phone,
    address
  };

  res.json({
    message: 'Profile updated successfully',
    user: {
      id: users[userIndex].id,
      email: users[userIndex].email,
      firstName: users[userIndex].firstName,
      lastName: users[userIndex].lastName,
      phone: users[userIndex].phone,
      address: users[userIndex].address
    }
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎣 Mr Hook Backend Server running on port ${PORT}`);
  console.log(`🌐 Access your app at: http://localhost:${PORT}`);
});

// Product Categories
const categories = {
  'fishing-rods': 'Fishing Rods',
  'hooks': 'Hooks',
  'bait': 'Bait',
  'containers': 'Containers',
  'other': 'Other'
};

// Sample Products Data
const products = [
  {
    id: 1,
    name: 'Professional Carbon Fiber Rod',
    description: 'High-quality carbon fiber fishing rod perfect for both beginners and experts. Lightweight yet durable construction with comfortable grip and excellent sensitivity. Ideal for freshwater and light saltwater fishing.',
    price: 89.99,
    image: 'assets/pexels-brent-keane-181485-1687242.jpg',
    category: 'fishing-rods'
  },
  {
    id: 2,
    name: 'Premium Hook Set - 50 Pieces',
    description: 'Complete set of 50 premium fishing hooks in various sizes (6, 8, 10, 12, 14). Made from high-grade steel for maximum durability and sharpness. Perfect for different fish species and bait types.',
    price: 24.99,
    image: 'assets/pexels-pixabay-39854.jpg',
    category: 'hooks'
  },
  {
    id: 3,
    name: 'Live Bait Collection',
    description: 'Fresh and effective live bait collection including premium earthworms, maggots, and other popular fishing baits. Carefully preserved to maintain freshness and effectiveness.',
    price: 15.99,
    image: 'assets/pexels-cottonbro-4822295.jpg',
    category: 'bait'
  },
  {
    id: 4,
    name: 'Deluxe Tackle Box',
    description: 'Large capacity tackle box with multiple compartments for organizing all your fishing gear and accessories. Waterproof design with secure latching system. Includes removable dividers.',
    price: 45.99,
    image: 'assets/pexels-karolina-grabowska-6478094.jpg',
    category: 'containers'
  },
  {
    id: 5,
    name: 'Premium Monofilament Line',
    description: 'High-strength monofilament fishing line, 500m spool. Excellent knot strength and abrasion resistance. Perfect for both freshwater and saltwater fishing applications.',
    price: 19.99,
    image: 'assets/pexels-karolina-grabowska-6478141.jpg',
    category: 'other'
  },
  {
    id: 6,
    name: 'Professional Spinning Reel',
    description: 'Professional spinning reel with smooth drag system and precision engineering. Features high-quality ball bearings, anti-reverse system, and lightweight aluminum construction.',
    price: 129.99,
    image: 'assets/pexels-lum3n-44775-294674.jpg',
    category: 'fishing-rods'
  },
  {
    id: 7,
    name: 'Aerated Bait Bucket',
    description: 'Durable bait bucket with built-in aerator system to keep your live bait fresh throughout your fishing session. Includes battery-powered pump and adjustable flow control.',
    price: 34.99,
    image: 'assets/pexels-pablo-gutierrez-2064903-3690705.jpg',
    category: 'containers'
  },
  {
    id: 8,
    name: 'Multi-Tool Fishing Kit',
    description: 'Essential fishing multi-tool including needle-nose pliers, line cutters, hook removers, and split ring pliers. Compact, portable design with comfortable non-slip grip.',
    price: 28.99,
    image: 'assets/pexels-jplenio-1105386.jpg',
    category: 'other'
  }
];

// Mock User Data (for demo purposes)
const mockUsers = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@email.com',
    address: '123 Fishing Lane, Angler Town, AT1 2BC',
    password: 'password123' // In real app, this would be hashed
  }
];

// Mock Orders Data
const mockOrders = [
  {
    id: 1,
    userId: 1,
    items: [
      { productId: 1, quantity: 1, price: 89.99 },
      { productId: 2, quantity: 2, price: 24.99 }
    ],
    total: 139.97,
    date: '2024-01-15',
    status: 'completed'
  },
  {
    id: 2,
    userId: 1,
    items: [
      { productId: 3, quantity: 1, price: 15.99 },
      { productId: 4, quantity: 1, price: 45.99 }
    ],
    total: 61.98,
    date: '2024-01-10',
    status: 'completed'
  }
];

// Export data for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { products, categories, mockUsers, mockOrders };
} 
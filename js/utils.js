// Utility Functions

// Format price to currency
function formatPrice(price) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(price);
}

// Format date
function formatDate(dateString) {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(dateString));
}

// Local Storage Management
const Storage = {
  // Get item from localStorage
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  // Set item in localStorage
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },

  // Remove item from localStorage
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  // Clear all localStorage
  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// Cart Management
const Cart = {
  // Get current cart
  get() {
    return Storage.get('cart') || [];
  },

  // Add item to cart
  add(productId, quantity = 1) {
    const cart = this.get();
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ productId, quantity });
    }
    
    Storage.set('cart', cart);
    this.updateCartUI();
    return cart;
  },

  // Remove item from cart
  remove(productId) {
    const cart = this.get().filter(item => item.productId !== productId);
    Storage.set('cart', cart);
    this.updateCartUI();
    return cart;
  },

  // Update item quantity
  updateQuantity(productId, quantity) {
    const cart = this.get();
    const item = cart.find(item => item.productId === productId);
    
    if (item) {
      if (quantity <= 0) {
        this.remove(productId);
      } else {
        item.quantity = quantity;
        Storage.set('cart', cart);
        this.updateCartUI();
      }
    }
    
    return cart;
  },

  // Get total items count
  getItemCount() {
    return this.get().reduce((total, item) => total + item.quantity, 0);
  },

  // Get total price
  getTotal() {
    const cart = this.get();
    return cart.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  },

  // Clear cart
  clear() {
    Storage.remove('cart');
    this.updateCartUI();
  },

  // Update cart UI elements
  updateCartUI() {
    const count = this.getItemCount();
    const cartElements = document.querySelectorAll('.cart-count, .mobile-cart-count');
    cartElements.forEach(element => {
      element.textContent = count;
      element.style.display = count > 0 ? 'block' : 'none';
    });
  }
};

// Authentication Management
const Auth = {
  // Get current user
  getCurrentUser() {
    return Storage.get('currentUser');
  },

  // Login user
  login(email, password) {
    // In a real app, this would make an API call
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      Storage.set('currentUser', userWithoutPassword);
      return userWithoutPassword;
    }
    return null;
  },

  // Register user
  register(userData) {
    // In a real app, this would make an API call
    const newUser = {
      id: mockUsers.length + 1,
      ...userData
    };
    mockUsers.push(newUser);
    const { password: _, ...userWithoutPassword } = newUser;
    Storage.set('currentUser', userWithoutPassword);
    return userWithoutPassword;
  },

  // Logout user
  logout() {
    Storage.remove('currentUser');
    Cart.clear();
  },

  // Check if user is logged in
  isLoggedIn() {
    return !!this.getCurrentUser();
  }
};

// Toast Notifications
const Toast = {
  show(message, type = 'success', duration = 3000) {
    const toast = document.getElementById('successToast');
    const messageElement = toast.querySelector('.toast-message');
    
    messageElement.textContent = message;
    toast.className = `toast active ${type}`;
    
    setTimeout(() => {
      toast.classList.add('slide-out');
      setTimeout(() => {
        toast.classList.remove('active', 'slide-out', type);
      }, 400);
    }, duration);
  }
};

// Smooth scrolling
function smoothScrollTo(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }
}

// Scroll to products section
function scrollToProducts() {
  smoothScrollTo('productsSection');
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Format product category for display
function formatCategory(category) {
  return categories[category] || category;
}

// Check if element is in viewport
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Animate element on scroll
function animateOnScroll() {
  const elements = document.querySelectorAll('.product-card, .stagger-item');
  elements.forEach(element => {
    if (isInViewport(element)) {
      element.classList.add('fade-in');
    }
  });
}

// Initialize utilities
function initUtils() {
  // Update cart UI on page load
  Cart.updateCartUI();
  
  // Add scroll listener for animations
  window.addEventListener('scroll', throttle(animateOnScroll, 100));
  
  // Initialize animations
  setTimeout(animateOnScroll, 100);
} 
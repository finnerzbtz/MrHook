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
    return JSON.parse(localStorage.getItem('currentUser'));
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

  // Update user profile
  updateUser(updatedUser) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === updatedUser.id);

    if (userIndex !== -1) {
      users[userIndex] = updatedUser;
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      return updatedUser;
    }
    return null;
  },

  // Request password reset
  requestPasswordReset(email) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email);

    if (user) {
      // In a real app, this would send an email
      // For demo, we'll just show a success message
      return true;
    }
    return false;
  },

  // Logout user
  logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    API.logout();
    Cart.clear();
  },

  // Check if user is logged in
  isLoggedIn() {
    return !!localStorage.getItem('authToken') && !!localStorage.getItem('currentUser');
  },

  // Show forgot password form
  showForgotPassword(event) {
    event.preventDefault();
    App.showPage('reset');
  },

  // Handle password reset request
  resetPassword(event) {
    event.preventDefault();

    const email = document.getElementById('resetEmail').value;
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email);

    if (!user) {
      Toast.show('No account found with that email address', 'error');
      return;
    }

    // Simulate sending reset email
    Toast.show('Password reset link sent to your email!');

    // For demo purposes, immediately show the new password form
    // In a real app, this would be handled via email link with token
    setTimeout(() => {
      localStorage.setItem('resetEmail', email);
      App.showPage('newPassword');
    }, 2000);
  },

  // Set new password
  setNewPassword(event) {
    event.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    const resetEmail = localStorage.getItem('resetEmail');

    if (newPassword !== confirmPassword) {
      Toast.show('Passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      Toast.show('Password must be at least 6 characters', 'error');
      return;
    }

    // Update user password
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.email === resetEmail);

    if (userIndex !== -1) {
      users[userIndex].password = newPassword;
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.removeItem('resetEmail');

      Toast.show('Password updated successfully!');

      setTimeout(() => {
        App.showPage('login');
      }, 2000);
    } else {
      Toast.show('Error updating password', 'error');
    }
  }
};

// Toast Notifications
const Toast = {
  activeToasts: new Set(),
  messageHistory: new Map(),

  show(message, type = 'success', duration = 3000) {
    // Prevent duplicate messages within 1 second
    const messageKey = `${type}:${message}`;
    const now = Date.now();

    if (this.messageHistory.has(messageKey)) {
      const lastShown = this.messageHistory.get(messageKey);
      if (now - lastShown < 1000) {
        return; // Skip duplicate message
      }
    }

    this.messageHistory.set(messageKey, now);

    // Clean up old history entries (older than 5 seconds)
    for (const [key, time] of this.messageHistory.entries()) {
      if (now - time > 5000) {
        this.messageHistory.delete(key);
      }
    }

    // Create unique ID for this toast
    const toastId = Date.now() + Math.random();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.dataset.toastId = toastId;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="Toast.close('${toastId}')">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    document.body.appendChild(toast);
    this.activeToasts.add(toastId);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('active');
    });

    // Auto remove after duration
    const autoRemoveTimer = setTimeout(() => {
      this.close(toastId);
    }, duration);

    // Store timer reference for cleanup
    toast._autoRemoveTimer = autoRemoveTimer;
  },

  close(toastId) {
    const toast = document.querySelector(`[data-toast-id="${toastId}"]`);
    if (!toast || !this.activeToasts.has(toastId)) return;

    // Clear auto-remove timer
    if (toast._autoRemoveTimer) {
      clearTimeout(toast._autoRemoveTimer);
    }

    // Remove from active set
    this.activeToasts.delete(toastId);

    // Animate out
    toast.classList.remove('active');
    toast.classList.add('slide-out');

    // Remove from DOM after animation
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 400);
  },

  // Clear all toasts
  clearAll() {
    this.activeToasts.forEach(toastId => this.close(toastId));
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

// Toggle password visibility
function togglePassword(inputId) {
  const passwordInput = document.getElementById(inputId);
  const icon = document.getElementById(inputId + 'Icon');

  if (!passwordInput || !icon) return;

  const isPassword = passwordInput.type === 'password';

  passwordInput.type = isPassword ? 'text' : 'password';
  icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
}

// Initialize utilities
function initUtils() {
  console.log('Utils initialized');
}
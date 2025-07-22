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

// Cart Management - Backend Only
const Cart = {
  // Update cart UI elements from backend
  async updateCartUI() {
    if (!Auth.isLoggedIn()) {
      const cartElements = document.querySelectorAll('.cart-count, .mobile-cart-count');
      cartElements.forEach(element => {
        element.textContent = '0';
        element.style.display = 'none';
      });
      return;
    }

    try {
      const cart = await API.getCart();
      const count = cart.reduce((total, item) => total + item.quantity, 0);
      
      const cartElements = document.querySelectorAll('.cart-count, .mobile-cart-count');
      cartElements.forEach(element => {
        element.textContent = count;
        element.style.display = count > 0 ? 'block' : 'none';
      });
    } catch (error) {
      console.error('Failed to update cart UI:', error);
      const cartElements = document.querySelectorAll('.cart-count, .mobile-cart-count');
      cartElements.forEach(element => {
        element.textContent = '0';
        element.style.display = 'none';
      });
    }
  },

  // Clear cart UI only (backend clearing handled by API)
  clearUI() {
    const cartElements = document.querySelectorAll('.cart-count, .mobile-cart-count');
    cartElements.forEach(element => {
      element.textContent = '0';
      element.style.display = 'none';
    });
  }
};

// Authentication Management
const Auth = {
  // Get current user from backend
  async getCurrentUser() {
    if (!this.isLoggedIn()) {
      return null;
    }

    try {
      const response = await API.getProfile();
      return response.user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      // If we can't get user data, they're not properly authenticated
      this.logout();
      return null;
    }
  },

  // Check if user is logged in - sync with API token
  isLoggedIn() {
    const hasToken = !!localStorage.getItem('authToken');
    
    // Ensure API instance has the token
    if (hasToken && window.API) {
      window.API.token = localStorage.getItem('authToken');
    }
    
    return hasToken;
  },

  // Logout user
  logout() {
    localStorage.removeItem('authToken');
    if (window.API) {
      window.API.logout();
    }
    Cart.clearUI();
  },

  // Show forgot password form
  showForgotPassword(event) {
    event.preventDefault();
    App.showPage('reset');
  },

  // Request password reset
  requestPasswordReset(email) {
    // Simple mock implementation for demo
    // In production, this would call an API endpoint
    return true;
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
// Main Application
const App = {
  currentPage: 'home',

  // Initialize the application
  init() {
    this.setupEventListeners();
    this.updateAuthUI();
    this.showPage('home');
    initUtils();

    // Initialize products
    ProductsComponent.render();

    // Initialize video hover functionality
    VideoHoverComponent.init();

    console.log('🎣 Mr Hook Fishing Supplies - App Initialized');
  },

  // Setup all event listeners
  setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuBtn.classList.toggle('active');
      mobileMenu.classList.toggle('active');
    });

    // Navigation links
    document.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-page')) {
        e.preventDefault();
        const page = e.target.getAttribute('data-page');
        this.showPage(page);

        // Close mobile menu if open
        mobileMenuBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
      }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        mobileMenuBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
      }
    });

    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
      const modal = document.getElementById('productModal');
      if (e.target === modal) {
        closeProductModal();
      }
    });

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeProductModal();
      }
    });

    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => {
        ProductsComponent.applyFilters();
      }, 300));
    }

    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => {
        ProductsComponent.applyFilters();
      });
    }

    // Price range slider
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');
    if (priceRange && priceValue) {
      priceRange.addEventListener('input', (e) => {
        priceValue.textContent = e.target.value;
        ProductsComponent.applyFilters();
      });
    }

    // Filters toggle (mobile)
    const filtersToggle = document.getElementById('filtersToggle');
    const filters = document.getElementById('filters');
    if (filtersToggle && filters) {
      filtersToggle.addEventListener('click', () => {
        filters.classList.toggle('active');
      });
    }

    // Auth tabs
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('auth-tab')) {
        const tab = e.target.getAttribute('data-tab');
        AuthComponent.switchTab(tab);
      }
    });

    // Auth forms
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
      loginForm.addEventListener('submit', AuthComponent.handleLogin);
    }

    if (signupForm) {
      signupForm.addEventListener('submit', AuthComponent.handleSignup);
    }

    // Smooth scrolling for internal links
    document.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').slice(1);
        smoothScrollTo(targetId);
      }
    });

    // Header scroll effect
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', throttle(() => {
      const header = document.getElementById('mainHeader');
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        header.style.transform = 'translateY(-100%)';
      } else {
        header.style.transform = 'translateY(0)';
      }

      // Add shadow when scrolled
      if (currentScrollY > 10) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      lastScrollY = currentScrollY;
    }, 100));
  },

  // Show specific page
  showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active', 'fade-in');
    });

    // Hide categories and products sections for auth pages
    const categoriesSection = document.getElementById('categoriesSection');
    const productsSection = document.getElementById('productsSection');

    if (pageName === 'home') {
      categoriesSection.style.display = 'block';
      productsSection.style.display = 'block';
      ProductsComponent.render();
    } else {
      categoriesSection.style.display = 'none';
      productsSection.style.display = 'none';

      // Show specific page
      const targetPage = document.getElementById(`${pageName}Page`);
      if (targetPage) {
        targetPage.classList.add('active', 'fade-in');

        // Render page content
        switch (pageName) {
          case 'profile':
            ProfileComponent.render();
            break;
          case 'basket':
            BasketComponent.render();
            break;
        }
      }
    }

    // Update navigation active states
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-page') === pageName) {
        link.classList.add('active');
      }
    });

    this.currentPage = pageName;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // Update authentication UI
  updateAuthUI() {
    const isLoggedIn = Auth.isLoggedIn();
    const user = Auth.getCurrentUser();

    // Desktop navigation
    const navDesktop = document.querySelector('.nav-desktop');
    if (navDesktop) {
      if (isLoggedIn) {
        navDesktop.innerHTML = `
          <a href="#" class="nav-link active" data-page="home">Products</a>
          <a href="#" class="nav-link" data-page="profile">Profile</a>
          <a href="#" class="nav-link cart-link" data-page="basket">
            <i class="fas fa-shopping-basket"></i>
            <span class="cart-count">0</span>
          </a>
          <a href="#" class="nav-link" onclick="ProfileComponent.logout()">Logout</a>
        `;
      } else {
        navDesktop.innerHTML = `
          <a href="#" class="nav-link active" data-page="home">Products</a>
          <a href="#" class="nav-link" data-page="login">Login</a>
        `;
      }
    }

    // Mobile navigation
    const mobileMenuContent = document.querySelector('.mobile-menu-content');
    if (mobileMenuContent) {
      if (isLoggedIn) {
        mobileMenuContent.innerHTML = `
          <a href="#" class="mobile-nav-link" data-page="home">
            <i class="fas fa-fish"></i>
            Products
          </a>
          <a href="#" class="mobile-nav-link" data-page="profile">
            <i class="fas fa-user"></i>
            Profile
          </a>
          <a href="#" class="mobile-nav-link" data-page="basket">
            <i class="fas fa-shopping-basket"></i>
            Basket (<span class="mobile-cart-count">0</span>)
          </a>
          <a href="#" class="mobile-nav-link" onclick="ProfileComponent.logout()">
            <i class="fas fa-sign-out-alt"></i>
            Logout
          </a>
        `;
      } else {
        mobileMenuContent.innerHTML = `
          <a href="#" class="mobile-nav-link" data-page="home">
            <i class="fas fa-fish"></i>
            Products
          </a>
          <a href="#" class="mobile-nav-link" data-page="login">
            <i class="fas fa-sign-in-alt"></i>
            Login
          </a>
        `;
      }
    }

    // Update cart count
    Cart.updateCartUI();

    // Update active navigation state
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-page') === this.currentPage) {
        link.classList.add('active');
      }
    });
  },

  // Handle errors gracefully
  handleError(error, message = 'An error occurred') {
    console.error('App Error:', error);
    Toast.show(message, 'error');
  }
};

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global Error:', event.error);
  Toast.show('Something went wrong. Please refresh the page.', 'error');
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
  Toast.show('An unexpected error occurred.', 'error');
});

// Hide loading screen function
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 350);
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎣 Mr Hook Fishing Supplies - App Initialized');

  try {
    // Ensure API is available
    if (typeof API === 'undefined' && typeof ApiService !== 'undefined') {
      window.API = new ApiService();
    }

    // Initialize components
    setTimeout(() => {
      hideLoadingScreen();
      App.init();
    }, 1500);
  } catch (error) {
    console.error('Failed to initialize app:', error);
    hideLoadingScreen();
    App.init();
  }
});

// Add additional CSS for scrolled header
const style = document.createElement('style');
style.textContent = `
  .header.scrolled {
    box-shadow: var(--shadow-lg);
  }

  .no-products,
  .empty-basket,
  .no-orders {
    text-align: center;
    padding: var(--space-16);
    color: var(--gray-500);
  }

  .order-item {
    background: var(--white);
    padding: var(--space-4);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-sm);
    margin-bottom: var(--space-4);
  }

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-3);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--gray-200);
  }

  .order-product {
    display: flex;
    justify-content: space-between;
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--gray-100);
  }

  .order-total {
    text-align: right;
    margin-top: var(--space-3);
    font-size: var(--font-size-lg);
    color: var(--primary-color);
  }

  .profile-info-item {
    display: flex;
    justify-content: space-between;
    padding: var(--space-3) 0;
    border-bottom: 1px solid var(--gray-100);
  }

  .profile-info-item label {
    font-weight: 600;
    color: var(--gray-700);
  }

  .quantity-display {
    padding: var(--space-2) var(--space-4);
    font-weight: 600;
    color: var(--primary-color);
  }

  .basket-item-subtotal {
    font-weight: 600;
    color: var(--secondary-color);
    font-size: var(--font-size-lg);
  }
`;
document.head.appendChild(style);
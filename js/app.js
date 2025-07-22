// Main Application
const App = {
  currentPage: 'home',

  // Initialize the application
  async init() {
    this.setupEventListeners();
    this.updateAuthUI();
    
    // Initialize backend-driven components
    await this.initializeComponents();
    
    this.showPage('home');
    initUtils();

    console.log('🎣 Mr Hook Fishing Supplies - App Initialized');
  },

  // Initialize all components
  async initializeComponents() {
    try {
      // Initialize products from backend
      await ProductsComponent.init();
      
      // Update cart UI from backend if logged in
      if (Auth.isLoggedIn()) {
        await Cart.updateCartUI();
      }
      
      // Initialize video hover functionality
      VideoHoverComponent.init();
    } catch (error) {
      console.error('Failed to initialize components:', error);
      // Show error message to user
      const grid = document.getElementById('productsGrid');
      if (grid) {
        grid.innerHTML = `
          <div class="error-products">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--secondary-color); margin-bottom: 1rem;"></i>
            <h3>Failed to load products</h3>
            <p>Please check your internet connection and try again.</p>
            <button class="btn btn-primary" onclick="App.initializeComponents()">
              <i class="fas fa-redo"></i>
              Retry
            </button>
          </div>
        `;
      }
    }
  },

  // Setup all event listeners
  setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        mobileMenuBtn.classList.toggle('active');
        mobileMenu.classList.toggle('active');
      });
    }

    // Navigation links
    document.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-page') || e.target.closest('[data-page]')) {
        e.preventDefault();
        e.stopPropagation();
        const target = e.target.hasAttribute('data-page') ? e.target : e.target.closest('[data-page]');
        const page = target.getAttribute('data-page');
        this.showPage(page);

        // Close mobile menu if open
        if (mobileMenuBtn && mobileMenu) {
          mobileMenuBtn.classList.remove('active');
          mobileMenu.classList.remove('active');
        }
      }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (mobileMenu && mobileMenuBtn && 
          !mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        mobileMenuBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
      }
    });

    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
      const modal = document.getElementById('productModal');
      if (e.target === modal) {
        // closeProductModal(); // This function is no longer needed
      }
    });

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // closeProductModal(); // This function is no longer needed
      }
    });

    // Search input with debounce
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
      if (!header) return;
      
      const currentScrollY = window.scrollY;

      // Always show header when at the top of the page
      if (currentScrollY <= 10) {
        header.style.transform = 'translateY(0)';
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Hide when scrolling down and past 100px
        header.style.transform = 'translateY(-100%)';
      } else if (currentScrollY < lastScrollY) {
        // Show when scrolling up
        header.style.transform = 'translateY(0)';
      }

      lastScrollY = currentScrollY;
    }, 100));
  },

  // Show specific page
  showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active', 'fade-in');
      // Clear any inline styles that might be blocking interactions
      if (page.id === 'productDetailPage') {
        page.style.cssText = '';
      }
    });

    // Hide categories and products sections for auth pages and product detail
    const categoriesSection = document.getElementById('categoriesSection');
    const productsSection = document.getElementById('productsSection');

    if (pageName === 'home') {
      if (categoriesSection) categoriesSection.style.display = 'block';
      if (productsSection) productsSection.style.display = 'block';
      // Products are already loaded from init, just render if needed
      if (ProductsComponent.filteredProducts.length === 0) {
        ProductsComponent.loadProducts();
      }
    } else {
      if (categoriesSection) categoriesSection.style.display = 'none';
      if (productsSection) productsSection.style.display = 'none';

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
          case 'productDetail':
            // Product detail content is already populated
            // Force full-width layout with inline styles
            if (targetPage) {
              targetPage.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                z-index: 9999 !important;
                background: white !important;
                display: block !important;
                overflow-y: auto !important;
              `;
              console.log('🎯 Applied full-width inline styles to product detail page');
            }
            break;
        }
      }
    }

    // Update navigation active states
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
      link.classList.remove('active');
      
      // Special handling for product detail page - mark Products as active
      const linkPage = link.getAttribute('data-page');
      if (pageName === 'productDetail' && linkPage === 'home') {
        link.classList.add('active');
      } else if (linkPage === pageName) {
        link.classList.add('active');
      }
    });

    this.currentPage = pageName;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // Update authentication UI
  async updateAuthUI() {
    const isLoggedIn = Auth.isLoggedIn();

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
        
        // Update cart count from backend
        await Cart.updateCartUI();
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
        
        // Update mobile cart count from backend
        await Cart.updateCartUI();
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
  },

  // Handle escape key to close modals
  handleEscapeKey(event) {
    if (event.key === 'Escape') {
      // Close password reset modal if open
      const passwordModal = document.getElementById('passwordResetModal');
      if (passwordModal && passwordModal.classList.contains('active')) {
        AuthComponent.closePasswordReset();
        return;
      }
    }
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

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎣 Mr Hook Fishing Supplies - App Initializing...');

  try {
    // Ensure API is available and properly configured
    if (typeof API === 'undefined') {
      console.log('Creating API instance...');
      window.API = new ApiService();
    }

    // Ensure API has the latest token
    if (window.API && localStorage.getItem('authToken')) {
      window.API.token = localStorage.getItem('authToken');
      console.log('API token loaded:', !!window.API.token);
    }

    // Initialize components
    setTimeout(async () => {
      hideLoadingScreen();
      await App.init();
    }, 1500);
  } catch (error) {
    console.error('Failed to initialize app:', error);
    hideLoadingScreen();
    await App.init();
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
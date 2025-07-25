// Component Management

// CRITICAL: Expose functions globally IMMEDIATELY for onclick handlers
window.testCategoryClick = function(category) {
  console.log('Button click detected for category:', category);
  alert(`Button clicked for: ${category}`);
}

// Filter by category from category cards - backend driven
async function filterByCategory(categoryType) {
  try {
    // Get form elements
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');

    if (!searchInput || !categoryFilter || !priceRange || !priceValue) {
      console.error('Filter form elements not found');
      return;
    }

    // Clear all filters first
    searchInput.value = '';
    priceRange.value = '200';
    priceValue.textContent = '200';

    // Set appropriate filter based on category
    if (categoryType === 'fishing-rods') {
      categoryFilter.value = 'rods';
    } else if (categoryType === 'bait-hooks') {
      // For combined category, use search approach
      searchInput.value = 'bait';
      categoryFilter.value = '';
    } else if (categoryType === 'containers-more') {
      categoryFilter.value = 'containers';
    } else {
      // Clear all filters for unknown category
      categoryFilter.value = '';
    }

    // Apply the filters
    await ProductsComponent.applyFilters();

    // Scroll to products section
    const productsSection = document.getElementById('productsSection');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Show feedback toast
    const count = ProductsComponent.filteredProducts.length;
    Toast.show(`Found ${count} products`, 'info');

  } catch (error) {
    console.error('Error in filterByCategory:', error);
    Toast.show('Failed to filter products', 'error');
  }
}

// Expose filterByCategory globally IMMEDIATELY
window.filterByCategory = filterByCategory;

// Products Component
const ProductsComponent = {
  filteredProducts: [],
  allProducts: [],
  isLoading: false,

  // Initialize and load products from backend
  async init() {
    await this.loadProducts();
    this.render();
  },

  // Load products from backend API
  async loadProducts(filters = {}) {
    console.log('loadProducts called with filters:', filters);
    
    if (this.isLoading) {
      console.log('Already loading, skipping...');
      return;
    }
    
    this.isLoading = true;
    this.showLoadingState();

    try {
      console.log('About to call API.getProducts...');
      this.allProducts = await API.getProducts(filters);
      this.filteredProducts = this.allProducts;
      
      console.log('Products loaded successfully:', {
        count: this.allProducts.length,
        products: this.allProducts.map(p => ({ id: p.id, name: p.name, category: p.category }))
      });
      
      console.log('About to render products...');
      this.render();
      console.log('Render complete');
      
    } catch (error) {
      console.error('Failed to load products:', error);
      this.showErrorState('Failed to load products. Please refresh the page.');
    } finally {
      this.isLoading = false;
      console.log('loadProducts finished, isLoading = false');
    }
  },

  // Show loading state
  showLoadingState() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    grid.innerHTML = `
      <div class="loading-products">
        <div class="spinner-ring"></div>
        <p>Loading our fishing products...</p>
      </div>
    `;
  },

  // Show error state
  showErrorState(message) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    // Clear existing content
    grid.innerHTML = '';

    // Create error container
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-products';

    // Create icon
    const icon = document.createElement('i');
    icon.className = 'fas fa-exclamation-triangle';
    icon.style.cssText = 'font-size: 3rem; color: var(--secondary-color); margin-bottom: 1rem;';

    // Create heading
    const heading = document.createElement('h3');
    heading.textContent = 'Oops! Something went wrong';

    // Create message paragraph
    const messageP = document.createElement('p');
    messageP.textContent = message; // Safe text content

    // Create button
    const button = document.createElement('button');
    button.className = 'btn btn-primary';
    button.onclick = () => ProductsComponent.loadProducts();

    // Create button icon
    const buttonIcon = document.createElement('i');
    buttonIcon.className = 'fas fa-redo';

    // Create button text
    const buttonText = document.createTextNode(' Try Again');

    // Assemble button
    button.appendChild(buttonIcon);
    button.appendChild(buttonText);

    // Assemble error div
    errorDiv.appendChild(icon);
    errorDiv.appendChild(heading);
    errorDiv.appendChild(messageP);
    errorDiv.appendChild(button);

    // Add to grid
    grid.appendChild(errorDiv);
  },

  // Render products grid
  render() {
    console.log('render() called');
    
    const grid = document.getElementById('productsGrid');
    if (!grid) {
      console.error('productsGrid element not found!');
      return;
    }
    
    console.log('About to render products:', {
      filteredProducts: this.filteredProducts.length,
      isLoading: this.isLoading
    });

    if (this.filteredProducts.length === 0 && !this.isLoading) {
      console.log('No products to show, displaying no-products message');
      grid.innerHTML = `
        <div class="no-products">
          <i class="fas fa-fish" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
          <h3>No products found</h3>
          <p>Try adjusting your filters to see more products.</p>
          <button class="btn btn-secondary" onclick="ProductsComponent.resetFilters()">
            Reset Filters
          </button>
        </div>
      `;
      return;
    }

    console.log('Building product cards HTML...');
    
    const productCards = this.filteredProducts.map((product, index) => {
      const card = `
        <div class="product-card stagger-item" data-product-id="${product.id}" style="animation-delay: ${index * 0.1}s">
          <img src="${product.image}" alt="${escapeHtml(product.name)}" class="product-image" loading="lazy">
          <div class="product-info">
            <h3 class="product-name">${escapeHtml(product.name)}</h3>
            <p class="product-category">${formatCategory(product.category || product.type)}</p>
            <div class="product-price">${formatPrice(product.price)}</div>
          </div>
        </div>
      `;
      console.log(`Created card for product ${product.id}: ${product.name}`);
      return card;
    });
    
    grid.innerHTML = productCards.join('');
    console.log(`Set grid innerHTML with ${productCards.length} cards`);

    // Add click listeners to product cards
    const cards = grid.querySelectorAll('.product-card');
    console.log(`Adding click listeners to ${cards.length} cards`);
    
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const productId = parseInt(card.dataset.productId);
        console.log(`Product card clicked: ${productId}`);
        this.showProductDetail(productId);
      });
    });

    // Trigger animation
    setTimeout(() => {
      console.log('Triggering animations...');
      grid.querySelectorAll('.product-card').forEach((card, index) => {
        setTimeout(() => card.classList.add('fade-in'), index * 100);
      });
      console.log('Animations triggered');
    }, 100);
    
    console.log('render() completed successfully');
  },

  // Show product detail page
  async showProductDetail(productId) {
    try {
      console.log('Loading product detail page for product:', productId);
      
      // Get product details from backend
      const product = await API.getProduct(productId);
      console.log('Product loaded:', product.name);

      const container = document.getElementById('productDetailContent');
      if (!container) {
        console.error('Product detail container not found!');
        return;
      }

      // Prepare the page but don't show it yet
      const productDetailPage = document.getElementById('productDetailPage');
      if (productDetailPage) {
        // Clear any previous inline styles that might be blocking
        productDetailPage.style.cssText = '';
        console.log('Cleared any blocking inline styles');
      }

      // Clear existing content
      container.innerHTML = '';

      // Create main layout
      const layoutDiv = document.createElement('div');
      layoutDiv.className = 'product-detail-layout';

      // Image section
      const imageSection = document.createElement('div');
      imageSection.className = 'product-detail-image-section';
      
      const img = document.createElement('img');
      img.src = product.image;
      img.alt = product.name;
      img.className = 'product-detail-image';
      imageSection.appendChild(img);

      // Info section
      const infoSection = document.createElement('div');
      infoSection.className = 'product-detail-info-section';

      // Product name
      const nameH1 = document.createElement('h1');
      nameH1.className = 'product-detail-name';
      nameH1.textContent = product.name;

      // Product category
      const categoryP = document.createElement('p');
      categoryP.className = 'product-detail-category';
      categoryP.textContent = formatCategory(product.category || product.type);

      // Product price
      const priceDiv = document.createElement('div');
      priceDiv.className = 'product-detail-price';
      priceDiv.textContent = formatPrice(product.price);

      // Description section
      const descriptionDiv = document.createElement('div');
      descriptionDiv.className = 'product-detail-description';
      
      const descH3 = document.createElement('h3');
      descH3.textContent = 'Description';
      
      const descP = document.createElement('p');
      descP.textContent = product.description;
      
      descriptionDiv.appendChild(descH3);
      descriptionDiv.appendChild(descP);

      // Actions section
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'product-detail-actions';

      // Quantity selector
      const quantitySelector = document.createElement('div');
      quantitySelector.className = 'quantity-selector';
      
      const quantityLabel = document.createElement('label');
      quantityLabel.setAttribute('for', 'productQuantity');
      quantityLabel.textContent = 'Quantity:';
      
      const quantityControls = document.createElement('div');
      quantityControls.className = 'quantity-controls';
      
      // Minus button
      const minusBtn = document.createElement('button');
      minusBtn.type = 'button';
      minusBtn.className = 'quantity-btn';
      minusBtn.onclick = () => ProductsComponent.updateQuantity(-1);
      const minusIcon = document.createElement('i');
      minusIcon.className = 'fas fa-minus';
      minusBtn.appendChild(minusIcon);
      
      // Quantity input
      const quantityInput = document.createElement('input');
      quantityInput.type = 'number';
      quantityInput.value = '1';
      quantityInput.min = '1';
      quantityInput.max = '99';
      quantityInput.className = 'quantity-input';
      quantityInput.id = 'productQuantity';
      
      // Plus button
      const plusBtn = document.createElement('button');
      plusBtn.type = 'button';
      plusBtn.className = 'quantity-btn';
      plusBtn.onclick = () => ProductsComponent.updateQuantity(1);
      const plusIcon = document.createElement('i');
      plusIcon.className = 'fas fa-plus';
      plusBtn.appendChild(plusIcon);
      
      quantityControls.appendChild(minusBtn);
      quantityControls.appendChild(quantityInput);
      quantityControls.appendChild(plusBtn);
      
      quantitySelector.appendChild(quantityLabel);
      quantitySelector.appendChild(quantityControls);

      // Product actions
      const productActions = document.createElement('div');
      productActions.className = 'product-actions';
      
      // Add to cart button
      const addToCartBtn = document.createElement('button');
      addToCartBtn.className = 'btn btn-primary btn-add-to-cart';
      addToCartBtn.onclick = () => ProductsComponent.addToCart(productId);
      
      const cartIcon = document.createElement('i');
      cartIcon.className = 'fas fa-shopping-basket';
      const cartText = document.createTextNode(' Add to Basket');
      
      addToCartBtn.appendChild(cartIcon);
      addToCartBtn.appendChild(cartText);
      
      // Back button
      const backBtn = document.createElement('button');
      backBtn.className = 'btn btn-outline';
      backBtn.onclick = () => App.showPage('home');
      
      const backIcon = document.createElement('i');
      backIcon.className = 'fas fa-arrow-left';
      const backText = document.createTextNode(' Back to search');
      
      backBtn.appendChild(backIcon);
      backBtn.appendChild(backText);
      
      productActions.appendChild(addToCartBtn);
      productActions.appendChild(backBtn);
      
      actionsDiv.appendChild(quantitySelector);
      actionsDiv.appendChild(productActions);

      // Assemble info section
      infoSection.appendChild(nameH1);
      infoSection.appendChild(categoryP);
      infoSection.appendChild(priceDiv);
      infoSection.appendChild(descriptionDiv);
      infoSection.appendChild(actionsDiv);

      // Assemble layout
      layoutDiv.appendChild(imageSection);
      layoutDiv.appendChild(infoSection);
      
      // Add to container
      container.appendChild(layoutDiv);

      console.log('Product detail content populated');
      
      // Show the product detail page and scroll to top
      App.showPage('productDetail');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      console.error('Error loading product detail:', error);
      Toast.show('Failed to load product details', 'error');
    }
  },

  // Update quantity in modal
  updateQuantity(change) {
    const input = document.getElementById('productQuantity');
    if (!input) return;

    const currentValue = parseInt(input.value);
    const newValue = Math.max(1, Math.min(99, currentValue + change));
    input.value = newValue;
  },

  // Add product to cart - backend only
  async addToCart(productId) {
    if (!Auth.isLoggedIn()) {
      Toast.show('Please login to add items to your basket', 'error');
      App.showPage('login');
      return;
    }

    const quantityInput = document.getElementById('productQuantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

    try {
      // Add to backend cart
      await API.addToCart(productId, quantity);

      // Update UI cart count
      await this.updateCartUIFromBackend();

      const product = this.allProducts.find(p => p.id === productId);
      Toast.show(`${product?.name || 'Product'} added to basket!`);

      // Close the product detail page and return to home
      App.showPage('home');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      Toast.show('Failed to add item to basket', 'error');
    }
  },

  // Update cart UI from backend
  async updateCartUIFromBackend() {
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
    }
  },

  // Apply filters using backend API
  async applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const priceRange = parseFloat(document.getElementById('priceRange')?.value || '200');

    const filters = {};
    if (searchTerm) filters.search = searchTerm;
    if (categoryFilter) filters.category = categoryFilter;
    if (priceRange < 200) filters.maxPrice = priceRange;

    await this.loadProducts(filters);
  },

  // Reset filters
  async resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');

    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (priceRange) priceRange.value = '200';
    if (priceValue) priceValue.textContent = '200';

    await this.loadProducts();
  }
};

// Authentication Component
const AuthComponent = {
  // Handle login form
  async handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      Toast.show('Please fill in all fields', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      Toast.show('Please enter a valid email address', 'error');
      return;
    }

    try {
      const response = await API.login(email, password);

      const userName = response.user.firstName || response.user.first_name || 'User';
      Toast.show(`Welcome back, ${userName}!`);
      App.updateAuthUI();
      App.showPage('home');
    } catch (error) {
      console.error('Login error:', error);
      Toast.show(error.message || 'Invalid email or password', 'error');
    }
  },

  // Handle signup form
  async handleSignup(event) {
    event.preventDefault();

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const homeAddress = document.getElementById('homeAddress').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!firstName || !lastName || !email || !homeAddress || !password || !confirmPassword) {
      Toast.show('Please fill in all fields', 'error');
      return;
    }

    if (password !== confirmPassword) {
      Toast.show('Passwords do not match', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      Toast.show('Please enter a valid email address', 'error');
      return;
    }

    if (password.length < 6) {
      Toast.show('Password must be at least 6 characters long', 'error');
      return;
    }

    try {
      const userData = { 
        firstName, 
        lastName, 
        email, 
        homeAddress,
        password 
      };
      
      const response = await API.register(userData);
      
      Toast.show(`Account created successfully! Welcome, ${response.user.firstName}!`);
      App.updateAuthUI();
      App.showPage('home');
    } catch (error) {
      console.error('Registration error:', error);
      Toast.show(error.message || 'Error creating account. Please try again.', 'error');
    }
  },

  // Switch between login and signup tabs
  switchTab(tab) {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));

    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}Form`).classList.add('active');
  },

  // Show password reset modal
  showPasswordReset() {
    const modal = document.getElementById('passwordResetModal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Add form listener
      const form = document.getElementById('passwordResetForm');
      if (form) {
        form.addEventListener('submit', this.handlePasswordReset);
      }
    }
  },

  // Close password reset modal
  closePasswordReset() {
    const modal = document.getElementById('passwordResetModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';

      // Reset form
      const form = document.getElementById('passwordResetForm');
      if (form) form.reset();
    }
  },

  // Handle password reset
  async handlePasswordReset(event) {
    event.preventDefault();

    const email = document.getElementById('resetEmail')?.value.trim();

    if (!email) {
      Toast.show('Please enter your email address', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      Toast.show('Please enter a valid email address', 'error');
      return;
    }

    try {
      // Show loading state
      const submitBtn = event.target.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      }

      // Call password reset API
      const response = await API.forgotPassword(email);
      
      Toast.show('Password reset link sent to your email!');
      AuthComponent.closePasswordReset();

      // For demo purposes, show the reset link in console
      if (response.resetLink) {
        console.log('Demo Reset Link:', response.resetLink);
        Toast.show(`Demo: Check console for reset link`, 'info');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      Toast.show(error.message || 'Failed to send reset email. Please try again.', 'error');
    } finally {
      // Reset button state
      const submitBtn = event.target.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Link';
      }
    }
  }
};

// Reset Password Component
const ResetPasswordComponent = {
  currentToken: null,

  // Initialize reset password page
  init() {
    // Check URL for reset token
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    console.log('ResetPasswordComponent.init() - Token detected:', token);
    
    if (token) {
      this.currentToken = token;
      console.log('Token found, showing reset password page');
      App.showPage('resetPassword');
      
      // Add form listener
      const form = document.getElementById('resetPasswordForm');
      if (form) {
        form.addEventListener('submit', this.handleResetPassword.bind(this));
        console.log('Reset password form listener added');
      } else {
        console.log('Reset password form not found');
      }
      
      return true; // Token found
    } else {
      console.log('No token found in URL');
      return false; // No token
    }
  },

  // Handle reset password form submission
  async handleResetPassword(event) {
    event.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;

    // Validation
    if (!newPassword || !confirmPassword) {
      Toast.show('Please fill in all fields', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show('Passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      Toast.show('Password must be at least 6 characters long', 'error');
      return;
    }

    if (!this.currentToken) {
      Toast.show('Invalid reset token', 'error');
      return;
    }

    try {
      // Show loading state
      const submitBtn = event.target.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';
      }

      // Call reset password API
      await API.resetPassword(this.currentToken, newPassword);
      
      Toast.show('Password reset successfully! Please login with your new password.');
      
      // Clear URL parameters and redirect to login
      window.history.replaceState({}, document.title, window.location.pathname);
      App.showPage('login');
      
    } catch (error) {
      console.error('Reset password error:', error);
      Toast.show(error.message || 'Failed to reset password. Please try again.', 'error');
    } finally {
      // Reset button state
      const submitBtn = event.target.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-key"></i> Reset Password';
      }
    }
  }
};

// Email Verification Component
const EmailVerificationComponent = {
  currentToken: null,

  // Initialize email verification detection
  init() {
    // Check URL for email verification token
    const urlParams = new URLSearchParams(window.location.search);
    const emailToken = urlParams.get('emailToken');
    
    console.log('EmailVerificationComponent.init() - Token detected:', emailToken);
    
    if (emailToken) {
      this.currentToken = emailToken;
      console.log('Email verification token found, processing verification');
      this.verifyEmailChange(emailToken);
      return true; // Token found
    } else {
      console.log('No email verification token found in URL');
      return false; // No token
    }
  },

  // Handle email verification
  async verifyEmailChange(token) {
    try {
      console.log('Verifying email change with token:', token);
      
      // Call email verification API
      const response = await API.verifyEmailChange(token);
      
      Toast.show(`Email address updated successfully to ${response.newEmail}! Please login again.`);
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Force logout to refresh user data with new email
      Auth.logout();
      App.updateAuthUI();
      App.showPage('login');
      
    } catch (error) {
      console.error('Email verification error:', error);
      Toast.show(error.message || 'Failed to verify email change. The link may be expired.', 'error');
      
      // Clear URL parameters and show home page
      window.history.replaceState({}, document.title, window.location.pathname);
      App.showPage('home');
    }
  }
};

// Profile Component
const ProfileComponent = {
  isEditing: false,

  // Render profile information
  async render() {
    if (!Auth.isLoggedIn()) {
      App.showPage('login');
      return;
    }

    const profileInfo = document.getElementById('profileInfo');
    const ordersList = document.getElementById('ordersList');

    if (!profileInfo || !ordersList) {
      console.error('Profile elements not found');
      return;
    }

    // Show loading state
    profileInfo.innerHTML = '<div class="loading-spinner"><div class="spinner-ring"></div><p>Loading profile...</p></div>';
    ordersList.innerHTML = '<div class="loading-spinner"><div class="spinner-ring"></div><p>Loading orders...</p></div>';

    try {
      // Fetch fresh user data from API
      console.log('Loading profile from API...');
      const response = await API.getProfile();
      const user = response.user;

      if (this.isEditing) {
        this.renderEditForm(profileInfo, user);
      } else {
        this.renderViewMode(profileInfo, user);
      }

      // Load orders from backend
      await this.renderOrdersFromBackend(ordersList);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      profileInfo.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Failed to load profile. Please refresh the page.</p>
        </div>
      `;
      ordersList.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Failed to load order history.</p>
        </div>
      `;
    }
  },

  // Render orders from backend
  async renderOrdersFromBackend(container) {
    try {
      console.log('Loading orders from API...');
      const orders = await API.getOrders();
      console.log('Orders loaded:', orders.length);

      if (orders.length === 0) {
        container.innerHTML = `
          <div class="no-orders">
            <i class="fas fa-receipt" style="font-size: 2rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
            <p>No orders yet. Start shopping to see your order history!</p>
            <button class="btn btn-primary" onclick="App.showPage('home')">
              Start Shopping
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = orders.map(order => `
        <div class="order-item stagger-item">
          <div class="order-header">
            <h4>Order #${order.id}</h4>
            <span class="order-date">${formatDate(order.createdAt || order.date_ordered)}</span>
            <span class="order-status ${order.status || 'completed'}">${(order.status || 'completed').toUpperCase()}</span>
          </div>
          <div class="order-items">
            ${order.items ? order.items.map(item => `
              <div class="order-product">
                <span class="product-name">${escapeHtml(item.name || item.product?.name || 'Product')}</span>
                <span class="product-quantity">Qty: ${item.quantity}</span>
                <span class="product-subtotal">${formatPrice(item.subtotal || (item.price || item.product?.price || 0) * item.quantity)}</span>
              </div>
            `).join('') : '<p>No items found</p>'}
          </div>
          <div class="order-total">
            <strong>Total: ${formatPrice(order.total || order.total_price)}</strong>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Failed to load orders:', error);
      container.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Failed to load order history. Please try again later.</p>
          <button class="btn btn-secondary" onclick="ProfileComponent.render()">
            Retry
          </button>
        </div>
      `;
    }
  },

  // Render view mode
  renderViewMode(container, user) {
    const firstName = user.firstName || user.first_name || 'Not provided';
    const lastName = user.lastName || user.last_name || 'Not provided';
    const email = user.email || 'Not provided';
    const homeAddress = user.homeAddress || user.home_address || 'Not provided';

    // Clear existing content
    container.innerHTML = '';

    // Create profile info items
    const createInfoItem = (labelText, value) => {
      const div = document.createElement('div');
      div.className = 'profile-info-item';
      
      const label = document.createElement('label');
      label.textContent = labelText;
      
      const span = document.createElement('span');
      span.textContent = value;
      
      div.appendChild(label);
      div.appendChild(span);
      return div;
    };

    // Create info items
    container.appendChild(createInfoItem('First Name:', firstName));
    container.appendChild(createInfoItem('Last Name:', lastName));
    container.appendChild(createInfoItem('Email:', email));
    container.appendChild(createInfoItem('Home Address:', homeAddress));

    // Create actions div
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'profile-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-primary';
    editBtn.onclick = () => ProfileComponent.startEditing();
    
    const editIcon = document.createElement('i');
    editIcon.className = 'fas fa-edit';
    const editText = document.createTextNode(' Edit Profile');
    
    editBtn.appendChild(editIcon);
    editBtn.appendChild(editText);

    // Logout button
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn btn-outline';
    logoutBtn.onclick = () => ProfileComponent.logout();
    
    const logoutIcon = document.createElement('i');
    logoutIcon.className = 'fas fa-sign-out-alt';
    const logoutText = document.createTextNode(' Logout');
    
    logoutBtn.appendChild(logoutIcon);
    logoutBtn.appendChild(logoutText);

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(logoutBtn);
    container.appendChild(actionsDiv);
  },

  // Render edit form
  renderEditForm(container, user) {
    const firstName = user.firstName || user.first_name || '';
    const lastName = user.lastName || user.last_name || '';
    const email = user.email || '';
    const homeAddress = user.homeAddress || user.home_address || '';

    // Clear existing content
    container.innerHTML = '';

    // Create form
    const form = document.createElement('form');
    form.id = 'profileEditForm';
    form.className = 'profile-edit-form';

    // Form row for first and last name
    const formRow = document.createElement('div');
    formRow.className = 'form-row';

    // First name group
    const firstNameGroup = document.createElement('div');
    firstNameGroup.className = 'form-group';
    
    const firstNameLabel = document.createElement('label');
    firstNameLabel.setAttribute('for', 'editFirstName');
    firstNameLabel.textContent = 'First Name';
    
    const firstNameInput = document.createElement('input');
    firstNameInput.type = 'text';
    firstNameInput.id = 'editFirstName';
    firstNameInput.value = firstName;
    firstNameInput.required = true;
    firstNameInput.className = 'form-input';
    
    firstNameGroup.appendChild(firstNameLabel);
    firstNameGroup.appendChild(firstNameInput);

    // Last name group
    const lastNameGroup = document.createElement('div');
    lastNameGroup.className = 'form-group';
    
    const lastNameLabel = document.createElement('label');
    lastNameLabel.setAttribute('for', 'editLastName');
    lastNameLabel.textContent = 'Last Name';
    
    const lastNameInput = document.createElement('input');
    lastNameInput.type = 'text';
    lastNameInput.id = 'editLastName';
    lastNameInput.value = lastName;
    lastNameInput.required = true;
    lastNameInput.className = 'form-input';
    
    lastNameGroup.appendChild(lastNameLabel);
    lastNameGroup.appendChild(lastNameInput);

    formRow.appendChild(firstNameGroup);
    formRow.appendChild(lastNameGroup);

    // Email group
    const emailGroup = document.createElement('div');
    emailGroup.className = 'form-group';
    
    const emailLabel = document.createElement('label');
    emailLabel.setAttribute('for', 'editEmail');
    emailLabel.textContent = 'Email';
    
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'editEmail';
    emailInput.value = email;
    emailInput.className = 'form-input';
    emailInput.placeholder = 'Enter your email address';
    
    const emailNote = document.createElement('small');
    emailNote.className = 'form-note';
    
    const emailIcon = document.createElement('i');
    emailIcon.className = 'fas fa-info-circle';
    
    const emailNoteText = document.createTextNode(' Changing your email will require verification. A confirmation link will be sent to your new email address.');
    
    emailNote.appendChild(emailIcon);
    emailNote.appendChild(emailNoteText);
    
    emailGroup.appendChild(emailLabel);
    emailGroup.appendChild(emailInput);
    emailGroup.appendChild(emailNote);

    // Home address group
    const addressGroup = document.createElement('div');
    addressGroup.className = 'form-group';
    
    const addressLabel = document.createElement('label');
    addressLabel.setAttribute('for', 'editHomeAddress');
    addressLabel.textContent = 'Home Address';
    
    const addressTextarea = document.createElement('textarea');
    addressTextarea.id = 'editHomeAddress';
    addressTextarea.required = true;
    addressTextarea.className = 'form-input';
    addressTextarea.rows = 3;
    addressTextarea.placeholder = 'Enter your full home address';
    addressTextarea.value = homeAddress;
    
    addressGroup.appendChild(addressLabel);
    addressGroup.appendChild(addressTextarea);

    // Actions
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'profile-actions';

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'btn btn-primary';
    
    const saveIcon = document.createElement('i');
    saveIcon.className = 'fas fa-save';
    const saveText = document.createTextNode(' Save Changes');
    
    saveBtn.appendChild(saveIcon);
    saveBtn.appendChild(saveText);

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-outline';
    cancelBtn.onclick = () => ProfileComponent.cancelEditing();
    
    const cancelIcon = document.createElement('i');
    cancelIcon.className = 'fas fa-times';
    const cancelText = document.createTextNode(' Cancel');
    
    cancelBtn.appendChild(cancelIcon);
    cancelBtn.appendChild(cancelText);

    actionsDiv.appendChild(saveBtn);
    actionsDiv.appendChild(cancelBtn);

    // Assemble form
    form.appendChild(formRow);
    form.appendChild(emailGroup);
    form.appendChild(addressGroup);
    form.appendChild(actionsDiv);

    container.appendChild(form);

    // Add form submit listener
    document.getElementById('profileEditForm').addEventListener('submit', (e) => {
      this.handleProfileUpdate(e);
    });
  },

  // Start editing
  startEditing() {
    this.isEditing = true;
    this.render();
  },

  // Cancel editing
  cancelEditing() {
    this.isEditing = false;
    this.render();
  },

  // Handle profile update
  async handleProfileUpdate(event) {
    event.preventDefault();

    const firstName = document.getElementById('editFirstName').value.trim();
    const lastName = document.getElementById('editLastName').value.trim();
    const newEmail = document.getElementById('editEmail').value.trim();
    const homeAddress = document.getElementById('editHomeAddress').value.trim();

    // Get current user data to compare email
    const currentUser = await Auth.getCurrentUser();
    const currentEmail = currentUser?.email || '';

    // Validation
    if (!firstName || !lastName || !newEmail || !homeAddress) {
      Toast.show('Please fill in all required fields', 'error');
      return;
    }

    if (!isValidEmail(newEmail)) {
      Toast.show('Please enter a valid email address', 'error');
      return;
    }

    try {
      // Show loading state
      const submitBtn = event.target.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      }

      // Check if email has changed
      const emailChanged = newEmail !== currentEmail;

      if (emailChanged) {
        // Handle email change separately with verification
        await API.requestEmailChange(newEmail);
        Toast.show(`Verification link sent to ${newEmail}. Please check your email to confirm the change.`);
        
        // Also update other profile fields
        await API.updateProfile({
          firstName,
          lastName,
          homeAddress
        });
        
        Toast.show('Profile updated! Please check your email to verify the email change.', 'info');
      } else {
        // Update profile normally (no email change)
        await API.updateProfile({
          firstName,
          lastName,
          homeAddress
        });
        
        Toast.show('Profile updated successfully!');
      }

      this.isEditing = false;

      // Refresh the profile display
      await this.render();
    } catch (error) {
      console.error('Profile update error:', error);
      Toast.show(error.message || 'Error updating profile. Please try again.', 'error');
    } finally {
      // Reset button state
      const submitBtn = event.target.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
      }
    }
  },

  // Logout
  logout() {
    Auth.logout();
    App.updateAuthUI();
    App.showPage('home');
    Toast.show('Logged out successfully');
  }
};

// Basket Component
const BasketComponent = {
  // Render basket contents
  async render() {
    if (!Auth.isLoggedIn()) {
      App.showPage('login');
      return;
    }

    const basketContent = document.getElementById('basketContent');
    const basketSummary = document.getElementById('basketSummary');

    if (!basketContent || !basketSummary) {
      console.error('Basket elements not found');
      return;
    }

    // Show loading state
    basketContent.innerHTML = '<div class="loading-spinner"><div class="spinner-ring"></div><p>Loading your basket...</p></div>';
    basketSummary.innerHTML = '';

    try {
      // Load cart from backend only
      console.log('Loading cart from API...');
      const cart = await API.getCart();
      console.log('Cart loaded from API:', cart.length, 'items');

      this.renderBasketContent(basketContent, basketSummary, cart);
    } catch (error) {
      console.error('Failed to load cart from API:', error);
      basketContent.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Failed to load your basket. Please try again.</p>
          <button class="btn btn-secondary" onclick="BasketComponent.render()">
            Retry
          </button>
        </div>
      `;
      basketSummary.innerHTML = '';
    }
  },

  // Render basket content and summary
  renderBasketContent(basketContent, basketSummary, cart) {
    if (cart.length === 0) {
      basketContent.innerHTML = `
        <div class="empty-basket">
          <i class="fas fa-shopping-basket" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
          <h3>Your basket is empty</h3>
          <p>Add some fishing gear to get started!</p>
          <button class="btn btn-primary" onclick="App.showPage('home')">
            Start Shopping
          </button>
        </div>
      `;
      basketSummary.innerHTML = '';
      return;
    }

    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    // Render basket items
    basketContent.innerHTML = cart.map(item => {
      const product = item.product;
      if (!product) return '';

      return `
        <div class="basket-item">
          <img src="${product.image}" alt="${escapeHtml(product.name)}" class="basket-item-image">
          <div class="basket-item-info">
            <h4 class="basket-item-name">${escapeHtml(product.name)}</h4>
            <p class="basket-item-category">${formatCategory(product.category || product.type)}</p>
            <div class="basket-item-price">${formatPrice(product.price)}</div>
          </div>
          <div class="basket-item-controls">
            <div class="quantity-controls">
              <button class="quantity-btn" onclick="BasketComponent.updateQuantity(${product.id}, ${item.quantity - 1})">
                <i class="fas fa-minus"></i>
              </button>
              <span class="quantity-display">${item.quantity}</span>
              <button class="quantity-btn" onclick="BasketComponent.updateQuantity(${product.id}, ${item.quantity + 1})">
                <i class="fas fa-plus"></i>
              </button>
            </div>
            <div class="item-subtotal">${formatPrice(product.price * item.quantity)}</div>
            <button class="btn-remove" onclick="BasketComponent.removeItem(${product.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Render summary
    basketSummary.innerHTML = `
      <div class="basket-summary-total">
        <span>Total:</span>
        <span>${formatPrice(total)}</span>
      </div>
      <button class="btn btn-primary btn-checkout" onclick="BasketComponent.placeOrder()">
        <i class="fas fa-credit-card"></i>
        Complete Order
      </button>
    `;
  },

  // Update item quantity - backend only
  async updateQuantity(productId, newQuantity) {
    try {
      // Show loading state for the specific item
      const itemControls = document.querySelector(`[onclick*="${productId}"]`)?.closest('.basket-item')?.querySelector('.quantity-controls');
      if (itemControls) {
        itemControls.style.opacity = '0.5';
        itemControls.style.pointerEvents = 'none';
      }

      if (newQuantity <= 0) {
        await API.removeFromCart(productId);
      } else {
        await API.updateCart(productId, newQuantity);
      }

      // Update cart UI
      await Cart.updateCartUI();

      // Re-render basket
      await this.render();
    } catch (error) {
      console.error('Failed to update cart:', error);
      Toast.show('Failed to update cart. Please try again.', 'error');

      // Reset loading state
      const itemControls = document.querySelector(`[onclick*="${productId}"]`)?.closest('.basket-item')?.querySelector('.quantity-controls');
      if (itemControls) {
        itemControls.style.opacity = '1';
        itemControls.style.pointerEvents = 'auto';
      }
    }
  },

  // Remove item from basket - backend only
  async removeItem(productId) {
    try {
      const itemElement = document.querySelector(`[onclick*="removeItem(${productId})"]`)?.closest('.basket-item');
      if (itemElement) {
        itemElement.style.opacity = '0.5';
        itemElement.style.pointerEvents = 'none';
      }

      await API.removeFromCart(productId);

      // Update cart UI
      await Cart.updateCartUI();

      Toast.show('Item removed from basket');

      // Re-render basket
      await this.render();
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      Toast.show('Failed to remove item. Please try again.', 'error');

      // Reset loading state
      const itemElement = document.querySelector(`[onclick*="removeItem(${productId})"]`)?.closest('.basket-item');
      if (itemElement) {
        itemElement.style.opacity = '1';
        itemElement.style.pointerEvents = 'auto';
      }
    }
  },

  // Place order - backend only
  async placeOrder() {
    if (!Auth.isLoggedIn()) {
      Toast.show('Please login to place an order', 'error');
      App.showPage('login');
      return;
    }

    // Check if user is properly authenticated
    if (!Auth.isLoggedIn()) {
      Toast.show('Authentication expired. Please login again.', 'error');
      App.showPage('login');
      return;
    }

    try {
      // Check if cart is empty first
      const cart = await API.getCart();
      if (cart.length === 0) {
        Toast.show('Your basket is empty', 'error');
        return;
      }

      // Show loading state
      const checkoutBtn = document.querySelector('.btn-checkout');
      if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';
      }

      // Ensure API has the auth token
      if (window.API && localStorage.getItem('authToken')) {
        window.API.token = localStorage.getItem('authToken');
      }

      // Create order via API
      console.log('Creating order...');
      const response = await API.createOrder();
      console.log('Order creation response:', response);

      // Update cart UI
      await Cart.updateCartUI();

      Toast.show('Order placed successfully! Thank you for your purchase.');
      App.showPage('home');

    } catch (error) {
      console.error('Order placement failed:', error);

      // Handle specific error types
      if (error.message.includes('401') || error.message.includes('403')) {
        Toast.show('Authentication expired. Please login again.', 'error');
        Auth.logout();
        App.showPage('login');
      } else if (error.message.includes('Database not available')) {
        Toast.show('Service temporarily unavailable. Please try again later.', 'error');
      } else {
        Toast.show('Failed to place order. Please try again.', 'error');
      }
    } finally{
      // Reset button state
      const checkoutBtn = document.querySelector('.btn-checkout');
      if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<i class="fas fa-credit-card"></i> Complete Order';
      }
    }
  }
};



// Video Hover Component
const VideoHoverComponent = {
  observedVideos: new Set(),

  // Initialize video hover functionality
  init() {
    // Check if device is mobile/tablet
    const isMobile = window.innerWidth <= 768;

    document.querySelectorAll('.category-card').forEach(card => {
      const video = card.querySelector('.category-video');
      const image = card.querySelector('.category-image');

      if (!video || !image) return;

      if (isMobile) {
        // On mobile: autoplay videos when they come into view
        this.setupIntersectionObserver(video, image);
      } else {
        // On desktop: immediate hover to play videos
        card.addEventListener('mouseenter', () => {
          this.playVideo(video, image);
        });

        card.addEventListener('mouseleave', () => {
          this.showImage(video, image);
        });
      }
    });

    // Listen for window resize to handle mobile/desktop switches
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 768 && this.observedVideos.size === 0) {
        // Switched to mobile view
        this.init();
      } else if (window.innerWidth > 768) {
        // Switched to desktop view - clean up observers
        this.cleanupObservers();
      }
    });
  },

  // Setup intersection observer for mobile autoplay
  setupIntersectionObserver(video, image) {
    if (this.observedVideos.has(video)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Video is in view - play it
          this.playVideo(video, image);
        } else {
          // Video is out of view - stop and reset
          this.showImage(video, image);
        }
      });
    }, {
      threshold: 0.5, // Play when 50% of video is visible
      rootMargin: '0px 0px -10% 0px' // Slight offset to prevent premature triggering
    });

    observer.observe(video);
    this.observedVideos.add(video);
    video._observer = observer; // Store reference for cleanup
  },

  // Clean up intersection observers
  cleanupObservers() {
    this.observedVideos.forEach(video => {
      if (video._observer) {
        video._observer.disconnect();
        delete video._observer;
      }
    });
    this.observedVideos.clear();
  },

  // Play video and hide image
  playVideo(video, image) {
    video.currentTime = 0; // Reset to beginning
    video.play().then(() => {
      video.classList.add('playing');
      image.classList.add('hidden');
    }).catch(error => {
      console.warn('Video play failed:', error);
    });
  },

  // Show image and hide video
  showImage(video, image) {
    video.pause();
    video.classList.remove('playing');
    image.classList.remove('hidden');
  }
};

// CRITICAL: Export functions globally for onclick handlers and component access
window.ProductsComponent = {
  init: ProductsComponent.init.bind(ProductsComponent),
  loadProducts: ProductsComponent.loadProducts.bind(ProductsComponent),
  showProductDetail: ProductsComponent.showProductDetail.bind(ProductsComponent),
  updateQuantity: ProductsComponent.updateQuantity.bind(ProductsComponent),
  addToCart: ProductsComponent.addToCart.bind(ProductsComponent),
  resetFilters: ProductsComponent.resetFilters.bind(ProductsComponent),
  applyFilters: ProductsComponent.applyFilters.bind(ProductsComponent)
};

window.AuthComponent = AuthComponent;
window.ResetPasswordComponent = ResetPasswordComponent;
window.EmailVerificationComponent = EmailVerificationComponent;
window.ProfileComponent = ProfileComponent;
window.BasketComponent = BasketComponent;
window.VideoHoverComponent = VideoHoverComponent;

// Global utility functions
window.filterByCategory = filterByCategory;

console.log('All global functions exposed successfully!');
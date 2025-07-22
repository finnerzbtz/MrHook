// Component Management

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
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoadingState();

    try {
      console.log('Loading products from API...');
      this.allProducts = await API.getProducts(filters);
      this.filteredProducts = this.allProducts;
      console.log('Products loaded:', this.allProducts.length);
      this.render();
    } catch (error) {
      console.error('Failed to load products:', error);
      this.showErrorState('Failed to load products. Please refresh the page.');
    } finally {
      this.isLoading = false;
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

    grid.innerHTML = `
      <div class="error-products">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--secondary-color); margin-bottom: 1rem;"></i>
        <h3>Oops! Something went wrong</h3>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="ProductsComponent.loadProducts()">
          <i class="fas fa-redo"></i>
          Try Again
        </button>
      </div>
    `;
  },

  // Render products grid
  render() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (this.filteredProducts.length === 0 && !this.isLoading) {
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

    grid.innerHTML = this.filteredProducts.map((product, index) => `
      <div class="product-card stagger-item" data-product-id="${product.id}" style="animation-delay: ${index * 0.1}s">
        <img src="${product.image}" alt="${escapeHtml(product.name)}" class="product-image" loading="lazy">
        <div class="product-info">
          <h3 class="product-name">${escapeHtml(product.name)}</h3>
          <p class="product-category">${formatCategory(product.category || product.type)}</p>
          <div class="product-price">${formatPrice(product.price)}</div>
        </div>
      </div>
    `).join('');

    // Add click listeners to product cards
    grid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        const productId = parseInt(card.dataset.productId);
        this.showProductDetail(productId);
      });
    });

    // Trigger animation
    setTimeout(() => {
      grid.querySelectorAll('.product-card').forEach((card, index) => {
        setTimeout(() => card.classList.add('fade-in'), index * 100);
      });
    }, 100);
  },

  // Show product detail modal
  async showProductDetail(productId) {
    try {
      // Get product details from backend
      const product = await API.getProduct(productId);

      const modal = document.getElementById('productModal');
      const detail = document.getElementById('productDetail');

      // Check if modal elements exist
      if (!modal || !detail) {
        console.error('Product modal elements not found');
        Toast.show('Product details cannot be displayed', 'error');
        return;
      }

      detail.innerHTML = `
        <img src="${product.image}" alt="${escapeHtml(product.name)}" class="product-detail-image">
        <div class="product-detail-info">
          <h2 class="product-detail-name">${escapeHtml(product.name)}</h2>
          <p class="product-detail-category">${formatCategory(product.category || product.type)}</p>
          <div class="product-detail-price">${formatPrice(product.price)}</div>
          <p class="product-detail-description">${escapeHtml(product.description)}</p>
        </div>
        <div class="quantity-selector">
          <label>Quantity:</label>
          <button class="quantity-btn" onclick="ProductsComponent.updateQuantity(-1)">
            <i class="fas fa-minus"></i>
          </button>
          <input type="number" value="1" min="1" max="99" class="quantity-input" id="productQuantity">
          <button class="quantity-btn" onclick="ProductsComponent.updateQuantity(1)">
            <i class="fas fa-plus"></i>
          </button>
        </div>
        <div class="product-actions">
          <button class="btn btn-primary btn-add-to-cart" onclick="ProductsComponent.addToCart(${productId})">
            <i class="fas fa-shopping-basket"></i>
            Add to Basket
          </button>
          <button class="btn btn-outline" onclick="closeProductModal()">
            <i class="fas fa-arrow-left"></i>
            Back to Products
          </button>
        </div>
      `;

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    } catch (error) {
      console.error('Failed to load product details:', error);
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

      closeProductModal();
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

// Filter by category from category cards - backend driven
async function filterByCategory(categoryType) {
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const priceRange = document.getElementById('priceRange');
  const priceValue = document.getElementById('priceValue');

  // Reset other filters first
  if (searchInput) searchInput.value = '';
  if (priceRange) priceRange.value = '200';
  if (priceValue) priceValue.textContent = '200';

  // Set category filter based on the category type
  let filterValue = '';
  switch(categoryType) {
    case 'fishing-rods':
      filterValue = 'rods';
      break;
    case 'bait-hooks':
      filterValue = 'bait';
      break;
    case 'containers-more':
      filterValue = 'containers';
      break;
    default:
      filterValue = '';
  }

  if (categoryFilter) categoryFilter.value = filterValue;

  // Apply the filter using backend
  await ProductsComponent.applyFilters();

  // Scroll to products section
  smoothScrollTo('productsSection');
}

// Close product modal
function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Global utility function for smooth scrolling
function smoothScrollTo(targetId) {
  const element = document.getElementById(targetId);
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }
}

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
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Toast.show('Please fill in all fields', 'error');
      return;
    }

    if (password !== confirmPassword) {
      Toast.show('Passwords do not match', 'error');
      return;
    }

    // Get address from form fields
    const addressLine1 = document.getElementById('addressLine1')?.value.trim() || '';
    const addressLine2 = document.getElementById('addressLine2')?.value.trim() || '';
    const city = document.getElementById('city')?.value.trim() || '';
    const postcode = document.getElementById('postcode')?.value.trim() || '';
    const county = document.getElementById('county')?.value.trim() || '';

    // Build home address string
    const addressParts = [addressLine1, addressLine2, city, postcode, county].filter(part => part);
    const homeAddress = addressParts.join(', ');

    // Validate required address fields
    if (!addressLine1 || !city || !postcode) {
      Toast.show('Please complete your address details', 'error');
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
  handlePasswordReset(event) {
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

    // For demo purposes, just show success message
    Toast.show('Password reset link sent to your email!');
    AuthComponent.closePasswordReset();
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
                <span class="product-name">${escapeHtml(item.name || 'Product')}</span>
                <span class="product-quantity">Qty: ${item.quantity}</span>
                <span class="product-subtotal">${formatPrice(item.subtotal || (item.price * item.quantity))}</span>
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

    container.innerHTML = `
      <div class="profile-info-item">
        <label>First Name:</label>
        <span>${escapeHtml(firstName)}</span>
      </div>
      <div class="profile-info-item">
        <label>Last Name:</label>
        <span>${escapeHtml(lastName)}</span>
      </div>
      <div class="profile-info-item">
        <label>Email:</label>
        <span>${escapeHtml(email)}</span>
      </div>
      <div class="profile-info-item">
        <label>Home Address:</label>
        <span>${escapeHtml(homeAddress)}</span>
      </div>
      <div class="profile-actions">
        <button class="btn btn-primary" onclick="ProfileComponent.startEditing()">
          <i class="fas fa-edit"></i>
          Edit Profile
        </button>
        <button class="btn btn-outline" onclick="ProfileComponent.logout()">
          <i class="fas fa-sign-out-alt"></i>
          Logout
        </button>
      </div>
    `;
  },

  // Render edit form
  renderEditForm(container, user) {
    const firstName = user.firstName || user.first_name || '';
    const lastName = user.lastName || user.last_name || '';
    const email = user.email || '';
    const homeAddress = user.homeAddress || user.home_address || '';

    container.innerHTML = `
      <form id="profileEditForm" class="profile-edit-form">
        <div class="form-row">
          <div class="form-group">
            <label for="editFirstName">First Name</label>
            <input type="text" id="editFirstName" value="${escapeHtml(firstName)}" required class="form-input">
          </div>
          <div class="form-group">
            <label for="editLastName">Last Name</label>
            <input type="text" id="editLastName" value="${escapeHtml(lastName)}" required class="form-input">
          </div>
        </div>
        <div class="form-group">
          <label for="editEmail">Email</label>
          <input type="email" id="editEmail" value="${escapeHtml(email)}" readonly class="form-input" style="background-color: #f5f5f5; cursor: not-allowed;">
          <small class="form-note">Email cannot be changed at this time</small>
        </div>
        <div class="form-group">
          <label for="editHomeAddress">Home Address</label>
          <textarea id="editHomeAddress" required class="form-input" rows="3" placeholder="Enter your full home address">${escapeHtml(homeAddress)}</textarea>
        </div>

        <div class="profile-actions">
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i>
            Save Changes
          </button>
          <button type="button" class="btn btn-outline" onclick="ProfileComponent.cancelEditing()">
            <i class="fas fa-times"></i>
            Cancel
          </button>
        </div>
      </form>
    `;

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
    const homeAddress = document.getElementById('editHomeAddress').value.trim();

    // Validation
    if (!firstName || !lastName || !homeAddress) {
      Toast.show('Please fill in all required fields', 'error');
      return;
    }

    try {
      // Show loading state
      const submitBtn = event.target.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      }

      // Update profile via API - send homeAddress as a simple string
      console.log('Updating profile...');
      await API.updateProfile({
        firstName,
        lastName,
        homeAddress
      });

      this.isEditing = false;
      Toast.show('Profile updated successfully!');

      // Refresh the profile display
      await this.render();
    } catch (error) {
      console.error('Profile update error:', error);
      Toast.show(error.message || 'Error updating profile. Please try again.', 'error');
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

// Category filtering function for homepage buttons
function filterByCategory(category) {
  // Switch to products page and apply filter
  App.showPage('home');

  // Apply the category filter
  const categorySelect = document.getElementById('categoryFilter');
  if (categorySelect) {
    categorySelect.value = category;
  }

  // Trigger filter update
  ProductsComponent.applyFilters();
}

// Export functions
window.ProductsComponent = {
  init: ProductsComponent.init,
  loadProducts: ProductsComponent.loadProducts,
  showProductDetail: ProductsComponent.showProductDetail,
  updateQuantity: ProductsComponent.updateQuantity,
  addToCart: ProductsComponent.addToCart,
  resetFilters: ProductsComponent.resetFilters,
  applyFilters: ProductsComponent.applyFilters
};

// Make filterByCategory globally available
window.filterByCategory = filterByCategory;
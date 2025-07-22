// Component Management

// Products Component
const ProductsComponent = {
  filteredProducts: products,

  // Render products grid
  render() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (this.filteredProducts.length === 0) {
      grid.innerHTML = `
        <div class="no-products">
          <i class="fas fa-fish" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
          <h3>No products found</h3>
          <p>Try adjusting your filters to see more products.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.filteredProducts.map((product, index) => `
      <div class="product-card stagger-item" data-product-id="${product.id}" style="animation-delay: ${index * 0.1}s">
        <img src="${product.image}" alt="${escapeHtml(product.name)}" class="product-image" loading="lazy">
        <div class="product-info">
          <h3 class="product-name">${escapeHtml(product.name)}</h3>
          <p class="product-category">${formatCategory(product.category)}</p>
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

  // Show product detail (replace products grid)
  showProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    // Hide filters when showing product detail
    const filters = document.getElementById('filters');
    if (filters) {
      filters.style.display = 'none';
    }

    grid.innerHTML = `
      <div class="product-detail-container">
        <div class="product-detail-content">
          <img src="${product.image}" alt="${escapeHtml(product.name)}" class="product-detail-image">
          <div class="product-detail-info">
            <h2 class="product-detail-name">${escapeHtml(product.name)}</h2>
            <p class="product-detail-category">${formatCategory(product.category)}</p>
            <div class="product-detail-price">${formatPrice(product.price)}</div>
            <p class="product-detail-description">${escapeHtml(product.description)}</p>

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
              <button class="btn btn-outline" onclick="ProductsComponent.backToSearch()">
                <i class="fas fa-arrow-left"></i>
                Back to Search
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Store current product for quantity updates
    this.currentProduct = productId;
  },

  // Back to search function
  backToSearch() {
    // Show filters again
    const filters = document.getElementById('filters');
    if (filters) {
      filters.style.display = 'block';
    }

    // Clear current product
    this.currentProduct = null;

    // Re-render the products grid
    this.render();
  },

  // Update quantity in modal
  updateQuantity(change) {
    const input = document.getElementById('productQuantity');
    if (!input) return;

    const currentValue = parseInt(input.value);
    const newValue = Math.max(1, Math.min(99, currentValue + change));
    input.value = newValue;
  },

  // Add product to cart
  async addToCart(productId) {
    if (!Auth.isLoggedIn()) {
      Toast.show('Please login to add items to your basket', 'error');
      App.showPage('login');
      return;
    }

    const quantityInput = document.getElementById('productQuantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

    try {
      // Add to backend cart via API
      await API.addToCart(productId, quantity);
      
      // Also add to local cart for immediate UI updates
      Cart.add(productId, quantity);

      const product = products.find(p => p.id === productId);
      Toast.show(`${product.name} added to basket!`);

      // Go back to search after adding to cart
      this.backToSearch();
    } catch (error) {
      console.error('Failed to add to cart:', error);
      Toast.show('Failed to add item to basket. Please try again.', 'error');
    }
  },

  // Apply filters
  applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const priceRange = parseFloat(document.getElementById('priceRange').value);

    this.filteredProducts = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                           product.description.toLowerCase().includes(searchTerm);
      const matchesCategory = !categoryFilter || product.category === categoryFilter;
      const matchesPrice = product.price <= priceRange;

      return matchesSearch && matchesCategory && matchesPrice;
    });

    this.render();
  },

  // Reset filters
  resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('priceRange').value = '200';
    document.getElementById('priceValue').textContent = '200';

    this.filteredProducts = products;
    this.render();
  }
};

// Filter by category from category cards
function filterByCategory(categoryType) {
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const priceRange = document.getElementById('priceRange');
  const priceValue = document.getElementById('priceValue');

  // Reset filters first
  searchInput.value = '';
  priceRange.value = '200';
  priceValue.textContent = '200';

  // Set category filter based on the category type
  switch(categoryType) {
    case 'fishing-rods':
      categoryFilter.value = 'fishing-rods';
      break;
    case 'bait-hooks':
      // Show both bait and hooks
      categoryFilter.value = '';
      // Filter manually for bait and hooks
      ProductsComponent.filteredProducts = products.filter(product => 
        product.category === 'bait' || product.category === 'hooks'
      );
      ProductsComponent.render();
      smoothScrollTo('productsSection');
      return;
    case 'containers-more':
      // Show containers and other
      categoryFilter.value = '';
      // Filter manually for containers and other
      ProductsComponent.filteredProducts = products.filter(product => 
        product.category === 'containers' || product.category === 'other'
      );
      ProductsComponent.render();
      smoothScrollTo('productsSection');
      return;
    default:
      categoryFilter.value = '';
  }

  // Apply the filter
  ProductsComponent.applyFilters();

  // Scroll to products section
  smoothScrollTo('productsSection');
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

      // Store user data locally for Auth.getCurrentUser()
      localStorage.setItem('currentUser', JSON.stringify(response.user));

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
        homeAddress,
        email, 
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
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Add form listener
    const form = document.getElementById('passwordResetForm');
    form.addEventListener('submit', this.handlePasswordReset);
  },

  // Close password reset modal
  closePasswordReset() {
    const modal = document.getElementById('passwordResetModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Reset form
    document.getElementById('passwordResetForm').reset();
  },

  // Handle password reset
  handlePasswordReset(event) {
    event.preventDefault();

    const email = document.getElementById('resetEmail').value.trim();

    if (!email) {
      Toast.show('Please enter your email address', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      Toast.show('Please enter a valid email address', 'error');
      return;
    }

    const success = Auth.requestPasswordReset(email);

    if (success) {
      Toast.show('Password reset link sent to your email!');
      AuthComponent.closePasswordReset();
    } else {
      Toast.show('Email address not found', 'error');
    }
  }
};

// Profile Component
const ProfileComponent = {
  isEditing: false,

  // Render profile information
  async render() {
    const user = Auth.getCurrentUser();
    if (!user) {
      App.showPage('login');
      return;
    }

    const profileInfo = document.getElementById('profileInfo');
    const ordersList = document.getElementById('ordersList');

    // Fetch fresh user data from API to ensure we have complete profile
    try {
      const freshUserData = await API.getProfile();
      // Update local storage with complete user data
      localStorage.setItem('currentUser', JSON.stringify(freshUserData.user));

      const completeUser = freshUserData.user;

      if (this.isEditing) {
        this.renderEditForm(profileInfo, completeUser);
      } else {
        this.renderViewMode(profileInfo, completeUser);
      }

      this.renderOrders(ordersList, completeUser);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to stored user data
      if (this.isEditing) {
        this.renderEditForm(profileInfo, user);
      } else {
        this.renderViewMode(profileInfo, user);
      }

      this.renderOrders(ordersList, user);
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
          <textarea id="editHomeAddress" required class="form-textarea">${escapeHtml(homeAddress)}</textarea>
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

  // Render orders section
  renderOrders(container, user) {

    const userOrders = mockOrders.filter(order => order.userId === user.id);

    if (userOrders.length === 0) {
      container.innerHTML = `
        <div class="no-orders">
          <i class="fas fa-receipt" style="font-size: 2rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
          <p>No orders yet. Start shopping to see your order history!</p>
        </div>
      `;
    } else {
      container.innerHTML = userOrders.map(order => `
        <div class="order-item stagger-item">
          <div class="order-header">
            <h4>Order #${order.id}</h4>
            <span class="order-date">${formatDate(order.date)}</span>
          </div>
          <div class="order-items">
            ${order.items.map(item => {
              const product = products.find(p => p.id === item.productId);
              return `
                <div class="order-product">
                  <span>${product ? product.name : 'Unknown Product'}</span>
                  <span>Qty: ${item.quantity}</span>
                  <span>${formatPrice(item.price * item.quantity)}</span>
                </div>
              `;
            }).join('')}
          </div>
          <div class="order-total">
            <strong>Total: ${formatPrice(order.total)}</strong>
          </div>
        </div>
      `).join('');
    }
  },

  // Start editing mode
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
      // Update profile via API - send homeAddress as a simple string
      const response = await API.updateProfile({
        firstName,
        lastName,
        homeAddress
      });

      // Update local storage with fresh data
      localStorage.setItem('currentUser', JSON.stringify(response.user));

      this.isEditing = false;
      this.render();

      Toast.show('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      Toast.show(error.message || 'Error updating profile. Please try again.', 'error');
    }
  },

  // Logout user
  logout() {
    Auth.logout();
    Toast.show('Logged out successfully');
    App.updateAuthUI();
    App.showPage('home');
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
    
    // Load cart from API to ensure sync with backend
    let cart = [];
    try {
      // Only try API if we have proper authentication
      if (window.API && window.API.token) {
        console.log('Loading cart from API...');
        cart = await API.getCart();
        console.log('Cart loaded from API:', cart.length, 'items');
        
        // Sync local cart with backend
        const localCart = cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }));
        Storage.set('cart', localCart);
        Cart.updateCartUI();
      } else {
        throw new Error('No authentication token available');
      }
    } catch (error) {
      console.warn('Failed to load cart from API, using local data:', error);
      // Fallback to local cart
      cart = Cart.get().map(item => {
        const product = products.find(p => p.id === item.productId);
        return { ...item, product };
      }).filter(item => item.product); // Remove items without valid products
    }

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

    // Render basket items
    basketContent.innerHTML = cart.map(item => {
      const product = item.product || products.find(p => p.id === item.productId);
      if (!product) return '';

      const subtotal = product.price * item.quantity;

      return `
        <div class="basket-item stagger-item">
          <img src="${product.image}" alt="${escapeHtml(product.name)}" class="basket-item-image">
          <div class="basket-item-info">
            <h4 class="basket-item-name">${escapeHtml(product.name)}</h4>
            <p class="basket-item-price">${formatPrice(product.price)} each</p>
          </div>
          <div class="basket-item-controls">
            <button class="quantity-btn" onclick="BasketComponent.updateQuantity(${item.productId}, ${item.quantity - 1})">
              <i class="fas fa-minus"></i>
            </button>
            <span class="quantity-display">${item.quantity}</span>
            <button class="quantity-btn" onclick="BasketComponent.updateQuantity(${item.productId}, ${item.quantity + 1})">
              <i class="fas fa-plus"></i>
            </button>
            <button class="btn btn-outline" onclick="BasketComponent.removeItem(${item.productId})" style="margin-left: 1rem;">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <div class="basket-item-subtotal">
            ${formatPrice(subtotal)}
          </div>
        </div>
      `;
    }).join('');

    // Render basket summary
    const total = cart.reduce((sum, item) => {
      const product = item.product || products.find(p => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
    basketSummary.innerHTML = `
      <div class="summary-row">
        <span>Subtotal:</span>
        <span>${formatPrice(total)}</span>
      </div>
      <div class="summary-row">
        <span>Shipping:</span>
        <span>Free</span>
      </div>
      <div class="summary-row">
        <span>Total:</span>
        <span>${formatPrice(total)}</span>
      </div>
      <button class="btn btn-primary btn-checkout" onclick="BasketComponent.placeOrder()">
        <i class="fas fa-credit-card"></i>
        Complete Order
      </button>
    `;
  },

  // Update item quantity
  async updateQuantity(productId, newQuantity) {
    try {
      if (newQuantity <= 0) {
        await API.removeFromCart(productId);
      } else {
        await API.updateCart(productId, newQuantity);
      }
      
      // Update local cart as well
      Cart.updateQuantity(productId, newQuantity);
      
      this.render();
    } catch (error) {
      console.error('Failed to update cart:', error);
      Toast.show('Failed to update cart. Please try again.', 'error');
    }
  },

  // Remove item from basket
  async removeItem(productId) {
    try {
      await API.removeFromCart(productId);
      
      const product = products.find(p => p.id === productId);
      Cart.remove(productId);
      Toast.show(`${product.name} removed from basket`);
      this.render();
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      Toast.show('Failed to remove item. Please try again.', 'error');
    }
  },

  // Place order
  async placeOrder() {
    const user = Auth.getCurrentUser();
    if (!user) {
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

    const cart = Cart.get();
    if (cart.length === 0) {
      Toast.show('Your basket is empty', 'error');
      return;
    }

    try {
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
      console.log('Creating order...', { userToken: !!window.API?.token, cartItems: cart.length });
      const response = await API.createOrder();
      console.log('Order creation response:', response);

      // Clear cart after successful order
      Cart.clear();

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
    } finally {
      // Reset button state
      const checkoutBtn = document.querySelector('.btn-checkout');
      if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<i class="fas fa-credit-card"></i> Complete Order';
      }
    }
  }
};



// Reset filters
function resetFilters() {
  ProductsComponent.resetFilters();
} 

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
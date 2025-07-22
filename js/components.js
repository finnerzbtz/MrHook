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

  // Show product detail modal
  showProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const modal = document.getElementById('productModal');
    const detail = document.getElementById('productDetail');

    detail.innerHTML = `
      <img src="${product.image}" alt="${escapeHtml(product.name)}" class="product-detail-image">
      <div class="product-detail-info">
        <h2 class="product-detail-name">${escapeHtml(product.name)}</h2>
        <p class="product-detail-category">${formatCategory(product.category)}</p>
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
  addToCart(productId) {
    if (!Auth.isLoggedIn()) {
      Toast.show('Please login to add items to your basket', 'error');
      App.showPage('login');
      return;
    }

    const quantityInput = document.getElementById('productQuantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

    Cart.add(productId, quantity);

    const product = products.find(p => p.id === productId);
    Toast.show(`${product.name} added to basket!`);

    closeProductModal();
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
  handleLogin(event) {
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

    const user = Auth.login(email, password);
    if (user) {
      Toast.show(`Welcome back, ${user.firstName}!`);
      App.updateAuthUI();
      App.showPage('home');
    } else {
      Toast.show('Invalid email or password', 'error');
    }
  },

  // Handle signup form
  handleSignup(event) {
    event.preventDefault();

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    if (!firstName || !lastName || !email || !password) {
      Toast.show('Please fill in all fields', 'error');
      return;
    }

    // Validate address using AddressLookup utility
    if (!AddressLookup.validateAddress()) {
      return;
    }

    const address = AddressLookup.getFormattedAddress();

    if (!isValidEmail(email)) {
      Toast.show('Please enter a valid email address', 'error');
      return;
    }

    if (password.length < 6) {
      Toast.show('Password must be at least 6 characters long', 'error');
      return;
    }

    const userData = { firstName, lastName, email, address, password };
    const user = Auth.register(userData);

    if (user) {
      Toast.show(`Account created successfully! Welcome, ${user.firstName}!`);
      App.updateAuthUI();
      App.showPage('home');
    } else {
      Toast.show('Error creating account. Please try again.', 'error');
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
  render() {
    const user = Auth.getCurrentUser();
    if (!user) {
      App.showPage('login');
      return;
    }

    const profileInfo = document.getElementById('profileInfo');
    const ordersList = document.getElementById('ordersList');

    if (this.isEditing) {
      this.renderEditForm(profileInfo, user);
    } else {
      this.renderViewMode(profileInfo, user);
    }

    this.renderOrders(ordersList, user);
  },

  // Render view mode
  renderViewMode(container, user) {
    container.innerHTML = `
      <div class="profile-info-item">
        <label>First Name:</label>
        <span>${escapeHtml(user.firstName)}</span>
      </div>
      <div class="profile-info-item">
        <label>Last Name:</label>
        <span>${escapeHtml(user.lastName)}</span>
      </div>
      <div class="profile-info-item">
        <label>Email:</label>
        <span>${escapeHtml(user.email)}</span>
      </div>
      <div class="profile-info-item">
        <label>Address:</label>
        <span>${escapeHtml(user.address)}</span>
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
    container.innerHTML = `
      <form id="profileEditForm" class="profile-edit-form">
        <div class="form-row">
          <div class="form-group">
            <label for="editFirstName">First Name</label>
            <input type="text" id="editFirstName" value="${escapeHtml(user.firstName)}" required class="form-input">
          </div>
          <div class="form-group">
            <label for="editLastName">Last Name</label>
            <input type="text" id="editLastName" value="${escapeHtml(user.lastName)}" required class="form-input">
          </div>
        </div>
        <div class="form-group">
          <label for="editEmail">Email</label>
          <input type="email" id="editEmail" value="${escapeHtml(user.email)}" required class="form-input">
          <small class="form-note">Changing email will require verification</small>
        </div>
        <div class="form-group">
          <label for="editAddress">Address</label>
          <textarea id="editAddress" required class="form-input" rows="3">${escapeHtml(user.address)}</textarea>
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
  handleProfileUpdate(event) {
    event.preventDefault();

    const firstName = document.getElementById('editFirstName').value.trim();
    const lastName = document.getElementById('editLastName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const address = document.getElementById('editAddress').value.trim();

    // Validation
    if (!firstName || !lastName || !email || !address) {
      Toast.show('Please fill in all fields', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      Toast.show('Please enter a valid email address', 'error');
      return;
    }

    const currentUser = Auth.getCurrentUser();
    const emailChanged = email !== currentUser.email;

    // Update user data
    const updatedUser = {
      ...currentUser,
      firstName,
      lastName,
      email,
      address
    };

    // Save updated user
    Auth.updateUser(updatedUser);

    this.isEditing = false;
    this.render();

    if (emailChanged) {
      Toast.show('Profile updated! Email verification sent to new address.');
    } else {
      Toast.show('Profile updated successfully!');
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
  render() {
    if (!Auth.isLoggedIn()) {
      App.showPage('login');
      return;
    }

    const basketContent = document.getElementById('basketContent');
    const basketSummary = document.getElementById('basketSummary');
    const cart = Cart.get();

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
      const product = products.find(p => p.id === item.productId);
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
    const total = Cart.getTotal();
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
      <button class="btn btn-primary btn-checkout" onclick="BasketComponent.checkout()">
        <i class="fas fa-credit-card"></i>
        Complete Order
      </button>
    `;
  },

  // Update item quantity
  updateQuantity(productId, newQuantity) {
    Cart.updateQuantity(productId, newQuantity);
    this.render();
  },

  // Remove item from basket
  removeItem(productId) {
    const product = products.find(p => p.id === productId);
    Cart.remove(productId);
    Toast.show(`${product.name} removed from basket`);
    this.render();
  },

  // Checkout process
  checkout() {
    const cart = Cart.get();
    if (cart.length === 0) {
      Toast.show('Your basket is empty', 'error');
      return;
    }

    // Simulate order processing
    const total = Cart.getTotal();
    const user = Auth.getCurrentUser();

    // Create new order
    const newOrder = {
      id: mockOrders.length + 1,
      userId: user.id,
      items: cart.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: product.price
        };
      }),
      total: total,
      date: new Date().toISOString().split('T')[0],
      status: 'completed'
    };

    mockOrders.push(newOrder);
    Cart.clear();

    Toast.show('Order placed successfully! Thank you for your purchase.');
    App.showPage('home');
  }
};

// Close product modal
function closeProductModal() {
  const modal = document.getElementById('productModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

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
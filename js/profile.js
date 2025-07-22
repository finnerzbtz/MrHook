
// Profile Management System
class ProfileManager {
  constructor() {
    this.currentUser = this.getCurrentUser();
    this.users = JSON.parse(localStorage.getItem('mrHookUsers')) || [];
    this.init();
  }

  init() {
    // Redirect if not logged in
    if (!this.currentUser) {
      window.location.href = 'login.html';
      return;
    }

    this.setupEventListeners();
    this.loadProfileData();
    this.loadOrderHistory();
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('mrHookCurrentUser')) || null;
  }

  setupEventListeners() {
    const editProfileBtn = document.getElementById('editProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const updateProfileForm = document.getElementById('updateProfileForm');

    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', () => this.enterEditMode());
    }
    
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => this.exitEditMode());
    }
    
    if (updateProfileForm) {
      updateProfileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
    }
  }

  loadProfileData() {
    if (!this.currentUser) return;

    // Update header info
    document.getElementById('profileName').textContent = 
      `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    document.getElementById('profileEmail').textContent = this.currentUser.email;

    // Update details view
    document.getElementById('displayName').textContent = 
      `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    document.getElementById('displayEmail').textContent = this.currentUser.email;
    
    const addressText = [
      this.currentUser.address.line1,
      this.currentUser.address.line2,
      this.currentUser.address.city,
      this.currentUser.address.postcode
    ].filter(line => line).join(', ');
    
    document.getElementById('displayAddress').textContent = addressText;

    // Pre-fill edit form
    document.getElementById('editFirstName').value = this.currentUser.firstName;
    document.getElementById('editLastName').value = this.currentUser.lastName;
    document.getElementById('editEmail').value = this.currentUser.email;
    document.getElementById('editAddressLine1').value = this.currentUser.address.line1;
    document.getElementById('editAddressLine2').value = this.currentUser.address.line2;
    document.getElementById('editCity').value = this.currentUser.address.city;
    document.getElementById('editPostcode').value = this.currentUser.address.postcode;
  }

  enterEditMode() {
    document.getElementById('detailsView').classList.add('hidden');
    document.getElementById('detailsEdit').classList.remove('hidden');
    document.getElementById('editProfileBtn').classList.add('hidden');
  }

  exitEditMode() {
    document.getElementById('detailsView').classList.remove('hidden');
    document.getElementById('detailsEdit').classList.add('hidden');
    document.getElementById('editProfileBtn').classList.remove('hidden');
  }

  handleProfileUpdate(e) {
    e.preventDefault();

    const updatedData = {
      firstName: document.getElementById('editFirstName').value.trim(),
      lastName: document.getElementById('editLastName').value.trim(),
      email: document.getElementById('editEmail').value.toLowerCase().trim(),
      address: {
        line1: document.getElementById('editAddressLine1').value.trim(),
        line2: document.getElementById('editAddressLine2').value.trim(),
        city: document.getElementById('editCity').value.trim(),
        postcode: document.getElementById('editPostcode').value.trim().toUpperCase()
      }
    };

    // Check if email is already taken by another user
    const emailExists = this.users.find(u => 
      u.email === updatedData.email && u.id !== this.currentUser.id
    );
    
    if (emailExists) {
      this.showMessage('Email address is already in use by another account.', 'error');
      return;
    }

    // Update user in users array
    const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
    if (userIndex !== -1) {
      this.users[userIndex] = { ...this.users[userIndex], ...updatedData };
      localStorage.setItem('mrHookUsers', JSON.stringify(this.users));
    }

    // Update current user session
    this.currentUser = { ...this.currentUser, ...updatedData };
    localStorage.setItem('mrHookCurrentUser', JSON.stringify(this.currentUser));

    this.loadProfileData();
    this.exitEditMode();
    this.showMessage('Profile updated successfully!', 'success');
  }

  loadOrderHistory() {
    const ordersContainer = document.getElementById('ordersContainer');
    
    // Get user's orders from localStorage
    const allUsers = JSON.parse(localStorage.getItem('mrHookUsers')) || [];
    const currentUserData = allUsers.find(u => u.id === this.currentUser.id);
    const orders = currentUserData?.orders || [];

    if (orders.length === 0) {
      ordersContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-receipt"></i>
          <h3>No Orders Yet</h3>
          <p>You haven't placed any orders yet. Start shopping to see your order history here!</p>
          <a href="index.html" class="btn btn-primary">Start Shopping</a>
        </div>
      `;
      return;
    }

    // Sort orders by date (newest first)
    orders.sort((a, b) => new Date(b.dateOrdered) - new Date(a.dateOrdered));

    ordersContainer.innerHTML = orders.map(order => `
      <div class="order-card">
        <div class="order-header">
          <div class="order-info">
            <h3 class="order-number">Order #${order.id}</h3>
            <p class="order-date">${new Date(order.dateOrdered).toLocaleDateString('en-GB', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>
          <div class="order-total">
            <span class="total-label">Total</span>
            <span class="total-amount">£${order.totalPrice.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="order-items">
          ${order.items.map(item => `
            <div class="order-item">
              <img src="${item.image}" alt="${item.name}" class="item-image">
              <div class="item-details">
                <h4 class="item-name">${item.name}</h4>
                <p class="item-type">${item.type}</p>
              </div>
              <div class="item-quantity">
                <span>Qty: ${item.quantity}</span>
              </div>
              <div class="item-subtotal">
                <span>£${item.subtotal.toFixed(2)}</span>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="order-status">
          <span class="status-badge status-completed">
            <i class="fas fa-check-circle"></i>
            Completed
          </span>
        </div>
      </div>
    `).join('');
  }

  showMessage(text, type = 'info') {
    const container = document.getElementById('messageContainer');
    if (!container) return;

    const message = document.createElement('div');
    message.className = `message message-${type}`;
    message.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${text}</span>
    `;

    container.appendChild(message);

    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 5000);
  }
}

// Initialize profile manager
const profileManager = new ProfileManager();

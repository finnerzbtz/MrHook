
// API Service for backend communication
class ApiService {
  constructor() {
    this.baseURL = window.location.origin;
    this.token = localStorage.getItem('authToken');
  }

  // Helper method to make authenticated requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/api${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Authentication
  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    if (response.token) {
      this.token = response.token;
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
    }

    return response;
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });

    if (response.token) {
      this.token = response.token;
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
    }

    return response;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }

  // Products
  async getProducts(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/products?${queryParams}` : '/products';
    return await this.request(endpoint);
  }

  async getProduct(id) {
    return await this.request(`/products/${id}`);
  }

  // Cart
  async getCart() {
    return await this.request('/cart');
  }

  async addToCart(productId, quantity) {
    return await this.request('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity })
    });
  }

  async updateCartItem(productId, quantity) {
    return await this.request('/cart/update', {
      method: 'PUT',
      body: JSON.stringify({ productId, quantity })
    });
  }

  async removeFromCart(productId) {
    return await this.request(`/cart/remove/${productId}`, {
      method: 'DELETE'
    });
  }

  async clearCart() {
    return await this.request('/cart/clear', {
      method: 'DELETE'
    });
  }

  // Orders
  async createOrder() {
    return await this.request('/orders', {
      method: 'POST'
    });
  }

  async getOrders() {
    return await this.request('/orders');
  }

  // Profile
  async getProfile() {
    return await this.request('/profile');
  }

  async updateProfile(profileData) {
    return await this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }
}

// Create global API instance
window.API = new ApiService();

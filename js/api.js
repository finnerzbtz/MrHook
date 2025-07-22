


// API Service - handles all server communication
class ApiService {
  constructor() {
    this.baseURL = window.location.origin;
    this.token = localStorage.getItem('authToken');
  }

  // Refresh token from localStorage
  refreshToken() {
    this.token = localStorage.getItem('authToken');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/api${endpoint}`;
    
    // Always get fresh token before making requests
    this.refreshToken();
    
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
      console.log(`Making API request: ${endpoint}`, { hasToken: !!this.token });
      const response = await fetch(url, config);
      
      // Handle non-JSON responses (like HTML error pages)
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: 'Server returned non-JSON response' };
      }

      if (!response.ok) {
        console.error('API request failed:', response.status, data);
        throw new Error(data.message || `HTTP ${response.status}: API request failed`);
      }

      console.log(`API request successful: ${endpoint}`, data);
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.token) {
      this.token = response.token;
      localStorage.setItem('authToken', this.token);
    }
    
    return response;
  }

  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (response.token) {
      this.token = response.token;
      localStorage.setItem('authToken', this.token);
    }
    
    return response;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Products
  async getProducts(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return await this.request(`/products${queryString}`);
  }

  async getProduct(id) {
    return await this.request(`/products/${id}`);
  }

  // Cart
  async getCart() {
    return await this.request('/cart');
  }

  async addToCart(productId, quantity = 1) {
    return await this.request('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity })
    });
  }

  async updateCart(productId, quantity) {
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

// Create and expose global API instance
window.API = new ApiService();

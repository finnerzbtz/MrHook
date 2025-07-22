
// Authentication System for Mr Hook
class AuthSystem {
  constructor() {
    this.users = JSON.parse(localStorage.getItem('mrHookUsers')) || [];
    this.currentUser = JSON.parse(localStorage.getItem('mrHookCurrentUser')) || null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkAuthStatus();
  }

  setupEventListeners() {
    // Form switching
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');
    const showPasswordReset = document.getElementById('showPasswordReset');
    const backToLogin = document.getElementById('backToLogin');

    if (showSignup) {
      showSignup.addEventListener('click', () => this.showForm('signup'));
    }
    if (showLogin) {
      showLogin.addEventListener('click', () => this.showForm('login'));
    }
    if (showPasswordReset) {
      showPasswordReset.addEventListener('click', () => this.showForm('passwordReset'));
    }
    if (backToLogin) {
      backToLogin.addEventListener('click', () => this.showForm('login'));
    }

    // Form submissions
    const loginForm = document.getElementById('loginFormElement');
    const signupForm = document.getElementById('signupFormElement');
    const passwordResetForm = document.getElementById('passwordResetFormElement');

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => this.handleSignup(e));
    }
    if (passwordResetForm) {
      passwordResetForm.addEventListener('submit', (e) => this.handlePasswordReset(e));
    }

    // Mobile menu (only on login page)
    if (window.location.pathname.includes('login.html')) {
      const mobileMenuBtn = document.getElementById('mobileMenuBtn');
      const mobileMenu = document.getElementById('mobileMenu');
      
      if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
          mobileMenuBtn.classList.toggle('active');
          mobileMenu.classList.toggle('active');
        });
      }
    }
  }

  showForm(formType) {
    const forms = ['loginForm', 'signupForm', 'passwordResetForm'];
    forms.forEach(form => {
      const element = document.getElementById(form);
      if (element) {
        element.classList.add('hidden');
      }
    });

    const targetForm = document.getElementById(`${formType}Form`);
    if (targetForm) {
      targetForm.classList.remove('hidden');
    }
  }

  handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.toLowerCase().trim();
    const password = document.getElementById('loginPassword').value;

    // Find user
    const user = this.users.find(u => u.email === email);
    
    if (!user) {
      this.showMessage('No account found with this email address.', 'error');
      return;
    }

    if (user.password !== password) {
      this.showMessage('Incorrect password. Please try again.', 'error');
      return;
    }

    // Login successful
    this.currentUser = { ...user };
    delete this.currentUser.password; // Don't store password in session
    localStorage.setItem('mrHookCurrentUser', JSON.stringify(this.currentUser));
    
    this.showMessage('Login successful! Redirecting...', 'success');
    
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  }

  handleSignup(e) {
    e.preventDefault();
    
    const formData = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      email: document.getElementById('email').value.toLowerCase().trim(),
      password: document.getElementById('password').value,
      confirmPassword: document.getElementById('confirmPassword').value,
      address: {
        line1: document.getElementById('addressLine1').value.trim(),
        line2: document.getElementById('addressLine2').value.trim(),
        city: document.getElementById('city').value.trim(),
        postcode: document.getElementById('postcode').value.trim().toUpperCase()
      }
    };

    // Validation
    if (formData.password !== formData.confirmPassword) {
      this.showMessage('Passwords do not match.', 'error');
      return;
    }

    if (formData.password.length < 6) {
      this.showMessage('Password must be at least 6 characters long.', 'error');
      return;
    }

    // Check if email already exists
    if (this.users.find(u => u.email === formData.email)) {
      this.showMessage('An account with this email already exists.', 'error');
      return;
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      address: formData.address,
      createdAt: new Date().toISOString(),
      orders: []
    };

    this.users.push(newUser);
    localStorage.setItem('mrHookUsers', JSON.stringify(this.users));

    // Auto login
    this.currentUser = { ...newUser };
    delete this.currentUser.password;
    localStorage.setItem('mrHookCurrentUser', JSON.stringify(this.currentUser));

    this.showMessage('Account created successfully! Redirecting...', 'success');
    
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  }

  handlePasswordReset(e) {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value.toLowerCase().trim();
    const user = this.users.find(u => u.email === email);
    
    if (!user) {
      this.showMessage('No account found with this email address.', 'error');
      return;
    }

    // Simulate password reset email
    this.showMessage('Password reset instructions have been sent to your email.', 'success');
    
    setTimeout(() => {
      this.showForm('login');
    }, 2000);
  }

  checkAuthStatus() {
    // If already logged in, redirect to products
    if (this.currentUser && window.location.pathname.includes('login.html')) {
      window.location.href = 'index.html';
    }
  }

  static logout() {
    localStorage.removeItem('mrHookCurrentUser');
    window.location.href = 'login.html';
  }

  static getCurrentUser() {
    return JSON.parse(localStorage.getItem('mrHookCurrentUser')) || null;
  }

  static isLoggedIn() {
    return !!AuthSystem.getCurrentUser();
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

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 5000);
  }
}

// Initialize auth system only
document.addEventListener('DOMContentLoaded', () => {
  const auth = new AuthSystem();
});

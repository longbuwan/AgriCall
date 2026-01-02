// utils.js - Utility functions for AgriCall

// ========================================
// AUTHENTICATION
// ========================================

const Auth = {
  // Get current user from localStorage
  getCurrentUser() {
    const userData = localStorage.getItem('agricall_user');
    return userData ? JSON.parse(userData) : null;
  },
  
  // Set current user in localStorage
  setCurrentUser(user) {
    localStorage.setItem('agricall_user', JSON.stringify(user));
  },
  
  // Clear current user (logout)
  logout() {
    localStorage.removeItem('agricall_user');
  },
  
  // Check if user is logged in
  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },
  
  // Get user type
  getUserType() {
    const user = this.getCurrentUser();
    return user ? user.type : null;
  },
  
  // Check if user has specific type
  isUserType(type) {
    return this.getUserType() === type;
  }
};

// ========================================
// TOAST NOTIFICATIONS
// ========================================

const Toast = {
  container: null,
  
  // Initialize toast container
  init() {
    if (!this.container) {
      this.container = document.getElementById('toast');
      
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toast';
        this.container.className = 'toast';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);
      }
    }
  },
  
  // Show toast
  show(message, type = 'info', duration = 3000) {
    this.init();
    
    this.container.textContent = message;
    this.container.className = `toast ${type}`;
    this.container.style.display = 'block';
    
    // Auto hide
    setTimeout(() => {
      this.hide();
    }, duration);
  },
  
  // Hide toast
  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  },
  
  // Convenience methods
  success(message, duration = 3000) {
    this.show(message, 'success', duration);
  },
  
  error(message, duration = 4000) {
    this.show(message, 'error', duration);
  },
  
  warning(message, duration = 3500) {
    this.show(message, 'warning', duration);
  },
  
  info(message, duration = 3000) {
    this.show(message, 'info', duration);
  }
};

// ========================================
// LOADING OVERLAY
// ========================================

const Loading = {
  overlay: null,
  
  // Initialize loading overlay
  init() {
    if (!this.overlay) {
      this.overlay = document.getElementById('loadingOverlay');
      
      if (!this.overlay) {
        this.overlay = document.createElement('div');
        this.overlay.id = 'loadingOverlay';
        this.overlay.className = 'loading-overlay';
        this.overlay.innerHTML = '<div class="spinner"></div>';
        this.overlay.style.display = 'none';
        document.body.appendChild(this.overlay);
      }
    }
  },
  
  // Show loading overlay
  show() {
    this.init();
    this.overlay.style.display = 'flex';
  },
  
  // Hide loading overlay
  hide() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }
};

// ========================================
// MODAL
// ========================================

const Modal = {
  // Open modal by ID
  open(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },
  
  // Close modal by ID
  close(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },
  
  // Close all modals
  closeAll() {
    document.querySelectorAll('.modal.active').forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
};

// ========================================
// VALIDATION
// ========================================

// Validate Thai phone number
function isValidPhone(phone) {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Thai phone numbers: 10 digits starting with 0, or 9 digits without leading 0
  return /^0[0-9]{9}$/.test(cleaned) || /^[0-9]{9}$/.test(cleaned);
}

// Validate email
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ========================================
// FORMATTING
// ========================================

// Format phone number for display
function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 9) {
    return `0${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
  }
  return phone;
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format date and time
function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format currency (Thai Baht)
function formatCurrency(amount) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Format number with commas
function formatNumber(num) {
  return new Intl.NumberFormat('th-TH').format(num);
}

// ========================================
// STATUS HELPERS
// ========================================

// Get status badge class
function getStatusBadgeClass(status) {
  const statusClasses = {
    'pending': 'badge-pending',
    'farmer_accepted': 'badge-farmer-accepted',
    'accepted': 'badge-accepted',
    'baler_assigned': 'badge-accepted',
    'in_progress': 'badge-progress',
    'delivered': 'badge-delivered',
    'completed': 'badge-delivered',
    'cancelled': 'badge-cancelled'
  };
  return statusClasses[status] || 'badge-pending';
}

// Get status text (Thai/English)
function getStatusText(status) {
  const statusTexts = {
    'pending': 'รอดำเนินการ / Pending',
    'farmer_accepted': 'เกษตรกรรับงาน / Farmer Accepted',
    'accepted': 'รับงานแล้ว / Accepted',
    'baler_assigned': 'มอบหมายแล้ว / Baler Assigned',
    'in_progress': 'กำลังดำเนินการ / In Progress',
    'delivered': 'ส่งแล้ว / Delivered',
    'completed': 'สำเร็จ / Completed',
    'cancelled': 'ยกเลิก / Cancelled'
  };
  return statusTexts[status] || status;
}

// Get bale type text
function getBaleTypeText(type) {
  const types = {
    'rice_straw': 'ฟางข้าว / Rice Straw',
    'corn_stover': 'ตอซังข้าวโพด / Corn Stover',
    'sugarcane_leaves': 'ใบอ้อย / Sugarcane Leaves',
    'mixed': 'ผสม / Mixed'
  };
  return types[type] || type;
}

// ========================================
// STAR RATING
// ========================================

// Generate star rating HTML
function generateStarRating(rating, maxStars = 5) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);
  
  let html = '';
  
  for (let i = 0; i < fullStars; i++) {
    html += '⭐';
  }
  
  if (hasHalfStar) {
    html += '✨';
  }
  
  for (let i = 0; i < emptyStars; i++) {
    html += '☆';
  }
  
  return html;
}

// ========================================
// URL PARAMS
// ========================================

// Get URL parameter
function getUrlParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// ========================================
// LOCAL STORAGE
// ========================================

// Set item in localStorage with JSON
function setStorageItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Get item from localStorage with JSON parsing
function getStorageItem(key, defaultValue = null) {
  const item = localStorage.getItem(key);
  if (item) {
    try {
      return JSON.parse(item);
    } catch (e) {
      return item;
    }
  }
  return defaultValue;
}

// Remove item from localStorage
function removeStorageItem(key) {
  localStorage.removeItem(key);
}

// ========================================
// DEBOUNCE / THROTTLE
// ========================================

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ========================================
// EXPORTS
// ========================================

window.Auth = Auth;
window.Toast = Toast;
window.Loading = Loading;
window.Modal = Modal;
window.isValidPhone = isValidPhone;
window.isValidEmail = isValidEmail;
window.formatPhone = formatPhone;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.formatCurrency = formatCurrency;
window.formatNumber = formatNumber;
window.getStatusBadgeClass = getStatusBadgeClass;
window.getStatusText = getStatusText;
window.getBaleTypeText = getBaleTypeText;
window.generateStarRating = generateStarRating;
window.getUrlParam = getUrlParam;
window.setStorageItem = setStorageItem;
window.getStorageItem = getStorageItem;
window.removeStorageItem = removeStorageItem;
window.debounce = debounce;
window.throttle = throttle;

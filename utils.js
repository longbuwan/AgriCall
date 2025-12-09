// utils-python.js - Utility functions for Python Backend

// Configuration for Python Backend
const CONFIG = {
  // Python Flask backend URLs (running on localhost:5000)
  PYTHON_BACKEND: 'https://agricall.onrender.com',
  
  // API Endpoints
  API_ENDPOINTS: {
    AUTH: '/auth',
    REGISTER: '/register',
    CREATE_ORDER: '/create_order',
    ACCEPT_ORDER: '/accept_order',
    ASSIGN_BALER: '/assign_baler',
    UPDATE_STATUS: '/update_status',
    GET_ORDERS: '/get_orders',
    GET_USERS: '/get_users',
  }
};

// Toast Notification System
class Toast {
  static show(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 1.5rem;">
          ${type === 'success' ? '✓' : type === 'error' ? '✗' : '⚠'}
        </span>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  
  static success(message) {
    this.show(message, 'success');
  }
  
  static error(message) {
    this.show(message, 'error', 4000);
  }
  
  static warning(message) {
    this.show(message, 'warning');
  }
}

// Loading Overlay
class Loading {
  static show() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
  }
  
  static hide() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.remove();
    }
  }
}

// Authentication Helper
class Auth {
  static getCurrentUser() {
    const userId = localStorage.getItem('user_id');
    const userType = localStorage.getItem('user_type');
    const userName = localStorage.getItem('user_name');
    
    if (!userId || !userType || !userName) {
      return null;
    }
    
    return {
      id: userId,
      type: userType,
      name: userName
    };
  }
  
  static setCurrentUser(user) {
    localStorage.setItem('user_id', user.id);
    localStorage.setItem('user_type', user.type);
    localStorage.setItem('user_name', user.name);
  }
  
  static clearCurrentUser() {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_type');
    localStorage.removeItem('user_name');
  }
  
  static logout() {
    this.clearCurrentUser();
    window.location.href = 'index.html';
  }
  
  static requireAuth(allowedTypes = []) {
    const user = this.getCurrentUser();
    
    if (!user) {
      window.location.href = 'index.html';
      return null;
    }
    
    if (allowedTypes.length > 0 && !allowedTypes.includes(user.type)) {
      Toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ / You do not have permission to access this page');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
      return null;
    }
    
    return user;
  }
}

// Modal Helper
class Modal {
  static open(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
  
  static close(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  }
  
  static closeAll() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto';
  }
}

// Date Formatter
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Date to Thai format
function formatDateShort(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit'
  });
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Status translation
function getStatusText(status) {
  const statusMap = {
    'pending': 'รอดำเนินการ',
    'farmer_accepted': 'เกษตรกรรับงาน',
    'baler_assigned': 'มอบหมายคนอัดฟาง',
    'in_progress': 'กำลังดำเนินการ',
    'delivered': 'ส่งมอบแล้ว',
    'cancelled': 'ยกเลิก'
  };
  return statusMap[status] || status;
}

// Get status badge HTML
function getStatusBadge(status) {
  const statusClass = status.replace('_', '-');
  return `<span class="badge badge-${statusClass}">${getStatusText(status)}</span>`;
}

// Format phone number
function formatPhone(phone) {
  if (!phone) return '-';
  // Format as XXX-XXX-XXXX
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
}

// Validate email
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Validate Thai phone number
function isValidPhone(phone) {
  const re = /^[0-9]{10}$/;
  return re.test(phone.replace(/[^0-9]/g, ''));
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

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

// Initialize common event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Close modal when clicking outside
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      Modal.closeAll();
    }
  });
  
  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      Modal.closeAll();
    }
  });
});

// Export for use in other files
window.Toast = Toast;
window.Loading = Loading;
window.Auth = Auth;
window.Modal = Modal;
window.CONFIG = CONFIG;
window.formatDate = formatDate;
window.formatDateShort = formatDateShort;
window.generateId = generateId;
window.getStatusText = getStatusText;
window.getStatusBadge = getStatusBadge;
window.formatPhone = formatPhone;
window.isValidEmail = isValidEmail;
window.isValidPhone = isValidPhone;
window.escapeHtml = escapeHtml;
window.debounce = debounce;

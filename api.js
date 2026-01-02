// api.js - API handler with phone auth support and demo mode

// Configuration
const CONFIG = {
  PYTHON_BACKEND: 'https://agricall.onrender.com',
  DEMO_MODE: true, // Set to false when backend is running
  API_ENDPOINTS: {
    AUTH: '/auth',
    AUTH_PHONE: '/auth/phone',
    REGISTER: '/register',
    CREATE_ORDER: '/create_order',
    GET_ORDERS: '/get_orders',
    ACCEPT_ORDER: '/accept_order',
    ASSIGN_BALER: '/assign_baler',
    UPDATE_STATUS: '/update_status',
    GET_USERS: '/get_users',
    SUBMIT_RATING: '/submit_rating',
    GET_RATINGS: '/get_ratings',
    GET_USER_RATINGS: '/get_user_ratings',
    GET_ORDER_RATINGS: '/get_order_ratings'
  }
};

// Demo data for offline testing
const DEMO_USERS = {
  '0812345678': { id: 'demo_customer_1', type: 'customer', name: 'สมชาย ใจดี', phone: '0812345678', email: 'customer@test.com', address: '123 หมู่ 1 ต.สารภี', avg_rating: 4.5, total_ratings: 10 },
  '0823456789': { id: 'demo_farmer_1', type: 'farmer', name: 'สมหญิง เกษตรกร', phone: '0823456789', email: 'farmer@test.com', address: '456 หมู่ 2 ต.สารภี', avg_rating: 4.8, total_ratings: 25 },
  '0834567890': { id: 'demo_baler_1', type: 'baler', name: 'สมศักดิ์ อัดฟาง', phone: '0834567890', email: 'baler@test.com', address: '789 หมู่ 3 ต.สารภี', avg_rating: 4.2, total_ratings: 15 }
};

class API {
  // Call Python backend endpoint
  static async callBackend(endpoint, data) {
    // If demo mode, use fake responses
    if (CONFIG.DEMO_MODE) {
      console.log('📱 Demo mode - simulating:', endpoint, data);
      return this.handleDemoRequest(endpoint, data);
    }
    
    const url = `${CONFIG.PYTHON_BACKEND}${endpoint}`;
    console.log('📡 Calling backend:', url, data);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Backend response:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Backend error:', error);
      
      // Fallback to demo mode on connection error
      if (error.message.includes('Failed to fetch')) {
        console.log('🔄 Falling back to demo mode...');
        CONFIG.DEMO_MODE = true;
        return this.handleDemoRequest(endpoint, data);
      }
      
      throw error;
    }
  }
  
  // Handle demo requests without backend
  static handleDemoRequest(endpoint, data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        switch(endpoint) {
          case '/auth/phone':
            const phone = data.phone;
            const userType = data.user_type;
            const demoUser = DEMO_USERS[phone];
            
            if (demoUser && demoUser.type === userType) {
              resolve({ success: true, user: demoUser });
            } else if (demoUser) {
              resolve({ success: false, error: 'ประเภทผู้ใช้ไม่ตรงกัน / User type mismatch' });
            } else {
              // Create new user for demo
              const newUser = {
                id: `demo_${userType}_${Date.now()}`,
                type: userType,
                name: `User ${phone.slice(-4)}`,
                phone: phone,
                email: '',
                address: '',
                avg_rating: 0,
                total_ratings: 0
              };
              resolve({ success: true, user: newUser });
            }
            break;
            
          case '/auth':
            resolve({ success: false, error: 'กรุณาใช้การเข้าสู่ระบบด้วยเบอร์โทร / Please use phone login' });
            break;
            
          case '/get_orders':
            resolve({ success: true, orders: [] });
            break;
            
          case '/get_users':
            const users = Object.values(DEMO_USERS).filter(u => !data.user_type || u.type === data.user_type);
            resolve({ success: true, users: users });
            break;
            
          default:
            resolve({ success: true, message: 'Demo mode' });
        }
      }, 300);
    });
  }
  
  // Phone number login (after OTP verification)
  static async loginWithPhone(phone, userType) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.AUTH_PHONE, {
        phone: phone,
        user_type: userType
      });
      return result;
    } catch (error) {
      console.error('Phone login error:', error);
      return { success: false, error: 'เกิดข้อผิดพลาด / An error occurred' };
    }
  }
  
  // Legacy email/password login
  static async login(email, password, userType) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.AUTH, {
        email: email,
        password: password,
        user_type: userType
      });
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'เกิดข้อผิดพลาด / An error occurred' };
    }
  }
  
  // Register new user
  static async register(userData) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.REGISTER, { user: userData });
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'เกิดข้อผิดพลาด / An error occurred' };
    }
  }
  
  static async createOrder(orderData) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.CREATE_ORDER, { order: orderData });
      return result;
    } catch (error) {
      console.error('Create order error:', error);
      return { success: false, error: 'ไม่สามารถสร้างออเดอร์ได้ / Cannot create order' };
    }
  }
  
  static async getOrders(filters = {}) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.GET_ORDERS, filters);
      return result;
    } catch (error) {
      console.error('Get orders error:', error);
      return { success: false, error: 'ไม่สามารถดึงข้อมูลออเดอร์ได้ / Cannot fetch orders' };
    }
  }
  
  static async getUsers(userType) {
    try {
      const data = userType ? { user_type: userType } : {};
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.GET_USERS, data);
      return result;
    } catch (error) {
      console.error('Get users error:', error);
      return { success: false, error: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้ / Cannot fetch users' };
    }
  }
}

// Export API
window.API = API;
window.CONFIG = CONFIG;

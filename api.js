// api.js - API handler for AgriCall (Server Mode)

// Configuration - UPDATE THE PYTHON_BACKEND URL TO YOUR RENDER SERVER
const CONFIG = {
  // ⚠️ CHANGE THIS TO YOUR RENDER BACKEND URL ⚠️
  PYTHON_BACKEND: 'https://agricall.onrender.com',
  
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

class API {
  // Call Python backend endpoint
  static async callBackend(endpoint, data) {
    const url = `${CONFIG.PYTHON_BACKEND}${endpoint}`;
    console.log('📡 Calling backend:', url, data);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
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
      
      if (error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ / Cannot connect to server'
        };
      }
      
      return {
        success: false,
        error: 'เกิดข้อผิดพลาด / An error occurred'
      };
    }
  }
  
  // ========================================
  // AUTHENTICATION
  // ========================================
  
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
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.REGISTER, {
        user: userData
      });
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'เกิดข้อผิดพลาด / An error occurred' };
    }
  }
  
  // ========================================
  // ORDERS
  // ========================================
  
  // Create new order
  static async createOrder(orderData) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.CREATE_ORDER, {
        order: orderData
      });
      return result;
    } catch (error) {
      console.error('Create order error:', error);
      return { success: false, error: 'ไม่สามารถสร้างออเดอร์ได้ / Cannot create order' };
    }
  }
  
  // Get orders with filters
  static async getOrders(filters = {}) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.GET_ORDERS, filters);
      return result;
    } catch (error) {
      console.error('Get orders error:', error);
      return { success: false, error: 'ไม่สามารถดึงข้อมูลออเดอร์ได้ / Cannot fetch orders' };
    }
  }
  
  // Get single order by ID
  static async getOrderById(orderId) {
    try {
      const result = await this.getOrders({});
      
      if (result.success) {
        const order = result.orders.find(o => o.order_id === orderId);
        
        if (order) {
          return { success: true, order: order };
        } else {
          return { success: false, error: 'ไม่พบออเดอร์ / Order not found' };
        }
      }
      
      return result;
    } catch (error) {
      console.error('Get order error:', error);
      return { success: false, error: 'ไม่สามารถดึงข้อมูลออเดอร์ได้ / Cannot fetch order' };
    }
  }
  
  // Farmer accepts order with field location
  static async acceptOrder(orderId, farmerId, fieldAddress = null, fieldLat = null, fieldLng = null) {
    try {
      const requestData = {
        order_id: orderId,
        farmer_id: farmerId
      };
      
      // Add field location if provided
      if (fieldAddress && fieldLat && fieldLng) {
        requestData.field_address = fieldAddress;
        requestData.field_lat = fieldLat;
        requestData.field_lng = fieldLng;
      }
      
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.ACCEPT_ORDER, requestData);
      
      // Fallback for old backend that doesn't support field location
      if (!result.success && fieldAddress) {
        console.log('Trying without field location...');
        const basicResult = await this.callBackend(CONFIG.API_ENDPOINTS.ACCEPT_ORDER, {
          order_id: orderId,
          farmer_id: farmerId
        });
        return basicResult;
      }
      
      return result;
    } catch (error) {
      console.error('Accept order error:', error);
      return { success: false, error: 'ไม่สามารถรับงานได้ / Cannot accept order' };
    }
  }
  
  // Assign baler to order
  static async assignBaler(orderId, balerId) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.ASSIGN_BALER, {
        order_id: orderId,
        baler_id: balerId
      });
      return result;
    } catch (error) {
      console.error('Assign baler error:', error);
      return { success: false, error: 'ไม่สามารถมอบหมายคนอัดฟางได้ / Cannot assign baler' };
    }
  }
  
  // Update order status
  static async updateOrderStatus(orderId, newStatus) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.UPDATE_STATUS, {
        order_id: orderId,
        new_status: newStatus
      });
      return result;
    } catch (error) {
      console.error('Update status error:', error);
      return { success: false, error: 'ไม่สามารถอัพเดทสถานะได้ / Cannot update status' };
    }
  }
  
  // Cancel order
  static async cancelOrder(orderId) {
    return this.updateOrderStatus(orderId, 'cancelled');
  }
  
  // ========================================
  // USERS
  // ========================================
  
  // Get users by type
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
  
  // ========================================
  // RATINGS
  // ========================================
  
  // Submit rating
  static async submitRating(ratingData) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.SUBMIT_RATING, {
        rating: ratingData
      });
      return result;
    } catch (error) {
      console.error('Submit rating error:', error);
      return { success: false, error: 'ไม่สามารถบันทึกคะแนนได้ / Cannot submit rating' };
    }
  }
  
  // Get ratings
  static async getRatings(filters = {}) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.GET_RATINGS, filters);
      return result;
    } catch (error) {
      console.error('Get ratings error:', error);
      return { success: false, error: 'ไม่สามารถดึงข้อมูลคะแนนได้ / Cannot fetch ratings' };
    }
  }
  
  // Get user ratings summary
  static async getUserRatings(userId) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.GET_USER_RATINGS, {
        user_id: userId
      });
      return result;
    } catch (error) {
      console.error('Get user ratings error:', error);
      return { success: false, error: 'ไม่สามารถดึงข้อมูลคะแนนได้ / Cannot fetch user ratings' };
    }
  }
  
  // Get order ratings
  static async getOrderRatings(orderId) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.GET_ORDER_RATINGS, {
        order_id: orderId
      });
      return result;
    } catch (error) {
      console.error('Get order ratings error:', error);
      return { success: false, error: 'ไม่สามารถดึงข้อมูลคะแนนได้ / Cannot fetch order ratings' };
    }
  }
}

// Export API
window.API = API;
window.CONFIG = CONFIG;

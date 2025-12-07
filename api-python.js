// api-python.js - API handler for Python Flask Backend

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
      
      // Check if it's a connection error
      if (error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ / Cannot connect to server. Make sure backend.py is running!'
        };
      }
      
      throw error;
    }
  }
  
  // Authentication
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
      return {
        success: false,
        error: 'เกิดข้อผิดพลาด / An error occurred'
      };
    }
  }
  
  static async register(userData) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.REGISTER, {
        user: userData
      });
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาด / An error occurred'
      };
    }
  }
  
  // Orders
  static async createOrder(orderData) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.CREATE_ORDER, {
        order: orderData
      });
      return result;
    } catch (error) {
      console.error('Create order error:', error);
      return {
        success: false,
        error: 'ไม่สามารถสร้างออเดอร์ได้ / Cannot create order'
      };
    }
  }
  
  static async getOrders(filters = {}) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.GET_ORDERS, filters);
      return result;
    } catch (error) {
      console.error('Get orders error:', error);
      return {
        success: false,
        error: 'ไม่สามารถดึงข้อมูลออเดอร์ได้ / Cannot fetch orders'
      };
    }
  }
  
  static async getOrderById(orderId) {
    try {
      const result = await this.getOrders({});
      
      if (result.success) {
        const order = result.orders.find(o => o.order_id === orderId);
        
        if (order) {
          return {
            success: true,
            order: order
          };
        } else {
          return {
            success: false,
            error: 'ไม่พบออเดอร์ / Order not found'
          };
        }
      }
      
      return result;
    } catch (error) {
      console.error('Get order error:', error);
      return {
        success: false,
        error: 'ไม่สามารถดึงข้อมูลออเดอร์ได้ / Cannot fetch order'
      };
    }
  }
  
  static async acceptOrder(orderId, farmerId) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.ACCEPT_ORDER, {
        order_id: orderId,
        farmer_id: farmerId
      });
      return result;
    } catch (error) {
      console.error('Accept order error:', error);
      return {
        success: false,
        error: 'ไม่สามารถรับงานได้ / Cannot accept order'
      };
    }
  }
  
  static async assignBaler(orderId, balerId) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.ASSIGN_BALER, {
        order_id: orderId,
        baler_id: balerId
      });
      return result;
    } catch (error) {
      console.error('Assign baler error:', error);
      return {
        success: false,
        error: 'ไม่สามารถมอบหมายคนอัดฟางได้ / Cannot assign baler'
      };
    }
  }
  
  static async updateOrderStatus(orderId, newStatus) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.UPDATE_STATUS, {
        order_id: orderId,
        new_status: newStatus
      });
      return result;
    } catch (error) {
      console.error('Update status error:', error);
      return {
        success: false,
        error: 'ไม่สามารถอัพเดทสถานะได้ / Cannot update status'
      };
    }
  }
  
  static async cancelOrder(orderId) {
    return this.updateOrderStatus(orderId, 'cancelled');
  }
  
  // Get users (for farmer to see available balers)
  static async getUsers(userType) {
    try {
      const data = userType ? { user_type: userType } : {};
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.GET_USERS, data);
      return result;
    } catch (error) {
      console.error('Get users error:', error);
      return {
        success: false,
        error: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้ / Cannot fetch users'
      };
    }
  }
}

// Export API
window.API = API;

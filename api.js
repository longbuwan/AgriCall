// api.js - API handler with phone auth support and demo mode

// Configuration
const CONFIG = {
  // Change this to your Render backend URL
  PYTHON_BACKEND: 'https://agricall.onrender.com', // <-- UPDATE THIS
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
    GET_USERS: '/get_users'
  }
};

// Demo data storage (in-memory for testing)
let DEMO_ORDERS = JSON.parse(localStorage.getItem('demo_orders') || '[]');

const DEMO_USERS = {
  '0812345678': { id: 'demo_customer_1', type: 'customer', name: 'สมชาย ใจดี', phone: '0812345678', email: 'customer@test.com', address: '123 หมู่ 1 ต.สารภี', avg_rating: 4.5, total_ratings: 10 },
  '0823456789': { id: 'demo_farmer_1', type: 'farmer', name: 'สมหญิง เกษตรกร', phone: '0823456789', email: 'farmer@test.com', address: '456 หมู่ 2 ต.สารภี', avg_rating: 4.8, total_ratings: 25 },
  '0834567890': { id: 'demo_baler_1', type: 'baler', name: 'สมศักดิ์ อัดฟาง', phone: '0834567890', email: 'baler@test.com', address: '789 หมู่ 3 ต.สารภี', avg_rating: 4.2, total_ratings: 15 }
};

// Save demo orders to localStorage
function saveDemoOrders() {
  localStorage.setItem('demo_orders', JSON.stringify(DEMO_ORDERS));
}

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
      
      // Fallback to demo mode on connection error
      console.log('🔄 Falling back to demo mode...');
      CONFIG.DEMO_MODE = true;
      return this.handleDemoRequest(endpoint, data);
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
              DEMO_USERS[phone] = newUser;
              resolve({ success: true, user: newUser });
            }
            break;
            
          case '/auth':
            resolve({ success: false, error: 'กรุณาใช้การเข้าสู่ระบบด้วยเบอร์โทร / Please use phone login' });
            break;
            
          case '/create_order':
            const orderData = data.order;
            const newOrder = {
              order_id: `order_${Date.now()}`,
              customer_id: orderData.customer_id,
              farmer_id: null,
              baler_id: null,
              bale_type: orderData.bale_type,
              quantity: orderData.quantity,
              delivery_address: orderData.delivery_address,
              delivery_lat: orderData.delivery_lat,
              delivery_lng: orderData.delivery_lng,
              pickup_date: orderData.pickup_date,
              status: 'pending',
              created_at: new Date().toISOString(),
              notes: orderData.notes || '',
              customer_name: 'Demo Customer',
              farmer_name: '-',
              baler_name: '-'
            };
            
            DEMO_ORDERS.push(newOrder);
            saveDemoOrders();
            
            console.log('📦 Created demo order:', newOrder);
            resolve({ success: true, order: newOrder });
            break;
            
          case '/get_orders':
            let filteredOrders = [...DEMO_ORDERS];
            
            if (data.customer_id) {
              filteredOrders = filteredOrders.filter(o => o.customer_id === data.customer_id);
            }
            if (data.farmer_id) {
              filteredOrders = filteredOrders.filter(o => o.farmer_id === data.farmer_id);
            }
            if (data.status) {
              filteredOrders = filteredOrders.filter(o => o.status === data.status);
            }
            
            // Sort by created_at desc
            filteredOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            resolve({ success: true, orders: filteredOrders });
            break;
            
          case '/update_status':
            const orderIndex = DEMO_ORDERS.findIndex(o => o.order_id === data.order_id);
            if (orderIndex !== -1) {
              DEMO_ORDERS[orderIndex].status = data.new_status;
              if (data.new_status === 'delivered') {
                DEMO_ORDERS[orderIndex].delivered_at = new Date().toISOString();
              }
              saveDemoOrders();
              resolve({ success: true, order: DEMO_ORDERS[orderIndex] });
            } else {
              resolve({ success: false, error: 'Order not found' });
            }
            break;
            
          case '/accept_order':
            const acceptIndex = DEMO_ORDERS.findIndex(o => o.order_id === data.order_id);
            if (acceptIndex !== -1) {
              DEMO_ORDERS[acceptIndex].farmer_id = data.farmer_id;
              DEMO_ORDERS[acceptIndex].status = 'farmer_accepted';
              DEMO_ORDERS[acceptIndex].farmer_name = 'Demo Farmer';
              if (data.field_address) {
                DEMO_ORDERS[acceptIndex].field_address = data.field_address;
                DEMO_ORDERS[acceptIndex].field_lat = data.field_lat;
                DEMO_ORDERS[acceptIndex].field_lng = data.field_lng;
              }
              saveDemoOrders();
              resolve({ success: true, order: DEMO_ORDERS[acceptIndex] });
            } else {
              resolve({ success: false, error: 'Order not found' });
            }
            break;
            
          case '/assign_baler':
            const assignIndex = DEMO_ORDERS.findIndex(o => o.order_id === data.order_id);
            if (assignIndex !== -1) {
              DEMO_ORDERS[assignIndex].baler_id = data.baler_id;
              DEMO_ORDERS[assignIndex].status = 'baler_assigned';
              DEMO_ORDERS[assignIndex].baler_name = 'Demo Baler';
              saveDemoOrders();
              resolve({ success: true, order: DEMO_ORDERS[assignIndex] });
            } else {
              resolve({ success: false, error: 'Order not found' });
            }
            break;
            
          case '/get_users':
            const users = Object.values(DEMO_USERS).filter(u => !data.user_type || u.type === data.user_type);
            resolve({ success: true, users: users });
            break;
            
          default:
            resolve({ success: true, message: 'Demo mode - endpoint not implemented' });
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
  
  // Create order
  static async createOrder(orderData) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.CREATE_ORDER, { order: orderData });
      return result;
    } catch (error) {
      console.error('Create order error:', error);
      return { success: false, error: 'ไม่สามารถสร้างออเดอร์ได้ / Cannot create order' };
    }
  }
  
  // Get orders
  static async getOrders(filters = {}) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.GET_ORDERS, filters);
      return result;
    } catch (error) {
      console.error('Get orders error:', error);
      return { success: false, error: 'ไม่สามารถดึงข้อมูลออเดอร์ได้ / Cannot fetch orders' };
    }
  }
  
  // Get users
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
  
  // Accept order (farmer)
  static async acceptOrder(orderId, farmerId, fieldAddress, fieldLat, fieldLng) {
    try {
      const requestData = { order_id: orderId, farmer_id: farmerId };
      if (fieldAddress) {
        requestData.field_address = fieldAddress;
        requestData.field_lat = fieldLat;
        requestData.field_lng = fieldLng;
      }
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.ACCEPT_ORDER, requestData);
      return result;
    } catch (error) {
      console.error('Accept order error:', error);
      return { success: false, error: 'ไม่สามารถรับงานได้ / Cannot accept order' };
    }
  }
  
  // Assign baler
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
}

// Export API
window.API = API;
window.CONFIG = CONFIG;

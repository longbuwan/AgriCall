// api.js - Handle all API calls to Make.com webhooks and Google Sheets

// ⚙️ CONFIGURATION - CHANGE THIS TO SWITCH MODES
const USE_WEBHOOKS = false; // Set to true to use Make.com webhooks, false for localStorage

class API {
  // Call Make.com webhook
  static async callWebhook(endpoint, data) {
    console.log('📡 Calling webhook:', endpoint, data);
    
    try {
      const response = await fetch(endpoint, {
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
      console.log('✅ Webhook response:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Webhook error:', error);
      throw error;
    }
  }
  
  // Authentication
  static async login(email, password, userType) {
    try {
      // 🌐 PRODUCTION MODE: Use Make.com webhooks
      if (USE_WEBHOOKS) {
        const result = await this.callWebhook(CONFIG.MAKE_WEBHOOKS.AUTH, {
          action: 'login',
          email: email,
          password: password,
          user_type: userType
        });
        return result;
      }
      
      // 💾 PROTOTYPE MODE: Use localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Find user
      const user = users.find(u => 
        u.email === email && 
        u.password === password && 
        u.user_type === userType
      );
      
      if (user) {
        return {
          success: true,
          user: {
            id: user.user_id,
            type: user.user_type,
            name: user.full_name,
            email: user.email,
            phone: user.phone,
            address: user.address
          }
        };
      }
      
      return {
        success: false,
        error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง / Invalid email or password'
      };
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
      // 🌐 PRODUCTION MODE: Use Make.com webhooks
      if (USE_WEBHOOKS) {
        const result = await this.callWebhook(CONFIG.MAKE_WEBHOOKS.REGISTER, {
          action: 'register',
          user: userData
        });
        return result;
      }
      
      // 💾 PROTOTYPE MODE: Use localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Check if email already exists
      if (users.some(u => u.email === userData.email)) {
        return {
          success: false,
          error: 'อีเมลนี้ถูกใช้งานแล้ว / This email is already registered'
        };
      }
      
      // Create new user
      const newUser = {
        user_id: generateId(),
        email: userData.email,
        password: userData.password,
        user_type: userData.user_type,
        full_name: userData.full_name,
        phone: userData.phone,
        address: userData.address,
        created_at: new Date().toISOString(),
        status: 'active'
      };
      
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      return {
        success: true,
        user: {
          id: newUser.user_id,
          type: newUser.user_type,
          name: newUser.full_name
        }
      };
      
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาด / An error occurred'
      };
    }
  }
      return {
        success: false,
        error: 'เกิดข้อผิดพลาด / An error occurred'
      };
    }
  }
  
  // Orders
  static async createOrder(orderData) {
    try {
      // 🌐 PRODUCTION MODE: Use Make.com webhooks
      if (USE_WEBHOOKS) {
        const result = await this.callWebhook(CONFIG.MAKE_WEBHOOKS.CREATE_ORDER, {
          action: 'create_order',
          order: orderData
        });
        return result;
      }
      
      // 💾 PROTOTYPE MODE: Use localStorage
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      
      const newOrder = {
        order_id: generateId(),
        customer_id: orderData.customer_id,
        farmer_id: null,
        baler_id: null,
        bale_type: orderData.bale_type,
        quantity: orderData.quantity,
        delivery_address: orderData.delivery_address,
        pickup_date: orderData.pickup_date,
        status: 'pending',
        created_at: new Date().toISOString(),
        price: null,
        notes: orderData.notes || ''
      };
      
      orders.push(newOrder);
      localStorage.setItem('orders', JSON.stringify(orders));
      
      return {
        success: true,
        order: newOrder
      };
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
      let orders = JSON.parse(localStorage.getItem('orders') || '[]');
      
      // Apply filters
      if (filters.customer_id) {
        orders = orders.filter(o => o.customer_id === filters.customer_id);
      }
      
      if (filters.farmer_id) {
        orders = orders.filter(o => o.farmer_id === filters.farmer_id);
      }
      
      if (filters.baler_id) {
        orders = orders.filter(o => o.baler_id === filters.baler_id);
      }
      
      if (filters.status) {
        orders = orders.filter(o => o.status === filters.status);
      }
      
      // Sort by created_at descending
      orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // Get customer, farmer, and baler info for each order
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      orders = orders.map(order => {
        const customer = users.find(u => u.user_id === order.customer_id);
        const farmer = users.find(u => u.user_id === order.farmer_id);
        const baler = users.find(u => u.user_id === order.baler_id);
        
        return {
          ...order,
          customer_name: customer?.full_name || 'N/A',
          customer_phone: customer?.phone || 'N/A',
          farmer_name: farmer?.full_name || '-',
          farmer_phone: farmer?.phone || '-',
          baler_name: baler?.full_name || '-',
          baler_phone: baler?.phone || '-'
        };
      });
      
      return {
        success: true,
        orders: orders
      };
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
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      const order = orders.find(o => o.order_id === orderId);
      
      if (!order) {
        return {
          success: false,
          error: 'ไม่พบออเดอร์ / Order not found'
        };
      }
      
      const customer = users.find(u => u.user_id === order.customer_id);
      const farmer = users.find(u => u.user_id === order.farmer_id);
      const baler = users.find(u => u.user_id === order.baler_id);
      
      return {
        success: true,
        order: {
          ...order,
          customer_name: customer?.full_name || 'N/A',
          customer_phone: customer?.phone || 'N/A',
          customer_address: customer?.address || 'N/A',
          farmer_name: farmer?.full_name || '-',
          farmer_phone: farmer?.phone || '-',
          baler_name: baler?.full_name || '-',
          baler_phone: baler?.phone || '-'
        }
      };
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
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const orderIndex = orders.findIndex(o => o.order_id === orderId);
      
      if (orderIndex === -1) {
        return {
          success: false,
          error: 'ไม่พบออเดอร์ / Order not found'
        };
      }
      
      orders[orderIndex].farmer_id = farmerId;
      orders[orderIndex].status = 'farmer_accepted';
      
      localStorage.setItem('orders', JSON.stringify(orders));
      
      return {
        success: true,
        order: orders[orderIndex]
      };
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
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const orderIndex = orders.findIndex(o => o.order_id === orderId);
      
      if (orderIndex === -1) {
        return {
          success: false,
          error: 'ไม่พบออเดอร์ / Order not found'
        };
      }
      
      orders[orderIndex].baler_id = balerId;
      orders[orderIndex].status = 'baler_assigned';
      
      localStorage.setItem('orders', JSON.stringify(orders));
      
      return {
        success: true,
        order: orders[orderIndex]
      };
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
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const orderIndex = orders.findIndex(o => o.order_id === orderId);
      
      if (orderIndex === -1) {
        return {
          success: false,
          error: 'ไม่พบออเดอร์ / Order not found'
        };
      }
      
      orders[orderIndex].status = newStatus;
      
      if (newStatus === 'delivered') {
        orders[orderIndex].delivered_at = new Date().toISOString();
      }
      
      localStorage.setItem('orders', JSON.stringify(orders));
      
      return {
        success: true,
        order: orders[orderIndex]
      };
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
      let users = JSON.parse(localStorage.getItem('users') || '[]');
      
      if (userType) {
        users = users.filter(u => u.user_type === userType);
      }
      
      return {
        success: true,
        users: users.map(u => ({
          id: u.user_id,
          name: u.full_name,
          phone: u.phone,
          email: u.email,
          type: u.user_type
        }))
      };
    } catch (error) {
      console.error('Get users error:', error);
      return {
        success: false,
        error: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้ / Cannot fetch users'
      };
    }
  }
}

// Initialize with some demo data if localStorage is empty
function initializeDemoData() {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  
  if (users.length === 0) {
    const demoUsers = [
      {
        user_id: 'demo_customer_1',
        email: 'customer@test.com',
        password: '123456',
        user_type: 'customer',
        full_name: 'สมชาย ใจดี',
        phone: '0812345678',
        address: '123 หมู่ 1 ต.สารภี อ.สารภี จ.เชียงใหม่',
        created_at: new Date().toISOString(),
        status: 'active'
      },
      {
        user_id: 'demo_farmer_1',
        email: 'farmer@test.com',
        password: '123456',
        user_type: 'farmer',
        full_name: 'สมหญิง เกษตรกร',
        phone: '0823456789',
        address: '456 หมู่ 2 ต.สารภี อ.สารภี จ.เชียงใหม่',
        created_at: new Date().toISOString(),
        status: 'active'
      },
      {
        user_id: 'demo_baler_1',
        email: 'baler@test.com',
        password: '123456',
        user_type: 'baler',
        full_name: 'สมศักดิ์ อัดฟาง',
        phone: '0834567890',
        address: '789 หมู่ 3 ต.สารภี อ.สารภี จ.เชียงใหม่',
        created_at: new Date().toISOString(),
        status: 'active'
      }
    ];
    
    localStorage.setItem('users', JSON.stringify(demoUsers));
    console.log('Demo users initialized. Login credentials:');
    console.log('Customer: customer@test.com / 123456');
    console.log('Farmer: farmer@test.com / 123456');
    console.log('Baler: baler@test.com / 123456');
  }
  
  const orders = JSON.parse(localStorage.getItem('orders') || '[]');
  
  if (orders.length === 0) {
    const demoOrders = [
      {
        order_id: 'demo_order_1',
        customer_id: 'demo_customer_1',
        farmer_id: null,
        baler_id: null,
        bale_type: 'ฟางข้าว (Rice Straw)',
        quantity: 100,
        delivery_address: '123 หมู่ 1 ต.สารภี อ.สารภี จ.เชียงใหม่',
        pickup_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        created_at: new Date().toISOString(),
        price: null,
        notes: 'กรุณาติดต่อก่อนส่ง'
      }
    ];
    
    localStorage.setItem('orders', JSON.stringify(demoOrders));
  }
}

// Initialize demo data when page loads
if (typeof window !== 'undefined') {
  initializeDemoData();
}

// Export API
window.API = API;

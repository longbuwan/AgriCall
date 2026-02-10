// api.js - API handler for AgriCall (Server Mode)
// Updated with Environmental Statistics Endpoints

// Configuration - UPDATE THE PYTHON_BACKEND URL TO YOUR RENDER SERVER
const CONFIG = {
  // ⚠️ CHANGE THIS TO YOUR RENDER BACKEND URL ⚠️
  PYTHON_BACKEND: 'https://agricall.onrender.com',
  
  API_ENDPOINTS: {
    // Authentication
    AUTH: '/auth',
    AUTH_PHONE: '/auth/phone',
    REGISTER: '/register',
    
    // Orders
    CREATE_ORDER: '/create_order',
    GET_ORDERS: '/get_orders',
    ACCEPT_ORDER: '/accept_order',
    ASSIGN_BALER: '/assign_baler',
    UPDATE_STATUS: '/update_status',
    
    // Users
    GET_USERS: '/get_users',
    
    // Ratings
    SUBMIT_RATING: '/submit_rating',
    GET_RATINGS: '/get_ratings',
    GET_USER_RATINGS: '/get_user_ratings',
    GET_ORDER_RATINGS: '/get_order_ratings',
    
    // AgriCoin
    AGRICOIN_BALANCE: '/agricoin/balance',
    AGRICOIN_ADD: '/agricoin/add',
    AGRICOIN_SPEND: '/agricoin/spend',
    AGRICOIN_TRANSACTIONS: '/agricoin/transactions',
    
    // Burn Scar Detection
    BURN_SCAR_ANALYZE: '/api/burn-scar/analyze',
    BURN_SCAR_HISTORY: '/api/burn-scar/history',
    BURN_SCAR_STATS: '/api/burn-scar/stats',
    
    // Environmental Statistics (NEW)
    STATS_PERSONAL: '/api/stats/personal',
    STATS_PLATFORM: '/api/stats/platform',
    STATS_RECORD_VERIFICATION: '/api/stats/record-verification',
    STATS_IMPACT_SUMMARY: '/api/stats/impact-summary'
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
  
  // ========================================
  // AGRICOIN
  // ========================================
  
  // Get AgriCoin balance
  static async getAgriCoinBalance(userId) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.AGRICOIN_BALANCE, {
        user_id: userId
      });
      return result;
    } catch (error) {
      console.error('Get balance error:', error);
      return { success: false, error: 'ไม่สามารถดึงยอด AgriCoin ได้ / Cannot fetch balance' };
    }
  }
  
  // Add AgriCoins (rewards)
  static async addAgriCoins(userId, amount, description, orderId = null) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.AGRICOIN_ADD, {
        user_id: userId,
        amount: amount,
        description: description,
        order_id: orderId
      });
      return result;
    } catch (error) {
      console.error('Add AgriCoin error:', error);
      return { success: false, error: 'ไม่สามารถเพิ่ม AgriCoin ได้ / Cannot add AgriCoins' };
    }
  }
  
  // Spend AgriCoins
  static async spendAgriCoins(userId, amount, description, orderId = null) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.AGRICOIN_SPEND, {
        user_id: userId,
        amount: amount,
        description: description,
        order_id: orderId
      });
      return result;
    } catch (error) {
      console.error('Spend AgriCoin error:', error);
      return { success: false, error: 'ไม่สามารถใช้ AgriCoin ได้ / Cannot spend AgriCoins' };
    }
  }
  
  // Get AgriCoin transaction history
  static async getAgriCoinTransactions(userId, limit = 50) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.AGRICOIN_TRANSACTIONS, {
        user_id: userId,
        limit: limit
      });
      return result;
    } catch (error) {
      console.error('Get transactions error:', error);
      return { success: false, error: 'ไม่สามารถดึงประวัติ AgriCoin ได้ / Cannot fetch transactions' };
    }
  }
  
  // ========================================
  // BURN SCAR DETECTION
  // ========================================
  
  // Analyze burn scar
  static async analyzeBurnScar(params) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.BURN_SCAR_ANALYZE, params);
      return result;
    } catch (error) {
      console.error('Burn scar analysis error:', error);
      return { success: false, error: 'ไม่สามารถวิเคราะห์ได้ / Cannot analyze burn scar' };
    }
  }
  
  // Get burn scar analysis history
  static async getBurnScarHistory(userId, limit = 20) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.BURN_SCAR_HISTORY, {
        user_id: userId,
        limit: limit
      });
      return result;
    } catch (error) {
      console.error('Get burn history error:', error);
      return { success: false, error: 'ไม่สามารถดึงประวัติได้ / Cannot fetch history' };
    }
  }
  
  // Get burn scar statistics
  static async getBurnScarStats(userId) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.BURN_SCAR_STATS, {
        user_id: userId
      });
      return result;
    } catch (error) {
      console.error('Get burn stats error:', error);
      return { success: false, error: 'ไม่สามารถดึงสถิติได้ / Cannot fetch stats' };
    }
  }
  
  // ========================================
  // ENVIRONMENTAL STATISTICS (NEW)
  // ========================================
  
  /**
   * Get personal environmental statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Personal statistics including PM2.5 and CO2 prevented
   */
  static async getPersonalStats(userId) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.STATS_PERSONAL, {
        user_id: userId
      });
      return result;
    } catch (error) {
      console.error('Get personal stats error:', error);
      return { success: false, error: 'ไม่สามารถดึงสถิติส่วนตัวได้ / Cannot fetch personal statistics' };
    }
  }
  
  /**
   * Get platform-wide environmental statistics
   * @returns {Promise<Object>} Platform statistics including total PM2.5 and CO2 prevented
   */
  static async getPlatformStats() {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.STATS_PLATFORM, {});
      return result;
    } catch (error) {
      console.error('Get platform stats error:', error);
      return { success: false, error: 'ไม่สามารถดึงสถิติแพลตฟอร์มได้ / Cannot fetch platform statistics' };
    }
  }
  
  /**
   * Record a verified no-burn field and award AgriCoins
   * @param {Object} params - { user_id, analysis_id, area_rai, lat, lng, province, field_name }
   * @returns {Promise<Object>} Environmental impact and reward details
   */
  static async recordVerifiedField(params) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.STATS_RECORD_VERIFICATION, params);
      return result;
    } catch (error) {
      console.error('Record verification error:', error);
      return { success: false, error: 'ไม่สามารถบันทึกการตรวจสอบได้ / Cannot record verification' };
    }
  }
  
  /**
   * Get quick impact summary for home page
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Quick summary of personal and platform impact
   */
  static async getImpactSummary(userId) {
    try {
      const result = await this.callBackend(CONFIG.API_ENDPOINTS.STATS_IMPACT_SUMMARY, {
        user_id: userId
      });
      return result;
    } catch (error) {
      console.error('Get impact summary error:', error);
      return { success: false, error: 'ไม่สามารถดึงสรุปผลกระทบได้ / Cannot fetch impact summary' };
    }
  }
}

// ========================================
// ENVIRONMENTAL IMPACT CALCULATOR UTILITY
// ========================================

const EnvironmentalCalculator = {
  // Constants based on research
  PM25_PER_RAI: 4.18,      // kg PM2.5 per rai
  CO2_PER_RAI: 446.11,     // kg CO2 per rai
  HA_TO_RAI: 6.25,         // 1 hectare = 6.25 rai
  CO2_PER_TREE_YEAR: 21,   // kg CO2 absorbed per tree per year
  CO2_PER_CAR_KM: 0.21,    // kg CO2 per km driven
  CO2_PER_HOME_DAY: 15,    // kg CO2 per day home electricity
  
  /**
   * Calculate PM2.5 prevented
   * @param {number} areaRai - Area in rai
   * @returns {number} PM2.5 prevented in kg
   */
  calculatePM25Prevented(areaRai) {
    return areaRai * this.PM25_PER_RAI;
  },
  
  /**
   * Calculate CO2 prevented
   * @param {number} areaRai - Area in rai
   * @returns {number} CO2 prevented in kg
   */
  calculateCO2Prevented(areaRai) {
    return areaRai * this.CO2_PER_RAI;
  },
  
  /**
   * Convert hectares to rai
   * @param {number} hectares - Area in hectares
   * @returns {number} Area in rai
   */
  hectaresToRai(hectares) {
    return hectares * this.HA_TO_RAI;
  },
  
  /**
   * Calculate environmental equivalencies
   * @param {number} co2Prevented - CO2 prevented in kg
   * @returns {Object} Equivalency values
   */
  calculateEquivalencies(co2Prevented) {
    return {
      treesEquivalent: Math.round(co2Prevented / this.CO2_PER_TREE_YEAR),
      carKmAvoided: Math.round(co2Prevented / this.CO2_PER_CAR_KM),
      homeDaysEnergy: Math.round(co2Prevented / this.CO2_PER_HOME_DAY)
    };
  },
  
  /**
   * Calculate AgriCoin reward for verified no-burn field
   * @param {number} co2Prevented - CO2 prevented in kg
   * @returns {number} AgriCoins to award (1 coin per 10 kg CO2)
   */
  calculateAgriCoinReward(co2Prevented) {
    return co2Prevented / 10;
  },
  
  /**
   * Format large numbers for display
   * @param {number} value - Number to format
   * @param {number} decimals - Decimal places
   * @returns {string} Formatted string
   */
  formatNumber(value, decimals = 0) {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toFixed(decimals);
  }
};

// Export API and utilities
window.API = API;
window.CONFIG = CONFIG;
window.EnvironmentalCalculator = EnvironmentalCalculator;

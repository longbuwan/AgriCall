#!/usr/bin/env python3
"""
BaleConnect Backend Server
A Flask REST API server for the BaleConnect application
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import hashlib
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database file
DB_FILE = 'baleconnect.db'

# ========================================
# DATABASE SETUP
# ========================================

def init_db():
    """Initialize the SQLite database with tables"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            user_type TEXT NOT NULL,
            full_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT,
            created_at TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active'
        )
    ''')
    
    # Orders table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            order_id TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL,
            farmer_id TEXT,
            baler_id TEXT,
            bale_type TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            delivery_address TEXT NOT NULL,
            pickup_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL,
            delivered_at TEXT,
            notes TEXT,
            FOREIGN KEY (customer_id) REFERENCES users (user_id),
            FOREIGN KEY (farmer_id) REFERENCES users (user_id),
            FOREIGN KEY (baler_id) REFERENCES users (user_id)
        )
    ''')
    
    conn.commit()
    
    # Create demo users if database is empty
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        print("Creating demo users...")
        demo_users = [
            ('demo_customer_1', 'customer@test.com', '123456', 'customer', 
             'สมชาย ใจดี', '0812345678', '123 หมู่ 1 ต.สารภี อ.สารภี จ.เชียงใหม่'),
            ('demo_farmer_1', 'farmer@test.com', '123456', 'farmer',
             'สมหญิง เกษตรกร', '0823456789', '456 หมู่ 2 ต.สารภี อ.สารภี จ.เชียงใหม่'),
            ('demo_baler_1', 'baler@test.com', '123456', 'baler',
             'สมศักดิ์ อัดฟาง', '0834567890', '789 หมู่ 3 ต.สารภี อ.สารภี จ.เชียงใหม่'),
        ]
        
        for user_data in demo_users:
            cursor.execute('''
                INSERT INTO users (user_id, email, password, user_type, full_name, phone, address, created_at, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
            ''', (*user_data, datetime.now().isoformat()))
        
        conn.commit()
        print("Demo users created!")
        print("Login credentials:")
        print("  Customer: customer@test.com / 123456")
        print("  Farmer: farmer@test.com / 123456")
        print("  Baler: baler@test.com / 123456")
    
    conn.close()

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn

def generate_id(prefix=''):
    """Generate a unique ID"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S%f')
    return f"{timestamp}_{prefix}" if prefix else timestamp

# ========================================
# API ENDPOINTS
# ========================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'BaleConnect API is running',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/auth', methods=['POST'])
def login():
    """User authentication endpoint"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        user_type = data.get('user_type')
        
        if not all([email, password, user_type]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields'
            }), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Find user
        cursor.execute('''
            SELECT * FROM users 
            WHERE email = ? AND password = ? AND user_type = ? AND status = 'active'
        ''', (email, password, user_type))
        
        user = cursor.fetchone()
        conn.close()
        
        if user:
            return jsonify({
                'success': True,
                'user': {
                    'id': user['user_id'],
                    'type': user['user_type'],
                    'name': user['full_name'],
                    'email': user['email'],
                    'phone': user['phone'],
                    'address': user['address']
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง / Invalid email or password'
            }), 401
            
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({
            'success': False,
            'error': 'เกิดข้อผิดพลาด / An error occurred'
        }), 500

@app.route('/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        user_data = data.get('user', {})
        
        required_fields = ['email', 'password', 'user_type', 'full_name', 'phone']
        if not all(field in user_data for field in required_fields):
            return jsonify({
                'success': False,
                'error': 'Missing required fields'
            }), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if email already exists
        cursor.execute('SELECT user_id FROM users WHERE email = ?', (user_data['email'],))
        if cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'error': 'อีเมลนี้ถูกใช้งานแล้ว / This email is already registered'
            }), 409
        
        # Create new user
        user_id = generate_id(user_data['user_type'])
        cursor.execute('''
            INSERT INTO users (user_id, email, password, user_type, full_name, phone, address, created_at, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
        ''', (
            user_id,
            user_data['email'],
            user_data['password'],
            user_data['user_type'],
            user_data['full_name'],
            user_data['phone'],
            user_data.get('address', ''),
            datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'user': {
                'id': user_id,
                'type': user_data['user_type'],
                'name': user_data['full_name']
            }
        }), 201
        
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({
            'success': False,
            'error': 'เกิดข้อผิดพลาด / An error occurred'
        }), 500

@app.route('/create_order', methods=['POST'])
def create_order():
    """Create new order endpoint"""
    try:
        data = request.get_json()
        order_data = data.get('order', {})
        
        required_fields = ['customer_id', 'bale_type', 'quantity', 'delivery_address', 'pickup_date']
        if not all(field in order_data for field in required_fields):
            return jsonify({
                'success': False,
                'error': 'Missing required fields'
            }), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Create new order
        order_id = generate_id('order')
        cursor.execute('''
            INSERT INTO orders (
                order_id, customer_id, farmer_id, baler_id, bale_type, 
                quantity, delivery_address, pickup_date, status, created_at, notes
            ) VALUES (?, ?, NULL, NULL, ?, ?, ?, ?, 'pending', ?, ?)
        ''', (
            order_id,
            order_data['customer_id'],
            order_data['bale_type'],
            order_data['quantity'],
            order_data['delivery_address'],
            order_data['pickup_date'],
            datetime.now().isoformat(),
            order_data.get('notes', '')
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'order': {
                'order_id': order_id,
                'customer_id': order_data['customer_id'],
                'farmer_id': None,
                'baler_id': None,
                'bale_type': order_data['bale_type'],
                'quantity': order_data['quantity'],
                'delivery_address': order_data['delivery_address'],
                'pickup_date': order_data['pickup_date'],
                'status': 'pending',
                'created_at': datetime.now().isoformat(),
                'notes': order_data.get('notes', '')
            }
        }), 201
        
    except Exception as e:
        print(f"Create order error: {e}")
        return jsonify({
            'success': False,
            'error': 'ไม่สามารถสร้างออเดอร์ได้ / Cannot create order'
        }), 500

@app.route('/get_orders', methods=['POST'])
def get_orders():
    """Get orders with optional filters"""
    try:
        data = request.get_json() or {}
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Build query with filters
        query = '''
            SELECT o.*, 
                   c.full_name as customer_name, c.phone as customer_phone, c.address as customer_address,
                   f.full_name as farmer_name, f.phone as farmer_phone,
                   b.full_name as baler_name, b.phone as baler_phone
            FROM orders o
            LEFT JOIN users c ON o.customer_id = c.user_id
            LEFT JOIN users f ON o.farmer_id = f.user_id
            LEFT JOIN users b ON o.baler_id = b.user_id
            WHERE 1=1
        '''
        params = []
        
        if 'customer_id' in data:
            query += ' AND o.customer_id = ?'
            params.append(data['customer_id'])
        
        if 'farmer_id' in data:
            query += ' AND o.farmer_id = ?'
            params.append(data['farmer_id'])
        
        if 'baler_id' in data:
            query += ' AND o.baler_id = ?'
            params.append(data['baler_id'])
        
        if 'status' in data:
            query += ' AND o.status = ?'
            params.append(data['status'])
        
        query += ' ORDER BY o.created_at DESC'
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        orders = []
        for row in rows:
            orders.append({
                'order_id': row['order_id'],
                'customer_id': row['customer_id'],
                'farmer_id': row['farmer_id'],
                'baler_id': row['baler_id'],
                'bale_type': row['bale_type'],
                'quantity': row['quantity'],
                'delivery_address': row['delivery_address'],
                'pickup_date': row['pickup_date'],
                'status': row['status'],
                'created_at': row['created_at'],
                'delivered_at': row['delivered_at'],
                'notes': row['notes'],
                'customer_name': row['customer_name'] or 'N/A',
                'customer_phone': row['customer_phone'] or 'N/A',
                'customer_address': row['customer_address'] or 'N/A',
                'farmer_name': row['farmer_name'] or '-',
                'farmer_phone': row['farmer_phone'] or '-',
                'baler_name': row['baler_name'] or '-',
                'baler_phone': row['baler_phone'] or '-'
            })
        
        return jsonify({
            'success': True,
            'orders': orders
        })
        
    except Exception as e:
        print(f"Get orders error: {e}")
        return jsonify({
            'success': False,
            'error': 'ไม่สามารถดึงข้อมูลออเดอร์ได้ / Cannot fetch orders'
        }), 500

@app.route('/accept_order', methods=['POST'])
def accept_order():
    """Farmer accepts order"""
    try:
        data = request.get_json()
        order_id = data.get('order_id')
        farmer_id = data.get('farmer_id')
        
        if not all([order_id, farmer_id]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields'
            }), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Update order
        cursor.execute('''
            UPDATE orders 
            SET farmer_id = ?, status = 'farmer_accepted'
            WHERE order_id = ?
        ''', (farmer_id, order_id))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({
                'success': False,
                'error': 'ไม่พบออเดอร์ / Order not found'
            }), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'order': {
                'order_id': order_id,
                'farmer_id': farmer_id,
                'status': 'farmer_accepted'
            }
        })
        
    except Exception as e:
        print(f"Accept order error: {e}")
        return jsonify({
            'success': False,
            'error': 'ไม่สามารถรับงานได้ / Cannot accept order'
        }), 500

@app.route('/assign_baler', methods=['POST'])
def assign_baler():
    """Farmer assigns baler to order"""
    try:
        data = request.get_json()
        order_id = data.get('order_id')
        baler_id = data.get('baler_id')
        
        if not all([order_id, baler_id]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields'
            }), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Update order
        cursor.execute('''
            UPDATE orders 
            SET baler_id = ?, status = 'baler_assigned'
            WHERE order_id = ?
        ''', (baler_id, order_id))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({
                'success': False,
                'error': 'ไม่พบออเดอร์ / Order not found'
            }), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'order': {
                'order_id': order_id,
                'baler_id': baler_id,
                'status': 'baler_assigned'
            }
        })
        
    except Exception as e:
        print(f"Assign baler error: {e}")
        return jsonify({
            'success': False,
            'error': 'ไม่สามารถมอบหมายคนอัดฟางได้ / Cannot assign baler'
        }), 500

@app.route('/update_status', methods=['POST'])
def update_status():
    """Update order status"""
    try:
        data = request.get_json()
        order_id = data.get('order_id')
        new_status = data.get('new_status')
        
        if not all([order_id, new_status]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields'
            }), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Update order status
        if new_status == 'delivered':
            cursor.execute('''
                UPDATE orders 
                SET status = ?, delivered_at = ?
                WHERE order_id = ?
            ''', (new_status, datetime.now().isoformat(), order_id))
        else:
            cursor.execute('''
                UPDATE orders 
                SET status = ?
                WHERE order_id = ?
            ''', (new_status, order_id))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({
                'success': False,
                'error': 'ไม่พบออเดอร์ / Order not found'
            }), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'order': {
                'order_id': order_id,
                'status': new_status
            }
        })
        
    except Exception as e:
        print(f"Update status error: {e}")
        return jsonify({
            'success': False,
            'error': 'ไม่สามารถอัพเดทสถานะได้ / Cannot update status'
        }), 500

@app.route('/get_users', methods=['POST'])
def get_users():
    """Get users by type"""
    try:
        data = request.get_json() or {}
        user_type = data.get('user_type')
        
        conn = get_db()
        cursor = conn.cursor()
        
        if user_type:
            cursor.execute('''
                SELECT user_id, full_name, phone, email, user_type 
                FROM users 
                WHERE user_type = ? AND status = 'active'
                ORDER BY full_name
            ''', (user_type,))
        else:
            cursor.execute('''
                SELECT user_id, full_name, phone, email, user_type 
                FROM users 
                WHERE status = 'active'
                ORDER BY full_name
            ''')
        
        rows = cursor.fetchall()
        conn.close()
        
        users = []
        for row in rows:
            users.append({
                'id': row['user_id'],
                'name': row['full_name'],
                'phone': row['phone'],
                'email': row['email'],
                'type': row['user_type']
            })
        
        return jsonify({
            'success': True,
            'users': users
        })
        
    except Exception as e:
        print(f"Get users error: {e}")
        return jsonify({
            'success': False,
            'error': 'ไม่สามารถดึงข้อมูลผู้ใช้ได้ / Cannot fetch users'
        }), 500

# ========================================
# MAIN
# ========================================

if __name__ == '__main__':
    print("=" * 50)
    print("BaleConnect Backend Server")
    print("=" * 50)
    
    # Initialize database
    print("\nInitializing database...")
    init_db()
    print("Database ready!")
    
    # Start server
    print("\nStarting server...")
    print("Server running at: http://localhost:5000")
    print("Health check: http://localhost:5000/health")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5000, debug=True)

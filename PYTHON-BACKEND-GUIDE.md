# Python Backend Setup Guide - BaleConnect

## 🐍 What You Get

Instead of using Make.com webhooks and Google Sheets, you now have a **Python Flask backend** that:
- ✅ Runs on your local computer
- ✅ Uses SQLite database (no setup needed)
- ✅ Has all 8 API endpoints ready
- ✅ Includes demo user accounts
- ✅ Works offline (no internet needed for backend)

---

## 📦 Prerequisites

You need Python installed on your computer:

### Check if you have Python:
```bash
python --version
# or
python3 --version
```

You should see: `Python 3.8` or higher

### Don't have Python?
**Download from:** https://www.python.org/downloads/

**Windows:** Check "Add Python to PATH" during installation
**Mac/Linux:** Usually pre-installed

---

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies

Open terminal/command prompt in the project folder and run:

```bash
# Install required packages
pip install -r requirements.txt

# Or if using pip3:
pip3 install -r requirements.txt
```

This installs:
- Flask (web framework)
- Flask-CORS (allows browser to connect)

### Step 2: Run the Backend

```bash
# Start the server
python backend.py

# Or if using python3:
python3 backend.py
```

You should see:
```
==================================================
BaleConnect Backend Server
==================================================

Initializing database...
Creating demo users...
Demo users created!
Login credentials:
  Customer: customer@test.com / 123456
  Farmer: farmer@test.com / 123456
  Baler: baler@test.com / 123456
Database ready!

Starting server...
Server running at: http://localhost:5000
Health check: http://localhost:5000/health

Press Ctrl+C to stop the server
==================================================
```

✅ **Backend is running!**

### Step 3: Update Your HTML Files

You need to use the Python-specific JavaScript files instead of the original ones.

**In ALL HTML files** (index.html, customer-dashboard.html, farmer-dashboard.html, baler-dashboard.html):

**Change this:**
```html
<script src="utils.js"></script>
<script src="api.js"></script>
```

**To this:**
```html
<script src="utils-python.js"></script>
<script src="api-python.js"></script>
```

### Step 4: Open the Website

1. Open `index.html` in your browser
2. Login with demo credentials
3. Everything should work!

---

## ✅ Verification Checklist

### Is the backend running?

**Test 1: Health Check**
Open browser and go to: http://localhost:5000/health

You should see:
```json
{
  "status": "ok",
  "message": "BaleConnect API is running",
  "timestamp": "2024-12-07T..."
}
```

**Test 2: Browser Console**
1. Open website (index.html)
2. Press F12 → Console tab
3. Try to login
4. Look for: `📡 Calling backend: http://localhost:5000/auth`

### Common Issues

❌ **"Cannot connect to server"**
- **Fix:** Make sure `backend.py` is running in terminal

❌ **"pip: command not found"**
- **Fix:** Use `pip3` instead, or reinstall Python with pip

❌ **"Port 5000 already in use"**
- **Fix:** Change port in `backend.py` (line at the bottom):
  ```python
  app.run(host='0.0.0.0', port=5001, debug=True)  # Changed to 5001
  ```
  Then update `utils-python.js`:
  ```javascript
  PYTHON_BACKEND: 'http://localhost:5001',
  ```

❌ **"CORS error"**
- **Fix:** Make sure you installed `flask-cors` correctly
- Restart the backend server

---

## 📁 Database File

The backend creates a file called **`baleconnect.db`** in the same folder as `backend.py`.

This SQLite database contains:
- **users table** - All registered users
- **orders table** - All orders

### View the Database (Optional)

**Option 1: DB Browser for SQLite**
1. Download: https://sqlitebrowser.org/
2. Open `baleconnect.db`
3. Browse/edit data visually

**Option 2: Command Line**
```bash
sqlite3 baleconnect.db
```
```sql
-- View all users
SELECT * FROM users;

-- View all orders
SELECT * FROM orders;

-- Exit
.quit
```

### Reset Database

To start fresh with demo users again:

```bash
# Delete the database file
rm baleconnect.db

# Or on Windows:
del baleconnect.db

# Then restart backend.py - it will create a new database
python backend.py
```

---

## 🔧 Backend API Endpoints

All endpoints are available at `http://localhost:5000`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check if server is running |
| `/auth` | POST | User login |
| `/register` | POST | User registration |
| `/create_order` | POST | Create new order |
| `/get_orders` | POST | Get orders (with filters) |
| `/accept_order` | POST | Farmer accepts order |
| `/assign_baler` | POST | Farmer assigns baler |
| `/update_status` | POST | Update order status |
| `/get_users` | POST | Get users by type |

### Example API Call (using curl)

```bash
# Test login
curl -X POST http://localhost:5000/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "123456",
    "user_type": "customer"
  }'
```

Expected response:
```json
{
  "success": true,
  "user": {
    "id": "demo_customer_1",
    "type": "customer",
    "name": "สมชาย ใจดี",
    "email": "customer@test.com",
    "phone": "0812345678",
    "address": "123 หมู่ 1 ต.สารภี อ.สารภี จ.เชียงใหม่"
  }
}
```

---

## 🎯 Workflow Example

### Complete Order Flow:

**1. Customer Creates Order**
```
Browser → POST /create_order
Backend → Save to database
Backend → Return order_id
Browser → Show success
```

**2. Farmer Accepts Order**
```
Browser → POST /accept_order
Backend → Update order.farmer_id
Backend → Update order.status = 'farmer_accepted'
Browser → Show success
```

**3. Farmer Assigns Baler**
```
Browser → POST /get_users (user_type='baler')
Backend → Return list of balers
Browser → Show baler selection
Browser → POST /assign_baler
Backend → Update order.baler_id
Backend → Update order.status = 'baler_assigned'
```

**4. Baler Completes Job**
```
Browser → POST /update_status (new_status='in_progress')
Browser → POST /update_status (new_status='delivered')
Backend → Update order.status
Backend → Set order.delivered_at = now()
Browser → Show completion
```

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    user_type TEXT NOT NULL,  -- 'customer', 'farmer', 'baler'
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
)
```

### Orders Table
```sql
CREATE TABLE orders (
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
```

---

## 🔒 Security Notes

**⚠️ This is a PROTOTYPE for local development/testing**

For production deployment, you need to add:
- ✅ Password hashing (bcrypt)
- ✅ JWT authentication tokens
- ✅ HTTPS/SSL
- ✅ Input validation
- ✅ SQL injection protection (use parameterized queries - already done!)
- ✅ Rate limiting
- ✅ Session management

**Current security features:**
- ✅ Parameterized SQL queries (prevents SQL injection)
- ✅ CORS enabled (allows browser access)

---

## 🚀 Deployment Options

### Option 1: Run Locally (Current Setup)
- Backend: `python backend.py`
- Frontend: Open HTML files in browser
- Best for: Development and testing

### Option 2: Deploy to Cloud

**Popular platforms:**
- **Heroku:** Free tier available
- **PythonAnywhere:** Free tier for Flask apps
- **AWS Elastic Beanstalk:** Free tier for 12 months
- **DigitalOcean App Platform:** $5/month
- **Railway.app:** Free tier available

**Steps for deployment:**
1. Update `backend.py` to use PostgreSQL instead of SQLite
2. Add environment variables for configuration
3. Set `debug=False` in production
4. Add password hashing
5. Deploy backend to cloud
6. Update frontend to point to cloud URL
7. Host frontend on GitHub Pages/Netlify

---

## 🎓 Customization

### Add New User Field

**1. Update database schema in `backend.py`:**
```python
cursor.execute('''
    ALTER TABLE users ADD COLUMN organization TEXT
''')
```

**2. Update registration endpoint:**
```python
cursor.execute('''
    INSERT INTO users (..., organization)
    VALUES (..., ?)
''', (..., user_data.get('organization', '')))
```

### Add New Order Status

**1. Add to status_transitions in `backend.py`:**
```python
VALID_STATUSES = ['pending', 'farmer_accepted', 'baler_assigned', 
                  'in_progress', 'delivered', 'cancelled', 'your_new_status']
```

**2. Update frontend status badge in `utils-python.js`:**
```javascript
function getStatusText(status) {
  const statusMap = {
    // ... existing statuses
    'your_new_status': 'ภาษาไทย / English'
  };
  return statusMap[status] || status;
}
```

---

## 📝 Development Tips

### Enable Debug Mode
Already enabled! You'll see detailed error messages in terminal.

### Auto-Reload on Code Changes
Flask's debug mode automatically reloads when you edit `backend.py`!

### View Logs
All backend activity is printed to terminal where you ran `python backend.py`

### Test API with Postman
1. Download Postman: https://www.postman.com/downloads/
2. Import collection with all endpoints
3. Test each endpoint independently

---

## 🆘 Troubleshooting

### Problem: "ModuleNotFoundError: No module named 'flask'"
**Solution:**
```bash
pip install Flask flask-cors
# or
pip3 install Flask flask-cors
```

### Problem: Backend stops when terminal closes
**Solution:** Use a process manager like `screen`, `tmux`, or `pm2` (for production)

### Problem: Database is locked
**Solution:** 
1. Close all connections to the database
2. Restart the backend
3. If persists, delete `baleconnect.db` and restart

### Problem: Changes not showing
**Solution:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Check you're using `utils-python.js` and `api-python.js`
3. Check backend terminal for errors

---

## ✅ Final Checklist

- [ ] Python 3.8+ installed
- [ ] Installed Flask and flask-cors
- [ ] `backend.py` is running (terminal shows "Server running")
- [ ] Can access http://localhost:5000/health
- [ ] Updated HTML files to use `utils-python.js` and `api-python.js`
- [ ] Opened `index.html` in browser
- [ ] Successfully logged in with demo credentials
- [ ] Can create, accept, and complete orders

---

## 🎉 You're Done!

Your BaleConnect app is now running with a Python backend!

**Next steps:**
1. Test all features (create order, accept, assign, deliver)
2. Customize as needed
3. Add new features
4. Deploy to production when ready

**Need help?** Check the backend terminal for error messages!

---

## 📞 Quick Reference

**Start Backend:**
```bash
python backend.py
```

**Stop Backend:**
Press `Ctrl+C` in terminal

**Reset Database:**
```bash
rm baleconnect.db
python backend.py
```

**View Database:**
```bash
sqlite3 baleconnect.db
SELECT * FROM users;
.quit
```

**Test Health:**
```
http://localhost:5000/health
```

---

**Happy Coding! 🐍🌾**

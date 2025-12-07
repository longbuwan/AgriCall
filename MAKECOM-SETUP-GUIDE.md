# Complete Make.com Webhook Setup Guide for BaleConnect

## 📋 Prerequisites

### 1. Google Sheets Setup

Create a new Google Spreadsheet called "BaleConnect Database" with these sheets:

#### Sheet 1: "Users"
| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| user_id | email | password | user_type | full_name | phone | address | created_at | status |

#### Sheet 2: "Orders"
| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| order_id | customer_id | farmer_id | baler_id | bale_type | quantity | delivery_address | pickup_date | status | created_at | notes |

### 2. Make.com Account
- Sign up at https://make.com
- You get 1,000 operations/month free

---

## 🔗 Webhook 1: REGISTER (New User Signup)

### Step-by-Step Setup

#### 1. Create New Scenario
1. Go to Make.com dashboard
2. Click **"Create a new scenario"**
3. Name it: `BaleConnect - Register User`

#### 2. Add Webhook Trigger
1. Click the **+** button
2. Search for **"Webhooks"**
3. Select **"Custom webhook"**
4. Click **"Create a webhook"**
5. Name it: `register_user`
6. Click **"Save"**
7. **COPY THE WEBHOOK URL** - you'll need this later!

#### 3. Add Google Sheets Module - Search Rows
**Why?** Check if email already exists

1. Click **+** after the webhook
2. Search for **"Google Sheets"**
3. Select **"Search Rows"**
4. Click **"Create a connection"** and sign in to Google
5. Configure:
   - **Spreadsheet ID**: Select "BaleConnect Database"
   - **Sheet Name**: `Users`
   - **Filter**: 
     - Column: `B` (email column)
     - Operator: `Text operators > Equal to`
     - Value: `{{1.user.email}}` (from webhook)
   - **Maximum number of returned rows**: `1`

#### 4. Add Router
1. Click **+** after Search Rows
2. Select **"Router"**

#### 5. Route 1: Email Exists (Error Response)
1. Click on Route 1
2. Add filter:
   - Label: `Email exists`
   - Condition: `{{length(2.`__IMTARRAY__`)}}` > 0
3. Add module: **Webhooks > Webhook Response**
4. Configure:
   - **Status**: `200`
   - **Body**:
   ```json
   {
     "success": false,
     "error": "อีเมลนี้ถูกใช้งานแล้ว / This email is already registered"
   }
   ```
   - **Custom headers**:
     - Name: `Content-Type`
     - Value: `application/json`

#### 6. Route 2: Create New User (Success)
1. Click on the second route
2. Add filter:
   - Label: `Email not exists`
   - Condition: `{{length(2.`__IMTARRAY__`)}}` = 0
3. Add module: **Tools > Set variable**
4. Configure:
   - **Variable name**: `user_id`
   - **Variable value**: `{{timestamp}}_{{1.user.user_type}}`
5. Add module: **Google Sheets > Add a Row**
6. Configure:
   - **Spreadsheet ID**: Select "BaleConnect Database"
   - **Sheet Name**: `Users`
   - **Values**:
     - A (user_id): `{{3.user_id}}`
     - B (email): `{{1.user.email}}`
     - C (password): `{{1.user.password}}`
     - D (user_type): `{{1.user.user_type}}`
     - E (full_name): `{{1.user.full_name}}`
     - F (phone): `{{1.user.phone}}`
     - G (address): `{{1.user.address}}`
     - H (created_at): `{{now}}`
     - I (status): `active`
7. Add module: **Webhooks > Webhook Response**
8. Configure:
   - **Status**: `200`
   - **Body**:
   ```json
   {
     "success": true,
     "user": {
       "id": "{{3.user_id}}",
       "type": "{{1.user.user_type}}",
       "name": "{{1.user.full_name}}"
     }
   }
   ```
   - **Custom headers**:
     - Name: `Content-Type`
     - Value: `application/json`

#### 7. Test & Save
1. Click **"Run once"**
2. Go to your website and try to register
3. Check if it works
4. Click **"Save"** in Make.com
5. Turn the scenario **ON**

#### 8. Copy Webhook URL
**COPY THIS URL** and paste it in `utils.js`:
```javascript
REGISTER: 'https://hook.make.com/YOUR_COPIED_URL_HERE'
```

---

## 🔗 Webhook 2: AUTH (Login)

### Step-by-Step Setup

#### 1. Create New Scenario
- Name: `BaleConnect - Login`

#### 2. Add Webhook Trigger
- Name it: `auth_login`
- **COPY THE WEBHOOK URL**

#### 3. Add Google Sheets - Search Rows
1. Module: **Google Sheets > Search Rows**
2. Configure:
   - **Spreadsheet ID**: "BaleConnect Database"
   - **Sheet Name**: `Users`
   - **Filter**:
     - Column: `B` (email) = `{{1.email}}`
     - AND Column: `C` (password) = `{{1.password}}`
     - AND Column: `D` (user_type) = `{{1.user_type}}`
   - **Maximum number of returned rows**: `1`

#### 4. Add Router

#### 5. Route 1: User Found (Success)
1. Filter:
   - Label: `User found`
   - Condition: `{{length(2.`__IMTARRAY__`)}}` > 0
2. Add: **Webhooks > Webhook Response**
3. Configure:
   - **Status**: `200`
   - **Body**:
   ```json
   {
     "success": true,
     "user": {
       "id": "{{first(2.`__IMTARRAY__`).A}}",
       "type": "{{first(2.`__IMTARRAY__`).D}}",
       "name": "{{first(2.`__IMTARRAY__`).E}}",
       "email": "{{first(2.`__IMTARRAY__`).B}}",
       "phone": "{{first(2.`__IMTARRAY__`).F}}",
       "address": "{{first(2.`__IMTARRAY__`).G}}"
     }
   }
   ```

#### 6. Route 2: User Not Found (Error)
1. Filter:
   - Label: `User not found`
   - Condition: `{{length(2.`__IMTARRAY__`)}}` = 0
2. Add: **Webhooks > Webhook Response**
3. Configure:
   - **Status**: `200`
   - **Body**:
   ```json
   {
     "success": false,
     "error": "อีเมลหรือรหัสผ่านไม่ถูกต้อง / Invalid email or password"
   }
   ```

#### 7. Save & Get URL
- Save scenario
- Turn ON
- **Copy webhook URL** → paste in utils.js `AUTH:`

---

## 🔗 Webhook 3: CREATE_ORDER

### Step-by-Step Setup

#### 1. Create New Scenario
- Name: `BaleConnect - Create Order`

#### 2. Add Webhook Trigger
- Name: `create_order`

#### 3. Add Tools - Set Variable (Generate Order ID)
1. Module: **Tools > Set variable**
2. Configure:
   - **Variable name**: `order_id`
   - **Variable value**: `{{timestamp}}_order`

#### 4. Add Google Sheets - Add a Row
1. Module: **Google Sheets > Add a Row**
2. Configure:
   - **Spreadsheet ID**: "BaleConnect Database"
   - **Sheet Name**: `Orders`
   - **Values**:
     - A (order_id): `{{2.order_id}}`
     - B (customer_id): `{{1.order.customer_id}}`
     - C (farmer_id): *(leave empty)*
     - D (baler_id): *(leave empty)*
     - E (bale_type): `{{1.order.bale_type}}`
     - F (quantity): `{{1.order.quantity}}`
     - G (delivery_address): `{{1.order.delivery_address}}`
     - H (pickup_date): `{{1.order.pickup_date}}`
     - I (status): `pending`
     - J (created_at): `{{now}}`
     - K (notes): `{{1.order.notes}}`

#### 5. Add Webhook Response
1. Module: **Webhooks > Webhook Response**
2. Configure:
   - **Status**: `200`
   - **Body**:
   ```json
   {
     "success": true,
     "order": {
       "order_id": "{{2.order_id}}",
       "customer_id": "{{1.order.customer_id}}",
       "farmer_id": null,
       "baler_id": null,
       "bale_type": "{{1.order.bale_type}}",
       "quantity": {{1.order.quantity}},
       "delivery_address": "{{1.order.delivery_address}}",
       "pickup_date": "{{1.order.pickup_date}}",
       "status": "pending",
       "created_at": "{{now}}",
       "notes": "{{1.order.notes}}"
     }
   }
   ```

#### 6. Save & Get URL
- **Copy webhook URL** → paste in utils.js `CREATE_ORDER:`

---

## 🔗 Webhook 4: GET_ORDERS

### Step-by-Step Setup

#### 1. Create New Scenario
- Name: `BaleConnect - Get Orders`

#### 2. Add Webhook Trigger
- Name: `get_orders`

#### 3. Add Google Sheets - Search Rows
1. Module: **Google Sheets > Search Rows**
2. Configure:
   - **Spreadsheet ID**: "BaleConnect Database"
   - **Sheet Name**: `Orders`
   - **Filter**: *(We'll handle filtering differently)*
   - **Maximum number of returned rows**: `100`

#### 4. Add Iterator
1. Module: **Iterator**
2. Configure:
   - **Array**: `{{2.`__IMTARRAY__`}}`

#### 5. Add Router (for filtering)

#### 6. Route 1: Filter by customer_id
1. Filter:
   - Condition: `{{1.customer_id}}` exists AND `{{3.B}}` = `{{1.customer_id}}`
2. Add: **Tools > Set variable**
   - Variable name: `filtered_order`
   - Variable value: `{{3}}`

#### 7. Add Aggregator
1. Module: **Tools > Aggregator**
2. Configure:
   - **Source Module**: Choose the Set variable module
   - **Target structure type**: Array

#### 8. Add Google Sheets - Search Rows (Get Users)
**Why?** To get customer/farmer/baler names

1. Module: **Google Sheets > Search Rows**
2. Configure:
   - **Sheet Name**: `Users`
   - **Maximum number of returned rows**: `100`

#### 9. Add Webhook Response
1. Module: **Webhooks > Webhook Response**
2. Configure:
   - **Status**: `200`
   - **Body**: *(This gets complex - simplified version below)*
   ```json
   {
     "success": true,
     "orders": {{7.array}}
   }
   ```

**Note:** This is a simplified version. For production, you'd need to join user data with orders.

#### 10. Simplified Alternative (Recommended)
Instead of complex filtering, create separate scenarios:
- `GET_ORDERS_BY_CUSTOMER` - filter by customer_id
- `GET_ORDERS_BY_FARMER` - filter by farmer_id
- `GET_ORDERS_BY_BALER` - filter by baler_id
- `GET_ORDERS_BY_STATUS` - filter by status

---

## 🔗 Webhook 5: ACCEPT_ORDER (Farmer Accepts)

### Step-by-Step Setup

#### 1. Create New Scenario
- Name: `BaleConnect - Accept Order`

#### 2. Add Webhook Trigger
- Name: `accept_order`

#### 3. Add Google Sheets - Search Rows
1. Module: **Google Sheets > Search Rows**
2. Configure:
   - **Sheet Name**: `Orders`
   - **Filter**: Column A (order_id) = `{{1.order_id}}`
   - **Maximum number of returned rows**: `1`

#### 4. Add Google Sheets - Update a Row
1. Module: **Google Sheets > Update a Row**
2. Configure:
   - **Spreadsheet ID**: "BaleConnect Database"
   - **Sheet Name**: `Orders`
   - **Row number**: `{{2.`__ROW`}}`
   - **Values**:
     - C (farmer_id): `{{1.farmer_id}}`
     - I (status): `farmer_accepted`

#### 5. Add Webhook Response
```json
{
  "success": true,
  "order": {
    "order_id": "{{1.order_id}}",
    "farmer_id": "{{1.farmer_id}}",
    "status": "farmer_accepted"
  }
}
```

#### 6. Save & Get URL
- **Copy webhook URL** → paste in utils.js `ACCEPT_ORDER:`

---

## 🔗 Webhook 6: ASSIGN_BALER

### Step-by-Step Setup

#### 1. Create New Scenario
- Name: `BaleConnect - Assign Baler`

#### 2. Add Webhook Trigger
- Name: `assign_baler`

#### 3. Add Google Sheets - Search Rows
- Find order by `order_id`

#### 4. Add Google Sheets - Update a Row
1. Configure:
   - **Row number**: `{{2.`__ROW`}}`
   - **Values**:
     - D (baler_id): `{{1.baler_id}}`
     - I (status): `baler_assigned`

#### 5. Add Webhook Response
```json
{
  "success": true,
  "order": {
    "order_id": "{{1.order_id}}",
    "baler_id": "{{1.baler_id}}",
    "status": "baler_assigned"
  }
}
```

#### 6. Save & Get URL
- **Copy webhook URL** → paste in utils.js `ASSIGN_BALER:`

---

## 🔗 Webhook 7: UPDATE_STATUS

### Step-by-Step Setup

#### 1. Create New Scenario
- Name: `BaleConnect - Update Status`

#### 2. Add Webhook Trigger
- Name: `update_status`

#### 3. Add Google Sheets - Search Rows
- Find order by `order_id`

#### 4. Add Google Sheets - Update a Row
1. Configure:
   - **Row number**: `{{2.`__ROW`}}`
   - **Values**:
     - I (status): `{{1.new_status}}`

#### 5. Add Webhook Response
```json
{
  "success": true,
  "order": {
    "order_id": "{{1.order_id}}",
    "status": "{{1.new_status}}"
  }
}
```

#### 6. Save & Get URL
- **Copy webhook URL** → paste in utils.js `UPDATE_STATUS:`

---

## 🔗 Webhook 8: GET_USERS

### Step-by-Step Setup

#### 1. Create New Scenario
- Name: `BaleConnect - Get Users`

#### 2. Add Webhook Trigger
- Name: `get_users`

#### 3. Add Google Sheets - Search Rows
1. Configure:
   - **Sheet Name**: `Users`
   - **Filter**: Column D (user_type) = `{{1.user_type}}`
   - **Maximum number of returned rows**: `100`

#### 4. Add Webhook Response
```json
{
  "success": true,
  "users": {{map(2.`__IMTARRAY__`; "id"; "A")}}
}
```

**Better Response** (manually construct):
```json
{
  "success": true,
  "users": [
    {
      "id": "{{2[].A}}",
      "name": "{{2[].E}}",
      "phone": "{{2[].F}}",
      "email": "{{2[].B}}",
      "type": "{{2[].D}}"
    }
  ]
}
```

---

## 📝 Final Checklist

After creating all webhooks:

### 1. Copy All URLs to utils.js
```javascript
const CONFIG = {
  MAKE_WEBHOOKS: {
    AUTH: 'https://hook.make.com/xxxxx',
    REGISTER: 'https://hook.make.com/xxxxx',
    CREATE_ORDER: 'https://hook.make.com/xxxxx',
    ACCEPT_ORDER: 'https://hook.make.com/xxxxx',
    ASSIGN_BALER: 'https://hook.make.com/xxxxx',
    UPDATE_STATUS: 'https://hook.make.com/xxxxx',
    GET_ORDERS: 'https://hook.make.com/xxxxx',
    GET_USERS: 'https://hook.make.com/xxxxx',
  }
};
```

### 2. Enable Webhooks in api.js
```javascript
const USE_WEBHOOKS = true;
```

### 3. Turn All Scenarios ON in Make.com

### 4. Test Each Function
- [ ] Register new account
- [ ] Login
- [ ] Create order
- [ ] Accept order (as farmer)
- [ ] Assign baler
- [ ] Update status

---

## 🐛 Common Issues & Solutions

### Issue 1: "Webhook not found" error
**Solution:** Make sure scenario is turned ON in Make.com

### Issue 2: CORS error
**Solution:** 
1. In Make.com webhook settings
2. Enable "CORS" option
3. Or set "Access-Control-Allow-Origin: *"

### Issue 3: Google Sheets not updating
**Solution:**
1. Check if you gave Make.com permission to access your Google Sheets
2. Verify Sheet Name matches exactly (case-sensitive)
3. Check column letters are correct

### Issue 4: Can't find the row
**Solution:**
- Use Google Sheets "Search Rows" first to get the row number
- Then use "Update a Row" with that row number

---

## 🎥 Visual Flow Diagram

```
Website (api.js)
    ↓
    📡 POST Request
    ↓
Make.com Webhook
    ↓
    🔍 Search/Process Data
    ↓
Google Sheets
    ↓
    📊 Read/Write Data
    ↓
Make.com Response
    ↓
    ✅ JSON Response
    ↓
Website (displays result)
```

---

**Need help with a specific webhook?** Each scenario follows the same basic pattern:
1. Receive webhook data
2. Search/Update Google Sheets
3. Return JSON response

Start with REGISTER and AUTH first - they're the most important!

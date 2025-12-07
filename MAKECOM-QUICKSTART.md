# Make.com Quick Start - Essential Webhooks Only

If you're just getting started, focus on these **3 essential webhooks first**:

---

## ✅ Priority 1: REGISTER (Must Have)

### What it does
Saves new users to Google Sheets when they sign up

### Make.com Setup (5 minutes)

**Modules:**
```
1. Webhook (Custom) → Name: register_user
2. Google Sheets → Search Rows (check if email exists)
3. Router
   Route 1 (if email exists):
     - Webhook Response → {"success": false, "error": "Email taken"}
   Route 2 (if email new):
     - Google Sheets → Add Row to Users sheet
     - Webhook Response → {"success": true, "user": {...}}
```

### Quick Values for "Add Row":
- **A** (user_id): `{{timestamp}}_{{1.user.user_type}}`
- **B** (email): `{{1.user.email}}`
- **C** (password): `{{1.user.password}}`
- **D** (user_type): `{{1.user.user_type}}`
- **E** (full_name): `{{1.user.full_name}}`
- **F** (phone): `{{1.user.phone}}`
- **G** (address): `{{1.user.address}}`
- **H** (created_at): `{{now}}`
- **I** (status): `active`

---

## ✅ Priority 2: AUTH (Must Have)

### What it does
Verifies login credentials

### Make.com Setup (3 minutes)

**Modules:**
```
1. Webhook (Custom) → Name: auth_login
2. Google Sheets → Search Rows in Users
   Filter: email={{1.email}} AND password={{1.password}} AND user_type={{1.user_type}}
3. Router
   Route 1 (if found):
     - Webhook Response → {"success": true, "user": {...}}
   Route 2 (if not found):
     - Webhook Response → {"success": false, "error": "Invalid"}
```

### Response when user found:
```json
{
  "success": true,
  "user": {
    "id": "{{first(2.__IMTARRAY__).A}}",
    "type": "{{first(2.__IMTARRAY__).D}}",
    "name": "{{first(2.__IMTARRAY__).E}}",
    "email": "{{first(2.__IMTARRAY__).B}}",
    "phone": "{{first(2.__IMTARRAY__).F}}",
    "address": "{{first(2.__IMTARRAY__).G}}"
  }
}
```

---

## ✅ Priority 3: CREATE_ORDER (Must Have)

### What it does
Saves new orders to Google Sheets

### Make.com Setup (3 minutes)

**Modules:**
```
1. Webhook (Custom) → Name: create_order
2. Tools → Set Variable (order_id = {{timestamp}}_order)
3. Google Sheets → Add Row to Orders sheet
4. Webhook Response → {"success": true, "order": {...}}
```

### Quick Values for "Add Row":
- **A** (order_id): `{{2.order_id}}`
- **B** (customer_id): `{{1.order.customer_id}}`
- **C** (farmer_id): *(empty)*
- **D** (baler_id): *(empty)*
- **E** (bale_type): `{{1.order.bale_type}}`
- **F** (quantity): `{{1.order.quantity}}`
- **G** (delivery_address): `{{1.order.delivery_address}}`
- **H** (pickup_date): `{{1.order.pickup_date}}`
- **I** (status): `pending`
- **J** (created_at): `{{now}}`
- **K** (notes): `{{1.order.notes}}`

---

## 🎯 Start Here - Step by Step

### Step 1: Prepare Google Sheets (5 minutes)

1. Create spreadsheet: "BaleConnect Database"
2. Create sheet: "Users" with columns A-I
3. Create sheet: "Orders" with columns A-K

### Step 2: Create REGISTER Webhook (10 minutes)

1. Make.com → New Scenario
2. Add Webhook → Copy URL
3. Add Google Sheets Search
4. Add Router with 2 routes
5. Test with your website
6. **Paste URL in utils.js → REGISTER**

### Step 3: Create AUTH Webhook (5 minutes)

1. Make.com → New Scenario
2. Add Webhook → Copy URL
3. Add Google Sheets Search
4. Add Router with 2 routes
5. Test login
6. **Paste URL in utils.js → AUTH**

### Step 4: Create CREATE_ORDER Webhook (5 minutes)

1. Make.com → New Scenario
2. Add Webhook → Copy URL
3. Add Set Variable
4. Add Google Sheets Add Row
5. Test creating order
6. **Paste URL in utils.js → CREATE_ORDER**

### Step 5: Enable Webhooks

In `api.js` line 4:
```javascript
const USE_WEBHOOKS = true;
```

### Step 6: Test!

1. Hard refresh browser (Ctrl+Shift+R)
2. Register a new account → Check Google Sheets
3. Login → Should work
4. Create order → Check Google Sheets

---

## 💡 Pro Tips

### Copy & Paste These Responses

**For Success Response:**
```json
{
  "success": true,
  "user": {
    "id": "{{2.user_id}}",
    "type": "{{1.user.user_type}}",
    "name": "{{1.user.full_name}}"
  }
}
```

**For Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Testing Webhooks in Make.com

1. Click "Run once"
2. Go to your website
3. Perform the action (register, login, etc.)
4. Check Make.com execution history
5. See what data was received

### Common Mistakes

❌ **Forgot to turn scenario ON** → Turn it ON!
❌ **Wrong column letters** → Double check A,B,C...
❌ **Didn't save scenario** → Save it!
❌ **Didn't copy URL to utils.js** → Copy and paste!
❌ **Still have USE_WEBHOOKS=false** → Change to true!

---

## 📊 Google Sheets Column Reference

### Users Sheet (9 columns)
```
A = user_id
B = email
C = password
D = user_type
E = full_name
F = phone
G = address
H = created_at
I = status
```

### Orders Sheet (11 columns)
```
A = order_id
B = customer_id
C = farmer_id
D = baler_id
E = bale_type
F = quantity
G = delivery_address
H = pickup_date
I = status
J = created_at
K = notes
```

---

## 🚀 What's Next?

After these 3 webhooks work, add these optional ones:

**Optional Webhooks:**
- GET_ORDERS (show orders in dashboard)
- ACCEPT_ORDER (farmer accepts job)
- ASSIGN_BALER (farmer assigns baler)
- UPDATE_STATUS (baler updates job status)
- GET_USERS (get list of balers)

See **MAKECOM-SETUP-GUIDE.md** for detailed instructions on these.

---

## ✅ Success Checklist

- [ ] Google Sheets created with correct columns
- [ ] REGISTER scenario created and ON
- [ ] AUTH scenario created and ON
- [ ] CREATE_ORDER scenario created and ON
- [ ] All 3 webhook URLs pasted in utils.js
- [ ] USE_WEBHOOKS = true in api.js
- [ ] Tested registration → works! ✅
- [ ] Tested login → works! ✅
- [ ] Tested create order → works! ✅

**You're done! Your app is now connected to a real database! 🎉**

---

Need detailed help? See **MAKECOM-SETUP-GUIDE.md** for full instructions.

# 🏗️ Coin (Token) System Architecture - Complete Breakdown

## 📊 High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    TASKCONNECT COIN SYSTEM                      │
└─────────────────────────────────────────────────────────────────┘

USER INTERFACE LAYER (Frontend)
├─ Navbar Component
│  ├─ Shows coin balance [🪙 42]
│  └─ Opens premium modal
├─ PremiumFeaturesModal
│  ├─ Display features & costs
│  └─ Unlock buttons
└─ Profile & TaskCard
   ├─ Display premium status
   └─ Show badges

           ↓ HTTP API Calls ↓

API LAYER (Frontend Services)
├─ getTokenBalance()      → GET /api/premium/token-balance
├─ unlockAIResume()       → POST /api/premium/ai-resume-review
├─ unlockPriority()       → POST /api/premium/priority-matching
└─ checkAccess()          → GET /api/premium/check/{feature}

           ↓ FastAPI Routes ↓

APPLICATION LAYER (Backend)
├─ routes/premium.py
│  ├─ API endpoints
│  └─ Request validation
└─ services/premium.py
   ├─ Business logic
   ├─ Token deduction
   └─ Feature access control

           ↓ ORM Queries ↓

DATA LAYER
├─ models.py (User model)
│  ├─ premium_tokens: int
│  └─ is_premium: bool
└─ Database (PostgreSQL)
   └─ users table
```

---

## 🔄 Data Flow Architecture

### **1. User Login Flow**
```
┌─ User Login ─────────────────────────────────────────┐
│                                                       │
├─ Frontend (Navbar.jsx)                              │
│  ├─ User logs in                                     │
│  ├─ Token stored in localStorage                     │
│  └─ useEffect triggered                              │
│                                                       │
├─ Frontend calls getTokenBalance()                   │
│  └─ GET /api/premium/token-balance                   │
│                                                       │
├─ Backend (routes/premium.py)                        │
│  ├─ Extract JWT from Authorization header            │
│  ├─ Validate JWT (using get_current_user)            │
│  └─ Get user from database                           │
│                                                       │
├─ Backend Service (services/premium.py)              │
│  └─ Return user.premium_tokens                       │
│                                                       │
├─ Response to Frontend                               │
│  └─ { balance: 42 }                                  │
│                                                       │
└─ Frontend Display                                    │
   └─ Navbar shows [🪙 42]                            │
```

---

### **2. Unlock Feature Flow**
```
┌─ User Clicks "Unlock AI Resume Review" ────────────────┐
│                                                         │
├─ Frontend (PremiumFeaturesModal.jsx)                  │
│  ├─ Check: tokenBalance (42) >= cost (10) ✓           │
│  └─ POST /api/premium/ai-resume-review                │
│                                                         │
├─ Backend (routes/premium.py)                          │
│  ├─ Extract JWT from Authorization header              │
│  ├─ Validate JWT (get_current_user)                    │
│  ├─ Feature name: "ai_resume_review"                   │
│  └─ Call unlock_premium_feature(user_id, feature)      │
│                                                         │
├─ Business Logic (services/premium.py)                 │
│  ├─ Check TOKEN_COSTS["ai_resume_review"] = 10         │
│  ├─ Get user: user = db.query(User).get(user_id)       │
│  ├─ Validate: user.premium_tokens (42) >= cost (10) ✓  │
│  ├─ Deduct: user.premium_tokens = 42 - 10 = 32        │
│  ├─ Save: db.commit()                                  │
│  └─ Return: { allowed: true, remaining: 32 }           │
│                                                         │
├─ Response (HTTP 200)                                   │
│  └─ { allowed: true, message: "Feature unlocked" }     │
│                                                         │
└─ Frontend Updates                                      │
   ├─ Show ✓ Success message                             │
   ├─ Update tokenBalance to 32                          │
   └─ Close modal after 1.5s                             │
```

---

## 🏛️ System Architecture Components

### **1. DATABASE SCHEMA**
```sql
users table:
┌──────────────────────────────────────────────┐
│ id (PK)          | INTEGER                   │
│ email            | VARCHAR(255) UNIQUE       │
│ name             | VARCHAR(255)              │
│ hashed_password  | VARCHAR(255)              │
│                                              │
│ ← OLD COLUMNS ───────────────────────────    │
│ skills, college_name, bio, phone, rating...  │
│                                              │
│ ← NEW COLUMNS ───────────────────────────    │
│ premium_tokens   | INTEGER DEFAULT 0         │ ◄─ Token balance
│ is_premium       | BOOLEAN DEFAULT false     │ ◄─ Premium status
└──────────────────────────────────────────────┘
```

**Example user data:**
```
id | email           | premium_tokens | is_premium
---|-----------------|----------------|----------
1  | john@gmail.com  | 35             | true
2  | jane@gmail.com  | 0              | false
3  | bob@gmail.com   | 50             | true
```

---

### **2. DATA MODELS (Python)**

**models.py - User Model**
```python
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True)
    name = Column(String(255))
    hashed_password = Column(String(255))

    # ... existing fields ...

    # Premium fields
    premium_tokens = Column(Integer, default=0)  ◄─ Stores coin count
    is_premium = Column(Boolean, default=False)  ◄─ Premium flag
```

---

### **3. API SCHEMAS (Pydantic)**

**schemas.py**
```python
# Request: None needed (uses JWT auth)

# Response schemas:
class TokenBalanceOut(BaseModel):
    balance: int                          # Returns 42

class PremiumFeatureGateOut(BaseModel):
    allowed: bool                         # true/false
    message: str                          # "Feature unlocked"
    remaining_tokens: int = None          # 32 (after deduction)

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    premium_tokens: int = 0               # Added
    is_premium: bool = False              # Added
```

---

### **4. BACKEND ROUTES (API Endpoints)**

**routes/premium.py**
```python
@router.get("/token-balance")
def get_token_balance(current_user):
    # 1. JWT validation ✓
    # 2. Get user.premium_tokens from database
    # 3. Return { balance: 42 }
    return { "balance": current_user.premium_tokens }

@router.post("/ai-resume-review")
def access_ai_resume_review(current_user, db):
    # 1. JWT validation ✓
    # 2. Call unlock_premium_feature(user_id, "ai_resume_review")
    # 3. If success: return { allowed: true }
    # 4. If fail: return 402 Payment Required
    result = unlock_premium_feature(db, current_user.id, "ai_resume_review")
    if not result["allowed"]:
        raise HTTPException(status_code=402)
    return result

@router.post("/priority-matching")
def access_priority_matching(current_user, db):
    # Similar to AI Resume Review
    # Calls: unlock_premium_feature(user_id, "priority_matching")
    pass

@router.get("/check/{feature}")
def check_feature_access(feature: str, current_user):
    # Check if user already has access to feature
    # Return { has_access: true/false }
    pass
```

---

### **5. BUSINESS LOGIC SERVICE**

**services/premium.py**
```python
# Step 1: Define costs
TOKEN_COSTS = {
    "ai_resume_review": 10,      # Costs 10 tokens
    "priority_matching": 5,      # Costs 5 tokens
    "early_access": 0,           # Free (built-in to premium)
}

# Step 2: Unlock feature
def unlock_premium_feature(db, user_id, feature_name):
    # Get feature cost
    cost = TOKEN_COSTS.get(feature_name)
    if cost is None:
        return { "allowed": False, "message": "Feature not found" }

    # Get user from database
    user = db.query(User).get(user_id)
    if not user:
        return { "allowed": False, "message": "User not found" }

    # Check if already unlocked
    if user.features_unlocked.get(feature_name):
        return { "allowed": False, "message": "Already unlocked" }

    # Validate balance
    if user.premium_tokens < cost:
        return {
            "allowed": False,
            "message": f"Insufficient tokens ({cost} needed, {user.premium_tokens} available)"
        }

    # Deduct tokens
    user.premium_tokens -= cost has_access

    # Mark feature as unlocked
    user.features_unlocked[feature_name] = True

    # Save to database
    db.commit()

    # Return success
    return {
        "allowed": True,
        "message": "Feature unlocked!",
        "remaining_tokens": user.premium_tokens
    }

# Step 3: Get balance
def get_user_token_balance(db, user_id):
    user = db.query(User).get(user_id)
    return { "balance": user.premium_tokens }

# Step 4: Add tokens (Admin only)
def add_tokens(db, user_id, amount):
    user = db.query(User).get(user_id)
    user.premium_tokens += amount
    db.commit()
```

**Flow inside `unlock_premium_feature()`:**
```
Input: user_id=1, feature="ai_resume_review"

Step 1: Get feature cost
  TOKEN_COSTS["ai_resume_review"] = 10 tokens

Step 2: Get user from DB
  user = User(id=1, premium_tokens=42, is_premium=true)

Step 3: Validate balance
  42 tokens >= 10 cost ✓ PASS

Step 4: Deduct tokens
  user.premium_tokens = 42 - 10 = 32

Step 5: Save to database
  db.commit()

Output:
  {
    "allowed": true,
    "message": "Feature unlocked!",
    "remaining_tokens": 32
  }
```

---

## 🎨 Frontend Components Architecture

### **1. Navbar Component**
```javascript
// Navbar.jsx
const Navbar = () => {
  // State
  const [tokenBalance, setTokenBalance] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Effect 1: Fetch tokens on login
  useEffect(() => {
    if (token) {
      const { data } = await getTokenBalance();
      setTokenBalance(data.balance);  // 42
    }
  }, [token]);

  // UI: Token button
  return (
    <button onClick={() => setShowPremiumModal(true)}>
      <Coins icon /> {tokenBalance}  {/* Shows: 🪙 42 */}
    </button>
  );
};
```

**Responsibility:**
- ✅ Display token balance
- ✅ Fetch balance on login
- ✅ Open modal on click

---

### **2. Premium Features Modal**
```javascript
// PremiumFeaturesModal.jsx
const PremiumFeaturesModal = ({ tokenBalance, isOpen, onClose }) => {
  // Features to display
  const features = [
    {
      name: "AI Resume Review",
      cost: 10,
      onClick: () => unlockAIResumeReview()
    },
    {
      name: "Priority Matching",
      cost: 5,
      onClick: () => unlockPriorityMatching()
    },
    {
      name: "Early Access",
      cost: 0,
      onClick: null  // Already included with premium
    }
  ];

  // Unlock logic
  const handleUnlock = async (feature) => {
    // Validate: tokenBalance (42) >= cost (10)
    if (tokenBalance < feature.cost) {
      showError("Insufficient tokens");
      return;
    }

    // Call API
    const { data } = await feature.onClick();

    // Update balance
    setTokenBalance(data.remaining_tokens);  // 32

    // Show success
    showSuccess("✓ Feature unlocked!");
  };

  return (
    <Modal isOpen={isOpen}>
      {features.map(f => (
        <Feature>
          <span>{f.name} - {f.cost} coins</span>
          <button
            onClick={() => handleUnlock(f)}
            disabled={tokenBalance < f.cost}
          >
            Unlock
          </button>
        </Feature>
      ))}
    </Modal>
  );
};
```

**Responsibility:**
- ✅ Display feature list with costs
- ✅ Validate balance before unlock
- ✅ Call API to deduct tokens
- ✅ Show success/error messages
- ✅ Update balance display

---

### **3. API Service Functions**
```javascript
// services/api.js
const api = axios.create({ baseURL: "http://localhost:8000/api" });

// Interceptor: Add JWT to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Premium API functions
export const getTokenBalance = () =>
  api.get("/premium/token-balance");
  // Returns: { balance: 42 }

export const unlockAIResumeReview = () =>
  api.post("/premium/ai-resume-review");
  // Returns: { allowed: true, remaining_tokens: 32 }

export const unlockPriorityMatching = () =>
  api.post("/premium/priority-matching");
  // Returns: { allowed: true, remaining_tokens: 37 }
```

**Responsibility:**
- ✅ Make HTTP requests to backend
- ✅ Add JWT authentication
- ✅ Handle errors

---

## 🔐 Security Architecture

### **1. Authentication Layer**
```
User Request:
├─ GET /api/premium/token-balance
├─ Header: Authorization: Bearer eyJhbGc...

Backend:
├─ FastAPI Dependency: get_current_user
├─ Validates JWT signature
├─ Extracts user_id from token
├─ Returns User object
└─ If invalid: Raises 401 Unauthorized
```

**Code:**
```python
from fastapi import Depends
from .auth import get_current_user

@router.get("/token-balance")
def get_token_balance(
    current_user: models.User = Depends(get_current_user)  # JWT validation
):
    return { "balance": current_user.premium_tokens }
```

---

### **2. Authorization Layer**
```
Only authenticated users can:
✓ View their token balance
✓ Unlock premium features
✓ Check feature access

Cannot:
✗ Other users' tokens (JWT prevents this)
✗ Admin functions without admin flag
✗ Deduct tokens below 0 (validation)
```

---

### **3. Token Validation Layer**
```python
# Before any deduction:
if user.premium_tokens < cost:
    # Reject with HTTP 402
    raise HTTPException(
        status_code=402,
        detail="Insufficient tokens"
    )

# Multiple checks:
✓ Feature exists in TOKEN_COSTS
✓ User has enough balance
✓ Feature not already unlocked
✓ Cost > 0 (no free features here)
```

---

## 📈 Request/Response Flow

### **Request: GET /api/premium/token-balance**
```
Frontend:
  Method: GET
  URL: http://localhost:8000/api/premium/token-balance
  Headers: {
    Authorization: "Bearer eyJhbGc...",
    Content-Type: "application/json"
  }

Backend receives:
  1. Extract JWT from header
  2. Validate signature & expiry
  3. Get user_id from JWT (payload.sub)
  4. Query: SELECT * FROM users WHERE id = user_id
  5. Access: user.premium_tokens (database value)

Response (HTTP 200):
  {
    "balance": 42
  }

Frontend:
  setTokenBalance(response.data.balance)
  Display: 🪙 42
```

---

### **Request: POST /api/premium/ai-resume-review**
```
Frontend:
  Method: POST
  URL: http://localhost:8000/api/premium/ai-resume-review
  Headers: {
    Authorization: "Bearer eyJhbGc...",
    Content-Type: "application/json"
  }
  Body: {} (empty, uses JWT for user info)

Backend receives:
  1. Extract JWT & validate
  2. Get user_id from JWT
  3. Call unlock_premium_feature(db, user_id, "ai_resume_review")
     a. TOKEN_COSTS["ai_resume_review"] = 10
     b. Get user from database
     c. Check: premium_tokens (42) >= cost (10) ✓
     d. Deduct: premium_tokens = 42 - 10 = 32
     e. UPDATE users SET premium_tokens=32 WHERE id=user_id
     f. db.commit()
  4. Return result

Response (HTTP 200):
  {
    "allowed": true,
    "message": "Feature unlocked!",
    "remaining_tokens": 32
  }

OR (if insufficient):
Response (HTTP 402):
  {
    "detail": "Insufficient tokens (10 needed, 2 available)"
  }

Frontend:
  if (response.status === 200):
    Show ✓ Success
    Update tokenBalance to 32
  else:
    Show ✗ Error: "Need 10 tokens, you have 2"
```

---

## 📊 Token Economy

### **Token Sources**
```
How users get tokens:

1. Purchase (Real money → Coins)
   ₹99 → 10 tokens
   ₹299 → 35 tokens
   ₹599 → 75 tokens

2. Admin Grant (Admin panels)
   give_tokens(user_id=5, amount=20)

3. Rewards (Events/tasks)
   Complete milestone → +5 tokens
   Refer friend → +10 tokens

4. Initial (New premium signup)
   Buy premium → +50 tokens included
```

### **Token Uses**
```
Token Spending:

Feature               | Cost | Use Case
---------------------|------|------------------------------------
AI Resume Review      | 10   | Get AI feedback on resume
Priority Matching     | 5    | Get better task recommendations
Early Access          | 0    | See tasks 5 min early (premium only)
---------------------|------|------------------------------------
TOTAL POSSIBLE        | 15   | To unlock all features
```

### **Token Cannot Be Used For**
```
❌ Task payments (use ₹ Rupees)
❌ User transfers (no gifting)
❌ Subscriptions (use ₹ Rupees)
❌ General store (everything except premium features)
```

---

## 🔄 Complete System Lifecycle

### **Day 1: User Signs Up**
```
1. User registers
   user.premium_tokens = 0
   user.is_premium = false

2. User can browse normally
   ✗ Can't unlock premium features
   ✗ No token balance displayed
```

### **Day 2: User Buys Premium**
```
1. User makes payment (₹599)
   Payment processor: Stripe/Razorpay

2. Webhook to backend
   add_tokens(user_id=1, amount=75)
   update_premium_status(user_id=1, is_premium=true)

3. Database updated
   user.premium_tokens = 75
   user.is_premium = true

4. Frontend updates
   [🪙 75] now visible in navbar
```

### **Day 3: User Uses Tokens**
```
1. User clicks [🪙 75]
   PremiumFeaturesModal opens

2. User unlocks "AI Resume Review" (10 tokens)
   POST /api/premium/ai-resume-review

3. Backend deducts
   user.premium_tokens = 75 - 10 = 65

4. Feature unlocked
   User can now use AI Resume Review

5. User sees [🪙 65]
   Updated in navbar
```

### **Day 4: User Runs Out**
```
1. User has 3 tokens left
2. Tries to unlock Priority Matching (5 tokens needed)
3. Backend validation: 3 < 5 ✗

4. Error response (HTTP 402)
   "Need 5 tokens, you have 3"

5. User either:
   - Buys more tokens
   - Uses free features only
```

---

## 📁 File Structure

```
backend/
├── app/
│   ├── models.py
│   │   └── User (premium_tokens, is_premium)
│   │
│   ├── schemas.py
│   │   ├── TokenBalanceOut
│   │   └── PremiumFeatureGateOut
│   │
│   ├── routes/
│   │   └── premium.py
│   │       ├── GET /token-balance
│   │       ├── POST /ai-resume-review
│   │       ├── POST /priority-matching
│   │       └── GET /check/{feature}
│   │
│   ├── services/
│   │   └── premium.py
│   │       ├── unlock_premium_feature()
│   │       ├── get_user_token_balance()
│   │       └── add_tokens()
│   │
│   └── main.py
│       └── include_router(premium_routes)
│
├── migrations/
│   └── 001_add_premium_tokens.sql
│       ├── ALTER TABLE users ADD premium_tokens
│       └── ALTER TABLE users ADD is_premium
│
└── database/
    └── PostgreSQL
        └── users table
            ├── id (PK)
            ├── email
            ├── premium_tokens (NEW)
            └── is_premium (NEW)

frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   │   └── Shows [🪙 42]
│   │   │
│   │   └── PremiumFeaturesModal.jsx
│   │       ├── Display features
│   │       └── Unlock buttons
│   │
│   ├── pages/
│   │   ├── Profile.jsx
│   │   │   └── Shows premium_tokens
│   │   │
│   │   └── TaskCard.jsx
│   │       └── Shows premium badge
│   │
│   └── services/
│       └── api.js
│           ├── getTokenBalance()
│           ├── unlockAIResumeReview()
│           ├── unlockPriorityMatching()
│           └── checkPremiumAccess()
```

---

## 🎯 Key Architectural Decisions

| Decision | Why | Result |
|----------|-----|--------|
| **Tokens separate from money** | Clear business model | Tokens = premium only, Money = everything else |
| **Backend validation only** | Security | Can't hack tokens on client |
| **HTTP 402 on insufficient balance** | Standard practice | Clear error communication |
| **Store in database** | Persistence | Balance survives app restarts |
| **JWT authentication** | User identity | Can't access other user's tokens |
| **Immediate deduction** | UX clarity | User sees balance update instantly |
| **Admin add_tokens() function** | Flexibility | Can grant tokens for rewards/purchases |

---

## 🚀 Summary

**Token System Architecture =**
```
User (Frontend)
  ↓
Navbar/Modal (UI)
  ↓
API Service (HTTP)
  ↓
Backend Routes (FastAPI)
  ↓
Business Logic Service (Premium Logic)
  ↓
Database (PostgreSQL)
  ↓
User.premium_tokens + User.is_premium
```

**Token Flow =**
```
User clicks [🪙]
  → Fetch balance from DB
  → Show modal with features
  → User clicks unlock
  → Validate & deduct from DB
  → Update display
  → Done!
```

**Security =**
```
JWT Auth
  ↓
Validates user identity
  ↓
Checks user.premium_tokens
  ↓
Prevents unauthorized deduction
  ↓
Only user's tokens can be deducted
```

Does this explain the architecture clearly? Want me to dive deeper into any component?

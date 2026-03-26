# 🎨 Coin System - Visual Architecture Diagrams

## 1️⃣ System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    USER/BROWSER                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Frontend React App                                   │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌───────────────┐   │  │
│  │  │ Navbar   │  │   Premium    │  │   Profile     │   │  │
│  │  │ [🪙 42]  │→ │   Modal      │→ │ [👑 Tokens]   │   │  │
│  │  └──────────┘  └──────────────┘  └───────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────┬──────────────────────────────────────┘
                        │ HTTPS
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND SERVER                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  FastAPI Application                                  │  │
│  │                                                        │  │
│  │  Middleware Layer:                                    │  │
│  │  ├─ CORS (allow frontend)                             │  │
│  │  ├─ JWT Auth (validate requests)                      │  │
│  │  └─ Error Handling                                    │  │
│  │                                                        │  │
│  │  Router Layer (routes/premium.py):                    │  │
│  │  ├─ GET  /token-balance      → Get balance            │  │
│  │  ├─ POST /ai-resume-review   → Unlock (10 tokens)     │  │
│  │  ├─ POST /priority-matching  → Unlock (5 tokens)      │  │
│  │  └─ GET  /check/{feature}    → Check access           │  │
│  │                                                        │  │
│  │  Service Layer (services/premium.py):                 │  │
│  │  ├─ unlock_premium_feature()  ← Main logic            │  │
│  │  ├─ get_user_token_balance()  ← Query balance         │  │
│  │  ├─ add_tokens()              ← Admin function        │  │
│  │  └─ validate_balance()        ← Check available       │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────┬──────────────────────────────────────┘
                        │ SQL
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE                                  │
│  PostgreSQL                                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ users table                                           │  │
│  │  id | email | premium_tokens | is_premium            │  │
│  │  1  | j@... | 42            | true                   │  │
│  │  2  | m@... | 0             | false                  │  │
│  │  3  | b@... | 65            | true                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ Request Flow Diagram

```
USER ACTION: Click "Unlock AI Resume Review"
                        │
                        ↓
┌───────────────────────────────────┐
│  Frontend PremiumFeaturesModal.jsx│
│                                   │
│  Check: tokenBalance (42) >= 10 ✓ │
│                                   │
│  POST /premium/ai-resume-review   │
│  Header: Authorization: Bearer... │
└───────────────────────────────────┘
                        │
                        ↓ HTTPS
┌───────────────────────────────────┐
│  Backend Request Handler          │
│  routes/premium.py                │
│                                   │
│  1. Extract JWT from header       │
│  2. Validate JWT signature        │
│  3. Get user_id from JWT          │
│  4. Call unlock_premium_feature() │
└───────────────────────────────────┘
                        │
                        ↓
┌───────────────────────────────────┐
│  Business Logic Service           │
│  services/premium.py              │
│                                   │
│  Step 1: Get feature cost         │
│  TOKEN_COSTS["ai_resume_review"]  │
│  → 10 tokens                      │
│                                   │
│  Step 2: Get user from DB         │
│  SELECT * FROM users WHERE id=1   │
│  → User(premium_tokens=42)        │
│                                   │
│  Step 3: Validate balance         │
│  42 >= 10? ✓ YES                  │
│                                   │
│  Step 4: Deduct tokens            │
│  UPDATE users                     │
│  SET premium_tokens = 32          │
│  WHERE id = 1                     │
│                                   │
│  Step 5: Return success           │
│  { allowed: true, ... }           │
└───────────────────────────────────┘
                        │
                        ↓
┌───────────────────────────────────┐
│  Database                         │
│  UPDATE users                     │
│  SET premium_tokens = 32          │
│                                   │
│  Old: 42 tokens                   │
│  New: 32 tokens                   │
│  Deducted: 10 tokens              │
└───────────────────────────────────┘
                        │
                        ↓
┌───────────────────────────────────┐
│  Response (HTTP 200)              │
│                                   │
│  {                                │
│    "allowed": true,               │
│    "message": "Unlocked!",        │
│    "remaining_tokens": 32         │
│  }                                │
└───────────────────────────────────┘
                        │
                        ↓
┌───────────────────────────────────┐
│  Frontend               │
│  ✓ Show success        │
│  🪙 Update to 32       │
│  Close modal           │
└───────────────────────────────────┘
```

---

## 3️⃣ Component Interaction Map

```
                    FRONTEND
        ┌─────────────────────────────┐
        │                             │
┌──────────────┐         ┌─────────────────────────┐
│   Navbar     │─────→   │  PremiumFeaturesModal   │
│ [🪙 42]      │ click   │  [Unlock buttons]       │
│              │         │                         │
│ useEffect:   │         │  onClick:               │
│ getTokenBal()│         │  ├─ Check balance       │
└──────────────┘         │  ├─ Call API            │
        │                │  ├─ Update state        │
        │                │  └─ Show message        │
        │                │                         │
        │                └─────────────────────────┘
        │                        │
        │                        ↓
        │                ┌───────────────┐
        │                │  services/api │
        │                │  getTokenB()  │
        │                │  unlockAI()   │
        │                │  unlockPrio() │
        └────────→────────└───────────────┘
                                │
                                ↓ HTTPS
                    ┌───────────────────────┐
                    │   BACKEND             │
                    │  routes/premium.py    │
                    │                       │
                    │  GET  /token-balance  │
                    │  POST /ai-resume...   │
                    │  POST /priority...    │
                    └────────┬──────────────┘
                             │
                             ↓ SQL
                    ┌───────────────────────┐
                    │  Database             │
                    │  users table          │
                    │  premium_tokens ←────→
                    │  is_premium           │
                    └───────────────────────┘
```

---

## 4️⃣ Token Lifecycle

```
┌───────────────────────────────────────────────────────────────┐
│                    TOKEN LIFECYCLE                            │
└───────────────────────────────────────────────────────────────┘

PHASE 1: ACQUISITION
┌─────────────────────────────────┐
│ User buys premium (₹599)        │
│ Payment processor processes     │
│ Webhook to backend              │
│ add_tokens(user_id=1, 75)       │
│                                 │
│ Result:                         │
│ user.premium_tokens = 75        │
│ user.is_premium = true          │
└─────────────────────────────────┘

PHASE 2: DISPLAY
┌─────────────────────────────────┐
│ Frontend loads                  │
│ getTokenBalance()               │
│ UI shows: [🪙 75]               │
│                                 │
│ User can see balance anytime    │
└─────────────────────────────────┘

PHASE 3: USAGE
┌─────────────────────────────────┐
│ User clicks [🪙 75]             │
│ Opens PremiumFeaturesModal      │
│ Shows 3 features                │
│                                 │
│ Feature Costs:                  │
│ • AI Resume Review: 10          │
│ • Priority Matching: 5          │
│ • Early Access: 0               │
└─────────────────────────────────┘
            ↓
┌─────────────────────────────────┐
│ User unlocks "AI Resume Review" │
│ Deducts: 75 - 10 = 65           │
│                                 │
│ Database updated:               │
│ user.premium_tokens = 65        │
│                                 │
│ Frontend shows: [🪙 65]          │
└─────────────────────────────────┘

PHASE 4: DEPLETION
┌─────────────────────────────────┐
│ User continues unlocking...     │
│                                 │
│ After unlocking all features:   │
│ 65 - 5 (priority) = 60          │
│                                 │
│ If balance < feature cost:      │
│ "Insufficient tokens (HTTP 402)"│
│ User must buy more              │
└─────────────────────────────────┘

PHASE 5: REPLENISHMENT (Optional)
┌─────────────────────────────────┐
│ User buys more tokens (₹199)    │
│ add_tokens(user_id=1, 25)       │
│                                 │
│ Balance: 60 + 25 = 85           │
│ Premium features available      │
└─────────────────────────────────┘
```

---

## 5️⃣ Security Layers

```
┌───────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                  │
└───────────────────────────────────────────────────────────┘

LAYER 1: TRANSPORT SECURITY
┌──────────────────────────────────┐
│ HTTPS/TLS Encryption             │
│                                  │
│ Client Request:                  │
│ POST /api/premium/ai-resume-review
│ (encrypted over HTTPS)           │
│                                  │
│ Server Response:                 │
│ { "allowed": true, ... }         │
│ (encrypted)                      │
└──────────────────────────────────┘

LAYER 2: AUTHENTICATION
┌──────────────────────────────────┐
│ JWT Token Validation             │
│                                  │
│ Header:                          │
│ Authorization: Bearer eyJs...    │
│                                  │
│ Backend:                         │
│ 1. Extract token                 │
│ 2. Verify signature              │
│ 3. Check expiry                  │
│ 4. Get user_id from payload      │
│                                  │
│ If invalid: HTTP 401 Unauthorized
└──────────────────────────────────┘

LAYER 3: USER VALIDATION
┌──────────────────────────────────┐
│ Verify User Exists               │
│                                  │
│ Get user_id from JWT             │
│ Query: SELECT * FROM users       │
│        WHERE id = user_id        │
│                                  │
│ If not found: HTTP 404 Not Found │
└──────────────────────────────────┘

LAYER 4: BALANCE VALIDATION
┌──────────────────────────────────┐
│ Check Sufficient Balance         │
│                                  │
│ Get user.premium_tokens          │
│ Get feature cost from TOKEN_COSTS│
│                                  │
│ if balance < cost:               │
│   Return HTTP 402 Payment Required
│                                  │
│ if balance >= cost:              │
│   Proceed to deduction           │
└──────────────────────────────────┘

LAYER 5: ATOMIC DATABASE OPERATION
┌──────────────────────────────────┐
│ Transaction: All or Nothing      │
│                                  │
│ 1. Get user (SELECT)             │
│ 2. Calculate new balance         │
│ 3. Update database (UPDATE)      │
│ 4. Commit transaction            │
│                                  │
│ If any step fails:               │
│ ROLLBACK (undo all)              │
│                                  │
│ Result: No partial updates       │
└──────────────────────────────────┘

LAYER 6: RESPONSE VALIDATION
┌──────────────────────────────────┐
│ Check Response Data              │
│                                  │
│ Backend returns:                 │
│ { "allowed": true,               │
│   "remaining_tokens": 65 }       │
│                                  │
│ Frontend validates:              │
│ ✓ "allowed" is boolean           │
│ ✓ "remaining_tokens" is int      │
│                                  │
│ If invalid: Show error           │
└──────────────────────────────────┘
```

---

## 6️⃣ Failure Scenarios

```
SCENARIO 1: User has insufficient tokens
┌─────────────────────────────────────────┐
│ User: 5 tokens                          │
│ Feature: AI Resume (costs 10)           │
│                                         │
│ Request: POST /ai-resume-review         │
│                                         │
│ Backend Check: 5 < 10 ✗                 │
│                                         │
│ Response: HTTP 402 Payment Required     │
│ {                                       │
│   "detail": "Insufficient tokens"       │
│ }                                       │
│                                         │
│ Frontend: Show error message            │
│ "Need 10 tokens, you have 5"           │
│ Balance unchanged: 5 tokens             │
└─────────────────────────────────────────┘

SCENARIO 2: Invalid JWT token
┌─────────────────────────────────────────┐
│ Request: GET /token-balance             │
│ Header: Authorization: Bearer INVALID   │
│                                         │
│ Backend: JWT validation fails           │
│                                         │
│ Response: HTTP 401 Unauthorized         │
│ {                                       │
│   "detail": "Invalid token"             │
│ }                                       │
│                                         │
│ Frontend: Redirect to login             │
└─────────────────────────────────────────┘

SCENARIO 3: Feature not found
┌─────────────────────────────────────────┐
│ Request: POST /unknown-feature          │
│                                         │
│ Backend: TOKEN_COSTS["unknown"] = None  │
│                                         │
│ Response: HTTP 400 Bad Request          │
│ {                                       │
│   "detail": "Feature not found"         │
│ }                                       │
│                                         │
│ Frontend: Show error                    │
└─────────────────────────────────────────┘

SCENARIO 4: Database error
┌─────────────────────────────────────────┐
│ During token deduction, DB fails        │
│                                         │
│ Backend:                                │
│ try:                                    │
│   UPDATE users SET premium_tokens=...  │
│   db.commit()                           │
│ except DbError:                         │
│   db.rollback()                         │
│   raise HTTP 500                        │
│                                         │
│ Response: HTTP 500 Internal Server Error│
│                                         │
│ Result: No tokens deducted (rollback)   │
│ Balance unchanged                       │
└─────────────────────────────────────────┘
```

---

## 7️⃣ Data Transformation Pipeline

```
DATABASE STORAGE
┌─────────────────────────────────┐
│ PostgreSQL                      │
│ premium_tokens: INTEGER         │
│ is_premium: BOOLEAN             │
│ Raw value: 42 (int)             │
└─────────────────────────────────┘
         │
         ↓ ORM Layer (SQLAlchemy)
┌─────────────────────────────────┐
│ User Model                      │
│ user.premium_tokens = 42        │
│ user.is_premium = True          │
└─────────────────────────────────┘
         │
         ↓ Schema Layer (Pydantic)
┌─────────────────────────────────┐
│ TokenBalanceOut                 │
│ balance: int                    │
│ Validates data type             │
└─────────────────────────────────┘
         │
         ↓ JSON Serialization
┌─────────────────────────────────┐
│ HTTP Response                   │
│ {                               │
│   "balance": 42                 │
│ }                               │
└─────────────────────────────────┘
         │
         ↓ HTTPS Transmission
┌─────────────────────────────────┐
│ Frontend Receives               │
│ response.data = {               │
│   balance: 42                   │
│ }                               │
└─────────────────────────────────┘
         │
         ↓ React State
┌─────────────────────────────────┐
│ useState                        │
│ tokenBalance = 42               │
│ Triggers re-render              │
└─────────────────────────────────┘
         │
         ↓ UI Display
┌─────────────────────────────────┐
│ Navbar Button                   │
│ <Coins /> 42                    │
│ Shows: 🪙 42                    │
└─────────────────────────────────┘
```

---

## 8️⃣ Comparison: Before vs After

```
BEFORE: No Token System
┌──────────────────────────────┐
│ Navbar                       │
│ [Dashboard] [Create] [Profile]
│ (No token display)           │
│                              │
│ No premium features          │
│ No special access            │
│ All users equal              │
└──────────────────────────────┘

AFTER: With Token System
┌──────────────────────────────┐
│ Navbar                       │
│ [🪙 42] [Dashboard] [Create] │
│  ↑                           │
│  Clickable token display     │
│                              │
│ Premium features available   │
│ Early access for premium     │
│ Different user tiers         │
└──────────────────────────────┘

BENEFITS:
✓ Clear token display
✓ Easy feature unlocking
✓ Monetizable premium features
✓ Fair pricing (transparent costs)
✓ Admin token grants  (rewards/purchases)
✓ Separate from real money
```

---

## Summary: Architecture at a Glance

```
TOKEN SYSTEM =

┌─────────────────┐
│  User (Browser) │  ← Sees [🪙 42] in navbar
└────────┬────────┘
         │
    ┌────↓────────────────────────┐
    │   Frontend Components        │  ← UI layer
    │ • Navbar (display balance)   │
    │ • Modal (unlock features)    │
    │ • Profile (show tokens)      │
    └────┬────────────────────────┘
         │
    ┌────↓────────────────────────┐
    │   API Service Layer          │  ← HTTP client
    │ • getTokenBalance()          │
    │ • unlockAIResumeReview()     │
    │ • unlockPriorityMatching()   │
    └────┬────────────────────────┘
         │ HTTPS
    ┌────↓────────────────────────┐
    │   Backend Routes             │  ← API endpoints
    │ • GET /token-balance         │
    │ • POST /ai-resume-review     │
    │ • POST /priority-matching    │
    └────┬────────────────────────┘
         │
    ┌────↓────────────────────────┐
    │   Business Logic             │  ← Token deduction
    │ • unlock_premium_feature()   │
    │ • validate_balance()         │
    │ • deduct_tokens()            │
    └────┬────────────────────────┘
         │ SQL
    ┌────↓────────────────────────┐
    │   Database                   │  ← Storage
    │ users.premium_tokens = 42    │
    │ users.is_premium = true      │
    └────────────────────────────┘
```

**That's the complete architecture!** 🎉

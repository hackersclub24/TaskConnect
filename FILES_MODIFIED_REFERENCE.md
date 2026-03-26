# 📁 Files Modified - Quick Reference

## 🔴 BACKEND FILES (5 main + 1 migration)

### 1️⃣ `backend/app/models.py`
**What:** User model
**Change:** Added 2 new columns
```python
# ADDED:
premium_tokens: int = 0
is_premium: bool = False
```
**Lines:** ~10 lines added
**Impact:** Database stores token info

---

### 2️⃣ `backend/app/schemas.py`
**What:** API response formats (DTOs)
**Changes:** Added 2 new schema classes
```python
# ADDED:
class TokenBalanceOut(BaseModel):
    balance: int

class PremiumFeatureGateOut(BaseModel):
    has_access: bool
    message: str

# MODIFIED UserOut to include:
premium_tokens: int
is_premium: bool
```
**Lines:** ~15 lines added
**Impact:** API responses have correct format

---

### 3️⃣ `backend/app/services/premium.py` ⭐ **NEW FILE**
**What:** Core premium logic
**Contains:**
```python
def deduct_tokens(user_id, cost) → Deducts tokens
def grant_premium_access(user_id) → Sets is_premium
def add_tokens(user_id, amount) → Admin token grant
def check_feature_access(user_id, feature) → Validates access
```
**Lines:** ~80 lines
**Impact:** All token business logic here

---

### 4️⃣ `backend/app/routes/premium.py` ⭐ **NEW FILE**
**What:** Premium API endpoints
**Endpoints:**
```
GET  /api/premium/token-balance
POST /api/premium/ai-resume-review
POST /api/premium/priority-matching
GET  /api/premium/check/{feature}
```
**Lines:** ~100 lines
**Impact:** User accesses premium features through these

---

### 5️⃣ `backend/app/routes/tasks.py`
**What:** Task listing route
**Change:** Added early access logic
```python
# ADDED logic:
if user.is_premium:
    tasks = tasks.filter(created_at >= now - 5 minutes)
else:
    tasks = tasks.filter(created_at >= now)
```
**Lines:** ~8 lines modified
**Impact:** Premium users see tasks 5 min early

---

### 6️⃣ `backend/migrations/001_add_premium_tokens.sql` ⭐ **MIGRATION**
**What:** Database changes
```sql
ALTER TABLE users ADD COLUMN premium_tokens INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT false;
```
**Lines:** 8 lines
**Impact:** Creates columns in database

---

## 🔵 FRONTEND FILES (5 main)

### 1️⃣ `frontend/src/services/api.js`
**What:** API communication
**Changes:** Added 4 new functions
```javascript
// ADDED:
export const getTokenBalance() → Fetch user tokens
export const unlockAIResumeReview() → Unlock feature
export const unlockPriorityMatching() → Unlock feature
export const checkPremiumAccess(feature) → Check access
```
**Lines:** +19 lines
**Impact:** Frontend talks to premium endpoints

---

### 2️⃣ `frontend/src/components/Navbar.jsx`
**What:** Top navigation bar
**Changes:**
```jsx
// ADDED imports:
import { Coins } from "lucide-react"
import PremiumFeaturesModal from "./PremiumFeaturesModal"

// ADDED state:
const [tokenBalance, setTokenBalance] = useState(null)
const [showPremiumModal, setShowPremiumModal] = useState(false)

// ADDED useEffect to fetch tokens
useEffect(() => {
  if (token) {
    const { data } = await getTokenBalance()
    setTokenBalance(data.balance)
  }
}, [token])

// ADDED UI:
<button onClick={() => setShowPremiumModal(true)}>
  <Coins /> {tokenBalance}
</button>

// ADDED component:
<PremiumFeaturesModal ... />
```
**Lines:** +50 lines
**Impact:** Shows token balance, opens modal

---

### 3️⃣ `frontend/src/pages/Profile.jsx`
**What:** User profile page
**Changes:** Added premium tokens display
```jsx
// ADDED imports:
import { Coins, Crown } from "lucide-react"

// ADDED conditional UI:
{user.is_premium && (
  <div>Premium Tokens: {user.premium_tokens}</div>
)}
```
**Lines:** +15 lines
**Impact:** Profile shows token count (for premium users)

---

### 4️⃣ `frontend/src/components/TaskCard.jsx`
**What:** Task display card
**Changes:** Added premium badge
```jsx
// ADDED import:
import { Crown } from "lucide-react"

// ADDED badge:
{task.premium_early_access && (
  <span>
    <Crown /> PREMIUM ACCESS
  </span>
)}
```
**Lines:** +8 lines
**Impact:** Premium tasks show golden crown badge

---

### 5️⃣ `frontend/src/components/PremiumFeaturesModal.jsx` ⭐ **NEW FILE**
**What:** Modal dialog for unlocking features
**Contains:**
```jsx
// Shows 3 features:
1. AI Resume Review (10 tokens)
2. Priority Task Matching (5 tokens)
3. Early Task Access (free)

// Handles:
- Token balance display
- Unlock button clicks
- Token validation
- Error messages
- Success messages
```
**Lines:** ~210 lines
**Impact:** User interface for buying premium features

---

## 📊 Summary Table

| File | Type | Change | Lines |
|------|------|--------|-------|
| `models.py` | Backend | Modified | +10 |
| `schemas.py` | Backend | Modified | +15 |
| `services/premium.py` | Backend | NEW | 80 |
| `routes/premium.py` | Backend | NEW | 100 |
| `routes/tasks.py` | Backend | Modified | +8 |
| `migrations/001_...sql` | Backend | NEW | 8 |
| `api.js` | Frontend | Modified | +19 |
| `Navbar.jsx` | Frontend | Modified | +50 |
| `Profile.jsx` | Frontend | Modified | +15 |
| `TaskCard.jsx` | Frontend | Modified | +8 |
| `PremiumFeaturesModal.jsx` | Frontend | NEW | 210 |
| **TOTAL** | - | - | **~513 lines** |

---

## 🎯 What Each File Does

### Backend Flow:
```
routes/premium.py (API Endpoints)
    ↓ calls ↓
services/premium.py (Business Logic)
    ↓ uses ↓
models.py (User model)
    ↓ stores in ↓
Database (premium_tokens, is_premium)
```

### Frontend Flow:
```
Navbar.jsx (Shows token balance)
    ↓ calls ↓
api.js (API functions)
    ↓ triggers ↓
PremiumFeaturesModal.jsx (User unlocks features)
    ↓ updates ↓
Profile.jsx & TaskCard.jsx (Display premium info)
```

---

## 🔍 Files to Review in Order

**Essential (Read These First):**
1. `backend/services/premium.py` - Understand token logic
2. `frontend/components/PremiumFeaturesModal.jsx` - See UI
3. `backend/routes/premium.py` - See API endpoints

**Important (Read These Second):**
4. `backend/models.py` - See data model
5. `frontend/src/services/api.js` - See API calls
6. `frontend/src/components/Navbar.jsx` - See integration

**Reference (Keep for Reference):**
7. `frontend/src/pages/Profile.jsx` - Premium display
8. `frontend/src/components/TaskCard.jsx` - Task badge
9. `backend/migrations/001_...sql` - Database schema

---

## ✅ Changes Needed to Work

### Backend:
- [ ] Apply migration SQL to database
- [ ] Verify all routes imported in `app/main.py`
- [ ] Test endpoints work

### Frontend:
- [ ] Run `npm install` (if new packages needed)
- [ ] Run `npm run dev`
- [ ] Check for errors in console

### Database:
- [ ] Run migration
- [ ] Verify `premium_tokens` and `is_premium` columns exist
- [ ] Check users table structure

---

## 📋 Files NOT Changed

These files are unchanged (reference only):
- `backend/app/auth.py` - Authentication logic
- `backend/app/main.py` - Main app file (may need imports)
- `frontend/src/pages/Dashboard.jsx` - Dashboard
- `frontend/src/pages/Login.jsx` - Login
- `frontend/index.html` - HTML entry point

---

## 🎓 Key Points

1. **Most important file:** `backend/services/premium.py`
   - Contains all token logic
   - Validates balance
   - Deducts tokens
   - Grants access

2. **User-facing file:** `frontend/components/PremiumFeaturesModal.jsx`
   - Beautiful modal UI
   - Shows features & costs
   - Handles unlock process

3. **Integration file:** `backend/routes/tasks.py`
   - Implements early access
   - Premium users see tasks 5 min early

4. **Database file:** `migrations/001_add_premium_tokens.sql`
   - Creates columns
   - Must be run first

---

## 🚀 Deployment Order

1. Run database migration
2. Deploy backend code
3. Deploy frontend code
4. Test in browser

---

**Everything you need to understand the changes is documented!** 🎉

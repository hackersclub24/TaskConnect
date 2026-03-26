# 🚀 Frontend Token System - Integration Guide

## ✅ What's Been Done (Frontend)

### Components Updated/Created:
1. **Navbar** - Displays token balance, opens premium modal
2. **Profile** - Shows premium token count
3. **TaskCard** - Shows premium access badge
4. **PremiumFeaturesModal** (NEW) - Unlock premium features with tokens

### API Functions Added:
```javascript
- getTokenBalance()
- unlockAIResumeReview()
- unlockPriorityMatching()
- checkPremiumAccess(feature)
```

---

## 🔄 Next Steps to Get It Working

### 1️⃣ Apply Database Migration
Run this SQL on your PostgreSQL database:

```bash
cd backend
psql -U postgres -d taskconnect -f migrations/001_add_premium_tokens.sql
```

Or manually run:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_tokens INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;
```

**Verify:**
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name='users' AND column_name IN ('premium_tokens', 'is_premium');
```

### 2️⃣ Check Backend Endpoints
Verify these endpoints exist and work:

```bash
# Test token balance
GET http://localhost:8000/api/premium/token-balance
(requires auth header)

# Test unlock features
POST http://localhost:8000/api/premium/ai-resume-review
POST http://localhost:8000/api/premium/priority-matching
```

### 3️⃣ Start Frontend
```bash
cd frontend
npm run dev
```

### 4️⃣ Test in Browser

**Scenario 1: View Token Balance**
- Login to app
- Look for 🪙 icon in navbar top-right
- Should show: `🪙 42` (or your token count)

**Scenario 2: Open Premium Modal**
- Click the token balance button
- Modal should open with 3 features
- Should show current balance at top

**Scenario 3: Attempt Unlock**
- If you have ≥10 tokens, click "Unlock" on AI Resume Review
- Button should show "Processing..."
- On success: ✓ message appears
- Token count should decrease
- On error: Error message displayed

**Scenario 4: View Profile**
- Go to your profile
- If `is_premium` = true, you'll see "Premium Tokens" card
- Shows your token count

**Scenario 5: View Task Badge**
- Find a task with `premium_early_access` = true
- Card should show yellow 👑 "PREMIUM ACCESS" badge

---

## 📊 Data Flow Diagram

```
┌─────────────────┐
│  Frontend App   │
└────────┬────────┘
         │
         ├─→ GET /api/premium/token-balance
         │   ← { balance: 42 }
         │
         ├─→ [Show 🪙 42 in Navbar]
         │
         └─→ User clicks 🪙
             │
             ├─→ PremiumFeaturesModal opens
             │   Shows 3 features + costs
             │
             └─→ User clicks "Unlock"
                 ├─→ POST /api/premium/ai-resume-review
                 │   Body: {}
                 │
                 ← { success: true, tokens_remaining: 32 }
                 │
                 ├─→ Show ✓ Success message
                 ├─→ Update local token balance
                 └─→ Close modal after 1.5s
```

---

## 🐛 Troubleshooting

### Issue: Token balance shows as `null`

**Solutions:**
1. Check if user is logged in (`localStorage.getItem('token')`)
2. Verify backend endpoint returns: `{ balance: 42 }`
3. Check browser console for API errors
4. Verify JWT token in Authorization header is valid

### Issue: Premium modal doesn't open

**Solutions:**
1. Check if `showPremiumModal` state exists in Navbar
2. Verify button has `onClick={() => setShowPremiumModal(true)}`
3. Check browser console for JavaScript errors

### Issue: Unlock button is disabled

**Solutions:**
1. Check if `tokenBalance < cost` (e.g., 5 < 10)
2. Verify token balance fetched correctly
3. Add test tokens via backend admin (if available)

### Issue: API returns 402 Payment Required

**This is expected!** Backend is saying:
- Not enough tokens
- Feature already unlocked
- User is not premium

Check the error message in the modal.

---

## 🎯 Feature Costs

| Feature | Cost | Notes |
|---------|------|-------|
| AI Resume Review | 10 tokens | One-time unlock |
| Priority Task Matching | 5 tokens | One-time unlock |
| Early Task Access | FREE | Built into `is_premium` status |

---

## 📱 Responsive Behavior

| Screen | Token Display | Modal |
|--------|---------------|-------|
| Mobile (< 640px) | 🪙 only | Full width with padding |
| Tablet (640-1024px) | 🪙 42 | Centered, max-w-2xl |
| Desktop (> 1024px) | 🪙 42 | Centered, max-w-2xl |

---

## 🔐 Security Implemented

✅ Token validation before deduction
✅ Authorization header required (Bearer token)
✅ HTTP 402 Payment Required for insufficient balance
✅ No client-side token manipulation
✅ Backend validates all transactions

---

## 📋 Testing Checklist

- [ ] Database migration applied
- [ ] Backend endpoints returning correct data
- [ ] Token balance displays in navbar
- [ ] Clicking navbar token opens modal
- [ ] Modal shows 3 features with correct costs
- [ ] Can unlock AI Resume Review (10 tokens)
- [ ] Can unlock Priority Matching (5 tokens)
- [ ] Error shows if insufficient balance
- [ ] Success message appears on unlock
- [ ] Profile shows premium tokens if is_premium=true
- [ ] TaskCard shows crown badge if premium_early_access=true
- [ ] Dark mode styling works
- [ ] Mobile responsive

---

## 🎨 UI Preview

### Navbar with Token Balance
```
[☀️] [🪙 42]  [Dashboard] [Create] [Profile] [Leaderboard] ...
```

### Premium Modal
```
┌─ 👑 Premium Features ─────────────────────┐
│ Your Balance: 42 tokens                   │
├─────────────────────────────────────────┤
│ 🧠 AI Resume Review                      │
│ Get AI-powered feedback on your resume  │
│                                      -10 │
│                               [Unlock]   │
├─────────────────────────────────────────┤
│ ✨ Priority Task Matching                │
│ Get matched with high-paying tasks first│
│                                     -5   │
│                               [Unlock]   │
├─────────────────────────────────────────┤
│ ⚡ Early Task Access                     │
│ View tasks 5 minutes before others   FREE│
│                            [Included]    │
└─────────────────────────────────────────┘
```

---

## 📞 Support Commands

```bash
# Check if backend is running
curl http://localhost:8000/api/auth/me
# (should return 401 or user data)

# Check if frontend is running
curl http://localhost:5173
# (should return HTML)

# View database columns
psql -U postgres -d taskconnect -c "SELECT * FROM users LIMIT 1;"
```

---

**Status**: Frontend implementation complete ✅
**Ready for**: Backend API testing
**Timeline**: Deploy when backend endpoints verified

# Quick Start Guide - Auth & Utilities

## 🚀 Getting Started

### Installation
```bash
npm install
npm run check      # Verify TypeScript
npm run dev        # Start dev server (both client & server)
npm run dev:client # Client only (port 5173)
```

### First Run
1. Navigate to http://localhost:5173
2. Click "Sign Up" to create account
3. Email + password (min 8 chars)
4. You're logged in! Session persists across:
   - ✅ Page refresh (F5)
   - ✅ New tab (same domain)
   - ✅ Browser restart
   - ✅ New device (same session)

---

## 🔐 Authentication

### How It Works
```
Sign Up/Login
    ↓
Server creates session (httpOnly cookie)
    ↓
Client auth state synced from server
    ↓
Auth persists automatically
    ↓
Logout clears server session
```

### Key Points
- ✅ No localStorage auth data
- ✅ Passwords hashed with bcrypt (10 salt rounds)
- ✅ Session-based (expires in 7 days)
- ✅ httpOnly cookies (secure)
- ✅ Works across devices

### Testing Auth
```bash
1. Sign up with test account
2. Refresh page (F5) → Still logged in ✓
3. Open new tab → Still logged in ✓
4. Close browser → Session survives ✓
5. Logout → Can't access dashboard ✓
```

---

## 💱 Currency Converter

### Access
- Header: Click **$** icon (right side)
- Any page with amount input: Calculator button appears

### Features
1. **From/To Currencies**: USD, INR, EUR, GBP, JPY, AUD, CAD, CHF
2. **Preset Amounts**: $100, $500, $1000 buttons
3. **Swap**: Reverse currencies with one click
4. **Copy**: Copy result to clipboard
5. **Apply**: Fill form field with converted amount

### Example Workflow
```
1. Open UtilityPanel ($ icon)
2. Select: From USD → To INR
3. Enter: 1000
4. See: ₹83,250 (approx)
5. Click "Apply" → Auto-fills form
6. Or click "Copy" → Paste elsewhere
```

---

## 🧮 Mini Calculator

### Access
- UtilityPanel → Calculator tab
- Quick Add Transaction → Calculator icon (amount field)

### Operations
| Button | Function |
|--------|----------|
| +, −, ×, ÷ | Math operations |
| % | Percentage |
| = | Calculate |
| Clear | Reset |
| Add Tip | Add tip %  (0-50%) |
| Split Bill | Divide by party count |

### Example: Tip Calculator
```
Amount: 500
Slider: Set to 18%
Click "Add Tip"
Result: 590 (500 + 90 tip)
```

### Example: Split Bill
```
Amount: 1000
Party: 3 people
Click "Split Bill"
Result: 333.33 each
```

---

## 🔗 Integration Points

### QuickAddTransaction (Dashboard)
```
Input amount field has calculator icon (right side)
Click → Opens calculator modal
Result auto-fills amount
Perfect for: Calculating splits, adjusting taxes
```

### FinancialTools (Loan/Savings Planner)
```
Scroll to bottom → Currency Converter widget
Enter amount in one currency
Converts instantly
"Apply" button → Fills loan/investment amount
Perfect for: Cross-currency comparisons
```

### Header (Everywhere)
```
Right side header → $ icon
Opens UtilityPanel (tabbed interface)
Converter & Calculator tabs
Works on mobile (sidebar sheet)
```

---

## 💾 Data Storage

### Users
```
Location: server/data/users.json
Format: JSON array
Persists: Across server restarts
```

### Exchange Rates
```
Source: exchangerate.host (free)
Cache: 1 hour in memory
Fallback: Uses last successful rate on API error
```

### Session
```
Type: Express-session
Storage: Memory store (MemoryStore)
Expires: 7 days (configurable)
Cookie: httpOnly, secure, sameSite=lax
```

---

## 🛠️ Development Tips

### Enable Debug Mode
```typescript
// In client/src/components/CurrencyConverter.tsx
// Add console.log for rate updates:
console.log('Rate updated:', rate, 'Cache:', cacheStatus);
```

### Clear Exchange Rate Cache
```bash
# Restart dev server to clear memory cache
# (rates are cached for 1 hour)
```

### Test Cross-Device Auth
```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Simulate new user session
curl http://localhost:3000/api/auth/me
# Returns: 401 Unauthorized ✓

# Open browser, sign up
# curl again with cookies:
curl -b 'connect.sid=...' http://localhost:3000/api/auth/me
# Returns: 200 with user data ✓
```

---

## 🐛 Troubleshooting

### "Auth not persisting"
- Clear browser cookies → Try again
- Check server is running (`npm run dev`)
- Verify `SESSION_SECRET` env var is set

### "Currency conversion fails"
- Check internet connection
- exchangerate.host may be down (shows cached rate)
- Try different currency pair

### "Calculator shows wrong result"
- Multiply/divide operations: clear and start fresh
- Decimal operations use safe rounding (±0.01)
- For huge numbers, consider scientific notation

### "Form not accepting converter result"
- Make sure you clicked "Apply" button
- Check form field is the active converter target
- Manually copy-paste if apply fails

---

## 🔒 Security Checklist

- ✅ Passwords hashed (bcrypt 10 rounds)
- ✅ No plain passwords in logs
- ✅ Sessions httpOnly (no JS access)
- ✅ CSRF protection via session (can be added)
- ✅ Rate limiting (can be added)
- ✅ Input validation (email, password, currency codes)
- ✅ No sensitive data in localStorage
- ✅ HTTPS recommended (trust proxy enabled)

---

## 📊 Monitoring

### Check Auth Status
```bash
# User logged in?
curl -b cookies.txt http://localhost:3000/api/auth/me

# Get user info
curl -H "Cookie: connect.sid=..." http://localhost:3000/api/auth/me
```

### Check Exchange Rates
```bash
# Fetch rates
curl "http://localhost:3000/api/exchange-rates?base=USD&symbols=INR,EUR"

# Response includes cache status:
{
  "base": "USD",
  "rates": { "INR": 83.25, "EUR": 0.92 },
  "cacheStatus": "HIT",
  "timestamp": 1704351236000,
  "provider": "exchangerate.host"
}
```

---

## 📖 API Reference

### Authentication
```
POST /api/auth/signup
  body: { email, password, name? }
  response: { user: {...} }

POST /api/auth/login
  body: { email, password }
  response: { user: {...} }

GET /api/auth/me
  response: { user: {...} }

POST /api/auth/logout
  response: { message: "..." }
```

### Exchange Rates
```
GET /api/exchange-rates?base=USD&symbols=INR,EUR,GBP
  response: { base, rates, timestamp, provider, cacheStatus }

POST /api/convert
  body: { amount, from, to }
  response: { from, to, amount, converted, rate, timestamp, provider }
```

---

## ✨ Best Practices

1. **Always use the utility panel** for currency conversions
2. **Logout before switching users** (clears session properly)
3. **Check cache status** in converter (HIT = fast, MISS = fresh)
4. **Use calculator for splits** (more accurate than mental math)
5. **Copy large amounts** to verify in converter (decimal safety)

---

## 🎓 Learning Resources

- [Express Sessions](https://expressjs.com/en/resources/middleware/session.html)
- [Bcrypt Hashing](https://github.com/kelektiv/node.bcrypt.js)
- [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- [Decimal Math](https://en.wikipedia.org/wiki/Floating-point_arithmetic)
- [Exchange Rates API](https://exchangerate.host)

---

Happy coding! 🚀

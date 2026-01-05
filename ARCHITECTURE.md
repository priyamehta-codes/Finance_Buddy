# 🎯 Architecture & Flow Diagrams

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  App Component                                               │
│  └─ useEffect: fetch('/api/auth/me') on mount               │
│     └─ If 401: user stays null (redirect to /auth)         │
│     └─ If 200: setUser(data.user) → unlock dashboard      │
│                                                               │
│  Protected Routes                                           │
│  └─ Check: useStore.isAuthenticated                       │
│  └─ Redirect to /auth if false                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                             ↕ (credentials: 'include')
┌─────────────────────────────────────────────────────────────┐
│                   EXPRESS SERVER                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  POST /api/auth/signup                                       │
│  ├─ Validate input (zod)                                    │
│  ├─ Hash password (bcrypt 10 rounds)                        │
│  ├─ Create session                                          │
│  └─ Return user (no password)                              │
│                                                               │
│  POST /api/auth/login                                        │
│  ├─ Find user by email                                      │
│  ├─ Verify password (bcrypt)                                │
│  ├─ Create session                                          │
│  └─ Return user                                             │
│                                                               │
│  GET /api/auth/me                                            │
│  ├─ Check session.userId exists                             │
│  └─ Return user or 401                                      │
│                                                               │
│  POST /api/auth/logout                                       │
│  └─ Destroy session                                         │
│                                                               │
│  ┌─ Session Storage ─┐                                      │
│  │ connect.sid       │ → httpOnly cookie                    │
│  │ userId            │                                      │
│  │ email             │                                      │
│  │ name              │                                      │
│  └───────────────────┘                                      │
│                                                               │
│  ┌─ User Storage ─────────────┐                             │
│  │ server/data/users.json      │                            │
│  │ [                           │                            │
│  │  { id, email, name, pwd }   │ ← bcrypt hashed            │
│  │ ]                           │                            │
│  └─────────────────────────────┘                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Currency Converter Flow

```
┌────────────────────────────────────────┐
│     UtilityPanel ($ Button)            │
│     ┌──────────────────────────────┐   │
│     │ [Converter] [Calculator]     │   │
│     └──────────────────────────────┘   │
│                                        │
│  CurrencyConverter Component           │
│  ├─ From: [USD ▼]  Swap  To: [INR ▼] │
│  ├─ Amount: [1000]                    │
│  ├─ Presets: [100] [500] [1000]       │
│  ├─ Result: ₹83,250.00                │
│  ├─ Buttons:                          │
│  │  [Copy]  [Apply to Form]          │
│  └─ Rate info: USD:INR = 83.25        │
│     "Hit cache • Updated 30m ago"      │
│     "exchangerate.host"                │
│                                        │
└────────────────────────────────────────┘
         ↕
┌────────────────────────────────────────┐
│    Exchange Rate Caching              │
├────────────────────────────────────────┤
│                                        │
│  Client Request:                       │
│  GET /api/exchange-rates?base=USD...  │
│                                        │
│      ↓                                 │
│                                        │
│  Server Cache Check:                   │
│  - Key: "USD:INR,EUR,GBP"             │
│  - In cache? Yes → return HIT          │
│  - Expired? (1hr TTL) → fetch fresh   │
│                                        │
│      ↓                                 │
│                                        │
│  Provider Call (if needed):            │
│  https://api.exchangerate.host/latest |
│  ?base=USD&symbols=INR,EUR            │
│                                        │
│      ↓                                 │
│                                        │
│  Response:                             │
│  {                                     │
│    base: "USD",                        │
│    rates: { INR: 83.25, EUR: 0.92 },  │
│    cacheStatus: "HIT",                 │
│    timestamp: 1704351236000,           │
│    provider: "exchangerate.host"       │
│  }                                     │
│                                        │
└────────────────────────────────────────┘
```

---

## Mini Calculator Flow

```
┌─────────────────────────────────────┐
│   MiniCalculator Component          │
├─────────────────────────────────────┤
│                                     │
│  Display: [1500]                    │
│                                     │
│  Buttons Grid:                      │
│  ┌─────────────────────────────┐    │
│  │ 7  8  9  ÷  │               │    │
│  │ 4  5  6  ×  │               │    │
│  │ 1  2  3  -  │               │    │
│  │ 0  .  =  +  │               │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Clear]                            │
│                                     │
│  ┌─ Tip Calculator ─────────────┐  │
│  │ Tip: 18%  [●─────────────]  │  │
│  │ [Add Tip] → Adds to total    │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌─ Split Bill ──────────────────┐ │
│  │ Split Among:  [-] [2] [+]     │ │
│  │ [Split Bill] → Per person     │ │
│  └──────────────────────────────┘ │
│                                     │
│  [Apply to Form] ← if callback    │
│                                     │
└─────────────────────────────────────┘
```

---

## Data Flow: Quick Add → Calculator → Form

```
Dashboard
│
├─ QuickAddTransaction
│  │
│  ├─ Amount Input [____]
│  │  └─ Calculator Icon [🧮] ← NEW!
│  │     │
│  │     └─ onClick: Open Sheet
│  │        │
│  │        └─ MiniCalculator
│  │           ├─ User calculates: 1000 / 3 = 333.33
│  │           └─ Click [Apply]
│  │              │
│  │              └─ onResult callback
│  │                 │
│  │                 └─ setAmount("333.33")
│  │                    │
│  │                    └─ Form auto-fills! ✓
│  │
│  ├─ [Submit] → Add transaction
│  │
│  └─ Transaction added to store
│
└─ Dashboard updates with new transaction
```

---

## File Structure

```
Finance_Buddy-main/
│
├── server/
│   ├── index.ts                    ← Express setup, sessions
│   ├── routes.ts                   ← Auth + Exchange endpoints
│   ├── storage.ts                  ← User persistence (bcrypt)
│   ├── exchange-rates.ts           ← NEW! Rate caching logic
│   └── data/
│       └── users.json              ← User database
│
├── shared/
│   └── schema.ts                   ← Zod validation (auth)
│
├── client/src/
│   ├── App.tsx                     ← Auth check on mount
│   │
│   ├── lib/
│   │   ├── store.ts                ← Zustand store (no localStorage auth)
│   │   └── currency-utils.ts       ← NEW! Currency formatting utils
│   │
│   ├── components/
│   │   ├── CurrencyConverter.tsx    ← NEW! Main converter widget
│   │   ├── MiniCalculator.tsx       ← NEW! Calculator widget
│   │   ├── UtilityPanel.tsx         ← NEW! Container panel
│   │   │
│   │   ├── layout/
│   │   │   └── Header.tsx           ← Added UtilityPanel button
│   │   │
│   │   └── dashboard/
│   │       └── QuickAddTransaction.tsx ← Added calculator button
│   │
│   └── pages/
│       ├── Auth.tsx                ← Fixed localStorage deps
│       └── FinancialTools.tsx       ← Added converter widget
│
└── Documentation/
    ├── AUTHENTICATION_AND_UTILITIES.md     ← Technical details
    ├── QUICK_START.md                      ← Getting started
    └── IMPLEMENTATION_COMPLETE.md          ← Summary
```

---

## Component Dependencies

```
App
├─ Router
│  ├─ Auth (signup/login)
│  ├─ Dashboard
│  │  └─ QuickAddTransaction
│  │     └─ [Calculator] → MiniCalculator
│  ├─ Transactions
│  ├─ MoneyTransfer
│  ├─ FinancialTools
│  │  └─ CurrencyConverter ← NEW!
│  └─ Settings
│
Layout (all pages)
└─ Header
   ├─ [$ button] → UtilityPanel ← NEW!
   │  ├─ CurrencyConverter
   │  └─ MiniCalculator
   └─ [Currency selector dropdown]
```

---

## Session Lifecycle

```
┌─ SIGNUP ─────────────────────────┐
│                                  │
│ User → Sign Up Form              │
│ ↓                               │
│ POST /api/auth/signup           │
│ ├─ Validate (email, password)  │
│ ├─ Hash password (bcrypt)       │
│ ├─ Save to users.json           │
│ ├─ Create session               │
│ └─ Set cookie: connect.sid      │
│ ↓                               │
│ Client: setUser(data.user)      │
│ ↓                               │
│ Redirect to /dashboard          │
│                                  │
└──────────────────────────────────┘

┌─ LOGIN ──────────────────────────┐
│                                  │
│ User → Login Form                │
│ ↓                               │
│ POST /api/auth/login            │
│ ├─ Find user by email           │
│ ├─ Verify password (bcrypt)    │
│ ├─ Create session               │
│ └─ Set cookie: connect.sid      │
│ ↓                               │
│ Client: setUser(data.user)      │
│ ↓                               │
│ Redirect to /dashboard          │
│                                  │
└──────────────────────────────────┘

┌─ REFRESH ────────────────────────┐
│                                  │
│ User: F5 (refresh page)          │
│ ↓                               │
│ App.tsx useEffect fires         │
│ ↓                               │
│ GET /api/auth/me                │
│ ├─ Check: session.userId?       │
│ ├─ Find user in store           │
│ └─ Return user (or 401)         │
│ ↓                               │
│ Client: setUser(data.user)      │
│ ↓                               │
│ User stays logged in! ✓         │
│                                  │
└──────────────────────────────────┘

┌─ LOGOUT ─────────────────────────┐
│                                  │
│ User: Click Logout button        │
│ ↓                               │
│ POST /api/auth/logout           │
│ ├─ Destroy session              │
│ ├─ Clear cookie                 │
│ └─ Return success               │
│ ↓                               │
│ Client: logout() → setUser(null)│
│ ↓                               │
│ Redirect to /auth               │
│                                  │
└──────────────────────────────────┘
```

---

## Type Safety

```typescript
// Authentication
interface User {
  id: string
  email: string          // UNIQUE
  name: string
  password: string       // HASHED (bcrypt)
}

// Session
req.session.userId?: string
req.session.email?: string
req.session.name?: string

// Currency
type Currency = 'USD' | 'INR' | 'EUR' | 'GBP' | ...

// Exchange Rates
interface RateResponse {
  base: string
  rates: Record<string, number>
  timestamp: number
  provider: string
  cacheStatus: 'HIT' | 'MISS'
}

// Conversion
interface ConversionResult {
  from: string
  to: string
  amount: number
  converted: number      // Math.round(amount * rate * 100) / 100
  rate: number
  timestamp: number
  provider: string
}
```

---

## Error Handling

```
User Input
│
├─ Client Validation (Zod)
│  └─ Invalid? → Inline error message
│
└─ Valid → Send to server
   │
   ├─ Server Validation
   │  └─ Invalid? → 400 with message
   │
   ├─ Business Logic
   │  ├─ Email exists? → 400
   │  ├─ Password wrong? → 401
   │  └─ User not found? → 404
   │
   ├─ External API (rates)
   │  ├─ Connection error? → Use stale cache
   │  └─ Invalid response? → Error response
   │
   └─ Success → 200 with data
      │
      └─ Client updates UI
```

---

## Caching Strategy

```
Time: 00:00              06:00              12:00
      │                  │                  │
      ├─ GET rates       ├─ GET rates       ├─ GET rates
      │  Cache MISS      │  Cache HIT       │  Cache HIT
      │  FETCH API       │  Return cached   │  Return cached
      │  STORE (TTL)     │                  │
      │                  │                  │
      └─ EXPIRES 01:00 ──┴─ EXPIRES 07:00 ──┴─ EXPIRES 13:00

If API fails at 06:00 and cached expired at 06:30:
      └─ Return STALE cache with "fallback" status
         (Better than no data)
```

---

This architecture is:
✅ Secure (bcrypt, httpOnly, no localStorage)
✅ Scalable (modular components, clean separation)
✅ Maintainable (clear data flows, type-safe)
✅ User-friendly (non-intrusive utilities, great UX)
✅ Production-ready (error handling, caching, validation)

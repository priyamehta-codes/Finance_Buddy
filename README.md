# Finance_Buddy
# 💰 FinTrack - Personal Finance Manager

A modern, intuitive personal finance tracking application to help you manage your money better.

## 🚀 Live Demo

**[View Live App →](https://finance-buddy-ujvf.onrender.com)**

> Note: First load may take ~30 seconds (free tier cold start). Once loaded, it's fast!

---
 
## ✨ Features

- **Dashboard Overview** - See your complete financial picture at a glance
- **Transaction Management** - Track income and expenses with search & filtering
- **Money Tracking** - Keep tabs on money you owe and money owed to you
- **Spending Limits** - Set monthly budgets and track progress
- **Multi-Currency Support** - USD, EUR, GBP, INR
- **Financial Tools** - Interest calculator for loans and investments
- **Smart Notifications** - Get alerts for due payments and spending limits
- **Responsive Design** - Works beautifully on desktop and mobile

---

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (Build tool)
- Tailwind CSS
- shadcn/ui components
- Zustand (State management)
- Recharts (Data visualization)

**Backend:**
- Express.js
- Node.js
- localStorage (Client-side persistence)

---

## 🏃 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/rupesh1787/Finance_Buddy.git

# Navigate to project directory
cd Finance_Buddy

# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:5001` to see the app running locally.

---

## 📦 Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Run production server
npm run check      # Type checking
```

---

## 🚀 Deployment

This app is deployed on [Render](https://render.com).

To deploy your own instance:

1. Fork this repository
2. Sign up on [Render.com](https://render.com)
3. Create a new Web Service
4. Connect your forked repository
5. Use these settings:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
6. Deploy!





## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🔐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | **Required for Render.** PostgreSQL connection string for persistent sessions | - |
| `SESSION_SECRET` | **Required.** Random 32+ char secret for session signing | `finance-buddy-secret-key-change-in-prod` |
| `NODE_ENV` | Set to `production` on Render | `development` |
| `EXCHANGE_RATE_PROVIDER_URL` | Base URL for exchange rate API | `https://api.exchangerate.host` |
| `CACHE_TTL` | Exchange rate cache TTL in ms | `3600000` (1 hour) |
| `GOOGLE_AI_API_KEY` | (Optional) Gemini API key for AI insights | - |

### Render Deployment Setup

1. **Create a PostgreSQL database** on Render (free tier available)
2. **Copy the Internal Database URL** from Render's database dashboard
3. **Add these environment variables** to your Web Service:
   - `DATABASE_URL` = (paste the Internal Database URL)
   - `SESSION_SECRET` = (generate with `openssl rand -hex 32`)
   - `NODE_ENV` = `production`
4. Sessions will persist across deploys and server restarts

---

## ✅ QA Testing Checklist

### Currency Preference Persistence
- [ ] Log in and change currency (header dropdown)
- [ ] Refresh page → currency should persist
- [ ] Open new tab → same currency preference
- [ ] Log out and back in → currency restored

### Categories
- [ ] Add expense → "Food / Eating Out" category available
- [ ] Add income → "Side Gig" and "Passive Income" categories available
- [ ] Categories display correct colors

### Dashboard Search
- [ ] Type in header search bar → dropdown appears after 300ms
- [ ] Results show description, date, amount
- [ ] Click result → navigate to Transactions page
- [ ] Clear search → results disappear

### Currency Converter
- [ ] Open sidebar converter → enter amount
- [ ] Swap currencies works
- [ ] Copy result → shows toast "Copied $X.XX"
- [ ] Disconnect network → shows "Using cached rate" warning
- [ ] Apply to form → amount appears in Quick Add

### Quick Calculator
- [ ] Basic math: 10 + 5 = 15, handles decimals correctly
- [ ] Tip calculator: Add 15% tip to $100 → $115
- [ ] Split: $100 ÷ 4 = $25 per person
- [ ] Apply to form → fills Quick Add amount field
- [ ] Keyboard shortcuts work (Enter = equals, C = clear)

### Tools & Money Transfer Navigation
- [ ] Click "Tools" in sidebar → opens Financial Tools page
- [ ] Click "Money Transfer" → opens Money Flow page
- [ ] Both pages load without errors
- [ ] Tab toggles (To Pay / To Receive) work with glow effect

### UI Polish
- [ ] To Pay / To Receive tabs: taller, with glow on active
- [ ] Colors: green for income, red for expenses
- [ ] Mobile responsive: sidebar collapses, search hidden

---

## �📄 License

This project is licensed under the MIT License.

---

## 👤 Author

**Rupesh**

- GitHub: [@rupesh1787](https://github.com/rupesh1787)

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Recharts](https://recharts.org/) for data visualization

---

## 📞 Support

If you have any questions or issues, please [open an issue](https://github.com/rupesh1787/Finance_Buddy/issues).

---

**Built with ❤️ for better financial management**

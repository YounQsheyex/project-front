# Inventory & Sales Management System — Frontend

Vite + React + Tailwind CSS

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# For production, set VITE_API_URL to your deployed backend URL
```

### 3. Start dev server
```bash
npm run dev
# Runs on http://localhost:5173
# API calls to /api are proxied to http://localhost:5000 (vite.config.js)
```

### 4. Build for production
```bash
npm run build
# Output in /dist — deploy to Vercel, Netlify, or any static host
```

---

## 📁 Project Structure

```
inventory-frontend/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
└── src/
    ├── main.jsx               # React entry point
    ├── App.jsx                # Routes
    ├── index.css              # Tailwind + global styles
    ├── context/
    │   └── AuthContext.jsx    # Auth state (JWT)
    ├── utils/
    │   ├── api.js             # Axios instance
    │   └── helpers.js         # Formatting utilities
    ├── components/
    │   └── Layout/
    │       └── Layout.jsx     # Sidebar + topbar
    └── pages/
        ├── Login.jsx
        ├── Register.jsx
        ├── Dashboard.jsx      # KPI cards + charts
        ├── Inventory.jsx      # Product CRUD + stock adjust
        ├── Sales.jsx          # Sales history
        ├── NewSale.jsx        # POS-style sale entry
        ├── Reports.jsx        # P&L charts + analytics
        ├── Expenses.jsx       # Expense tracking
        ├── Suppliers.jsx
        ├── Categories.jsx
        └── Profile.jsx
```

---

## 🌍 Deploying to Vercel / Netlify

### Vercel
```bash
npm install -g vercel
vercel
# Set VITE_API_URL environment variable in Vercel dashboard
```

### Netlify
```bash
npm run build
# Drag and drop /dist folder to Netlify
# Or connect GitHub repo and set:
#   Build command: npm run build
#   Publish directory: dist
# Set VITE_API_URL in Netlify environment variables
```

### Important: SPA Routing
For Netlify, create `public/_redirects`:
```
/*  /index.html  200
```

For Vercel, create `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## 🔑 Default Login

After running `npm run seed` on the backend:
- **Email:** admin@inventory.com
- **Password:** password123

---

## ✨ Features

- **Dashboard** — Real-time KPIs, revenue/profit trends, stock alerts
- **Inventory** — Full product CRUD, stock adjustments, profit margin calculator
- **Sales (POS)** — Product search, cart, discounts, tax, payment tracking
- **Reports & P&L** — Automated Profit & Loss with date range filtering
- **Expenses** — Track operational costs by category
- **Suppliers & Categories** — Manage vendors and product categorization
- **Role-based access** — Admin / Manager / Staff permissions

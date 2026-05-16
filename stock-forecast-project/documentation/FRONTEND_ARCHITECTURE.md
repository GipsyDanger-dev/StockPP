# Frontend Architecture - Stock Forecast Application

## 🏗️ Arsitektur Keseluruhan

Frontend menggunakan **React 18 dengan Vite** sebagai build tool dan state management. Aplikasi dibangun dengan pendekatan **modular component-based** dan modern JavaScript ecosystem.

---

## 📚 Tech Stack

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **React** | 18.2.0 | UI Library |
| **Vite** | 5.0.0 | Build Tool & Dev Server |
| **Tailwind CSS** | 3.3.0 | Utility-first CSS Framework |
| **React Query** | 5.25.0 | Server State Management |
| **Axios** | 1.6.0 | HTTP Client |
| **Recharts** | 2.10.0 | Chart Library |
| **Lucide React** | 0.292.0 | Icon Library |
| **date-fns** | 2.30.0 | Date Manipulation |

---

## 🗂️ Struktur Folder

```
frontend/
├── public/                  # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Header.jsx      # Navigation & search
│   │   ├── Footer.jsx      # App footer
│   │   ├── PriceChart.jsx  # Chart components
│   │   ├── Common.jsx      # Common UI elements (KPI, Badge, etc)
│   │   └── index.js        # Export components
│   ├── pages/              # Page-level components
│   │   └── Dashboard.jsx   # Main dashboard page
│   ├── hooks/              # Custom React hooks
│   │   └── useApi.js       # API-related hooks (useForecast, useHistoricalData, etc)
│   ├── services/           # API service layer
│   │   └── apiService.js   # Axios configuration & API calls
│   ├── utils/              # Utility functions
│   │   └── formatting.js   # Date, currency, percentage formatting
│   ├── App.jsx             # Root component with React Query provider
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── index.html              # HTML template
├── package.json            # Dependencies & scripts
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── postcss.config.js       # PostCSS configuration
```

---

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────┐
│                   App Component                     │
│         (React Query Provider + State Mgmt)         │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───▼────┐    ┌────▼────┐   ┌────▼────┐
    │ Header │    │ Sidebar │   │Dashboard│
    └────┬───┘    └────┬────┘   └────┬────┘
         │             │             │
         └─────────────┼─────────────┘
                       │
         ┌─────────────▼──────────────┐
         │  Custom Hooks (useApi.js)  │
         │  - useForecast             │
         │  - useHistoricalData       │
         │  - useMetrics              │
         │  - useValidateTicker       │
         └─────────────┬──────────────┘
                       │
         ┌─────────────▼──────────────┐
         │   React Query (TanStack)   │
         │  - Caching & Stale Time    │
         │  - Retry Logic             │
         │  - Background Sync         │
         └─────────────┬──────────────┘
                       │
         ┌─────────────▼──────────────┐
         │   API Service (apiService) │
         │  - Axios Client            │
         │  - Request/Response        │
         │    Interceptors            │
         └─────────────┬──────────────┘
                       │
         ┌─────────────▼──────────────┐
         │   Backend API              │
         │  http://localhost:8000     │
         └────────────────────────────┘
```

---

## 📦 Daftar File & Penjelasan

### **Root Configuration Files**

| File | Fungsi |
|------|--------|
| `vite.config.js` | Konfigurasi Vite (dev server, proxy API) |
| `tailwind.config.js` | Konfigurasi Tailwind CSS (custom colors) |
| `postcss.config.js` | PostCSS config untuk Tailwind |
| `package.json` | Dependencies & scripts npm |
| `index.html` | Template HTML utama |

### **Source Code - src/**

#### **Entry Points**
```
main.jsx         → ReactDOM.createRoot() - entry point aplikasi
App.jsx          → Root component dengan QueryClientProvider
index.css        → Global styles (Tailwind directives)
```

#### **Components - src/components/**
```
Header.jsx       → Navigation bar + ticker search + API status indicator
Footer.jsx       → Footer komponen (normal & compact version)
PriceChart.jsx   → Chart components (Area, Bar, Mini chart)
Common.jsx       → Reusable UI components:
                   - KPICard: Kartu KPI metrics
                   - MetricBadge: Badge untuk nilai metrik
                   - StatusBadge: Status indicator (online/offline)
                   - Skeleton: Loading state placeholder
                   - ErrorAlert & SuccessAlert: Notifikasi
index.js         → Export semua components
```

#### **Pages - src/pages/**
```
Dashboard.jsx    → Halaman utama dashboard dengan:
                   - Price chart
                   - Forecast data
                   - Historical data
                   - Model metrics
```

#### **Hooks - src/hooks/**
```
useApi.js        → Custom hooks untuk data fetching:
                   - useForecast(ticker, daysAhead, period)
                   - useHistoricalData(ticker, days)
                   - useMetrics(ticker)
                   - useValidateTicker(ticker)
                   - useHealth() → Check API status
                   
                   Semua menggunakan React Query dengan:
                   - Query caching
                   - Stale time management
                   - Error handling & retry
```

#### **Services - src/services/**
```
apiService.js    → HTTP client layer dengan Axios:
                   - getForecast()
                   - getHistoricalData()
                   - getMetrics()
                   - validateTicker()
                   - Health check endpoint
                   
                   Features:
                   - Request/response logging
                   - Error interception
                   - Base URL configuration
                   - Timeout handling (30s)
```

#### **Utils - src/utils/**
```
formatting.js    → Helper functions untuk formatting:
                   - formatDate(date)
                   - formatCurrency(value)
                   - formatPercent(value)
                   - calculateChange(oldValue, newValue)
                   - roundTo(value, decimals)
```

---

## 🔌 API Integration

### **Base URL**
```javascript
http://localhost:8000/api/v1
```

### **API Endpoints yang Digunakan**
```
POST   /api/v1/forecast              → Get price forecast
GET    /api/v1/historical/{ticker}   → Get historical data
GET    /api/v1/metrics/{ticker}      → Get model metrics
GET    /api/v1/validate/{ticker}     → Validate ticker symbol
GET    /api/v1/health                → Check API health
```

---

## 🎨 Styling & UI

### **CSS Framework**
- **Tailwind CSS 3.3.0** untuk utility-first styling
- **Custom color palette** (Slate theme)
- **Responsive design** dengan mobile-first approach

### **Components UI**
- Icons dari **Lucide React**
- Charts dari **Recharts** (area chart, bar chart)
- KPI cards & badges untuk data visualization

---

## ⚙️ Dev Server Configuration

### **Vite Dev Server**
- Port: `5173`
- Hot Module Replacement (HMR): Enabled
- API Proxy: `/api` → `http://localhost:8000`

### **Build Output**
- Output directory: `dist/`
- Sourcemap: Disabled di production

---

## 📝 Scripts Tersedia

```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Build untuk production
npm run preview  # Preview production build
npm run lint     # ESLint check
```

---

## 🔄 State Management Strategy

### **React Query (Server State)**
- Mengelola data dari server API
- Automatic caching & synchronization
- Stale time: 5-10 minutes tergantung endpoint
- Retry otomatis: 2 kali pada error

### **React State (Client State)**
- `selectedTicker`: Ticker yang dipilih user
- `selectedPeriod`: Period historis (1y, 3y, 5y, etc)
- `selectedDays`: Jumlah hari forecast
- `sidebarOpen`: Status sidebar mobile

---

## 🚀 Deployment Notes

1. **Build**: `npm run build` → menghasilkan `dist/` folder
2. **Environment**: Set `VITE_API_URL` untuk backend URL berbeda
3. **Proxy**: Vite dev server proxy API ke backend
4. **Production**: Serve `dist/` folder dengan web server static (nginx, etc)

---

## 📊 Performance Optimizations

✅ React Query caching  
✅ Lazy loading dengan React.lazy()  
✅ Vite-based fast build  
✅ Tailwind CSS optimization  
✅ Request batching & deduplication  
✅ Image optimization possible with Vite  

---

**Last Updated**: May 16, 2026

# StockPP - Complete Project Documentation

## Overview

**StockPP** is an autonomous financial forecasting agent that automates the full machine learning lifecycle for stock market analysis. The system uses LSTM (Long Short-Term Memory) neural networks to predict stock prices, with a complete web interface for users and administrators.

**Brand Name:** Precision Analytics (UI display only)
**Project Name:** StockPP

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)               │
│  Landing │ Dashboard │ Analytics │ Admin │ Auth          │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API (31 endpoints)
┌──────────────────────┴──────────────────────────────────┐
│               BACKEND (FastAPI + Python)                 │
│  Forecasting │ Model Manager │ Data Engine │ Scheduler   │
└──────┬───────────────┬────────────────┬─────────────────┘
       │               │                │
  ┌────┴────┐   ┌──────┴──────┐  ┌─────┴─────┐
  │ yfinance│   │  Supabase   │  │  Finnhub  │
  │(History)│   │(DB+Auth+    │  │(Real-time)│
  │         │   │ Storage)    │  │           │
  └─────────┘   └─────────────┘  └───────────┘
```

---

## Tech Stack

### Backend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | FastAPI 0.104.1 | REST API server |
| ML Engine | TensorFlow 2.14 / Keras | LSTM neural network |
| Preprocessing | Scikit-learn 1.3.2 | MinMaxScaler normalization |
| Data | Pandas 2.1.1 / NumPy 1.24.3 | Data manipulation |
| Stock Data | yfinance | Historical prices (Yahoo Finance) |
| Real-time | Finnhub API | Live quotes and ticker search |
| Database | Supabase (PostgreSQL) | Persistent storage |
| Auth | Supabase Auth | User authentication |
| Email | Resend API | OTP delivery |
| WhatsApp | Twilio | OTP delivery (alternative) |

### Frontend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | React 18 + Vite 5 | SPA with HMR |
| Routing | React Router v7 | Client-side navigation |
| Data Fetching | TanStack Query v5 | API caching + 16 hooks |
| Charts | Recharts | Price and indicator visualization |
| Styling | Tailwind CSS 3 | Utility-first CSS |
| Icons | Lucide React | Icon library |
| Auth Client | Supabase JS | Authentication |
| Animations | GSAP + ScrollTrigger | Scroll-driven animations |
| 3D | Three.js / React Three Fiber | 3D hero scene |

---

## Database Schema (6 Tables)

### 1. `tickers`
Stock symbols and metadata.
- **PK:** `symbol` (TEXT)
- **Columns:** name, sector, country, is_active, last_trained_at, timestamps
- **Seed data:** AAPL, MSFT, NVDA, TSLA, GOOGL, BBCA.JK, PLTR, AMD

### 2. `training_logs`
Model training history and audit trail.
- **PK:** `id` (UUID)
- **FK:** `ticker` → tickers
- **Columns:** report_name, rmse, mae, r_square, accuracy, training_samples, status, error_message

### 3. `model_metadata`
Model versioning and configuration.
- **PK:** `id` (UUID)
- **FK:** `ticker` → tickers
- **Columns:** model_version, epochs, batch_size, sequence_length, model_path, scaler_path

### 4. `articles`
CMS content for market insights.
- **PK:** `id` (UUID)
- **Columns:** title, content, category, summary, author, status (draft/published), images, tags

### 5. `otp_codes`
Password reset OTP codes.
- **PK:** `id` (UUID)
- **Columns:** email, code, delivery_method, phone_number, expires_at, used

### 6. `prediction_history`
Per-user prediction tracking and validation.
- **PK:** `id` (UUID)
- **FK:** `user_id` → Supabase Auth users
- **Columns:** ticker, current_price, predicted_prices (JSONB), actual_prices (JSONB), trend, direction_correct, status

### Storage Buckets
- `models` - .keras model files and .pkl scaler files
- `articles` - Article images (header, thumbnail, inline)

---

## ML Model Architecture

### LSTM Network
```
Input: (20 timesteps x 6 features)
  ↓
LSTM(50 units, return_sequences=True) + Dropout(0.2)
  ↓
LSTM(50 units, return_sequences=True) + Dropout(0.2)
  ↓
LSTM(50 units) + Dropout(0.2)
  ↓
Dense(1) → Next day closing price
```

### 6 Input Features
1. **Close price** - Daily closing price
2. **Volume** - Trading volume
3. **MA20** - 20-day moving average
4. **MA50** - 50-day moving average
5. **RSI** - 14-day Relative Strength Index
6. **MACD** - 12/26 EMA crossover

### Training Configuration
| Parameter | Value |
|-----------|-------|
| Auto-train epochs | 70 |
| Manual retrain epochs | 10 |
| Batch size | 32 |
| Window size | 20 days |
| Train/test split | 80/20 |
| Validation split | 0.2 |
| Scaler | MinMaxScaler (0-1) |
| Walk-forward validation | 5 folds |
| RMSE tolerance | 2% |

### Data Pipeline
1. **Fetch** - yfinance pulls 5-year historical data
2. **Indicators** - Compute MA20, MA50, RSI, MACD
3. **Normalize** - MinMaxScaler to 0-1 range
4. **Sequence** - Create 20-day sliding windows
5. **Train** - LSTM with Adam optimizer, MSE loss
6. **Evaluate** - RMSE, MAE, R-squared metrics
7. **Store** - Save to local + Supabase cloud

---

## API Endpoints (31 Total)

### Authentication (3)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/send-otp` | Generate and send OTP code |
| POST | `/api/v1/auth/verify-otp` | Verify OTP code |
| POST | `/api/v1/auth/reset-password` | Reset password after OTP |

### Core Prediction (5)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/forecast` | Main prediction (auto-trains if needed) |
| GET | `/api/v1/forecast/{ticker}` | Simplified forecast |
| GET | `/api/v1/historical/{ticker}` | Historical price data |
| GET | `/api/v1/metrics/{ticker}` | Model performance metrics |
| GET | `/api/v1/validate/{ticker}` | Validate ticker exists |

### Search & Quotes (2)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/search/{query}` | Search tickers via Finnhub |
| GET | `/api/v1/quote/{ticker}` | Live price quote |

### Model Management (4)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/retrain/{ticker}` | Trigger retraining |
| GET | `/api/v1/retrain/status/{ticker}` | Model status and age |
| GET | `/api/v1/models/status` | All models overview |
| POST | `/api/v1/batch-retrain` | Retrain multiple tickers |

### Market & Reports (3)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/market/summary` | All active tickers with prices |
| GET | `/api/v1/reports/history` | Training history logs |
| GET | `/api/v1/health/database` | Database health check |

### Articles / CMS (7)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/articles` | List articles |
| GET | `/api/v1/articles/{id}` | Get single article |
| POST | `/api/v1/articles` | Create article |
| PUT | `/api/v1/articles/{id}` | Update article |
| DELETE | `/api/v1/articles/{id}` | Delete article |
| POST | `/api/v1/articles/upload-image` | Upload image |
| GET | `/api/v1/articles/stats` | Article statistics |

### AI Insights (1)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/insights` | AI-generated market insights |

### User Management (2)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List all users (admin) |
| POST | `/api/v1/users/set-role` | Set user role |

### Predictions (3)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/predictions/history` | User prediction history |
| POST | `/api/v1/predictions/validate/{id}` | Validate single prediction |
| POST | `/api/v1/predictions/validate-all` | Batch validate predictions |

### System (2)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API health status |
| GET | `/` | Root API info |

---

## Frontend Pages & Features

### Page Map
```
Public Pages (No Auth):
  /                    → Landing Page
  /login               → Sign In
  /signup              → Sign Up
  /forgot-password     → Forgot Password (OTP Step 1)
  /verify-code         → Verify OTP (OTP Step 2)
  /new-password        → New Password (OTP Step 3)
  /insights/:id        → Article Detail (public)

Protected Pages (Requires Login):
  /dashboard           → Dashboard (main)
  /analytics           → Analytics Overview
  /analytics/:ticker   → Per-Ticker Analytics
  /reports             → Training Reports
  /insights            → Market Insights
  /market              → Market Explorer
  /predictions         → Prediction History

Admin Pages (Requires Admin Role):
  /admin               → Admin Panel
  /admin/editor        → Create Article
  /admin/editor/:id    → Edit Article
```

---

### 1. Landing Page (`/`)
**File:** `frontend/src/pages/Landing.jsx`
**Access:** Public (no authentication required)

The marketing landing page for StockPP. Uses heavy GSAP animations (SplitText, ScrambleTextPlugin, ScrollTrigger), 3D parallax tilt cards, and a Three.js hero scene.

**Sections:**
- **Announcement Bar** — Fixed top banner announcing new features (dismissible)
- **Navbar** — Fixed navigation with logo, section links (Features, How It Works, Pricing), Login and Get Started buttons. Becomes glass-blurred on scroll.
- **Hero Section** — Full-viewport hero with GSAP-animated heading, scramble-text badge ("AI-POWERED FORECASTING"), subtitle, two CTAs ("Get Started" → signup, "See How It Works" → scroll), 3D scene (HeroScene), floating ticker cards (NVDA, AAPL, BBCA.JK) with mini SVG charts, metric badges (Confidence 88%, RMSE Score 0.024), "Engine Active" status dot
- **Kinetic Marquee** — Two rows of auto-scrolling ticker strips (10 items each, one reversed) showing symbol, price, and change percentage
- **Tech Stack** — 7 technology logos (FastAPI, TensorFlow, React, Tailwind, Scikit-learn, yfinance, Supabase) as inline SVGs with hover effects
- **Features Bento Grid** — 4 feature cards in bento layout: LSTM Prediction Engine (2x2 span), Live Market Data, Accuracy Metrics, Auto Validation. Cards have parallax tilt on hover.
- **CardSwap** — Interactive swappable card component (desktop only) cycling through the 4 features
- **Stats Band** — 4 animated counter cards: 99.2% Uptime SLA, 0.018 Avg MAE Error, 30+ Global Tickers, 88% Model Confidence. Counters animate on scroll.
- **Dashboard Horizontal Scroll** — GSAP-powered horizontal scroll showing 6 dashboard preview cards (NVDA, AAPL, MSFT, GOOGL, AMZN, BBCA.JK) with chart, price, predicted price, confidence. Full dashboard mockup below.
- **How It Works** — 4-step horizontal scroll: Fetch data → Normalize → Predict → Display. Each step with icon, number, title, description.
- **Pricing** — 3-tier cards: Starter ($99/mo), Professional ($299/mo, "Most Popular"), Enterprise (Custom). Features listed with check icons.
- **Footer** — 4-column footer with logo, Product links, Company links, Resources links, copyright, social links

**Interactive Elements:**
- Dismiss announcement bar
- Nav links scroll to sections
- "Log in" → `/login`, "Get Started" → `/signup`
- Hero CTAs → `/signup` and section scroll
- Magnetic button effect on primary CTA
- Parallax tilt on hover for feature/dashboard cards
- CardSwap click-to-swap
- Pricing tier buttons

**Data:** All static/hardcoded (no API calls)

---

### 2. Dashboard (`/dashboard`)
**File:** `frontend/src/pages/Dashboard.jsx`
**Access:** Protected (requires login)

The main prediction dashboard. Default landing page after login. Shows LSTM-powered 7-day stock price forecasts with interactive charts.

**Sections:**
- **Header** — Sticky top bar with ticker search form and "Live" pulsing status indicator
- **Hero Area** — "AI Forecast Engine" badge, large ticker name heading, "7-day prediction powered by LSTM neural networks" subtitle
- **Main Grid (3-column desktop):**
  - **Chart Card (2/3 width)** — Current price display, change percentage badge (orange=up, black=down), PriceChart component (350px) showing historical + forecast data
  - **AI Prediction Card (1/3 width, dark bg)** — Ticker badge, forecast change %, model accuracy progress bar, RMSE value, trend label (Bullish/Bearish), target price, "View Full Analysis" button → `/analytics/{ticker}`
  - **Quick Stats** — MAE and R-Squared metric cards
- **7-Day Forecast Table** — Columns: Date, Predicted Price, Change %, Trend arrow. Each row calculates day-over-day change.

**Data Source:** `useForecastTracked(ticker, 7, "1y", user?.id)` hook
- Returns: current_price, change_percent, historical, forecast[], metrics (rmse, mae, r_squared), trend, ticker, historical_indicators
- Default ticker: NVDA
- Accuracy computed as: `100 - (rmse / currentPrice) * 100`

**Special Features:**
- Animated number display
- Pulsing dot indicator
- Skeleton loading state
- Error state with retry search
- Mount fade-in animation

---

### 3. Analytics Overview (`/analytics`)
**File:** `frontend/src/pages/Analytics.jsx` (AnalyticsOverview component)
**Access:** Protected

Overview of all tracked stocks with top movers and search.

**Sections:**
- **Header** — "ANALYTICS OVERVIEW" with icon
- **Search Bar** — Debounced search (500ms) via `GET /api/v1/search/{term}`. Dropdown results with "Analyze" badges. Click → `/analytics/{symbol}`
- **Top Movers** — Two cards: Top 3 Gainers and Top 3 Losers (sorted by change_percent). Each row clickable.
- **All Watchlist Stocks Table** — Columns: Ticker, Company, Sector, Price, Change, Action. All rows clickable → `/analytics/{ticker}`

**Data Source:** `useMarketSummary(true)`

---

### 4. Per-Ticker Analytics (`/analytics/:ticker`)
**File:** `frontend/src/pages/Analytics.jsx` (AnalyticsDetail component)
**Access:** Protected

Deep technical analysis for a single stock with live market data and indicators.

**Sections:**
- **Header** — Back button, "PRECISION ANALYTICS" heading, refresh button for live quote
- **Ticker Info** — Large ticker symbol (6xl-8xl), asset class, current price, change % with trend icon. Live Finnhub badge.
- **Live Market Data** — 5 cards: Open, High, Low, Prev Close, Change. Fetched from `/api/v1/quote/{ticker}`, auto-refreshes every 30 seconds.
- **Technical Indicators** — 3 cards:
  - RSI (14) with gauge bar, signal label (Oversold/Neutral/Overbought)
  - Moving Averages (MA20, MA50) with crossover signal
  - MACD with momentum signal
- **Chart Section** — PriceChart (500px) with legend: Actual line, Forecast dashed line, MA20, MA50
- **Model Metrics** — RMSE, MAE values, Model Source badge (Trained Model vs Mock Data)
- **Forecast Summary** — Table: Current Price, Trend, Change %, RSI Signal, MA Signal

**Data Sources:**
- `useForecast(ticker, 7, '1y')` for forecast + indicators
- `GET /api/v1/quote/{ticker}` for live quote (Finnhub)

**Special Features:**
- Auto-refreshing live quotes every 30 seconds
- Debounced search with loading spinner
- Signal interpretation for RSI, MA crossover, MACD

---

### 5. Market Explorer (`/market`)
**File:** `frontend/src/pages/Market.jsx`
**Access:** Protected

Browse all available stocks with sector filtering and search.

**Sections:**
- **Header** — "Market Explorer" heading, subtitle, sector filter buttons (dynamically generated from stock data)
- **Stock Table** — Inside bordered card with search input. Columns: Ticker, Company, Sector, Price, Trend. Footer shows "Showing X of Y results".

**Interactive Elements:**
- Sector filter buttons (pill-shaped, toggle active)
- Search input with debounced API search (500ms)
- Clickable rows → `/analytics/{ticker}`
- Search results show: Ticker, Company, Type, Action ("View Analysis" button)

**Data Source:** `useMarketSummary(true)` + `GET /api/v1/search/{term}`

**Special Features:**
- Dual-mode table: watchlist stocks by default, API search results when searching
- Combined sector + search filtering

---

### 6. Market Insights (`/insights`)
**File:** `frontend/src/pages/Insights.jsx`
**Access:** Protected

AI-driven insights and admin-published articles combined.

**Sections:**
- **Header** — "Market Insights" heading, subtitle, summary badges (total models, models needing retrain, avg RMSE, article count)
- **Featured AI Insight** — Large dark gradient card with category, title, summary, date, read time
- **Latest Articles** — 2-column grid of article cards. Each shows: thumbnail, category badge, read time, title, summary, tags (up to 3), author avatar/name, date, "Read more" link
- **Category Filter** — Button row for filtering by category (dynamically extracted)
- **AI Model Insight Cards** — Grid of insight cards with icon, category badge, title, content, date
- **Empty State** — Warning card if no insights/articles exist
- **CTA Section** — Dark card encouraging model training, "Start Training" button → dashboard

**Data Sources:**
- `useInsights(true)` for AI-generated insights
- `useArticles('published', 20, true)` for admin articles

**Special Features:**
- Client-side category filtering
- Combines AI insights + admin articles

---

### 7. Article Detail (`/insights/:id`)
**File:** `frontend/src/pages/articles/ArticleDetail.jsx`
**Access:** Public

Full article reading page.

**Sections:**
- **Reading Progress Bar** — Fixed top 1px bar showing scroll progress
- **Navigation** — Sticky top bar with "Back to Insights" button, Share and BookOpen icon buttons
- **Header Image** — Full-width article header image
- **Article Header** — Category badge, title, summary, author info (avatar, name, date), read time
- **Article Content** — Tags row, Markdown-rendered content body, author card at bottom
- **Scroll to Top** — Fixed bottom-right button (appears after 400px scroll)

**Data Source:** `apiService.getArticle(articleId)`

**Special Features:**
- Reading progress tracking via scroll
- Markdown rendering
- Scroll-to-top button

---

### 8. Training Reports (`/reports`)
**File:** `frontend/src/pages/Reports.jsx`
**Access:** Protected

Model training history and audit trail.

**Sections:**
- **Header** — "Reports Management" heading, subtitle, "Export CSV" and "Refresh" buttons
- **Search & Filter** — Search input (by report name or ticker) + status dropdown (All/Completed/Processing/Failed)
- **Stats Cards** — 3 cards: Total Reports, Completed, Processing
- **Reports Table** — Columns: Report Name (file icon + ticker), Metrics (RMSE, MAE, R-squared), Status (color-coded badge), Date. Footer shows count.

**Data Source:** `useReportsHistory(null, 50, true)`

**Special Features:**
- Client-side CSV export with proper escaping
- Clickable rows → `/analytics/{ticker}`
- Refetch indicator banner

---

### 9. Prediction History (`/predictions`)
**File:** `frontend/src/pages/PredictionHistory.jsx`
**Access:** Protected

Track and validate predictions against actual market performance.

**Sections:**
- **Header** — "Prediction Tracker" heading, subtitle, "Validate All" button (shows pending count), "Refresh" button
- **Summary Cards** — 5 cards: Total, Validated, Pending, Direction Accuracy %, Avg Error %
- **Filters** — Button row: All, Validated, Pending. Per-ticker filter buttons if multiple tickers.
- **Predictions Table** — 6 columns:
  - Ticker (with trend arrow)
  - Date
  - Predicted (price + change %)
  - Actual (price + change %, or "Waiting...")
  - Accuracy (badge with MPE % + direction check/cross)
  - Action (Validate button for pending, chevron for validated)

**Data Source:** `usePredictionHistory(user?.id, tickerFilter, statusFilter, 50, true)`

**Special Features:**
- Batch validation via "Validate All"
- Individual validation per prediction
- Accuracy classification: High (<=2%), Moderate (<=5%), Low (>5%)
- Computed stats: direction accuracy, avg MAE, avg MPE

---

### 10. Admin Panel (`/admin`)
**File:** `frontend/src/pages/admin/Admin.jsx`
**Access:** Admin only

Full system management with 5 tabbed sections.

**Tab 1: Model Performance**
- 3 KPI cards: Aggregate Model Accuracy %, Active Models count, Articles Published count
- Model Registry table: Ticker, RMSE, MAE, Accuracy %, Age (hours), Status (Healthy/Needs Retrain). Refresh button.

**Tab 2: System Health**
- Service Status table: FastAPI Backend, LSTM Inference Engine, Supabase Database (online/offline/degraded indicators + latency)
- System Activity panel: Total Models, Models Needing Retrain, Avg RMSE, Articles count

**Tab 3: Content Manager**
- 3 KPI cards: Total Articles, Published, Drafts
- Articles table: Title, Category, Status (Published/Draft badge), Date, Actions (Publish/Unpublish, Edit → `/admin/editor/{id}`, Delete with confirmation modal)
- "New Article" button → `/admin/editor`

**Tab 4: User Management**
- 3 KPI cards: Total Users, Administrators, Regular Users
- User Directory table: User (avatar + name), Email, Role (Admin/User badge), Joined date, Actions (Promote/Demote buttons)

**Tab 5: System Info**
- System Status panel: API Status, API Version, Total Models, Models Needing Retrain, Published Articles
- Model Details panel: Per-ticker model info with RMSE and age

**Data Sources:**
- `useModelsStatus(true)` for models
- `useHealth(true)` for API health
- `useArticles(null, 50, true)` for articles
- `useArticleStats(true)` for article stats
- `fetchUsers()` for user list
- `POST /api/v1/users/set-role` for role updates

---

### 11. Article Editor (`/admin/editor` and `/admin/editor/:id`)
**File:** `frontend/src/pages/admin/ArticleEditor.jsx`
**Access:** Admin only

Rich article creation and editing page. Dual mode: create (no ID) or edit (with ID).

**Sections:**
- **Editor Top Bar** — Save status indicator, word count, read time estimate, preview toggle, "Save Draft" and "Publish" buttons
- **Content Area (3/4 width):**
  - Edit mode: Title input (4xl), summary input (xl), Markdown toolbar (bold, italic, headings, links, code, lists, images), content textarea (min 60vh)
  - Preview mode: Header image, title, summary, MarkdownRenderer output
- **Sidebar (1/4 width):** Category select, status, tags input (comma-separated), header image upload/remove, thumbnail upload/remove, word/char counts, read time

**Special Features:**
- Image upload with validation (JPG/PNG/GIF/WebP, max 5MB)
- Inline image insertion at cursor position
- Markdown toolbar with cursor-aware insertion
- Live preview toggle
- On create success → navigates to edit URL for the new article
- Invalidates TanStack Query caches on save

---

### 12. Sign In (`/login`)
**File:** `frontend/src/pages/auth/SignIn.jsx`
**Access:** Public

Login page for existing users.

**UI:**
- Logo + "PRECISION ANALYTICS" header
- "StockAI Predictor" heading
- Email input with Mail icon
- Password input with Lock icon, show/hide toggle, "Forgot Password?" link
- Security notice box
- "Sign In" button
- "Don't have an account? Register here" link

**Flow:** `signIn(email, password)` → success → `/dashboard`

---

### 13. Sign Up (`/signup`)
**File:** `frontend/src/pages/auth/SignUp.jsx`
**Access:** Public

Registration page for new users.

**UI:**
- Logo + "PRECISION ANALYTICS" header
- "Create Account" heading
- Full Name, Email, Organization, Password inputs
- Password show/hide toggle
- Terms of Service checkbox
- "Register Terminal" button
- "Already have an account? Log in here" link

**Flow:** `signUp(email, password, { full_name, organization })` → success → redirect to `/login` after 3 seconds

---

### 14. Forgot Password (`/forgot-password`)
**File:** `frontend/src/pages/auth/ForgotPassword.jsx`
**Access:** Public

Step 1 of OTP password reset flow.

**UI:**
- Logo + "PRECISION ANALYTICS" header
- "Reset Access Key" heading
- Email input with Mail icon
- "Send Reset Link" button
- "Back to Login" link

**Flow:** `POST /api/v1/auth/send-otp` → stores email in sessionStorage → navigates to `/verify-code`

---

### 15. Verify Code (`/verify-code`)
**File:** `frontend/src/pages/auth/VerifyCode.jsx`
**Access:** Public

Step 2 of OTP password reset flow.

**UI:**
- Logo + "PRECISION ANALYTICS" header
- Masked email display (e.g., "a***@domain.com")
- 6 individual digit input boxes (auto-advance focus, paste support, backspace navigation)
- "Verify Identity" button
- "RESEND CODE" button
- "Back to Login" link

**Flow:** `POST /api/v1/auth/verify-otp` → sets `otpVerified=true` in sessionStorage → navigates to `/new-password`

---

### 16. New Password (`/new-password`)
**File:** `frontend/src/pages/auth/NewPassword.jsx`
**Access:** Public (requires prior OTP verification)

Step 3 of OTP password reset flow.

**UI:**
- Session guard: checks `otpVerified` + `resetEmail` in sessionStorage
- Logo + "PRECISION ANALYTICS" header
- "Create New Password" heading
- New Password input with show/hide
- Password strength indicator (4-segment bar: WEAK/FAIR/GOOD/STRONG)
- Confirm Password input with show/hide
- Enterprise Policy Requirements box (min 12 chars, uppercase, number, special char)
- "Reset Password" button
- "Back to User Login" link

**Flow:** `POST /api/v1/auth/reset-password` → clears sessionStorage → navigates to `/login`

---

### Layout Component (Shared)
**File:** `frontend/src/components/Layout.jsx`
**Access:** All authenticated pages

Shared layout wrapper providing sidebar navigation and top bar.

**Sidebar (256px, fixed left):**
- Logo: "PRECISION ANALYTICS" with Activity icon
- Navigation: Dashboard, Market, Analytics, Predictions, Insights, Reports
- Admin section (conditional): Admin Panel
- User section: avatar, name, email, Admin badge, Sign Out button

**Top Bar (sticky):**
- Animated hamburger/X toggle (mobile)
- "PRECISION ANALYTICS" brand text

**Features:**
- Responsive: auto-opens on desktop (>=1024px), closes on mobile
- Auto-close on route change (mobile)
- Active route highlighting
- Mobile backdrop overlay

---

## Key Features

### 1. Auto-Training
When a user searches for a stock ticker that has no trained model, the system automatically:
- Fetches 5 years of historical data from yfinance
- Computes technical indicators (RSI, MACD, MA20, MA50)
- Trains a 70-epoch LSTM model
- Saves model to local storage and Supabase cloud
- Returns predictions to the user

### 2. Stock Price Prediction
- Multi-step sliding-window forecasting (1-30 days ahead)
- Uses last 20 days of data as input window
- Predicts one day at a time, feeds prediction back as input
- Returns predicted prices with dates

### 3. Technical Indicators
- **RSI** (Relative Strength Index) - 14-day momentum
- **MACD** (Moving Average Convergence Divergence) - 12/26 EMA
- **MA20** - 20-day simple moving average
- **MA50** - 50-day simple moving average
- All indicators returned with predictions and displayed in charts

### 4. Model Validation
- Walk-forward validation with 5 folds
- RMSE comparison with 2% tolerance
- Models only replaced if new version improves metrics
- Training audit trail in database

### 5. Prediction History
- Each prediction saved per user with timestamp
- Automated validation against actual prices when available
- Tracks: direction accuracy, MAE, percent error
- Status tracking: pending → validated/expired

### 6. Scheduled Retraining
- Background scheduler using `schedule` library
- Configurable: daily, weekly, or periodic retraining
- Automatic model health monitoring
- Alerts when models exceed 24-hour age threshold

### 7. Article CMS
- Full CRUD for market insight articles
- Rich text editor with image upload
- Draft/published workflow
- Tags and categories
- Public and authenticated views

### 8. Admin Dashboard
- KPI cards: total models, accuracy, articles
- Service status monitoring (API, Database, Engine)
- Article management with publish/unpublish
- User management with role assignment (admin/user)

---

## Authentication Flow

### Standard Login
```
User → /login → signIn(email, password) → Supabase Auth → Session → /dashboard
```

### Password Reset (OTP)
```
1. /forgot-password → POST /auth/send-otp
2. Backend generates 6-digit code (5-min expiry)
3. Code sent via Resend (email) or Twilio (WhatsApp)
4. /verify-code → POST /auth/verify-otp
5. sessionStorage(otpVerified=true)
6. /new-password → supabase.auth.updateUser()
```

### Route Protection
- `ProtectedRoute` - Redirects to `/login` if no session
- `AdminRoute` - Shows "Access Denied" if user_metadata.role ≠ 'admin'

---

## Design System

Based on **Intrepid Automation** design system (see `DESIGN.md`):

| Element | Specification |
|---------|--------------|
| Primary Color | `#FF6633` (Intrepid Orange) |
| Text Color | `#000000` (Pure Black) |
| Background | `#FFFFFF` (White) |
| Border | `#E5E7EB` (Light Gray) |
| Disabled | `#A6A6A6` (Medium Gray) |
| Secondary Text | `#3B3B3B` (Dark Charcoal) |
| Border Radius | `0px` everywhere |
| Shadows | None (flat design) |
| Primary Font | `__onsite_2032f6` (serif) |
| UI Font | `__mdio_e79ec6` (sans-serif) |
| Button Height | 31px |
| Card Padding | 40px |
| Section Padding | 80px vertical |

---

## Project Structure

```
stock-forecast-project/
├── backend/
│   ├── main.py                    # FastAPI entry point
│   ├── requirements.txt           # Python dependencies
│   ├── schema.sql                 # Database schema
│   ├── api/
│   │   └── routes.py              # 31 API endpoints
│   └── core/
│       ├── model.py               # LSTM architecture
│       ├── data_engine.py         # Data fetching + indicators
│       ├── forecasting_service.py # Prediction orchestration
│       ├── model_manager.py       # Model persistence + versioning
│       ├── model_scheduler.py     # Background retraining
│       ├── retraining_orchestrator.py  # Retrain workflow
│       ├── supabase_client.py     # Database operations
│       ├── finnhub_client.py      # Real-time quotes
│       ├── otp_service.py         # Email/WhatsApp OTP
│       ├── insight_engine.py      # AI insights generator
│       └── prediction_validator.py # Prediction validation
│
├── frontend/
│   ├── package.json               # Node dependencies
│   ├── tailwind.config.js         # Tailwind + design tokens
│   └── src/
│       ├── App.jsx                # 17 routes
│       ├── index.css              # Global styles
│       ├── contexts/
│       │   └── AuthContext.jsx     # Auth state management
│       ├── pages/
│       │   ├── Landing.jsx        # Marketing page
│       │   ├── Dashboard.jsx      # Main dashboard
│       │   ├── Analytics.jsx      # Per-ticker analytics
│       │   ├── Market.jsx         # Market overview
│       │   ├── Insights.jsx       # Market insights
│       │   ├── Reports.jsx        # Training history
│       │   ├── PredictionHistory.jsx
│       │   ├── auth/              # 5 auth pages
│       │   ├── admin/             # Admin + editor
│       │   └── articles/          # Article detail
│       ├── components/
│       │   ├── Layout.jsx         # Sidebar navigation
│       │   ├── PriceChart.jsx     # Recharts component
│       │   └── ...
│       ├── hooks/
│       │   └── useApi.js          # 16 TanStack Query hooks
│       └── services/
│           └── apiService.js      # Axios HTTP client
│
└── documentation/
    ├── corrected-schema.sql       # Full DB schema
    ├── articles-table-schema.sql
    ├── otp-fix.sql
    └── prediction-history-schema.sql
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| API Endpoints | 31 |
| Frontend Routes | 17 |
| Database Tables | 6 |
| Backend Modules | 12 |
| Frontend Pages | 16 |
| TanStack Query Hooks | 16 |
| External Integrations | 5 |
| ML Input Features | 6 |
| LSTM Layers | 3 |
| Storage Buckets | 2 |

---

## Commands

### Backend
```bash
cd backend
pip install -r requirements.txt    # Install dependencies
python main.py                     # Run server (port 8000)
python run_first_train.py          # Initial model training
python check_db.py                 # Test database connection
```

### Frontend
```bash
cd frontend
npm install                        # Install dependencies
npm run dev                        # Run dev server (port 5173)
npm run build                      # Production build
```

### Health Check
```bash
curl http://localhost:8000/health   # API status
curl http://localhost:8000/api/v1/models/status  # Model status
```

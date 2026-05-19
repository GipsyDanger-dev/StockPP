import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ArrowRight, Star, Zap, Shield, Globe, ChevronRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HeroScene from '../components/landing/HeroScene'

gsap.registerPlugin(ScrollTrigger)

const NAV_LINKS = ['Home', 'Features', 'Dashboard', 'Technology', 'Pricing']

const TICKERS = [
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: '$894.20', pred: '$942.15', change: '+5.36%', up: true },
  { symbol: 'AAPL', name: 'Apple Inc.', price: '$189.40', pred: '$201.80', change: '+6.54%', up: true },
  { symbol: 'BBCA.JK', name: 'Bank BCA', price: 'Rp9.250', pred: 'Rp9.750', change: '+5.41%', up: true },
]

const FEATURES = [
  { icon: Activity, title: 'AI Forecast Engine (LSTM)', desc: 'Long Short-Term Memory networks capture temporal dependencies in complex time-series financial data for surgical precision.' },
  { icon: Zap, title: 'Interactive Analytics', desc: 'Deep dive into predictions with zoomable charts, overlay comparisons, and historical backtesting simulations.' },
  { icon: Shield, title: 'Industrial Metrics', desc: 'Live RMSE, MAE, and R-Squared confidence scores with full transparency in every prediction, updated every tick.' },
  { icon: Globe, title: 'Real-Time Sentiment', desc: 'Aggregate news, social sentiment, and macro indicators into a 360-degree forecast model updated every minute.' },
]

const STEPS = [
  { n: '01', title: 'Fetch Data', desc: 'Real-time ingestion of historical price action via Yahoo Finance & Finnhub API.' },
  { n: '02', title: 'Process & Normalize', desc: 'Normalizing tensors and engineering features for deep learning models.' },
  { n: '03', title: 'LSTM Prediction', desc: 'Neural engine simulates thousands of potential price trajectories.' },
  { n: '04', title: 'Visualize', desc: 'Interactive forecast overlays delivered to your dashboard instantly.' },
]

const PLANS = [
  { tier: 'STARTER', price: '$99', per: '/mo', popular: false, features: ['5 Active Forecasts', 'Daily Prediction Updates', 'Real-time Sentiment Analysis', 'Standard Dashboard Access'], cta: 'Choose Starter' },
  { tier: 'PROFESSIONAL', price: '$299', per: '/mo', popular: true, features: ['Unlimited Forecasts', 'Hourly Prediction Updates', 'Full Sentiment Engine', 'API Access (Basic)', 'Backtesting Module'], cta: 'Get Started' },
  { tier: 'ENTERPRISE', price: 'Custom', per: '', popular: false, features: ['Bespoke Model Training', 'High-Frequency Data Feed', 'Dedicated Quant Support', 'Custom LSTM Architecture'], cta: 'Contact Sales' },
]

function MiniChart({ up = true }) {
  const points = up
    ? '0,50 20,45 40,48 60,35 80,38 100,28 120,30 140,18 160,22 180,10'
    : '0,10 20,15 40,12 60,25 80,22 100,32 120,30 140,42 160,38 180,50'
  return (
    <svg width="180" height="60" viewBox="0 0 180 60" fill="none">
      <defs>
        <linearGradient id={`g-${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? '#2563EB' : '#EF4444'} stopOpacity="0.2" />
          <stop offset="100%" stopColor={up ? '#2563EB' : '#EF4444'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={up ? '#2563EB' : '#EF4444'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={`0,50 ${points} 180,60 0,60`} fill={`url(#g-${up})`} />
    </svg>
  )
}

function TickerCard({ ticker }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 min-w-[200px] shadow-lg">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-sm text-slate-900">{ticker.symbol}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{ticker.name}</div>
        </div>
        <span className={`text-[11px] font-bold rounded-md px-2 py-1 ${ticker.up ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'}`}>
          {ticker.change}
        </span>
      </div>
      <MiniChart up={ticker.up} />
      <div className="flex justify-between mt-2">
        <div>
          <div className="text-[10px] text-slate-400 font-semibold">PRICE</div>
          <div className="text-sm font-bold text-slate-900">{ticker.price}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-blue-600 font-semibold">PREDICTED</div>
          <div className="text-sm font-bold text-blue-600">{ticker.pred}</div>
        </div>
      </div>
    </div>
  )
}

function MetricBadge({ label, value, className = '' }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg ${className}`}>
      <div className="text-[10px] text-slate-500 font-bold mb-0.5">{label}</div>
      <div className="text-xl font-extrabold text-blue-600">{value}</div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const dashboardRef = useRef(null)
  const stepsRef = useRef(null)
  const pricingRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-content', {
        scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: 1 },
        y: -50, opacity: 0.3,
      })

      gsap.from('.feature-card', {
        scrollTrigger: { trigger: featuresRef.current, start: 'top 80%' },
        y: 60, opacity: 0, stagger: 0.15, duration: 0.8, ease: 'power2.out',
      })

      gsap.from('.dashboard-preview', {
        scrollTrigger: { trigger: dashboardRef.current, start: 'top 80%' },
        scale: 0.9, opacity: 0, duration: 1, ease: 'power2.out',
      })

      gsap.from('.step-item', {
        scrollTrigger: { trigger: stepsRef.current, start: 'top 80%' },
        y: 40, opacity: 0, stagger: 0.2, duration: 0.6, ease: 'power2.out',
      })

      gsap.from('.pricing-card', {
        scrollTrigger: { trigger: pricingRef.current, start: 'top 80%' },
        y: 60, opacity: 0, stagger: 0.15, duration: 0.8, ease: 'power2.out',
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* Announcement Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs text-center py-2.5 font-medium tracking-wide">
        StockPP v2.0 is live — LSTM + real-time sentiment now in beta.{' '}
        <span className="text-blue-400 font-bold cursor-pointer hover:text-blue-300">Try it free →</span>
      </div>

      {/* Navbar */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 px-8 lg:px-16 flex items-center justify-between h-[68px] ${scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200' : 'bg-transparent border-b border-transparent'}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-extrabold text-lg text-slate-900">StockPP</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(link => (
            <button key={link} className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors bg-transparent border-none cursor-pointer">
              {link}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="text-sm text-slate-600 hover:text-slate-900 bg-transparent border-none cursor-pointer font-medium">
            Login
          </button>
          <button onClick={() => navigate('/signup')} className="btn-primary bg-blue-600 text-white border-none rounded-full px-5 py-2.5 text-sm font-bold cursor-pointer hover:bg-blue-700 transition-all">
            Start Forecasting
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative px-8 lg:px-16 py-20 pb-28 bg-gradient-to-br from-[#F8FAFF] via-blue-50/40 to-[#FAFAFA] overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(37,99,235,0.06)_0%,transparent_70%)] rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 left-24 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(99,102,241,0.05)_0%,transparent_70%)] rounded-full pointer-events-none" />

        <div className="hero-content max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-20 relative">
          {/* Left Content */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-7">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full pulse-dot" />
              <span className="text-[11px] font-bold text-blue-600 tracking-wider">AI-POWERED DEEP LEARNING ENGINE</span>
            </div>

            <h1 className="font-heading text-5xl lg:text-6xl font-extrabold leading-[1.08] text-slate-900 mb-6">
              Predict Stock<br />
              Trends With<br />
              <span className="text-blue-600">Industrial-</span><br />
              <span className="text-blue-600">Grade AI</span>
            </h1>

            <p className="text-base text-slate-600 leading-relaxed max-w-md mb-10">
              Advanced forecasting platform powered by LSTM neural networks and real-time market sentiment analysis. Achieve surgical precision in market movements.
            </p>

            <div className="flex items-center gap-3.5">
              <button onClick={() => navigate('/signup')} className="btn-primary bg-blue-600 text-white border-none rounded-full px-7 py-3.5 text-sm font-bold cursor-pointer flex items-center gap-2 hover:bg-blue-700 transition-all">
                Start Forecasting
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="bg-white text-slate-900 border border-slate-300 rounded-full px-6 py-3.5 text-sm font-semibold cursor-pointer hover:bg-slate-50 transition-all">
                View Live Dashboard
              </button>
            </div>

            <div className="flex items-center gap-8 mt-11">
              {[['99.2%', 'Uptime SLA'], ['0.018', 'Avg MAE Error'], ['30+', 'Global Tickers']].map(([val, lbl]) => (
                <div key={lbl}>
                  <div className="font-heading text-xl font-extrabold text-slate-900">{val}</div>
                  <div className="text-xs text-slate-400 font-medium">{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Three.js 3D Scene + Floating Cards */}
          <div className="flex-1 relative h-[480px] flex items-center justify-center">
            {/* Three.js Canvas */}
            <div className="absolute inset-0 z-0">
              <HeroScene />
            </div>

            {/* Floating Ticker Cards */}
            <div className="absolute top-6 -left-4 z-10 float1">
              <TickerCard ticker={TICKERS[0]} />
            </div>
            <div className="absolute top-40 -right-6 z-10 float2">
              <TickerCard ticker={TICKERS[1]} />
            </div>
            <div className="absolute bottom-6 left-10 z-10 float3">
              <TickerCard ticker={TICKERS[2]} />
            </div>

            {/* Metric Badges */}
            <MetricBadge label="CONFIDENCE" value="88%" className="absolute top-16 right-4 z-20" />
            <MetricBadge label="RMSE SCORE" value="0.024" className="absolute bottom-20 right-0 z-20" />

            {/* AI Active Badge */}
            <div className="absolute top-2 right-20 bg-blue-50/80 border border-blue-100 rounded-full px-3.5 py-1 flex items-center gap-1.5 z-20">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full pulse-dot" />
              <span className="text-[11px] font-bold text-blue-600">AI Engine Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Bar */}
      <section className="bg-white py-12 border-b border-slate-100">
        <div className="text-center mb-7">
          <span className="text-xs text-slate-400 font-bold tracking-widest uppercase">Enterprise-Grade Infrastructure</span>
        </div>
        <div className="flex justify-center items-center gap-14 flex-wrap">
          {['FastAPI', 'TensorFlow', 'React', 'Tailwind CSS', 'Scikit-learn', 'yfinance', 'Supabase'].map(tech => (
            <span key={tech} className="font-heading text-base font-bold text-slate-300 tracking-wide">{tech}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="features-section bg-[#FAFAFA] py-24 px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full px-3.5 py-1 mb-4">
              <Star className="w-3 h-3 text-blue-600" />
              <span className="text-[11px] font-bold text-blue-600">FEATURES</span>
            </div>
            <h2 className="font-heading text-4xl font-extrabold text-slate-900 mb-3.5">
              All the Tools you need to help
            </h2>
            <p className="text-base text-slate-500 max-w-lg mx-auto">
              Empowering you with intelligent features to simplify stock analysis and connect with top opportunities effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card bg-white rounded-3xl border border-slate-200 p-10 cursor-default transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5">
                  <f.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section ref={dashboardRef} className="bg-blue-50 py-20 px-8 lg:px-16">
        <div className="dashboard-preview max-w-6xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
          {/* Top bar */}
          <div className="bg-slate-50 border-b border-slate-200 px-7 py-4 flex justify-between items-center">
            <div className="flex gap-2">
              {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-1.5 text-xs text-blue-600 font-semibold">
              NVIDIA Corp (NVDA) · AI-Enhanced Forecast · Next 30 Days
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-bold">LATEST PRICE</div>
                <div className="font-heading text-lg font-extrabold text-slate-900">$894.20</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-blue-600 font-bold">PREDICTED</div>
                <div className="font-heading text-lg font-extrabold text-blue-600">$942.15</div>
              </div>
            </div>
          </div>

          {/* Chart area */}
          <div className="p-7 flex gap-6">
            <div className="flex-1">
              <svg width="100%" height="200" viewBox="0 0 600 200" preserveAspectRatio="none" className="block rounded-2xl border border-slate-100">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[40, 80, 120, 160].map(y => <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#F1F5F9" strokeWidth="1" />)}
                <polyline points="0,160 60,145 120,148 180,130 240,135 300,118 360,122 420,100" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
                <polyline points="420,100 480,85 540,78 600,65" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6,4" />
                <polygon points="0,200 0,160 60,145 120,148 180,130 240,135 300,118 360,122 420,100 480,85 540,78 600,65 600,200" fill="url(#chartGrad)" />
                <line x1="420" y1="30" x2="420" y2="200" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4,3" />
                <text x="426" y="44" fontSize="10" fill="#94A3B8" fontFamily="DM Sans, sans-serif">Forecast →</text>
              </svg>

              <div className="flex gap-3 mt-5">
                {[['CONFIDENCE', '88%', 'text-blue-600'], ['VOLATILITY', 'Medium', 'text-slate-900'], ['VOLUME', 'High', 'text-slate-900'], ['MAE ERROR', '0.018', 'text-blue-600']].map(([l, v, c]) => (
                  <div key={l} className="flex-1 bg-slate-50 rounded-xl px-4 py-3.5">
                    <div className="text-[10px] text-slate-400 font-bold mb-1">{l}</div>
                    <div className={`font-heading text-lg font-extrabold ${c}`}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Narrative */}
            <div className="w-[220px] bg-slate-900 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-blue-100">AI Market Narrative</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                "The LSTM model identifies a bullish convergence on the 4-hour timeframe. High demand from institutional AI sector rotation suggests a probable upside breakout within the next 7 trading days."
              </p>
              <div className="mt-5">
                <div className="text-[11px] text-slate-500 mb-1.5">Model Confidence</div>
                <div className="bg-white/10 rounded-full h-1.5">
                  <div className="bg-blue-600 w-[88%] h-1.5 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.6)]" />
                </div>
                <div className="text-[11px] text-blue-400 mt-1 font-bold">88% Confidence</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section ref={stepsRef} className="bg-white py-24 px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-4xl font-extrabold text-center text-slate-900 mb-16">
            Surgical Forecasting Workflow
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 relative">
            <div className="absolute top-7 left-[12.5%] right-[12.5%] h-px bg-slate-200 z-0 hidden md:block" />
            {STEPS.map((s, i) => (
              <div key={i} className="step-item text-center px-5 relative z-10">
                <div className={`w-14 h-14 rounded-full mx-auto mb-6 flex items-center justify-center ${i === 0 ? 'bg-blue-600 shadow-[0_0_0_6px_rgba(37,99,235,0.12)]' : 'bg-white border-2 border-slate-200'}`}>
                  <span className={`font-heading font-extrabold text-base ${i === 0 ? 'text-white' : 'text-slate-400'}`}>{s.n}</span>
                </div>
                <h4 className="font-heading font-bold text-base text-slate-900 mb-2.5">{s.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section ref={pricingRef} className="bg-slate-50 py-24 px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-4xl font-extrabold text-slate-900 mb-3">
              Industrial Plans For Every Edge
            </h2>
            <p className="text-base text-slate-500">Scalable AI intelligence for individual traders and institutional desks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan, i) => (
              <div key={i} className="pricing-card relative">
                {plan.popular && (
                  <div className="text-center mb-3">
                    <span className="bg-blue-600 text-white text-[11px] font-bold rounded-full px-4 py-1">MOST POPULAR</span>
                  </div>
                )}
                <div className={`bg-white rounded-3xl p-9 ${plan.popular ? 'border-2 border-blue-600 shadow-[0_12px_48px_rgba(37,99,235,0.12)]' : 'border border-slate-200'}`}>
                  <div className={`text-[11px] font-bold mb-2 ${plan.popular ? 'text-blue-600' : 'text-slate-400'}`}>{plan.tier}</div>
                  <div className="flex items-baseline gap-1.5 mb-7">
                    <span className={`font-heading text-5xl font-extrabold ${plan.popular ? 'text-blue-600' : 'text-slate-900'}`}>{plan.price}</span>
                    {plan.per && <span className="text-sm text-slate-400">{plan.per}</span>}
                  </div>
                  <div className="flex flex-col gap-3 mb-8">
                    {plan.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-2.5">
                        <div className="w-[18px] h-[18px] rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <ChevronRight className="w-2.5 h-2.5 text-blue-600" />
                        </div>
                        <span className="text-sm text-slate-600">{f}</span>
                      </div>
                    ))}
                  </div>
                  <button className={`w-full py-3.5 rounded-full text-sm font-bold cursor-pointer transition-all ${plan.popular ? 'bg-blue-600 text-white border-none hover:bg-blue-700' : 'bg-transparent text-slate-900 border border-slate-300 hover:bg-slate-50'}`}>
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-16 px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className="font-heading font-extrabold text-base text-white">StockPP</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-[260px]">
                Industrial-grade intelligence for modern enterprises. Deep learning to decode complex financial systems.
              </p>
            </div>
            {[
              { title: 'Platform', links: ['Features', 'Dashboard', 'API Docs', 'Status'] },
              { title: 'Company', links: ['About Us', 'Privacy Policy', 'Terms of Service', 'Contact Support'] },
              { title: 'Resources', links: ['Documentation', 'Blog', 'Changelog', 'Community'] },
            ].map(col => (
              <div key={col.title}>
                <div className="text-xs font-bold text-slate-400 mb-4 tracking-wider">{col.title.toUpperCase()}</div>
                <div className="flex flex-col gap-2.5">
                  {col.links.map(l => <span key={l} className="text-sm text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">{l}</span>)}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-7 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-xs text-slate-600">© 2026 StockPP. All rights reserved.</span>
            <div className="flex gap-4">
              {['GitHub', 'Twitter', 'LinkedIn'].map(s => (
                <span key={s} className="text-xs text-slate-600 cursor-pointer hover:text-slate-400 transition-colors">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

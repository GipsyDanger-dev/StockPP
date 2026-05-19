import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ArrowRight, Star, Zap, Shield, Globe, ChevronRight, X } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HeroScene from '../components/landing/HeroScene'
import CardSwap, { Card } from '../components/landing/CardSwap'

gsap.registerPlugin(ScrollTrigger)

const NAV_LINKS = ['Home', 'Features', 'Dashboard', 'Technology', 'Pricing']

const TICKERS = [
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: '$894.20', pred: '$942.15', change: '+5.36%', up: true },
  { symbol: 'AAPL', name: 'Apple Inc.', price: '$189.40', pred: '$201.80', change: '+6.54%', up: true },
  { symbol: 'BBCA.JK', name: 'Bank BCA', price: 'Rp9.250', pred: 'Rp9.750', change: '+5.41%', up: true },
]

const TECH_STACK = [
  { name: 'FastAPI', color: '#009688', bg: 'hover:bg-teal-50', border: 'hover:border-teal-200' },
  { name: 'TensorFlow', color: '#FF6F00', bg: 'hover:bg-orange-50', border: 'hover:border-orange-200' },
  { name: 'React', color: '#61DAFB', bg: 'hover:bg-cyan-50', border: 'hover:border-cyan-200' },
  { name: 'Tailwind CSS', color: '#06B6D4', bg: 'hover:bg-cyan-50', border: 'hover:border-cyan-300' },
  { name: 'Scikit-learn', color: '#F89939', bg: 'hover:bg-orange-50', border: 'hover:border-orange-200' },
  { name: 'yfinance', color: '#4CAF50', bg: 'hover:bg-green-50', border: 'hover:border-green-200' },
  { name: 'Supabase', color: '#3ECF8E', bg: 'hover:bg-emerald-50', border: 'hover:border-emerald-200' },
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
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-4 min-w-[200px] shadow-lg shadow-blue-600/5">
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
    <div className={`bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-xl px-4 py-3 shadow-lg shadow-blue-600/5 ${className}`}>
      <div className="text-[10px] text-slate-500 font-bold mb-0.5">{label}</div>
      <div className="text-xl font-extrabold text-blue-600">{value}</div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [showAnnouncement, setShowAnnouncement] = useState(true)
  const heroRef = useRef(null)
  const sceneRef = useRef(null)
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
      // Hero parallax
      gsap.to('.hero-3d-scene', {
        scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: 1 },
        y: -80,
        scale: 0.85,
        opacity: 0.4,
      })

      gsap.from('.hero-text', {
        scrollTrigger: { trigger: heroRef.current, start: 'top 80%' },
        y: 40, opacity: 0, duration: 0.8, ease: 'power2.out',
      })

      // Features stagger
      gsap.from('.feature-card', {
        scrollTrigger: { trigger: featuresRef.current, start: 'top 80%' },
        y: 60, opacity: 0, stagger: 0.12, duration: 0.7, ease: 'power2.out',
      })

      // Dashboard scale
      gsap.from('.dashboard-preview', {
        scrollTrigger: { trigger: dashboardRef.current, start: 'top 80%' },
        scale: 0.92, opacity: 0, duration: 0.9, ease: 'power2.out',
      })

      // Steps
      gsap.from('.step-item', {
        scrollTrigger: { trigger: stepsRef.current, start: 'top 80%' },
        y: 40, opacity: 0, stagger: 0.15, duration: 0.6, ease: 'power2.out',
      })

      // Pricing
      gsap.from('.pricing-card', {
        scrollTrigger: { trigger: pricingRef.current, start: 'top 80%' },
        y: 50, opacity: 0, stagger: 0.12, duration: 0.7, ease: 'power2.out',
      })

      // Floating 3D scene follows scroll between hero and features
      if (sceneRef.current) {
        gsap.to('.scroll-3d-element', {
          scrollTrigger: {
            trigger: sceneRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
          y: -120,
          rotation: 15,
        })
      }
    })

    return () => ctx.revert()
  }, [])

  return (
    <div className="min-h-screen bg-[#FAFBFC] overflow-x-hidden">

      {/* Announcement Bar */}
      {showAnnouncement && (
        <div className="relative z-[60] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-300 text-xs text-center py-2.5 font-medium tracking-wide flex items-center justify-center gap-4">
          <span className="hidden sm:inline">StockPP v2.0 is live</span>
          <span className="sm:hidden">StockPP v2.0</span>
          <span className="text-slate-500">—</span>
          <span>LSTM + real-time sentiment now in beta.</span>
          <span className="text-blue-400 font-bold cursor-pointer hover:text-blue-300 transition-colors">Try it free →</span>
          <button
            onClick={() => setShowAnnouncement(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navbar — Glassmorphism */}
      <nav className={`fixed left-0 right-0 z-50 h-[72px] px-6 lg:px-12 flex items-center justify-between transition-all duration-500 ${
        scrolled
          ? 'top-0 bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 shadow-[0_1px_30px_rgba(0,0,0,0.04)]'
          : showAnnouncement ? 'top-[36px]' : 'top-0 bg-transparent'
      }`}>
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-extrabold text-lg text-slate-900 tracking-tight">StockPP</span>
        </div>

        <div className="hidden lg:flex items-center gap-1 bg-slate-100/60 rounded-full px-1.5 py-1">
          {NAV_LINKS.map(link => (
            <button key={link} className="px-4 py-2 rounded-full text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-white/80 transition-all bg-transparent border-none cursor-pointer">
              {link}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="hidden sm:block text-sm text-slate-600 hover:text-slate-900 bg-transparent border-none cursor-pointer font-medium px-4 py-2 rounded-full hover:bg-slate-100/60 transition-all">
            Login
          </button>
          <button onClick={() => navigate('/signup')} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-none rounded-full px-5 py-2.5 text-sm font-bold cursor-pointer shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:from-blue-700 hover:to-blue-800 transition-all">
            Start Forecasting
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="hero-section relative pt-32 pb-24 px-6 lg:px-12 overflow-hidden" style={{ background: 'linear-gradient(165deg, #0B1121 0%, #0F172A 30%, #111827 60%, #0B1121 100%)' }}>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Glow blobs */}
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(37,99,235,0.12)_0%,transparent_60%)] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_60%)] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16 relative">
          {/* Left Content */}
          <div className="hero-text flex-1 z-10">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full pulse-dot" />
              <span className="text-[11px] font-bold text-blue-400 tracking-wider">AI-POWERED DEEP LEARNING ENGINE</span>
            </div>

            <h1 className="font-heading text-5xl lg:text-[68px] font-extrabold leading-[1.05] text-white mb-6">
              Predict Stock<br />
              Trends With
              <span className="block mt-1" style={{ background: 'linear-gradient(135deg, #3B82F6, #60A5FA, #93C5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Industrial-Grade AI
              </span>
            </h1>

            <p className="text-base lg:text-lg text-slate-400 leading-relaxed max-w-lg mb-10">
              Advanced forecasting platform powered by LSTM neural networks and real-time market sentiment analysis. Achieve surgical precision in market movements.
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <button onClick={() => navigate('/signup')} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-none rounded-full px-8 py-4 text-sm font-bold cursor-pointer flex items-center gap-2 shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:from-blue-700 hover:to-blue-800 transition-all">
                Start Forecasting
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="bg-white/5 text-white border border-white/10 rounded-full px-7 py-4 text-sm font-semibold cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
                View Live Dashboard
              </button>
            </div>

            <div className="flex items-center gap-10 mt-14">
              {[['99.2%', 'Uptime SLA'], ['0.018', 'Avg MAE Error'], ['30+', 'Global Tickers']].map(([val, lbl]) => (
                <div key={lbl}>
                  <div className="font-heading text-2xl font-extrabold text-white">{val}</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Three.js 3D Scene + Floating Cards */}
          <div className="hero-3d-scene flex-1 relative h-[520px] flex items-center justify-center">
            <div className="absolute inset-0 z-0">
              <HeroScene />
            </div>

            {/* Floating Ticker Cards */}
            <div className="absolute top-8 -left-2 z-10 float1">
              <TickerCard ticker={TICKERS[0]} />
            </div>
            <div className="absolute top-44 -right-4 z-10 float2">
              <TickerCard ticker={TICKERS[1]} />
            </div>
            <div className="absolute bottom-8 left-12 z-10 float3">
              <TickerCard ticker={TICKERS[2]} />
            </div>

            <MetricBadge label="CONFIDENCE" value="88%" className="absolute top-12 right-6 z-20" />
            <MetricBadge label="RMSE SCORE" value="0.024" className="absolute bottom-24 right-2 z-20" />

            <div className="absolute top-4 right-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3.5 py-1 flex items-center gap-1.5 z-20 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full pulse-dot" />
              <span className="text-[11px] font-bold text-emerald-400">AI Engine Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Bar — Brand Colored */}
      <section className="bg-white border-b border-slate-100 py-14 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs text-slate-400 font-bold tracking-widest uppercase">Enterprise-Grade Infrastructure</span>
          </div>
          <div className="flex justify-center items-center gap-3 flex-wrap">
            {TECH_STACK.map(tech => (
              <div
                key={tech.name}
                className={`group flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 bg-white cursor-default transition-all duration-300 hover:scale-105 hover:shadow-md ${tech.bg} ${tech.border}`}
              >
                <div className="w-2 h-2 rounded-full transition-all duration-300" style={{ background: '#CBD5E1' }} />
                <span className="text-sm font-semibold text-slate-400 transition-all duration-300" style={{ color: undefined }}>
                  {tech.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating 3D Scene Divider */}
      <div ref={sceneRef} className="relative h-0 pointer-events-none">
        <div className="scroll-3d-element absolute -top-32 right-0 w-[300px] h-[300px] opacity-20 pointer-events-none hidden lg:block" />
      </div>

      {/* Features — CardSwap */}
      <section ref={featuresRef} className="features-section bg-[#F8FAFB] py-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full px-3.5 py-1 mb-4">
              <Star className="w-3 h-3 text-blue-600" />
              <span className="text-[11px] font-bold text-blue-600">FEATURES</span>
            </div>
            <h2 className="font-heading text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">
              All the Tools you need to help
            </h2>
            <p className="text-base text-slate-500 max-w-lg mx-auto">
              Empowering you with intelligent features to simplify stock analysis and connect with top opportunities effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Feature descriptions */}
            <div className="space-y-6">
              {FEATURES.map((f, i) => (
                <div key={i} className="feature-card flex gap-5 p-6 rounded-2xl bg-white border border-slate-200/60 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-600/5 transition-all duration-300 cursor-default group">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                    <f.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-slate-900 mb-1.5">{f.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: CardSwap */}
            <div className="h-[520px] relative hidden lg:block">
              <CardSwap cardDistance={60} verticalDistance={70} delay={4500} pauseOnHover={true}>
                <Card className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 h-full">
                  <div className="w-full h-48 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl mb-6 flex items-center justify-center">
                    <Activity className="w-16 h-16 text-white/80" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-slate-900 mb-3">LSTM Neural Engine</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Our proprietary LSTM architecture processes thousands of temporal features to generate high-confidence price predictions with institutional-grade accuracy.</p>
                </Card>
                <Card className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 h-full">
                  <div className="w-full h-48 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl mb-6 flex items-center justify-center">
                    <Zap className="w-16 h-16 text-white/80" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-slate-900 mb-3">Real-Time Analytics</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Stream live market data through our analytics pipeline. Interactive charts with zoom, overlay, and backtesting capabilities for deep market understanding.</p>
                </Card>
                <Card className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 h-full">
                  <div className="w-full h-48 bg-gradient-to-br from-violet-600 to-purple-800 rounded-2xl mb-6 flex items-center justify-center">
                    <Shield className="w-16 h-16 text-white/80" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-slate-900 mb-3">Transparent Metrics</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Full visibility into model performance with live RMSE, MAE, and R-squared scores. Every prediction comes with confidence intervals and accuracy tracking.</p>
                </Card>
                <Card className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 h-full">
                  <div className="w-full h-48 bg-gradient-to-br from-amber-500 to-orange-700 rounded-2xl mb-6 flex items-center justify-center">
                    <Globe className="w-16 h-16 text-white/80" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-slate-900 mb-3">Sentiment Fusion</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Aggregate news sentiment, social signals, and macro indicators into a unified forecast model. 360-degree market intelligence updated every minute.</p>
                </Card>
              </CardSwap>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section ref={dashboardRef} className="py-24 px-6 lg:px-12" style={{ background: 'linear-gradient(180deg, #F8FAFB 0%, #EFF6FF 100%)' }}>
        <div className="dashboard-preview max-w-6xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-2xl shadow-blue-600/5 overflow-hidden">
          <div className="bg-slate-50/80 border-b border-slate-200/80 px-7 py-4 flex justify-between items-center">
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

          <div className="p-7 flex gap-6">
            <div className="flex-1">
              <svg width="100%" height="200" viewBox="0 0 600 200" preserveAspectRatio="none" className="block rounded-2xl border border-slate-100">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
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
                  <div key={l} className="flex-1 bg-slate-50/80 rounded-xl px-4 py-3.5">
                    <div className="text-[10px] text-slate-400 font-bold mb-1">{l}</div>
                    <div className={`font-heading text-lg font-extrabold ${c}`}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

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
      <section ref={stepsRef} className="bg-white py-24 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-4xl lg:text-5xl font-extrabold text-center text-slate-900 mb-16">
            Surgical Forecasting Workflow
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 relative">
            <div className="absolute top-7 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent z-0 hidden md:block" />
            {STEPS.map((s, i) => (
              <div key={i} className="step-item text-center px-5 relative z-10">
                <div className={`w-14 h-14 rounded-full mx-auto mb-6 flex items-center justify-center transition-all ${i === 0 ? 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-xl shadow-blue-600/20' : 'bg-white border-2 border-slate-200'}`}>
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
      <section ref={pricingRef} className="bg-[#F8FAFB] py-24 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-4xl lg:text-5xl font-extrabold text-slate-900 mb-3">
              Industrial Plans For Every Edge
            </h2>
            <p className="text-base text-slate-500">Scalable AI intelligence for individual traders and institutional desks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan, i) => (
              <div key={i} className="pricing-card relative">
                {plan.popular && (
                  <div className="text-center mb-3">
                    <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[11px] font-bold rounded-full px-4 py-1 shadow-lg shadow-blue-600/20">MOST POPULAR</span>
                  </div>
                )}
                <div className={`bg-white rounded-3xl p-9 ${plan.popular ? 'border-2 border-blue-600 shadow-xl shadow-blue-600/10' : 'border border-slate-200 hover:border-slate-300'} transition-all`}>
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
                  <button className={`w-full py-3.5 rounded-full text-sm font-bold cursor-pointer transition-all ${plan.popular ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-none shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30' : 'bg-transparent text-slate-900 border border-slate-300 hover:bg-slate-50 hover:border-slate-400'}`}>
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-16 px-6 lg:px-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className="font-heading font-extrabold text-base text-white tracking-tight">StockPP</span>
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

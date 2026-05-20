import { useState, useEffect, useRef, useCallback } from 'react'
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
  { name: 'FastAPI', color: '#009688' },
  { name: 'TensorFlow', color: '#FF6F00' },
  { name: 'React', color: '#61DAFB' },
  { name: 'Tailwind CSS', color: '#06B6D4' },
  { name: 'Scikit-learn', color: '#F89939' },
  { name: 'yfinance', color: '#4CAF50' },
  { name: 'Supabase', color: '#3ECF8E' },
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

function TickerCard({ ticker, className = '' }) {
  return (
    <div className={`bg-white/[0.07] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-4 min-w-[200px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] ${className}`}
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.3)' }}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-sm text-white">{ticker.symbol}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{ticker.name}</div>
        </div>
        <span className={`text-[11px] font-bold rounded-md px-2 py-1 ${ticker.up ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
          {ticker.change}
        </span>
      </div>
      <MiniChart up={ticker.up} />
      <div className="flex justify-between mt-2">
        <div>
          <div className="text-[10px] text-slate-500 font-semibold">PRICE</div>
          <div className="text-sm font-bold text-white">{ticker.price}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-blue-400 font-semibold">PREDICTED</div>
          <div className="text-sm font-bold text-blue-400">{ticker.pred}</div>
        </div>
      </div>
    </div>
  )
}

function MetricBadge({ label, value, className = '' }) {
  return (
    <div className={`bg-white/[0.07] backdrop-blur-xl border border-white/[0.08] rounded-xl px-4 py-3 shadow-lg ${className}`}
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.2)' }}>
      <div className="text-[10px] text-slate-400 font-bold mb-0.5">{label}</div>
      <div className="text-xl font-extrabold text-blue-400">{value}</div>
    </div>
  )
}

function MagneticButton({ children, className = '', onClick }) {
  const btnRef = useRef(null)

  const handleMouseMove = useCallback((e) => {
    const btn = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    gsap.to(btn, { x: x * 0.2, y: y * 0.2, duration: 0.4, ease: 'power2.out' })
  }, [])

  const handleMouseLeave = useCallback(() => {
    gsap.to(btnRef.current, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' })
  }, [])

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [showAnnouncement, setShowAnnouncement] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const dashboardRef = useRef(null)
  const stepsRef = useRef(null)
  const pricingRef = useRef(null)

  // Scroll state for navbar collapse
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll-triggered section animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero text entrance
      gsap.from('.hero-text', {
        scrollTrigger: { trigger: heroRef.current, start: 'top 80%' },
        y: 50, opacity: 0, duration: 1, ease: 'power3.out',
      })

      // Hero 3D scene parallax
      gsap.to('.hero-3d', {
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        },
        y: -80,
        scale: 0.85,
        opacity: 0.4,
      })

      // Tech stack stagger
      gsap.from('.tech-badge', {
        scrollTrigger: { trigger: '.tech-section', start: 'top 85%' },
        y: 30, opacity: 0, stagger: 0.06, duration: 0.6, ease: 'power2.out',
      })

      // Feature cards
      gsap.from('.feature-card', {
        scrollTrigger: { trigger: featuresRef.current, start: 'top 80%' },
        y: 60, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out',
      })

      // CardSwap reveal
      gsap.from('.cardswap-container', {
        scrollTrigger: { trigger: featuresRef.current, start: 'top 70%' },
        x: 80, opacity: 0, duration: 1, ease: 'power3.out',
      })

      // Dashboard preview
      gsap.from('.dashboard-preview', {
        scrollTrigger: { trigger: dashboardRef.current, start: 'top 80%' },
        y: 60, scale: 0.94, opacity: 0, duration: 1, ease: 'power3.out',
      })

      // Steps
      gsap.from('.step-item', {
        scrollTrigger: { trigger: stepsRef.current, start: 'top 80%' },
        y: 40, opacity: 0, stagger: 0.12, duration: 0.7, ease: 'power3.out',
      })

      // Step connector line draw
      gsap.from('.step-line', {
        scrollTrigger: { trigger: stepsRef.current, start: 'top 80%' },
        scaleX: 0, duration: 1.2, ease: 'power2.inOut', delay: 0.3,
      })

      // Pricing cards
      gsap.from('.pricing-card', {
        scrollTrigger: { trigger: pricingRef.current, start: 'top 80%' },
        y: 50, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out',
      })
    })
    return () => ctx.revert()
  }, [])

  const announcementOffset = showAnnouncement ? 36 : 0

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950" style={{ zoom: 0.9 }}>

      {/* Announcement Bar */}
      {showAnnouncement && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 text-white text-xs text-center py-2 font-medium tracking-wide flex items-center justify-center gap-3">
          <span className="bg-white/20 rounded-full px-2 py-0.5 text-[10px] font-bold">NEW</span>
          <span>StockPP v2.0 — LSTM + real-time sentiment now in beta.</span>
          <span className="text-blue-200 font-bold cursor-pointer hover:text-white transition-colors">Try it free</span>
          <button
            onClick={() => setShowAnnouncement(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-200 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navbar — dual-spacer collapse: wide at top, compact on scroll */}
      <nav
        className={`fixed left-0 right-0 z-50 h-[72px] px-6 flex items-center transition-all duration-500 ${
          isScrolled
            ? 'bg-slate-950/90 backdrop-blur-2xl border-b border-white/10 shadow-xl shadow-black/20'
            : 'bg-transparent border-b border-transparent'
        }`}
        style={{ top: isScrolled ? 0 : announcementOffset }}
      >
        <div className="w-full max-w-7xl mx-auto flex items-center">

          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 transition-all duration-500" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-extrabold text-lg text-white tracking-tight">StockPP</span>
          </div>

          {/* Left Spacer — flex-1 when wide, w-8 when collapsed */}
          <div className={`transition-all duration-500 ${isScrolled ? 'w-8' : 'flex-1'}`} />

          {/* Nav Links */}
          <div className="hidden lg:flex items-center gap-1 bg-white/5 rounded-full px-1.5 py-1 border border-white/10">
            {NAV_LINKS.map(link => (
              <button key={link} className="px-4 py-2 rounded-full text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors duration-200 bg-transparent border-none cursor-pointer">
                {link}
              </button>
            ))}
          </div>

          {/* Right Spacer — flex-1 when wide, w-8 when collapsed */}
          <div className={`transition-all duration-500 ${isScrolled ? 'w-8' : 'flex-1'}`} />

          {/* Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={() => navigate('/login')} className="hidden sm:block text-sm text-slate-400 hover:text-white bg-transparent border-none cursor-pointer font-medium px-4 py-2 rounded-full hover:bg-white/5 transition-colors duration-200">
              Login
            </button>
            <MagneticButton
              onClick={() => navigate('/signup')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none rounded-full px-5 py-2.5 text-sm font-bold cursor-pointer shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
            >
              Start Forecasting
            </MagneticButton>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-24 px-6 lg:px-12 overflow-hidden min-h-[100dvh] flex items-center" style={{ background: 'linear-gradient(165deg, #020617 0%, #0F172A 40%, #0B1121 100%)' }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(37,99,235,0.12)_0%,transparent_60%)] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(99,102,241,0.06)_0%,transparent_60%)] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16 relative w-full">
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
              <MagneticButton
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none rounded-full px-8 py-4 text-sm font-bold cursor-pointer flex items-center gap-2 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
              >
                Start Forecasting
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>
              <MagneticButton className="bg-white/5 text-white border border-white/10 rounded-full px-7 py-4 text-sm font-semibold cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all duration-200 backdrop-blur-sm">
                View Live Dashboard
              </MagneticButton>
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

          <div className="hero-3d flex-1 relative h-[520px] flex items-center justify-center">
            <div className="absolute inset-0 z-0">
              <HeroScene />
            </div>
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

      {/* Tech Stack Bar */}
      <section className="tech-section bg-slate-950 border-b border-white/5 py-14 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs text-slate-500 font-bold tracking-widest uppercase">Enterprise-Grade Infrastructure</span>
          </div>
          <div className="flex justify-center items-center gap-3 flex-wrap">
            {TECH_STACK.map(tech => (
              <TechBadge key={tech.name} name={tech.name} brandColor={tech.color} />
            ))}
          </div>
        </div>
      </section>

      {/* Features — CardSwap */}
      <section ref={featuresRef} className="features-section py-24 px-6 lg:px-12 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full px-3.5 py-1 mb-4">
              <Star className="w-3 h-3 text-blue-400" />
              <span className="text-[11px] font-bold text-blue-400">FEATURES</span>
            </div>
            <h2 className="font-heading text-4xl lg:text-5xl font-extrabold text-white mb-4">
              All the Tools you need to help
            </h2>
            <p className="text-base text-slate-400 max-w-lg mx-auto">
              Empowering you with intelligent features to simplify stock analysis and connect with top opportunities effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center justify-items-center">
            {/* Left: Feature list */}
            <div className="space-y-5 w-full">
              {FEATURES.map((f, i) => (
                <div key={i} className="feature-card flex gap-5 p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-blue-500/20 hover:bg-white/[0.06] transition-all duration-300 cursor-default group">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                    <f.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-white mb-1.5">{f.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: CardSwap */}
            <div className="cardswap-container hidden lg:flex justify-center items-center h-[500px]">
              <CardSwap
                width={420}
                height={340}
                cardDistance={50}
                verticalDistance={60}
                delay={4500}
                pauseOnHover
                clickToSwap
                skewAmount={5}
              >
                <Card className="!bg-gradient-to-br !from-slate-800 !to-slate-900 !border-white/10 rounded-2xl p-8 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-5">
                      <Activity className="w-7 h-7 text-blue-400" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-white mb-3">LSTM Neural Engine</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">Our proprietary LSTM architecture processes thousands of temporal features to generate high-confidence price predictions.</p>
                  </div>
                </Card>
                <Card className="!bg-gradient-to-br !from-slate-800 !to-slate-900 !border-white/10 rounded-2xl p-8 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-5">
                      <Zap className="w-7 h-7 text-emerald-400" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-white mb-3">Real-Time Analytics</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">Stream live market data through our analytics pipeline with interactive charts, overlays, and backtesting capabilities.</p>
                  </div>
                </Card>
                <Card className="!bg-gradient-to-br !from-slate-800 !to-slate-900 !border-white/10 rounded-2xl p-8 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-violet-500/20 rounded-2xl flex items-center justify-center mb-5">
                      <Shield className="w-7 h-7 text-violet-400" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-white mb-3">Transparent Metrics</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">Full visibility into model performance with live RMSE, MAE, and R-squared scores. Every prediction comes with confidence intervals.</p>
                  </div>
                </Card>
                <Card className="!bg-gradient-to-br !from-slate-800 !to-slate-900 !border-white/10 rounded-2xl p-8 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-5">
                      <Globe className="w-7 h-7 text-amber-400" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-white mb-3">Sentiment Fusion</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">Aggregate news sentiment, social signals, and macro indicators into a unified forecast model updated every minute.</p>
                  </div>
                </Card>
              </CardSwap>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section ref={dashboardRef} className="py-24 px-6 lg:px-12 bg-slate-950">
        <div className="dashboard-preview max-w-6xl mx-auto bg-slate-900 rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
          <div className="bg-slate-800/50 border-b border-white/5 px-7 py-4 flex justify-between items-center">
            <div className="flex gap-2">
              {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-1.5 text-xs text-blue-400 font-semibold">
              NVIDIA Corp (NVDA) · AI-Enhanced Forecast · Next 30 Days
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <div className="text-[10px] text-slate-500 font-bold">LATEST PRICE</div>
                <div className="font-heading text-lg font-extrabold text-white">$894.20</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-blue-400 font-bold">PREDICTED</div>
                <div className="font-heading text-lg font-extrabold text-blue-400">$942.15</div>
              </div>
            </div>
          </div>

          <div className="p-7 flex gap-6">
            <div className="flex-1">
              <svg width="100%" height="200" viewBox="0 0 600 200" preserveAspectRatio="none" className="block rounded-2xl border border-white/5">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[40, 80, 120, 160].map(y => <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />)}
                <polyline points="0,160 60,145 120,148 180,130 240,135 300,118 360,122 420,100" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
                <polyline points="420,100 480,85 540,78 600,65" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6,4" />
                <polygon points="0,200 0,160 60,145 120,148 180,130 240,135 300,118 360,122 420,100 480,85 540,78 600,65 600,200" fill="url(#chartGrad)" />
                <line x1="420" y1="30" x2="420" y2="200" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4,3" />
                <text x="426" y="44" fontSize="10" fill="#64748B" fontFamily="DM Sans, sans-serif">Forecast</text>
              </svg>

              <div className="flex gap-3 mt-5">
                {[['CONFIDENCE', '88%', 'text-blue-400'], ['VOLATILITY', 'Medium', 'text-white'], ['VOLUME', 'High', 'text-white'], ['MAE ERROR', '0.018', 'text-blue-400']].map(([l, v, c]) => (
                  <div key={l} className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3.5">
                    <div className="text-[10px] text-slate-500 font-bold mb-1">{l}</div>
                    <div className={`font-heading text-lg font-extrabold ${c}`}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-[220px] bg-slate-800 rounded-2xl p-6 border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-blue-300">AI Market Narrative</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                "The LSTM model identifies a bullish convergence on the 4-hour timeframe. High demand from institutional AI sector rotation suggests a probable upside breakout within the next 7 trading days."
              </p>
              <div className="mt-5">
                <div className="text-[11px] text-slate-500 mb-1.5">Model Confidence</div>
                <div className="bg-white/5 rounded-full h-1.5">
                  <div className="bg-blue-500 w-[88%] h-1.5 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
                </div>
                <div className="text-[11px] text-blue-400 mt-1 font-bold">88% Confidence</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section ref={stepsRef} className="bg-slate-950 py-24 px-6 lg:px-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-4xl lg:text-5xl font-extrabold text-center text-white mb-16">
            Surgical Forecasting Workflow
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 relative">
            <div className="step-line absolute top-7 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-0 hidden md:block origin-left" />
            {STEPS.map((s, i) => (
              <div key={i} className="step-item text-center px-5 relative z-10">
                <div className={`w-14 h-14 rounded-full mx-auto mb-6 flex items-center justify-center ${i === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl shadow-blue-500/20' : 'bg-white/5 border border-white/10'}`}>
                  <span className={`font-heading font-extrabold text-base ${i === 0 ? 'text-white' : 'text-slate-500'}`}>{s.n}</span>
                </div>
                <h4 className="font-heading font-bold text-base text-white mb-2.5">{s.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section ref={pricingRef} className="bg-slate-950 py-24 px-6 lg:px-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-4xl lg:text-5xl font-extrabold text-white mb-3">
              Industrial Plans For Every Edge
            </h2>
            <p className="text-base text-slate-400">Scalable AI intelligence for individual traders and institutional desks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan, i) => (
              <div key={i} className="pricing-card relative">
                {plan.popular && (
                  <div className="text-center mb-3">
                    <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[11px] font-bold rounded-full px-4 py-1 shadow-lg shadow-blue-500/20">MOST POPULAR</span>
                  </div>
                )}
                <div className={`rounded-3xl p-9 ${plan.popular ? 'bg-white/[0.06] border-2 border-blue-500/50 shadow-xl shadow-blue-500/10' : 'bg-white/[0.03] border border-white/5 hover:border-white/10'} transition-all`}>
                  <div className={`text-[11px] font-bold mb-2 ${plan.popular ? 'text-blue-400' : 'text-slate-500'}`}>{plan.tier}</div>
                  <div className="flex items-baseline gap-1.5 mb-7">
                    <span className={`font-heading text-5xl font-extrabold ${plan.popular ? 'text-blue-400' : 'text-white'}`}>{plan.price}</span>
                    {plan.per && <span className="text-sm text-slate-500">{plan.per}</span>}
                  </div>
                  <div className="flex flex-col gap-3 mb-8">
                    {plan.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-2.5">
                        <div className="w-[18px] h-[18px] rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <ChevronRight className="w-2.5 h-2.5 text-blue-400" />
                        </div>
                        <span className="text-sm text-slate-400">{f}</span>
                      </div>
                    ))}
                  </div>
                  <MagneticButton className={`w-full py-3.5 rounded-full text-sm font-bold cursor-pointer transition-all ${plan.popular ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20'}`}>
                    {plan.cta}
                  </MagneticButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-16 px-6 lg:px-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
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
                <div className="text-xs font-bold text-slate-500 mb-4 tracking-wider">{col.title.toUpperCase()}</div>
                <div className="flex flex-col gap-2.5">
                  {col.links.map(l => <span key={l} className="text-sm text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">{l}</span>)}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-7 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-xs text-slate-600">2026 StockPP. All rights reserved.</span>
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

function TechBadge({ name, brandColor }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="tech-badge flex items-center gap-2 px-5 py-2.5 rounded-full border cursor-default transition-all duration-300 hover:scale-105"
      style={{
        borderColor: hovered ? brandColor + '40' : 'rgba(255,255,255,0.08)',
        background: hovered ? brandColor + '10' : 'rgba(255,255,255,0.03)',
      }}
    >
      <div className="w-2 h-2 rounded-full transition-all duration-300" style={{ background: hovered ? brandColor : '#475569' }} />
      <span className="text-sm font-semibold transition-all duration-300" style={{ color: hovered ? brandColor : '#64748B' }}>
        {name}
      </span>
    </div>
  )
}

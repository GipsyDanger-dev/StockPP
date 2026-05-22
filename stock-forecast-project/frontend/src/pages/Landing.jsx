import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ArrowRight, X, Check, Zap, Shield, Globe, BarChart3, TrendingUp, LineChart } from 'lucide-react'

import { gsap } from 'gsap/dist/gsap'
import { useGSAP } from '@gsap/react/dist'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { SplitText } from 'gsap/dist/SplitText'
import { ScrambleTextPlugin } from 'gsap/dist/ScrambleTextPlugin'
import { TextPlugin } from 'gsap/dist/TextPlugin'

import HeroScene from '../components/landing/HeroScene'
import CardSwap, { Card } from '../components/landing/CardSwap'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, ScrambleTextPlugin, TextPlugin)

const NAV_LINKS = ['Features', 'How It Works', 'Pricing']

const TICKERS = [
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: '$894.20', pred: '$942.15', change: '+5.36%', up: true },
  { symbol: 'AAPL', name: 'Apple Inc.', price: '$189.40', pred: '$201.80', change: '+6.54%', up: true },
  { symbol: 'BBCA.JK', name: 'Bank BCA', price: 'Rp9.250', pred: 'Rp9.750', change: '+5.41%', up: true },
]

const TECH_STACK = [
  { name: 'FastAPI', color: '#009688', icon: 'fastapi' },
  { name: 'TensorFlow', color: '#FF6F00', icon: 'tensorflow' },
  { name: 'React', color: '#61DAFB', icon: 'react' },
  { name: 'Tailwind', color: '#06B6D4', icon: 'tailwind' },
  { name: 'Scikit-learn', color: '#F89939', icon: 'sklearn' },
  { name: 'yfinance', color: '#4CAF50', icon: 'yfinance' },
  { name: 'Supabase', color: '#3ECF8E', icon: 'supabase' },
]

const FEATURES = [
  { icon: LineChart, title: 'LSTM Prediction Engine', desc: 'Trained per-ticker on historical price data. Learns patterns from 60-day windows and forecasts up to 30 days ahead.', accent: 'indigo' },
  { icon: Globe, title: 'Live Market Data', desc: 'Real-time quotes from Yahoo Finance and Finnhub. Supports US stocks and Indonesian tickers like BBCA.JK.', accent: 'emerald' },
  { icon: BarChart3, title: 'Accuracy Metrics', desc: 'Every prediction comes with RMSE and MAE scores. You see exactly how reliable each forecast is.', accent: 'violet' },
  { icon: Shield, title: 'Prediction Validation', desc: 'Forecasts are automatically checked against actual prices. Track direction accuracy over time.', accent: 'amber' },
]

const STEPS = [
  { n: '01', title: 'Fetch data', desc: 'Historical prices pulled from Yahoo Finance and Finnhub APIs in real-time.', icon: TrendingUp },
  { n: '02', title: 'Normalize', desc: 'Price data scaled to 0-1 range and shaped into 60-day sequences.', icon: Activity },
  { n: '03', title: 'Predict', desc: 'LSTM neural network runs inference and generates price forecasts.', icon: Zap },
  { n: '04', title: 'Display', desc: 'Results shown on your dashboard with interactive charts.', icon: BarChart3 },
]

const PLANS = [
  { tier: 'Starter', price: '$99', per: '/mo', popular: false, features: ['5 active forecasts', 'Daily prediction updates', 'Standard dashboard', 'Email support'] },
  { tier: 'Professional', price: '$299', per: '/mo', popular: true, features: ['Unlimited forecasts', 'Hourly updates', 'Full sentiment analysis', 'API access', 'Backtesting module'] },
  { tier: 'Enterprise', price: 'Custom', per: '', popular: false, features: ['Custom model training', 'High-frequency data feed', 'Dedicated support', 'Custom LSTM architecture'] },
]

const ACCENT = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-200' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-200' },
}

function MiniChart({ up = true }) {
  const points = up
    ? '0,50 20,45 40,48 60,35 80,38 100,28 120,30 140,18 160,22 180,10'
    : '0,10 20,15 40,12 60,25 80,22 100,32 120,30 140,42 160,38 180,50'
  return (
    <svg width="180" height="60" viewBox="0 0 180 60" fill="none">
      <defs>
        <linearGradient id={`g-${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? '#4F46E5' : '#EF4444'} stopOpacity="0.12" />
          <stop offset="100%" stopColor={up ? '#4F46E5' : '#EF4444'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={up ? '#4F46E5' : '#EF4444'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={`0,50 ${points} 180,60 0,60`} fill={`url(#g-${up})`} />
    </svg>
  )
}

function TickerCard({ ticker }) {
  return (
    <div className="glass rounded-2xl p-4 min-w-[190px]">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-sm text-slate-900 font-heading">{ticker.symbol}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{ticker.name}</div>
        </div>
        <span className={`text-[11px] font-semibold rounded-md px-1.5 py-0.5 ${ticker.up ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-500'}`}>
          {ticker.change}
        </span>
      </div>
      <MiniChart up={ticker.up} />
      <div className="flex justify-between mt-2">
        <div>
          <div className="text-[10px] text-slate-400 font-medium">PRICE</div>
          <div className="text-sm font-semibold text-slate-900">{ticker.price}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-indigo-500 font-medium">PREDICTED</div>
          <div className="text-sm font-semibold text-indigo-600">{ticker.pred}</div>
        </div>
      </div>
    </div>
  )
}

function MetricBadge({ label, value }) {
  return (
    <div className="glass rounded-xl px-3.5 py-2.5">
      <div className="text-[10px] text-slate-400 font-medium">{label}</div>
      <div className="text-lg font-bold text-indigo-600 font-heading">{value}</div>
    </div>
  )
}

function TechLogo({ icon, size = 20, color = 'currentColor' }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' }
  switch (icon) {
    case 'fastapi':
      return (
        <svg {...s}>
          <path d="M12 2L2 19.5h20L12 2z" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M12 7v6m0 0l-3 5m3-5l3 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'tensorflow':
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.08" />
          <path d="M8 8v8l4 2V10L8 8z" fill={color} fillOpacity="0.5" />
          <path d="M16 8v8l-4 2V10l4-2z" fill={color} fillOpacity="0.3" />
        </svg>
      )
    case 'react':
      return (
        <svg {...s}>
          <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke={color} strokeWidth="1.2" fill="none" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke={color} strokeWidth="1.2" fill="none" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke={color} strokeWidth="1.2" fill="none" transform="rotate(-60 12 12)" />
          <circle cx="12" cy="12" r="2" fill={color} />
        </svg>
      )
    case 'tailwind':
      return (
        <svg {...s}>
          <path d="M4 12c0-2 1.5-4 4.5-4 4 0 4.5 4 8.5 4 3 0 4.5-2 4.5-4" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M4 16c0-2 1.5-4 4.5-4 4 0 4.5 4 8.5 4 3 0 4.5-2 4.5-4" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
        </svg>
      )
    case 'sklearn':
      return (
        <svg {...s}>
          <rect x="3" y="3" width="18" height="18" rx="4" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.08" />
          <path d="M7 15c2-4 4-8 6-8s3 5 4 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <circle cx="12" cy="11" r="2" fill={color} fillOpacity="0.5" />
        </svg>
      )
    case 'yfinance':
      return (
        <svg {...s}>
          <rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.08" />
          <polyline points="6,16 10,11 14,13 18,8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="18" cy="8" r="1.5" fill={color} />
        </svg>
      )
    case 'supabase':
      return (
        <svg {...s}>
          <path d="M4 17V7l7-4 7 4v10l-7 4-7-4z" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.08" strokeLinejoin="round" />
          <path d="M11 3v18" stroke={color} strokeWidth="1" opacity="0.2" />
          <circle cx="11" cy="11" r="3" stroke={color} strokeWidth="1.5" fill="none" />
        </svg>
      )
    default:
      return <div className="w-5 h-5 rounded-full" style={{ background: color, opacity: 0.4 }} />
  }
}

export default function Landing() {
  const navigate = useNavigate()
  const [showAnnouncement, setShowAnnouncement] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const containerRef = useRef(null)
  const heroHeadingRef = useRef(null)
  const heroSubRef = useRef(null)
  const scrambleRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useGSAP(() => {
    // Hero heading SplitText
    const heroSplit = new SplitText(heroHeadingRef.current, {
      type: 'chars,words,lines',
      charsClass: 'char',
      wordsClass: 'word',
      linesClass: 'line',
    })
    gsap.from(heroSplit.chars, {
      y: 50,
      opacity: 0,
      rotateX: -30,
      stagger: 0.02,
      duration: 0.7,
      ease: 'back.out(1.2)',
      delay: 0.3,
    })

    // Hero subtitle
    gsap.from(heroSubRef.current, {
      opacity: 0,
      y: 16,
      duration: 0.6,
      delay: 0.8,
      ease: 'power2.out',
    })

    // Scramble text badge
    if (scrambleRef.current) {
      gsap.to(scrambleRef.current, {
        duration: 1.5,
        scrambleText: {
          text: 'AI-POWERED FORECASTING',
          chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
          revealDelay: 0.5,
          speed: 0.3,
        },
        delay: 0.2,
      })
    }

    // Hero CTAs
    gsap.from('.hero-cta', {
      y: 24,
      opacity: 0,
      stagger: 0.12,
      duration: 0.6,
      ease: 'power3.out',
      delay: 1,
    })

    // Hero stats
    gsap.from('.hero-stat', {
      y: 16,
      opacity: 0,
      stagger: 0.08,
      duration: 0.5,
      ease: 'power2.out',
      delay: 1.3,
    })

    // Hero 3D parallax
    gsap.to('.hero-3d', {
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5,
      },
      y: -60,
      scale: 0.92,
      opacity: 0.4,
    })

    // Tech stack stagger
    gsap.from('.tech-item', {
      scrollTrigger: { trigger: '.tech-section', start: 'top 85%' },
      y: 20,
      opacity: 0,
      stagger: 0.06,
      duration: 0.5,
      ease: 'power2.out',
    })

    // Feature heading SplitText
    const featureHeading = document.querySelector('.features-heading')
    if (featureHeading) {
      const featureSplit = new SplitText(featureHeading, { type: 'words', wordsClass: 'word' })
      gsap.from(featureSplit.words, {
        scrollTrigger: { trigger: '.features-section', start: 'top 80%' },
        y: 24,
        opacity: 0,
        stagger: 0.04,
        duration: 0.6,
        ease: 'power3.out',
      })
    }

    // Feature cards
    gsap.utils.toArray('.feature-card').forEach((card) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 88%',
          end: 'top 60%',
          scrub: 0.5,
        },
        y: 40,
        opacity: 0,
        scale: 0.97,
      })
    })

    // CardSwap reveal
    gsap.from('.cardswap-wrap', {
      scrollTrigger: { trigger: '.features-section', start: 'top 70%' },
      x: 40,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
    })

    // Dashboard preview
    gsap.from('.dashboard-preview', {
      scrollTrigger: {
        trigger: '.dashboard-section',
        start: 'top 80%',
        end: 'top 40%',
        scrub: 0.8,
      },
      y: 50,
      scale: 0.95,
      opacity: 0,
    })

    // Chart line draw
    const chartLine = document.querySelector('.chart-line-main')
    if (chartLine) {
      const lineLength = chartLine.getTotalLength()
      gsap.set(chartLine, { strokeDasharray: lineLength, strokeDashoffset: lineLength })
      gsap.to(chartLine, {
        scrollTrigger: { trigger: '.dashboard-section', start: 'top 70%' },
        strokeDashoffset: 0,
        duration: 2,
        ease: 'power2.inOut',
      })
    }

    // Steps stagger
    gsap.utils.toArray('.step-item').forEach((step, i) => {
      gsap.from(step, {
        scrollTrigger: { trigger: step, start: 'top 88%' },
        y: 30,
        opacity: 0,
        duration: 0.6,
        delay: i * 0.1,
        ease: 'power3.out',
      })
    })

    // Step connector line
    gsap.from('.step-line', {
      scrollTrigger: { trigger: '.steps-section', start: 'top 80%' },
      scaleX: 0,
      duration: 1.2,
      ease: 'power2.inOut',
      delay: 0.3,
    })

    // Pricing cards
    gsap.from('.pricing-card', {
      scrollTrigger: { trigger: '.pricing-section', start: 'top 80%' },
      y: 40,
      opacity: 0,
      stagger: 0.12,
      duration: 0.7,
      ease: 'power3.out',
    })

    // Footer
    gsap.from('.footer-content', {
      scrollTrigger: { trigger: '.footer-section', start: 'top 90%' },
      y: 24,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    })

  }, { scope: containerRef })

  const announcementOffset = showAnnouncement ? 36 : 0

  return (
    <div ref={containerRef} className="min-h-screen overflow-x-hidden mesh-bg relative">

      {/* Global noise overlay */}
      <div className="noise-overlay" />

      {/* ===== Section 1: Announcement Bar ===== */}
      {showAnnouncement && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-white/70 backdrop-blur-xl border-b border-indigo-100/50 text-xs text-center py-2 font-medium text-slate-500 flex items-center justify-center gap-3">
          <span className="bg-indigo-100 text-indigo-600 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">New</span>
          <span>Real-time sentiment analysis now in beta</span>
          <button
            onClick={() => setShowAnnouncement(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-none cursor-pointer p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ===== Section 2: Navbar ===== */}
      <nav
        className="fixed left-0 right-0 z-50 h-[64px] px-6 flex items-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ top: announcementOffset }}
      >
        <div className={`w-full max-w-6xl mx-auto flex items-center h-full px-5 rounded-2xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${isScrolled ? 'glass-strong' : ''}`}>
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-extrabold text-base text-slate-900 tracking-tight">StockPP</span>
          </div>

          <div className="hidden lg:flex items-center justify-center flex-1 gap-1">
            {NAV_LINKS.map(link => (
              <button key={link} className="px-4 py-2 rounded-xl text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] bg-transparent border-none cursor-pointer">
                {link}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="hidden sm:block text-sm text-slate-500 hover:text-slate-900 bg-transparent border-none cursor-pointer font-medium px-3 py-2 rounded-xl hover:bg-slate-100/60 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
              Log in
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="btn-accent rounded-xl px-5 py-2 text-sm font-semibold cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ===== Section 3: Hero ===== */}
      <section className="hero-section relative pt-32 pb-32 px-6 lg:px-12 min-h-[100dvh] flex items-center overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="orb orb-indigo w-[500px] h-[500px] -top-40 -left-40" />
        <div className="orb orb-violet w-[400px] h-[400px] top-20 right-[-10%]" />
        <div className="orb orb-blue w-[300px] h-[300px] bottom-0 left-[30%]" />
        <div className="orb orb-pink w-[250px] h-[250px] top-[60%] right-[20%]" />
        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-40" />
        {/* Geometric accent lines */}
        <div className="geo-line top-[30%] left-0 w-[40%]" />
        <div className="geo-line top-[70%] right-0 w-[35%]" />
        <div className="geo-line-v top-0 left-[25%] h-[50%]" />
        <div className="geo-line-v top-[20%] right-[15%] h-[60%]" />
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20 relative w-full">
          <div className="hero-text flex-1 z-10">
            <div className="inline-flex items-center gap-2 glass-subtle rounded-full px-3.5 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full pulse-dot" />
              <span ref={scrambleRef} className="text-[11px] font-bold text-indigo-600 tracking-wider uppercase">AI-POWERED FORECASTING</span>
            </div>

            <h1 ref={heroHeadingRef} className="font-heading text-[clamp(2.5rem,5vw,4rem)] font-extrabold leading-[1.08] text-slate-900 mb-7 tracking-tight" style={{ perspective: '400px' }}>
              Predict where stocks are heading, before the market does.
            </h1>

            <p ref={heroSubRef} className="text-lg text-slate-500 leading-relaxed max-w-lg mb-10">
              LSTM neural networks trained on historical price data, delivering forecasts with transparent accuracy metrics. No black boxes.
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={() => navigate('/signup')}
                className="hero-cta btn-accent rounded-xl px-8 py-4 text-sm font-bold cursor-pointer flex items-center gap-2.5 group"
              >
                Get Started
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-[1px] transition-transform duration-300">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
              <button
                onClick={() => navigate('/login')}
                className="hero-cta glass-subtle text-slate-700 rounded-xl px-8 py-4 text-sm font-semibold cursor-pointer hover:bg-white/60 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                See How It Works
              </button>
            </div>

            <div className="flex items-center gap-10 mt-16 pt-8 border-t border-slate-200/60">
              {[['99.2%', 'Uptime SLA'], ['0.018', 'Avg MAE Error'], ['30+', 'Global Tickers']].map(([val, lbl]) => (
                <div key={lbl} className="hero-stat">
                  <div className="font-heading text-2xl font-extrabold text-slate-900">{val}</div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-3d flex-1 relative h-[500px] flex items-center justify-center">
            {/* Dark glass container for 3D scene */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden" style={{ background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <HeroScene />
            </div>
            <div className="absolute top-6 -left-2 z-10 float1">
              <TickerCard ticker={TICKERS[0]} />
            </div>
            <div className="absolute top-44 -right-4 z-10 float2">
              <TickerCard ticker={TICKERS[1]} />
            </div>
            <div className="absolute bottom-8 left-10 z-10 float3">
              <TickerCard ticker={TICKERS[2]} />
            </div>
            <div className="absolute top-10 right-6 z-20">
              <MetricBadge label="CONFIDENCE" value="88%" />
            </div>
            <div className="absolute bottom-24 right-2 z-20">
              <MetricBadge label="RMSE SCORE" value="0.024" />
            </div>
            <div className="absolute top-4 right-24 z-20 glass rounded-full px-3 py-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full pulse-dot" />
              <span className="text-[11px] font-bold text-emerald-600">Engine Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Section 4: Tech Stack ===== */}
      <section className="tech-section relative py-16 px-6 lg:px-12 overflow-hidden">
        <div className="orb orb-emerald w-[350px] h-[350px] -top-32 left-[10%]" />
        <div className="orb orb-indigo w-[300px] h-[300px] -bottom-32 right-[5%]" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-8">
            <span className="text-[11px] text-slate-400 font-bold tracking-[0.2em] uppercase">Built with</span>
          </div>
          <div className="flex justify-center items-center gap-2 flex-wrap">
            {TECH_STACK.map(tech => (
              <div
                key={tech.name}
                className="tech-item group flex items-center gap-2.5 px-4 py-2.5 rounded-xl hover:bg-white/50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-default"
              >
                <div className="transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110">
                  <TechLogo icon={tech.icon} size={18} color="#94A3B8" />
                </div>
                <span className="text-sm text-slate-400 group-hover:text-slate-700 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] font-medium">
                  {tech.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Section 5: Features ===== */}
      <section className="features-section relative py-36 px-6 lg:px-12 overflow-hidden">
        <div className="orb orb-violet w-[450px] h-[450px] top-[-10%] right-[-5%]" />
        <div className="orb orb-blue w-[350px] h-[350px] bottom-[-10%] left-[10%]" />
        <div className="absolute inset-0 dot-grid opacity-25" />
        <div className="max-w-6xl mx-auto relative">
          <div className="mb-16">
            <span className="inline-block glass-subtle rounded-full px-3 py-1 text-[10px] text-indigo-600 font-bold tracking-[0.2em] uppercase mb-5">Features</span>
            <h2 className="features-heading font-heading text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
              What StockPP does
            </h2>
            <p className="text-lg text-slate-500 max-w-lg leading-relaxed">
              Stock price forecasting with full transparency into how predictions are made and how accurate they are.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
            <div className="space-y-4">
              {FEATURES.map((f, i) => {
                const c = ACCENT[f.accent]
                return (
                  <div key={i} className="feature-card group">
                    {/* Double-bezel outer shell */}
                    <div className="p-[2px] rounded-[1.4rem] bg-gradient-to-br from-white/80 to-slate-200/30">
                      {/* Inner core */}
                      <div className="glass rounded-[calc(1.4rem-2px)] p-6 flex gap-5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5">
                        <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ${c.ring} group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]`}>
                          <f.icon className={`w-5 h-5 ${c.text}`} />
                        </div>
                        <div>
                          <h3 className="font-heading text-base font-bold text-slate-900 mb-1.5">{f.title}</h3>
                          <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="cardswap-wrap hidden lg:flex justify-center items-center h-[480px]">
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
                <Card className="!bg-white/70 !backdrop-blur-xl !border-white/60 rounded-2xl p-8 overflow-hidden !shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/30 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5 ring-1 ring-indigo-200/50">
                      <LineChart className="w-7 h-7 text-indigo-500" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-slate-900 mb-3">LSTM Neural Engine</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">Three-layer LSTM with 50 units per layer. Trained on 60-day sliding windows with MinMaxScaler normalization.</p>
                  </div>
                </Card>
                <Card className="!bg-white/70 !backdrop-blur-xl !border-white/60 rounded-2xl p-8 overflow-hidden !shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/30 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 ring-1 ring-emerald-200/50">
                      <Globe className="w-7 h-7 text-emerald-500" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-slate-900 mb-3">Real-Time Data</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">Live market quotes from Yahoo Finance and Finnhub. Supports 30+ tickers across US and Indonesian markets.</p>
                  </div>
                </Card>
                <Card className="!bg-white/70 !backdrop-blur-xl !border-white/60 rounded-2xl p-8 overflow-hidden !shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-violet-200/30 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mb-5 ring-1 ring-violet-200/50">
                      <BarChart3 className="w-7 h-7 text-violet-500" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-slate-900 mb-3">Transparent Metrics</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">RMSE, MAE, and R-squared scores on every prediction. Confidence intervals so you know when to trust the forecast.</p>
                  </div>
                </Card>
                <Card className="!bg-white/70 !backdrop-blur-xl !border-white/60 rounded-2xl p-8 overflow-hidden !shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-5 ring-1 ring-amber-200/50">
                      <Shield className="w-7 h-7 text-amber-500" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-slate-900 mb-3">Auto Validation</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">Predictions are automatically checked against actual prices when they come due. Track accuracy over time.</p>
                  </div>
                </Card>
              </CardSwap>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Section 6: Dashboard Preview ===== */}
      <section className="dashboard-section relative py-36 px-6 lg:px-12 overflow-hidden">
        <div className="orb orb-indigo w-[500px] h-[500px] top-[10%] left-[-10%]" />
        <div className="orb orb-pink w-[300px] h-[300px] bottom-[5%] right-[5%]" />
        <div className="max-w-5xl mx-auto relative">
          <div className="mb-12">
            <span className="inline-block glass-subtle rounded-full px-3 py-1 text-[10px] text-indigo-600 font-bold tracking-[0.2em] uppercase mb-5">Dashboard</span>
            <h2 className="font-heading text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
              See it in action
            </h2>
            <p className="text-lg text-slate-500">Interactive charts, live metrics, and AI-generated market narratives.</p>
          </div>

          {/* Double-bezel dashboard */}
          <div className="dashboard-preview p-[3px] rounded-[2rem] bg-gradient-to-br from-indigo-200/40 via-white/60 to-violet-200/30">
            <div className="glass-strong rounded-[calc(2rem-3px)] overflow-hidden">
              {/* Browser chrome */}
              <div className="bg-slate-50/80 border-b border-slate-200/50 px-6 py-3.5 flex justify-between items-center">
                <div className="flex gap-1.5">
                  {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />)}
                </div>
                <div className="bg-indigo-50 border border-indigo-200/50 rounded-lg px-4 py-1.5 text-xs text-indigo-600 font-semibold">
                  NVDA - 30 Day Forecast
                </div>
                <div className="flex gap-5">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold tracking-wider">PRICE</div>
                    <div className="text-base font-extrabold text-slate-900 font-heading">$894.20</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-indigo-500 font-bold tracking-wider">PREDICTED</div>
                    <div className="text-base font-extrabold text-indigo-600 font-heading">$942.15</div>
                  </div>
                </div>
              </div>

              <div className="p-7 flex gap-6 bg-white/50">
                <div className="flex-1">
                  <svg width="100%" height="200" viewBox="0 0 600 200" preserveAspectRatio="none" className="block rounded-2xl">
                    <defs>
                      <linearGradient id="chartGradLight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[40, 80, 120, 160].map(y => <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(0,0,0,0.04)" strokeWidth="1" />)}
                    <polyline className="chart-line-main" points="0,160 60,145 120,148 180,130 240,135 300,118 360,122 420,100 480,85 540,78 600,65" fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" />
                    <polygon points="0,200 0,160 60,145 120,148 180,130 240,135 300,118 360,122 420,100 480,85 540,78 600,65 600,200" fill="url(#chartGradLight)" />
                    <line x1="420" y1="30" x2="420" y2="200" stroke="rgba(0,0,0,0.06)" strokeWidth="1" strokeDasharray="3,2" />
                    <text x="426" y="46" fontSize="10" fill="#94A3B8" fontFamily="DM Sans, sans-serif" fontWeight="600">Forecast</text>
                  </svg>

                  <div className="grid grid-cols-4 gap-3 mt-5">
                    {[['CONFIDENCE', '88%', 'text-indigo-600'], ['VOLATILITY', 'Medium', 'text-slate-700'], ['VOLUME', 'High', 'text-slate-700'], ['MAE', '0.018', 'text-indigo-600']].map(([l, v, c]) => (
                      <div key={l} className="glass-subtle rounded-xl px-4 py-3.5">
                        <div className="text-[10px] text-slate-400 font-bold tracking-wider mb-1">{l}</div>
                        <div className={`text-base font-extrabold font-heading ${c}`}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-[220px] glass-subtle rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-indigo-600 font-heading">AI Narrative</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Bullish convergence on the 4H timeframe. Institutional AI sector rotation suggests a probable upside breakout within 7 trading days.
                  </p>
                  <div className="mt-5">
                    <div className="text-[11px] text-slate-400 mb-1.5 font-medium">Model Confidence</div>
                    <div className="bg-slate-100 rounded-full h-2">
                      <div className="bg-gradient-to-r from-indigo-500 to-violet-500 w-[88%] h-2 rounded-full shadow-[0_0_12px_rgba(79,70,229,0.3)]" />
                    </div>
                    <div className="text-[11px] text-indigo-600 mt-1.5 font-bold">88% Confidence</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Section 7: How It Works ===== */}
      <section className="steps-section relative py-36 px-6 lg:px-12 overflow-hidden">
        <div className="orb orb-emerald w-[400px] h-[400px] top-[-15%] left-[40%]" />
        <div className="orb orb-violet w-[300px] h-[300px] bottom-[-10%] right-[20%]" />
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="max-w-5xl mx-auto relative">
          <span className="inline-block glass-subtle rounded-full px-3 py-1 text-[10px] text-indigo-600 font-bold tracking-[0.2em] uppercase mb-5">Process</span>
          <h2 className="font-heading text-4xl lg:text-5xl font-extrabold text-slate-900 mb-16 tracking-tight">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 relative">
            <div className="step-line absolute top-7 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-indigo-300/40 to-transparent z-0 hidden md:block origin-left" />
            {STEPS.map((s, i) => (
              <div key={i} className="step-item text-center px-6 relative z-10">
                <div className={`w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center ${i === 0 ? 'btn-accent shadow-xl shadow-indigo-500/20' : 'glass-subtle ring-1 ring-slate-200/50'}`}>
                  <s.icon className={`w-6 h-6 ${i === 0 ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <div className={`text-[10px] font-bold tracking-wider mb-2 ${i === 0 ? 'text-indigo-600' : 'text-slate-400'}`}>{s.n}</div>
                <h4 className="font-heading font-bold text-base text-slate-900 mb-2.5">{s.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Section 8: Pricing ===== */}
      <section className="pricing-section relative py-36 px-6 lg:px-12 overflow-hidden">
        <div className="orb orb-blue w-[400px] h-[400px] top-[5%] right-[-5%]" />
        <div className="orb orb-indigo w-[350px] h-[350px] bottom-[10%] left-[-5%]" />
        <div className="max-w-5xl mx-auto relative">
          <div className="mb-14">
            <span className="inline-block glass-subtle rounded-full px-3 py-1 text-[10px] text-indigo-600 font-bold tracking-[0.2em] uppercase mb-5">Pricing</span>
            <h2 className="font-heading text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Plans
            </h2>
            <p className="text-lg text-slate-500">Scale from individual analysis to institutional-grade forecasting.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan, i) => (
              <div key={i} className="pricing-card relative">
                {plan.popular && (
                  <div className="mb-3 text-center">
                    <span className="btn-accent text-[10px] font-bold rounded-full px-4 py-1 uppercase tracking-wider">Most Popular</span>
                  </div>
                )}
                {/* Double-bezel pricing card */}
                <div className={`p-[2px] rounded-[1.4rem] ${plan.popular ? 'bg-gradient-to-br from-indigo-300/50 via-violet-300/30 to-indigo-300/50' : 'bg-gradient-to-br from-slate-200/40 to-white/60'}`}>
                  <div className={`glass rounded-[calc(1.4rem-2px)] p-8 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${plan.popular ? 'ring-1 ring-indigo-200/50' : ''}`}>
                    <div className={`text-xs font-bold mb-2 tracking-wider uppercase ${plan.popular ? 'text-indigo-600' : 'text-slate-400'}`}>{plan.tier}</div>
                    <div className="flex items-baseline gap-1.5 mb-8">
                      <span className={`font-heading text-5xl font-extrabold ${plan.popular ? 'gradient-text' : 'text-slate-900'}`}>{plan.price}</span>
                      {plan.per && <span className="text-sm text-slate-400">{plan.per}</span>}
                    </div>
                    <div className="flex flex-col gap-3 mb-8">
                      {plan.features.map((f, j) => (
                        <div key={j} className="flex items-center gap-2.5">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.popular ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                            <Check className={`w-3 h-3 ${plan.popular ? 'text-indigo-600' : 'text-slate-400'}`} />
                          </div>
                          <span className="text-sm text-slate-600">{f}</span>
                        </div>
                      ))}
                    </div>
                    <button className={`w-full py-3.5 rounded-xl text-sm font-bold cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${plan.popular ? 'btn-accent' : 'glass-subtle text-slate-700 hover:bg-white/60'}`}>
                      {plan.popular ? 'Get Started' : 'Choose ' + plan.tier}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Section 9: Footer ===== */}
      <footer className="footer-section relative py-20 px-6 lg:px-12 overflow-hidden">
        <div className="footer-content max-w-5xl mx-auto relative">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className="font-heading font-extrabold text-base text-slate-900 tracking-tight">StockPP</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-[260px]">
                Stock price forecasting powered by LSTM neural networks. Transparent metrics, no black boxes.
              </p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Dashboard', 'API Docs', 'Status'] },
              { title: 'Company', links: ['About', 'Privacy', 'Terms', 'Support'] },
              { title: 'Resources', links: ['Docs', 'Blog', 'Changelog'] },
            ].map(col => (
              <div key={col.title}>
                <div className="text-[11px] font-bold text-slate-400 mb-4 tracking-[0.15em] uppercase">{col.title}</div>
                <div className="flex flex-col gap-2.5">
                  {col.links.map(l => <span key={l} className="text-sm text-slate-500 cursor-pointer hover:text-slate-900 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">{l}</span>)}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200/60 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-xs text-slate-400">2026 StockPP. All rights reserved.</span>
            <div className="flex gap-5">
              {['GitHub', 'Twitter', 'LinkedIn'].map(s => (
                <span key={s} className="text-xs text-slate-400 cursor-pointer hover:text-slate-700 transition-colors duration-300">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

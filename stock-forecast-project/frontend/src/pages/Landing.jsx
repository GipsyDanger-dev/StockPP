import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ArrowRight, X, Check, Zap, Shield, Globe, BarChart3, TrendingUp, LineChart, Brain } from 'lucide-react'

import * as THREE from 'three'
import { gsap } from 'gsap/dist/gsap'
import { useGSAP } from '@gsap/react/dist'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { SplitText } from 'gsap/dist/SplitText'
import { ScrambleTextPlugin } from 'gsap/dist/ScrambleTextPlugin'
import { TextPlugin } from 'gsap/dist/TextPlugin'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, ScrambleTextPlugin, TextPlugin)

const MARQUEE_ITEMS = [
  { symbol: 'NVDA', price: '$875.40', change: '+2.3%', up: true },
  { symbol: 'AAPL', price: '$198.11', change: '+1.1%', up: true },
  { symbol: 'MSFT', price: '$420.55', change: '−0.4%', up: false },
  { symbol: 'GOOGL', price: '$174.23', change: '+0.8%', up: true },
  { symbol: 'TSLA', price: '$248.90', change: '−1.2%', up: false },
  { symbol: 'AMZN', price: '$185.60', change: '+1.7%', up: true },
  { symbol: 'META', price: '$510.20', change: '+2.1%', up: true },
  { symbol: 'AMD', price: '$164.30', change: '−0.6%', up: false },
  { symbol: 'PLTR', price: '$22.45', change: '+3.4%', up: true },
  { symbol: 'BBCA.JK', price: 'IDR 9,350', change: '+0.5%', up: true },
]

const DASHBOARD_VIEWS = [
  { ticker: 'NVDA', price: '$875.40', pred: '$892.10', change: '+1.9%', up: true, points: '0,60 30,55 60,50 90,45 120,40 150,35 180,30 210,25 240,20 270,15 300,10' },
  { ticker: 'AAPL', price: '$198.11', pred: '$201.50', change: '+1.7%', up: true, points: '0,40 30,42 60,38 90,45 120,43 150,40 180,38 210,35 240,33 270,30 300,28' },
  { ticker: 'MSFT', price: '$420.55', pred: '$418.20', change: '−0.6%', up: false, points: '0,30 30,32 60,28 90,35 120,38 150,36 180,40 210,42 240,38 270,35 300,33' },
  { ticker: 'GOOGL', price: '$174.23', pred: '$178.90', change: '+2.7%', up: true, points: '0,50 30,48 60,45 90,40 120,38 150,35 180,33 210,30 240,28 270,25 300,22' },
  { ticker: 'AMZN', price: '$185.60', pred: '$190.30', change: '+2.5%', up: true, points: '0,45 30,40 60,38 90,35 120,32 150,30 180,28 210,25 240,22 270,20 300,18' },
  { ticker: 'BBCA.JK', price: 'IDR 9,350', pred: 'IDR 9,500', change: '+1.6%', up: true, points: '0,50 30,48 60,46 90,44 120,42 150,40 180,38 210,36 240,35 270,34 300,33' },
]

export default function Landing() {
  const navigate = useNavigate()
  const [showAnnouncement, setShowAnnouncement] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const containerRef = useRef(null)
  const heroCanvasRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /* Three.js Hero Scene */
  useEffect(() => {
    const canvas = heroCanvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
    camera.position.set(0, 0, 6)

    function resize() {
      const w = parent.clientWidth
      const h = parent.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    window.addEventListener('resize', resize)

    scene.add(new THREE.AmbientLight(0xffffff, 0.3))
    const pl1 = new THREE.PointLight(0xFF6633, 2, 20)
    pl1.position.set(5, 5, 5)
    scene.add(pl1)
    const pl2 = new THREE.PointLight(0xffffff, 0.5, 20)
    pl2.position.set(-5, -3, -5)
    scene.add(pl2)

    const sphereGeo = new THREE.IcosahedronGeometry(1.5, 1)
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0xFF6633, wireframe: true, transparent: true, opacity: 0.6 })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    scene.add(sphere)

    const pCount = 80
    const positions = new Float32Array(pCount * 3)
    const pData = []
    for (let i = 0; i < pCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 2.5 + Math.random() * 1.5
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
      pData.push({ theta, phi, r, speed: 0.001 + Math.random() * 0.003 })
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const pMat = new THREE.PointsMaterial({ color: 0xFF6633, size: 0.05, transparent: true, opacity: 0.8 })
    const particles = new THREE.Points(pGeo, pMat)
    scene.add(particles)

    const lineGeo = new THREE.BufferGeometry()
    const lineMat = new THREE.LineBasicMaterial({ color: 0xFF6633, transparent: true, opacity: 0.15 })
    const lines = new THREE.LineSegments(lineGeo, lineMat)
    scene.add(lines)

    let mx = 0, my = 0
    const onMouseMove = (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2
      my = (e.clientY / window.innerHeight - 0.5) * 2
    }
    document.addEventListener('mousemove', onMouseMove)

    let raf
    function animate() {
      raf = requestAnimationFrame(animate)
      const t = performance.now() * 0.001
      sphere.rotation.y = t * 0.15
      sphere.rotation.x = Math.sin(t * 0.1) * 0.1
      const pos = pGeo.attributes.position.array
      for (let i = 0; i < pCount; i++) {
        const d = pData[i]
        d.theta += d.speed
        pos[i * 3] = d.r * Math.sin(d.phi) * Math.cos(d.theta)
        pos[i * 3 + 1] = d.r * Math.sin(d.phi) * Math.sin(d.theta)
        pos[i * 3 + 2] = d.r * Math.cos(d.phi)
      }
      pGeo.attributes.position.needsUpdate = true
      const lp = []
      for (let i = 0; i < pCount; i++) {
        for (let j = i + 1; j < pCount; j++) {
          const dx = pos[i * 3] - pos[j * 3]
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1]
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2]
          if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 1.2) {
            lp.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])
            lp.push(pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2])
          }
        }
      }
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3))
      camera.position.x += (mx * 0.5 - camera.position.x) * 0.05
      camera.position.y += (-my * 0.3 - camera.position.y) * 0.05
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', resize)
      renderer.dispose()
    }
  }, [])

  /* GSAP Animations */
  useGSAP(() => {
    // Hero text split + animate
    const heroTitle = document.getElementById('heroTitle')
    if (heroTitle) {
      const text = heroTitle.textContent
      heroTitle.innerHTML = text.split('').map(c =>
        c === ' ' ? ' ' : `<span class="char" style="display:inline-block">${c}</span>`
      ).join('')
      gsap.from('#heroTitle .char', {
        y: 80, opacity: 0, rotateX: -45,
        duration: 1, ease: 'power3.out',
        stagger: 0.03,
        transformOrigin: '50% 50% -50px',
        delay: 0.3,
      })
    }

    gsap.from('#heroBadge', { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out', delay: 0.1 })
    gsap.from('#heroSub', { opacity: 0, y: 30, duration: 0.6, ease: 'power3.out', delay: 0.8 })
    gsap.from('#heroCtas', { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out', delay: 1.0 })
    gsap.from('#heroMeta', { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out', delay: 1.2 })

    // Scramble badge
    const badge = document.getElementById('heroBadge')
    if (badge) {
      const target = 'AI-POWERED FORECASTING'
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let frame = 0
      const totalFrames = 60
      function scramble() {
        frame++
        const progress = frame / totalFrames
        let result = ''
        for (let i = 0; i < target.length; i++) {
          if (target[i] === ' ') { result += ' '; continue }
          result += progress * target.length > i + 0.5
            ? target[i]
            : chars[Math.floor(Math.random() * chars.length)]
        }
        badge.textContent = result
        if (frame < totalFrames) requestAnimationFrame(scramble)
      }
      setTimeout(scramble, 600)
    }

    // Marquee
    gsap.to('#marqueeRow', { x: '-50%', duration: 30, repeat: -1, ease: 'none' })

    // Scroll enter animations
    gsap.utils.toArray('[data-enter]').forEach(el => {
      gsap.from(el, {
        y: 60, opacity: 0,
        duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      })
    })

    // Stat counters
    gsap.utils.toArray('[data-count]').forEach(el => {
      const target = parseFloat(el.dataset.count)
      const decimals = parseInt(el.dataset.decimals) || 0
      const suffix = el.dataset.suffix || ''
      const obj = { val: 0 }
      gsap.to(obj, {
        val: target, duration: 2, ease: 'power1.inOut',
        scrollTrigger: { trigger: el, start: 'top 85%' },
        onUpdate: () => { el.textContent = obj.val.toFixed(decimals) + suffix },
      })
    })

    // Magnetic button
    document.querySelectorAll('.btn-magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect()
        gsap.to(btn, {
          x: (e.clientX - rect.left - rect.width / 2) * 0.35,
          y: (e.clientY - rect.top - rect.height / 2) * 0.35,
          duration: 0.3, ease: 'power3.out',
        })
      })
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' })
      })
    })

    // Bento tilt
    document.querySelectorAll('.bento-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect()
        gsap.to(card, {
          rotateX: ((e.clientY - rect.top) / rect.height - 0.5) * -12,
          rotateY: ((e.clientX - rect.left) / rect.width - 0.5) * 12,
          transformPerspective: 800, duration: 0.4, ease: 'power3.out',
        })
      })
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power3.out' })
      })
    })

  }, { scope: containerRef })

  const announcementOffset = showAnnouncement ? 36 : 0

  return (
    <div ref={containerRef} className="min-h-screen overflow-x-hidden" style={{ fontFamily: 'var(--font-display)', background: '#fff' }}>

      {/* Announcement Bar */}
      {showAnnouncement && (
        <div className="fixed top-0 left-0 right-0 z-[1000] flex items-center justify-center gap-3" style={{ background: '#FF6633', height: 36 }}>
          <span className="font-medium uppercase tracking-wide" style={{ font: '500 11px/16.5px var(--font-ui)', color: '#fff' }}>New: 30-day forecasting now available — Try it free</span>
          <button onClick={() => setShowAnnouncement(false)} className="bg-transparent border-none cursor-pointer text-white" style={{ fontSize: 18, lineHeight: 1, padding: '0 4px' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Navbar */}
      <nav className="fixed left-0 right-0 z-[999] flex items-center transition-all duration-400" style={{ top: announcementOffset, height: 56, background: isScrolled ? 'rgba(255,255,255,.92)' : 'transparent', backdropFilter: isScrolled ? 'blur(12px)' : 'none', borderBottom: isScrolled ? '1px solid #E5E7EB' : 'none' }}>
        <div className="max-w-[1400px] mx-auto px-10 flex items-center justify-between w-full">
          <a onClick={() => navigate('/')} className="font-medium text-black no-underline whitespace-nowrap cursor-pointer" style={{ font: '500 16px/19px var(--font-display)' }}>PRECISION ANALYTICS</a>
          <div className="hidden lg:flex gap-6 items-center">
            {['Features', 'How It Works', 'Pricing'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} className="text-black no-underline transition-colors hover:text-[#FF6633]" style={{ font: '400 16px/24px var(--font-display)' }}>{l}</a>
            ))}
          </div>
          <div className="hidden lg:flex gap-2 items-center">
            <button onClick={() => navigate('/login')} className="inline-flex items-center justify-center cursor-pointer bg-transparent transition-colors" style={{ height: 31, padding: '0 20px', borderRadius: 0, border: '1px solid #000', color: '#000', font: '400 10px/15px var(--font-ui)' }}>Log in</button>
            <button onClick={() => navigate('/signup')} className="inline-flex items-center justify-center cursor-pointer border-none transition-colors" style={{ height: 31, padding: '0 20px', borderRadius: 0, background: '#FF6633', color: '#fff', font: '400 10px/15px var(--font-ui)' }}>Get Started</button>
          </div>
          <button className="lg:hidden bg-transparent border-none cursor-pointer p-2" onClick={() => setDrawerOpen(true)} aria-label="Menu">
            <div className="w-5 h-0.5 bg-black mb-1" /><div className="w-5 h-0.5 bg-black mb-1" /><div className="w-5 h-0.5 bg-black" />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-white z-[1001] flex flex-col p-6">
          <div className="flex justify-between items-center mb-10">
            <span className="font-medium" style={{ font: '500 16px/19px var(--font-display)' }}>PRECISION ANALYTICS</span>
            <button onClick={() => setDrawerOpen(false)} className="bg-transparent border-none cursor-pointer text-2xl">&times;</button>
          </div>
          {['Features', 'How It Works', 'Pricing'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} onClick={() => setDrawerOpen(false)} className="text-black no-underline py-4" style={{ font: '400 30px/32px var(--font-display)', borderBottom: '1px solid #E5E7EB' }}>{l}</a>
          ))}
          <button onClick={() => { setDrawerOpen(false); navigate('/signup') }} className="mt-6 w-full inline-flex items-center justify-center cursor-pointer border-none" style={{ height: 44, borderRadius: 0, background: '#FF6633', color: '#fff', font: '400 12px/1 var(--font-ui)' }}>Get Started</button>
        </div>
      )}

      {/* Hero */}
      <section className="min-h-screen flex items-center relative overflow-hidden" style={{ paddingTop: 92 }} id="hero">
        <div className="absolute right-0 top-0 w-1/2 h-full z-[1] hidden lg:block">
          <canvas ref={heroCanvasRef} className="w-full h-full block" />
        </div>
        <div className="max-w-[1400px] mx-auto px-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative z-[2] w-full">
          <div className="max-w-[600px]">
            <div id="heroBadge" className="inline-block px-3 py-1 mb-6" style={{ border: '1px solid #FF6633', font: '500 11px/16.5px var(--font-ui)', color: '#FF6633' }}>AI-POWERED FORECASTING</div>
            <h1 id="heroTitle" className="mb-6" style={{ font: '500 65px/62px var(--font-display)', letterSpacing: 0 }}>Predict the market before it moves</h1>
            <p id="heroSub" className="mb-9" style={{ font: '400 16px/24px var(--font-display)', color: '#3B3B3B' }}>LSTM neural networks analyze 5 years of historical data, 6 technical indicators, and real-time market feeds to deliver 7-day price forecasts with quantified confidence.</p>
            <div id="heroCtas" className="flex gap-3 flex-wrap">
              <button onClick={() => navigate('/signup')} className="btn-magnetic inline-flex items-center justify-center cursor-pointer border-none transition-colors" style={{ height: 44, padding: '0 32px', borderRadius: 0, background: '#FF6633', color: '#fff', font: '400 12px/1 var(--font-ui)' }}>Get Started Free</button>
              <a href="#how-it-works" className="inline-flex items-center justify-center no-underline transition-colors" style={{ height: 44, padding: '0 32px', borderRadius: 0, border: '1px solid #FF6633', color: '#FF6633', font: '400 12px/1 var(--font-ui)' }}>See How It Works</a>
            </div>
            <div id="heroMeta" className="flex gap-6 mt-10 items-center flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2" style={{ background: '#FF6633' }} />
                <span className="font-medium uppercase tracking-wide" style={{ font: '500 11px/16.5px var(--font-ui)' }}>Engine Active</span>
              </div>
              <span className="font-medium uppercase tracking-wide" style={{ font: '500 11px/16.5px var(--font-ui)', color: '#3B3B3B' }}>Confidence: 88%</span>
              <span className="font-medium uppercase tracking-wide" style={{ font: '500 11px/16.5px var(--font-ui)', color: '#3B3B3B' }}>RMSE: 0.024</span>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <section className="overflow-hidden py-6" style={{ borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
        <div className="flex gap-10 whitespace-nowrap will-change-transform" id="marqueeRow">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((t, i) => (
            <div key={i} className="flex items-center gap-3" style={{ font: '400 16px/24px var(--font-display)' }}>
              <span className="font-medium">{t.symbol}</span>
              <span>{t.price}</span>
              <span className="font-medium" style={{ font: '500 11px/16.5px var(--font-ui)', color: t.up ? '#FF6633' : '#000' }}>{t.change}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20" id="tech-stack">
        <div className="max-w-[1400px] mx-auto px-10">
          <h3 className="text-center mb-11" data-enter style={{ font: '400 30px/32px var(--font-display)' }}>Built on proven infrastructure</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-6 text-center">
            {[
              { icon: '⚡', name: 'FastAPI' },
              { icon: '🧠', name: 'TensorFlow' },
              { icon: '⚛', name: 'React' },
              { icon: '🎨', name: 'Tailwind' },
              { icon: '📊', name: 'Scikit-learn' },
              { icon: '📈', name: 'yfinance' },
              { icon: '🔒', name: 'Supabase' },
            ].map(t => (
              <div key={t.name} data-enter className="flex flex-col items-center gap-3 px-4 py-6 transition-colors cursor-default" style={{ border: '1px solid #E5E7EB' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6633'} onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E7EB'}>
                <div className="text-3xl">{t.icon}</div>
                <span className="font-medium" style={{ font: '500 11px/16.5px var(--font-ui)', color: '#3B3B3B' }}>{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento */}
      <section className="py-20" id="features">
        <div className="max-w-[1400px] mx-auto px-10">
          <h3 className="mb-11" data-enter style={{ font: '400 30px/32px var(--font-display)' }}>Everything you need to forecast with confidence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <svg viewBox="0 0 24 24" className="w-6 h-6" stroke="#FF6633" fill="none" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>, title: 'LSTM Prediction Engine', desc: 'Three-layer LSTM neural network processes 20-day windows of 6 technical indicators — Close, Volume, MA20, MA50, RSI, MACD — to generate multi-step forecasts with walk-forward validation across 5 folds.', span: 'md:col-span-2 md:row-span-2' },
              { icon: <svg viewBox="0 0 24 24" className="w-6 h-6" stroke="#FF6633" fill="none" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, title: 'Live Market Data', desc: 'Real-time quotes via Finnhub. 30-second auto-refresh on analytics pages.', span: '' },
              { icon: <svg viewBox="0 0 24 24" className="w-6 h-6" stroke="#FF6633" fill="none" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>, title: 'Accuracy Metrics', desc: 'RMSE, MAE, R-squared reported per model. 2% tolerance gate for deployment.', span: '' },
              { icon: <svg viewBox="0 0 24 24" className="w-6 h-6" stroke="#FF6633" fill="none" strokeWidth="1.5"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>, title: 'Auto Validation', desc: 'Predictions validated against actual prices. Track direction accuracy and mean percent error per user.', span: '' },
            ].map((f, i) => (
              <div key={i} data-enter className={`bento-card p-10 relative transition-colors cursor-default ${f.span}`} style={{ border: '1px solid #E5E7EB' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6633'} onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E7EB'}>
                <div className="w-8 h-8 mb-5 flex items-center justify-center">{f.icon}</div>
                <h4 className="mb-3" style={{ font: '500 16px/19px var(--font-display)' }}>{f.title}</h4>
                <p style={{ font: '400 14px/20px var(--font-display)', color: '#3B3B3B' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Band */}
      <section className="py-20" style={{ background: '#000' }}>
        <div className="max-w-[1400px] mx-auto px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { count: '99.2', suffix: '%', decimals: '0', label: 'Uptime SLA' },
              { count: '0.018', suffix: '', decimals: '3', label: 'Avg MAE Error' },
              { count: '30', suffix: '+', decimals: '0', label: 'Global Tickers' },
              { count: '88', suffix: '%', decimals: '0', label: 'Model Confidence' },
            ].map((s, i) => (
              <div key={i} data-enter className="text-center px-6 py-10" style={{ border: '1px solid #3B3B3B' }}>
                <div data-count={s.count} data-suffix={s.suffix} data-decimals={s.decimals} style={{ font: '500 48px/1 var(--font-display)', color: '#FF6633', marginBottom: 8 }}>0</div>
                <div className="uppercase" style={{ font: '400 11px/16.5px var(--font-ui)', color: '#A6A6A6' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20" id="dashboard-preview">
        <div className="max-w-[1400px] mx-auto px-10">
          <h3 className="mb-11" data-enter style={{ font: '400 30px/32px var(--font-display)' }}>See the dashboard in action</h3>
        </div>
        <div data-enter className="overflow-hidden">
          <div className="flex gap-4 will-change-transform py-5 px-10">
            {DASHBOARD_VIEWS.map((d, i) => (
              <div key={i} className="flex-shrink-0 p-6" style={{ minWidth: 320, border: '1px solid #E5E7EB' }}>
                <div className="flex justify-between items-center mb-4">
                  <span style={{ font: '500 30px/32px var(--font-display)' }}>{d.ticker}</span>
                  <span style={{ font: '400 16px/24px var(--font-display)', color: '#3B3B3B' }}>{d.price}</span>
                </div>
                <div className="h-20 my-4 relative">
                  <svg viewBox="0 0 300 80" className="w-full h-full"><polyline points={d.points} fill="none" stroke={d.up ? '#FF6633' : '#000'} strokeWidth="2" /></svg>
                </div>
                <div className="flex justify-between" style={{ font: '400 10px/15px var(--font-ui)' }}>
                  <span>Predicted: {d.pred}</span>
                  <span style={{ color: d.up ? '#FF6633' : '#000' }}>{d.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20" style={{ background: '#FF6633' }} id="how-it-works">
        <div className="max-w-[1400px] mx-auto px-10">
          <h3 className="text-center mb-13" data-enter style={{ font: '400 30px/32px var(--font-display)', color: '#fff' }}>How It Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: '01', title: 'Fetch Data', desc: '5 years of historical data pulled from Yahoo Finance. 6 technical indicators computed in real-time.' },
              { n: '02', title: 'Normalize', desc: 'MinMaxScaler transforms features to 0–1 range. 20-day sliding windows created for sequence input.' },
              { n: '03', title: 'Predict', desc: '3-layer LSTM with 50 units each. 70-epoch training with Adam optimizer and MSE loss function.' },
              { n: '04', title: 'Display', desc: '7-day forecast with confidence intervals. Interactive charts showing historical + predicted prices.' },
            ].map((s, i) => (
              <div key={i} data-enter className="flex flex-col items-center text-center px-6 py-10">
                <div style={{ font: '500 65px/62px var(--font-display)', color: '#fff', marginBottom: 24 }}>{s.n}</div>
                <h4 className="mb-3" style={{ font: '500 16px/19px var(--font-display)', color: '#fff' }}>{s.title}</h4>
                <p style={{ font: '400 14px/20px var(--font-display)', color: 'rgba(255,255,255,.8)', maxWidth: 480 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20" id="pricing">
        <div className="max-w-[1400px] mx-auto px-10">
          <h3 className="text-center mb-4" data-enter style={{ font: '400 30px/32px var(--font-display)' }}>Simple, transparent pricing</h3>
          <p className="text-center mb-11" data-enter style={{ font: '400 16px/24px var(--font-display)', color: '#3B3B3B' }}>Start free. Scale as you grow.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { tier: 'Starter', price: '$99', period: 'per month', featured: false, features: ['5 ticker watchlist', '7-day forecasting', 'Basic technical indicators', 'Email support'], btnClass: 'btn-outline', btnText: 'Get Started' },
              { tier: 'Professional', price: '$299', period: 'per month', featured: true, features: ['30 ticker watchlist', '30-day forecasting', 'All technical indicators', 'Auto-retrain scheduling', 'Priority support'], btnClass: 'btn-primary', btnText: 'Get Started' },
              { tier: 'Enterprise', price: 'Custom', period: 'contact sales', featured: false, features: ['Unlimited tickers', 'Custom model training', 'API access', 'Dedicated support', 'SLA guarantee'], btnClass: 'btn-dark', btnText: 'Contact Sales' },
            ].map((plan, i) => (
              <div key={i} data-enter className="p-10 flex flex-col relative" style={{ border: `1px solid ${plan.featured ? '#FF6633' : '#E5E7EB'}` }}>
                {plan.featured && (
                  <div className="absolute left-10" style={{ top: -1, transform: 'translateY(-50%)', background: '#FF6633', color: '#fff', font: '500 11px/16.5px var(--font-ui)', padding: '2px 12px' }}>MOST POPULAR</div>
                )}
                <div className="uppercase mb-4" style={{ font: '400 11px/16.5px var(--font-ui)', color: '#3B3B3B' }}>{plan.tier}</div>
                <div className="mb-2" style={{ font: '500 65px/62px var(--font-display)' }}>{plan.price}</div>
                <div className="mb-8" style={{ font: '400 10px/15px var(--font-ui)', color: '#A6A6A6' }}>{plan.period}</div>
                <ul className="list-none mb-10 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 py-2" style={{ font: '400 14px/20px var(--font-display)', borderBottom: '1px solid #E5E7EB' }}>
                      <span style={{ color: '#FF6633', fontWeight: 500 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full inline-flex items-center justify-center cursor-pointer transition-colors"
                  style={{
                    height: plan.featured ? 44 : 31,
                    padding: '0 20px',
                    borderRadius: 0,
                    font: plan.featured ? '400 12px/1 var(--font-ui)' : '400 10px/15px var(--font-ui)',
                    ...(plan.featured
                      ? { background: '#FF6633', color: '#fff', border: 'none' }
                      : plan.btnClass === 'btn-dark'
                        ? { background: '#000', color: '#fff', border: 'none' }
                        : { background: 'transparent', color: '#FF6633', border: '1px solid #FF6633' }),
                  }}
                  onMouseEnter={e => {
                    if (plan.featured) e.currentTarget.style.background = '#E55A22'
                    else if (plan.btnClass === 'btn-dark') e.currentTarget.style.background = '#3B3B3B'
                    else { e.currentTarget.style.background = '#FF6633'; e.currentTarget.style.color = '#fff' }
                  }}
                  onMouseLeave={e => {
                    if (plan.featured) e.currentTarget.style.background = '#FF6633'
                    else if (plan.btnClass === 'btn-dark') e.currentTarget.style.background = '#000'
                    else { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FF6633' }
                  }}
                >{plan.btnText}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 pb-10" style={{ background: '#000', color: '#fff' }}>
        <div className="max-w-[1400px] mx-auto px-10">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-16">
            <div>
              <span className="font-medium" style={{ font: '500 16px/19px var(--font-display)', color: '#fff' }}>PRECISION ANALYTICS</span>
              <p className="mt-4 max-w-[280px]" style={{ font: '400 14px/20px var(--font-display)', color: '#A6A6A6' }}>AI-powered stock forecasting using LSTM neural networks. Predict the market before it moves.</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Dashboard', 'API'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Resources', links: ['Documentation', 'Market Insights', 'Status', 'Changelog'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="uppercase mb-5" style={{ font: '500 11px/16.5px var(--font-ui)', color: '#A6A6A6' }}>{col.title}</h4>
                {col.links.map(l => (
                  <a key={l} href="#" className="block no-underline mb-3 transition-opacity hover:opacity-80" style={{ font: '400 13px/19.5px var(--font-display)', color: '#fff' }}>{l}</a>
                ))}
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6" style={{ borderTop: '1px solid #3B3B3B' }}>
            <span style={{ font: '400 10px/15px var(--font-ui)', color: '#A6A6A6' }}>&copy; 2026 Precision Analytics. All rights reserved.</span>
            <div className="flex gap-4">
              {['Twitter', 'GitHub', 'LinkedIn'].map(s => (
                <a key={s} href="#" className="no-underline transition-opacity hover:opacity-80" style={{ font: '400 10px/15px var(--font-ui)', color: '#fff' }}>{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

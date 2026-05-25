import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'

import * as THREE from 'three'
import { gsap } from 'gsap/dist/gsap'
import { useGSAP } from '@gsap/react/dist'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

gsap.registerPlugin(useGSAP, ScrollTrigger)

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

const DASH_CARDS = [
  { ticker: 'NVDA', price: '$875.40', pred: '$892.10', change: '+1.9%', up: true, pts: '0,60 30,55 60,50 90,45 120,40 150,35 180,30 210,25 240,20 270,15 300,10' },
  { ticker: 'AAPL', price: '$198.11', pred: '$201.50', change: '+1.7%', up: true, pts: '0,40 30,42 60,38 90,45 120,43 150,40 180,38 210,35 240,33 270,30 300,28' },
  { ticker: 'MSFT', price: '$420.55', pred: '$418.20', change: '−0.6%', up: false, pts: '0,30 30,32 60,28 90,35 120,38 150,36 180,40 210,42 240,38 270,35 300,33' },
  { ticker: 'GOOGL', price: '$174.23', pred: '$178.90', change: '+2.7%', up: true, pts: '0,50 30,48 60,45 90,40 120,38 150,35 180,33 210,30 240,28 270,25 300,22' },
  { ticker: 'AMZN', price: '$185.60', pred: '$190.30', change: '+2.5%', up: true, pts: '0,45 30,40 60,38 90,35 120,32 150,30 180,28 210,25 240,22 270,20 300,18' },
  { ticker: 'BBCA.JK', price: 'IDR 9,350', pred: 'IDR 9,500', change: '+1.6%', up: true, pts: '0,50 30,48 60,46 90,44 120,42 150,40 180,38 210,36 240,35 270,34 300,33' },
]

export default function Landing() {
  const navigate = useNavigate()
  const [showAnnounce, setShowAnnounce] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const ref = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  /* Three.js CTA scene */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
    camera.position.set(0, 0, 5)
    const group = new THREE.Group()
    scene.add(group)

    function resize() {
      const w = parent.clientWidth
      const h = parent.clientHeight || window.innerHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      group.position.x = w < 768 ? 2 : 5
    }
    resize()
    window.addEventListener('resize', resize)

    // Outer dodecahedron (large, slow)
    const mesh1 = new THREE.Mesh(
      new THREE.DodecahedronGeometry(2.2, 0),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.18 })
    )
    group.add(mesh1)

    // Inner icosahedron (orange, breathing + pulsing opacity)
    const mesh2 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.3, 1),
      new THREE.MeshBasicMaterial({ color: 0xFF6633, wireframe: true, transparent: true, opacity: 0.25 })
    )
    group.add(mesh2)

    // Core glow sphere (very faint, sits inside icosahedron)
    const coreGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xFF6633, transparent: true, opacity: 0.04 })
    )
    group.add(coreGlow)

    // Satellite octahedron #1 (orbiting)
    const sat1 = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.5, 0),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.3 })
    )
    group.add(sat1)

    // Satellite tetrahedron #2 (counter-orbiting)
    const sat2 = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.35, 0),
      new THREE.MeshBasicMaterial({ color: 0xFF6633, wireframe: true, transparent: true, opacity: 0.22 })
    )
    group.add(sat2)

    // 3 orbit rings at different tilts
    const rings = []
    const ringData = [
      { r: 3, tube: 0.008, tilt: 0.35, zTilt: 0, speed: 0.12, opacity: 0.14 },
      { r: 3.8, tube: 0.012, tilt: -0.17, zTilt: 0.1, speed: -0.07, opacity: 0.1 },
      { r: 4.5, tube: 0.006, tilt: 0.55, zTilt: -0.15, speed: 0.04, opacity: 0.07 },
    ]
    ringData.forEach(rd => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(rd.r, rd.tube, 8, 80),
        new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: rd.opacity })
      )
      ring.rotation.x = Math.PI * rd.tilt
      ring.rotation.z = Math.PI * rd.zTilt
      ring.userData = { speed: rd.speed }
      group.add(ring)
      rings.push(ring)
    })

    // Particles (200) with orbital data
    const pCount = 200
    const pData = []
    const pPos = new Float32Array(pCount * 3)
    const pSizes = new Float32Array(pCount)
    for (let i = 0; i < pCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      const r = 2.5 + Math.random() * 2.5
      pData.push({ phi, theta, r, speed: 0.08 + Math.random() * 0.18, phase: Math.random() * Math.PI * 2 })
      pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pPos[i * 3 + 2] = r * Math.cos(phi)
      pSizes[i] = 0.02 + Math.random() * 0.04
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    pGeo.setAttribute('size', new THREE.BufferAttribute(pSizes, 1))
    const pMat = new THREE.PointsMaterial({ color: 0xFF6633, size: 0.05, transparent: true, opacity: 0.8, sizeAttenuation: true })
    const particles = new THREE.Points(pGeo, pMat)
    group.add(particles)

    // Inner floating fragments (small wireframe shards close to center)
    const frags = []
    for (let i = 0; i < 12; i++) {
      const size = 0.08 + Math.random() * 0.12
      const geo = Math.random() > 0.5
        ? new THREE.TetrahedronGeometry(size, 0)
        : new THREE.OctahedronGeometry(size, 0)
      const frag = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0xFF6633 : 0xffffff,
        wireframe: true, transparent: true, opacity: 0.15 + Math.random() * 0.2
      }))
      frag.userData = {
        phi: Math.acos(2 * Math.random() - 1),
        theta: Math.random() * Math.PI * 2,
        r: 1.8 + Math.random() * 1.2,
        speed: 0.15 + Math.random() * 0.25,
        rotSpeed: 0.5 + Math.random() * 1.5,
      }
      group.add(frag)
      frags.push(frag)
    }

    // Constellation lines
    const lineMax = 300
    const linePositions = new Float32Array(lineMax * 6)
    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
    lineGeo.setDrawRange(0, 0)
    const lineMat = new THREE.LineBasicMaterial({ color: 0xFF6633, transparent: true, opacity: 0.15 })
    const lines = new THREE.LineSegments(lineGeo, lineMat)
    group.add(lines)

    let mx = 0, my = 0
    const onMove = (e) => { mx = (e.clientX / window.innerWidth - 0.5) * 2; my = (e.clientY / window.innerHeight - 0.5) * 2 }
    document.addEventListener('mousemove', onMove)

    let raf
    function animate() {
      raf = requestAnimationFrame(animate)
      const t = performance.now() * 0.001

      // Group float (whole scene gently bobs)
      group.position.y = Math.sin(t * 0.6) * 0.15

      // Mesh rotations (faster)
      mesh1.rotation.y = t * 0.18; mesh1.rotation.x = t * 0.1
      mesh2.rotation.y = -t * 0.25; mesh2.rotation.z = t * 0.13

      // Icosahedron breathing + opacity pulse
      const breathe = 1 + Math.sin(t * 1.5) * 0.1
      mesh2.scale.setScalar(breathe)
      mesh2.material.opacity = 0.2 + Math.sin(t * 2) * 0.1

      // Core glow pulse
      coreGlow.scale.setScalar(1 + Math.sin(t * 2.5) * 0.2)
      coreGlow.material.opacity = 0.03 + Math.sin(t * 3) * 0.02

      // Satellite #1 orbit
      sat1.position.set(
        2.8 * Math.cos(t * 0.7),
        1.0 + Math.sin(t * 1.1) * 0.5,
        2.8 * Math.sin(t * 0.7)
      )
      sat1.rotation.x = t * 0.4; sat1.rotation.y = t * 0.3

      // Satellite #2 counter-orbit
      sat2.position.set(
        3.2 * Math.cos(-t * 0.4 + 2),
        -0.8 + Math.sin(t * 0.9) * 0.6,
        3.2 * Math.sin(-t * 0.4 + 2)
      )
      sat2.rotation.x = t * 0.5; sat2.rotation.z = t * 0.35

      // Ring rotation
      rings.forEach(ring => { ring.rotation.y = t * ring.userData.speed })

      // Particle orbits + constellation lines
      const pos = pGeo.attributes.position.array
      let lineIdx = 0
      for (let i = 0; i < pCount; i++) {
        const d = pData[i]
        const theta = d.theta + t * d.speed
        const rOsc = d.r + Math.sin(t * 0.8 + d.phase) * 0.2
        pos[i * 3] = rOsc * Math.sin(d.phi) * Math.cos(theta)
        pos[i * 3 + 1] = rOsc * Math.sin(d.phi) * Math.sin(theta)
        pos[i * 3 + 2] = rOsc * Math.cos(d.phi)
      }
      pGeo.attributes.position.needsUpdate = true

      // Particle opacity pulse
      pMat.opacity = 0.6 + Math.sin(t * 2) * 0.2

      // Constellation lines
      const lPos = lineGeo.attributes.position.array
      for (let i = 0; i < pCount && lineIdx < lineMax; i++) {
        for (let j = i + 1; j < pCount && lineIdx < lineMax; j++) {
          const dx = pos[i * 3] - pos[j * 3]
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1]
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2]
          if (dx * dx + dy * dy + dz * dz < 3.5) {
            lPos[lineIdx * 6] = pos[i * 3]
            lPos[lineIdx * 6 + 1] = pos[i * 3 + 1]
            lPos[lineIdx * 6 + 2] = pos[i * 3 + 2]
            lPos[lineIdx * 6 + 3] = pos[j * 3]
            lPos[lineIdx * 6 + 4] = pos[j * 3 + 1]
            lPos[lineIdx * 6 + 5] = pos[j * 3 + 2]
            lineIdx++
          }
        }
      }
      lineGeo.attributes.position.needsUpdate = true
      lineGeo.setDrawRange(0, lineIdx * 2)

      // Constellation line opacity pulse
      lineMat.opacity = 0.1 + Math.sin(t * 1.5) * 0.06

      // Inner fragments orbit + spin
      frags.forEach(f => {
        const d = f.userData
        const theta = d.theta + t * d.speed
        f.position.set(
          d.r * Math.sin(d.phi) * Math.cos(theta),
          d.r * Math.sin(d.phi) * Math.sin(theta),
          d.r * Math.cos(d.phi)
        )
        f.rotation.x = t * d.rotSpeed
        f.rotation.y = t * d.rotSpeed * 0.7
      })

      // Camera parallax (more responsive)
      camera.position.x += (mx * 0.4 - camera.position.x) * 0.04
      camera.position.y += (-my * 0.3 - camera.position.y) * 0.04
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', resize)
      renderer.dispose()
    }
  }, [])

  /* GSAP animations */
  useGSAP(() => {
    // Scroll-linked canvas fade
    gsap.to('#cta canvas', {
      opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '#cta', start: 'top top', end: 'bottom top', scrub: true },
    })

    // CTA headline reveal
    const ctaLines = document.querySelectorAll('#ctaHeadline .line span')
    ScrollTrigger.create({
      trigger: '#cta', start: 'top 70%',
      onEnter: () => {
        gsap.to(ctaLines, { y: '0%', opacity: 1, duration: 0.9, ease: 'power4.out', stagger: 0.12, delay: 0.1 })
        gsap.from('[data-cta-enter]', { opacity: 0, y: 24, duration: 0.6, ease: 'power3.out', stagger: 0.1, delay: 0.5 })
      },
    })

    // CTA counters
    document.querySelectorAll('[data-cta-count]').forEach(el => {
      const target = parseFloat(el.dataset.ctaCount)
      const decimals = parseInt(el.dataset.ctaDecimals) || 0
      const suffix = el.dataset.ctaSuffix || ''
      const obj = { val: 0 }
      gsap.to(obj, {
        val: target, duration: 2, ease: 'power1.inOut',
        scrollTrigger: { trigger: el, start: 'top 88%' },
        onUpdate: () => { el.textContent = obj.val.toFixed(decimals) + suffix },
      })
    })

    // Marquee
    gsap.to('#marqueeRow', { x: '-50%', duration: 30, repeat: -1, ease: 'none' })

    // Scroll enter
    gsap.utils.toArray('[data-enter]').forEach(el => {
      gsap.from(el, { y: 60, opacity: 0, duration: 0.6, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' } })
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
  }, { scope: ref })

  return (
    <div ref={ref}>

      {/* Announcement Bar */}
      {showAnnounce && (
        <div className="announcement" id="announcement">
          <span className="ui-label">New: 30-day forecasting now available — Try it free →</span>
          <button className="dismiss" onClick={() => setShowAnnounce(false)}>×</button>
        </div>
      )}

      {/* Navbar */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} style={{ top: showAnnounce ? 36 : 0 }}>
        <div className="container">
          <span onClick={() => navigate('/')} className="nav-logo" style={{ cursor: 'pointer' }}>PRECISION ANALYTICS</span>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="nav-actions">
            <button onClick={() => navigate('/login')} className="btn btn-outline" style={{ color: 'var(--white)', borderColor: 'rgba(255,255,255,.3)' }}>Log in</button>
            <button onClick={() => navigate('/signup')} className="btn btn-primary">Get Started</button>
          </div>
          <button className="hamburger" onClick={() => setDrawer(true)} aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer ${drawer ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <span className="nav-logo">PRECISION ANALYTICS</span>
          <button className="mobile-drawer-close" onClick={() => setDrawer(false)}>×</button>
        </div>
        <a href="#features" onClick={() => setDrawer(false)}>Features</a>
        <a href="#how-it-works" onClick={() => setDrawer(false)}>How It Works</a>
        <a href="#pricing" onClick={() => setDrawer(false)}>Pricing</a>
        <button onClick={() => { setDrawer(false); navigate('/signup') }} className="btn btn-primary" style={{ marginTop: 24, width: '100%', textAlign: 'center' }}>Get Started</button>
      </div>

      {/* Dark CTA Hero */}
      <section className="dark-cta" id="cta">
        <canvas ref={canvasRef} id="cta-canvas"></canvas>
        <div className="container">
          <div className="dark-cta-inner">

            <div className="dark-cta-eyebrow" data-cta-enter="">
              <div className="dot"></div>
              <span>Engine Active · 88% Confidence</span>
            </div>

            <h2 className="dark-cta-headline" id="ctaHeadline">
              <span className="line"><span>Precision when</span></span>
              <span className="line"><span>it counts. <em>Most.</em></span></span>
            </h2>

            <p className="dark-cta-sub" data-cta-enter="">
              LSTM models trained on 5 years of market data. RMSE-validated before deployment.
              Your forecasts are grounded in quantified accuracy — not opinion.
            </p>

            <div className="dark-cta-actions" data-cta-enter="">
              <button onClick={() => navigate('/signup')} className="dark-cta-btn-primary">Start Forecasting Free</button>
              <button onClick={() => navigate('/dashboard')} className="dark-cta-btn-ghost">View Dashboard</button>
            </div>

            <div className="dark-cta-metrics" data-cta-enter="">
              <div className="dark-cta-metric">
                <span className="dark-cta-metric-val" data-cta-count="99.2" data-cta-suffix="%">0</span>
                <span className="dark-cta-metric-label">Uptime SLA</span>
              </div>
              <div className="dark-cta-metric">
                <span className="dark-cta-metric-val" data-cta-count="0.018" data-cta-decimals="3">0</span>
                <span className="dark-cta-metric-label">Avg MAE</span>
              </div>
              <div className="dark-cta-metric">
                <span className="dark-cta-metric-val" data-cta-count="30" data-cta-suffix="+">0</span>
                <span className="dark-cta-metric-label">Global Tickers</span>
              </div>
              <div className="dark-cta-metric">
                <span className="dark-cta-metric-val" data-cta-count="88" data-cta-suffix="%">0</span>
                <span className="dark-cta-metric-label">Model Confidence</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Marquee */}
      <section className="marquee">
        <div className="marquee-row" id="marqueeRow">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((t, i) => (
            <div key={i} className="marquee-item">
              <span className="marquee-symbol">{t.symbol}</span>
              <span>{t.price}</span>
              <span className={`marquee-change ${t.up ? '' : 'down'}`}>{t.change}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="section" id="tech-stack">
        <div className="container">
          <h3 style={{ textAlign: 'center', marginBottom: 44, color: 'var(--white)' }} data-enter="">Built on proven infrastructure</h3>
          <div className="tech-grid">
            {[
              { icon: '⚡', name: 'FastAPI' }, { icon: '🧠', name: 'TensorFlow' }, { icon: '⚛', name: 'React' },
              { icon: '🎨', name: 'Tailwind' }, { icon: '📊', name: 'Scikit-learn' }, { icon: '📈', name: 'yfinance' }, { icon: '🔒', name: 'Supabase' },
            ].map(t => (
              <div key={t.name} className="tech-item" data-enter="">
                <div className="tech-icon">{t.icon}</div>
                <span className="tech-name">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento */}
      <section className="section" id="features">
        <div className="container">
          <h3 style={{ marginBottom: 44, color: 'var(--white)' }} data-enter="">Everything you need to forecast with confidence</h3>
          <div className="bento">
            <div className="bento-card span-2" data-enter="">
              <div className="bento-icon"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
              <h4>LSTM Prediction Engine</h4>
              <p>Three-layer LSTM neural network processes 20-day windows of 6 technical indicators — Close, Volume, MA20, MA50, RSI, MACD — to generate multi-step forecasts with walk-forward validation across 5 folds.</p>
            </div>
            <div className="bento-card" data-enter="">
              <div className="bento-icon"><svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>
              <h4>Live Market Data</h4>
              <p>Real-time quotes via Finnhub. 30-second auto-refresh on analytics pages.</p>
            </div>
            <div className="bento-card" data-enter="">
              <div className="bento-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
              <h4>Accuracy Metrics</h4>
              <p>RMSE, MAE, R-squared reported per model. 2% tolerance gate for deployment.</p>
            </div>
            <div className="bento-card" data-enter="">
              <div className="bento-icon"><svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></div>
              <h4>Auto Validation</h4>
              <p>Predictions validated against actual prices. Track direction accuracy and mean percent error per user.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Band */}
      <section className="section section-dark">
        <div className="container">
          <div className="stats-grid">
            {[
              { count: '99.2', suffix: '%', dec: '0', label: 'Uptime SLA' },
              { count: '0.018', suffix: '', dec: '3', label: 'Avg MAE Error' },
              { count: '30', suffix: '+', dec: '0', label: 'Global Tickers' },
              { count: '88', suffix: '%', dec: '0', label: 'Model Confidence' },
            ].map((s, i) => (
              <div key={i} className="stat-card" data-enter="" style={{ borderColor: 'var(--gray-dark)' }}>
                <div className="stat-value" data-count={s.count} data-suffix={s.suffix} data-decimals={s.dec}>0</div>
                <div className="stat-label" style={{ color: 'var(--gray-mid)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="section" id="dashboard-preview">
        <div className="container">
          <h3 style={{ marginBottom: 44, color: 'var(--white)' }} data-enter="">See the dashboard in action</h3>
        </div>
        <div className="dash-scroll" data-enter="">
          <div className="dash-track" id="dashTrack">
            {DASH_CARDS.map((d, i) => (
              <div key={i} className="dash-card">
                <div className="dash-card-header">
                  <span className="dash-card-symbol">{d.ticker}</span>
                  <span className="dash-card-price">{d.price}</span>
                </div>
                <div className="dash-card-chart">
                  <svg viewBox="0 0 300 80"><polyline points={d.pts} fill="none" stroke={d.up ? '#FF6633' : '#888'} strokeWidth="2"/></svg>
                </div>
                <div className="dash-card-footer">
                  <span>Predicted: {d.pred}</span>
                  <span className="dash-card-pred">{d.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-orange" id="how-it-works">
        <div className="container">
          <h3 style={{ textAlign: 'center', color: 'var(--white)', marginBottom: 52 }} data-enter="">How It Works</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {[
              { n: '01', title: 'Fetch Data', desc: '5 years of historical data pulled from Yahoo Finance. 6 technical indicators computed in real-time.' },
              { n: '02', title: 'Normalize', desc: 'MinMaxScaler transforms features to 0–1 range. 20-day sliding windows created for sequence input.' },
              { n: '03', title: 'Predict', desc: '3-layer LSTM with 50 units each. 70-epoch training with Adam optimizer and MSE loss function.' },
              { n: '04', title: 'Display', desc: '7-day forecast with confidence intervals. Interactive charts showing historical + predicted prices.' },
            ].map((s, i) => (
              <div key={i} className="step" data-enter="" style={{ minWidth: 'auto', padding: '40px 24px' }}>
                <div className="step-number" style={{ color: 'var(--white)' }}>{s.n}</div>
                <h4 style={{ color: 'var(--white)', marginBottom: 12 }}>{s.title}</h4>
                <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 14, lineHeight: '20px' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section" id="pricing">
        <div className="container">
          <h3 style={{ textAlign: 'center', marginBottom: 16, color: 'var(--white)' }} data-enter="">Simple, transparent pricing</h3>
          <p style={{ textAlign: 'center', color: 'var(--gray-mid)', marginBottom: 44 }} data-enter="">Start free. Scale as you grow.</p>
          <div className="pricing-grid">
            {[
              { tier: 'Starter', price: '$99', period: 'per month', featured: false, features: ['5 ticker watchlist', '7-day forecasting', 'Basic technical indicators', 'Email support'], btn: 'outline' },
              { tier: 'Professional', price: '$299', period: 'per month', featured: true, features: ['30 ticker watchlist', '30-day forecasting', 'All technical indicators', 'Auto-retrain scheduling', 'Priority support'], btn: 'primary' },
              { tier: 'Enterprise', price: 'Custom', period: 'contact sales', featured: false, features: ['Unlimited tickers', 'Custom model training', 'API access', 'Dedicated support', 'SLA guarantee'], btn: 'dark' },
            ].map((plan, i) => (
              <div key={i} className={`pricing-card ${plan.featured ? 'featured' : ''}`} data-enter="">
                <div className="pricing-tier">{plan.tier}</div>
                <div className="pricing-price">{plan.price}</div>
                <div className="pricing-period">{plan.period}</div>
                <ul className="pricing-features">
                  {plan.features.map(f => <li key={f}>{f}</li>)}
                </ul>
                <button onClick={() => navigate('/signup')} className={`btn ${plan.btn === 'primary' ? 'btn-primary' : plan.btn === 'dark' ? 'btn-dark' : 'btn-outline'}`} style={{ width: '100%', textAlign: 'center', height: plan.featured ? 44 : 31, fontSize: plan.featured ? 12 : undefined }}>
                  {plan.btn === 'dark' ? 'Contact Sales' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <span className="nav-logo" style={{ color: 'var(--white)' }}>PRECISION ANALYTICS</span>
              <p>AI-powered stock forecasting using LSTM neural networks. Predict the market before it moves.</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Dashboard', 'API'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Resources', links: ['Documentation', 'Market Insights', 'Status', 'Changelog'] },
            ].map(col => (
              <div key={col.title} className="footer-col">
                <h4>{col.title}</h4>
                {col.links.map(l => <a key={l} href="#">{l}</a>)}
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <span className="footer-copy">&copy; 2026 Precision Analytics. All rights reserved.</span>
            <div className="footer-socials">
              {['Twitter', 'GitHub', 'LinkedIn'].map(s => <a key={s} href="#">{s}</a>)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

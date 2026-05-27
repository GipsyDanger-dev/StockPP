import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import NeuralPulseCanvas from '../components/landing/NeuralPulseCanvas'
import WaveformCanvas from '../components/landing/WaveformCanvas'
import OrbitalCanvas from '../components/landing/OrbitalCanvas'
import ValidationCanvas from '../components/landing/ValidationCanvas'
import DashboardPreview from '../components/landing/DashboardPreview'
import StockPPLogo from '../components/landing/StockPPLogo'

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

    // Tech rows stagger entrance
    gsap.to('[data-tech]', {
      opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: '#tech-stack', start: 'top 80%', once: true },
    })

    // Tech header entrance
    gsap.from('.tech-header', {
      opacity: 0, y: 20, duration: 0.6, ease: 'power3.out',
      scrollTrigger: { trigger: '#tech-stack', start: 'top 85%', once: true },
    })

    // Features bento entrance
    gsap.from('#featHead', {
      opacity: 0, y: 20, duration: 0.6, ease: 'power3.out',
      scrollTrigger: { trigger: '#features', start: 'top 85%', once: true },
    })
    gsap.from('.bento-card', {
      opacity: 0, y: 30, duration: 0.7, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: '#features', start: 'top 78%', once: true },
    })

    // Validation counter
    ScrollTrigger.create({
      trigger: '#c4', start: 'top 80%', once: true,
      onEnter: () => {
        const el = document.querySelector('[data-counter-val]')
        if (!el) return
        const obj = { v: 0 }
        gsap.to(obj, {
          v: 88, duration: 2, ease: 'power1.inOut', delay: 0.4,
          onUpdate: () => { el.textContent = Math.round(obj.v) + '%' },
        })
      },
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
          <span onClick={() => navigate('/')} className="nav-logo" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
            <StockPPLogo size={28} />
            StockPP
          </span>
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
          <span className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StockPPLogo size={28} />
            StockPP
          </span>
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
      <section className="tech-section" id="tech-stack">
        <div className="container">
          <div className="tech-header">
            <h3 style={{ color: 'var(--white)' }}>Built on proven infrastructure</h3>
            <span className="tech-count-badge">07 Technologies</span>
          </div>
          {[
            { num: '01', icon: <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>, name: 'FastAPI', desc: 'High-performance async Python framework — 31 REST endpoints, Pydantic v2', tag: 'Backend' },
            { num: '02', icon: <><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 12l10 5 10-5"/><path d="M2 17l10 5 10-5"/></>, name: 'TensorFlow / Keras', desc: '3-layer LSTM, 50 units/layer, Adam optimizer, 70-epoch training, MSE loss', tag: 'ML Engine' },
            { num: '03', icon: <><circle cx="12" cy="12" r="1.8"/><ellipse cx="12" cy="12" rx="10" ry="3.8"/><ellipse cx="12" cy="12" rx="10" ry="3.8" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="3.8" transform="rotate(120 12 12)"/></>, name: 'React 18 + Vite', desc: 'SPA with HMR, React Router v7, TanStack Query v5, 16 custom hooks', tag: 'Frontend' },
            { num: '04', icon: <><path d="M6.5 8C7.5 5.5 9.5 4 12 4c4 0 4.5 3 6.5 3.5C20 8 22 6.5 22 6.5"/><path d="M2 14C3 11.5 5 10 7.5 10c4 0 4.5 3 6.5 3.5C16 14 18 12.5 18 12.5"/></>, name: 'Tailwind CSS 3', desc: 'Utility-first with custom design tokens, zero-radius system, 8px base grid', tag: 'Styling' },
            { num: '05', icon: <><circle cx="12" cy="4" r="1.8"/><circle cx="4" cy="19" r="1.8"/><circle cx="20" cy="19" r="1.8"/><line x1="12" y1="5.8" x2="5.2" y2="17.4"/><line x1="12" y1="5.8" x2="18.8" y2="17.4"/><line x1="5.8" y1="19" x2="18.2" y2="19"/></>, name: 'Scikit-learn', desc: 'MinMaxScaler normalization, walk-forward cross-validation across 5 folds', tag: 'ML Tools' },
            { num: '06', icon: <><polyline points="3,17 7,11 11,14 15,7 21,9"/><line x1="3" y1="20" x2="21" y2="20"/></>, name: 'yfinance + Finnhub', desc: '5-year OHLCV historical pulls, real-time quotes, 30-second auto-refresh', tag: 'Data' },
            { num: '07', icon: <><ellipse cx="12" cy="5" rx="8" ry="2.5"/><path d="M4 5v4c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5V5"/><path d="M4 9v5c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5V9"/><path d="M4 14v5c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5v-5"/></>, name: 'Supabase', desc: 'PostgreSQL + Auth + Storage — 6 tables, RBAC, model artifact buckets', tag: 'Database' },
          ].map(t => (
            <div key={t.num} className="tech-row" data-tech="">
              <span className="tech-num">{t.num}</span>
              <div className="tech-icon-wrap">
                <svg viewBox="0 0 24 24">{t.icon}</svg>
              </div>
              <div className="tech-info">
                <span className="tech-name">{t.name}</span>
                <span className="tech-desc">{t.desc}</span>
              </div>
              <span className="tech-tag">{t.tag}</span>
              <span className="tech-arrow">&rarr;</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Bento */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="features-header" id="featHead">
            <h2>Everything you need to<br/>forecast with confidence</h2>
            <span className="features-eyebrow">04 Features</span>
          </div>

          <div className="features-bento">
            {/* Card 1 — LSTM Neural Network 3D */}
            <div className="bento-card bento-main" id="c1">
              <div className="card-canvas"><NeuralPulseCanvas /></div>
              <div className="card-content">
                <span className="card-label">Core Engine</span>
                <div className="card-icon" style={{ marginBottom: 8 }}>
                  <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 12l10 5 10-5M2 17l10 5 10-5"/></svg>
                </div>
                <p className="card-title">LSTM Prediction Engine</p>
                <p className="card-body">Three-layer LSTM processes 20-day windows of 6 technical indicators. Walk-forward validation, 5 folds, 2% tolerance gate.</p>
                <div className="lstm-stats">
                  <div className="lstm-stat"><span className="lstm-stat-val">3x50</span><span className="lstm-stat-lbl">LSTM Units</span></div>
                  <div className="lstm-stat"><span className="lstm-stat-val">20d</span><span className="lstm-stat-lbl">Window</span></div>
                  <div className="lstm-stat"><span className="lstm-stat-val">5-Fold</span><span className="lstm-stat-lbl">Validation</span></div>
                  <div className="lstm-stat"><span className="lstm-stat-val">7-Day</span><span className="lstm-stat-lbl">Forecast</span></div>
                </div>
              </div>
            </div>

            {/* Card 2 — Live Market: Waveform 3D */}
            <div className="bento-card bento-market" id="c2">
              <div className="card-canvas"><WaveformCanvas /></div>
              <div className="card-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="card-icon" style={{ marginBottom: 0 }}>
                    <svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  </div>
                  <span className="live-badge"><span className="live-dot"></span>Live Feed</span>
                </div>
                <p className="card-title" style={{ marginTop: 12 }}>Live Market Data</p>
                <p className="card-body">Real-time quotes via Finnhub. 30-second auto-refresh on all analytics pages.</p>
              </div>
            </div>

            {/* Card 3 — Accuracy: Orbital System */}
            <div className="bento-card bento-accuracy" id="c3">
              <div className="card-canvas"><OrbitalCanvas /></div>
              <div className="card-content">
                <div className="card-icon">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                </div>
                <p className="card-title">Accuracy Metrics</p>
                <p className="card-body">RMSE, MAE, R² per model. 2% tolerance gate before deployment.</p>
                <div className="acc-stats">
                  <div className="acc-stat"><span className="acc-stat-val">0.024</span><span className="acc-stat-lbl">RMSE</span></div>
                  <div className="acc-stat"><span className="acc-stat-val">0.018</span><span className="acc-stat-lbl">MAE</span></div>
                  <div className="acc-stat"><span className="acc-stat-val">0.94</span><span className="acc-stat-lbl">R²</span></div>
                  <div className="acc-stat" style={{ borderLeft: '1px solid #1C1C1C' }}><span className="acc-stat-val">88%</span><span className="acc-stat-lbl">Confidence</span></div>
                </div>
              </div>
            </div>

            {/* Card 4 — Auto Validation: Particle Stream */}
            <div className="bento-card bento-validation" id="c4">
              <div className="card-canvas"><ValidationCanvas /></div>
              <div className="card-content" style={{ flexDirection: 'row', gap: 32, alignItems: 'center' }}>
                <div className="val-left">
                  <div className="card-icon" style={{ marginBottom: 8 }}>
                    <svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                  </div>
                  <p className="card-title">Auto Validation</p>
                  <p className="card-body">Predictions validated daily against actual closes. Direction accuracy and mean percent error tracked per ticker.</p>
                  <div className="val-list">
                    <div className="val-row"><div className="val-chk"><svg viewBox="0 0 12 12"><polyline points="1,6 4,9.5 11,2"/></svg></div><span className="val-ticker">NVDA</span><span className="val-match">↑ Match</span><span className="val-pct">+1.9%</span></div>
                    <div className="val-row"><div className="val-chk"><svg viewBox="0 0 12 12"><polyline points="1,6 4,9.5 11,2"/></svg></div><span className="val-ticker">AAPL</span><span className="val-match">↑ Match</span><span className="val-pct">+1.1%</span></div>
                    <div className="val-row"><div className="val-chk"><svg viewBox="0 0 12 12"><polyline points="1,6 4,9.5 11,2"/></svg></div><span className="val-ticker">BBCA.JK</span><span className="val-match">↑ Match</span><span className="val-pct">+0.8%</span></div>
                  </div>
                </div>
                <div className="val-right">
                  <div className="val-big" data-counter-val="">0%</div>
                  <div className="val-big-lbl">Direction Accuracy</div>
                </div>
              </div>
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
      <DashboardPreview />

      {/* How It Works */}
      <section className="section section-orange" id="how-it-works">
        <div className="container">
          <h3 style={{ textAlign: 'center', color: 'var(--white)', marginBottom: 52 }} data-enter="">How It Works</h3>
          <div className="how-steps-grid">
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
              <span className="nav-logo" style={{ color: 'var(--white)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <StockPPLogo size={28} />
                StockPP
              </span>
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
            <span className="footer-copy">&copy; 2026 StockPP. All rights reserved.</span>
            <div className="footer-socials">
              {['Twitter', 'GitHub', 'LinkedIn'].map(s => <a key={s} href="#">{s}</a>)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

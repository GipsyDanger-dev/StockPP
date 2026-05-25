import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import NeuralCanvas from '../components/landing/NeuralCanvas'

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

    // Features bento cards entrance
    gsap.to('[data-bento]', {
      opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: '#features', start: 'top 75%', once: true },
    })

    // Validation checkmarks
    ScrollTrigger.create({
      trigger: '.bento-validation',
      start: 'top 80%',
      once: true,
      onEnter: () => {
        document.querySelectorAll('[data-validate]').forEach((row, i) => {
          const check = row.querySelector('.validation-check')
          setTimeout(() => {
            check.classList.add('active')
          }, 200 + i * 150)
        })
      },
    })

    // Validation counter
    gsap.utils.toArray('[data-counter]').forEach(el => {
      const target = parseInt(el.textContent)
      const obj = { val: 0 }
      gsap.to(obj, {
        val: target, duration: 2.5, ease: 'power1.inOut',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        onUpdate: () => { el.textContent = Math.round(obj.val) },
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
          <div className="features-header">
            <h2>Everything you need to forecast with confidence</h2>
            <p>From neural network predictions to real-time market data and automated validation.</p>
          </div>
          <div className="features-bento">
            {/* Card 1: LSTM Prediction Engine */}
            <div className="bento-card bento-lstm" data-bento="">
              <NeuralCanvas />
              <div className="bento-lstm-header">
                <h3 className="bento-lstm-title">LSTM Prediction Engine</h3>
                <p className="bento-lstm-sub">3-Layer Neural Network</p>
              </div>
              <div className="lstm-stats">
                {[
                  { val: '3 x 50', lbl: 'LSTM Units' },
                  { val: '20d', lbl: 'Window' },
                  { val: '5-Fold', lbl: 'Validation' },
                  { val: '7-Day', lbl: 'Forecast' },
                ].map((s, i) => (
                  <div key={i} className="lstm-stat">
                    <div className="lstm-stat-val">{s.val}</div>
                    <div className="lstm-stat-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Live Market Data */}
            <div className="bento-card bento-market" data-bento="">
              <h3 className="bento-market-title">Live Market Data</h3>
              <p className="bento-market-sub">Real-time quotes via Finnhub with 30-second auto-refresh.</p>
              <div className="live-badge"><span className="live-dot"></span> LIVE</div>
              <div className="chart-wrap">
                <svg viewBox="0 0 300 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF6633" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#FF6633" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,80 Q30,70 60,65 T120,50 T180,40 T240,30 T300,25 L300,100 L0,100 Z"
                    fill="url(#chartGrad)"
                    opacity="0.4"
                  >
                    <animate attributeName="opacity" values="0;0.4" dur="1.5s" fill="freeze" />
                  </path>
                  <path
                    d="M0,80 Q30,70 60,65 T120,50 T180,40 T240,30 T300,25"
                    fill="none"
                    stroke="#FF6633"
                    strokeWidth="2"
                    strokeDasharray="500"
                    strokeDashoffset="500"
                  >
                    <animate attributeName="stroke-dashoffset" values="500;0" dur="2s" fill="freeze" />
                  </path>
                  <path
                    d="M240,30 Q260,22 280,18 T300,15"
                    fill="none"
                    stroke="#FF6633"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    opacity="0.6"
                    strokeDashoffset="100"
                  >
                    <animate attributeName="stroke-dashoffset" values="100;0" dur="1s" begin="2s" fill="freeze" />
                  </path>
                  <circle cx="300" cy="15" r="4" fill="#FF6633" opacity="0">
                    <animate attributeName="opacity" values="0;1" dur="0.3s" begin="2.5s" fill="freeze" />
                    <animate attributeName="r" values="4;6;4" dur="2s" begin="2.8s" repeatCount="indefinite" />
                  </circle>
                </svg>
              </div>
            </div>

            {/* Card 3: Accuracy Metrics */}
            <div className="bento-card bento-accuracy" data-bento="">
              <div className="accuracy-header">
                <div>
                  <h3 className="accuracy-title">Accuracy Metrics</h3>
                  <p className="accuracy-sub">Walk-forward validated</p>
                </div>
                <div className="accuracy-badge">88%</div>
              </div>
              <div className="gauge-wrap">
                <svg viewBox="0 0 160 90" fill="none">
                  <path d="M15,80 A65,65 0 0,1 145,80" stroke="#1e1e1e" strokeWidth="8" strokeLinecap="round" />
                  <path
                    d="M15,80 A65,65 0 0,1 145,80"
                    stroke="#FF6633"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="220"
                    strokeDashoffset="220"
                  >
                    <animate attributeName="stroke-dashoffset" values="220;27" dur="2s" fill="freeze" />
                  </path>
                  <circle cx="80" cy="80" r="3" fill="#FF6633" />
                </svg>
              </div>
              <div className="accuracy-stats">
                {[
                  { val: '0.018', lbl: 'RMSE' },
                  { val: '0.014', lbl: 'MAE' },
                  { val: '0.94', lbl: 'R²' },
                  { val: '2%', lbl: 'Threshold' },
                ].map((s, i) => (
                  <div key={i} className="accuracy-stat">
                    <div className="accuracy-stat-val">{s.val}</div>
                    <div className="accuracy-stat-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 4: Auto Validation */}
            <div className="bento-card bento-validation" data-bento="">
              <div className="validation-left">
                <h3 className="validation-title">Auto Validation</h3>
                <p className="validation-sub">Predictions validated against actual prices with direction accuracy tracking.</p>
                <div className="validation-list">
                  {[
                    { sym: 'NVDA', pred: 'Forecast: +4.2% — Validated' },
                    { sym: 'AAPL', pred: 'Forecast: +1.8% — Validated' },
                    { sym: 'MSFT', pred: 'Forecast: -0.6% — Validated' },
                  ].map((v, i) => (
                    <div key={i} className="validation-ticker" data-validate="">
                      <div className="validation-check">
                        <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span className="validation-ticker-sym">{v.sym}</span>
                      <span className="validation-ticker-prediction">{v.pred}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="validation-right">
                <div className="validation-counter" data-counter="">88</div>
                <div className="validation-counter-label">Confidence Level</div>
                <div className="validation-counter-sub">model accuracy score</div>
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

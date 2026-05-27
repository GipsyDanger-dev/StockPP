import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap/dist/gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const CARDS = [
  { ticker: 'NVDA', price: '$875.40', pred: '$892.10', change: '+1.9%', conf: 91, trend: 'up', live: true },
  { ticker: 'AAPL', price: '$198.11', pred: '$201.50', change: '+1.7%', conf: 88, trend: 'up', live: true },
  { ticker: 'MSFT', price: '$420.55', pred: '$418.20', change: '−0.6%', conf: 79, trend: 'down', live: false },
  { ticker: 'GOOGL', price: '$174.23', pred: '$178.90', change: '+2.7%', conf: 93, trend: 'up', live: true },
  { ticker: 'AMZN', price: '$185.60', pred: '$190.30', change: '+2.5%', conf: 86, trend: 'up', live: true },
  { ticker: 'BBCA.JK', price: 'IDR 9,350', pred: 'IDR 9,500', change: '+1.6%', conf: 82, trend: 'up', live: false },
]

// Memoized volume bar data — stable across re-renders
const VOL_BARS = CARDS.map(() =>
  Array.from({ length: 24 }, () => ({
    h: 8 + Math.random() * 24,
    hl: Math.random() < 0.15,
  }))
)

function generateChartData(trend, points = 60, forecastFrom = 45) {
  const data = []
  let y = 0.35 + Math.random() * 0.2
  for (let i = 0; i < forecastFrom; i++) {
    const noise = (Math.random() - 0.49) * 0.04
    const drift = trend === 'up' ? 0.003 : trend === 'down' ? -0.002 : 0
    const mean_revert = (0.45 - y) * 0.02
    y = Math.max(0.05, Math.min(0.9, y + noise + drift + mean_revert))
    data.push(y)
  }
  let fy = y
  for (let i = forecastFrom; i < points; i++) {
    const fNoise = (Math.random() - 0.5) * 0.015
    const fDrift = trend === 'up' ? 0.006 : trend === 'down' ? -0.005 : 0.001
    fy = Math.max(0.05, Math.min(0.95, fy + fNoise + fDrift))
    data.push(fy)
  }
  return { data, forecastFrom }
}

function drawChart(canvas, trend, onComplete) {
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  const { data, forecastFrom } = generateChartData(trend)
  const N = data.length
  const PAD = { t: 12, r: 4, b: 16, l: 4 }
  const CW = W - PAD.l - PAD.r
  const CH = H - PAD.t - PAD.b

  const px = (i) => PAD.l + (i / (N - 1)) * CW
  const py = (v) => PAD.t + (1 - v) * CH

  function drawGrid() {
    ctx.strokeStyle = '#141414'
    ctx.lineWidth = 1
    for (let r = 0; r <= 4; r++) {
      const y = PAD.t + (r / 4) * CH
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(W - PAD.r, y); ctx.stroke()
    }
    for (let c = 0; c <= 6; c++) {
      const x = PAD.l + (c / 6) * CW
      ctx.beginPath(); ctx.moveTo(x, PAD.t); ctx.lineTo(x, H - PAD.b); ctx.stroke()
    }
  }

  function drawHistorical(upTo) {
    if (upTo < 1) return
    ctx.strokeStyle = '#3A3A3A'
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (let i = 0; i < Math.min(upTo, forecastFrom); i++) {
      i === 0 ? ctx.moveTo(px(i), py(data[i])) : ctx.lineTo(px(i), py(data[i]))
    }
    ctx.stroke()
  }

  function drawForecast(upTo, pulseFraction) {
    if (upTo <= forecastFrom) return
    const endIdx = Math.min(upTo, N - 1)

    ctx.save()
    ctx.shadowColor = '#FF6633'
    ctx.shadowBlur = 12
    ctx.strokeStyle = '#FF6633'
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (let i = forecastFrom - 1; i <= endIdx; i++) {
      i === forecastFrom - 1 ? ctx.moveTo(px(i), py(data[i])) : ctx.lineTo(px(i), py(data[i]))
    }
    ctx.stroke()
    ctx.restore()

    ctx.save()
    const grad = ctx.createLinearGradient(0, PAD.t, 0, H - PAD.b)
    grad.addColorStop(0, 'rgba(255,102,51,0.15)')
    grad.addColorStop(1, 'rgba(255,102,51,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(px(forecastFrom - 1), py(data[forecastFrom - 1]))
    for (let i = forecastFrom; i <= endIdx; i++) ctx.lineTo(px(i), py(data[i]))
    ctx.lineTo(px(endIdx), H - PAD.b)
    ctx.lineTo(px(forecastFrom - 1), H - PAD.b)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    const dotX = px(endIdx), dotY = py(data[endIdx])
    const pulseR = 4 + Math.sin(pulseFraction * Math.PI * 2) * 2
    ctx.save()
    ctx.shadowColor = '#FF6633'; ctx.shadowBlur = 16
    ctx.fillStyle = '#FF6633'
    ctx.beginPath(); ctx.arc(dotX, dotY, 4, 0, Math.PI * 2); ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.strokeStyle = `rgba(255,102,51,${0.3 - pulseFraction * 0.3})`
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(dotX, dotY, pulseR + 3, 0, Math.PI * 2); ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.strokeStyle = '#252525'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(px(forecastFrom - 1), PAD.t)
    ctx.lineTo(px(forecastFrom - 1), H - PAD.b)
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.font = '8px Helvetica, Arial, sans-serif'
    ctx.fillStyle = '#333'
    ctx.fillText('Forecast →', px(forecastFrom) + 4, PAD.t + 10)
    ctx.restore()
  }

  let drawProgress = 0
  let pulsePhase = 0
  let done = false
  let raf
  const SPEED = 0.018

  function frame() {
    ctx.clearRect(0, 0, W, H)
    drawGrid()
    const visIdx = Math.floor(drawProgress * N)
    drawHistorical(visIdx)
    pulsePhase = (pulsePhase + 0.04) % 1
    drawForecast(visIdx, pulsePhase)
    if (!done) {
      drawProgress = Math.min(1, drawProgress + SPEED)
      if (drawProgress >= 1) { done = true; onComplete?.() }
    }
    raf = requestAnimationFrame(frame)
  }
  frame()

  // Return cancel function to stop the RAF loop
  return () => { cancelAnimationFrame(raf) }
}

export default function DashboardPreview() {
  const sectionRef = useRef(null)
  const bgCanvasRef = useRef(null)
  const overflowRef = useRef(null)
  const trackRef = useRef(null)
  const fillRef = useRef(null)
  const pctRef = useRef(null)

  /* Three.js background */
  useEffect(() => {
    const canvas = bgCanvasRef.current
    const section = sectionRef.current
    if (!canvas || !section) return

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2))
    renderer.setClearColor(0x000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
    camera.position.set(0, 0, 6)

    function resize() {
      const w = section.clientWidth, h = section.clientHeight || 600
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(section)

    const gridGroup = new THREE.Group()
    const gridGeos = [], gridMats = []
    const cols = 16, rows = 8
    for (let i = 0; i <= cols; i++) {
      const x = (i / cols) * 14 - 7
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute([x, -5, -2, x, 5, -2], 3))
      const m = new THREE.LineBasicMaterial({ color: 0x111111 })
      gridGroup.add(new THREE.Line(g, m))
      gridGeos.push(g); gridMats.push(m)
    }
    for (let i = 0; i <= rows; i++) {
      const y = (i / rows) * 8 - 4
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute([-7, y, -2, 7, y, -2], 3))
      const m = new THREE.LineBasicMaterial({ color: 0x111111 })
      gridGroup.add(new THREE.Line(g, m))
      gridGeos.push(g); gridMats.push(m)
    }
    scene.add(gridGroup)

    const pCount = 80
    const pPos = new Float32Array(pCount * 3)
    const pVel = new Float32Array(pCount * 3)
    const pCol = new Float32Array(pCount * 3)
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 16
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 8
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 2 - 1
      pVel[i * 3] = (Math.random() - 0.5) * 0.004
      pVel[i * 3 + 1] = (Math.random() - 0.5) * 0.002
      const isOrange = Math.random() < 0.3
      pCol[i * 3] = isOrange ? 1.0 : 0.12
      pCol[i * 3 + 1] = isOrange ? 0.4 : 0.12
      pCol[i * 3 + 2] = isOrange ? 0.2 : 0.12
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3))
    const pMat = new THREE.PointsMaterial({ size: 0.05, vertexColors: true, transparent: true, opacity: 0.8 })
    scene.add(new THREE.Points(pGeo, pMat))

    let raf
    function tick() {
      raf = requestAnimationFrame(tick)
      const pos = pGeo.attributes.position.array
      for (let i = 0; i < pCount; i++) {
        pos[i * 3] += pVel[i * 3]
        pos[i * 3 + 1] += pVel[i * 3 + 1]
        if (pos[i * 3] > 8) pos[i * 3] = -8
        if (pos[i * 3] < -8) pos[i * 3] = 8
        if (pos[i * 3 + 1] > 4) pos[i * 3 + 1] = -4
        if (pos[i * 3 + 1] < -4) pos[i * 3 + 1] = 4
      }
      pGeo.attributes.position.needsUpdate = true
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      gridGeos.forEach(g => g.dispose())
      gridMats.forEach(m => m.dispose())
      pGeo.dispose(); pMat.dispose()
      renderer.dispose()
    }
  }, [])

  /* GSAP horizontal scroll + chart drawing */
  useEffect(() => {
    const overflow = overflowRef.current
    const track = trackRef.current
    const fill = fillRef.current
    const pctEl = pctRef.current
    const section = sectionRef.current
    if (!overflow || !track || !section) return

    let ctx, io, initialized = false
    const cancels = []

    function init() {
      if (initialized) return
      initialized = true
      const maxScroll = track.scrollWidth - overflow.clientWidth + 80
      if (maxScroll <= 0) return

      ctx = gsap.context(() => {
        gsap.to(track, {
          x: () => -maxScroll,
          ease: 'none',
          scrollTrigger: {
            trigger: overflow,
            start: 'top bottom',
            end: () => '+=' + maxScroll,
            scrub: 1.2,
            onUpdate: (self) => {
              const pct = Math.round(self.progress * 100)
              if (fill) fill.style.width = pct + '%'
              if (pctEl) pctEl.textContent = pct + '%'
            },
          },
        })
      }, section)

      io = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          const cards = section.querySelectorAll('.ticker-card')
          cards.forEach((card, i) => {
            const canvas = card.querySelector('.chart-cv')
            const trend = card.dataset.trend
            setTimeout(() => {
              const cancel = drawChart(canvas, trend, () => card.classList.add('drawn'))
              cancels.push(cancel)
            }, i * 180)
          })
          io.disconnect()
        }
      }, { threshold: 0.1 })
      io.observe(section)
    }

    const t1 = setTimeout(init, 200)
    const t2 = setTimeout(init, 500)

    return () => {
      clearTimeout(t1); clearTimeout(t2)
      cancels.forEach(fn => fn())
      if (ctx) ctx.revert()
      if (io) io.disconnect()
    }
  }, [])

  return (
    <section className="dash-section" id="dash-preview" ref={sectionRef}>
      <canvas ref={bgCanvasRef} className="dash-bg-canvas" />

      <div className="dash-header">
        <div className="dash-header-inner">
          <div>
            <span className="dash-eyebrow">Live Preview</span>
            <h3>See the dashboard in action</h3>
          </div>
          <div className="dash-scroll-hint">
            Scroll to explore
            <div className="scroll-arrow">
              <span /><span /><span />
            </div>
          </div>
        </div>
      </div>

      <div className="dash-overflow" ref={overflowRef}>
        <div className="dash-track" ref={trackRef}>
          {CARDS.map((c, i) => (
            <div key={i} className="ticker-card" data-trend={c.trend}>
              <div className="card-top">
                <div className="card-symbol">{c.ticker}</div>
                <div className="card-right">
                  <span className="card-price">{c.price}</span>
                  <span className={`card-badge ${c.live ? 'badge-live' : 'badge-model'}`}
                    style={{ color: c.live ? '#22c55e' : 'var(--orange)' }}>
                    <span className="badge-dot" />
                    {c.live ? 'Live' : 'Model'}
                  </span>
                </div>
              </div>
              <div className="card-canvas-wrap">
                <canvas className="chart-cv" width={332} height={150} />
              </div>
              <div className="card-volume">
                {VOL_BARS[i].map((bar, j) => (
                  <div key={j} className={`vol-bar${bar.hl ? ' highlight' : ''}`}
                    style={{ height: `${bar.h}px` }} />
                ))}
              </div>
              <div className="card-bottom">
                <div className="card-predicted">Predicted <strong>{c.pred}</strong></div>
                <div className="card-change-wrap">
                  <span className="card-conf">Conf {c.conf}%</span>
                  <span className={`card-change ${c.trend === 'up' ? 'up' : 'down'}`}>{c.change}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dash-progress">
        <span className="drag-label">{String(CARDS.length).padStart(2, '0')} Tickers</span>
        <div className="drag-track">
          <div className="drag-fill" ref={fillRef} />
        </div>
        <span className="drag-label" ref={pctRef}>0%</span>
      </div>
    </section>
  )
}

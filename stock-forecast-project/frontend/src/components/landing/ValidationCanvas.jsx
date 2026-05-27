import { useRef, useEffect } from 'react'
import * as THREE from 'three'

export default function ValidationCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const O = 0xFF6633
    const PCOUNT = 120, GATE_X = 0.2
    let renderer, scene, camera, raf, ro
    let greyGeo, greyMat, orangeGeo, orangeMat, gateGeo, gateMat
    let glowPlaneGeo, glowPlaneMat, glowPlane
    const clock = new THREE.Clock()

    const particles = Array.from({ length: PCOUNT }, () => ({
      x: (Math.random() - 0.5) * 10 - 5,
      y: (Math.random() - 0.5) * 2.5,
      z: (Math.random() - 0.5) * 0.8,
      speed: 0.008 + Math.random() * 0.012,
      validated: false,
    }))

    function init() {
      const w = el.clientWidth, h = el.clientHeight
      if (!w || !h) return false

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      renderer.setClearColor(0x000000, 0)
      renderer.setSize(w, h)
      el.appendChild(renderer.domElement)

      scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100)
      camera.position.set(0, 0, 6)

      const greyPositions = new Float32Array(PCOUNT * 3)
      const orangePositions = new Float32Array(PCOUNT * 3)

      greyGeo = new THREE.BufferGeometry()
      orangeGeo = new THREE.BufferGeometry()
      greyGeo.setAttribute('position', new THREE.BufferAttribute(greyPositions, 3))
      orangeGeo.setAttribute('position', new THREE.BufferAttribute(orangePositions, 3))

      greyMat = new THREE.PointsMaterial({ color: 0x222222, size: 0.05 })
      orangeMat = new THREE.PointsMaterial({ color: O, size: 0.065 })
      scene.add(new THREE.Points(greyGeo, greyMat))
      scene.add(new THREE.Points(orangeGeo, orangeMat))

      gateGeo = new THREE.BufferGeometry()
      gateGeo.setAttribute('position', new THREE.Float32BufferAttribute([GATE_X, -2, 0, GATE_X, 2, 0], 3))
      gateMat = new THREE.LineBasicMaterial({ color: O, transparent: true, opacity: 0.25 })
      scene.add(new THREE.Line(gateGeo, gateMat))

      glowPlaneGeo = new THREE.PlaneGeometry(0.06, 4)
      glowPlaneMat = new THREE.MeshBasicMaterial({ color: O, transparent: true, opacity: 0.06, side: THREE.DoubleSide })
      glowPlane = new THREE.Mesh(glowPlaneGeo, glowPlaneMat)
      glowPlane.position.x = GATE_X
      scene.add(glowPlane)

      ro = new ResizeObserver(() => {
        const rw = el.clientWidth, rh = el.clientHeight
        if (!rw || !rh) return
        renderer.setSize(rw, rh)
        camera.aspect = rw / rh
        camera.updateProjectionMatrix()
      })
      ro.observe(el)

      raf = requestAnimationFrame(tick)
      return true
    }

    function tick() {
      raf = requestAnimationFrame(tick)
      const time = clock.getElapsedTime()

      const greyPositions = greyGeo.attributes.position.array
      const orangePositions = orangeGeo.attributes.position.array
      let greyCount = 0, orangeCount = 0

      particles.forEach(p => {
        p.x += p.speed
        if (p.x > 5.5) {
          p.x = -5.5
          p.y = (Math.random() - 0.5) * 2.5
          p.validated = false
        }
        if (!p.validated && p.x >= GATE_X) {
          p.validated = true
          if (Math.random() < 0.08) {
            p.validated = false
            p.y = (Math.random() - 0.5) * 2.5
            p.x = (Math.random() - 0.5) * 3 - 3
          }
        }
        if (p.validated) {
          orangePositions[orangeCount * 3] = p.x
          orangePositions[orangeCount * 3 + 1] = p.y
          orangePositions[orangeCount * 3 + 2] = p.z
          orangeCount++
        } else {
          greyPositions[greyCount * 3] = p.x
          greyPositions[greyCount * 3 + 1] = p.y
          greyPositions[greyCount * 3 + 2] = p.z
          greyCount++
        }
      })

      greyGeo.setDrawRange(0, greyCount)
      greyGeo.attributes.position.needsUpdate = true
      orangeGeo.setDrawRange(0, orangeCount)
      orangeGeo.attributes.position.needsUpdate = true

      gateMat.opacity = 0.15 + Math.abs(Math.sin(time * 2)) * 0.2
      glowPlaneMat.opacity = 0.04 + Math.abs(Math.sin(time * 2)) * 0.04

      renderer.render(scene, camera)
    }

    if (!init()) {
      const io = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && init()) io.disconnect()
      }, { threshold: 0 })
      io.observe(el)
      const fallback = setTimeout(() => { if (!renderer) init() }, 200)
      return () => { clearTimeout(fallback); io.disconnect() }
    }

    return () => {
      cancelAnimationFrame(raf)
      if (ro) ro.disconnect()
      if (renderer) {
        renderer.dispose()
        if (greyGeo) { greyGeo.dispose(); greyMat.dispose() }
        if (orangeGeo) { orangeGeo.dispose(); orangeMat.dispose() }
        if (gateGeo) { gateGeo.dispose(); gateMat.dispose() }
        if (glowPlaneGeo) { glowPlaneGeo.dispose(); glowPlaneMat.dispose() }
        if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
}

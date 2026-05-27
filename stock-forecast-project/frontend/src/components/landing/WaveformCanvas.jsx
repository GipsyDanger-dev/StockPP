import { useRef, useEffect } from 'react'
import * as THREE from 'three'

export default function WaveformCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const O = 0xFF6633
    const N = 80, F = 15, W_SPAN = 6.0
    let renderer, scene, camera, raf, ro
    let histGeo, histMat, fGeo, fMat, pGeo, pMat
    let dotMesh, dotMat, dotGeo, glowMesh, glowMat, glowGeo
    const gridLines = []
    const clock = new THREE.Clock()

    function baseY(i, t) {
      return (
        Math.sin(i * 0.18 + t * 0.15) * 0.4 +
        Math.sin(i * 0.07 + t * 0.08) * 0.6 +
        Math.sin(i * 0.35 + t * 0.22) * 0.15 +
        (i / N) * 0.8 - 0.4
      )
    }

    function init() {
      const w = el.clientWidth, h = el.clientHeight
      if (!w || !h) return false

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      renderer.setClearColor(0x000000, 0)
      renderer.setSize(w, h)
      el.appendChild(renderer.domElement)

      scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
      camera.position.set(0, 1.2, 6)
      camera.lookAt(0, -0.3, 0)

      const histPositions = new Float32Array(N * 3)
      histGeo = new THREE.BufferGeometry()
      histGeo.setAttribute('position', new THREE.BufferAttribute(histPositions, 3))
      histMat = new THREE.LineBasicMaterial({ color: 0x333333 })
      scene.add(new THREE.Line(histGeo, histMat))

      const fPositions = new Float32Array(F * 3)
      fGeo = new THREE.BufferGeometry()
      fGeo.setAttribute('position', new THREE.BufferAttribute(fPositions, 3))
      fMat = new THREE.LineBasicMaterial({ color: O })
      scene.add(new THREE.Line(fGeo, fMat))

      dotGeo = new THREE.SphereGeometry(0.07, 10, 10)
      dotMat = new THREE.MeshBasicMaterial({ color: O })
      dotMesh = new THREE.Mesh(dotGeo, dotMat)
      scene.add(dotMesh)

      glowGeo = new THREE.SphereGeometry(0.16, 10, 10)
      glowMat = new THREE.MeshBasicMaterial({ color: O, transparent: true, opacity: 0.12 })
      glowMesh = new THREE.Mesh(glowGeo, glowMat)
      scene.add(glowMesh)

      for (let i = 0; i < 5; i++) {
        const x = (i / 4) * W_SPAN - W_SPAN / 2
        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.Float32BufferAttribute([x, -1.5, 0, x, 1.5, 0], 3))
        const mat = new THREE.LineBasicMaterial({ color: 0x111111 })
        scene.add(new THREE.Line(geo, mat))
        gridLines.push({ geo, mat })
      }

      const pCount = 40
      const pPos = new Float32Array(pCount * 3)
      const pBaseY = new Float32Array(pCount)
      for (let i = 0; i < pCount; i++) {
        pPos[i * 3] = (Math.random() - 0.5) * W_SPAN
        pBaseY[i] = (Math.random() - 0.5) * 2
        pPos[i * 3 + 1] = pBaseY[i]
        pPos[i * 3 + 2] = (Math.random() - 0.5) * 0.5
      }
      pGeo = new THREE.BufferGeometry()
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
      pMat = new THREE.PointsMaterial({ color: 0x1E1E1E, size: 0.04 })
      scene.add(new THREE.Points(pGeo, pMat))

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

      const hp = histGeo.attributes.position.array
      for (let i = 0; i < N; i++) {
        hp[i * 3] = (i / (N - 1)) * W_SPAN - W_SPAN / 2
        hp[i * 3 + 1] = baseY(i, time)
        hp[i * 3 + 2] = 0
      }
      histGeo.attributes.position.needsUpdate = true

      const fp = fGeo.attributes.position.array
      for (let i = 0; i < F; i++) {
        const gi = N - F + i
        fp[i * 3] = hp[gi * 3]
        fp[i * 3 + 1] = hp[gi * 3 + 1] + (i / F) * 0.45
        fp[i * 3 + 2] = 0
      }
      fGeo.attributes.position.needsUpdate = true

      const pp = pGeo.attributes.position.array
      for (let i = 0; i < 40; i++) {
        const nx = (pp[i * 3] + W_SPAN / 2) / W_SPAN
        const wi = nx * (N - 1)
        const waveY = baseY(wi, time)
        pp[i * 3 + 1] += (waveY - pp[i * 3 + 1]) * 0.06
      }
      pGeo.attributes.position.needsUpdate = true

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
        if (histGeo) { histGeo.dispose(); histMat.dispose() }
        if (fGeo) { fGeo.dispose(); fMat.dispose() }
        if (pGeo) { pGeo.dispose(); pMat.dispose() }
        if (dotMesh) { dotGeo.dispose(); dotMat.dispose() }
        if (glowMesh) { glowGeo.dispose(); glowMat.dispose() }
        gridLines.forEach(gl => { gl.geo.dispose(); gl.mat.dispose() })
        if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
}

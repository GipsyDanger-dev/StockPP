import { useRef, useEffect } from 'react'
import * as THREE from 'three'

export default function WaveformCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const O = 0xFF6633
    const N = 80, F = 15, W_SPAN = 6.0

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(0, 1.2, 6)
    camera.lookAt(0, -0.3, 0)

    function baseY(i, t) {
      return (
        Math.sin(i * 0.18 + t * 0.15) * 0.4 +
        Math.sin(i * 0.07 + t * 0.08) * 0.6 +
        Math.sin(i * 0.35 + t * 0.22) * 0.15 +
        (i / N) * 0.8 - 0.4
      )
    }

    const histPositions = new Float32Array(N * 3)
    const histGeo = new THREE.BufferGeometry()
    histGeo.setAttribute('position', new THREE.BufferAttribute(histPositions, 3))
    const histMat = new THREE.LineBasicMaterial({ color: 0x333333 })
    scene.add(new THREE.Line(histGeo, histMat))

    const fPositions = new Float32Array(F * 3)
    const fGeo = new THREE.BufferGeometry()
    fGeo.setAttribute('position', new THREE.BufferAttribute(fPositions, 3))
    const fMat = new THREE.LineBasicMaterial({ color: O })
    scene.add(new THREE.Line(fGeo, fMat))

    const dotGeo = new THREE.SphereGeometry(0.07, 10, 10)
    const dotMat = new THREE.MeshBasicMaterial({ color: O })
    const dot = new THREE.Mesh(dotGeo, dotMat)
    scene.add(dot)

    const glowGeo = new THREE.SphereGeometry(0.16, 10, 10)
    const glowMat = new THREE.MeshBasicMaterial({ color: O, transparent: true, opacity: 0.12 })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    scene.add(glow)

    for (let i = 0; i < 5; i++) {
      const x = (i / 4) * W_SPAN - W_SPAN / 2
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute([x, -1.5, 0, x, 1.5, 0], 3))
      scene.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x111111 })))
    }

    const pCount = 40
    const pPos = new Float32Array(pCount * 3)
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * W_SPAN
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 2
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 0.5
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x1E1E1E, size: 0.04 })))

    function resize() {
      const w = el.clientWidth, h = el.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    let raf
    const clock = new THREE.Clock()

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

      const tip = { x: fp[(F - 1) * 3], y: fp[(F - 1) * 3 + 1] }
      dot.position.set(tip.x, tip.y, 0)
      glow.position.copy(dot.position)
      glow.material.opacity = 0.08 + Math.abs(Math.sin(time * 2.5)) * 0.08
      dot.scale.setScalar(0.9 + Math.abs(Math.sin(time * 2.5)) * 0.2)

      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.dispose()
      histGeo.dispose(); histMat.dispose()
      fGeo.dispose(); fMat.dispose()
      dotGeo.dispose(); dotMat.dispose()
      glowGeo.dispose(); glowMat.dispose()
      pGeo.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={ref} style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }} />
}

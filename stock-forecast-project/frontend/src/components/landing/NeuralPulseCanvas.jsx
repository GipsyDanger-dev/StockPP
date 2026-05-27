import { useRef, useEffect } from 'react'
import * as THREE from 'three'

export default function NeuralPulseCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const O = 0xFF6633, DIM = 0x1E1E1E, GREY = 0x2A2A2A
    let renderer, scene, camera, raf, ro
    let mx = 0, my = 0
    let pulseLayer = 0, pulseProgress = 0
    let pulseActive = false, pulseWaiting = false
    let path = null
    let nodeMeshes = [], edgeGroups = []
    let pulseSphere, pulseLight
    const clock = new THREE.Clock()

    function init() {
      const w = el.clientWidth, h = el.clientHeight
      if (!w || !h) return false

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      renderer.setClearColor(0x000000, 0)
      renderer.setSize(w, h)
      el.appendChild(renderer.domElement)

      scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 100)
      camera.position.set(0.4, 0.1, 7)

      scene.add(new THREE.AmbientLight(0x111111))
      const pLight = new THREE.PointLight(O, 0, 12)
      pLight.position.set(2, 0, 3)
      scene.add(pLight)

      const LAYERS = [
        { n: 6, x: -2.4 },
        { n: 4, x: -1.1 },
        { n: 4, x: 0.2 },
        { n: 4, x: 1.5 },
        { n: 1, x: 2.5 },
      ]
      const SPREAD = 0.58

      LAYERS.forEach((layer) => {
        const row = []
        const half = (layer.n - 1) * SPREAD * 0.5
        for (let i = 0; i < layer.n; i++) {
          const y = layer.n > 1 ? i * SPREAD - half : 0
          const geo = new THREE.SphereGeometry(0.09, 10, 10)
          const mat = new THREE.MeshBasicMaterial({ color: DIM })
          const mesh = new THREE.Mesh(geo, mat)
          mesh.position.set(layer.x, y, 0)
          scene.add(mesh)
          row.push({ mesh, mat, x: layer.x, y })
        }
        nodeMeshes.push(row)
      })

      for (let l = 0; l < LAYERS.length - 1; l++) {
        const from = nodeMeshes[l], to = nodeMeshes[l + 1]
        const pts = []
        from.forEach(f => to.forEach(t => {
          pts.push(f.x, f.y, 0, t.x, t.y, 0)
        }))
        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
        const mat = new THREE.LineBasicMaterial({ color: 0x1A1A1A, transparent: true, opacity: 0.5 })
        const lines = new THREE.LineSegments(geo, mat)
        scene.add(lines)
        edgeGroups.push({ lines, mat })
      }

      const pulseGeo = new THREE.SphereGeometry(0.06, 8, 8)
      const pulseMat = new THREE.MeshBasicMaterial({ color: O })
      pulseSphere = new THREE.Mesh(pulseGeo, pulseMat)
      pulseSphere.visible = false
      scene.add(pulseSphere)

      pulseLight = new THREE.PointLight(O, 0, 2.5)
      scene.add(pulseLight)

      // Mouse parallax on parent card
      const card = el.closest('.bento-main')
      if (card) {
        card.addEventListener('mousemove', e => {
          const r = card.getBoundingClientRect()
          mx = (e.clientX - r.left) / r.width - 0.5
          my = (e.clientY - r.top) / r.height - 0.5
        })
      }

      ro = new ResizeObserver(() => {
        const rw = el.clientWidth, rh = el.clientHeight
        if (!rw || !rh) return
        renderer.setSize(rw, rh)
        camera.aspect = rw / rh
        camera.updateProjectionMatrix()
      })
      ro.observe(el)

      setTimeout(startPulse, 400)
      raf = requestAnimationFrame(tick)
      return true
    }

    function resetColors() {
      nodeMeshes.flat().forEach(n => n.mat.color.setHex(DIM))
      edgeGroups.forEach(eg => { eg.mat.color.setHex(0x1A1A1A); eg.mat.opacity = 0.5 })
      pulseSphere.visible = false
      pulseLight.intensity = 0
    }

    function pickNextPath() {
      if (pulseLayer >= nodeMeshes.length - 1) return null
      const fromNodes = nodeMeshes[pulseLayer]
      const toNodes = nodeMeshes[pulseLayer + 1]
      const fi = pulseLayer === 0 ? Math.floor(fromNodes.length / 2) : Math.floor(Math.random() * fromNodes.length)
      const ti = pulseLayer + 1 === nodeMeshes.length - 1 ? 0 : Math.floor(Math.random() * toNodes.length)
      return { from: fromNodes[fi].mesh.position, to: toNodes[ti].mesh.position }
    }

    function startPulse() {
      if (pulseActive || pulseWaiting) return
      resetColors()
      pulseLayer = 0; pulseProgress = 0
      pulseSphere.position.copy(nodeMeshes[0][Math.floor(nodeMeshes[0].length / 2)].mesh.position)
      pulseSphere.visible = true
      pulseLight.intensity = 1.5
      pulseActive = true
      path = null
    }

    function tick() {
      raf = requestAnimationFrame(tick)
      const time = clock.getElapsedTime()

      camera.position.x += (mx * 0.4 - camera.position.x) * 0.05
      camera.position.y += (-my * 0.25 - camera.position.y) * 0.05
      camera.lookAt(0, 0, 0)

      nodeMeshes.flat().forEach((n, i) => {
        if (n.mat.color.getHex() === DIM) {
          const v = 0x1E + Math.round(Math.abs(Math.sin(time * 0.6 + i * 0.4)) * 0x08)
          n.mat.color.setHex(v * 0x010101)
        }
      })

      if (pulseActive) {
        if (!path) path = pickNextPath()
        if (!path) {
          pulseActive = false; pulseWaiting = true
          setTimeout(() => { pulseWaiting = false; startPulse() }, 1800)
          return
        }
        pulseProgress += 0.025
        pulseSphere.position.lerpVectors(path.from, path.to, Math.min(pulseProgress, 1))
        pulseLight.position.copy(pulseSphere.position)

        if (pulseLayer < edgeGroups.length) {
          edgeGroups[pulseLayer].mat.color.setHex(O)
          edgeGroups[pulseLayer].mat.opacity = 0.6 + Math.sin(time * 6) * 0.15
        }
        nodeMeshes[pulseLayer].forEach(n => n.mat.color.setHex(O))

        if (pulseProgress >= 1) {
          nodeMeshes[pulseLayer + 1].forEach(n => n.mat.color.setHex(O))
          if (pulseLayer > 0 && pulseLayer - 1 < edgeGroups.length) {
            edgeGroups[pulseLayer - 1].mat.color.setHex(0x252525)
            edgeGroups[pulseLayer - 1].mat.opacity = 0.35
          }
          nodeMeshes[pulseLayer].forEach(n => n.mat.color.setHex(GREY))
          pulseLayer++
          pulseProgress = 0
          path = pickNextPath()

          if (pulseLayer >= nodeMeshes.length - 1) {
            nodeMeshes[nodeMeshes.length - 1][0].mat.color.setHex(O)
            pulseActive = false
            pulseSphere.visible = false
            pulseLight.intensity = 0
            pulseWaiting = true
            setTimeout(() => { resetColors(); pulseWaiting = false; startPulse() }, 2000)
          }
        }
      }

      renderer.render(scene, camera)
    }

    // Defer init until container has dimensions (GSAP starts cards at opacity:0)
    if (!init()) {
      const io = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && init()) io.disconnect()
      }, { threshold: 0 })
      io.observe(el)
      // Fallback: try again after a short delay
      const fallback = setTimeout(() => { if (!renderer) init() }, 200)
      return () => { clearTimeout(fallback); io.disconnect() }
    }

    return () => {
      cancelAnimationFrame(raf)
      if (ro) ro.disconnect()
      if (renderer) {
        renderer.dispose()
        nodeMeshes.flat().forEach(n => { n.mesh.geometry.dispose(); n.mat.dispose() })
        edgeGroups.forEach(eg => { eg.lines.geometry.dispose(); eg.mat.dispose() })
        if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
}

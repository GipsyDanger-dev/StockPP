import { useRef, useEffect } from 'react'
import * as THREE from 'three'

export default function OrbitalCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const O = 0xFF6633

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100)
    camera.position.set(0, 0, 5)

    const coreGeo = new THREE.SphereGeometry(0.35, 20, 20)
    const coreMat = new THREE.MeshBasicMaterial({ color: O, transparent: true, opacity: 0.85 })
    const core = new THREE.Mesh(coreGeo, coreMat)
    scene.add(core)

    const glowGeo = new THREE.SphereGeometry(0.55, 16, 16)
    const glowMat = new THREE.MeshBasicMaterial({ color: O, transparent: true, opacity: 0.06, side: THREE.BackSide })
    scene.add(new THREE.Mesh(glowGeo, glowMat))

    const rings = [
      { r: 1.2, tube: 0.012, rot: [0, 0, 0], speed: 0.28, color: 0xFFFFFF, opacity: 0.55 },
      { r: 1.5, tube: 0.010, rot: [Math.PI / 3, 0, 0], speed: -0.18, color: O, opacity: 0.70 },
      { r: 1.0, tube: 0.009, rot: [0, Math.PI / 4, Math.PI / 6], speed: 0.22, color: 0xFFFFFF, opacity: 0.30 },
      { r: 1.8, tube: 0.008, rot: [Math.PI / 5, Math.PI / 3, 0], speed: -0.12, color: 0xFFFFFF, opacity: 0.15 },
    ]

    const ringMeshes = rings.map(cfg => {
      const geo = new THREE.TorusGeometry(cfg.r, cfg.tube, 8, 80)
      const mat = new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: cfg.opacity })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.rotation.set(...cfg.rot)
      scene.add(mesh)
      return { mesh, speed: cfg.speed, baseRot: [...cfg.rot] }
    })

    const orbiters = []
    for (let i = 0; i < 3; i++) {
      const geo = new THREE.SphereGeometry(0.055, 8, 8)
      const mat = new THREE.MeshBasicMaterial({ color: i === 0 ? O : 0xFFFFFF, transparent: true, opacity: 0.8 })
      const mesh = new THREE.Mesh(geo, mat)
      scene.add(mesh)
      orbiters.push({ mesh, angle: (i / 3) * Math.PI * 2, speed: 0.6 + i * 0.15, radius: 1.5 })
    }

    const pCount = 50
    const pPos = new Float32Array(pCount * 3)
    for (let i = 0; i < pCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      const r = 2.2 + Math.random() * 0.8
      pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pPos[i * 3 + 2] = r * Math.cos(phi)
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color: O, size: 0.03, transparent: true, opacity: 0.5 })))

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

    let mx = 0, my = 0
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect()
      mx = (e.clientX - rect.left) / rect.width - 0.5
      my = (e.clientY - rect.top) / rect.height - 0.5
    })

    let raf
    const clock = new THREE.Clock()

    function tick() {
      raf = requestAnimationFrame(tick)
      const time = clock.getElapsedTime()

      ringMeshes.forEach(rm => {
        rm.mesh.rotation.z = rm.baseRot[2] + time * rm.speed
        rm.mesh.rotation.x = rm.baseRot[0] + time * rm.speed * 0.3
      })

      orbiters.forEach(ob => {
        ob.angle += ob.speed * 0.012
        ob.mesh.position.set(
          Math.cos(ob.angle) * ob.radius,
          Math.sin(ob.angle) * ob.radius * Math.cos(Math.PI / 3),
          Math.sin(ob.angle) * ob.radius * Math.sin(Math.PI / 3)
        )
      })

      const s = 0.92 + Math.sin(time * 1.8) * 0.08
      core.scale.setScalar(s)
      coreMat.opacity = 0.75 + Math.sin(time * 1.8) * 0.1

      camera.position.x += (mx * 0.5 - camera.position.x) * 0.04
      camera.position.y += (-my * 0.3 - camera.position.y) * 0.04
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.dispose()
      coreGeo.dispose(); coreMat.dispose()
      glowGeo.dispose(); glowMat.dispose()
      ringMeshes.forEach(rm => { rm.mesh.geometry.dispose(); rm.mesh.material.dispose() })
      orbiters.forEach(ob => { ob.mesh.geometry.dispose(); ob.mesh.material.dispose() })
      pGeo.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={ref} style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }} />
}

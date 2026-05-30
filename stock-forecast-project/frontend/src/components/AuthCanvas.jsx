import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function AuthCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.set(0, 0, 6)

    function resize() {
      const w = window.innerWidth
      const h = window.innerHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    window.addEventListener('resize', resize)

    const mesh1 = new THREE.Mesh(
      new THREE.DodecahedronGeometry(2, 0),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.08 })
    )
    scene.add(mesh1)

    const mesh2 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.2, 1),
      new THREE.MeshBasicMaterial({ color: 0xFF6633, wireframe: true, transparent: true, opacity: 0.12 })
    )
    scene.add(mesh2)

    const pCount = 30
    const pData = []
    const pPos = new Float32Array(pCount * 3)
    for (let i = 0; i < pCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      const r = 2.5 + Math.random() * 2
      pData.push({ phi, theta, r, speed: 0.06 + Math.random() * 0.1 })
      pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pPos[i * 3 + 2] = r * Math.cos(phi)
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xFF6633, size: 0.04, transparent: true, opacity: 0.5 })))

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3, 0.008, 8, 64),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.06 })
    )
    ring.rotation.x = Math.PI * 0.35
    scene.add(ring)

    let mx = 0, my = 0
    const onMove = (e) => { mx = (e.clientX / window.innerWidth - 0.5) * 2; my = (e.clientY / window.innerHeight - 0.5) * 2 }
    document.addEventListener('mousemove', onMove)

    let raf
    function animate() {
      raf = requestAnimationFrame(animate)
      const t = performance.now() * 0.001
      mesh1.rotation.y = t * 0.1; mesh1.rotation.x = t * 0.06
      mesh2.rotation.y = -t * 0.15; mesh2.rotation.z = t * 0.08
      mesh2.scale.setScalar(1 + Math.sin(t * 1.5) * 0.06)
      ring.rotation.y = t * 0.06

      const pos = pGeo.attributes.position.array
      for (let i = 0; i < pCount; i++) {
        const d = pData[i]
        const theta = d.theta + t * d.speed
        pos[i * 3] = d.r * Math.sin(d.phi) * Math.cos(theta)
        pos[i * 3 + 1] = d.r * Math.sin(d.phi) * Math.sin(theta)
        pos[i * 3 + 2] = d.r * Math.cos(d.phi)
      }
      pGeo.attributes.position.needsUpdate = true

      camera.position.x += (mx * 0.2 - camera.position.x) * 0.03
      camera.position.y += (-my * 0.15 - camera.position.y) * 0.03
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

  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
}

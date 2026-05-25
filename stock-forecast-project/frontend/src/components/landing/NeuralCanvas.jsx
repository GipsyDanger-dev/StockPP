import { useRef, useEffect } from 'react'
import * as THREE from 'three'

export default function NeuralCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    const w = container.clientWidth
    const h = container.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100)
    camera.position.set(0, 0, 12)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h)
    container.appendChild(renderer.domElement)

    const group = new THREE.Group()
    scene.add(group)

    const layers = [4, 6, 8, 6, 3]
    const spacing = 2.2
    const nodes = []
    const edges = []
    const nodeGeo = new THREE.SphereGeometry(0.1, 16, 16)

    layers.forEach((count, li) => {
      const layerNodes = []
      const x = (li - (layers.length - 1) / 2) * spacing
      for (let ni = 0; ni < count; ni++) {
        const y = (ni - (count - 1) / 2) * 0.7
        const mat = new THREE.MeshBasicMaterial({
          color: li === 0 || li === layers.length - 1 ? 0xff6633 : 0xffffff,
          transparent: true,
          opacity: li === 0 || li === layers.length - 1 ? 0.9 : 0.6,
        })
        const mesh = new THREE.Mesh(nodeGeo, mat)
        mesh.position.set(x, y, 0)
        group.add(mesh)
        layerNodes.push(mesh)
      }
      nodes.push(layerNodes)
    })

    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08,
    })

    for (let li = 0; li < nodes.length - 1; li++) {
      const srcLayer = nodes[li]
      const tgtLayer = nodes[li + 1]
      srcLayer.forEach(src => {
        tgtLayer.forEach(tgt => {
          const geo = new THREE.BufferGeometry().setFromPoints([src.position.clone(), tgt.position.clone()])
          const line = new THREE.Line(geo, lineMat)
          group.add(line)
          edges.push({ line, src: src.position, tgt: tgt.position })
        })
      })
    }

    let raf
    const clock = new THREE.Clock()

    function animate() {
      raf = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      group.rotation.y = Math.sin(t * 0.2) * 0.25
      group.rotation.x = Math.cos(t * 0.15) * 0.1

      nodes.forEach((layer, li) => {
        layer.forEach((node, ni) => {
          const pulse = 0.6 + Math.sin(t * 2 + li * 1.2 + ni * 0.5) * 0.4
          node.material.opacity = (li === 0 || li === nodes.length - 1) ? 0.6 + pulse * 0.4 : 0.3 + pulse * 0.35
          const s = 0.8 + pulse * 0.4
          node.scale.setScalar(s)
        })
      })

      edges.forEach((edge, i) => {
        const wave = Math.sin(t * 3 + i * 0.05) * 0.5 + 0.5
        edge.line.material.opacity = 0.04 + wave * 0.1
      })

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      renderer.dispose()
      nodeGeo.dispose()
      nodes.flat().forEach(n => n.material.dispose())
      edges.forEach(e => { e.line.geometry.dispose(); e.line.material.dispose() })
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}

import { useRef, useMemo, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

function Particles({ count = 400 }) {
  const mesh = useRef()
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14
      pos[i * 3 + 2] = (Math.random() - 0.5) * 14
      const shade = 0.3 + Math.random() * 0.7
      colors[i * 3] = 0.37 * shade
      colors[i * 3 + 1] = 0.51 * shade
      colors[i * 3 + 2] = 0.96 * shade
    }
    return { pos, colors }
  }, [count])

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.012
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.008) * 0.1
    }
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions.pos} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={positions.colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.02} vertexColors transparent opacity={0.6} sizeAttenuation />
    </points>
  )
}

function WireframeIcosahedron() {
  const meshRef = useRef()
  const outerRef = useRef()
  const innerRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.12
      meshRef.current.rotation.y = t * 0.18
    }
    if (outerRef.current) {
      outerRef.current.rotation.x = -t * 0.08
      outerRef.current.rotation.y = -t * 0.1
      outerRef.current.rotation.z = t * 0.04
    }
    if (innerRef.current) {
      innerRef.current.rotation.x = t * 0.2
      innerRef.current.rotation.y = -t * 0.15
    }
  })

  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.4}>
      <mesh ref={innerRef} scale={0.6}>
        <icosahedronGeometry args={[1.6, 2]} />
        <meshStandardMaterial color="#60A5FA" wireframe transparent opacity={0.15} />
      </mesh>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshStandardMaterial color="#2563EB" wireframe transparent opacity={0.9} />
      </mesh>
      <mesh ref={outerRef} scale={1.2}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshStandardMaterial color="#3B82F6" wireframe transparent opacity={0.12} />
      </mesh>
      <mesh scale={1.45}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshStandardMaterial color="#93C5FD" wireframe transparent opacity={0.04} />
      </mesh>
    </Float>
  )
}

function GlowingRing({ radius = 2.4, color = '#60A5FA', speed = 0.1, tilt = 0 }) {
  const ringRef = useRef()

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime * 0.25) * 0.08 + tilt
      ringRef.current.rotation.z = state.clock.elapsedTime * speed
    }
  })

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[radius, 0.012, 16, 120]} />
      <meshStandardMaterial color={color} transparent opacity={0.25} emissive="#2563EB" emissiveIntensity={0.4} />
    </mesh>
  )
}

function StockChartLine() {
  const lineRef = useRef()
  const points = useMemo(() => {
    const pts = []
    const segments = 80
    for (let i = 0; i < segments; i++) {
      const t = (i / segments) * Math.PI * 2.5
      const x = (i / segments - 0.5) * 6
      const y = Math.sin(t) * 0.4 + Math.sin(t * 2.3) * 0.2 + (i / segments) * 0.8 - 0.4
      const z = Math.cos(t * 0.5) * 0.3
      pts.push(new THREE.Vector3(x, y, z))
    }
    return pts
  }, [])

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [points])

  useFrame((state) => {
    if (lineRef.current) {
      lineRef.current.rotation.y = state.clock.elapsedTime * 0.03
      lineRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
    }
  })

  return (
    <group ref={lineRef} position={[0, -0.5, 0]}>
      <line geometry={geometry}>
        <lineBasicMaterial color="#3B82F6" transparent opacity={0.35} linewidth={1} />
      </line>
    </group>
  )
}

function DataNodes() {
  const groupRef = useRef()
  const nodePositions = useMemo(() => {
    const positions = []
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const radius = 2.8 + Math.random() * 0.5
      positions.push([
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 2,
        Math.sin(angle) * radius,
      ])
    }
    return positions
  }, [])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.025
    }
  })

  return (
    <group ref={groupRef}>
      {nodePositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.03 + Math.random() * 0.02, 8, 8]} />
          <meshStandardMaterial
            color="#60A5FA"
            transparent
            opacity={0.5 + Math.random() * 0.3}
            emissive="#2563EB"
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
    </group>
  )
}

function PulseWave() {
  const ringRef = useRef()

  useFrame((state) => {
    if (ringRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.15
      ringRef.current.scale.set(scale, scale, scale)
      ringRef.current.material.opacity = 0.08 + Math.sin(state.clock.elapsedTime * 1.5) * 0.04
    }
  })

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[3.2, 3.25, 64]} />
      <meshBasicMaterial color="#3B82F6" transparent opacity={0.08} side={THREE.DoubleSide} />
    </mesh>
  )
}

function MouseFollower() {
  const meshRef = useRef()
  const target = useRef(new THREE.Vector3(0, 0, 0))
  const { viewport } = useThree()

  useFrame((state) => {
    if (meshRef.current) {
      const mouseX = state.pointer.x * viewport.width * 0.5 * 0.3
      const mouseY = state.pointer.y * viewport.height * 0.5 * 0.3
      target.current.set(mouseX, mouseY, 0)
      meshRef.current.position.lerp(target.current, 0.05)
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.06, 16, 16]} />
      <meshStandardMaterial color="#60A5FA" emissive="#3B82F6" emissiveIntensity={2} transparent opacity={0.6} />
    </mesh>
  )
}

export default function HeroScene() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.5} color="#60A5FA" />
        <pointLight position={[-5, -5, 5]} intensity={0.25} color="#2563EB" />
        <pointLight position={[0, 3, -3]} intensity={0.15} color="#93C5FD" />
        <WireframeIcosahedron />
        <GlowingRing radius={2.4} speed={0.1} />
        <GlowingRing radius={2.8} color="#3B82F6" speed={-0.06} tilt={0.3} />
        <GlowingRing radius={3.2} color="#93C5FD" speed={0.04} tilt={-0.2} />
        <StockChartLine />
        <DataNodes />
        <PulseWave />
        <MouseFollower />
        <Particles count={350} />
      </Canvas>
    </div>
  )
}

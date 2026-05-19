import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

function Particles({ count = 300 }) {
  const mesh = useRef()
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12
    }
    return pos
  }, [count])

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.015
      mesh.current.rotation.x = state.clock.elapsedTime * 0.008
    }
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        color="#60A5FA"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  )
}

function WireframeIcosahedron() {
  const meshRef = useRef()
  const outerRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.12
      meshRef.current.rotation.y = t * 0.18
    }
    if (outerRef.current) {
      outerRef.current.rotation.x = -t * 0.08
      outerRef.current.rotation.y = -t * 0.1
    }
  })

  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.4}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshStandardMaterial
          color="#2563EB"
          wireframe
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh ref={outerRef} scale={1.2}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshStandardMaterial
          color="#3B82F6"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>
      <mesh scale={1.4}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshStandardMaterial
          color="#60A5FA"
          wireframe
          transparent
          opacity={0.04}
        />
      </mesh>
    </Float>
  )
}

function GlowingRing({ radius = 2.4, color = '#60A5FA', speed = 0.1 }) {
  const ringRef = useRef()

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime * 0.25) * 0.08
      ringRef.current.rotation.z = state.clock.elapsedTime * speed
    }
  })

  return (
    <mesh ref={ringRef} position={[0, 0, 0]}>
      <torusGeometry args={[radius, 0.012, 16, 120]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.25}
        emissive="#2563EB"
        emissiveIntensity={0.4}
      />
    </mesh>
  )
}

function DataNodes() {
  const groupRef = useRef()
  const nodePositions = useMemo(() => {
    const positions = []
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const radius = 2.8 + Math.random() * 0.4
      positions.push([
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 1.5,
        Math.sin(angle) * radius,
      ])
    }
    return positions
  }, [])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.03
    }
  })

  return (
    <group ref={groupRef}>
      {nodePositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial
            color="#60A5FA"
            transparent
            opacity={0.6}
            emissive="#2563EB"
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
    </group>
  )
}

export default function HeroScene() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.35} />
        <pointLight position={[5, 5, 5]} intensity={0.5} color="#60A5FA" />
        <pointLight position={[-5, -5, 5]} intensity={0.25} color="#2563EB" />
        <pointLight position={[0, 3, -3]} intensity={0.15} color="#93C5FD" />
        <WireframeIcosahedron />
        <GlowingRing radius={2.4} speed={0.1} />
        <GlowingRing radius={2.8} color="#3B82F6" speed={-0.06} />
        <DataNodes />
        <Particles count={250} />
      </Canvas>
    </div>
  )
}

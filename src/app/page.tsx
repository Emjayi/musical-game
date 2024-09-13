"use client"

import { useState, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

// Audio context and analyzer setup
const useAudioAnalyzer = () => {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null)

  const setupAudioAnalyzer = (audio: HTMLAudioElement) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    if (!sourceNodeRef.current) {
      sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audio)
      const newAnalyser = audioContextRef.current.createAnalyser()
      sourceNodeRef.current.connect(newAnalyser)
      newAnalyser.connect(audioContextRef.current.destination)
      setAnalyser(newAnalyser)
    }
  }

  return { analyser, setupAudioAnalyzer }
}

// Pulsating Sphere component
const PulsatingSphere = ({ position, color }: { position: [number, number, number], color: string }) => {
  const mesh = useRef<THREE.Mesh>(null)
  const [frequency, setFrequency] = useState(0)

  useFrame(({ clock }) => {
    if (mesh.current) {
      const scale = 1 + Math.sin(clock.elapsedTime * 2) * 0.1 + frequency * 0.5
      mesh.current.scale.set(scale, scale, scale)
    }
  })

  return (
    <mesh ref={mesh} position={position}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

// Particles component
const Particles = ({ count = 1000 }) => {
  const points = useRef<THREE.Points>(null)
  const [positions, setPositions] = useState<Float32Array | null>(null)

  useEffect(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 10
    }
    setPositions(pos)
  }, [count])

  useFrame(({ clock }) => {
    if (points.current) {
      points.current.rotation.x = Math.sin(clock.elapsedTime * 0.3) * 0.2
      points.current.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.2
    }
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        {positions && (
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        )}
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#ffffff" />
    </points>
  )
}

// Main Scene component
const Scene = ({ analyser }: { analyser: AnalyserNode | null }) => {
  const { camera } = useThree()

  useFrame(() => {
    if (analyser) {
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      const normalizedAverage = average / 255
      camera.position.z = 5 + normalizedAverage * 2
    }
  })

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <PulsatingSphere position={[0, 0, 0]} color="#ff6b6b" />
      <Particles />
    </>
  )
}

export default function HarmonicRealms() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const { analyser, setupAudioAnalyzer } = useAudioAnalyzer()

  useEffect(() => {
    if (audioRef.current) {
      setupAudioAnalyzer(audioRef.current)
    }
  }, [setupAudioAnalyzer])

  return (
    <div className="w-full h-screen relative">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <Scene analyser={analyser} />
        <OrbitControls enableZoom={false} />
      </Canvas>
      <audio
        ref={audioRef}
        src="/1.mp3"
        controls
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
      />
    </div>
  )
}
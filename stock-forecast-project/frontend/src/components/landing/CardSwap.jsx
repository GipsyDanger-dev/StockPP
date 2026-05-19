import { useState, useEffect, useCallback } from 'react'

export function Card({ children, className = '' }) {
  return <div className={className}>{children}</div>
}

export default function CardSwap({ children, cardDistance = 60, verticalDistance = 70, delay = 5000, pauseOnHover = false }) {
  const cards = Array.isArray(children) ? children.filter(c => c) : [children]
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const next = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % cards.length)
  }, [cards.length])

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(next, delay)
    return () => clearInterval(timer)
  }, [next, delay, isPaused])

  const getCardStyle = (index) => {
    const total = cards.length
    const relativeIndex = ((index - activeIndex) % total + total) % total

    if (relativeIndex === 0) {
      return {
        transform: 'translateY(0) scale(1) rotate(0deg)',
        opacity: 1,
        zIndex: total,
        filter: 'blur(0px)',
      }
    }

    const y = relativeIndex * verticalDistance * 0.3
    const scale = 1 - relativeIndex * 0.05
    const rotate = relativeIndex * 2
    const opacity = Math.max(0.3, 1 - relativeIndex * 0.25)
    const blur = relativeIndex * 0.5

    return {
      transform: `translateY(${y}px) scale(${scale}) rotate(${rotate}deg)`,
      opacity,
      zIndex: total - relativeIndex,
      filter: `blur(${blur}px)`,
    }
  }

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {cards.map((card, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={getCardStyle(i)}
        >
          {card}
        </div>
      ))}

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-50">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 border-none cursor-pointer ${
              i === activeIndex ? 'bg-blue-600 w-6' : 'bg-slate-300 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

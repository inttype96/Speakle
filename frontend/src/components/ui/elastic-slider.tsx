import React, { useState, useRef, useCallback } from 'react'

interface ElasticSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
  width?: number
  height?: number
  elasticity?: number
  damping?: number
}

export function ElasticSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className = '',
  width = 120,
  height = 6,
  elasticity = 0.3,
  damping = 0.7
}: ElasticSliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [animatedValue, setAnimatedValue] = useState(value)
  const sliderRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | undefined>(undefined)

  const updateValue = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const newValue = Math.round((min + percentage * (max - min)) / step) * step

    onChange(newValue)
    setAnimatedValue(newValue)
  }, [min, max, step, onChange])

  const animate = useCallback((targetValue: number) => {
    let currentValue = animatedValue

    const animateStep = () => {
      const diff = targetValue - currentValue
      const velocity = diff * elasticity
      currentValue += velocity * damping

      if (Math.abs(diff) > 0.1) {
        setAnimatedValue(currentValue)
        animationRef.current = requestAnimationFrame(animateStep)
      } else {
        setAnimatedValue(targetValue)
      }
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    animateStep()
  }, [animatedValue, elasticity, damping])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    updateValue(e)
  }, [updateValue])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      updateValue(e)
    }
  }, [isDragging, updateValue])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  React.useEffect(() => {
    if (!isDragging) {
      animate(value)
    }
  }, [value, animate, isDragging])

  const percentage = ((animatedValue - min) / (max - min)) * 100

  return (
    <div
      ref={sliderRef}
      className={`relative cursor-pointer ${className}`}
      style={{ width, height }}
      onMouseDown={handleMouseDown}
    >
      {/* Background track */}
      <div
        className="absolute top-0 w-full bg-gray-200 dark:bg-gray-600 rounded-full"
        style={{ height }}
      />

      {/* Active track with elastic animation */}
      <div
        className="absolute top-0 bg-primary rounded-full transition-all duration-75 ease-out"
        style={{
          width: `${percentage}%`,
          height,
          transform: isDragging ? 'scaleY(1.2)' : 'scaleY(1)',
          transformOrigin: 'left center'
        }}
      />

      {/* Thumb */}
      <div
        className="absolute top-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md transition-all duration-150 ease-out"
        style={{
          left: `${percentage}%`,
          transform: `translate(-50%, -50%) scale(${isDragging ? 1.2 : 1})`,
          boxShadow: isDragging ? '0 4px 8px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)'
        }}
      />
    </div>
  )
}
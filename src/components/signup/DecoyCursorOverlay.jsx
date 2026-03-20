import { useEffect, useRef, useState } from 'react'

const CURSOR_OPACITY = 0.86
const CURSOR_SCALE = 1

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function buildDecoys(count) {
  const orbitCount = Math.max(count, 1)
  const baseAngle = (Math.PI * 2 * randomBetween(0, 360)) / 360
  const directionAngles = [
    Math.PI * 0.52,
    Math.PI * 0.96,
    Math.PI * 1.38,
    Math.PI * 1.82,
    Math.PI * 0.72,
    Math.PI * 1.56,
  ]

  return Array.from({ length: count }, (_, index) => {
    const spreadAngle =
      baseAngle + (Math.PI * 2 * index) / orbitCount + (Math.PI / 20) * randomBetween(-1, 1)
    const motionAngle =
      directionAngles[index % directionAngles.length] + (Math.PI / 28) * randomBetween(-1, 1)

    return {
      seedAngle: spreadAngle,
      seedRadius: randomBetween(48, 88),
      motionAngle,
      motionScale: 0.88,
      scale: CURSOR_SCALE,
      opacity: CURSOR_OPACITY,
    }
  })
}

function getBounds(rect) {
  return {
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
  }
}

function hasSameBounds(previousBounds, nextBounds) {
  if (!previousBounds) return false

  return (
    Math.abs(previousBounds.left - nextBounds.left) < 1 &&
    Math.abs(previousBounds.right - nextBounds.right) < 1 &&
    Math.abs(previousBounds.top - nextBounds.top) < 1 &&
    Math.abs(previousBounds.bottom - nextBounds.bottom) < 1
  )
}

function createDecoyState(bounds, point, count, boundaryInset) {
  const centerX = (bounds.left + bounds.right) / 2
  const centerY = (bounds.top + bounds.bottom) / 2

  return {
    bounds,
    pointer: point,
    decoys: buildDecoys(count).map((decoy) => ({
      ...decoy,
      x: clamp(
        centerX + Math.cos(decoy.seedAngle) * decoy.seedRadius,
        bounds.left + boundaryInset,
        bounds.right - boundaryInset
      ),
      y: clamp(
        centerY + Math.sin(decoy.seedAngle) * decoy.seedRadius,
        bounds.top + boundaryInset,
        bounds.bottom - boundaryInset
      ),
    })),
  }
}

function CursorGlyph() {
  return (
    <svg viewBox="0 0 28 28" className="h-6 w-6 text-black drop-shadow-[0_2px_4px_rgba(15,23,42,0.18)]">
      <path
        d="M4 3.2L4.1 23.3L9.4 17.8L13.3 25.1L16.5 23.3L12.6 16.2L20.2 15L4 3.2Z"
        fill="white"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function DecoyCursorOverlay({ active, containerRef, count = 5 }) {
  const [isPointerDevice, setIsPointerDevice] = useState(false)
  const [overlayState, setOverlayState] = useState(null)
  const pointerRef = useRef(null)
  const boundaryInset = 16

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setIsPointerDevice(mediaQuery.matches)

    update()
    mediaQuery.addEventListener('change', update)

    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!active || !isPointerDevice) {
      pointerRef.current = null
      return undefined
    }

    function handleMove(event) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const bounds = getBounds(rect)

      const isInside =
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom

      if (!isInside) {
        pointerRef.current = null
        setOverlayState(null)
        return
      }

      const currentPoint = {
        x: event.clientX,
        y: event.clientY,
      }

      setOverlayState((previousState) => {
        const shouldSeed =
          !previousState ||
          !pointerRef.current ||
          previousState.decoys.length !== count ||
          !hasSameBounds(previousState.bounds, bounds)

        if (shouldSeed) {
          return createDecoyState(bounds, currentPoint, count, boundaryInset)
        }

        const deltaX = currentPoint.x - pointerRef.current.x
        const deltaY = currentPoint.y - pointerRef.current.y

        if (deltaX === 0 && deltaY === 0) {
          return previousState
        }

        return {
          bounds,
          pointer: currentPoint,
          decoys: previousState.decoys.map((decoy) => {
            const transformedX =
              deltaX * Math.cos(decoy.motionAngle) -
              deltaY * Math.sin(decoy.motionAngle)
            const transformedY =
              deltaX * Math.sin(decoy.motionAngle) +
              deltaY * Math.cos(decoy.motionAngle)

            return {
              ...decoy,
              x: clamp(
                decoy.x + transformedX * decoy.motionScale,
                bounds.left + boundaryInset,
                bounds.right - boundaryInset
              ),
              y: clamp(
                decoy.y + transformedY * decoy.motionScale,
                bounds.top + boundaryInset,
                bounds.bottom - boundaryInset
              ),
            }
          }),
        }
      })

      pointerRef.current = currentPoint
    }

    function handlePointerDown(event) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const bounds = getBounds(rect)
      const isInside =
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom

      if (!isInside) return

      const currentPoint = {
        x: event.clientX,
        y: event.clientY,
      }

      pointerRef.current = currentPoint
      setOverlayState(createDecoyState(bounds, currentPoint, count, boundaryInset))
    }

    function hidePointer() {
      pointerRef.current = null
      setOverlayState(null)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mousedown', handlePointerDown, true)
    window.addEventListener('blur', hidePointer)

    return () => {
      pointerRef.current = null
      setOverlayState(null)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mousedown', handlePointerDown, true)
      window.removeEventListener('blur', hidePointer)
    }
  }, [active, containerRef, count, isPointerDevice])

  if (!active || !isPointerDevice || !overlayState) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] hidden md:block">
      <div
        className="absolute left-0 top-0 -translate-x-[6px] -translate-y-[2px] transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${overlayState.pointer.x}px, ${overlayState.pointer.y}px) scale(${CURSOR_SCALE})`,
          opacity: CURSOR_OPACITY,
        }}
      >
        <CursorGlyph />
      </div>

      {overlayState.decoys.map((decoy, index) => {
        return (
          <div
            key={index}
            className="absolute left-0 top-0 -translate-x-[6px] -translate-y-[2px] transition-transform duration-150 ease-out"
            style={{
              transform: `translate(${decoy.x}px, ${decoy.y}px) scale(${decoy.scale})`,
              opacity: decoy.opacity,
            }}
          >
            <CursorGlyph />
          </div>
        )
      })}
    </div>
  )
}

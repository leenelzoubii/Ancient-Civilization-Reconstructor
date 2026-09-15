import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouch) return

    const dot = dotRef.current
    const ring = ringRef.current
    const glow = glowRef.current
    if (!dot || !ring || !glow) return

    let mouseX = -100
    let mouseY = -100
    let ringX = -100
    let ringY = -100
    let glowX = -100
    let glowY = -100
    let raf: number

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      dot.style.left = `${mouseX}px`
      dot.style.top = `${mouseY}px`
      dot.style.opacity = '1'
      ring.style.opacity = '1'
      glow.style.opacity = '1'
    }

    const onLeave = () => {
      dot.style.opacity = '0'
      ring.style.opacity = '0'
      glow.style.opacity = '0'
    }

    const animate = () => {
      ringX += (mouseX - ringX) * 0.12
      ringY += (mouseY - ringY) * 0.12
      glowX += (mouseX - glowX) * 0.06
      glowY += (mouseY - glowY) * 0.06

      ring.style.left = `${ringX}px`
      ring.style.top = `${ringY}px`
      glow.style.left = `${glowX}px`
      glow.style.top = `${glowY}px`

      raf = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    raf = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #d4af37, #e56b4f)',
          boxShadow: '0 0 12px rgba(212,175,55,0.8), 0 0 24px rgba(212,175,55,0.4)',
          pointerEvents: 'none',
          zIndex: 2147483647,
          transform: 'translate(-50%, -50%)',
          opacity: 0,
          transition: 'opacity 0.15s ease',
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1.5px solid rgba(212,175,55,0.5)',
          boxShadow: '0 0 15px rgba(212,175,55,0.15), inset 0 0 10px rgba(212,175,55,0.05)',
          pointerEvents: 'none',
          zIndex: 2147483646,
          transform: 'translate(-50%, -50%)',
          opacity: 0,
          transition: 'opacity 0.2s ease',
        }}
      />
      <div
        ref={glowRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, rgba(229,107,79,0.05) 40%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 2147483645,
          transform: 'translate(-50%, -50%)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
        }}
      />
    </>
  )
}

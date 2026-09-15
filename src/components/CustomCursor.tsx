import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouchDevice) return

    const dot = dotRef.current
    const ring = ringRef.current
    const glow = glowRef.current
    if (!dot || !ring || !glow) return

    let mouseX = 0, mouseY = 0
    let ringX = 0, ringY = 0
    let glowX = 0, glowY = 0

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      dot.style.left = `${mouseX}px`
      dot.style.top = `${mouseY}px`
      if (!visible) setVisible(true)
    }

    const animate = () => {
      ringX += (mouseX - ringX) * 0.15
      ringY += (mouseY - ringY) * 0.15
      glowX += (mouseX - glowX) * 0.08
      glowY += (mouseY - glowY) * 0.08

      ring.style.left = `${ringX}px`
      ring.style.top = `${ringY}px`
      glow.style.left = `${glowX}px`
      glow.style.top = `${glowY}px`

      requestAnimationFrame(animate)
    }

    const onEnter = () => setVisible(true)
    const onLeave = () => setVisible(false)

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseenter', onEnter)
    document.addEventListener('mouseleave', onLeave)
    const raf = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseenter', onEnter)
      document.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [visible])

  return (
    <>
      <div
        ref={dotRef}
        className="fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #d4af37, #e56b4f)',
          boxShadow: '0 0 10px rgba(212,175,55,0.6), 0 0 20px rgba(212,175,55,0.3)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
      />
      <div
        ref={ringRef}
        className="fixed pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1.5px solid rgba(212,175,55,0.4)',
          boxShadow: '0 0 15px rgba(212,175,55,0.15)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s, width 0.2s, height 0.2s, border-color 0.2s',
        }}
      />
      <div
        ref={glowRef}
        className="fixed pointer-events-none z-[9997] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s',
        }}
      />
    </>
  )
}

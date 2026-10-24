import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const dot = container.children[0] as HTMLDivElement
    const ring = container.children[1] as HTMLDivElement
    const glow = container.children[2] as HTMLDivElement

    let mouseX = -200
    let mouseY = -200
    let ringX = -200
    let ringY = -200
    let glowX = -200
    let glowY = -200
    let raf: number

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      dot.style.left = mouseX + 'px'
      dot.style.top = mouseY + 'px'
      dot.style.opacity = '1'
      ring.style.opacity = '1'
      glow.style.opacity = '1'
    }

    const onLeave = () => {
      dot.style.opacity = '0'
      ring.style.opacity = '0'
      glow.style.opacity = '0'
    }

    const onEnter = () => {
      dot.style.opacity = '1'
      ring.style.opacity = '1'
      glow.style.opacity = '1'
    }

    const animate = () => {
      ringX += (mouseX - ringX) * 0.12
      ringY += (mouseY - ringY) * 0.12
      glowX += (mouseX - glowX) * 0.06
      glowY += (mouseY - glowY) * 0.06

      ring.style.left = ringX + 'px'
      ring.style.top = ringY + 'px'
      glow.style.left = glowX + 'px'
      glow.style.top = glowY + 'px'

      raf = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)
    raf = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: 2147483647,
      }}
    >
      {/* dot */}
      <div style={{
        position: 'fixed',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #d4af37, #e56b4f)',
        boxShadow: '0 0 12px rgba(212,175,55,0.8), 0 0 24px rgba(212,175,55,0.4)',
        transform: 'translate(-50%, -50%)',
        opacity: '0',
        pointerEvents: 'none',
        zIndex: '2147483647',
      }} />
      {/* ring */}
      <div style={{
        position: 'fixed',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '1.5px solid rgba(212,175,55,0.5)',
        boxShadow: '0 0 15px rgba(212,175,55,0.15), inset 0 0 10px rgba(212,175,55,0.05)',
        transform: 'translate(-50%, -50%)',
        opacity: '0',
        pointerEvents: 'none',
        zIndex: '2147483646',
      }} />
      {/* glow */}
      <div style={{
        position: 'fixed',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, rgba(229,107,79,0.06) 40%, transparent 70%)',
        transform: 'translate(-50%, -50%)',
        opacity: '0',
        pointerEvents: 'none',
        zIndex: '2147483645',
      }} />
    </div>
  )
}

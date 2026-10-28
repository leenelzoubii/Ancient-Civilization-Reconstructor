import { useState, useRef, useCallback, useEffect } from 'react'
import {
  DEV_MOCK_AI,
  LARGE_MASK_FRACTION,
  estimatedEditCostLabel,
  getSessionSpend,
  preflightMask,
  resetSessionSpend,
  restoreWithMask,
  blobToDataUrl,
} from '../services/restoreService'
import type { RestoreResult } from '../services/restoreService'
import { predictCivilization } from '../services/predictService'
import type { Prediction } from '../services/predictService'
import { analyzeArtifact } from '../services/analysis'
import type { ArtifactAnalysis } from '../services/analysis'
import { detectDamage } from '../services/damage'
import type { DetectedDamage } from '../services/damage'
import ReconstructionResult from '../components/ReconstructionResult'

type Mode = 'manual' | 'auto'
type Step = 'upload' | 'preview' | 'restoring' | 'result'
type Tool = 'brush' | 'eraser'

/** Brush overlay colour: warm red reads on light stone, pottery and paper. */
const BRUSH_COLOR = 'rgba(206, 68, 44, 0.72)'
const MAX_UNDO = 12

/** Loads an image element from a data URL. */
function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('This image could not be opened.'))
    img.src = src
  })
}

export default function ArtifactRestorer() {
  const [mode, setMode] = useState<Mode>('manual')
  const [step, setStep] = useState<Step>('upload')
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [originalBase64, setOriginalBase64] = useState<string | null>(null)
  const [restoredImage, setRestoredImage] = useState<string | null>(null)
  const [result, setResult] = useState<RestoreResult | null>(null)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [analysis, setAnalysis] = useState<ArtifactAnalysis | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [brushSize, setBrushSize] = useState(16)
  const [tool, setTool] = useState<Tool>('brush')
  const [painted, setPainted] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [confirming, setConfirming] = useState<{
    large: boolean
    fraction: number
  } | null>(null)
  const [largeAck, setLargeAck] = useState(false)
  const [pendingMask, setPendingMask] = useState<string | null>(null)
  const [lastFraction, setLastFraction] = useState(0)
  const [spend, setSpend] = useState(getSessionSpend)
  const [detecting, setDetecting] = useState(false)
  const [autoDamage, setAutoDamage] = useState<DetectedDamage | null>(null)
  const inFlightRef = useRef(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const autoCanvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const maskRef = useRef<HTMLCanvasElement | null>(null)
  const paintedRef = useRef(false)
  const imgMapRef = useRef({ scale: 1, offX: 0, offY: 0 })
  /** Last point of the current stroke, in display and mask coordinates. */
  const strokeRef = useRef<{ x: number; y: number; ix: number; iy: number } | null>(null)
  /** Previous smoothed midpoint, for quadratic stroke smoothing. */
  const lastMidRef = useRef<{ x: number; y: number; ix: number; iy: number } | null>(null)
  const drawingRef = useRef(false)
  /** Snapshot of the mask before each stroke, so Undo can step back. */
  const undoRef = useRef<string[]>([])

  const [cameraActive, setCameraActive] = useState(false)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  const prepareFile = useCallback(async (file: File): Promise<{ dataUrl: string; b64: string }> => {
    const rawUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = () => reject(new Error('read failed'))
      r.readAsDataURL(file)
    })
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('decode failed'))
      i.src = rawUrl
    })
    const MAX = 1024
    let w = img.naturalWidth
    let h = img.naturalHeight
    if (w > MAX || h > MAX) {
      const scale = Math.min(MAX / w, MAX / h)
      w = Math.round(w * scale)
      h = Math.round(h * scale)
    }
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    let outW = w
    let outH = h
    let dataUrl = ''
    for (let tries = 0; tries < 4; tries++) {
      canvas.width = outW
      canvas.height = outH
      ctx.drawImage(img, 0, 0, outW, outH)
      dataUrl = await new Promise<string>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('PNG encode failed'))
            const r = new FileReader()
            r.onload = () => resolve(r.result as string)
            r.onerror = () => reject(new Error('read failed'))
            r.readAsDataURL(blob)
          },
          'image/png'
        )
      })
      if (dataUrl.length <= 4_700_000) break
      outW = Math.round(outW * 0.75)
      outH = Math.round(outH * 0.75)
    }
    return { dataUrl, b64: dataUrl.split(',')[1] }
  }, [])

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a PNG or JPEG image.')
        return
      }
      setError(null)
      try {
        const { dataUrl, b64 } = await prepareFile(file)
        setOriginalImage(dataUrl)
        setOriginalBase64(b64)
        setRestoredImage(null)
        setResult(null)
        setPrediction(null)
        setAnalysis(null)
        setStep('preview')
      } catch {
        setError('Could not read that image file. Please try another image.')
      }
    },
    [prepareFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
      })
      streamRef.current = stream
      setCameraActive(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      }, 100)
    } catch {
      setError('Camera access denied. Please upload a file instead.')
    }
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    stopCamera()
    canvas.toBlob((blob) => {
      if (blob) handleFile(new File([blob], 'capture.png', { type: 'image/png' }))
      else setError('Could not capture a photo. Please upload a file instead.')
    }, 'image/png')
  }, [stopCamera, handleFile])

  const drawOverlay = useCallback((canvas: HTMLCanvasElement | null) => {
    const mask = maskRef.current
    if (!canvas || !mask) return
    const ctx = canvas.getContext('2d')!
    const { scale, offX, offY } = imgMapRef.current
    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.globalCompositeOperation = 'source-over'
    ctx.drawImage(mask, offX, offY, mask.width * scale, mask.height * scale)
    ctx.globalCompositeOperation = 'source-in'
    ctx.fillStyle = BRUSH_COLOR
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
  }, [])

  const initCanvas = useCallback(() => {
    if (!imageRef.current) return
    const img = imageRef.current
    const cw = img.clientWidth
    const ch = img.clientHeight
    if (!cw || !ch) return
    const canvas = canvasRef.current
    if (canvas) {
      canvas.width = cw
      canvas.height = ch
      canvas.getContext('2d')!.clearRect(0, 0, cw, ch)
    }
    const autoCanvas = autoCanvasRef.current
    if (autoCanvas) {
      autoCanvas.width = cw
      autoCanvas.height = ch
      autoCanvas.getContext('2d')!.clearRect(0, 0, cw, ch)
    }
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    if (!nw || !nh) return
    const scale = Math.min(cw / nw, ch / nh)
    const offX = (cw - nw * scale) / 2
    const offY = (ch - nh * scale) / 2
    imgMapRef.current = { scale, offX, offY }
    strokeRef.current = null
    lastMidRef.current = null
    drawingRef.current = false

    // Returning from the result page remounts the canvas: keep the mask the
    // user already painted instead of wiping it, and redraw the overlay.
    const existing = maskRef.current
    if (existing && existing.width === nw && existing.height === nh) {
      drawOverlay(canvas)
      drawOverlay(autoCanvas)
      return
    }

    const mask = document.createElement('canvas')
    mask.width = nw
    mask.height = nh
    mask.getContext('2d')!.clearRect(0, 0, nw, nh)
    maskRef.current = mask
    paintedRef.current = false
    undoRef.current = []
    setPainted(false)
    setCanUndo(false)
  }, [drawOverlay])

  useEffect(() => {
    if (step === 'preview') {
      // Runs on step change AND when the brush canvas mounts (e.g. the user
      // switches Auto → Manual after uploading), otherwise the mask canvas
      // would never exist and painting / detection would be a no-op.
      const timer = setTimeout(initCanvas, 200)
      return () => clearTimeout(timer)
    }
  }, [step, mode, initCanvas])

  const getMaskDataUrl = useCallback((): string | null => {
    const mask = maskRef.current
    if (!mask) return null
    const d = mask.getContext('2d')!.getImageData(0, 0, mask.width, mask.height).data
    for (let i = 3; i < d.length; i += 4) {
      if (d[i] > 127) return mask.toDataURL('image/png')
    }
    return null
  }, [])

  /** True when at least one mask pixel is painted. */
  const hasPaint = useCallback((): boolean => {
    const mask = maskRef.current
    if (!mask) return false
    const d = mask.getContext('2d')!.getImageData(0, 0, mask.width, mask.height).data
    for (let i = 3; i < d.length; i += 4) {
      if (d[i] > 20) return true
    }
    return false
  }, [])

  /** Rebuilds the red overlay from the mask (after undo / clear / detection). */
  const syncOverlay = useCallback(() => {
    drawOverlay(canvasRef.current)
    drawOverlay(autoCanvasRef.current)
  }, [drawOverlay])

  /**
   * Auto mode: run the local crack detector and copy the result into the mask
   * canvas. Only the detected pixels (plus a small feather) are sent to the
   * model, so the rest of the photo cannot be redrawn.
   */
  const applyDetectedMask = useCallback(
    (detected: DetectedDamage) => {
      const mask = maskRef.current
      if (!mask) return
      const ctx = mask.getContext('2d')!
      ctx.clearRect(0, 0, mask.width, mask.height)
      ctx.drawImage(detected.mask, 0, 0, mask.width, mask.height)
      paintedRef.current = detected.found
      setPainted(detected.found)
      syncOverlay()
    },
    [syncOverlay]
  )

  // Detect damage as soon as the auto preview opens, so the red overlay and
  // the coverage figure are visible before the user confirms anything.
  useEffect(() => {
    if (step !== 'preview' || mode !== 'auto' || !originalImage) return
    let alive = true
    setDetecting(true)
    setAutoDamage(null)
    const timer = window.setTimeout(() => {
      detectDamage(originalImage)
        .then((detected) => {
          if (!alive) return
          setAutoDamage(detected)
          if (detected.found) applyDetectedMask(detected)
          setDetecting(false)
        })
        .catch(() => {
          if (alive) setDetecting(false)
        })
    }, 300)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [step, mode, originalImage, applyDetectedMask])

  // Step 1: pre-flight + confirmation. Makes NO API call.
  const handleRestore = useCallback(async () => {
    if (!originalBase64) return
    if (inFlightRef.current) return
    setError(null)

    let mask: string | null
    if (mode === 'auto') {
      try {
        let detected = autoDamage
        if (!detected) {
          detected = await detectDamage(
            originalImage ?? `data:image/png;base64,${originalBase64}`
          )
          setAutoDamage(detected)
          if (detected.found) applyDetectedMask(detected)
        }
        if (!detected.found) {
          setError(
            'No cracks or damage were detected in this photo. Switch to Manual and paint the damaged areas, or try a sharper, well-lit photo.'
          )
          return
        }
        mask = detected.mask.toDataURL('image/png')
        const pre = await preflightMask(originalBase64, mask)
        setPendingMask(mask)
        setLastFraction(pre.analysis.fraction)
        setLargeAck(false)
        setConfirming({
          large: pre.analysis.fraction > LARGE_MASK_FRACTION,
          fraction: pre.analysis.fraction,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Automatic detection failed. Try Manual mode.')
      }
    } else {
      mask = getMaskDataUrl()
      if (!mask) {
        setError('Please paint over the damaged areas first.')
        return
      }
      try {
        const pre = await preflightMask(originalBase64, mask)
        setPendingMask(mask)
        setLastFraction(pre.analysis.fraction)
        setLargeAck(false)
        setConfirming({
          large: pre.analysis.fraction > LARGE_MASK_FRACTION,
          fraction: pre.analysis.fraction,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Mask check failed.')
      }
    }
  }, [originalBase64, originalImage, mode, getMaskDataUrl, autoDamage, applyDetectedMask])

  // Step 2: the single paid call (or $0 mock), then prediction + analysis.
  const doRestore = useCallback(async () => {
    if (!originalBase64 || !pendingMask || !originalImage) return
    if (inFlightRef.current) return
    inFlightRef.current = true
    setConfirming(null)
    setStep('restoring')
    setError(null)
    const started = performance.now()
    try {
      const res = await restoreWithMask(originalBase64, pendingMask)
      const restoredUrl = res.blob ? await blobToDataUrl(res.blob) : null
      setResult(res)
      setRestoredImage(restoredUrl)
      setSpend(getSessionSpend())

      let pred: Prediction | null = null
      try {
        pred = await predictCivilization(originalImage)
        setPrediction(pred)
      } catch {
        pred = null
      }

      let ana: ArtifactAnalysis | null = null
      if (restoredUrl) {
        try {
          ana = await analyzeArtifact({
            originalUrl: originalImage,
            restoredUrl,
            // Both modes have a real mask canvas: manual = brush,
            // auto = locally detected cracks. The analysis measures the area
            // that was actually repaired, not a symmetry guess.
            paintedMask: maskRef.current,
          })
          setAnalysis(ana)
        } catch {
          setAnalysis(null)
        }
      } else {
        setAnalysis(null)
      }

      setElapsedMs(performance.now() - started)
      setSpend(getSessionSpend())
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restoration failed. Please try again.')
      setStep('preview')
    } finally {
      inFlightRef.current = false
    }
  }, [originalBase64, pendingMask, originalImage, mode])

  const tryAgain = useCallback(() => {
    if (inFlightRef.current) return
    setError(null)
    setLargeAck(false)
    setConfirming({
      large: lastFraction > LARGE_MASK_FRACTION,
      fraction: lastFraction,
    })
    setStep('preview')
  }, [lastFraction])

  const resetSpend = useCallback(() => {
    resetSessionSpend()
    setSpend(getSessionSpend())
  }, [])

  const renderConfirmPanel = () => {
    if (!confirming) return null
    return (
      <div className="about-note" style={{ marginTop: 16 }}>
        <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--ink)' }}>
          {DEV_MOCK_AI
            ? 'This run is free (mock mode — no OpenAI call). Continue?'
            : `This will use ${estimatedEditCostLabel()} of OpenAI credit. Continue?`}
        </p>
        <p className="muted" style={{ margin: '0 0 4px', fontSize: '.86rem' }}>
          Mode: {mode === 'auto' ? 'Auto (detected cracks)' : 'Manual (brush-selected)'} ·{' '}
          {mode === 'auto'
            ? `Detected damage: ${(confirming.fraction * 100).toFixed(1)}% of the image.`
            : `Painted area: ${(confirming.fraction * 100).toFixed(1)}% of the image.`}
        </p>
        <p className="muted" style={{ margin: '0 0 10px', fontSize: '.82rem' }}>
          Only the marked areas are rebuilt. Every other pixel of your photo stays exactly as it
          is — no new object, no restyling, no crop.
        </p>

        {confirming.large && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ margin: '0 0 8px', fontSize: '.86rem', color: 'var(--danger)' }}>
              Large repair area. A thinner mask gives a more faithful repair, so check the red
              overlay before continuing.
            </p>
            <label className="switch">
              <input
                type="checkbox"
                checked={largeAck}
                onChange={(e) => setLargeAck(e.target.checked)}
              />
              <span>
                <strong>I understand — restore anyway</strong>
              </span>
            </label>
          </div>
        )}

        <div className="result-actions" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="btn btn-gold btn-sm"
            onClick={doRestore}
            disabled={confirming.large && !largeAck}
          >
            Continue
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setConfirming(null)}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  const handleDownload = useCallback(() => {
    if (!restoredImage) return
    const a = document.createElement('a')
    a.href = restoredImage
    a.download = 'restored-artifact.png'
    a.click()
  }, [restoredImage])

  const handleReset = useCallback(() => {
    setStep('upload')
    setOriginalImage(null)
    setOriginalBase64(null)
    setRestoredImage(null)
    setResult(null)
    setPrediction(null)
    setAnalysis(null)
    setElapsedMs(0)
    setError(null)
    setConfirming(null)
    setPendingMask(null)
    setLargeAck(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    maskRef.current = null
    paintedRef.current = false
    undoRef.current = []
    strokeRef.current = null
    lastMidRef.current = null
    setPainted(false)
    setCanUndo(false)
    stopCamera()
  }, [stopCamera])

  /* ---------------- Pointer brush ---------------- */

  /** Pointer position in display coordinates and in mask coordinates. */
  const pointOf = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const kx = canvas.width / (rect.width || 1)
    const ky = canvas.height / (rect.height || 1)
    const x = (e.clientX - rect.left) * kx
    const y = (e.clientY - rect.top) * ky
    const { scale, offX, offY } = imgMapRef.current
    return { x, y, ix: (x - offX) / scale, iy: (y - offY) / scale }
  }, [])

  const paintSegment = useCallback(
    (from: { x: number; y: number; ix: number; iy: number }, to: { x: number; y: number; ix: number; iy: number }) => {
      const canvas = canvasRef.current
      const mask = maskRef.current
      if (!canvas) return
      const composite = tool === 'eraser' ? 'destination-out' : 'source-over'

      const ctx = canvas.getContext('2d')!
      ctx.save()
      ctx.globalCompositeOperation = composite
      ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : BRUSH_COLOR
      ctx.lineWidth = brushSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      const midX = (from.x + to.x) / 2
      const midY = (from.y + to.y) / 2
      const { scale } = imgMapRef.current
      const mMidX = (from.ix + to.ix) / 2
      const mMidY = (from.iy + to.iy) / 2
      const prevMid = lastMidRef.current
      ctx.beginPath()
      if (prevMid) {
        ctx.moveTo(prevMid.x, prevMid.y)
        ctx.quadraticCurveTo(from.x, from.y, midX, midY)
      } else {
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(midX, midY)
      }
      ctx.stroke()
      ctx.restore()

      if (mask) {
        const mctx = mask.getContext('2d')!
        mctx.save()
        mctx.globalCompositeOperation = composite
        mctx.strokeStyle = '#ffffff'
        mctx.lineWidth = Math.max(1, brushSize / scale)
        mctx.lineCap = 'round'
        mctx.lineJoin = 'round'
        mctx.beginPath()
        if (prevMid) {
          mctx.moveTo(prevMid.ix, prevMid.iy)
          mctx.quadraticCurveTo(from.ix, from.iy, mMidX, mMidY)
        } else {
          mctx.moveTo(from.ix, from.iy)
          mctx.lineTo(mMidX, mMidY)
        }
        mctx.stroke()
        mctx.restore()
      }
      lastMidRef.current = { x: midX, y: midY, ix: mMidX, iy: mMidY }
    },
    [brushSize, tool]
  )

  const paintDot = useCallback(
    (p: { x: number; y: number; ix: number; iy: number }) => {
      const canvas = canvasRef.current
      const mask = maskRef.current
      const composite = tool === 'eraser' ? 'destination-out' : 'source-over'
      if (canvas) {
        const ctx = canvas.getContext('2d')!
        ctx.save()
        ctx.globalCompositeOperation = composite
        ctx.fillStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : BRUSH_COLOR
        ctx.beginPath()
        ctx.arc(p.x, p.y, brushSize / 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      if (mask) {
        const { scale } = imgMapRef.current
        const mctx = mask.getContext('2d')!
        mctx.save()
        mctx.globalCompositeOperation = composite
        mctx.fillStyle = '#ffffff'
        mctx.beginPath()
        mctx.arc(p.ix, p.iy, Math.max(0.5, brushSize / 2 / scale), 0, Math.PI * 2)
        mctx.fill()
        mctx.restore()
      }
    },
    [brushSize, tool]
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      const mask = maskRef.current
      if (!mask) return
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      // Snapshot before the stroke so Undo can restore the previous state.
      undoRef.current.push(mask.toDataURL('image/png'))
      if (undoRef.current.length > MAX_UNDO) undoRef.current.shift()
      setCanUndo(true)

      const p = pointOf(e)
      strokeRef.current = p
      lastMidRef.current = null
      drawingRef.current = true
      paintDot(p)
      paintedRef.current = true
      setPainted(true)
      moveCursor(e)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pointOf, paintDot]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      moveCursor(e)
      if (!drawingRef.current) return
      const prev = strokeRef.current
      if (!prev) return
      const p = pointOf(e)
      paintSegment(prev, p)
      strokeRef.current = p
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pointOf, paintSegment]
  )

  const endStroke = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false
    strokeRef.current = null
    lastMidRef.current = null
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }, [])

  /** Moves the circular cursor ring to the pointer, in CSS pixels. */
  const moveCursor = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const cursor = cursorRef.current
    const canvas = canvasRef.current
    if (!cursor || !canvas) return
    const rect = canvas.getBoundingClientRect()
    cursor.style.display = 'block'
    cursor.style.transform = `translate(${e.clientX - rect.left}px, ${e.clientY - rect.top}px) translate(-50%, -50%)`
  }, [])

  const hideCursor = useCallback(() => {
    if (cursorRef.current) cursorRef.current.style.display = 'none'
  }, [])

  const undo = useCallback(async () => {
    const mask = maskRef.current
    if (!mask) return
    const snapshot = undoRef.current.pop()
    if (!snapshot) return
    try {
      const img = await loadImageEl(snapshot)
      const ctx = mask.getContext('2d')!
      ctx.save()
      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(0, 0, mask.width, mask.height)
      ctx.drawImage(img, 0, 0)
      ctx.restore()
    } catch {
      /* ignore an unreadable snapshot */
    }
    syncOverlay()
    const stillPainted = hasPaint()
    paintedRef.current = stillPainted
    setPainted(stillPainted)
    setCanUndo(undoRef.current.length > 0)
  }, [hasPaint, syncOverlay])

  const clearMask = useCallback(() => {
    strokeRef.current = null
    lastMidRef.current = null
    undoRef.current = []
    const mask = maskRef.current
    if (mask) mask.getContext('2d')!.clearRect(0, 0, mask.width, mask.height)
    const canvas = canvasRef.current
    if (canvas) canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    paintedRef.current = false
    setPainted(false)
    setCanUndo(false)
  }, [])

  /* ---------------- Render ---------------- */

  if (step === 'result' && originalImage && result) {
    return (
      <ReconstructionResult
        originalUrl={originalImage}
        restoredUrl={restoredImage}
        result={result}
        prediction={prediction}
        analysis={analysis}
        elapsedMs={elapsedMs}
        mode={mode}
        onBack={() => setStep('preview')}
        onReset={handleReset}
        onTryAgain={tryAgain}
        onDownload={handleDownload}
      />
    )
  }

  const stepIndex = step === 'upload' ? 0 : step === 'result' ? 2 : 1
  const stepClass = (i: number) => (i < stepIndex ? 'done' : i === stepIndex ? 'active' : '')

  return (
    <div className="container">
      <div className="page-head" style={{ paddingBottom: 10 }}>
        <span className="eyebrow">Repair studio</span>
        <h1>AI Artifact Repair</h1>
        <p className="lead">
          Upload a photo of a damaged artifact, choose whether the detector finds the damage itself
          or follow your brush, and confirm the price estimate before anything is generated. Only the
          marked damage is repaired — every other pixel stays exactly as it was.
        </p>
      </div>

      <ol className="stepper">
        <li className={stepClass(0)}>
          <span className="num">{stepIndex > 0 ? '✓' : '1'}</span>Upload photo
        </li>
        <li className={stepClass(1)}>
          <span className="num">{stepIndex > 1 ? '✓' : '2'}</span>Repair damage
        </li>
        <li className={stepClass(2)}>
          <span className="num">3</span>Repaired result
        </li>
      </ol>

      <div className="recon-layout">
        <div>
          {step === 'upload' && (
            <section className="panel">
              <h3>Upload broken artifact</h3>
              <p className="sub">
                Drag and drop, or choose a photo. For best results, photograph the object front-on
                against a plain background.
              </p>

              <div
                className="dropzone"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <div>
                  <div className="dz-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <path d="M17 8l-5-5-5 5" />
                      <path d="M12 3v12" />
                    </svg>
                  </div>
                  <strong>Upload image</strong>
                  <p className="muted" style={{ margin: '4px 0 0' }}>
                    Drag &amp; drop or click to browse · PNG, JPG
                  </p>
                </div>
              </div>

              <div className="dz-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={startCamera}>
                  Take a photo instead
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                hidden
                onChange={handleFileInput}
              />
            </section>
          )}

          {(step === 'preview' || step === 'restoring') && originalImage && (
            <section className="panel">
              <h3>{mode === 'auto' ? 'Automatic detection' : 'Paint over the damage'}</h3>
              <p className="sub">
                {mode === 'auto'
                  ? detecting
                    ? 'Scanning the photo for cracks, chips and imperfections…'
                    : autoDamage?.found
                      ? `Detected damage on ${(autoDamage.fraction * 100).toFixed(1)}% of the photo — shown in red. Only those pixels are rebuilt; the rest of your photo is kept identical.`
                      : 'No cracks or damage were detected. Switch to Manual and paint the areas you want repaired.'
                  : 'Paint thinly along the cracks, not over the whole object. Use a mouse, a finger or a pen — the red overlay shows exactly what the AI will rebuild. Everything outside the red stays identical.'}
              </p>

              <div className="result-card" style={{ padding: 10 }}>
                <div className="brush-stage">
                  <img
                    ref={imageRef}
                    src={originalImage}
                    alt="Uploaded artifact"
                    className="brush-image"
                    onLoad={initCanvas}
                  />
                  {mode === 'auto' && (
                    <canvas ref={autoCanvasRef} className="brush-canvas auto-mask" aria-hidden="true" />
                  )}
                  {mode === 'manual' && (
                    <>
                      <canvas
                        ref={canvasRef}
                        className="brush-canvas"
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={endStroke}
                        onPointerCancel={endStroke}
                        onLostPointerCapture={endStroke}
                        onPointerLeave={hideCursor}
                      />
                      <div
                        ref={cursorRef}
                        className={`brush-cursor${tool === 'eraser' ? ' eraser' : ''}`}
                        style={{ width: brushSize, height: brushSize, display: 'none' }}
                        aria-hidden="true"
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="result-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={handleReset}>
                  Start over
                </button>
                {mode === 'manual' && (
                  <span className="brush-hint">
                    {painted
                      ? `${tool === 'eraser' ? 'Erasing' : 'Painting'} · ${brushSize}px brush`
                      : 'Click and drag on the photo to paint the damage.'}
                  </span>
                )}
              </div>
            </section>
          )}
        </div>

        <aside>
          <section className="panel">
            <h3>Settings</h3>

            <div className="field">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={mode === 'auto'}
                  onChange={(e) => setMode(e.target.checked ? 'auto' : 'manual')}
                />
                <span>
                  <strong>Automatic detection</strong>
                  <br />
                  <span className="hint">
                    Let the AI find cracks and imperfections itself. Turn off to paint the damage
                    with a brush.
                  </span>
                </span>
              </label>
            </div>

            {mode === 'manual' && step !== 'upload' && (
              <div className="field">
                <label htmlFor="brush-size">Brush size: {brushSize}px</label>
                <input
                  id="brush-size"
                  type="range"
                  min={4}
                  max={80}
                  step={1}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                />
                <span className="hint">Paint over cracks, chips and missing pieces.</span>

                <div className="brush-tools">
                  <button
                    type="button"
                    className={`btn btn-sm ${tool === 'brush' ? 'btn-primary' : 'btn-outline'}`}
                    aria-pressed={tool === 'brush'}
                    onClick={() => setTool('brush')}
                  >
                    Brush
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${tool === 'eraser' ? 'btn-primary' : 'btn-outline'}`}
                    aria-pressed={tool === 'eraser'}
                    onClick={() => setTool('eraser')}
                  >
                    Eraser
                  </button>
                </div>

                <div className="brush-tools">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={undo}
                    disabled={!canUndo}
                  >
                    Undo
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={clearMask}
                    disabled={!painted && !canUndo}
                  >
                    Clear mask
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              className="btn btn-gold"
              style={{ width: '100%' }}
              disabled={!originalImage || step === 'restoring'}
              onClick={handleRestore}
            >
              {step === 'restoring' ? (
                'Processing…'
              ) : (
                <>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
                    <path d="M19 3v4M17 5h4" />
                  </svg>
                  Repair artifact
                </>
              )}
            </button>

            {step === 'restoring' && (
              <>
                <div className="progress">
                  <div style={{ width: '100%' }} />
                </div>
                <ul className="process-list">
                  <li className="ok">
                    <span className="dot">✓</span>Preparing image
                  </li>
                  <li className="ok">
                    <span className="dot">✓</span>Uploading to the restoration service
                  </li>
                  <li className="run">
                    <span className="dot" />
                    Repairing the damaged surface
                  </li>
                  <li>
                    <span className="dot" />
                    Adding optional context
                  </li>
                  <li>
                    <span className="dot" />
                    Measuring the repaired area
                  </li>
                </ul>
              </>
            )}

            {step !== 'restoring' && renderConfirmPanel()}

            {error && <div className="error-box">{error}</div>}

            <div className="field" style={{ marginBottom: 0 }}>
              <span className="hint">
                {DEV_MOCK_AI ? 'Mock mode — $0, no OpenAI calls. ' : ''}
                Session spend ≈ $
                {spend.estimatedUsd < 0.01
                  ? spend.estimatedUsd.toFixed(3)
                  : spend.estimatedUsd.toFixed(2)}
                {' · '}
                {spend.imageCalls} image / {spend.visionCalls} vision
              </span>
              {(spend.imageCalls > 0 || spend.visionCalls > 0) && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: 8 }}
                  onClick={resetSpend}
                >
                  Reset counter
                </button>
              )}
            </div>
          </section>

          <section className="panel">
            <h3>Tips for a good photo</h3>
            <ul className="tips">
              <li>Use a plain, light background that contrasts with the object.</li>
              <li>Photograph straight on, with the object upright and centred.</li>
              <li>Avoid strong shadows and reflections.</li>
              <li>Include all remaining fragments in one photo.</li>
            </ul>
            <p className="muted" style={{ fontSize: '.82rem', margin: '12px 0 0' }}>
              Your photo is only sent to the restoration service after you confirm the estimate.
            </p>
          </section>
        </aside>
      </div>

      {cameraActive && (
        <dialog className="vr-dialog" open>
          <form method="dialog">
            <div className="vr-dialog-head">
              <h2>Take a photo</h2>
              <button type="button" className="vr-close" aria-label="Close" onClick={stopCamera}>
                ✕
              </button>
            </div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: '100%', borderRadius: 14, marginTop: 12 }}
            />
            <div className="result-actions">
              <button type="button" className="btn btn-gold" onClick={capturePhoto}>
                Capture
              </button>
              <button type="button" className="btn btn-outline" onClick={stopCamera}>
                Cancel
              </button>
            </div>
          </form>
        </dialog>
      )}
    </div>
  )
}

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

type Mode = 'manual' | 'auto'
type Step = 'upload' | 'preview' | 'restoring' | 'result'

export default function ArtifactRestorer() {
  const [mode, setMode] = useState<Mode>('manual')
  const [step, setStep] = useState<Step>('upload')
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [originalBase64, setOriginalBase64] = useState<string | null>(null)
  const [restoredImage, setRestoredImage] = useState<string | null>(null)
  const [result, setResult] = useState<RestoreResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [brushSize, setBrushSize] = useState(10)
  const [isDrawing, setIsDrawing] = useState(false)
  const [confirming, setConfirming] = useState<{
    large: boolean
    fraction: number
  } | null>(null)
  const [largeAck, setLargeAck] = useState(false)
  const [pendingMask, setPendingMask] = useState<string | null>(null)
  const [lastFraction, setLastFraction] = useState(0)
  const [spend, setSpend] = useState(getSessionSpend)
  const inFlightRef = useRef(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const maskRef = useRef<HTMLCanvasElement | null>(null)
  const paintedRef = useRef(false)
  const imgMapRef = useRef({ scale: 1, offX: 0, offY: 0 })

  const [cameraActive, setCameraActive] = useState(false)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
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
          blob => {
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

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a PNG or JPEG image.')
      return
    }
    setError(null)
    try {
      const { dataUrl, b64 } = await prepareFile(file)
      setOriginalImage(dataUrl)
      setOriginalBase64(b64)
      setStep('preview')
    } catch {
      setError('Could not read that image file. Please try another image.')
    }
  }, [prepareFile])

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
    canvas.toBlob(blob => {
      if (blob) handleFile(new File([blob], 'capture.png', { type: 'image/png' }))
      else setError('Could not capture a photo. Please upload a file instead.')
    }, 'image/png')
  }, [stopCamera, handleFile])

  const initCanvas = useCallback(() => {
    if (!imageRef.current || !canvasRef.current) return
    const img = imageRef.current
    const canvas = canvasRef.current
    const cw = img.clientWidth
    const ch = img.clientHeight
    canvas.width = cw
    canvas.height = ch
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, cw, ch)
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    if (!nw || !nh) return
    const scale = Math.min(cw / nw, ch / nh)
    imgMapRef.current = {
      scale,
      offX: (cw - nw * scale) / 2,
      offY: (ch - nh * scale) / 2,
    }
    const mask = document.createElement('canvas')
    mask.width = nw
    mask.height = nh
    mask.getContext('2d')!.clearRect(0, 0, nw, nh)
    maskRef.current = mask
    paintedRef.current = false
  }, [])

  useEffect(() => {
    if (step === 'preview') {
      const timer = setTimeout(initCanvas, 200)
      return () => clearTimeout(timer)
    }
  }, [step, initCanvas])

  const getMaskDataUrl = useCallback((): string | null => {
    const mask = maskRef.current
    if (!mask) return null
    const d = mask.getContext('2d')!.getImageData(0, 0, mask.width, mask.height).data
    for (let i = 3; i < d.length; i += 4) {
      if (d[i] > 127) return mask.toDataURL('image/png')
    }
    return null
  }, [])

  // Build a full-coverage mask (all transparent = edit everything) for auto mode
  const getFullImageMask = useCallback((): string | null => {
    if (!originalBase64) return null
    const mask = document.createElement('canvas')
    const img = new Image()
    // We need dimensions; create a reasonable mask based on original
    // Use a small canvas that will be resized by preflight
    mask.width = 512
    mask.height = 512
    const ctx = mask.getContext('2d')!
    ctx.clearRect(0, 0, 512, 512) // fully transparent = edit all
    return mask.toDataURL('image/png')
  }, [originalBase64])

  // Step 1: pre-flight + confirmation. Makes NO API call.
  const handleRestore = useCallback(async () => {
    if (!originalBase64) return
    if (inFlightRef.current) return
    setError(null)

    let mask: string | null
    if (mode === 'auto') {
      mask = getFullImageMask()
      if (!mask) {
        setError('Unable to prepare auto-restore mask.')
        return
      }
      setPendingMask(mask)
      setLastFraction(1) // full image = large area
      setConfirming({ large: true, fraction: 1 })
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
  }, [originalBase64, mode, getMaskDataUrl, getFullImageMask])

  // Step 2: the single paid call (or $0 mock). Runs only from Continue / Try again.
  const doRestore = useCallback(async () => {
    if (!originalBase64 || !pendingMask) return
    if (inFlightRef.current) return
    inFlightRef.current = true
    setConfirming(null)
    setStep('restoring')
    setError(null)
    try {
      const res = await restoreWithMask(originalBase64, pendingMask)
      setResult(res)
      setRestoredImage(res.blob ? await blobToDataUrl(res.blob) : null)
      setSpend(getSessionSpend())
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restoration failed. Please try again.')
      setStep('preview')
    } finally {
      inFlightRef.current = false
    }
  }, [originalBase64, pendingMask])

  const tryAgain = useCallback(() => {
    if (inFlightRef.current) return
    setError(null)
    setLargeAck(false)
    setConfirming({
      large: lastFraction > LARGE_MASK_FRACTION,
      fraction: lastFraction,
    })
  }, [lastFraction])

  const resetSpend = useCallback(() => {
    resetSessionSpend()
    setSpend(getSessionSpend())
  }, [])

  const downloadDebug = useCallback(() => {
    const mask = getMaskDataUrl()
    const files: { url: string; name: string }[] = []
    if (originalImage) files.push({ url: originalImage, name: 'debug-image.png' })
    if (mask) files.push({ url: mask, name: 'debug-mask.png' })
    files.forEach(f => {
      const a = document.createElement('a')
      a.href = f.url
      a.download = f.name
      a.click()
    })
  }, [originalImage, getMaskDataUrl])

  const renderConfirmPanel = () => {
    if (!confirming) return null
    return (
      <div className="about-note" style={{ marginTop: 16 }}>
        <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--ink)' }}>
          {DEV_MOCK_AI
            ? 'This run is free (mock mode — no OpenAI call). Continue?'
            : `This will use ${estimatedEditCostLabel()} of OpenAI credit. Continue?`}
        </p>
        <p className="muted" style={{ margin: '0 0 10px', fontSize: '.86rem' }}>
          Mode: {mode === 'auto' ? 'Auto (AI detects & fixes cracks)' : 'Manual (brush-selected)'} ·
          Painted area: {(confirming.fraction * 100).toFixed(1)}% of the image.
        </p>

        {confirming.large && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ margin: '0 0 8px', fontSize: '.86rem', color: 'var(--danger)' }}>
              Large painted area. Results may look invented and this uses paid credit.
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
    setError(null)
    setConfirming(null)
    setPendingMask(null)
    setLargeAck(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    maskRef.current = null
    paintedRef.current = false
    stopCamera()
  }, [stopCamera])

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')!
      const rect = canvas.getBoundingClientRect()

      let x: number, y: number
      if ('touches' in e) {
        x = e.touches[0].clientX - rect.left
        y = e.touches[0].clientY - rect.top
      } else {
        x = e.clientX - rect.left
        y = e.clientY - rect.top
      }

      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.beginPath()
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
      ctx.fill()

      const mask = maskRef.current
      if (mask) {
        const { scale, offX, offY } = imgMapRef.current
        const ix = (x - offX) / scale
        const iy = (y - offY) / scale
        const mctx = mask.getContext('2d')!
        mctx.globalCompositeOperation = 'source-over'
        mctx.fillStyle = '#ffffff'
        mctx.beginPath()
        mctx.arc(ix, iy, brushSize / 2 / scale, 0, Math.PI * 2)
        mctx.fill()
        paintedRef.current = true
      }
    },
    [brushSize]
  )

  const stepIndex = step === 'upload' ? 0 : step === 'result' ? 2 : 1
  const stepClass = (i: number) => (i < stepIndex ? 'done' : i === stepIndex ? 'active' : '')

  return (
    <div className="container">
      <div className="page-head" style={{ paddingBottom: 10 }}>
        <span className="eyebrow">New feature</span>
        <h1>AI Artifact Reconstruction</h1>
        <p className="lead">
          Upload a photo of a broken artifact, choose whether the AI should find the damage itself
          or follow your brush, and confirm the price estimate before anything is generated.
        </p>
      </div>

      <ol className="stepper">
        <li className={stepClass(0)}>
          <span className="num">{stepIndex > 0 ? '✓' : '1'}</span>Upload broken artifact
        </li>
        <li className={stepClass(1)}>
          <span className="num">{stepIndex > 1 ? '✓' : '2'}</span>AI processing
        </li>
        <li className={stepClass(2)}>
          <span className="num">3</span>Reconstructed result
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
              <h3>{mode === 'auto' ? 'Ready for automatic restoration' : 'Paint over the damage'}</h3>
              <p className="sub">
                {mode === 'auto'
                  ? 'No brushing needed. The AI studies the whole photograph, detects cracks and imperfections, and rebuilds them.'
                  : 'Paint thinly along the cracks, not over the whole object. The white overlay shows exactly what the AI will rebuild.'}
              </p>

              <div className="result-card" style={{ padding: 10 }}>
                <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                  <img
                    ref={imageRef}
                    src={originalImage}
                    alt="Uploaded artifact"
                    style={{ maxHeight: '60vh', width: 'auto', maxWidth: '100%', borderRadius: 8 }}
                    onLoad={initCanvas}
                  />
                  {mode === 'manual' && (
                    <canvas
                      ref={canvasRef}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        cursor: 'crosshair',
                        mixBlendMode: 'screen',
                      }}
                      onMouseDown={() => setIsDrawing(true)}
                      onMouseUp={() => setIsDrawing(false)}
                      onMouseLeave={() => setIsDrawing(false)}
                      onMouseMove={(e) => isDrawing && draw(e)}
                      onTouchStart={() => setIsDrawing(true)}
                      onTouchEnd={() => setIsDrawing(false)}
                      onTouchMove={(e) => {
                        e.preventDefault()
                        draw(e)
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="result-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={handleReset}>
                  Start over
                </button>
              </div>
            </section>
          )}

          {step === 'result' && originalImage && (
            <section className="panel">
              <h3>{result?.failed ? 'Restoration incomplete' : 'Reconstructed artifact'}</h3>
              <p className="sub">
                {result?.engine === 'ai'
                  ? 'Restored with the AI image model.'
                  : result?.engine === 'local'
                    ? 'Restored with the basic local repair.'
                    : 'The AI could not visibly repair this image.'}
              </p>

              <div className="result-grid">
                <div className="result-card">
                  <h3>Your uploaded artifact</h3>
                  <div className="img-box">
                    <img src={originalImage} alt="Original artifact" />
                  </div>
                </div>
                <div className="result-arrow">
                  <svg viewBox="0 0 48 48">
                    <path d="M8 24h30M28 14l10 10-10 10" />
                  </svg>
                </div>
                <div className="result-card">
                  <h3>AI reconstructed artifact</h3>
                  <div className="img-box">
                    {restoredImage ? (
                      <img src={restoredImage} alt="Restored artifact" />
                    ) : (
                      <p className="muted">No visible repair was produced.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="about-note">
                <strong>About this reconstruction.</strong>{' '}
                {mode === 'auto'
                  ? 'The AI analysed the full photograph and rebuilt the areas it identified as damaged.'
                  : 'The AI rebuilt only the areas you painted, matching the surrounding material, texture and lighting.'}{' '}
                Results are estimates for educational purposes and should be checked by an expert
                before being used in research.
                {result?.failed && result.error ? ` (${result.error})` : ''}
                {result?.note ? ` ${result.note}` : ''}
              </div>

              <div className="result-actions">
                <button type="button" className="btn btn-outline" onClick={handleReset}>
                  Try another artifact
                </button>
                {(result?.failed || result?.weak || result?.engine === 'local') && (
                  <button type="button" className="btn btn-outline" onClick={tryAgain}>
                    Try again ({DEV_MOCK_AI ? 'free in mock mode' : 'uses credit again'})
                  </button>
                )}
                {restoredImage && !result?.failed && (
                  <button type="button" className="btn btn-primary" onClick={handleDownload}>
                    <svg viewBox="0 0 24 24">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <path d="M7 10l5 5 5-5" />
                      <path d="M12 15V3" />
                    </svg>
                    Download result
                  </button>
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
                  min={2}
                  max={80}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                />
                <span className="hint">Paint over cracks, chips and missing pieces.</span>
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
                  Reconstruct artifact
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
                    Rebuilding the missing surface
                  </li>
                  <li>
                    <span className="dot" />
                    Checking the result
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
                {spend.estimatedUsd < 0.01 ? spend.estimatedUsd.toFixed(3) : spend.estimatedUsd.toFixed(2)}
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
              {import.meta.env.DEV && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: 8, marginLeft: 8 }}
                  onClick={downloadDebug}
                >
                  Debug PNGs
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

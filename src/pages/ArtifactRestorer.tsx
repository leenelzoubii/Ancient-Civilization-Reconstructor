import { useState, useRef, useCallback, useEffect } from 'react'
import { restoreWithMask, blobToDataUrl } from '../services/restoreService'
import type { RestoreResult } from '../services/restoreService'

type Step = 'upload' | 'preview' | 'restoring' | 'result'

export default function ArtifactRestorer() {
  const [step, setStep] = useState<Step>('upload')
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [originalBase64, setOriginalBase64] = useState<string | null>(null)
  const [restoredImage, setRestoredImage] = useState<string | null>(null)
  const [result, setResult] = useState<RestoreResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [brushSize, setBrushSize] = useState(30)
  const [isDrawing, setIsDrawing] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  // Offscreen mask at exact PNG pixel dimensions (alpha 1.0 strokes) — this
  // is what gets sent to the API. The visible overlay is display-only.
  const maskRef = useRef<HTMLCanvasElement | null>(null)
  const paintedRef = useRef(false)
  // Maps visible-canvas coords → image coords (handles object-contain boxes).
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
    // True PNG at ≤1024px on the long side: correct MIME for the API and a
    // request body far below Vercel's ~4.5MB limit.
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
    // Encode as a TRUE PNG; shrink further if the PNG body would risk the
    // server's 4MB limit (~4.7M base64 chars ≈ 3.5MB raw).
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
    // object-contain letterboxing: map visible-canvas coords → image coords.
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    if (!nw || !nh) return
    const scale = Math.min(cw / nw, ch / nh)
    imgMapRef.current = {
      scale,
      offX: (cw - nw * scale) / 2,
      offY: (ch - nh * scale) / 2,
    }
    // Offscreen mask at EXACT image pixel dimensions; strokes at alpha 1.0.
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
    if (!mask || !paintedRef.current) return null
    // Fast path says painted; confirm pixels actually landed inside the image
    // (strokes in the letterbox margin don't count).
    const d = mask.getContext('2d')!.getImageData(0, 0, mask.width, mask.height).data
    for (let i = 3; i < d.length; i += 4) {
      if (d[i] > 127) return mask.toDataURL('image/png')
    }
    return null
  }, [])

  const handleRestore = useCallback(async () => {
    if (!originalBase64) return
    setStep('restoring')
    setError(null)
    try {
      const mask = getMaskDataUrl()
      if (!mask) {
        setError('Please paint over the damaged areas first.')
        setStep('preview')
        return
      }
      const res = await restoreWithMask(originalBase64, mask)
      setResult(res)
      setRestoredImage(res.blob ? await blobToDataUrl(res.blob) : null)
      setStep('result')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Restoration failed. Please try again.'
      )
      setStep('preview')
    }
  }, [originalBase64, getMaskDataUrl])

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

      // Mirror into the offscreen image-space mask at full opacity (alpha 1.0).
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

  return (
    <div className="min-h-screen bg-app pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 animate-fade-in-up">
          <p className="text-accent text-sm font-medium tracking-widest uppercase mb-3">
            AI-Powered
          </p>
          <h1
            className="text-4xl sm:text-5xl font-black text-ink mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Artifact Restorer
          </h1>
          <p className="text-ink-2 max-w-xl mx-auto">
            Upload a photo of a broken or damaged artifact, paint over the
            damage, and AI will rebuild exactly what you marked.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm animate-fade-in">
            {error}
          </div>
        )}

        {step === 'upload' && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <button
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                className="group p-10 rounded-2xl border-2 border-dashed border-line-2 hover:border-amber-500/50 bg-panel hover:bg-panel-2 transition-all duration-300 cursor-pointer text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <svg
                    className="w-8 h-8 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className="text-ink font-semibold mb-1">Upload Image</p>
                <p className="text-ink-3 text-sm">
                  Drag & drop or click to browse
                </p>
                <p className="text-ink-4 text-xs mt-2">PNG or JPEG</p>
              </button>

              <button
                onClick={startCamera}
                className="group p-10 rounded-2xl border-2 border-dashed border-line-2 hover:border-teal-500/50 bg-panel hover:bg-panel-2 transition-all duration-300 cursor-pointer text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                  <svg
                    className="w-8 h-8 text-cool"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <p className="text-ink font-semibold mb-1">Take Photo</p>
                <p className="text-ink-3 text-sm">Use your device camera</p>
                <p className="text-ink-4 text-xs mt-2">Rear camera recommended</p>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleFileInput}
            />

            {cameraActive && (
              <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
                <video
                  ref={videoRef}
                  className="max-w-full max-h-[70vh] rounded-2xl"
                  autoPlay
                  playsInline
                />
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={capturePhoto}
                    className="px-8 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors cursor-pointer"
                  >
                    Capture
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-8 py-3 bg-panel-2 text-ink font-medium rounded-xl hover:bg-panel-2 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {(step === 'preview' || step === 'restoring') && originalImage && (
          <div className="animate-fade-in-up">
            <div className="flex flex-wrap items-center justify-end gap-4 mb-6">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-ink-2 hover:text-ink transition-colors cursor-pointer"
              >
                Start Over
              </button>
            </div>

            <p className="-mt-2 mb-5 text-sm text-accent animate-fade-in">
              Paint over the cracks and missing areas for the best result.
            </p>

            <div className="mb-4 p-4 rounded-xl bg-panel border border-line">
              <div className="flex items-center gap-4">
                <span className="text-sm text-ink-2">Brush size:</span>
                <input
                  type="range"
                  min="5"
                  max="80"
                  value={brushSize}
                  onChange={e => setBrushSize(Number(e.target.value))}
                  className="flex-1 accent-amber-500"
                />
                <span className="text-sm text-accent w-8 text-right">
                  {brushSize}
                </span>
              </div>
              <p className="text-xs text-ink-3 mt-2">
                Paint over the damaged areas (cracks, chips, missing pieces). White
                overlay shows where AI will restore.
              </p>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-line bg-panel mb-6">
              <img
                ref={imageRef}
                src={originalImage}
                alt="Uploaded artifact"
                className="w-full max-h-[60vh] object-contain"
                onLoad={initCanvas}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full cursor-crosshair"
                style={{ mixBlendMode: 'screen' }}
                onMouseDown={() => setIsDrawing(true)}
                onMouseUp={() => setIsDrawing(false)}
                onMouseLeave={() => setIsDrawing(false)}
                onMouseMove={e => isDrawing && draw(e)}
                onTouchStart={() => setIsDrawing(true)}
                onTouchEnd={() => setIsDrawing(false)}
                onTouchMove={e => {
                  e.preventDefault()
                  draw(e)
                }}
              />
            </div>

            <button
              onClick={handleRestore}
              disabled={step === 'restoring'}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold rounded-xl text-lg hover:from-amber-400 hover:to-orange-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-3"
            >
              {step === 'restoring' ? (
                <>
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Restoring...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Restore Artifact
                </>
              )}
            </button>

            {step === 'restoring' && (
              <div className="mt-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-accent mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm text-ink-2">
                    <p className="font-medium text-accent mb-1">
                      AI is restoring your artifact...
                    </p>
                    <p>
                      The model rebuilds the areas you painted, matching the
                      surrounding material, texture and lighting. This usually
                      takes 5-20 seconds. Please don't close this page.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'result' && originalImage && (restoredImage || result?.failed) && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-ink">
                  {result?.failed ? 'Restoration Incomplete' : 'Restoration Complete'}
                </h2>
                {result && !result.failed && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      result.engine === 'ai'
                        ? 'bg-amber-500/10 text-accent border-amber-500/30'
                        : 'bg-teal-500/10 text-cool border-teal-500/30'
                    }`}
                  >
                    {result.engine === 'ai' ? 'AI Restored' : 'Local Repair'}
                  </span>
                )}
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-ink-2 hover:text-ink transition-colors cursor-pointer"
              >
                Restore Another
              </button>
            </div>
            {result?.failed && (
              <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm leading-relaxed animate-fade-in">
                <p className="font-semibold mb-1">
                  We couldn&apos;t visibly repair this image.
                </p>
                <p>
                  Paint over the damage more thoroughly and try again — wider
                  strokes over each crack or missing piece give the AI more to
                  rebuild.
                </p>
                {result.error && (
                  <p className="mt-2 text-xs opacity-80 break-words">
                    ({result.error})
                  </p>
                )}
              </div>
            )}
            {!result?.failed && result?.engine === 'local' && result?.fallbackReason && (
              <div className="mb-6 p-3 rounded-xl bg-accent/10 border border-accent/30 text-accent text-xs leading-relaxed animate-fade-in">
                {result.fallbackReason}
              </div>
            )}

            <div
              className={`grid grid-cols-1 ${restoredImage ? 'md:grid-cols-2' : ''} gap-6 mb-8`}
            >
              <div className="rounded-2xl overflow-hidden border border-line bg-panel">
                <div className="p-3 border-b border-line-soft text-xs text-ink-3 font-medium">
                  Original (Damaged)
                </div>
                <img
                  src={originalImage}
                  alt="Original artifact"
                  className="w-full max-h-[400px] object-contain"
                />
              </div>
              {restoredImage && (
                <div className="rounded-2xl overflow-hidden border border-amber-500/20 bg-panel">
                  <div className="p-3 border-b border-amber-500/10 text-xs text-accent font-medium">
                    Restored
                  </div>
                  <img
                    src={restoredImage}
                    alt="Restored artifact"
                    className="w-full max-h-[400px] object-contain"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              {!result?.failed && (
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold rounded-xl hover:from-amber-400 hover:to-orange-500 transition-all duration-300 cursor-pointer flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Restored Image
                </button>
              )}
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-panel-2 text-ink font-medium rounded-xl border border-line hover:bg-panel-2 transition-all cursor-pointer"
              >
                Restore Another Artifact
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-line-soft py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-ink-4 text-sm">
          <p>ACR — Ancient Civilization Reconstructor &copy; 2026. Educational & Research Project.</p>
        </div>
      </footer>
    </div>
  )
}

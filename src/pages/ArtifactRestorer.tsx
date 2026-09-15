import { useState, useRef, useCallback, useEffect } from 'react'
import {
  restoreAutomatic,
  restoreWithMask,
  fileToBase64,
  blobToDataUrl,
} from '../services/huggingface'

type Mode = 'auto' | 'manual'
type Step = 'upload' | 'preview' | 'restoring' | 'result'

export default function ArtifactRestorer() {
  const [step, setStep] = useState<Step>('upload')
  const [mode, setMode] = useState<Mode>('auto')
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [originalBase64, setOriginalBase64] = useState<string | null>(null)
  const [restoredImage, setRestoredImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [brushSize, setBrushSize] = useState(30)
  const [isDrawing, setIsDrawing] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

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

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a PNG or JPEG image.')
      return
    }
    setError(null)
    const base64 = await fileToBase64(file)
    const dataUrl = `data:${file.type};base64,${base64}`
    setOriginalImage(dataUrl)
    setOriginalBase64(base64)
    setStep('preview')
  }, [])

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
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    const base64 = dataUrl.split(',')[1]
    setOriginalImage(dataUrl)
    setOriginalBase64(base64)
    stopCamera()
    setStep('preview')
  }, [stopCamera])

  const initCanvas = useCallback(() => {
    if (!imageRef.current || !canvasRef.current) return
    const img = imageRef.current
    const canvas = canvasRef.current
    canvas.width = img.clientWidth
    canvas.height = img.clientHeight
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  useEffect(() => {
    if (step === 'preview' && mode === 'manual') {
      const timer = setTimeout(initCanvas, 200)
      return () => clearTimeout(timer)
    }
  }, [step, mode, initCanvas])

  const getMaskBase64 = useCallback((): string => {
    if (mode === 'auto') return ''
    const canvas = canvasRef.current
    if (!canvas) return ''
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = 512
    tempCanvas.height = 512
    const ctx = tempCanvas.getContext('2d')!
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, 512, 512)
    ctx.drawImage(canvas, 0, 0, 512, 512)
    return tempCanvas.toDataURL('image/png').split(',')[1]
  }, [mode])

  const handleRestore = useCallback(async () => {
    if (!originalBase64) return
    setStep('restoring')
    setError(null)
    try {
      let blob: Blob
      if (mode === 'auto') {
        blob = await restoreAutomatic(originalBase64)
      } else {
        const mask = getMaskBase64()
        if (!mask) {
          setError('Please paint over the damaged areas first.')
          setStep('preview')
          return
        }
        blob = await restoreWithMask(originalBase64, mask)
      }
      const dataUrl = await blobToDataUrl(blob)
      setRestoredImage(dataUrl)
      setStep('result')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Restoration failed. Please try again.'
      )
      setStep('preview')
    }
  }, [originalBase64, mode, getMaskBase64])

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
    setError(null)
    stopCamera()
  }, [stopCamera])

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || mode !== 'manual') return
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
    },
    [mode, brushSize]
  )

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 animate-fade-in-up">
          <p className="text-amber-400 text-sm font-medium tracking-widest uppercase mb-3">
            AI-Powered
          </p>
          <h1
            className="text-4xl sm:text-5xl font-black text-white mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Artifact Restorer
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Upload a photo of a broken or damaged artifact and AI will generate what
            it looked like in its original, undamaged state.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-fade-in">
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
                className="group p-10 rounded-2xl border-2 border-dashed border-white/20 hover:border-amber-500/50 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 cursor-pointer text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <svg
                    className="w-8 h-8 text-amber-400"
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
                <p className="text-white font-semibold mb-1">Upload Image</p>
                <p className="text-gray-500 text-sm">
                  Drag & drop or click to browse
                </p>
                <p className="text-gray-600 text-xs mt-2">PNG or JPEG</p>
              </button>

              <button
                onClick={startCamera}
                className="group p-10 rounded-2xl border-2 border-dashed border-white/20 hover:border-teal-500/50 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 cursor-pointer text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                  <svg
                    className="w-8 h-8 text-teal-400"
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
                <p className="text-white font-semibold mb-1">Take Photo</p>
                <p className="text-gray-500 text-sm">Use your device camera</p>
                <p className="text-gray-600 text-xs mt-2">Rear camera recommended</p>
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
                    className="px-8 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
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
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">Mode:</span>
                <button
                  onClick={() => setMode('auto')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    mode === 'auto'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  Auto Restore
                </button>
                <button
                  onClick={() => setMode('manual')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    mode === 'manual'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  Manual Mask
                </button>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Start Over
              </button>
            </div>

            {mode === 'manual' && (
              <div className="mb-4 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">Brush size:</span>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    value={brushSize}
                    onChange={e => setBrushSize(Number(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="text-sm text-amber-400 w-8 text-right">
                    {brushSize}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Paint over the damaged areas (cracks, chips, missing pieces). White
                  overlay shows where AI will restore.
                </p>
              </div>
            )}

            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] mb-6">
              <img
                ref={imageRef}
                src={originalImage}
                alt="Uploaded artifact"
                className="w-full max-h-[60vh] object-contain"
                onLoad={initCanvas}
              />
              {mode === 'manual' && (
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
              )}
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
                  Restoring... This may take 10-30 seconds
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
                    className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0"
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
                  <div className="text-sm text-gray-400">
                    <p className="font-medium text-amber-400 mb-1">
                      AI is working its magic...
                    </p>
                    <p>
                      The model is analyzing your image and generating the restored
                      version. This usually takes 10-30 seconds on the free tier. Please
                      don't close this page.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'result' && originalImage && restoredImage && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                Restoration Complete
              </h2>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Restore Another
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]">
                <div className="p-3 border-b border-white/5 text-xs text-gray-500 font-medium">
                  Original (Damaged)
                </div>
                <img
                  src={originalImage}
                  alt="Original artifact"
                  className="w-full max-h-[400px] object-contain"
                />
              </div>
              <div className="rounded-2xl overflow-hidden border border-amber-500/20 bg-white/[0.03]">
                <div className="p-3 border-b border-amber-500/10 text-xs text-amber-400 font-medium">
                  Restored
                </div>
                <img
                  src={restoredImage}
                  alt="Restored artifact"
                  className="w-full max-h-[400px] object-contain"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download Restored Image
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-white/5 text-white font-medium rounded-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
              >
                Restore Another Artifact
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-white/5 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>Ancient Civilization Reconstructor &copy; 2026. Educational & Research Project.</p>
        </div>
      </footer>
    </div>
  )
}

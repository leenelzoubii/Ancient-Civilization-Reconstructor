import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

/**
 * WebGLViewer — mounts the supervisor's own WebGL engine (public/legacy-3d)
 * into a host element that React owns.
 *
 * The engine attaches its canvas, pointer handlers and resize observer to the
 * host, so the host must be the `.viewer` element itself. Everything around it
 * (hint, markers, toolbar, title) stays ordinary React markup.
 */

export type ViewerApi = { viewer: any; scene: any }

let scriptsPromise: Promise<void> | null = null

function loadScripts(): Promise<void> {
  if (scriptsPromise) return scriptsPromise
  const sources = ['/legacy-3d/engine3d.js', '/legacy-3d/scenes.js', '/legacy-3d/vr.js']
  scriptsPromise = Promise.all(
    sources.map(
      (src) =>
        new Promise<void>((resolve, reject) => {
          if (document.querySelector(`script[data-acr-src="${src}"]`)) return resolve()
          const el = document.createElement('script')
          el.src = src
          el.async = false // keep execution order: engine → scenes → vr
          el.dataset.acrSrc = src
          el.onload = () => resolve()
          el.onerror = () => reject(new Error(`Could not load ${src}`))
          document.head.appendChild(el)
        }),
    ),
  ).then(() => undefined)
  return scriptsPromise
}

export default function WebGLViewer({
  sceneId,
  hostRef,
  onReady,
  onFail,
}: {
  sceneId: string
  hostRef: RefObject<HTMLDivElement | null>
  onReady?: (api: ViewerApi) => void
  onFail?: () => void
}) {
  const [failed, setFailed] = useState(false)
  const readyRef = useRef(onReady)
  const failRef = useRef(onFail)
  readyRef.current = onReady
  failRef.current = onFail

  useEffect(() => {
    let disposed = false
    let viewer: any = null

    const fail = () => {
      if (disposed) return
      setFailed(true)
      failRef.current?.()
    }

    loadScripts()
      .then(() => {
        if (disposed) return
        const host = hostRef.current
        if (!host) return
        const Engine3D = (window as any).Engine3D
        const scenes = (window as any).CIV_SCENES
        const scene = scenes?.[sceneId]
        if (!Engine3D || !scene) return fail()
        try {
          viewer = new Engine3D.Viewer(host, scene)
          readyRef.current?.({ viewer, scene })
        } catch {
          fail()
        }
      })
      .catch(fail)

    return () => {
      disposed = true
      try {
        viewer?.dispose()
      } catch {
        /* already gone */
      }
    }
  }, [sceneId, hostRef])

  if (!failed) return null

  return (
    <div className="viewer-fallback">
      <div className="box">
        <h3>3D view unavailable</h3>
        <p className="muted">
          Your browser or device doesn&apos;t support WebGL, so the custom reconstruction
          can&apos;t be shown. You can still read the full guide.
        </p>
      </div>
    </div>
  )
}

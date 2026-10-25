import { useEffect, useRef, useState } from 'react';

/**
 * WebGLViewer — renders the supervisor's custom WebGL 3D engine inside React.
 *
 * Loads public/legacy-3d/{engine3d,scenes,vr}.js (supervisor's vanilla code),
 * then creates an Engine3D.Viewer over a canvas ref. Supports orbit controls,
 * VR/walk-in modes via VRMode, and per-landmark navigation.
 *
 * Usage:
 *   <WebGLViewer sceneId="egypt" accent="#b8862b" onLandmarkChange={i => ...} />
 */
export default function WebGLViewer({
  sceneId,
  accent,
  onLandmarkChange,
}: {
  sceneId: string;
  accent: string;
  onLandmarkChange?: (index: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const sceneDefRef = useRef<any>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Load supervisor's WebGL scripts in order: engine → scenes → vr
    const scripts = [
      '/legacy-3d/engine3d.js',
      '/legacy-3d/scenes.js',
      '/legacy-3d/vr.js',
    ];

    let loaded = 0;

    const onLoad = () => {
      loaded++;
      if (loaded === scripts.length) {
        try {
          initViewer();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'WebGL init failed');
        }
      }
    };
    const onErr = () => {
      setError('Failed to load 3D engine scripts');
    };

    scripts.forEach((src) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = onLoad;
      s.onerror = onErr;
      document.head.appendChild(s);
    });

    let currentViewer: any = null;

    function initViewer() {
      const Engine3D = (window as any).Engine3D;
      const CIV_SCENES = (window as any).CIV_SCENES;
      const VRMode = (window as any).VRMode;

      if (!Engine3D || !CIV_SCENES || !VRMode) {
        setError('3D engine not available');
        return;
      }

      const def = CIV_SCENES[sceneId as keyof typeof CIV_SCENES];
      if (!def) {
        setError(`No scene for ${sceneId}`);
        return;
      }
      sceneDefRef.current = def;

      // Clear container and create canvas
      container!.innerHTML = '';
      const canvas = document.createElement('canvas');
      canvas.className = 'viewer-canvas';
      container!.appendChild(canvas);

      const v = new Engine3D.Viewer(container, def);
      setViewer(v);
      currentViewer = v;

      // Expose VR mode on the viewer for external control
      (v as any).startVR = async (mode: 'xr' | 'stereo' | 'mono') => {
        try {
          const session = await VRMode.start(v, def, {
            mode,
            accent,
            onStop: (i: number) => { onLandmarkChange?.(i); },
            onExit: (i: number) => { onLandmarkChange?.(i); },
          });
          return session;
        } catch (e) {
          setError(e instanceof Error ? e.message : 'VR start failed');
        }
      };
      (v as any).stopVR = () => {
        if ((v as any).immersive) (v as any).immersive.finish();
      };
    }

    return () => {
      if (currentViewer) currentViewer.dispose();
      setViewer(null);
      currentViewer = null;
      sceneDefRef.current = null;
    };
  }, [sceneId, accent, onLandmarkChange]);

  if (error) {
    return (
      <div className="viewer-fallback">
        <div className="box">
          <h3 className="text-ink font-bold mb-2">3D view unavailable</h3>
          <p className="muted text-ink-2 text-sm">
            Your browser or device doesn't support WebGL, so the custom 3D
            reconstruction can't be shown.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="viewer-wrap">
      {viewer ? (
        <>
          <div className="viewer-hint" id="hint">
            {matchMedia('(pointer: coarse)').matches ? 'Drag to rotate · Pinch to zoom' : 'Drag to rotate · Scroll to zoom · Shift + drag to pan'}
          </div>
          <div className="marker-layer" id="markers" />
          <div className="viewer-ui">
            <button
              className="icon-btn"
              title="Enter VR / walk-in view"
              aria-label="Enter VR or walk-in view"
              onClick={() => (viewer as any).startVR?.('mono')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4l-2-3h-2l-2 3H5a2 2 0 0 1-2-2z" /><circle cx="8" cy="12" r="1.6" /><circle cx="16" cy="12" r="1.6" />
              </svg>
            </button>
            <button className="icon-btn" title="Zoom in" aria-label="Zoom in" onClick={() => viewer.orbit.zoom(0.8)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            </button>
            <button className="icon-btn" title="Zoom out" aria-label="Zoom out" onClick={() => viewer.orbit.zoom(1.25)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
            </button>
            <button className="icon-btn" title="Reset view" aria-label="Reset view" onClick={() => {
              const def = sceneDefRef.current;
              if (def) viewer.orbit.flyTo(def.camera);
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
            </button>
            <button className="icon-btn" title="Auto-rotate" aria-label="Auto-rotate" aria-pressed={viewer.orbit.autoRotate || false} onClick={() => { viewer.orbit.autoRotate = !viewer.orbit.autoRotate; }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.2-8.6" /><path d="M21 3v6h-6" /></svg>
            </button>
            <button className="icon-btn" title="Save screenshot" aria-label="Save screenshot" onClick={() => {
              const url = viewer.snapshot();
              const a = document.createElement('a');
              a.href = url;
              a.download = `${sceneId}-reconstruction.png`;
              document.body.appendChild(a);
              a.click();
              a.remove();
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
            </button>
            <button className="icon-btn" title="Full screen" aria-label="Full screen" onClick={() => {
              const el = containerRef.current;
              if (document.fullscreenElement) document.exitFullscreen();
              else if (el?.requestFullscreen) el.requestFullscreen().catch(() => {});
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

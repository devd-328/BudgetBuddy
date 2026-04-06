import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'

function ReloadPrompt() {
  const rs = useRegisterSW({
    onRegistered(r) {
      console.log('PWA Registered')
    },
    onRegisterError(error) {
      console.warn('PWA registration error', error)
    },
  })

  // Super defensive initialization to prevent React tree crashes
  let offlineReady = false
  let setOfflineReady = (val) => {}
  let needUpdate = false
  let setNeedUpdate = (val) => {}
  let updateServiceWorker = (force) => {}

  if (rs) {
    // Check if properties are arrays (state tuples like in standard Vite PWA)
    if (Array.isArray(rs.offlineReady)) {
      [offlineReady, setOfflineReady] = rs.offlineReady
    } else {
      offlineReady = !!rs.offlineReady
      if (typeof rs.setOfflineReady === 'function') setOfflineReady = rs.setOfflineReady
    }

    if (Array.isArray(rs.needUpdate)) {
      [needUpdate, setNeedUpdate] = rs.needUpdate
    } else {
      needUpdate = !!rs.needUpdate
      if (typeof rs.setNeedUpdate === 'function') setNeedUpdate = rs.setNeedUpdate
    }

    if (typeof rs.updateServiceWorker === 'function') {
      updateServiceWorker = rs.updateServiceWorker
    }
  }

  const close = () => {
    setOfflineReady(false)
    setNeedUpdate(false)
  }

  if (!offlineReady && !needUpdate) return null

  return (
    <div className="pwa-toast-container">
      <div className="pwa-toast">
        <div className="pwa-toast-content">
          <div className="pwa-toast-icon">
            <RefreshCw size={20} className={needUpdate ? "animate-pwa-spin" : ""} />
          </div>
          <div className="pwa-toast-message">
            {offlineReady ? (
              <span>App ready for offline use</span>
            ) : (
              <span>New version available! Refresh to update.</span>
            )}
          </div>
        </div>
        <div className="pwa-toast-actions">
          {needUpdate && (
            <button className="pwa-btn-update" onClick={() => updateServiceWorker(true)}>
              Update
            </button>
          )}
          <button className="pwa-btn-close" onClick={close} aria-label="Close message">
            <X size={18} />
          </button>
        </div>
      </div>

      <style jsx="true">{`
        .pwa-toast-container {
          position: fixed;
          right: 0;
          bottom: 0;
          margin: 1.5rem;
          z-index: 10000;
          pointer-events: none;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .pwa-toast {
          background: rgba(10, 10, 20, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1.25rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          pointer-events: auto;
          animation: pwaFadeIn 0.5s ease-out;
          color: white;
          min-width: 320px;
        }
        .pwa-toast-content { display: flex; align-items: center; gap: 0.75rem; flex: 1; }
        .pwa-toast-icon { color: #5DCAA5; }
        .pwa-toast-message { font-size: 0.9rem; font-weight: 600; letter-spacing: -0.01em; }
        .pwa-toast-actions { display: flex; align-items: center; gap: 0.5rem; }
        .pwa-btn-update {
          background: #5DCAA5;
          color: #0A0A0F;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pwa-btn-update:hover { background: #4cb894; transform: translateY(-1px); }
        .pwa-btn-close {
          background: transparent;
          color: rgba(255, 255, 255, 0.5);
          border: none;
          padding: 0.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pwa-btn-close:hover { background: rgba(255, 255, 255, 0.05); color: white; }
        @keyframes pwaFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-pwa-spin { animation: pwaSpin 4s linear infinite; }
        @keyframes pwaSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 480px) {
          .pwa-toast-container { margin: 1rem; left: 0; right: 0; }
          .pwa-toast { min-width: unset; width: 100%; border-radius: 1rem; padding: 0.75rem 1rem; }
        }
      `}</style>
    </div>
  )
}

export default ReloadPrompt

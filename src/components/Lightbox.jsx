import { useEffect, useRef } from 'react'

// Visualizador em tela cheia. src = ImageBitmap, HTMLImageElement ou canvas.
export default function Lightbox({ src, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!src) return
    const w = src.width || src.naturalWidth
    const h = src.height || src.naturalHeight
    const cv = ref.current
    cv.width = w
    cv.height = h
    cv.getContext('2d').drawImage(src, 0, 0, w, h)
  }, [src])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!src) return null

  return (
    <div className="lbx" onClick={onClose} role="dialog" aria-modal="true">
      <button className="lbx-x" onClick={onClose} aria-label="Fechar">×</button>
      <canvas ref={ref} className="lbx-img" onClick={(e) => e.stopPropagation()} />
    </div>
  )
}

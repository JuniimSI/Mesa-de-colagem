import { useEffect, useRef } from 'react'

function Thumb({ foto }) {
  const ref = useRef(null)
  useEffect(() => {
    const s = 92
    const ctx = ref.current.getContext('2d')
    const { bmp, w, h } = foto
    const side = Math.min(w, h)
    ctx.drawImage(bmp, (w - side) / 2, (h - side) / 2, side, side, 0, 0, s, s)
  }, [foto])
  return <canvas ref={ref} width={92} height={92} className="thumb" />
}

export default function Thumbs({ fotos, onRemove, onView, analisando = 0, max = 12 }) {
  const mostrar = fotos.slice(0, max)
  const skeletons = Math.min(analisando, max)
  const sobra = fotos.length - mostrar.length + Math.max(0, analisando - skeletons)
  return (
    <div className="tiras">
      {mostrar.map((f, i) => (
        <div className="thumb-wrap" key={i}>
          <button
            type="button"
            className="thumb-btn"
            onClick={() => onView?.(f.bmp)}
            aria-label="Ver foto"
          >
            <Thumb foto={f} />
          </button>
          {onRemove && (
            <button
              className="thumb-x"
              onClick={(e) => { e.stopPropagation(); onRemove(i) }}
              aria-label="Remover foto"
            >×</button>
          )}
        </div>
      ))}
      {Array.from({ length: skeletons }).map((_, k) => (
        <div className="thumb-wrap" key={'sk' + k}>
          <div className="thumb sk" aria-hidden="true" />
        </div>
      ))}
      {sobra > 0 && <div className="thumb-mais">+{sobra}</div>}
    </div>
  )
}

import { useEffect, useRef } from 'react'

export default function Carta({ index, colagem, prevW, prevH, busy, onView, onRelayout, onBaixar }) {
  const ref = useRef(null)

  // redesenha o preview a partir do canvas full-res sempre que ele muda
  useEffect(() => {
    const ctx = ref.current.getContext('2d')
    ctx.clearRect(0, 0, prevW, prevH)
    ctx.drawImage(colagem.cv, 0, 0, prevW, prevH)
  }, [colagem.cv, colagem.varia, prevW, prevH])

  return (
    <div className="carta">
      <div className="envolto">
        <canvas
          ref={ref}
          width={prevW}
          height={prevH}
          className="carta-cv"
          onClick={() => onView?.(colagem.cv)}
          title="Ampliar"
        />
        {busy && <div className="spin-over"><div className="spin" /></div>}
      </div>
      <div className="carta-rodape">
        <span className="carta-nome">
          <b>Colagem {index + 1}</b>
          {colagem.grupo.length} fotos · {colagem.lay}
        </span>
        <button className="btn btn-s btn-mini" onClick={onRelayout} title="Trocar layout" aria-label="Trocar layout">↻</button>
        <button className="btn btn-p btn-mini" onClick={onBaixar} title="Baixar" aria-label="Baixar">⬇</button>
      </div>
    </div>
  )
}

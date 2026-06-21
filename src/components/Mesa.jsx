import Carta from './Carta.jsx'

export default function Mesa({ colagens, pending, prevW, prevH, busy, onView, onRelayout, onBaixar }) {
  const skeletons = Math.max(0, pending - colagens.length)
  const vazia = colagens.length === 0 && pending === 0

  if (vazia) {
    return (
      <div className="mesa-vazia">
        <div className="v-ico">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
            <rect x="3" y="3" width="8" height="11" rx="1.5" />
            <rect x="13" y="3" width="8" height="6" rx="1.5" />
            <rect x="13" y="11" width="8" height="6" rx="1.5" />
            <rect x="3" y="16" width="18" height="5" rx="1.5" />
          </svg>
        </div>
        <b>Suas colagens aparecem aqui</b>
        <span>Escolha as fotos ao lado e toque em “Montar colagens”. Tudo é processado no seu aparelho.</span>
      </div>
    )
  }

  return (
    <section id="mesa">
      {colagens.map((c, i) => (
        <Carta
          key={i}
          index={i}
          colagem={c}
          prevW={prevW}
          prevH={prevH}
          busy={busy.has(i)}
          onView={onView}
          onRelayout={() => onRelayout(i)}
          onBaixar={() => onBaixar(i)}
        />
      ))}
      {Array.from({ length: skeletons }).map((_, k) => (
        <div className="carta" key={'sk' + k}>
          <div className="sk" style={{ height: prevH }} />
          <div className="sk sk-acoes" />
        </div>
      ))}
    </section>
  )
}

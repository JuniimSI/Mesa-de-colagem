export default function Header() {
  return (
    <header className="hero">
      <span className="hero-tag">FJU · Quixeramobim</span>
      <h1>
        MESA DE <em>COLAGEM</em>
      </h1>
      <p className="hero-sub">
        Agrupa, monta e assina suas fotos automaticamente — rápido, bonito e do seu jeito.
      </p>
      <div className="hero-chips">
        <span className="hero-chip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2 4 5v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V5l-8-3Z" />
          </svg>
          100% no aparelho
        </span>
        <span className="hero-chip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12.5 10 17l9-10" />
          </svg>
          Funciona offline
        </span>
        <span className="hero-chip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
          </svg>
          Sem upload, instantâneo
        </span>
      </div>
    </header>
  )
}

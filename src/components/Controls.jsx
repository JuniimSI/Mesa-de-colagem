import { useRef, useState } from 'react'
import Thumbs from './Thumbs.jsx'

const RATIOS = [
  { v: '4:5', t: '4:5', d: 'Feed' },
  { v: '1:1', t: '1:1', d: 'Quadrado' },
  { v: '9:16', t: '9:16', d: 'Stories' },
  { v: '3:4', t: '3:4', d: 'Retrato' },
]

const ESTILOS = [
  { v: 'misto', t: 'Misto', d: 'Clássico + dinâmico' },
  { v: 'classico', t: 'Clássico', d: 'Grades' },
  { v: 'dinamico', t: 'Dinâmico', d: 'Assimétrico' },
]

export default function Controls({
  fotos, onFiles, onRemove, onClear, onAssin, assinNome, temAssin, assinAlpha, setAssinAlpha,
  prop, setProp, estilo, setEstilo, melhoria, setMelhoria,
  podeGerar, gerando, onGerar, status,
}) {
  const inpRef = useRef(null)
  const assinRef = useRef(null)
  const [over, setOver] = useState(false)
  const n = fotos.length

  return (
    <section className="painel">
      <div className="painel-cab">
        <h2>Suas fotos</h2>
        {n > 0 && <button className="link-limpar" onClick={onClear}>Limpar tudo</button>}
      </div>

      <div
        className={'drop' + (over ? ' over' : '')}
        role="button"
        tabIndex={0}
        onClick={() => inpRef.current.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inpRef.current.click() }}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); onFiles(e.dataTransfer.files) }}
      >
        <div className="drop-ico">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4m0 0L7 9m5-5 5 5" />
            <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
        </div>
        {n > 0 ? (
          <>
            <b><span className="drop-count">{n} fotos</span> · adicionar mais</b>
            <small>toque ou arraste novas fotos — somam às atuais</small>
          </>
        ) : (
          <>
            <b>Toque para escolher as fotos</b>
            <small>ou arraste aqui · 4 a 40 fotos · JPG, PNG ou WEBP</small>
          </>
        )}
        <input
          ref={inpRef} type="file" accept="image/*" multiple hidden
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {n > 0 && <Thumbs fotos={fotos} onRemove={onRemove} />}

      <div className="campo">
        <span className="rotulo">Proporção de saída</span>
        <div className="seg seg-ratio">
          {RATIOS.map((r) => {
            const [pw, ph] = r.v.split(':').map(Number)
            return (
              <button
                key={r.v}
                className={'seg-btn' + (prop === r.v ? ' ativo' : '')}
                onClick={() => setProp(r.v)}
                aria-pressed={prop === r.v}
              >
                <span className="seg-topo">
                  <span className="ratio-ico" style={{ aspectRatio: `${pw}/${ph}` }} />
                  <span className="seg-t">{r.t}</span>
                </span>
                <span className="seg-d">{r.d}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="campo">
        <span className="rotulo">Estilo das colagens</span>
        <div className="seg seg-estilo">
          {ESTILOS.map((s) => (
            <button
              key={s.v}
              className={'seg-btn' + (estilo === s.v ? ' ativo' : '')}
              onClick={() => setEstilo(s.v)}
              aria-pressed={estilo === s.v}
            >
              <span className="seg-t">{s.t}</span>
              <span className="seg-d">{s.d}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="campo">
        <span className="rotulo">Acabamento</span>
        <label className="switch">
          <div className="switch-info">
            <b>Clarity + textura</b>
            <span>Vibração equilibrada e grão fino</span>
          </div>
          <input
            type="checkbox"
            checked={melhoria}
            onChange={(e) => setMelhoria(e.target.checked)}
          />
          <span className="switch-track"><span className="switch-knob" /></span>
        </label>
      </div>

      <div className="campo">
        <span className="rotulo">Assinatura</span>
        <button className="btn btn-s btn-bloco" onClick={() => assinRef.current.click()}>
          {assinNome.startsWith('nenhuma') ? '＋ Escolher PNG' : '↺ Trocar assinatura'}
        </button>
        <input
          ref={assinRef} type="file" accept="image/png" hidden
          onChange={(e) => onAssin(e.target.files[0])}
        />
        <span style={{ display: 'block', fontSize: 12.5, color: 'var(--cinza-2)', marginTop: 8 }}>
          {assinNome}
        </span>
        {temAssin && (
          <div className="range-row">
            <label htmlFor="op">Opacidade</label>
            <input
              id="op" type="range" min="0" max="100" step="1"
              value={Math.round(assinAlpha * 100)}
              onChange={(e) => setAssinAlpha(Number(e.target.value) / 100)}
            />
            <span className="range-val">{Math.round(assinAlpha * 100)}%</span>
          </div>
        )}
      </div>

      <button id="gerar" className="btn btn-p btn-bloco" disabled={!podeGerar || gerando} onClick={onGerar}>
        {gerando ? (<><span className="btn-spin" /> Montando…</>) : 'Montar colagens'}
      </button>
      <p className="contagem">{status}</p>
    </section>
  )
}

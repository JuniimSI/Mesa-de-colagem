import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { renderColagem, fonteRecorte } from '../lib/render.js'

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const PADRAO = { zoom: 1, ox: 0.5, oy: 0.3 }

export default function Carta({ index, colagem, prevW, prevH, busy, previewOpts, dropTarget, onDropTarget, onView, onRelayout, onEdit, onSwap, onBaixar }) {
  const ref = useRef(null)
  const ghostRef = useRef(null)
  const [sel, setSel] = useState(null)          // slot selecionado (zoom)
  const [ghost, setGhost] = useState(null)      // foto suspensa seguindo o cursor {foto,si,x,y}
  const [arrastando, setArrastando] = useState(false)
  const [slots, setSlots] = useState(colagem.slots)
  const slotsRef = useRef(colagem.slots)        // espelho síncrono p/ commit
  const dragRef = useRef(null)
  const lastDrop = useRef(null)
  const ptr = useRef({ x: 0, y: 0 })            // posição atual do cursor/dedo
  const rafScroll = useRef(0)

  // reporta o alvo de troca pro App (estado global) só quando muda
  const reportDrop = (t) => {
    const c = lastDrop.current
    if ((!t && !c) || (t && c && t.ci === c.ci && t.si === c.si)) return
    lastDrop.current = t
    onDropTarget(t)
  }

  // re-sincroniza quando a colagem muda por fora (relayout, troca, reembaralhar)
  useEffect(() => {
    slotsRef.current = colagem.slots
    setSlots(colagem.slots)
  }, [colagem.slots])

  // preview sempre renderizado a partir dos slots (sempre editável)
  useEffect(() => {
    const ctx = ref.current.getContext('2d')
    const out = renderColagem(slots, colagem.layoutObj, { W: prevW, H: prevH, ...previewOpts, rapido: arrastando })
    ctx.clearRect(0, 0, prevW, prevH)
    ctx.drawImage(out, 0, 0)
  }, [slots, arrastando, colagem.layoutObj, prevW, prevH, previewOpts])

  // desenha a foto suspensa (com zoom) quando o arrasto entra em modo troca
  useEffect(() => {
    if (!ghost?.foto || !ghostRef.current) return
    const cv = ghostRef.current
    const { sx, sy, sw, sh } = fonteRecorte(ghost.foto, cv.width / cv.height, 1.25, 0.5, 0.4)
    const ctx = cv.getContext('2d')
    ctx.clearRect(0, 0, cv.width, cv.height)
    ctx.drawImage(ghost.foto.bmp, sx, sy, sw, sh, 0, 0, cv.width, cv.height)
  }, [ghost?.foto])

  // limpa listeners/raf se o card desmontar no meio de um arrasto
  useEffect(() => () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    if (rafScroll.current) cancelAnimationFrame(rafScroll.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const aplica = (ns) => { slotsRef.current = ns; setSlots(ns) }

  function panTo(dr, dx, dy) {
    const c = colagem.layoutObj.c[dr.si]
    const cellW = c[2] * prevW, cellH = c[3] * prevH
    const s = slotsRef.current[dr.si]
    if (!s) return
    const { slackX, slackY, sw, sh } = fonteRecorte(s.foto, cellW / cellH, s.zoom, s.ox, s.oy)
    // arrastar a foto p/ a direita revela o lado esquerdo → ox diminui
    const dox = slackX > 0 ? -(dx * (sw / cellW)) / slackX : 0
    const doy = slackY > 0 ? -(dy * (sh / cellH)) / slackY : 0
    aplica(slotsRef.current.map((p, k) => (k === dr.si ? { ...p, ox: clamp01(dr.ox0 + dox), oy: clamp01(dr.oy0 + doy) } : p)))
    dr.panned = true
    setArrastando(true)
  }

  // (re)calcula ghost + alvo a partir da posição atual do cursor (ptr)
  function atualizarTroca() {
    const dr = dragRef.current
    if (!dr || dr.mode !== 'swap') return
    const { x, y } = ptr.current
    const hit = document.elementFromPoint(x, y)?.closest?.('[data-si]')
    const naOrigem = hit && +hit.dataset.ci === index && +hit.dataset.si === dr.si
    setGhost({ foto: dr.foto, si: dr.si, x, y })
    reportDrop(hit && !naOrigem ? { ci: +hit.dataset.ci, si: +hit.dataset.si } : null)
  }

  // rola a página enquanto o dedo está perto do topo/base (só carregando foto)
  function autoScroll() {
    const dr = dragRef.current
    if (!dr) { rafScroll.current = 0; return }
    if (dr.mode === 'swap') {
      const { y } = ptr.current, h = window.innerHeight, borda = 90
      let dy = 0
      if (y < borda) dy = -Math.ceil((borda - y) / 5)
      else if (y > h - borda) dy = Math.ceil((y - (h - borda)) / 5)
      if (dy) { window.scrollBy(0, dy); atualizarTroca() }
    }
    rafScroll.current = requestAnimationFrame(autoScroll)
  }

  function onMove(e) {
    const dr = dragRef.current
    if (!dr) return
    ptr.current = { x: e.clientX, y: e.clientY }
    const dx = e.clientX - dr.x0, dy = e.clientY - dr.y0
    if (!dr.moved && Math.hypot(dx, dy) < 6) return
    dr.moved = true
    const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-si]')
    const naOrigem = hit && +hit.dataset.ci === index && +hit.dataset.si === dr.si

    // ainda dentro da própria célula → reposiciona (pan)
    if (dr.mode !== 'swap' && naOrigem) {
      dr.mode = 'pan'
      panTo(dr, dx, dy)
      return
    }
    // saiu da célula → foto suspensa (com zoom) seguindo o cursor; modo troca
    if (dr.mode !== 'swap' && dr.panned) {
      // descarta pan parcial: a foto sobe inteira
      aplica(slotsRef.current.map((p, k) => (k === dr.si ? { ...p, ox: dr.ox0, oy: dr.oy0 } : p)))
      setArrastando(false)
    }
    dr.mode = 'swap'
    atualizarTroca()
  }

  function onUp(e) {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    if (rafScroll.current) { cancelAnimationFrame(rafScroll.current); rafScroll.current = 0 }
    const dr = dragRef.current
    dragRef.current = null
    setArrastando(false)
    setGhost(null)
    reportDrop(null)
    if (!dr) return
    if (!dr.moved) { setSel((p) => (p === dr.si ? null : dr.si)); return }
    if (dr.mode === 'swap') {
      const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-si]')
      const naOrigem = hit && +hit.dataset.ci === index && +hit.dataset.si === dr.si
      if (hit && !naOrigem) onSwap(index, dr.si, +hit.dataset.ci, +hit.dataset.si)
      return
    }
    onEdit(index, slotsRef.current) // commit do pan em full-res
  }

  function onCellDown(e, si) {
    const s = slotsRef.current[si]
    if (!s) return
    e.preventDefault()
    dragRef.current = { si, foto: s.foto, x0: e.clientX, y0: e.clientY, ox0: s.ox, oy0: s.oy, moved: false, mode: 'tap' }
    ptr.current = { x: e.clientX, y: e.clientY }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    if (!rafScroll.current) rafScroll.current = requestAnimationFrame(autoScroll)
  }

  function setZoom(z) {
    aplica(slotsRef.current.map((p, k) => (k === sel ? { ...p, zoom: z } : p)))
    setArrastando(true)
  }
  const commitZoom = () => { setArrastando(false); onEdit(index, slotsRef.current) }
  function resetSel() {
    aplica(slotsRef.current.map((p, k) => (k === sel && p ? { ...p, ...PADRAO } : p)))
    onEdit(index, slotsRef.current)
  }

  const cells = colagem.layoutObj?.c || []

  return (
    <div className="carta">
      <div className="envolto editando">
        <canvas ref={ref} width={prevW} height={prevH} className="carta-cv" />
        {cells.map((c, i) => (
          <div
            key={i}
            className={'cell-hit'
              + (sel === i ? ' sel' : '')
              + (ghost && ghost.si === i ? ' lifting' : '')
              + (dropTarget && dropTarget.ci === index && dropTarget.si === i ? ' drop' : '')}
            data-ci={index}
            data-si={i}
            style={{ left: `${c[0] * 100}%`, top: `${c[1] * 100}%`, width: `${c[2] * 100}%`, height: `${c[3] * 100}%` }}
            onPointerDown={(e) => onCellDown(e, i)}
          />
        ))}
        {busy && <div className="spin-over"><div className="spin" /></div>}
      </div>

      {sel != null && slots[sel] && (
        <div className="zoombar">
          <span aria-hidden="true">🔍</span>
          <input
            type="range" min="1" max="3" step="0.02" value={slots[sel].zoom}
            onChange={(e) => setZoom(+e.target.value)}
            onPointerUp={commitZoom} onPointerCancel={commitZoom} onMouseUp={commitZoom} onTouchEnd={commitZoom}
            aria-label="Zoom da foto"
          />
          <button className="btn btn-s btn-mini" onClick={resetSel} title="Restaurar enquadramento" aria-label="Restaurar">⟲</button>
        </div>
      )}

      <div className="carta-rodape">
        <span className="carta-nome">
          <b>Colagem {index + 1}</b>
          {colagem.grupo.length} fotos · {colagem.lay}
        </span>
        <button className="btn btn-s btn-mini" onClick={() => onView?.(colagem.cv)} title="Visualizar" aria-label="Visualizar">🔍</button>
        <button className="btn btn-s btn-mini" onClick={onRelayout} title="Trocar layout" aria-label="Trocar layout">↻</button>
        <button className="btn btn-p btn-mini" onClick={onBaixar} title="Baixar" aria-label="Baixar">⬇</button>
      </div>

      {ghost && createPortal(
        <div className="drag-ghost" style={{ left: ghost.x, top: ghost.y }}>
          <canvas ref={ghostRef} width={132} height={Math.round(132 * prevH / prevW)} />
        </div>,
        document.body
      )}
    </div>
  )
}

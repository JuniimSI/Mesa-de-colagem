// Renderização das colagens no canvas (corte, zoom/pan, vibrância, grão, assinatura).
import { escolherLayout } from './layouts.js'

// Calcula o retângulo-fonte (na foto original) para preencher uma célula.
// zoom>=1 fecha o enquadramento; ox/oy em [0,1] posicionam a janela na folga.
// Padrão zoom=1, ox=.5, oy=.3 reproduz o corte antigo (centro-X, viés 30% do topo).
export function fonteRecorte(foto, alvo, zoom = 1, ox = 0.5, oy = 0.3) {
  const sw = foto.w, sh = foto.h, src = sw / sh
  let bw, bh // janela base (cover, zoom 1)
  if (src > alvo) { bh = sh; bw = sh * alvo } else { bw = sw; bh = sw / alvo }
  const ww = bw / zoom, hh = bh / zoom
  const slackX = sw - ww, slackY = sh - hh
  const sx = slackX * clamp01(ox), sy = slackY * clamp01(oy)
  return { sx, sy, sw: ww, sh: hh, slackX, slackY }
}
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

// desenha uma célula a partir do slot { foto, zoom, ox, oy }
function desenharCelula(ctx, slot, cx, cy, cw, ch, melhoria, rapido) {
  const foto = slot.foto
  const { sx, sy, sw, sh } = fonteRecorte(foto, cw / ch, slot.zoom, slot.ox, slot.oy)
  if (melhoria) {
    ctx.filter = foto.lum < 95
      ? 'brightness(1.2) contrast(1.05) saturate(1.05)'
      : 'brightness(1.1) contrast(1.03) saturate(1.04)'
  }
  ctx.drawImage(foto.bmp, sx, sy, sw, sh, cx, cy, cw, ch)
  ctx.filter = 'none'
  if (melhoria && !rapido) vibrancia(ctx, cx, cy, cw, ch)
}

// vibrância no canvas: satura cores fracas, preserva fortes e protege pele
function vibrancia(ctx, cx, cy, cw, ch) {
  cx = Math.round(cx); cy = Math.round(cy); cw = Math.round(cw); ch = Math.round(ch)
  const im = ctx.getImageData(cx, cy, cw, ch), d = im.data
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2]
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = (mx - mn) / (mx + 1e-6)
    const skin = r > 95 && r > g && g > b && r - b < 120
    const boost = (1 - sat) * 0.4 * (skin ? 0.3 : 1)
    const mean = (r + g + b) / 3
    d[i] = Math.max(0, Math.min(255, mean + (r - mean) * (1 + boost)))
    d[i + 1] = Math.max(0, Math.min(255, mean + (g - mean) * (1 + boost)))
    d[i + 2] = Math.max(0, Math.min(255, mean + (b - mean) * (1 + boost)))
  }
  ctx.putImageData(im, cx, cy)
}

// textura: grão fino tileado (gerado uma vez e reaproveitado)
let grao = null
function fazerGrao() {
  const g = document.createElement('canvas')
  g.width = g.height = 256
  const x = g.getContext('2d')
  const id = x.createImageData(256, 256)
  for (let i = 0; i < id.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 70
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v
    id.data[i + 3] = 255
  }
  x.putImageData(id, 0, 0)
  return g
}

// Cria os slots de um grupo para um layout (verticais primeiro, transformes padrão).
export function montarSlots(grupo, layoutObj) {
  const fs = [...grupo].sort((a, b) => (b.vert ? 1 : 0) - (a.vert ? 1 : 0))
  return layoutObj.c.map((_, i) => (fs[i] ? { foto: fs[i], zoom: 1, ox: 0.5, oy: 0.3 } : null))
}

// Renderiza um canvas (W×H) a partir de slots + layout. rapido pula vibrância/grão.
export function renderColagem(slots, layoutObj, { W, H, melhoria, assinatura, assinAlpha = 1, rapido = false }) {
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')
  layoutObj.c.forEach((c, i) => {
    const s = slots[i]
    if (s && s.foto) desenharCelula(ctx, s, c[0] * W, c[1] * H, c[2] * W, c[3] * H, melhoria, rapido)
  })
  if (melhoria && !rapido) {
    if (!grao) grao = fazerGrao()
    ctx.globalAlpha = 0.06
    ctx.globalCompositeOperation = 'overlay'
    for (let y = 0; y < H; y += 256) for (let x = 0; x < W; x += 256) ctx.drawImage(grao, x, y)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }
  if (assinatura && assinAlpha > 0) {
    const aw = W, ah = aw * assinatura.naturalHeight / assinatura.naturalWidth
    ctx.globalAlpha = assinAlpha
    ctx.shadowColor = 'rgba(0,0,0,.45)'
    ctx.shadowBlur = 18
    ctx.drawImage(assinatura, 0, H - ah, aw, ah)
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1
  }
  return cv
}

// Monta uma colagem do zero. Devolve { cv, lay, layoutObj, slots, varia }.
export function montar(grupo, idxLayout, opts) {
  const layoutObj = escolherLayout(grupo.length, idxLayout, opts.estilo)
  const slots = montarSlots(grupo, layoutObj)
  const cv = renderColagem(slots, layoutObj, opts)
  return { cv, lay: layoutObj.nome, layoutObj, slots, varia: idxLayout }
}

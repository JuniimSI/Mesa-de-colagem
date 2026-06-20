// Renderização das colagens no canvas (corte, vibrância, grão, assinatura).
import { escolherLayout } from './layouts.js'

// corte inteligente: centro horizontal, viés p/ cima (rostos)
function desenharCelula(ctx, foto, cx, cy, cw, ch, melhoria) {
  const img = foto.bmp, sw = foto.w, sh = foto.h
  const alvo = cw / ch, src = sw / sh
  let sx = 0, sy = 0, scw = sw, sch = sh
  if (src > alvo) { scw = sh * alvo; sx = (sw - scw) * 0.5 }
  else { sch = sw / alvo; sy = (sh - sch) * 0.3 } // viés 30% do topo
  if (melhoria) {
    ctx.filter = foto.lum < 95
      ? 'brightness(1.2) contrast(1.05) saturate(1.05)'
      : 'brightness(1.1) contrast(1.03) saturate(1.04)'
  }
  ctx.drawImage(img, sx, sy, scw, sch, cx, cy, cw, ch)
  ctx.filter = 'none'
  if (melhoria) vibrancia(ctx, cx, cy, cw, ch)
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

// Monta uma colagem e devolve { cv, lay } (canvas full-res + nome do layout).
export function montar(grupo, idxLayout, { W, H, estilo, melhoria, assinatura, assinAlpha = 1 }) {
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')
  // verticais primeiro: caem nas células altas dos layouts dinâmicos
  const fs = [...grupo].sort((a, b) => (b.vert ? 1 : 0) - (a.vert ? 1 : 0))
  const lay = escolherLayout(fs.length, idxLayout, estilo)
  lay.c.forEach((c, i) => {
    if (fs[i]) desenharCelula(ctx, fs[i], c[0] * W, c[1] * H, c[2] * W, c[3] * H, melhoria)
  })
  if (melhoria) {
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
  return { cv, lay: lay.nome }
}

// Decodificação, análise e agrupamento das fotos.

// Análise por código: luminância média, cor dominante, orientação
export function analisar(img) {
  const c = document.createElement('canvas')
  c.width = c.height = 24
  const x = c.getContext('2d')
  x.drawImage(img, 0, 0, 24, 24)
  const d = x.getImageData(0, 0, 24, 24).data
  let lum = 0, r = 0, g = 0, b = 0
  for (let i = 0; i < d.length; i += 4) {
    r += d[i]; g += d[i + 1]; b += d[i + 2]
    lum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
  }
  const n = d.length / 4
  const w = img.width || img.naturalWidth
  const h = img.height || img.naturalHeight
  return { lum: lum / n, r: r / n, g: g / n, b: b / n, vert: h > w }
}

export const dist = (a, b) =>
  Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b) + Math.abs(a.lum - b.lum) * 1.5

// rejeita se a promise não resolver no tempo dado (evita travar a fila no mobile)
function comLimite(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then((v) => { clearTimeout(t); resolve(v) }, (e) => { clearTimeout(t); reject(e) })
  })
}

// fallback p/ navegadores sem createImageBitmap (ou quando ele falha).
// SEMPRE resolve: onerror + timeout evitam que a análise fique presa pra sempre.
function viaImg(f) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(f)
    const i = new Image()
    const fim = (img) => { clearTimeout(t); URL.revokeObjectURL(url); resolve(img) }
    const t = setTimeout(() => fim(null), 30000)
    i.onload = () => fim(i)
    i.onerror = () => fim(null)
    i.src = url
  })
}

// decodifica 1 foto; nunca trava nem lança — devolve a foto ou null se falhar.
async function processar(f) {
  try {
    let bmp = await comLimite(createImageBitmap(f), 30000)
    const max = Math.max(bmp.width, bmp.height)
    if (max > 2600) {
      const e = 2600 / max
      const r = await createImageBitmap(bmp, {
        resizeWidth: Math.round(bmp.width * e),
        resizeHeight: Math.round(bmp.height * e),
        resizeQuality: 'high',
      })
      bmp.close()
      bmp = r
    }
    return { bmp, w: bmp.width, h: bmp.height, ...analisar(bmp) }
  } catch {
    const img = await viaImg(f)
    if (!img) return null
    return { bmp: img, w: img.naturalWidth, h: img.naturalHeight, ...analisar(img) }
  }
}

// Decodifica em paralelo, reduzindo p/ no máx. 2600px.
// Concorrência adaptada ao aparelho: menos decodes simultâneos no mobile
// (cada foto de 10MB ocupa centenas de MB já decodificada → OOM/trava).
// onProgress(prontas, total) é chamado a cada foto.
export async function carregarFotos(files, onProgress) {
  const lista = [...files].filter((f) => f.type.startsWith('image/'))
  const fotos = []
  let prontas = 0
  onProgress?.(0, lista.length)
  const fila = [...lista]
  const nucleos = navigator.hardwareConcurrency || 4
  const mem = navigator.deviceMemory || 4
  const N = Math.max(1, Math.min(nucleos, mem >= 8 ? 4 : 2))
  async function operario() {
    while (fila.length) {
      const foto = await processar(fila.shift())
      if (foto) fotos.push(foto) // foto que falhou é pulada, não trava a fila
      onProgress?.(++prontas, lista.length)
    }
  }
  await Promise.all(Array.from({ length: N }, operario))
  return fotos
}

// Agrupamento guloso por semelhança visual (2 a 4 fotos por colagem)
export function agrupar(fotos) {
  const resto = [...fotos]
  const grupos = []
  while (resto.length) {
    const semente = resto.shift()
    const g = [semente]
    resto.sort((a, b) => dist(a, semente) - dist(b, semente))
    while (g.length < 4 && resto.length) {
      if (resto.length && (dist(resto[0], semente) < 95 || g.length < 2)) g.push(resto.shift())
      else break
    }
    grupos.push(g)
  }
  // grupo solitário no fim? junta no anterior
  if (grupos.length > 1 && grupos.at(-1).length === 1) {
    const s = grupos.pop()[0]
    grupos.at(-1).push(s)
  }
  return grupos
}

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

// Decodifica em paralelo (4 por vez), reduzindo p/ no máx. 2600px.
// onProgress(prontas, total) é chamado a cada foto.
export async function carregarFotos(files, onProgress) {
  const lista = [...files].filter((f) => f.type.startsWith('image/'))
  const fotos = []
  let prontas = 0
  onProgress?.(0, lista.length)
  const fila = [...lista]
  async function operario() {
    while (fila.length) {
      const f = fila.shift()
      try {
        let bmp = await createImageBitmap(f)
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
        fotos.push({ bmp, w: bmp.width, h: bmp.height, ...analisar(bmp) })
      } catch {
        // fallback p/ navegadores antigos
        const img = await new Promise((r) => {
          const i = new Image()
          i.onload = () => r(i)
          i.src = URL.createObjectURL(f)
        })
        fotos.push({ bmp: img, w: img.naturalWidth, h: img.naturalHeight, ...analisar(img) })
      }
      onProgress?.(++prontas, lista.length)
    }
  }
  await Promise.all([0, 1, 2, 3].map(operario))
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

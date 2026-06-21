import { useState } from 'react'
import Header from './components/Header.jsx'
import Controls from './components/Controls.jsx'
import Mesa from './components/Mesa.jsx'
import Lightbox from './components/Lightbox.jsx'
import { carregarFotos, agrupar } from './lib/image.js'
import { montar } from './lib/render.js'
import { baixar } from './lib/download.js'
import { pintar } from './lib/util.js'

export default function App() {
  const [fotos, setFotos] = useState([])
  const [assinatura, setAssinatura] = useState(null)
  const [assinNome, setAssinNome] = useState('nenhuma · ocupará a largura toda')
  const [assinAlpha, setAssinAlpha] = useState(1)
  const [prop, setProp] = useState('4:5')
  const [estilo, setEstilo] = useState('misto')
  const [melhoria, setMelhoria] = useState(true)
  const [colagens, setColagens] = useState([])
  const [pending, setPending] = useState(0)
  const [busy, setBusy] = useState(new Set())
  const [status, setStatus] = useState('')
  const [gerando, setGerando] = useState(false)
  const [rodape, setRodape] = useState(false)
  const [analisando, setAnalisando] = useState(0)
  const [preview, setPreview] = useState(null)

  // dimensões derivadas da proporção escolhida
  const dims = () => {
    const [pw, ph] = prop.split(':').map(Number)
    return { W: 2160, H: Math.round(2160 * ph / pw), prevW: 300, prevH: Math.round(300 * ph / pw) }
  }
  const opts = () => {
    const { W, H } = dims()
    return { W, H, estilo, melhoria, assinatura, assinAlpha }
  }

  // adiciona às fotos já carregadas (não substitui)
  async function onFiles(files) {
    const qtd = [...files].filter((f) => f.type.startsWith('image/')).length
    setAnalisando(qtd)
    setStatus('Analisando…')
    const novas = await carregarFotos(files, (done, t) => setStatus(`Analisando ${done}/${t}…`))
    setAnalisando(0)
    const total = fotos.length + novas.length
    setFotos((prev) => [...prev, ...novas])
    setStatus(`${total} fotos prontas para agrupar.`)
  }

  function removerFoto(i) {
    const next = fotos.filter((_, k) => k !== i)
    try { fotos[i]?.bmp?.close?.() } catch { /* noop */ }
    setFotos(next)
    setStatus(next.length ? `${next.length} fotos prontas para agrupar.` : '')
  }

  function limpar() {
    fotos.forEach((f) => { try { f.bmp?.close?.() } catch { /* noop */ } })
    setFotos([])
    setColagens([])
    setPending(0)
    setRodape(false)
    setStatus('')
  }

  function onAssin(f) {
    if (!f) return
    const img = new Image()
    img.onload = () => {
      setAssinatura(img)
      setAssinNome(f.name + ' · largura toda')
    }
    img.src = URL.createObjectURL(f)
  }

  async function gerar() {
    if (fotos.length < 2) return
    setGerando(true)
    setStatus('Montando…')
    const o = opts()
    const grupos = agrupar(fotos)
    setColagens([])
    setPending(grupos.length)
    setRodape(false)
    await pintar() // deixa o skeleton aparecer de verdade
    const novas = []
    for (let i = 0; i < grupos.length; i++) {
      await pintar() // garante o frame antes do trabalho pesado
      const { cv, lay } = montar(grupos[i], i, o)
      novas.push({ cv, grupo: grupos[i], lay, varia: i })
      setColagens([...novas])
    }
    setPending(0)
    setRodape(true)
    setGerando(false)
    setStatus(`${grupos.length} colagens montadas a partir de ${fotos.length} fotos.`)
  }

  // troca o layout de uma carta (variante seguinte), com spinner sobreposto
  async function reLayout(i) {
    setBusy((p) => new Set(p).add(i))
    await pintar()
    const c = colagens[i]
    const varia = c.varia + 1
    const { cv, lay } = montar(c.grupo, varia, opts())
    setColagens((p) => p.map((x, k) => (k === i ? { ...x, cv, lay, varia } : x)))
    setBusy((p) => {
      const n = new Set(p)
      n.delete(i)
      return n
    })
  }

  // reembaralha: spinner em todas as cartas, depois remonta cada uma na variante seguinte
  async function reembaralhar() {
    if (!colagens.length) return
    setBusy(new Set(colagens.map((_, i) => i)))
    await pintar()
    const o = opts()
    const novas = colagens.map((c) => {
      const varia = c.varia + 1
      const { cv, lay } = montar(c.grupo, varia, o)
      return { ...c, cv, lay, varia }
    })
    setColagens(novas)
    setBusy(new Set())
  }

  function baixarTudo() {
    colagens.forEach((c, i) => setTimeout(() => baixar(c.cv, `colagem_${i + 1}.jpg`), i * 400))
  }

  const { prevW, prevH } = dims()

  return (
    <>
      <div className="bg-fx" aria-hidden="true" />
      <Header />
      <main className="layout">
        <div className="col-controles">
          <Controls
            fotos={fotos}
            onFiles={onFiles}
            onRemove={removerFoto}
            onClear={limpar}
            onAssin={onAssin}
            onView={setPreview}
            analisando={analisando}
            assinNome={assinNome}
            temAssin={!!assinatura}
            assinAlpha={assinAlpha}
            setAssinAlpha={setAssinAlpha}
            prop={prop}
            setProp={setProp}
            estilo={estilo}
            setEstilo={setEstilo}
            melhoria={melhoria}
            setMelhoria={setMelhoria}
            podeGerar={fotos.length >= 2}
            gerando={gerando}
            onGerar={gerar}
            status={status}
          />
        </div>
        <div className="col-mesa">
          <Mesa
            colagens={colagens}
            pending={pending}
            prevW={prevW}
            prevH={prevH}
            busy={busy}
            onView={setPreview}
            onRelayout={reLayout}
            onBaixar={(i) => baixar(colagens[i].cv, `colagem_${i + 1}.jpg`)}
          />
        </div>
      </main>

      {rodape && colagens.length > 0 && (
        <div className="barra-acao">
          <div className="barra-inner">
            <span className="resumo">
              <b>{colagens.length}</b> colagens · <b>{fotos.length}</b> fotos
            </span>
            <button className="btn btn-s btn-mini" onClick={reembaralhar}>↻ Reembaralhar</button>
            <button className="btn btn-p btn-mini" onClick={baixarTudo}>⬇ Baixar todas</button>
          </div>
        </div>
      )}

      <Lightbox src={preview} onClose={() => setPreview(null)} />
    </>
  )
}

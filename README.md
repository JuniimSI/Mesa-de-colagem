# Mesa de Colagem

App React (Vite) que agrupa, monta e assina fotos no navegador. Tudo roda no aparelho — nenhuma imagem sai do dispositivo. PWA (abre offline / instalável).

## Rodar local

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build

```bash
npm run build    # gera /dist
npm run preview  # serve o /dist pra conferir
```

## Deploy grátis no Cloudflare Pages

Opção 1 — via Git (recomendado):

1. Suba este repo no GitHub.
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Selecione o repo e configure:
   - **Framework preset:** Vite (ou None)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Deploy. Cada `git push` re-publica automático.

Opção 2 — via CLI (Wrangler), sem Git:

```bash
npm run build
npx wrangler pages deploy dist --project-name=mesa-de-colagem
```

## Estrutura

```
index.html              # shell (fontes + meta PWA)
vite.config.js          # Vite + plugin React + PWA (manifest/SW)
public/icon.svg         # ícone do app
src/
  main.jsx              # entrada React
  App.jsx               # estado + fluxo (gerar / relayout / reembaralhar)
  styles.css            # visual original, intacto
  components/           # Header, Controls, Mesa, Carta
  lib/
    image.js            # decodificação, análise, agrupamento
    layouts.js          # templates de layout
    render.js           # corte, vibrância, grão, assinatura, montagem
    download.js         # exportar JPG
    util.js             # pintar() — cede frame pro navegador
```

// garante que o navegador PINTE a tela antes de seguir (2 frames + tick)
export const pintar = () =>
  new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 0))))

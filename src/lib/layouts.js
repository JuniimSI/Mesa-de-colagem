// Layouts (células: x, y, w, h em fração). cls=1 → clássico (grade), cls=0 → dinâmico.
export const LAY = {
  2: [
    { nome: 'empilhado', cls: 1, c: [[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]] },
    { nome: 'colunas 60/40', cls: 0, c: [[0, 0, 0.6, 1], [0.6, 0, 0.4, 1]] },
  ],
  3: [
    { nome: '2 cima + 1 baixo', cls: 1, c: [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 1, 0.5]] },
    { nome: 'grande esquerda', cls: 0, c: [[0, 0, 0.62, 1], [0.62, 0, 0.38, 0.5], [0.62, 0.5, 0.38, 0.5]] },
    { nome: 'grande topo', cls: 0, c: [[0, 0, 1, 0.62], [0, 0.62, 0.58, 0.38], [0.58, 0.62, 0.42, 0.38]] },
  ],
  4: [
    { nome: 'grade 2x2', cls: 1, c: [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]] },
    { nome: '3 cima + 1 baixo', cls: 1, c: [[0, 0, 1 / 3, 0.55], [1 / 3, 0, 1 / 3, 0.55], [2 / 3, 0, 1 / 3, 0.55], [0, 0.55, 1, 0.45]] },
    { nome: 'mosaico', cls: 0, c: [[0, 0, 0.62, 0.6], [0.62, 0, 0.38, 0.6], [0, 0.6, 0.42, 0.4], [0.42, 0.6, 0.58, 0.4]] },
    { nome: 'coluna destaque', cls: 0, c: [[0, 0, 0.45, 1], [0.45, 0, 0.55, 0.38], [0.45, 0.38, 0.55, 0.31], [0.45, 0.69, 0.55, 0.31]] },
  ],
}

export function escolherLayout(n, i, estilo) {
  let pool = LAY[Math.min(n, 4)]
  if (estilo === 'classico') pool = pool.filter((l) => l.cls)
  if (estilo === 'dinamico') pool = pool.filter((l) => !l.cls)
  if (!pool || !pool.length) pool = LAY[Math.min(n, 4)]
  return pool[i % pool.length]
}

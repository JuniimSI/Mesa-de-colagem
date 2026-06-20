export function baixar(cv, nome) {
  const a = document.createElement('a')
  a.download = nome
  a.href = cv.toDataURL('image/jpeg', 0.92)
  a.click()
}

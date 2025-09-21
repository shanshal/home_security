export function base64ToBlob(b64, mime = 'application/octet-stream') {
  const bin = atob(b64)
  const len = bin.length
  const buf = new Uint8Array(len)
  for (let i = 0; i < len; i++) buf[i] = bin.charCodeAt(i)
  return new Blob([buf], { type: mime })
}

export async function ensurePngFileFromBase64(b64, fmt, name) {
  const lower = String(fmt || '').toLowerCase()
  const blob = base64ToBlob(b64, `image/${lower || 'bmp'}`)
  if (lower === 'png') return new File([blob], name || 'scan.png', { type: 'image/png' })
  try {
    const dataUrl = `data:${blob.type};base64,${b64}`
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = dataUrl
    })
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth || img.width
    canvas.height = img.naturalHeight || img.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    const fname = (name && name.replace(/\.[^.]+$/, '')) || 'scan'
    return new File([pngBlob], `${fname}.png`, { type: 'image/png' })
  } catch {
    return new File([blob], name || `scan.${lower || 'bmp'}`, { type: blob.type })
  }
}


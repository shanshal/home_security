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

export function ensureImageFileFromBase64(b64, fmt, name) {
  const lower = String(fmt || '').toLowerCase() || 'bmp'
  const blob = base64ToBlob(b64, `image/${lower}`)
  const fname = name || `scan.${lower}`
  return new File([blob], fname, { type: blob.type })
}

export async function convertFileToPng(file) {
  if (!file || !(file instanceof File)) return file
  if ((file.type || '').toLowerCase() === 'image/png') return file
  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const fr = new FileReader()
      fr.onerror = () => reject(new Error('Failed to read file'))
      fr.onload = () => resolve(String(fr.result || ''))
      fr.readAsDataURL(file)
    })
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
    const base = (file.name || 'scan').replace(/\.[^.]+$/, '')
    return new File([pngBlob], `${base}.png`, { type: 'image/png' })
  } catch {
    return file
  }
}

export async function convertFileToBmp(file) {
  if (!file || !(file instanceof File)) return file
  if ((file.type || '').toLowerCase() === 'image/bmp') return file
  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const fr = new FileReader()
      fr.onerror = () => reject(new Error('Failed to read file'))
      fr.onload = () => resolve(String(fr.result || ''))
      fr.readAsDataURL(file)
    })
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = dataUrl
    })
    const canvas = document.createElement('canvas')
    const width = img.naturalWidth || img.width
    const height = img.naturalHeight || img.height
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, width, height)
    const bmpBlob = imageDataToBmp(imageData)
    const base = (file.name || 'scan').replace(/\.[^.]+$/, '')
    return new File([bmpBlob], `${base}.bmp`, { type: 'image/bmp' })
  } catch {
    return file
  }
}

export function imageDataToBmp(imageData) {
  const width = imageData.width
  const height = imageData.height
  const rowSize = Math.floor((24 * width + 31) / 32) * 4 // 24bpp row padded to 4 bytes
  const imageSize = rowSize * height
  const headerSize = 14 + 40
  const fileSize = headerSize + imageSize
  const buffer = new ArrayBuffer(fileSize)
  const dv = new DataView(buffer)
  let offset = 0

  // BITMAPFILEHEADER (14 bytes)
  dv.setUint8(offset++, 0x42) // 'B'
  dv.setUint8(offset++, 0x4D) // 'M'
  dv.setUint32(offset, fileSize, true); offset += 4
  dv.setUint16(offset, 0, true); offset += 2 // reserved1
  dv.setUint16(offset, 0, true); offset += 2 // reserved2
  dv.setUint32(offset, headerSize, true); offset += 4 // offset to pixel data

  // BITMAPINFOHEADER (40 bytes)
  dv.setUint32(offset, 40, true); offset += 4 // biSize
  dv.setInt32(offset, width, true); offset += 4 // biWidth
  dv.setInt32(offset, height, true); offset += 4 // biHeight (positive = bottom-up)
  dv.setUint16(offset, 1, true); offset += 2 // biPlanes
  dv.setUint16(offset, 24, true); offset += 2 // biBitCount
  dv.setUint32(offset, 0, true); offset += 4 // biCompression (BI_RGB)
  dv.setUint32(offset, imageSize, true); offset += 4 // biSizeImage
  dv.setInt32(offset, 2835, true); offset += 4 // biXPelsPerMeter (72 DPI)
  dv.setInt32(offset, 2835, true); offset += 4 // biYPelsPerMeter
  dv.setUint32(offset, 0, true); offset += 4 // biClrUsed
  dv.setUint32(offset, 0, true); offset += 4 // biClrImportant

  // Pixel data (BGR, bottom-up)
  const pixels = imageData.data
  const pad = rowSize - width * 3
  let pOffset = headerSize
  for (let y = height - 1; y >= 0; y--) {
    const rowStart = y * width * 4
    for (let x = 0; x < width; x++) {
      const idx = rowStart + x * 4
      const r = pixels[idx]
      const g = pixels[idx + 1]
      const b = pixels[idx + 2]
      dv.setUint8(pOffset++, b)
      dv.setUint8(pOffset++, g)
      dv.setUint8(pOffset++, r)
    }
    for (let i = 0; i < pad; i++) dv.setUint8(pOffset++, 0)
  }

  return new Blob([buffer], { type: 'image/bmp' })
}

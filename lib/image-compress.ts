// Compresses an image in the browser before upload.
// Optionally center-crops to a target aspect ratio (width/height).
// Returns a JPEG Blob, typically a few hundred KB even from large source images.

export async function compressImage(
  file: File,
  opts: { maxWidth?: number; aspect?: number; quality?: number } = {}
): Promise<Blob> {
  const maxWidth = opts.maxWidth ?? 720
  const aspect = opts.aspect // e.g. 9/16 for vertical poster
  const quality = opts.quality ?? 0.82

  const img = await loadImage(file)

  let sx = 0,
    sy = 0,
    sw = img.width,
    sh = img.height
  if (aspect) {
    const srcAspect = img.width / img.height
    if (srcAspect > aspect) {
      // source too wide → crop sides
      sw = Math.round(img.height * aspect)
      sx = Math.round((img.width - sw) / 2)
    } else {
      // source too tall → crop top/bottom
      sh = Math.round(img.width / aspect)
      sy = Math.round((img.height - sh) / 2)
    }
  }

  const outAspect = aspect ?? sw / sh
  const outW = Math.min(maxWidth, sw)
  const outH = Math.round(outW / outAspect)

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH)

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
      'image/jpeg',
      quality
    )
  })
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

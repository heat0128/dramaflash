'use client'

export async function uploadToStream({
  file,
  uploadURL,
  protocol,
  onProgress
}: {
  file: File
  uploadURL: string
  protocol: 'basic' | 'tus'
  onProgress: (percentage: number) => void
}) {
  if (protocol === 'basic') {
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch(uploadURL, { method: 'POST', body: formData })
    if (!response.ok) throw new Error('Cloudflare Stream upload failed')
    onProgress(100)
    return
  }

  const { Upload } = await import('tus-js-client')
  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      uploadUrl: uploadURL,
      chunkSize: 50 * 1024 * 1024,
      retryDelays: [0, 1000, 3000, 5000, 10_000],
      removeFingerprintOnSuccess: true,
      onError: reject,
      onProgress: (uploaded, total) => onProgress(Math.round((uploaded / total) * 100)),
      onSuccess: () => resolve()
    })
    upload.start()
  })
}

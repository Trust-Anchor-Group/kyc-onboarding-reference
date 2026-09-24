export const MAX_EVIDENCE_IMAGE_BYTES = 5 * 1024 * 1024

const TARGET_EVIDENCE_IMAGE_BYTES = Math.floor(MAX_EVIDENCE_IMAGE_BYTES * 0.9)
const MAX_EDGE_STEPS = [2400, 2000, 1600, 1280]
const JPEG_QUALITIES = [0.9, 0.82, 0.74, 0.66]

const unsupportedImage = () => new Error('UNSUPPORTED_IMAGE')
const oversizedImage = () => new Error('IMAGE_TOO_LARGE')

const fileExtension = (fileName) =>
  String(fileName || 'document.jpg').replace(/\.[^.]+$/, '') + '.jpg'

const loadImage = async (file) => {
  if (typeof window === 'undefined' || !file?.type?.startsWith('image/')) {
    throw unsupportedImage()
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = new window.Image()
    image.decoding = 'async'
    image.src = objectUrl
    await image.decode()
    return image
  } catch {
    throw unsupportedImage()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/**
 * Preserve an image that already meets the evidence limit. Larger phone photos
 * are reduced locally to a reviewable JPEG that the Agent Content store accepts.
 */
export async function prepareEvidenceImage(file, preferredName) {
  if (!file?.type?.startsWith('image/')) throw unsupportedImage()
  if (file.size > 0 && file.size <= MAX_EVIDENCE_IMAGE_BYTES) return file

  const image = await loadImage(file)
  const sourceWidth = image.naturalWidth || image.width
  const sourceHeight = image.naturalHeight || image.height
  if (!sourceWidth || !sourceHeight) throw unsupportedImage()

  for (const maxEdge of MAX_EDGE_STEPS) {
    const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight))
    const width = Math.max(1, Math.round(sourceWidth * scale))
    const height = Math.max(1, Math.round(sourceHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw unsupportedImage()
    context.drawImage(image, 0, 0, width, height)

    for (const quality of JPEG_QUALITIES) {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
      if (!blob) continue
      if (blob.size <= TARGET_EVIDENCE_IMAGE_BYTES) {
        return new File([blob], fileExtension(preferredName || file.name), { type: 'image/jpeg' })
      }
    }
  }

  throw oversizedImage()
}

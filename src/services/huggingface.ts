const HF_TOKEN = import.meta.env.VITE_HF_TOKEN

const MODEL_ID = 'stabilityai/stable-diffusion-2-inpainting'
const API_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}`

const RESTORE_PROMPT =
  'Restore this broken artifact to its original pristine condition. ' +
  'Repair all cracks, chips, scratches, and damage. ' +
  'Preserve the original colors, textures, and details. ' +
  'Make it look like it was newly crafted.'

function base64ToBlob(base64: string, type = 'image/png'): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type })
}

async function callInpainting(
  imageBase64: string,
  maskBase64: string
): Promise<Blob> {
  const form = new FormData()
  form.append('inputs', base64ToBlob(imageBase64), 'image.png')
  form.append('mask', base64ToBlob(maskBase64), 'mask.png')
  form.append('prompt', RESTORE_PROMPT)
  form.append('negative_prompt', 'blurry, low quality, distorted, deformed, cracked, broken, damaged')
  form.append('num_inference_steps', '30')
  form.append('guidance_scale', '7.5')

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
    },
    body: form,
  })

  if (!response.ok) {
    const text = await response.text()
    let msg = `API error ${response.status}`
    try {
      const json = JSON.parse(text)
      if (json.error) msg = json.error
    } catch {
      if (text) msg = text.substring(0, 300)
    }
    throw new Error(msg)
  }

  return response.blob()
}

export async function restoreWithMask(
  imageBase64: string,
  maskBase64: string
): Promise<Blob> {
  return callInpainting(imageBase64, maskBase64)
}

export async function restoreAutomatic(
  imageBase64: string
): Promise<Blob> {
  const mask = createFullWhiteMask()
  return callInpainting(imageBase64, mask)
}

function createFullWhiteMask(): string {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, 512, 512)
  return canvas.toDataURL('image/png').split(',')[1]
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

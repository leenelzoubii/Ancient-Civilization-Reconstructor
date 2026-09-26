const HF_TOKEN = import.meta.env.VITE_HF_TOKEN

const MODEL_ID = 'stabilityai/stable-diffusion-2-inpainting'
const API_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}`

const RESTORE_PROMPT =
  'Restore this broken artifact to its original pristine condition. ' +
  'Repair all cracks, chips, scratches, and damage. ' +
  'Preserve the original colors, textures, and details. ' +
  'Make it look like it was newly crafted.'

export async function restoreWithMask(
  imageBase64: string,
  maskBase64: string
): Promise<Blob> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {
        image: imageBase64,
        mask_image: maskBase64,
        prompt: RESTORE_PROMPT,
        negative_prompt: 'blurry, low quality, distorted, deformed',
        num_inference_steps: 30,
        guidance_scale: 7.5,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      (error as { error?: string }).error ||
        `API error ${response.status}: ${response.statusText}`
    )
  }

  return response.blob()
}

export async function restoreAutomatic(
  imageBase64: string
): Promise<Blob> {
  const mask = createFullWhiteMask()
  return restoreWithMask(imageBase64, mask)
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
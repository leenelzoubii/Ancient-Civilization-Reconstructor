import { InferenceClient } from '@huggingface/inference'

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN
const client = new InferenceClient(HF_TOKEN)

const RESTORE_PROMPT =
  'Restore this broken artifact to its original pristine condition. ' +
  'Repair all cracks, chips, scratches, and damage. ' +
  'Preserve the original colors, textures, and details. ' +
  'Make it look like it was newly crafted.'

const NEGATIVE_PROMPT =
  'blurry, low quality, distorted, deformed, cracked, broken, damaged'

export async function restoreWithMask(
  imageBase64: string,
  maskBase64: string
): Promise<Blob> {
  const image = base64ToBlob(imageBase64)
  const mask = base64ToBlob(maskBase64)

  const result = await client.imageToImage({
    model: 'black-forest-labs/FLUX.1-Kontext-dev',
    inputs: image,
    parameters: {
      prompt: RESTORE_PROMPT,
      mask: mask,
      negative_prompt: NEGATIVE_PROMPT,
      num_inference_steps: 30,
      guidance_scale: 7.5,
    },
  })

  return result
}

export async function restoreAutomatic(
  imageBase64: string
): Promise<Blob> {
  const image = base64ToBlob(imageBase64)
  const mask = base64ToBlob(createFullWhiteMask())

  const result = await client.imageToImage({
    model: 'black-forest-labs/FLUX.1-Kontext-dev',
    inputs: image,
    parameters: {
      prompt: RESTORE_PROMPT,
      mask: mask,
      negative_prompt: NEGATIVE_PROMPT,
      num_inference_steps: 30,
      guidance_scale: 7.5,
    },
  })

  return result
}

function base64ToBlob(base64: string, type = 'image/png'): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type })
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

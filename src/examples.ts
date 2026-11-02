/**
 * The repair studio's three example artifacts.
 *
 * Each example is a real photograph supplied in `src/assets/examples/` and is
 * picked up at build time with `import.meta.glob`, so a photo that has not been
 * added yet never triggers a 404 request — the card simply stays disabled until
 * the file exists.
 *
 * The examples are deliberately plain: one artifact per frame on a simple
 * background, with a visible crack, so the local detector has something real to
 * find and only those pixels get rebuilt.
 */

const EXAMPLE_PHOTOS = import.meta.glob(
  './assets/examples/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>

const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG', 'WEBP']

/** The bundled photograph for an example, or null until it has been added. */
export function examplePhotoFor(id: string): string | null {
  for (const ext of EXTENSIONS) {
    const url = EXAMPLE_PHOTOS[`./assets/examples/${id}.${ext}`]
    if (url) return url
  }
  return null
}

export type ExampleArtifact = {
  /** Also the file name of the photo, without its extension. */
  id: string
  name: string
  /** Civilization the artifact comes from. */
  civilization: string
  /** What the photo should show, so it can be matched to the note below. */
  note: string
  /** Attribution printed under the card; fill it in once the photos exist. */
  credit: string
}

export const EXAMPLE_ARTIFACTS: ExampleArtifact[] = [
  {
    id: 'egypt',
    name: 'Cracked vessel',
    civilization: 'Ancient Egyptian civilization',
    note: 'A long crack down the neck and body, plus a chip on the rim.',
    credit: '',
  },
  {
    id: 'rome',
    name: 'Chipped bowl',
    civilization: 'Roman civilization',
    note: 'A split rim, a branching crack and a missing piece.',
    credit: '',
  },
  {
    id: 'maya',
    name: 'Fractured slab',
    civilization: 'Maya civilization',
    note: 'One deep fracture with smaller cracks across the carving.',
    credit: '',
  },
]

/** Turns a bundled example photograph into the File the upload pipeline wants. */
export async function exampleToFile(example: ExampleArtifact): Promise<File> {
  const url = examplePhotoFor(example.id)
  if (!url) throw new Error('This example has no photograph yet.')

  const response = await fetch(url)
  if (!response.ok) throw new Error('This example could not be opened.')
  const blob = await response.blob()
  if (!blob.size) throw new Error('This example could not be opened.')

  const ext = (blob.type.split('/')[1] || 'jpeg').replace('jpeg', 'jpg')
  return new File([blob], `${example.id}.${ext}`, { type: blob.type || 'image/jpeg' })
}

/**
 * Real site photograph for a civilization card.
 *
 * Photos live in `src/assets/civ-thumbs/<site-id>.<ext>` and are picked up at
 * build time, so a missing photo never triggers a 404 request. Until a photo
 * exists the card shows a neutral placeholder with the site name.
 */
const CIV_THUMBS = import.meta.glob('../assets/civ-thumbs/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG', 'WEBP']

export function civThumbFor(id: string): string | null {
  for (const ext of EXTENSIONS) {
    const url = CIV_THUMBS[`../assets/civ-thumbs/${id}.${ext}`]
    if (url) return url
  }
  return null
}

export default function CivThumb({
  id,
  name,
  era,
}: {
  id: string
  name: string
  era?: string
}) {
  const src = civThumbFor(id)

  if (!src) {
    return (
      <div
        className="art-placeholder"
        role="img"
        aria-label={`Photograph of ${name} coming soon`}
      >
        <span className="art-placeholder-mark" aria-hidden="true">
          ◈
        </span>
        <strong>{name}</strong>
        <small>Photograph coming soon</small>
      </div>
    )
  }

  return (
    <img
      className="art-photo"
      src={src}
      alt={era ? `${name} — ${era}` : name}
      loading="lazy"
      decoding="async"
    />
  )
}

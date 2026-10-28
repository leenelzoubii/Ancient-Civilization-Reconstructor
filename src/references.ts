/**
 * Reference-image library used by the artifact analysis panel and the local
 * civilization fallback.
 *
 * Every civilization ships nine original reference artifacts
 * (public/references/<id>/1.svg … 9.svg). They are drawn from the same
 * palette as the civilization, so the analysis can learn a colour palette
 * from them and the fallback classifier can compare colours and shapes.
 */

export type ReferenceCiv = {
  id: string
  name: string
  /** Dominant colours, in the order they appear on the reference artifacts. */
  palette: string[]
  /** Typical object width / height ratio for this civilization's vessels. */
  aspect: number
  /** Short phrase used when the local fallback explains its guess. */
  cue: string
}

export const REFERENCE_CIVS: ReferenceCiv[] = [
  {
    id: 'egypt',
    name: 'Ancient Egypt',
    palette: ['#d8b878', '#23466b', '#f7f2e8', '#7a5a32', '#b8862b'],
    aspect: 0.72,
    cue: 'pale Nile clay with blue painted bands',
  },
  {
    id: 'rome',
    name: 'Ancient Rome',
    palette: ['#b5623a', '#4a2f22', '#efe3c8', '#7c3a1f', '#c98b3f'],
    aspect: 1.25,
    cue: 'orange-red terracotta with dark painted bands',
  },
  {
    id: 'maya',
    name: 'Maya Civilization',
    palette: ['#c98b4a', '#a3412e', '#e6ddc4', '#3b3226', '#2f6b55'],
    aspect: 1.05,
    cue: 'straight-sided vessel with deep red and cream slip',
  },
  {
    id: 'taj-mahal',
    name: 'Taj Mahal',
    palette: ['#efe6d2', '#d9a92e', '#8a6a3c', '#fffdf8', '#c98f71'],
    aspect: 1.3,
    cue: 'pale marble with gold inlay and warm sandstone',
  },
  {
    id: 'petra',
    name: 'Petra',
    palette: ['#b3745a', '#8d4f3d', '#f0cfb2', '#4a2a1d', '#e8d5b2'],
    aspect: 0.95,
    cue: 'rose-red sandstone with carved cream highlights',
  },
  {
    id: 'khorfakkan',
    name: 'Khor Fakkan Portuguese Fort',
    palette: ['#d9c9a6', '#2f6f8f', '#6b4a2f', '#f7f2e8', '#2f6b55'],
    aspect: 0.88,
    cue: 'coral-stone cream with sea blue and dark timber',
  },
  {
    id: 'al-jazirat-al-hamra',
    name: 'Al-Jazirat Al-Hamra Courtyard Complex',
    palette: ['#d9a878', '#2f6b55', '#6b4a2f', '#f0dcae', '#b06c42'],
    aspect: 1.1,
    cue: 'warm adobe with palm green and dark wood',
  },
  {
    id: 'dhayah-fort',
    name: 'Dhayah Fort at Ras-Al Khaimah, UAE',
    palette: ['#c98f63', '#2f6b55', '#4a2a1d', '#e8d5b2', '#b06c42'],
    aspect: 1.18,
    cue: 'ochre adobe with palm green and shadowed brown',
  },
]

const byId = new Map(REFERENCE_CIVS.map((c) => [c.id, c]))

export const referenceCiv = (id: string) => byId.get(id)

/** Nine bundled reference images for a civilization. */
export function referenceImages(id: string): string[] {
  if (!byId.has(id)) return []
  return Array.from({ length: 9 }, (_, i) => `/references/${id}/${i + 1}.svg`)
}

/** All reference image URLs, used to preload the palette cache. */
export function allReferenceImages(): { civ: string; src: string }[] {
  return REFERENCE_CIVS.flatMap((civ) =>
    referenceImages(civ.id).map((src) => ({ civ: civ.id, src }))
  )
}

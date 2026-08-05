import { describe, expect, it } from 'vitest'
import { TERMS } from './terms'
import { NEW_MEDIA_COUNTS, TERM_MEDIA } from './termMedia'

describe('TERM_MEDIA', () => {
  it('47件の新素材と8件の既存イラストで全55語を重複なく覆う', () => {
    const termIds = new Set(TERMS.map((term) => term.id))
    const mediaIds = Object.keys(TERM_MEDIA)
    const fallbackIds = TERMS.filter((term) => !TERM_MEDIA[term.id]).map((term) => term.id)

    expect(termIds.size).toBe(55)
    expect(mediaIds).toHaveLength(47)
    expect(mediaIds.every((id) => termIds.has(id))).toBe(true)
    expect(fallbackIds).toEqual([
      'timecode',
      'png',
      'mp4',
      'mov',
      'project-data',
      'export',
      'proxy',
      'tonemana',
    ])
  })

  it('実ファイル監査と同じ内訳・音声フラグを持つ', () => {
    const media = Object.values(TERM_MEDIA)

    expect(NEW_MEDIA_COUNTS).toEqual({ total: 47, image: 7, video: 40, audio: 40 })
    expect(media.filter((item) => item.kind === 'image')).toHaveLength(7)
    expect(media.filter((item) => item.kind === 'video')).toHaveLength(40)
    expect(media.filter((item) => item.hasAudio)).toHaveLength(40)
  })
})

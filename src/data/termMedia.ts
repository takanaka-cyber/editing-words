export type TermMedia =
  | { kind: 'image'; src: string; hasAudio: false }
  | { kind: 'video'; src: string; hasAudio: true }

const IMAGE_MEDIA_IDS = [
  'edge',
  'telop',
  'dropshadow',
  'rough',
  'font',
  'visibility',
  'blown-highlights',
] as const

const VIDEO_MEDIA_IDS = [
  'colorgrade',
  'offline-media',
  'transparent-asset',
  'safe-area',
  'resolution',
  'aspect-ratio',
  'audio-fade-out',
  'audio-fade-in',
  'pitch-shift',
  'pitch',
  'audio-sync',
  'noise-reduction',
  'noise',
  'se',
  'bgm',
  'color-temperature',
  'saturation',
  'contrast',
  'exposure',
  'wipe',
  'cross-dissolve',
  'transition',
  'tracking',
  'mask',
  'popup',
  'bounce',
  'shake',
  'pan',
  'zoom',
  'opacity',
  'crop',
  'eye-guidance',
  'line-height',
  'weight',
  'kerning',
  'glow',
  'zabuton',
  'pause',
  'insert',
  'jumpcut',
] as const

export const TERM_MEDIA: Readonly<Record<string, TermMedia>> = Object.freeze({
  ...Object.fromEntries(
    IMAGE_MEDIA_IDS.map(
      (id): [string, TermMedia] => [
        id,
        { kind: 'image', src: `assets/terms/media/${id}.png`, hasAudio: false },
      ],
    ),
  ),
  ...Object.fromEntries(
    VIDEO_MEDIA_IDS.map(
      (id): [string, TermMedia] => [
        id,
        { kind: 'video', src: `assets/terms/media/${id}.mp4`, hasAudio: true },
      ],
    ),
  ),
})

export const NEW_MEDIA_COUNTS = {
  total: IMAGE_MEDIA_IDS.length + VIDEO_MEDIA_IDS.length,
  image: IMAGE_MEDIA_IDS.length,
  video: VIDEO_MEDIA_IDS.length,
  audio: VIDEO_MEDIA_IDS.length,
} as const

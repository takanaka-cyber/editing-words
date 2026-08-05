import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: vi.fn().mockResolvedValue(undefined),
})

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: vi.fn(),
})

Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
  configurable: true,
  value: vi.fn().mockResolvedValue(undefined),
})

Object.defineProperty(document, 'exitFullscreen', {
  configurable: true,
  value: vi.fn().mockResolvedValue(undefined),
})

Object.defineProperty(document, 'fullscreenElement', {
  configurable: true,
  value: null,
})

afterEach(() => cleanup())

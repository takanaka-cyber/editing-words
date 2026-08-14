import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from './App'
import { TERMS } from './data/terms'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('55語を表示し、検索とカテゴリを同時に絞り込める', () => {
    render(<App />)

    expect(screen.getAllByRole('button', { name: /の詳細を見る$/ })).toHaveLength(55)
    fireEvent.change(screen.getAllByPlaceholderText('用語をさがす')[0], {
      target: { value: 'ノイズ' },
    })
    expect(screen.getAllByRole('button', { name: /の詳細を見る$/ }).length).toBeGreaterThan(0)

    fireEvent.click(screen.getAllByRole('button', { name: /^音 09$/ })[0])
    const visibleCards = screen.getAllByRole('button', { name: /の詳細を見る$/ })
    const audioNames = TERMS.filter((term) => term.cat === '音').map((term) => term.name)
    expect(
      visibleCards.every((button) =>
        audioNames.some((name) => button.getAttribute('aria-label') === `${name}の詳細を見る`),
      ),
    ).toBe(true)
  })

  it('詳細表示とブックマークをlocalStorageへ保存する', () => {
    render(<App />)

    fireEvent.click(
      screen.getByRole('button', {
        name: 'ジャンプカット / ジェットカットの詳細を見る',
      }),
    )
    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByRole('heading', {
        name: 'ジャンプカット / ジェットカット',
      }),
    ).toBeVisible()

    fireEvent.click(within(dialog).getByRole('button', { name: 'ブックマークに追加' }))
    expect(localStorage.getItem('ew-bookmarks')).toContain('jumpcut')
    expect(localStorage.getItem('ew-viewed')).toContain('jumpcut')
  })

  it('動画カードは無音で表示し、詳細画面だけ明示操作で音を再生する', async () => {
    render(<App />)

    const cardVideos = Array.from(
      document.querySelectorAll<HTMLVideoElement>('.term-card video'),
    )
    expect(cardVideos).toHaveLength(40)
    expect(cardVideos.every((video) => video.muted)).toBe(true)

    fireEvent.click(
      screen.getByRole('button', {
        name: 'ジャンプカット / ジェットカットの詳細を見る',
      }),
    )
    const dialog = screen.getByRole('dialog')
    const detailVideo = within(dialog).getByLabelText(
      'ジャンプカット / ジェットカットの参考動画',
    ) as HTMLVideoElement
    const soundButton = within(dialog).getByRole('button', { name: '音を再生' })

    expect(detailVideo.muted).toBe(true)
    fireEvent.click(soundButton)
    expect(detailVideo.muted).toBe(false)
    expect(soundButton).toHaveAttribute('aria-pressed', 'true')

    detailVideo.currentTime = 3.25
    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'ジャンプカット / ジェットカットを拡大表示',
      }),
    )
    expect(detailVideo.closest('.term-media')).toHaveClass('is-expanded')
    expect(
      within(dialog).getByLabelText('ジャンプカット / ジェットカットの参考動画'),
    ).toBe(detailVideo)
    expect(detailVideo.currentTime).toBe(3.25)
    expect(detailVideo.muted).toBe(false)

    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'ジャンプカット / ジェットカットを全画面表示',
      }),
    )
    expect(HTMLElement.prototype.requestFullscreen).toHaveBeenCalled()

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => {
      expect(detailVideo.closest('.term-media')).not.toHaveClass('is-expanded')
    })
    expect(dialog).toBeVisible()

    fireEvent.click(within(dialog).getByRole('button', { name: '音を止める' }))
    expect(detailVideo.muted).toBe(true)
  })

  it('音声トラックのない画像素材では音声操作を表示しない', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'エッジ（境界線）の詳細を見る' }))
    const dialog = screen.getByRole('dialog')

    expect(within(dialog).getByAltText('エッジ（境界線）の参考画像')).toBeVisible()
    expect(within(dialog).queryByRole('button', { name: /音を/ })).not.toBeInTheDocument()

    fireEvent.click(
      within(dialog).getByRole('button', { name: 'エッジ（境界線）を拡大表示' }),
    )
    expect(
      within(dialog).getByRole('button', { name: 'エッジ（境界線）を全画面表示' }),
    ).toBeVisible()
  })

  it(
    '全55語の詳細画面に拡大操作を表示する',
    () => {
      render(<App />)

      for (const term of TERMS) {
        fireEvent.click(
          screen.getByRole('button', { name: `${term.name}の詳細を見る` }),
        )
        const dialog = screen.getByRole('dialog')
        expect(
          within(dialog).getByRole('button', { name: `${term.name}を拡大表示` }),
        ).toBeVisible()
        fireEvent.click(within(dialog).getByRole('button', { name: '閉じる' }))
      }
    },
    15_000,
  )

  it('クイズメニューで3コースを表示し、5問コースの回答結果を表示する', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'クイズに挑戦 Q.' }))
    expect(screen.getByRole('button', { name: 'QUICK 5問を始める' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'STANDARD 20問を始める' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'MASTER 全55問を始める' })).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'QUICK 5問を始める' }))
    expect(screen.getByText('1 / 5')).toBeVisible()
    const choices = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.quiz-choice'),
    )
    expect(choices).toHaveLength(4)

    fireEvent.click(choices[0])
    expect(screen.getByText(/CORRECT!|MISS…/)).toBeVisible()
    expect(screen.getByRole('button', { name: /次の問題|結果を見る/ })).toBeVisible()
  })

  it('20問コースは数値とバーで進捗を表示する', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'クイズに挑戦 Q.' }))
    fireEvent.click(screen.getByRole('button', { name: 'STANDARD 20問を始める' }))

    expect(screen.getByText('1 / 20')).toBeVisible()
    expect(document.querySelector('.quiz-progress__bar')).toBeInTheDocument()
  })

  it('全問コースは現在の全55語で開始する', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'クイズに挑戦 Q.' }))
    fireEvent.click(screen.getByRole('button', { name: 'MASTER 全55問を始める' }))

    expect(screen.getByText('1 / 55')).toBeVisible()
    expect(document.querySelector('.quiz-progress__bar')).toBeInTheDocument()
  })

  it('進行中の回答状態を再読み込み後に続きから再開する', () => {
    const firstRender = render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'クイズに挑戦 Q.' }))
    fireEvent.click(screen.getByRole('button', { name: 'STANDARD 20問を始める' }))
    fireEvent.click(document.querySelectorAll<HTMLButtonElement>('.quiz-choice')[0])
    expect(screen.getByText(/CORRECT!|MISS…/)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '← 一覧にもどる' }))
    firstRender.unmount()

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'クイズに挑戦 Q.' }))
    expect(screen.getByText('1 / 20問目から再開')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '続きから →' }))

    expect(screen.getByText('1 / 20')).toBeVisible()
    expect(screen.getByText(/CORRECT!|MISS…/)).toBeVisible()
  })

  it('完了後にコース画面から新しく始めても進行中の確認を出さない', () => {
    const confirm = vi.spyOn(window, 'confirm')
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'クイズに挑戦 Q.' }))
    fireEvent.click(screen.getByRole('button', { name: 'QUICK 5問を始める' }))
    for (let index = 0; index < 5; index += 1) {
      fireEvent.click(document.querySelectorAll<HTMLButtonElement>('.quiz-choice')[0])
      fireEvent.click(screen.getByRole('button', { name: /次の問題|結果を見る/ }))
    }

    expect(document.querySelector('.score-ring')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Q. クイズ' }))
    fireEvent.click(screen.getByRole('button', { name: 'QUICK 5問を始める' }))

    expect(confirm).not.toHaveBeenCalled()
    expect(screen.getByText('1 / 5')).toBeVisible()
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import App from './App'
import { TERMS } from './data/terms'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('68語を表示し、検索とカテゴリを同時に絞り込める', () => {
    render(<App />)

    expect(screen.getAllByRole('button', { name: /の詳細を見る$/ })).toHaveLength(68)
    fireEvent.change(screen.getAllByPlaceholderText('用語をさがす')[0], {
      target: { value: '音量' },
    })
    expect(screen.getAllByRole('button', { name: /の詳細を見る$/ }).length).toBeGreaterThan(0)

    fireEvent.click(screen.getAllByRole('button', { name: /^音 11$/ })[0])
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

  it('選択式クイズを開始して回答結果を表示する', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'クイズに挑戦 Q.' }))
    expect(screen.getByText('1 / 5')).toBeVisible()
    const choices = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.quiz-choice'),
    )
    expect(choices).toHaveLength(4)

    fireEvent.click(choices[0])
    expect(screen.getByText(/CORRECT!|MISS…/)).toBeVisible()
    expect(screen.getByRole('button', { name: /次の問題|結果を見る/ })).toBeVisible()
  })
})

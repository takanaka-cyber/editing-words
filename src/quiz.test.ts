import { describe, expect, it } from 'vitest'
import { TERMS } from './data/terms'
import { createQuiz, maskAnswerTerm, stripOuterQuotes } from './quiz'

function deterministicRandom() {
  const values = [0.12, 0.71, 0.32, 0.94, 0.44, 0.03, 0.63, 0.26]
  let index = 0
  return () => {
    const value = values[index % values.length]
    index += 1
    return value
  }
}

describe('createQuiz', () => {
  it('5問を4形式の指定配分で生成する', () => {
    const questions = createQuiz(TERMS, deterministicRandom())
    const counts = questions.reduce<Record<string, number>>((result, question) => {
      result[question.kind] = (result[question.kind] ?? 0) + 1
      return result
    }, {})

    expect(questions).toHaveLength(5)
    expect(counts['example-to-term']).toBe(2)
    expect(counts['meaning-to-term']).toBe(1)
    expect(counts['term-to-meaning']).toBe(1)
    expect(counts.rewrite).toBe(1)
  })

  it('同じ形式を連続させず、正解を選択肢に含める', () => {
    const questions = createQuiz(TERMS, deterministicRandom())

    questions.forEach((question, index) => {
      expect(question.choices).toHaveLength(4)
      expect(question.choices.some((choice) => choice.id === question.correctChoiceId)).toBe(
        true,
      )
      if (index > 0) {
        expect(question.kind).not.toBe(questions[index - 1].kind)
      }
    })
  })

  it('5問で同じ用語を重複出題しない', () => {
    const questions = createQuiz(TERMS, deterministicRandom())
    const ids = questions.map((question) => question.answerTermId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('用語を当てる設問文に正解語を表示しない', () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      let state = seed
      const seededRandom = () => {
        state = (state * 16_807) % 2_147_483_647
        return (state - 1) / 2_147_483_646
      }

      const questions = createQuiz(TERMS, seededRandom)
      questions
        .filter(
          (question) =>
            question.kind === 'example-to-term' ||
            question.kind === 'meaning-to-term',
        )
        .forEach((question) => {
          const correctChoice = question.choices.find(
            (choice) => choice.id === question.correctChoiceId,
          )
          expect(correctChoice).toBeDefined()
          expect(question.prompt).not.toContain(correctChoice?.label)
        })
    }
  })
})

describe('stripOuterQuotes', () => {
  it('文全体を囲む括弧だけを外し、強調語の括弧は残す', () => {
    expect(stripOuterQuotes('「全体を囲む文」')).toBe('全体を囲む文')
    expect(stripOuterQuotes('「透明感」のテロップを青くしてください')).toBe(
      '「透明感」のテロップを青くしてください',
    )
  })
})

describe('maskAnswerTerm', () => {
  it('例文中の正解語を伏せ字にする', () => {
    const kerning = TERMS.find((term) => term.id === 'kerning')
    expect(kerning).toBeDefined()
    expect(maskAnswerTerm(kerning?.example ?? '', kerning!)).toBe(
      '「タイトルの＿＿＿＿を少し詰めてください」',
    )
  })

  it('括弧付き用語は例文中の略称も伏せ字にする', () => {
    const soundEffect = TERMS.find((term) => term.id === 'se')
    expect(soundEffect).toBeDefined()
    expect(maskAnswerTerm(soundEffect?.example ?? '', soundEffect!)).toBe(
      '「テロップの出現に合わせて＿＿＿＿を入れてください」',
    )
  })
})

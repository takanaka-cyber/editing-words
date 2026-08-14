import { beforeEach, describe, expect, it } from 'vitest'
import { TERMS } from './data/terms'
import { createQuiz } from './quiz'
import {
  ACTIVE_QUIZ_KEY,
  QUIZ_PROFILE_KEY,
  emptyQuizProfile,
  readActiveQuiz,
  readQuizProfile,
  recordQuizAnswer,
  writeActiveQuiz,
  writeQuizProfile,
  type QuizRun,
} from './quizProgress'

const TERM_IDS = new Set(TERMS.map((term) => term.id))

describe('quiz progress storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('正誤・連続正解・最終回答日時を用語別に保存して読み戻す', () => {
    let profile = emptyQuizProfile()
    profile = recordQuizAnswer(profile, TERMS[0].id, false, '2026-08-14T01:00:00.000Z')
    profile = recordQuizAnswer(profile, TERMS[0].id, true, '2026-08-14T02:00:00.000Z')
    writeQuizProfile(profile)

    const restored = readQuizProfile(TERM_IDS)
    expect(restored.termStats[TERMS[0].id]).toEqual({
      attempts: 2,
      correct: 1,
      wrong: 1,
      streak: 1,
      lastAnsweredAt: '2026-08-14T02:00:00.000Z',
    })
  })

  it('正本から消えた用語と壊れた値を読み込み時に除外する', () => {
    localStorage.setItem(
      QUIZ_PROFILE_KEY,
      JSON.stringify({
        version: 1,
        preferredMode: 'standard',
        termStats: {
          [TERMS[0].id]: { attempts: 2, correct: 1, wrong: 1, streak: 1 },
          removed: { attempts: 5, correct: 0, wrong: 5, streak: 0 },
        },
      }),
    )

    const restored = readQuizProfile(TERM_IDS)
    expect(restored.preferredMode).toBe('standard')
    expect(Object.keys(restored.termStats)).toEqual([TERMS[0].id])

    localStorage.setItem(QUIZ_PROFILE_KEY, '{broken')
    expect(readQuizProfile(TERM_IDS)).toEqual(emptyQuizProfile())
  })

  it('進行中の問題・回答位置・スコアを同じ正本版で読み戻す', () => {
    const questions = createQuiz(TERMS, { count: 20, random: () => 0.25 })
    const run: QuizRun = {
      version: 1,
      sourceSignature: 'source-v1',
      mode: 'standard',
      questions,
      index: 4,
      selectedId: questions[4].correctChoiceId,
      score: 3,
      wrongIds: [questions[0].answerTermId],
      startedAt: '2026-08-14T01:00:00.000Z',
    }
    writeActiveQuiz(run)

    expect(readActiveQuiz('source-v1', TERM_IDS)).toEqual(run)
    expect(readActiveQuiz('source-v2', TERM_IDS)).toBeNull()
    expect(localStorage.getItem(ACTIVE_QUIZ_KEY)).not.toBeNull()
  })
})

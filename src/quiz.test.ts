import { describe, expect, it } from 'vitest'
import { SOURCE_SNAPSHOT, TERMS } from './data/terms'
import {
  buildQuestion,
  createQuiz,
  formatQuizTermName,
  getTermAliases,
  isEligibleForKind,
  maskAnswerTerm,
  questionCountForMode,
  stripOuterQuotes,
  type QuizKind,
  type TermQuizStat,
} from './quiz'

function deterministicRandom() {
  const values = [0.12, 0.71, 0.32, 0.94, 0.44, 0.03, 0.63, 0.26]
  let index = 0
  return () => {
    const value = values[index % values.length]
    index += 1
    return value
  }
}

function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 16_807) % 2_147_483_647
    return (state - 1) / 2_147_483_646
  }
}

const QUIZ_KINDS: QuizKind[] = [
  'example-to-term',
  'meaning-to-term',
  'term-to-meaning',
  'rewrite',
]

describe('createQuiz', () => {
  it('正本スナップショット55語を重複なしで保持する', () => {
    expect(TERMS).toHaveLength(SOURCE_SNAPSHOT.rowCount)
    expect(new Set(TERMS.map((term) => term.id)).size).toBe(55)
    expect(TERMS.filter((term) => term.cat === '映像')).toHaveLength(33)
    expect(TERMS.filter((term) => term.cat === '音')).toHaveLength(9)
    expect(TERMS.filter((term) => term.cat === 'その他')).toHaveLength(13)
    expect(TERMS.map((term) => term.tile)).toEqual(
      TERMS.map((term) => `assets/terms/${term.id}.png`),
    )
    expect(TERMS.map((term) => term.sourceRow)).toEqual(
      Array.from({ length: 55 }, (_, index) => index + 2),
    )
  })

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

  it('20問を重複なし・4択・同一形式の連続なしで生成する', () => {
    const questions = createQuiz(TERMS, {
      count: 20,
      random: deterministicRandom(),
    })

    expect(questions).toHaveLength(20)
    expect(new Set(questions.map((question) => question.answerTermId)).size).toBe(20)
    questions.forEach((question, index) => {
      expect(question.choices).toHaveLength(4)
      expect(question.choices.some((choice) => choice.id === question.correctChoiceId)).toBe(
        true,
      )
      if (index > 0) expect(question.kind).not.toBe(questions[index - 1].kind)
    })
  })

  it('全問では55語を1回ずつ出題する', () => {
    const questions = createQuiz(TERMS, {
      count: TERMS.length,
      random: deterministicRandom(),
    })
    const questionIds = questions.map((question) => question.answerTermId)

    expect(questions).toHaveLength(55)
    expect(new Set(questionIds)).toEqual(new Set(TERMS.map((term) => term.id)))
    questions.forEach((question, index) => {
      if (index > 0) expect(question.kind).not.toBe(questions[index - 1].kind)
    })
  })

  it('5問では間違い履歴のある用語を半数以上優先する', () => {
    const stats = Object.fromEntries(
      TERMS.slice(0, 8).map((term, index) => [
        term.id,
        {
          attempts: 4,
          correct: index,
          wrong: 4 - index,
          streak: 0,
          lastAnsweredAt: '2026-08-14T00:00:00.000Z',
        } satisfies TermQuizStat,
      ]),
    )
    const questions = createQuiz(TERMS, {
      count: 5,
      stats,
      random: deterministicRandom(),
    })
    const weakIds = new Set(Object.keys(stats).filter((id) => stats[id].wrong > 0))

    expect(
      questions.filter((question) => weakIds.has(question.answerTermId)),
    ).toHaveLength(3)
  })

  it('用語を当てる設問文に正解語を表示しない', () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const questions = createQuiz(TERMS, seededRandom(seed))
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
          const answer = TERMS.find((term) => term.id === question.answerTermId)
          expect(answer).toBeDefined()
          getTermAliases(answer!).forEach((alias) => {
            expect(question.prompt).not.toContain(alias)
          })
        })
    }
  })

  it('全用語×全出題可能形式で正解が1件だけ存在し、選択肢が重複しない', () => {
    let audited = 0
    const auditedByKind: Record<QuizKind, number> = {
      'example-to-term': 0,
      'meaning-to-term': 0,
      'term-to-meaning': 0,
      rewrite: 0,
    }

    for (const kind of QUIZ_KINDS) {
      for (const term of TERMS.filter((candidate) => isEligibleForKind(candidate, kind))) {
        const question = buildQuestion(kind, term, TERMS, seededRandom(audited + 1), audited)
        audited += 1
        auditedByKind[kind] += 1

        expect(question.answerTermId).toBe(term.id)
        expect(question.choices).toHaveLength(4)
        expect(
          question.choices.filter((choice) => choice.id === question.correctChoiceId),
        ).toHaveLength(1)
        expect(new Set(question.choices.map((choice) => choice.id)).size).toBe(4)
        expect(new Set(question.choices.map((choice) => choice.label)).size).toBe(4)
        expect(question.answerName).not.toContain('（）')
        question.choices.forEach((choice) => {
          expect(choice.label).not.toContain('（）')
        })

        if (kind === 'example-to-term') {
          expect(question.prompt).toContain('＿＿＿＿')
          getTermAliases(term).forEach((alias) => {
            expect(question.prompt).not.toContain(alias)
          })
        }

        if (kind === 'meaning-to-term') {
          getTermAliases(term).forEach((alias) => {
            expect(question.prompt).not.toContain(alias)
          })
        }

        if (kind === 'rewrite') {
          expect(question.prompt).toContain('意図を変えず')
          expect(question.choices.find((choice) => choice.id === term.id)?.label).toBe(
            term.goodExample,
          )
        }
      }
    }

    expect(auditedByKind).toEqual({
      'example-to-term': 54,
      'meaning-to-term': 52,
      'term-to-meaning': 55,
      rewrite: 14,
    })
    expect(audited).toBe(175)
  })

  it('5問・20問・全55問を100通り生成して構造を検査する', () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      for (const count of [5, 20, 55]) {
        const questions = createQuiz(TERMS, {
          count,
          random: seededRandom(seed * 100 + count),
        })

        expect(questions).toHaveLength(count)
        expect(new Set(questions.map((question) => question.answerTermId)).size).toBe(
          count,
        )
        questions.forEach((question, index) => {
          expect(question.choices).toHaveLength(4)
          expect(
            question.choices.filter(
              (choice) => choice.id === question.correctChoiceId,
            ),
          ).toHaveLength(1)
          expect(new Set(question.choices.map((choice) => choice.label)).size).toBe(4)
          if (index > 0) expect(question.kind).not.toBe(questions[index - 1].kind)
        })
      }
    }
  })
})

describe('questionCountForMode', () => {
  it('5問・20問・全問を現在の用語数以内で返す', () => {
    expect(questionCountForMode('quick', 55)).toBe(5)
    expect(questionCountForMode('standard', 55)).toBe(20)
    expect(questionCountForMode('master', 55)).toBe(55)
    expect(questionCountForMode('standard', 12)).toBe(12)
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

describe('formatQuizTermName', () => {
  it('正本に残る末尾の空括弧をクイズ表示だけから除く', () => {
    expect(formatQuizTermName('タイムコード（）')).toBe('タイムコード')
    expect(formatQuizTermName('フェードイン（音）')).toBe('フェードイン（音）')
  })
})

describe('maskAnswerTerm', () => {
  it('例文中の正解語を伏せ字にする', () => {
    const kerning = TERMS.find((term) => term.id === 'kerning')
    expect(kerning).toBeDefined()
    expect(maskAnswerTerm(kerning?.example ?? '', kerning!)).toBe(
      '「タイトル文字の＿＿＿＿を少し詰めて（＿＿＿＿して）、まとまり感を出してください」',
    )
  })

  it('括弧付き用語は例文中の略称も伏せ字にする', () => {
    const soundEffect = TERMS.find((term) => term.id === 'se')
    expect(soundEffect).toBeDefined()
    expect(maskAnswerTerm(soundEffect?.example ?? '', soundEffect!)).toBe(
      '「テロップが出る瞬間に、注意を引くための＿＿＿＿（効果音）を追加してください」',
    )
  })

  it('スラッシュ区切りと活用形の別名も伏せ字にする', () => {
    const jumpcut = TERMS.find((term) => term.id === 'jumpcut')
    const pause = TERMS.find((term) => term.id === 'pause')
    expect(maskAnswerTerm(jumpcut?.example ?? '', jumpcut!)).not.toContain(
      'ジャンプカット',
    )
    expect(maskAnswerTerm(pause?.example ?? '', pause!)).not.toContain(
      'タメを作',
    )
  })
})

describe('rewrite intent contracts', () => {
  const anchors: Record<string, string[]> = {
    jumpcut: ['冒頭5秒', '間'],
    insert: ['00:05', '手元'],
    rough: ['構成', 'テンポ'],
    telop: ['毛穴ケア', '0.5秒'],
    font: ['手書き', '親'],
    zabuton: ['白文字', '不透明度50%', '黒'],
    edge: ['タイトル文字', '白', '細'],
    glow: ['透明感', '薄い青', 'ツヤ'],
    kerning: ['メインキャッチ', '少し詰め', 'まとまり'],
    weight: ['無料'],
    transition: ['00:08', 'ズーム'],
    colorgrade: ['透明感', '青み'],
    timecode: ['15', 'テロップ', '赤色'],
    tonemana: ['ピンク', '明朝体', '統一'],
  }

  it('全14組で曖昧な依頼と明確な依頼の中核意図が一致する', () => {
    const rewriteTerms = TERMS.filter((term) => term.badExample && term.goodExample)
    expect(rewriteTerms).toHaveLength(14)
    expect(new Set(rewriteTerms.map((term) => term.id))).toEqual(
      new Set(Object.keys(anchors)),
    )

    rewriteTerms.forEach((term) => {
      anchors[term.id].forEach((anchor) => {
        expect(term.badExample).toContain(anchor)
        expect(term.goodExample).toContain(anchor)
      })
    })
  })

  it('粗編集の設問は完成まで作り込む意図へ反転しない', () => {
    const rough = TERMS.find((term) => term.id === 'rough')
    expect(rough?.badExample).not.toMatch(/完璧|作り込/)
    expect(rough?.badExample).toContain('構成とテンポ')
    expect(rough?.goodExample).toContain('粗編集')
  })
})

import type { Term } from './data/terms'

export type QuizKind =
  | 'example-to-term'
  | 'meaning-to-term'
  | 'term-to-meaning'
  | 'rewrite'

export type QuizChoice = {
  id: string
  label: string
}

export type QuizQuestion = {
  id: string
  kind: QuizKind
  formatLabel: string
  lead: string
  prompt: string
  choices: QuizChoice[]
  correctChoiceId: string
  answerTermId: string
  answerName: string
  explanation: string
}

type RandomSource = () => number

const KIND_ORDERS: QuizKind[][] = [
  [
    'example-to-term',
    'meaning-to-term',
    'rewrite',
    'term-to-meaning',
    'example-to-term',
  ],
  [
    'meaning-to-term',
    'example-to-term',
    'rewrite',
    'example-to-term',
    'term-to-meaning',
  ],
  [
    'rewrite',
    'example-to-term',
    'meaning-to-term',
    'term-to-meaning',
    'example-to-term',
  ],
  [
    'example-to-term',
    'rewrite',
    'term-to-meaning',
    'example-to-term',
    'meaning-to-term',
  ],
]

export function shuffle<T>(items: T[], random: RandomSource = Math.random): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

export function stripOuterQuotes(value: string): string {
  return value.startsWith('「') && value.endsWith('」') ? value.slice(1, -1) : value
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function getTermAliases(term: Term): string[] {
  const names = term.name
    .split(/\s*\/\s*/)
    .flatMap((name) => {
      const withoutParentheses = name.split(/[（(]/)[0].trim()
      const parenthetical = [...name.matchAll(/[（(]([^）)]*)[）)]/g)]
        .map((match) => match[1].trim())
        .filter(Boolean)
      return [name.trim(), withoutParentheses, ...parenthetical]
    })
    .filter(Boolean)

  const verbStems = names
    .filter((name) => /[るす]$/.test(name))
    .map((name) => name.slice(0, -1))
    .filter((name) => name.length >= 3)

  return [...new Set([...names, ...verbStems])].sort(
    (left, right) => right.length - left.length,
  )
}

export function maskAnswerTerm(value: string, term: Term): string {
  return getTermAliases(term).reduce(
    (masked, alias) =>
      masked.replace(new RegExp(escapeRegExp(alias), 'gi'), '＿＿＿＿'),
    value,
  )
}

function takeTerm(
  pool: Term[],
  used: Set<string>,
  predicate: (term: Term) => boolean = () => true,
): Term {
  const term = pool.find((candidate) => !used.has(candidate.id) && predicate(candidate))
  if (!term) {
    throw new Error('クイズを生成できる用語が不足しています')
  }
  used.add(term.id)
  return term
}

function isEligibleForKind(term: Term, kind: QuizKind): boolean {
  if (kind === 'example-to-term') {
    return true
  }

  if (kind === 'meaning-to-term') {
    return !getTermAliases(term).some((alias) => term.meaning.includes(alias))
  }

  if (kind === 'rewrite') {
    return Boolean(term.badExample && term.goodExample)
  }

  return true
}

function getChoiceTerms(
  correct: Term,
  terms: Term[],
  random: RandomSource,
): Term[] {
  const sameCategory = shuffle(
    terms.filter((term) => term.id !== correct.id && term.cat === correct.cat),
    random,
  )
  const otherCategory = shuffle(
    terms.filter((term) => term.id !== correct.id && term.cat !== correct.cat),
    random,
  )
  const distractors = [...sameCategory, ...otherCategory].slice(0, 3)
  return shuffle([correct, ...distractors], random)
}

function buildQuestion(
  kind: QuizKind,
  term: Term,
  terms: Term[],
  random: RandomSource,
  sequence: number,
): QuizQuestion {
  const choiceTerms = getChoiceTerms(
    term,
    terms.filter((candidate) => isEligibleForKind(candidate, kind)),
    random,
  )
  const base = {
    id: `${sequence}-${kind}-${term.id}`,
    kind,
    correctChoiceId: term.id,
    answerTermId: term.id,
    answerName: term.name,
    explanation: term.meaning,
  }

  if (kind === 'example-to-term') {
    return {
      ...base,
      formatLabel: 'HOW TO ASK',
      lead: 'この依頼、どの用語のこと？',
      prompt: maskAnswerTerm(term.example, term),
      choices: choiceTerms.map((choice) => ({
        id: choice.id,
        label: choice.name,
      })),
    }
  }

  if (kind === 'meaning-to-term') {
    return {
      ...base,
      formatLabel: 'MEANING',
      lead: 'この説明に当てはまる用語は？',
      prompt: term.meaning,
      choices: choiceTerms.map((choice) => ({
        id: choice.id,
        label: choice.name,
      })),
    }
  }

  if (kind === 'term-to-meaning') {
    return {
      ...base,
      formatLabel: 'MATCH',
      lead: '用語と意味を正しく結びつけよう',
      prompt: `「${term.name}」の説明として正しいものは？`,
      choices: choiceTerms.map((choice) => ({
        id: choice.id,
        label: choice.meaning,
      })),
    }
  }

  return {
    ...base,
    formatLabel: 'REWRITE',
    lead: '曖昧な依頼を、編集者へ伝わる言葉に',
    prompt: `「${term.badExample}」を、より具体的に直すと？`,
    choices: choiceTerms.map((choice) => ({
      id: choice.id,
      label: stripOuterQuotes(choice.goodExample ?? choice.example),
    })),
  }
}

export function createQuiz(
  terms: Term[],
  random: RandomSource = Math.random,
): QuizQuestion[] {
  if (terms.length < 5) {
    throw new Error('クイズには5語以上が必要です')
  }

  const pool = shuffle(terms, random)
  const used = new Set<string>()
  const kindOrder =
    KIND_ORDERS[Math.floor(random() * KIND_ORDERS.length)] ?? KIND_ORDERS[0]

  return kindOrder.map((kind, index) => {
    const requestedKind =
      !pool.some(
        (term) => !used.has(term.id) && isEligibleForKind(term, kind),
      )
        ? 'meaning-to-term'
        : kind
    const term = takeTerm(
      pool,
      used,
      (candidate) => isEligibleForKind(candidate, requestedKind),
    )
    return buildQuestion(requestedKind, term, terms, random, index)
  })
}

import type { QuizMode, QuizQuestion, TermQuizStat } from './quiz'

export const QUIZ_PROFILE_KEY = 'ew-quiz-profile-v1'
export const ACTIVE_QUIZ_KEY = 'ew-quiz-active-v1'

const STORAGE_VERSION = 1
const VALID_MODES: QuizMode[] = ['quick', 'standard', 'master']

export type QuizProfile = {
  version: typeof STORAGE_VERSION
  preferredMode: QuizMode
  termStats: Record<string, TermQuizStat>
}

export type QuizRun = {
  version: typeof STORAGE_VERSION
  sourceSignature: string
  mode: QuizMode
  questions: QuizQuestion[]
  index: number
  selectedId: string | null
  score: number
  wrongIds: string[]
  startedAt: string
}

export function emptyQuizProfile(): QuizProfile {
  return {
    version: STORAGE_VERSION,
    preferredMode: 'quick',
    termStats: {},
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isMode(value: unknown): value is QuizMode {
  return typeof value === 'string' && VALID_MODES.includes(value as QuizMode)
}

function toNonNegativeInteger(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0
}

function sanitizeStat(value: unknown): TermQuizStat | null {
  if (!isRecord(value)) return null
  const attempts = toNonNegativeInteger(value.attempts)
  const correct = Math.min(toNonNegativeInteger(value.correct), attempts)
  const wrong = Math.min(toNonNegativeInteger(value.wrong), attempts)
  return {
    attempts,
    correct,
    wrong,
    streak: Math.min(toNonNegativeInteger(value.streak), correct),
    lastAnsweredAt:
      typeof value.lastAnsweredAt === 'string' ? value.lastAnsweredAt : null,
  }
}

export function readQuizProfile(validTermIds: Set<string>): QuizProfile {
  try {
    const value = JSON.parse(localStorage.getItem(QUIZ_PROFILE_KEY) ?? 'null')
    if (!isRecord(value) || value.version !== STORAGE_VERSION) {
      return emptyQuizProfile()
    }
    const termStats: Record<string, TermQuizStat> = {}
    if (isRecord(value.termStats)) {
      Object.entries(value.termStats).forEach(([termId, rawStat]) => {
        const stat = sanitizeStat(rawStat)
        if (validTermIds.has(termId) && stat) termStats[termId] = stat
      })
    }
    return {
      version: STORAGE_VERSION,
      preferredMode: isMode(value.preferredMode) ? value.preferredMode : 'quick',
      termStats,
    }
  } catch {
    return emptyQuizProfile()
  }
}

export function writeQuizProfile(profile: QuizProfile) {
  try {
    localStorage.setItem(QUIZ_PROFILE_KEY, JSON.stringify(profile))
  } catch {
    // The current in-memory learning profile remains usable when storage is blocked.
  }
}

export function recordQuizAnswer(
  profile: QuizProfile,
  termId: string,
  correct: boolean,
  answeredAt = new Date().toISOString(),
): QuizProfile {
  const current = profile.termStats[termId] ?? {
    attempts: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    lastAnsweredAt: null,
  }
  return {
    ...profile,
    termStats: {
      ...profile.termStats,
      [termId]: {
        attempts: current.attempts + 1,
        correct: current.correct + (correct ? 1 : 0),
        wrong: current.wrong + (correct ? 0 : 1),
        streak: correct ? current.streak + 1 : 0,
        lastAnsweredAt: answeredAt,
      },
    },
  }
}

function isQuestion(value: unknown, validTermIds: Set<string>): value is QuizQuestion {
  if (!isRecord(value) || !validTermIds.has(String(value.answerTermId))) return false
  if (!Array.isArray(value.choices) || value.choices.length !== 4) return false
  return (
    typeof value.id === 'string' &&
    typeof value.correctChoiceId === 'string' &&
    value.choices.some(
      (choice) =>
        isRecord(choice) && choice.id === value.correctChoiceId,
    )
  )
}

export function readActiveQuiz(
  sourceSignature: string,
  validTermIds: Set<string>,
): QuizRun | null {
  try {
    const value = JSON.parse(localStorage.getItem(ACTIVE_QUIZ_KEY) ?? 'null')
    if (
      !isRecord(value) ||
      value.version !== STORAGE_VERSION ||
      value.sourceSignature !== sourceSignature ||
      !isMode(value.mode) ||
      !Array.isArray(value.questions) ||
      value.questions.length === 0 ||
      !value.questions.every((question) => isQuestion(question, validTermIds))
    ) {
      return null
    }
    const index = toNonNegativeInteger(value.index)
    if (index >= value.questions.length) return null
    const question = value.questions[index] as QuizQuestion
    const selectedId =
      typeof value.selectedId === 'string' &&
      question.choices.some((choice) => choice.id === value.selectedId)
        ? value.selectedId
        : null
    return {
      version: STORAGE_VERSION,
      sourceSignature,
      mode: value.mode,
      questions: value.questions as QuizQuestion[],
      index,
      selectedId,
      score: Math.min(toNonNegativeInteger(value.score), value.questions.length),
      wrongIds: Array.isArray(value.wrongIds)
        ? value.wrongIds.filter(
            (termId): termId is string =>
              typeof termId === 'string' && validTermIds.has(termId),
          )
        : [],
      startedAt:
        typeof value.startedAt === 'string'
          ? value.startedAt
          : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function writeActiveQuiz(run: QuizRun) {
  try {
    localStorage.setItem(ACTIVE_QUIZ_KEY, JSON.stringify(run))
  } catch {
    // The current in-memory run remains usable when storage is blocked.
  }
}

export function clearActiveQuiz() {
  try {
    localStorage.removeItem(ACTIVE_QUIZ_KEY)
  } catch {
    // Nothing else is required when storage is blocked.
  }
}

export function weakTermCount(profile: QuizProfile): number {
  return Object.values(profile.termStats).filter(
    (stat) => stat.wrong > 0 && stat.wrong * 3 + (stat.wrong / stat.attempts) * 4 - stat.streak * 1.5 > 0,
  ).length
}

export function answeredQuestionCount(profile: QuizProfile): number {
  return Object.values(profile.termStats).reduce(
    (total, stat) => total + stat.attempts,
    0,
  )
}

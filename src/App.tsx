import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react'
import { TERMS, type Term } from './data/terms'
import { createQuiz, type QuizQuestion } from './quiz'

type Filter = 'all' | '映像' | '音' | 'bookmarks'
type Screen = 'home' | 'quiz' | 'result'

type QuizRun = {
  questions: QuizQuestion[]
  index: number
  selectedId: string | null
  score: number
  wrongIds: string[]
}

const FILTER_LABELS: Record<Filter, { en: string; ja: string }> = {
  all: { en: 'ALL TERMS', ja: 'すべての用語' },
  映像: { en: 'VIDEO TERMS', ja: '映像の用語' },
  音: { en: 'AUDIO TERMS', ja: '音の用語' },
  bookmarks: { en: 'BOOKMARKS', ja: 'ブックマーク' },
}

const LETTERS = ['A', 'B', 'C', 'D']

function readStoredIds(key: string): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    return []
  }
}

function writeStoredIds(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage may be blocked. The in-memory state remains usable.
  }
}

function ScissorsIcon({ size = 25 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
    >
      <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="7" cy="21" r="3" stroke="currentColor" strokeWidth="2.2" />
      <path d="M9.5 9.2 23 22M9.5 18.8 23 6" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  )
}

function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
      <path
        d="M6 3h12v18l-6-5-6 5z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="10.5" cy="10.5" r="6" stroke="currentColor" strokeWidth="2" />
      <path d="m15 15 5 5" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d={direction === 'left' ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="miter"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="m5 13 4 4 10-10" stroke="currentColor" strokeWidth="2.7" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.7" />
    </svg>
  )
}

function Equalizer({ compact = false }: { compact?: boolean }) {
  const count = compact ? 5 : 9
  return (
    <div className={`equalizer ${compact ? 'equalizer--compact' : ''}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          style={
            {
              '--bar-index': index,
              '--bar-height': `${8 + ((index * 7) % 18)}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

function Logo({ onClick }: { onClick: () => void }) {
  return (
    <button className="logo" type="button" onClick={onClick} aria-label="用語一覧へ">
      <span className="logo__mark">
        <ScissorsIcon />
      </span>
      <span className="logo__type">
        EDITING<span className="logo__mobile-space"> </span>
        <br />
        WORDS<span className="logo__period">.</span>
      </span>
    </button>
  )
}

function Confetti({ count = 26 }: { count?: number }) {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          style={
            {
              '--confetti-index': index,
              '--confetti-left': `${(index * 37) % 98}%`,
              '--confetti-delay': `${(index % 7) * 0.045}s`,
              '--confetti-duration': `${0.9 + (index % 8) * 0.11}s`,
              '--confetti-width': `${5 + (index % 8)}px`,
              '--confetti-height': `${6 + ((index * 3) % 10)}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

function Sidebar({
  filter,
  bookmarks,
  viewed,
  onFilter,
  onHome,
  onQuiz,
}: {
  filter: Filter
  bookmarks: string[]
  viewed: string[]
  onFilter: (filter: Filter) => void
  onHome: () => void
  onQuiz: () => void
}) {
  const items: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'すべて', count: TERMS.length },
    { id: '映像', label: '映像', count: TERMS.filter((term) => term.cat === '映像').length },
    { id: '音', label: '音', count: TERMS.filter((term) => term.cat === '音').length },
    { id: 'bookmarks', label: 'ブックマーク', count: bookmarks.length },
  ]

  return (
    <aside className="sidebar">
      <Logo onClick={onHome} />
      <p className="sidebar__eyebrow">GLOSSARY</p>
      <nav className="sidebar__nav" aria-label="用語カテゴリ">
        {items.map((item) => (
          <button
            key={item.id}
            className={`filter-button filter-button--${item.id} ${
              filter === item.id ? 'is-active' : ''
            }`}
            type="button"
            onClick={() => onFilter(item.id)}
          >
            <span className="filter-button__dot" />
            <span>{item.label}</span>
            <span className="filter-button__count">
              {String(item.count).padStart(2, '0')}
            </span>
          </button>
        ))}
      </nav>
      <button className="coral-cta sidebar__quiz" type="button" onClick={onQuiz}>
        <span>クイズに挑戦</span>
        <span className="oswald">Q.</span>
      </button>
      <div className="sidebar__spacer" />
      <div className="viewed-box">
        <div>
          <span>みた用語</span>
          <span className="oswald">
            {viewed.length} / {TERMS.length}
          </span>
        </div>
        <span className="viewed-box__track">
          <span style={{ width: `${(viewed.length / TERMS.length) * 100}%` }} />
        </span>
      </div>
      <Equalizer />
      <p className="sidebar__caption">VIDEO &amp; AUDIO COMMON LANGUAGE</p>
    </aside>
  )
}

function MobileHeader({ onHome }: { onHome: () => void }) {
  return (
    <header className="mobile-header">
      <Logo onClick={onHome} />
      <Equalizer compact />
    </header>
  )
}

function Marquee() {
  const text = TERMS.map((term) => term.en).join('  ●  ')
  return (
    <>
      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          <span>{text}&nbsp;&nbsp;●&nbsp;&nbsp;</span>
          <span>{text}&nbsp;&nbsp;●&nbsp;&nbsp;</span>
        </div>
      </div>
      <div className="timeline-ruler" aria-hidden="true">
        <span />
      </div>
    </>
  )
}

function SearchBox({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="search-box">
      <SearchIcon />
      <span className="sr-only">用語をさがす</span>
      <input
        type="search"
        placeholder="用語をさがす"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function MobileFilters({
  filter,
  bookmarks,
  onFilter,
}: {
  filter: Filter
  bookmarks: string[]
  onFilter: (filter: Filter) => void
}) {
  const items: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'すべて', count: TERMS.length },
    { id: '映像', label: '映像', count: TERMS.filter((term) => term.cat === '映像').length },
    { id: '音', label: '音', count: TERMS.filter((term) => term.cat === '音').length },
    { id: 'bookmarks', label: 'ブックマーク', count: bookmarks.length },
  ]
  return (
    <div className="mobile-filters" aria-label="用語カテゴリ">
      {items.map((item) => (
        <button
          key={item.id}
          className={`mobile-filter mobile-filter--${item.id} ${
            filter === item.id ? 'is-active' : ''
          }`}
          type="button"
          onClick={() => onFilter(item.id)}
        >
          <span className="filter-button__dot" />
          {item.label}
          <span className="oswald">{String(item.count).padStart(2, '0')}</span>
        </button>
      ))}
    </div>
  )
}

function TermCard({
  term,
  index,
  bookmarked,
  onOpen,
  onBookmark,
}: {
  term: Term
  index: number
  bookmarked: boolean
  onOpen: () => void
  onBookmark: (event: MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <article
      className="term-card"
      style={{ '--card-delay': `${(index % 12) * 40}ms` } as CSSProperties}
    >
      <button
        type="button"
        className="term-card__open"
        onClick={onOpen}
        aria-label={`${term.name}の詳細を見る`}
      />
      <div
        className="term-card__tile"
        style={{ backgroundImage: `url("${term.tile}")` }}
        aria-hidden="true"
      />
      <button
        type="button"
        className={`bookmark-button ${bookmarked ? 'is-active' : ''}`}
        onClick={onBookmark}
        aria-label={bookmarked ? `${term.name}のブックマークを外す` : `${term.name}をブックマーク`}
      >
        <BookmarkIcon filled={bookmarked} />
      </button>
      <div className="term-card__body">
        <h2>{term.name}</h2>
        <p className="term-card__en">{term.en}</p>
        <div>
          <span className={`category-chip category-chip--${term.cat}`}>{term.cat}</span>
          <span className="oswald" aria-hidden="true">
            →
          </span>
        </div>
      </div>
    </article>
  )
}

function EmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="empty-state">
      <img src="assets/search-empty.png" alt="" />
      <p>「{query}」に合う用語が見つかりませんでした</p>
      <button type="button" onClick={onClear}>
        検索をクリア
      </button>
    </div>
  )
}

function DetailPanel({
  term,
  current,
  total,
  bookmarked,
  onClose,
  onMove,
  onBookmark,
}: {
  term: Term
  current: number
  total: number
  bookmarked: boolean
  onClose: () => void
  onMove: (delta: number) => void
  onBookmark: () => void
}) {
  return (
    <div className="detail-overlay" onMouseDown={onClose}>
      <section
        className="detail-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="detail-panel__nav">
          <button type="button" onClick={() => onMove(-1)} aria-label="前の用語">
            <ChevronIcon direction="left" />
          </button>
          <button type="button" onClick={() => onMove(1)} aria-label="次の用語">
            <ChevronIcon direction="right" />
          </button>
          <span className="oswald">
            {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <button
            className="detail-panel__close"
            type="button"
            onClick={onClose}
            aria-label="閉じる"
          >
            <CrossIcon />
          </button>
        </div>
        <div className="detail-panel__content">
          <div className="detail-panel__meta">
            <span className={`category-chip category-chip--${term.cat}`}>{term.cat}系</span>
            <span className="oswald">{term.en}</span>
          </div>
          <h2 id="detail-title">{term.name}</h2>
          <div
            className="detail-panel__hero"
            style={{ backgroundImage: `url("${term.tile}")` }}
            role="img"
            aria-label={`${term.name}の抽象グラフィック`}
          />
          <div className="detail-section-title detail-section-title--meaning">
            <span />
            <strong>意味</strong>
            <small className="oswald">MEANING</small>
            <i />
          </div>
          <p className="detail-panel__meaning">{term.meaning}</p>
          <div className="detail-section-title detail-section-title--example">
            <span />
            <strong>依頼のしかた</strong>
            <small className="oswald">HOW TO ASK</small>
            <i />
          </div>
          <p className="detail-panel__example">{term.example}</p>
          <button
            type="button"
            className={`detail-panel__bookmark ${bookmarked ? 'is-active' : ''}`}
            onClick={onBookmark}
          >
            <BookmarkIcon filled={bookmarked} />
            {bookmarked ? 'ブックマーク済み' : 'ブックマークに追加'}
          </button>
        </div>
      </section>
    </div>
  )
}

function QuizView({
  run,
  onBack,
  onAnswer,
  onNext,
}: {
  run: QuizRun
  onBack: () => void
  onAnswer: (id: string) => void
  onNext: () => void
}) {
  const question = run.questions[run.index]
  const answered = run.selectedId !== null
  const correct = run.selectedId === question.correctChoiceId

  return (
    <section className="quiz-screen">
      <div className="quiz-topbar">
        <button type="button" onClick={onBack}>
          ← 一覧にもどる
        </button>
        <div className="quiz-progress" aria-label={`${run.index + 1}問目／全${run.questions.length}問`}>
          <div aria-hidden="true">
            {run.questions.map((item, index) => (
              <span
                key={item.id}
                className={`${index < run.index ? 'is-done' : ''} ${
                  index === run.index ? 'is-current' : ''
                }`}
              />
            ))}
          </div>
          <strong className="oswald">
            {run.index + 1} / {run.questions.length}
          </strong>
        </div>
      </div>
      <div className="quiz-stage">
        <div className="quiz-question" key={question.id}>
          <div>
            <span className="quiz-question__number oswald">Q{run.index + 1}.</span>
            <span>{question.lead}</span>
            <span className="quiz-question__format oswald">{question.formatLabel}</span>
          </div>
          <p>{question.prompt}</p>
        </div>
        <div
          className={`quiz-choices ${
            question.kind === 'term-to-meaning' || question.kind === 'rewrite'
              ? 'quiz-choices--long'
              : ''
          }`}
        >
          {question.choices.map((choice, index) => {
            const isAnswer = choice.id === question.correctChoiceId
            const isSelected = choice.id === run.selectedId
            const status = answered
              ? isAnswer
                ? 'is-correct'
                : isSelected
                  ? 'is-wrong'
                  : 'is-muted'
              : ''
            return (
              <button
                key={choice.id}
                className={`quiz-choice ${status}`}
                type="button"
                onClick={() => onAnswer(choice.id)}
                disabled={answered}
                style={{ '--choice-delay': `${index * 70}ms` } as CSSProperties}
              >
                <span className="quiz-choice__letter oswald">{LETTERS[index]}</span>
                <span>{choice.label}</span>
                {answered && isAnswer && (
                  <span className="quiz-choice__status">
                    <CheckIcon />
                  </span>
                )}
                {answered && isSelected && !isAnswer && (
                  <span className="quiz-choice__status">
                    <CrossIcon />
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {answered && (
          <div className={`quiz-feedback ${correct ? 'is-correct' : 'is-wrong'}`}>
            {correct && <Confetti />}
            <div>
              <strong className="oswald">{correct ? 'CORRECT!' : 'MISS…'}</strong>
              <span>{correct ? ' 正解' : ' 正解は'}</span>
              <b>{question.answerName}</b>
            </div>
            <p>{question.explanation}</p>
            <button className="coral-cta" type="button" onClick={onNext}>
              {run.index === run.questions.length - 1 ? '結果を見る →' : '次の問題 →'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function ResultView({
  run,
  onRetry,
  onHome,
  onReview,
}: {
  run: QuizRun
  onRetry: () => void
  onHome: () => void
  onReview: (termId: string) => void
}) {
  const total = run.questions.length
  const ratio = run.score / total
  const wrongTerms = [...new Set(run.wrongIds)]
    .map((id) => TERMS.find((term) => term.id === id))
    .filter((term): term is Term => Boolean(term))
  const message =
    ratio === 1
      ? '完璧！編集者に通じる言葉が揃ってきました'
      : ratio >= 0.6
        ? 'いい感じ！あと少しで共通言語マスター'
        : 'まだこれから。復習してもう一度！'
  const badge =
    ratio === 1
      ? 'assets/badge-perfect.png'
      : ratio >= 0.6
        ? 'assets/badge-good.png'
        : 'assets/badge-retry.png'

  return (
    <section className="result-screen">
      {ratio >= 0.6 && <Confetti count={34} />}
      <p className="result-screen__eyebrow oswald">RESULT</p>
      <img className="result-screen__badge" src={badge} alt="" />
      <div className="score-ring">
        <svg viewBox="0 0 170 170" aria-hidden="true">
          <circle className="score-ring__track" cx="85" cy="85" r="72" />
          <circle
            className={`score-ring__value ${ratio >= 0.6 ? 'is-good' : 'is-retry'}`}
            cx="85"
            cy="85"
            r="72"
            style={{ '--score-offset': 452.4 * (1 - ratio) } as CSSProperties}
          />
        </svg>
        <div className="oswald">
          <strong>{run.score}</strong>
          <span>/ {total}</span>
        </div>
      </div>
      <h2>{message}</h2>
      {wrongTerms.length > 0 && (
        <div className="review-terms">
          <p>まちがえた用語を復習しましょう</p>
          <div>
            {wrongTerms.map((term) => (
              <button key={term.id} type="button" onClick={() => onReview(term.id)}>
                {term.name} →
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="result-actions">
        <button className="coral-cta" type="button" onClick={onRetry}>
          もう一度挑戦
        </button>
        <button type="button" onClick={onHome}>
          用語一覧へ
        </button>
      </div>
    </section>
  )
}

function MobileTabs({
  screen,
  onHome,
  onQuiz,
}: {
  screen: Screen
  onHome: () => void
  onQuiz: () => void
}) {
  return (
    <nav className="mobile-tabs" aria-label="画面切り替え">
      <button
        className={screen === 'home' ? 'is-active' : ''}
        type="button"
        onClick={onHome}
      >
        <span className="oswald">W.</span>
        用語
      </button>
      <button
        className={screen !== 'home' ? 'is-active' : ''}
        type="button"
        onClick={onQuiz}
      >
        <span className="oswald">Q.</span>
        クイズ
      </button>
    </nav>
  )
}

export default function App() {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [bookmarks, setBookmarks] = useState<string[]>(() =>
    readStoredIds('ew-bookmarks'),
  )
  const [viewed, setViewed] = useState<string[]>(() => readStoredIds('ew-viewed'))
  const [screen, setScreen] = useState<Screen>('home')
  const [quizRun, setQuizRun] = useState<QuizRun | null>(null)

  const visibleTerms = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ja')
    return TERMS.filter((term) => {
      const categoryMatches =
        filter === 'all' ||
        term.cat === filter ||
        (filter === 'bookmarks' && bookmarks.includes(term.id))
      const queryMatches =
        !normalizedQuery ||
        term.name.toLocaleLowerCase('ja').includes(normalizedQuery) ||
        term.en.toLocaleLowerCase('en').includes(normalizedQuery) ||
        term.meaning.toLocaleLowerCase('ja').includes(normalizedQuery)
      return categoryMatches && queryMatches
    })
  }, [bookmarks, filter, query])

  const detailTerm = detailId ? TERMS.find((term) => term.id === detailId) ?? null : null
  const detailContext =
    detailTerm && visibleTerms.some((term) => term.id === detailTerm.id)
      ? visibleTerms
      : TERMS
  const detailIndex = detailTerm
    ? detailContext.findIndex((term) => term.id === detailTerm.id)
    : -1

  useEffect(() => {
    if (!detailId) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDetailId(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [detailId])

  const goHome = () => {
    setScreen('home')
    setQuizRun(null)
    setDetailId(null)
  }

  const openDetail = (termId: string) => {
    setScreen('home')
    setDetailId(termId)
    setViewed((current) => {
      if (current.includes(termId)) return current
      const next = [...current, termId]
      writeStoredIds('ew-viewed', next)
      return next
    })
  }

  const moveDetail = (delta: number) => {
    if (!detailTerm || detailIndex < 0) return
    const nextIndex = (detailIndex + delta + detailContext.length) % detailContext.length
    openDetail(detailContext[nextIndex].id)
  }

  const toggleBookmark = (termId: string) => {
    setBookmarks((current) => {
      const next = current.includes(termId)
        ? current.filter((id) => id !== termId)
        : [...current, termId]
      writeStoredIds('ew-bookmarks', next)
      return next
    })
  }

  const handleCardBookmark = (
    event: MouseEvent<HTMLButtonElement>,
    termId: string,
  ) => {
    event.stopPropagation()
    toggleBookmark(termId)
  }

  const startQuiz = () => {
    setDetailId(null)
    setScreen('quiz')
    setQuizRun({
      questions: createQuiz(TERMS),
      index: 0,
      selectedId: null,
      score: 0,
      wrongIds: [],
    })
  }

  const answerQuestion = (choiceId: string) => {
    setQuizRun((current) => {
      if (!current || current.selectedId) return current
      const question = current.questions[current.index]
      const correct = choiceId === question.correctChoiceId
      return {
        ...current,
        selectedId: choiceId,
        score: current.score + (correct ? 1 : 0),
        wrongIds: correct
          ? current.wrongIds
          : [...current.wrongIds, question.answerTermId],
      }
    })
  }

  const nextQuestion = () => {
    setQuizRun((current) => {
      if (!current?.selectedId) return current
      if (current.index === current.questions.length - 1) {
        setScreen('result')
        return current
      }
      return {
        ...current,
        index: current.index + 1,
        selectedId: null,
      }
    })
  }

  const changeFilter = (nextFilter: Filter) => {
    setFilter(nextFilter)
    setScreen('home')
  }

  const currentHeading = FILTER_LABELS[filter]

  return (
    <div className="app-shell">
      <Sidebar
        filter={filter}
        bookmarks={bookmarks}
        viewed={viewed}
        onFilter={changeFilter}
        onHome={goHome}
        onQuiz={startQuiz}
      />
      <main className="app-main">
        <MobileHeader onHome={goHome} />
        {screen === 'home' && (
          <>
            <Marquee />
            <div className="mobile-controls">
              <SearchBox value={query} onChange={setQuery} />
              <MobileFilters
                filter={filter}
                bookmarks={bookmarks}
                onFilter={changeFilter}
              />
            </div>
            <div className="home-heading">
              <div>
                <p className="oswald">{currentHeading.en}</p>
                <h1>
                  {currentHeading.ja}
                  <span className="oswald">{visibleTerms.length} TERMS</span>
                </h1>
              </div>
              <SearchBox value={query} onChange={setQuery} />
            </div>
            <div className="term-grid-wrap">
              {visibleTerms.length > 0 ? (
                <div className="term-grid">
                  {visibleTerms.map((term, index) => (
                    <TermCard
                      key={term.id}
                      term={term}
                      index={index}
                      bookmarked={bookmarks.includes(term.id)}
                      onOpen={() => openDetail(term.id)}
                      onBookmark={(event) => handleCardBookmark(event, term.id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState query={query} onClear={() => setQuery('')} />
              )}
            </div>
          </>
        )}
        {screen === 'quiz' && quizRun && (
          <QuizView
            run={quizRun}
            onBack={goHome}
            onAnswer={answerQuestion}
            onNext={nextQuestion}
          />
        )}
        {screen === 'result' && quizRun && (
          <ResultView
            run={quizRun}
            onRetry={startQuiz}
            onHome={goHome}
            onReview={openDetail}
          />
        )}
        {detailTerm && (
          <DetailPanel
            term={detailTerm}
            current={detailIndex + 1}
            total={detailContext.length}
            bookmarked={bookmarks.includes(detailTerm.id)}
            onClose={() => setDetailId(null)}
            onMove={moveDetail}
            onBookmark={() => toggleBookmark(detailTerm.id)}
          />
        )}
        <MobileTabs screen={screen} onHome={goHome} onQuiz={startQuiz} />
      </main>
    </div>
  )
}

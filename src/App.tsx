import { useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { AdminPage } from './pages/AdminPage'
import { HomePage } from './pages/HomePage'
import { QuestionPage } from './pages/QuestionPage'
import type { GameMode, QuizQuestion, Screen } from './types'
import { exportDataPack, importDataPack } from './utils/dataPack'
import {
  loadQuestions,
  loadQuestionsFromProject,
  saveQuestions,
} from './utils/questionStorage'

const PLAYED_STORAGE_KEY = 'biblebell-4x4-played-question-ids'
const CLAIMS_STORAGE_KEY = 'biblebell-4x4-bingo-claims'
const MODE_STORAGE_KEY = 'biblegoldenbell-4x4-game-mode'
const BASE_PATH = import.meta.env.BASE_URL

const BINGO_LINES = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  [0, 5, 10, 15],
  [3, 6, 9, 12],
] as const

interface ClaimHistoryItem {
  questionId: string
  previousTeamId: number
  nextTeamId: number
}

function getInitialScreen(): Screen {
  return window.location.hash === '#admin'
    ? { name: 'admin' }
    : { name: 'home' }
}

function loadPlayedQuestionIds(): string[] {
  try {
    const saved = window.localStorage.getItem(PLAYED_STORAGE_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function loadClaims(): Record<string, number> {
  try {
    const saved = window.localStorage.getItem(CLAIMS_STORAGE_KEY)
    if (!saved) return {}
    const parsed = JSON.parse(saved)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function loadGameMode(): GameMode {
  const saved = window.localStorage.getItem(MODE_STORAGE_KEY)
  return saved === 'team2' || saved === 'team3' || saved === 'solo'
    ? saved
    : 'solo'
}

function getTeamBingoLines(
  boardQuestions: QuizQuestion[],
  claims: Record<string, number>,
  teamId: number,
) {
  return BINGO_LINES.filter((line) =>
    line.every((slotIndex) => {
      const question = boardQuestions[slotIndex]
      return question && claims[question.id] === teamId
    }),
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(getInitialScreen)
  const [showAnswer, setShowAnswer] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(loadQuestions)
  const [playedQuestionIds, setPlayedQuestionIds] =
    useState<string[]>(loadPlayedQuestionIds)
  const [claims, setClaims] = useState<Record<string, number>>(loadClaims)
  const [gameMode, setGameMode] = useState<GameMode>(loadGameMode)
  const [pendingClaimQuestionId, setPendingClaimQuestionId] =
    useState<string | null>(null)
  const [claimHistory, setClaimHistory] = useState<ClaimHistoryItem[]>([])
  const [celebrationTeamId, setCelebrationTeamId] = useState<number | null>(null)

  const boardQuestions = useMemo(
    () => [...quizQuestions].sort((a, b) => a.number - b.number).slice(0, 16),
    [quizQuestions],
  )

  const selectedQuestion = useMemo(() => {
    if (screen.name !== 'question') return null
    return quizQuestions.find((question) => question.id === screen.questionId) ?? null
  }, [quizQuestions, screen])

  const winningQuestionIds = useMemo(() => {
    const result = new Set<string>()

    ;[1, 2, 3].forEach((teamId) => {
      getTeamBingoLines(boardQuestions, claims, teamId).forEach((line) => {
        line.forEach((slotIndex) => {
          const question = boardQuestions[slotIndex]
          if (question) result.add(question.id)
        })
      })
    })

    return [...result]
  }, [boardQuestions, claims])

  useEffect(() => {
    let active = true

    void loadQuestionsFromProject()
      .then((items) => {
        if (active) setQuizQuestions(items)
      })
      .catch((error) => {
        console.error(error)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      setScreen(getInitialScreen())
      setShowAnswer(false)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(
      PLAYED_STORAGE_KEY,
      JSON.stringify(playedQuestionIds),
    )
  }, [playedQuestionIds])

  useEffect(() => {
    window.localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(claims))
  }, [claims])

  useEffect(() => {
    window.localStorage.setItem(MODE_STORAGE_KEY, gameMode)
  }, [gameMode])

  useEffect(() => {
    if (!celebrationTeamId) return
    const timer = window.setTimeout(() => setCelebrationTeamId(null), 3200)
    return () => window.clearTimeout(timer)
  }, [celebrationTeamId])

  const goHome = () => {
    window.history.pushState({}, '', BASE_PATH)
    setScreen({ name: 'home' })
    setShowAnswer(false)
  }

  const goAdmin = () => {
    window.history.pushState({}, '', `${BASE_PATH}#admin`)
    setScreen({ name: 'admin' })
    setShowAnswer(false)
  }

  const selectQuestion = (questionId: string) => {
    setPlayedQuestionIds((current) =>
      current.includes(questionId) ? current : [...current, questionId],
    )

    if (gameMode !== 'solo') {
      setPendingClaimQuestionId(questionId)
    }

    setScreen({ name: 'question', questionId })
    setShowAnswer(false)
  }

  const changeGameMode = (nextMode: GameMode) => {
    if (nextMode === gameMode) return

    const hasTeamMarks = Object.keys(claims).length > 0
    if (
      hasTeamMarks &&
      !window.confirm('게임 모드를 바꾸면 현재 팀 색 표시를 초기화합니다. 계속할까요?')
    ) {
      return
    }

    setGameMode(nextMode)
    setClaims({})
    setClaimHistory([])
    setPendingClaimQuestionId(null)
    setCelebrationTeamId(null)
  }

  const claimPendingQuestion = (teamId: number | null) => {
    const questionId = pendingClaimQuestionId
    if (!questionId) return

    const previousTeamId = claims[questionId] ?? 0
    const nextTeamId = teamId ?? 0

    if (previousTeamId === nextTeamId) {
      setPendingClaimQuestionId(null)
      return
    }

    const beforeCount = teamId
      ? getTeamBingoLines(boardQuestions, claims, teamId).length
      : 0

    const nextClaims = { ...claims }
    if (teamId) nextClaims[questionId] = teamId
    else delete nextClaims[questionId]

    const afterCount = teamId
      ? getTeamBingoLines(boardQuestions, nextClaims, teamId).length
      : 0

    setClaims(nextClaims)
    setClaimHistory((current) => [
      ...current,
      { questionId, previousTeamId, nextTeamId },
    ])
    setPendingClaimQuestionId(null)

    if (teamId && afterCount > beforeCount) {
      setCelebrationTeamId(teamId)
    }
  }

  const undoLastClaim = () => {
    const last = claimHistory[claimHistory.length - 1]
    if (!last) return

    setClaims((current) => {
      const next = { ...current }
      if (last.previousTeamId) next[last.questionId] = last.previousTeamId
      else delete next[last.questionId]
      return next
    })

    setClaimHistory((current) => current.slice(0, -1))
    setPendingClaimQuestionId(null)
    setCelebrationTeamId(null)
  }

  const resetGame = () => {
    if (!window.confirm('출제 상태와 팀 색 표시를 모두 초기화할까요?')) return

    setPlayedQuestionIds([])
    setClaims({})
    setClaimHistory([])
    setPendingClaimQuestionId(null)
    setCelebrationTeamId(null)

    window.localStorage.removeItem(PLAYED_STORAGE_KEY)
    window.localStorage.removeItem(CLAIMS_STORAGE_KEY)
    goHome()
  }

  const handleSaveQuestions = (nextQuestions: QuizQuestion[]) => {
    const normalized = [...nextQuestions]
      .sort((a, b) => a.number - b.number)
      .slice(0, 16)
    setQuizQuestions(normalized)
    saveQuestions(normalized)
  }

  const handleExportData = async () => {
    const result = await exportDataPack(quizQuestions)
    return `저장 완료 · ${result.fileName} · 미디어 ${result.assetCount}개 포함`
  }

  const handleImportData = async (file: File) => {
    const result = await importDataPack(file)
    handleSaveQuestions(result.questions)

    setPlayedQuestionIds([])
    setClaims({})
    setClaimHistory([])
    setPendingClaimQuestionId(null)
    setCelebrationTeamId(null)
    window.localStorage.removeItem(PLAYED_STORAGE_KEY)
    window.localStorage.removeItem(CLAIMS_STORAGE_KEY)

    return `불러오기 완료 · 16문제 · 미디어 ${result.importedFileCount}개 적용`
  }

  if (screen.name === 'home') {
    return (
      <HomePage
        questions={quizQuestions}
        playedQuestionIds={playedQuestionIds}
        claims={claims}
        gameMode={gameMode}
        pendingClaimQuestionId={pendingClaimQuestionId}
        winningQuestionIds={winningQuestionIds}
        celebrationTeamId={celebrationTeamId}
        onSelect={selectQuestion}
        onGameMode={changeGameMode}
        onClaimPending={claimPendingQuestion}
        onUndoLastClaim={undoLastClaim}
        canUndoClaim={claimHistory.length > 0}
        onAdmin={goAdmin}
        onReset={resetGame}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />
    )
  }

  if (screen.name === 'admin') {
    return (
      <div className="app-shell admin-shell">
        <Header onHome={goHome} onAdmin={goAdmin} onReset={resetGame} />

        <div className="admin-scroll-area">
          <AdminPage
            questions={quizQuestions}
            onSave={handleSaveQuestions}
            onBack={goHome}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell event-shell">
      <Header onHome={goHome} onAdmin={goAdmin} onReset={resetGame} />

      <div className="event-layout event-layout-question-only">
        <section className="event-content">
          {selectedQuestion && (
            <QuestionPage
              key={selectedQuestion.id}
              question={selectedQuestion}
              showAnswer={showAnswer}
              onToggleAnswer={() => setShowAnswer((value) => !value)}
              onBack={goHome}
              onHome={goHome}
            />
          )}
        </section>
      </div>
    </div>
  )
}

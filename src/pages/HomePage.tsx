import {
  Download,
  Maximize2,
  RotateCcw,
  Settings,
  Undo2,
  UploadCloud,
} from 'lucide-react'
import { useRef, useState } from 'react'
import masterLogo from '../assets/master-logo.png'
import type {
  GameMode,
  QuizQuestion,
} from '../types'
import '../styles/home-master.css'

interface HomePageProps {
  questions: QuizQuestion[]
  playedQuestionIds: string[]
  claims: Record<string, number>
  gameMode: GameMode
  pendingClaimQuestionId: string | null
  winningQuestionIds: string[]
  celebrationTeamId: number | null
  onSelect: (questionId: string) => void
  onGameMode: (mode: GameMode) => void
  onClaimPending: (teamId: number | null) => void
  onUndoLastClaim: () => void
  canUndoClaim: boolean
  onAdmin: () => void
  onReset: () => void
  onExportData: () => Promise<string>
  onImportData: (file: File) => Promise<string>
}

const TEAM_META = {
  1: { label: '1팀', className: 'team-one' },
  2: { label: '2팀', className: 'team-two' },
  3: { label: '3팀', className: 'team-three' },
} as const

function getTeamCount(mode: GameMode) {
  if (mode === 'team3') return 3
  if (mode === 'team2') return 2
  return 0
}

function BingoCelebration({ teamId }: { teamId: number }) {
  const team = TEAM_META[teamId as 1 | 2 | 3] ?? TEAM_META[1]

  return (
    <div className={`bingo-celebration ${team.className}`} aria-live="polite">
      <div className="bingo-confetti" aria-hidden="true">
        {Array.from({ length: 54 }, (_, index) => (
          <span
            key={index}
            style={{
              left: `${(index * 37) % 100}%`,
              animationDelay: `${(index % 12) * 0.055}s`,
              animationDuration: `${1.9 + (index % 7) * 0.12}s`,
              transform: `rotate(${(index * 43) % 180}deg)`,
            }}
          />
        ))}
      </div>

      <div className="bingo-celebration-card">
        <span>{team.label}</span>
        <strong>BINGO!</strong>
      </div>
    </div>
  )
}

export function HomePage({
  questions,
  playedQuestionIds,
  claims,
  gameMode,
  pendingClaimQuestionId,
  winningQuestionIds,
  celebrationTeamId,
  onSelect,
  onGameMode,
  onClaimPending,
  onUndoLastClaim,
  canUndoClaim,
  onAdmin,
  onReset,
  onExportData,
  onImportData,
}: HomePageProps) {
  const boardQuestions = [...questions]
    .sort((a, b) => a.number - b.number)
    .slice(0, 16)

  const pendingQuestion = pendingClaimQuestionId
    ? boardQuestions.find((item) => item.id === pendingClaimQuestionId)
    : null

  const teamCount = getTeamCount(gameMode)
  const dataInputRef = useRef<HTMLInputElement | null>(null)
  const [dataBusy, setDataBusy] = useState(false)
  const [dataMessage, setDataMessage] = useState('')

  const saveData = async () => {
    if (dataBusy) return
    setDataBusy(true)
    setDataMessage('데이터 파일을 만드는 중입니다...')
    try {
      setDataMessage(await onExportData())
    } catch (error) {
      setDataMessage(
        error instanceof Error ? error.message : '데이터 저장에 실패했습니다.',
      )
    } finally {
      setDataBusy(false)
    }
  }

  const loadData = async (file?: File) => {
    if (!file || dataBusy) return

    if (
      !window.confirm(
        '현재 16문제를 선택한 데이터 파일의 내용으로 바꿀까요?\n이미지·동영상·오디오도 함께 불러옵니다.',
      )
    ) {
      if (dataInputRef.current) dataInputRef.current.value = ''
      return
    }

    setDataBusy(true)
    setDataMessage('데이터 파일을 불러오는 중입니다...')
    try {
      setDataMessage(await onImportData(file))
    } catch (error) {
      setDataMessage(
        error instanceof Error ? error.message : '데이터 불러오기에 실패했습니다.',
      )
    } finally {
      setDataBusy(false)
      if (dataInputRef.current) dataInputRef.current.value = ''
    }
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      return
    }

    await document.exitFullscreen()
  }

  return (
    <main className="master-screen">
      {celebrationTeamId ? (
        <BingoCelebration teamId={celebrationTeamId} />
      ) : null}

      <section className="master-board-panel">
        <header className="master-board-titlebar">
          <div className="master-board-title">
            <span>도전 바이블</span>
            <strong>골든벨</strong>
          </div>

          <button
            className="master-admin-button"
            onClick={onAdmin}
          >
            <Settings size={18} />
            관리자 모드
          </button>
        </header>

        <div className="master-board-grid master-board-grid-4x4">
          {Array.from({ length: 16 }, (_, index) => {
            const slotNumber = index + 1
            const question = boardQuestions[index]
            const isPlayed = question
              ? playedQuestionIds.includes(question.id)
              : false
            const teamId = question ? claims[question.id] ?? 0 : 0
            const isWinning = question
              ? winningQuestionIds.includes(question.id)
              : false
            const isPending = question?.id === pendingClaimQuestionId

            return (
              <button
                key={slotNumber}
                className={[
                  'master-score-cell',
                  'master-number-cell',
                  isPlayed ? 'is-played' : '',
                  teamId ? `is-claimed team-${teamId}` : '',
                  isWinning ? 'is-bingo-cell' : '',
                  isPending ? 'is-pending-claim' : '',
                  !question ? 'is-empty' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                disabled={!question}
                onClick={() => question && onSelect(question.id)}
                title={
                  question
                    ? `${slotNumber}번 문제`
                    : `${slotNumber}번 · 문제 미지정`
                }
              >
                {slotNumber}
              </button>
            )
          })}
        </div>

        <footer className="master-board-footer">
          <div className="master-footer-actions">
            <input
              ref={dataInputRef}
              type="file"
              accept=".bb4,application/octet-stream"
              hidden
              onChange={(event) => void loadData(event.target.files?.[0])}
            />

            <button type="button" disabled={dataBusy} onClick={() => void saveData()}>
              <Download size={19} />
              {dataBusy ? '처리 중' : '데이터 저장'}
            </button>

            <button
              type="button"
              disabled={dataBusy}
              onClick={() => dataInputRef.current?.click()}
            >
              <UploadCloud size={19} />
              데이터 불러오기
            </button>

            <button type="button" onClick={onReset}>
              <RotateCcw size={19} />
              전체 초기화
            </button>

            <button type="button" onClick={toggleFullscreen}>
              <Maximize2 size={19} />
              전체화면
            </button>
          </div>
        </footer>
      </section>

      <aside className="master-sidebar master-sidebar-bingo">
        <section className="master-logo-panel">
          <img src={masterLogo} alt="도전 바이블 골든벨" />
        </section>

        <section className="bingo-control-panel">
          <div className="bingo-control-heading">
            <span className="scoreboard-live-dot" />
            GAME MODE
          </div>

          <div className="bingo-mode-buttons" role="group" aria-label="게임 모드">
            <button
              type="button"
              className={gameMode === 'solo' ? 'is-active' : ''}
              onClick={() => onGameMode('solo')}
            >
              개인
            </button>
            <button
              type="button"
              className={gameMode === 'team2' ? 'is-active' : ''}
              onClick={() => onGameMode('team2')}
            >
              2팀
            </button>
            <button
              type="button"
              className={gameMode === 'team3' ? 'is-active' : ''}
              onClick={() => onGameMode('team3')}
            >
              3팀
            </button>
          </div>

          {teamCount > 0 ? (
            <>
              <div className="bingo-pending-card">
                <span>방금 푼 문제</span>
                <strong>
                  {pendingQuestion ? `${pendingQuestion.number}번` : '—'}
                </strong>
                <p>
                  {pendingQuestion
                    ? '맞힌 팀의 색을 누르세요.'
                    : '문제를 푼 뒤 팀 색을 선택합니다.'}
                </p>
              </div>

              <div className="bingo-team-buttons">
                {Array.from({ length: teamCount }, (_, index) => index + 1).map(
                  (teamId) => {
                    const team = TEAM_META[teamId as 1 | 2 | 3]
                    return (
                      <button
                        type="button"
                        key={teamId}
                        className={team.className}
                        disabled={!pendingQuestion}
                        onClick={() => onClaimPending(teamId)}
                      >
                        <span className="team-color-dot" />
                        <strong>{team.label}</strong>
                      </button>
                    )
                  },
                )}
              </div>

              <div className="bingo-secondary-actions">
                <button
                  type="button"
                  disabled={!pendingQuestion}
                  onClick={() => onClaimPending(null)}
                >
                  미획득
                </button>
                <button
                  type="button"
                  disabled={!canUndoClaim}
                  onClick={onUndoLastClaim}
                >
                  <Undo2 size={16} />
                  배정 취소
                </button>
              </div>
            </>
          ) : (
            <div className="bingo-solo-card">
              <strong>개인 문제판</strong>
              <p>
                문제를 선택하고 정답을 확인하면 사용한 번호가 표시됩니다.
              </p>
            </div>
          )}

          {dataMessage ? (
            <div className="home-data-message" role="status">
              {dataMessage}
            </div>
          ) : null}
        </section>
      </aside>
    </main>
  )
}

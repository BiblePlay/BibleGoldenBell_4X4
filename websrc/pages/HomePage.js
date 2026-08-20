import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Download, Maximize2, RotateCcw, Settings, Undo2, UploadCloud, } from 'lucide-react';
import { useRef, useState } from 'react';
const masterLogo = new URL('../assets/master-logo.png', import.meta.url).href;

const TEAM_META = {
    1: { label: '1팀', className: 'team-one' },
    2: { label: '2팀', className: 'team-two' },
    3: { label: '3팀', className: 'team-three' },
};
function getTeamCount(mode) {
    if (mode === 'team3')
        return 3;
    if (mode === 'team2')
        return 2;
    return 0;
}
function BingoCelebration({ teamId }) {
    const team = TEAM_META[teamId] ?? TEAM_META[1];
    return (_jsxs("div", { className: `bingo-celebration ${team.className}`, "aria-live": "polite", children: [_jsx("div", { className: "bingo-confetti", "aria-hidden": "true", children: Array.from({ length: 54 }, (_, index) => (_jsx("span", { style: {
                        left: `${(index * 37) % 100}%`,
                        animationDelay: `${(index % 12) * 0.055}s`,
                        animationDuration: `${1.9 + (index % 7) * 0.12}s`,
                        transform: `rotate(${(index * 43) % 180}deg)`,
                    } }, index))) }), _jsxs("div", { className: "bingo-celebration-card", children: [_jsx("span", { children: team.label }), _jsx("strong", { children: "BINGO!" })] })] }));
}
export function HomePage({ questions, playedQuestionIds, claims, gameMode, pendingClaimQuestionId, winningQuestionIds, celebrationTeamId, onSelect, onGameMode, onClaimPending, onUndoLastClaim, canUndoClaim, onAdmin, onReset, onExportData, onImportData, }) {
    const boardQuestions = [...questions]
        .sort((a, b) => a.number - b.number)
        .slice(0, 16);
    const pendingQuestion = pendingClaimQuestionId
        ? boardQuestions.find((item) => item.id === pendingClaimQuestionId)
        : null;
    const teamCount = getTeamCount(gameMode);
    const dataInputRef = useRef(null);
    const [dataBusy, setDataBusy] = useState(false);
    const [dataMessage, setDataMessage] = useState('');
    const saveData = async () => {
        if (dataBusy)
            return;
        setDataBusy(true);
        setDataMessage('데이터 파일을 만드는 중입니다...');
        try {
            setDataMessage(await onExportData());
        }
        catch (error) {
            setDataMessage(error instanceof Error ? error.message : '데이터 저장에 실패했습니다.');
        }
        finally {
            setDataBusy(false);
        }
    };
    const loadData = async (file) => {
        if (!file || dataBusy)
            return;
        if (!window.confirm('현재 16문제를 선택한 데이터 파일의 내용으로 바꿀까요?\n이미지·동영상·오디오도 함께 불러옵니다.')) {
            if (dataInputRef.current)
                dataInputRef.current.value = '';
            return;
        }
        setDataBusy(true);
        setDataMessage('데이터 파일을 불러오는 중입니다...');
        try {
            setDataMessage(await onImportData(file));
        }
        catch (error) {
            setDataMessage(error instanceof Error ? error.message : '데이터 불러오기에 실패했습니다.');
        }
        finally {
            setDataBusy(false);
            if (dataInputRef.current)
                dataInputRef.current.value = '';
        }
    };
    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
            return;
        }
        await document.exitFullscreen();
    };
    return (_jsxs("main", { className: "master-screen", children: [celebrationTeamId ? (_jsx(BingoCelebration, { teamId: celebrationTeamId })) : null, _jsxs("section", { className: "master-board-panel", children: [_jsxs("header", { className: "master-board-titlebar", children: [_jsxs("div", { className: "master-board-title", children: [_jsx("span", { children: "\uB3C4\uC804 \uBC14\uC774\uBE14" }), _jsx("strong", { children: "\uACE8\uB4E0\uBCA8" })] }), _jsxs("button", { className: "master-admin-button", onClick: onAdmin, children: [_jsx(Settings, { size: 18 }), "\uAD00\uB9AC\uC790 \uBAA8\uB4DC"] })] }), _jsx("div", { className: "master-board-grid master-board-grid-4x4", children: Array.from({ length: 16 }, (_, index) => {
                            const slotNumber = index + 1;
                            const question = boardQuestions[index];
                            const isPlayed = question
                                ? playedQuestionIds.includes(question.id)
                                : false;
                            const teamId = question ? claims[question.id] ?? 0 : 0;
                            const isWinning = question
                                ? winningQuestionIds.includes(question.id)
                                : false;
                            const isPending = question?.id === pendingClaimQuestionId;
                            return (_jsx("button", { className: [
                                    'master-score-cell',
                                    'master-number-cell',
                                    isPlayed ? 'is-played' : '',
                                    teamId ? `is-claimed team-${teamId}` : '',
                                    isWinning ? 'is-bingo-cell' : '',
                                    isPending ? 'is-pending-claim' : '',
                                    !question ? 'is-empty' : '',
                                ]
                                    .filter(Boolean)
                                    .join(' '), disabled: !question, onClick: () => question && onSelect(question.id), title: question
                                    ? `${slotNumber}번 문제`
                                    : `${slotNumber}번 · 문제 미지정`, children: slotNumber }, slotNumber));
                        }) }), _jsx("footer", { className: "master-board-footer", children: _jsxs("div", { className: "master-footer-actions", children: [_jsx("input", { ref: dataInputRef, type: "file", accept: ".bb4,application/octet-stream", hidden: true, onChange: (event) => void loadData(event.target.files?.[0]) }), _jsxs("button", { type: "button", disabled: dataBusy, onClick: () => void saveData(), children: [_jsx(Download, { size: 19 }), dataBusy ? '처리 중' : '데이터 저장'] }), _jsxs("button", { type: "button", disabled: dataBusy, onClick: () => dataInputRef.current?.click(), children: [_jsx(UploadCloud, { size: 19 }), "\uB370\uC774\uD130 \uBD88\uB7EC\uC624\uAE30"] }), _jsxs("button", { type: "button", onClick: onReset, children: [_jsx(RotateCcw, { size: 19 }), "\uC804\uCCB4 \uCD08\uAE30\uD654"] }), _jsxs("button", { type: "button", onClick: toggleFullscreen, children: [_jsx(Maximize2, { size: 19 }), "\uC804\uCCB4\uD654\uBA74"] })] }) })] }), _jsxs("aside", { className: "master-sidebar master-sidebar-bingo", children: [_jsx("section", { className: "master-logo-panel", children: _jsx("img", { src: masterLogo, alt: "\uB3C4\uC804 \uBC14\uC774\uBE14 \uACE8\uB4E0\uBCA8" }) }), _jsxs("section", { className: "bingo-control-panel", children: [_jsxs("div", { className: "bingo-control-heading", children: [_jsx("span", { className: "scoreboard-live-dot" }), "GAME MODE"] }), _jsxs("div", { className: "bingo-mode-buttons", role: "group", "aria-label": "\uAC8C\uC784 \uBAA8\uB4DC", children: [_jsx("button", { type: "button", className: gameMode === 'solo' ? 'is-active' : '', onClick: () => onGameMode('solo'), children: "\uAC1C\uC778" }), _jsx("button", { type: "button", className: gameMode === 'team2' ? 'is-active' : '', onClick: () => onGameMode('team2'), children: "2\uD300" }), _jsx("button", { type: "button", className: gameMode === 'team3' ? 'is-active' : '', onClick: () => onGameMode('team3'), children: "3\uD300" })] }), teamCount > 0 ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "bingo-pending-card", children: [_jsx("span", { children: "\uBC29\uAE08 \uD47C \uBB38\uC81C" }), _jsx("strong", { children: pendingQuestion ? `${pendingQuestion.number}번` : '—' }), _jsx("p", { children: pendingQuestion
                                                    ? '맞힌 팀의 색을 누르세요.'
                                                    : '문제를 푼 뒤 팀 색을 선택합니다.' })] }), _jsx("div", { className: "bingo-team-buttons", children: Array.from({ length: teamCount }, (_, index) => index + 1).map((teamId) => {
                                            const team = TEAM_META[teamId];
                                            return (_jsxs("button", { type: "button", className: team.className, disabled: !pendingQuestion, onClick: () => onClaimPending(teamId), children: [_jsx("span", { className: "team-color-dot" }), _jsx("strong", { children: team.label })] }, teamId));
                                        }) }), _jsxs("div", { className: "bingo-secondary-actions", children: [_jsx("button", { type: "button", disabled: !pendingQuestion, onClick: () => onClaimPending(null), children: "\uBBF8\uD68D\uB4DD" }), _jsxs("button", { type: "button", disabled: !canUndoClaim, onClick: onUndoLastClaim, children: [_jsx(Undo2, { size: 16 }), "\uBC30\uC815 \uCDE8\uC18C"] })] })] })) : (_jsxs("div", { className: "bingo-solo-card", children: [_jsx("strong", { children: "\uAC1C\uC778 \uBB38\uC81C\uD310" }), _jsx("p", { children: "\uBB38\uC81C\uB97C \uC120\uD0DD\uD558\uACE0 \uC815\uB2F5\uC744 \uD655\uC778\uD558\uBA74 \uC0AC\uC6A9\uD55C \uBC88\uD638\uAC00 \uD45C\uC2DC\uB429\uB2C8\uB2E4." })] })), dataMessage ? (_jsx("div", { className: "home-data-message", role: "status", children: dataMessage })) : null] })] })] }));
}

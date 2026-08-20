import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ArrowLeft, Eye, EyeOff, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState, } from 'react';
const AUDIO_META_KEY = 'biblebell-4x4-admin-asset-meta';
const AUDIO_DB_NAME = 'biblebell-4x4-admin-assets';
const AUDIO_STORE_NAME = 'assets';
function openAudioDb() {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(AUDIO_DB_NAME, 1);
        request.onupgradeneeded =
            () => {
                const database = request.result;
                if (!database.objectStoreNames.contains(AUDIO_STORE_NAME)) {
                    database.createObjectStore(AUDIO_STORE_NAME);
                }
            };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
async function getQuestionAudio(questionId) {
    const database = await openAudioDb();
    const result = await new Promise((resolve, reject) => {
        const transaction = database.transaction(AUDIO_STORE_NAME, 'readonly');
        const request = transaction
            .objectStore(AUDIO_STORE_NAME)
            .get(`${questionId}:audio`);
        request.onsuccess = () => resolve(request.result instanceof
            Blob
            ? request.result
            : null);
        request.onerror = () => reject(request.error);
    });
    database.close();
    return result;
}
function getQuestionAudioMeta(questionId) {
    try {
        const saved = window.localStorage.getItem(AUDIO_META_KEY);
        if (!saved)
            return {};
        const parsed = JSON.parse(saved);
        return (parsed?.[questionId] ?? {});
    }
    catch {
        return {};
    }
}
async function getQuestionVideo(questionId) {
    const database = await openAudioDb();
    const result = await new Promise((resolve, reject) => {
        const transaction = database.transaction(AUDIO_STORE_NAME, 'readonly');
        const request = transaction
            .objectStore(AUDIO_STORE_NAME)
            .get(`${questionId}:video`);
        request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
        request.onerror = () => reject(request.error);
    });
    database.close();
    return result;
}
function QuestionVideo({ questionId, fallbackUrl }) {
    const [videoUrl, setVideoUrl] = useState('');
    useEffect(() => {
        let active = true;
        let objectUrl = '';
        const load = async () => {
            try {
                const blob = await getQuestionVideo(questionId);
                if (blob) {
                    objectUrl = URL.createObjectURL(blob);
                    if (active)
                        setVideoUrl(objectUrl);
                    return;
                }
            }
            catch {
                // Fall through to bundled/static URL.
            }
            if (active) {
                setVideoUrl(fallbackUrl && !fallbackUrl.startsWith('bb4asset://')
                    ? fallbackUrl
                    : '');
            }
        };
        void load();
        return () => {
            active = false;
            if (objectUrl)
                URL.revokeObjectURL(objectUrl);
        };
    }, [questionId, fallbackUrl]);
    if (!videoUrl) {
        return _jsx("div", { className: "empty-media", children: "\uB3D9\uC601\uC0C1\uC744 \uB4F1\uB85D\uD574 \uC8FC\uC138\uC694." });
    }
    return (_jsx("video", { src: videoUrl, controls: true, preload: "metadata", style: {
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'contain',
            objectPosition: 'center',
            background: '#000',
        } }));
}
function QuestionAudioControl({ questionId, showAnswer, variant = 'overlay', }) {
    const [audioUrl, setAudioUrl] = useState('');
    const [playbackMode, setPlaybackMode,] = useState('manual');
    const audioRef = useRef(null);
    useEffect(() => {
        let objectUrl = '';
        let active = true;
        const loadAudio = async () => {
            const meta = getQuestionAudioMeta(questionId);
            if (meta.audioLinked === false) {
                if (active) {
                    setAudioUrl('');
                }
                return;
            }
            setPlaybackMode(meta.audioPlayback ??
                'manual');
            try {
                const audioBlob = await getQuestionAudio(questionId);
                if (!active ||
                    !audioBlob) {
                    if (active) {
                        setAudioUrl('');
                    }
                    return;
                }
                objectUrl =
                    URL.createObjectURL(audioBlob);
                setAudioUrl(objectUrl);
            }
            catch {
                if (active) {
                    setAudioUrl('');
                }
            }
        };
        void loadAudio();
        return () => {
            active = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [questionId]);
    useEffect(() => {
        if (showAnswer ||
            !audioUrl ||
            playbackMode !== 'auto') {
            return;
        }
        const audio = audioRef.current;
        if (!audio)
            return;
        audio.currentTime = 0;
        void audio.play().catch(() => {
            // 브라우저 자동 재생 정책에 의해 차단될 수 있습니다.
        });
    }, [
        audioUrl,
        playbackMode,
        showAnswer,
    ]);
    if (!audioUrl)
        return null;
    const playAudio = () => {
        const audio = audioRef.current;
        if (!audio)
            return;
        audio.currentTime = 0;
        void audio.play();
    };
    if (variant === 'media') {
        return (_jsxs("div", { style: {
                width: '100%',
                height: '100%',
                minHeight: 0,
                display: 'grid',
                placeItems: 'center',
                overflow: 'hidden',
                borderRadius: 12,
                background: 'linear-gradient(145deg, rgba(7,17,29,.98), rgba(18,45,77,.96))',
            }, children: [_jsx("audio", { ref: audioRef, src: audioUrl, preload: "auto", style: { display: 'none' } }), _jsxs("div", { style: {
                        width: 'min(520px, 86%)',
                        padding: '30px 24px',
                        display: 'grid',
                        placeItems: 'center',
                        gap: 18,
                        color: '#fff',
                        textAlign: 'center',
                    }, children: [_jsx(Volume2, { size: 70, strokeWidth: 1.8 }), _jsx("strong", { style: {
                                fontSize: 'clamp(23px, 2.5vw, 38px)',
                                lineHeight: 1.2,
                                fontWeight: 900,
                            }, children: playbackMode === 'auto'
                                ? '문제 음성 자동 재생'
                                : '문제 음성' }), playbackMode ===
                            'manual' && (_jsxs("button", { type: "button", title: "\uBB38\uC81C \uB4E3\uAE30", "aria-label": "\uBB38\uC81C \uB4E3\uAE30", onClick: playAudio, style: {
                                minWidth: 150,
                                height: 48,
                                padding: '0 20px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 9,
                                color: '#07111d',
                                border: 0,
                                borderRadius: 9,
                                background: 'var(--accent)',
                                fontSize: 17,
                                fontWeight: 900,
                                cursor: 'pointer',
                            }, children: [_jsx(Volume2, { size: 20 }), "\uBB38\uC81C \uB4E3\uAE30"] }))] })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsx("audio", { ref: audioRef, src: audioUrl, preload: "auto", style: { display: 'none' } }), !showAnswer &&
                playbackMode === 'manual' && (_jsxs("button", { type: "button", title: "\uBB38\uC81C \uB4E3\uAE30", "aria-label": "\uBB38\uC81C \uB4E3\uAE30", onClick: playAudio, style: {
                    position: 'absolute',
                    left: 18,
                    bottom: 18,
                    zIndex: 20,
                    minWidth: 126,
                    height: 42,
                    padding: '0 16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    color: '#07111d',
                    border: 0,
                    borderRadius: 8,
                    background: 'var(--accent)',
                    fontSize: 15,
                    fontWeight: 900,
                    cursor: 'pointer',
                }, children: [_jsx(Volume2, { size: 18 }), "\uBB38\uC81C \uB4E3\uAE30"] }))] }));
}
function AdaptiveQuestionImage({ src, alt, className, }) {
    const [hasTransparency, setHasTransparency,] = useState(null);
    useEffect(() => {
        let active = true;
        const image = new Image();
        image.onload = () => {
            if (!active)
                return;
            const sourceType = src.startsWith('data:')
                ? src.slice(5, src.indexOf(';'))
                : '';
            if (sourceType ===
                'image/jpeg') {
                setHasTransparency(false);
                return;
            }
            try {
                const canvas = document.createElement('canvas');
                const maxSampleEdge = 320;
                const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
                const scale = longestEdge >
                    maxSampleEdge
                    ? maxSampleEdge /
                        longestEdge
                    : 1;
                canvas.width = Math.max(1, Math.round(image.naturalWidth *
                    scale));
                canvas.height = Math.max(1, Math.round(image.naturalHeight *
                    scale));
                const context = canvas.getContext('2d', {
                    willReadFrequently: true,
                });
                if (!context) {
                    setHasTransparency(false);
                    return;
                }
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
                let transparent = false;
                for (let index = 3; index < pixels.length; index += 4) {
                    if (pixels[index] < 255) {
                        transparent = true;
                        break;
                    }
                }
                setHasTransparency(transparent);
            }
            catch {
                setHasTransparency(false);
            }
        };
        image.onerror = () => {
            if (active) {
                setHasTransparency(false);
            }
        };
        image.src = src;
        return () => {
            active = false;
        };
    }, [src]);
    const normalizedSource = src.split('?')[0].toLowerCase();
    const isPng = src.startsWith('data:image/png') ||
        normalizedSource.endsWith('.png');
    const useContain = isPng ||
        hasTransparency === true;
    return (_jsx("span", { className: className, style: {
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
        }, children: _jsx("img", { src: src, alt: alt, style: useContain
                ? {
                    width: 'auto',
                    height: 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    display: 'block',
                    objectFit: 'contain',
                    objectPosition: 'center center',
                    flex: '0 0 auto',
                }
                : {
                    width: '100%',
                    height: '100%',
                    minWidth: 0,
                    minHeight: 0,
                    display: 'block',
                    objectFit: 'cover',
                    objectPosition: 'center center',
                } }) }));
}
function getTextSize(length) {
    if (length <= 70)
        return 'size-xl';
    if (length <= 140)
        return 'size-lg';
    return 'size-md';
}
function getTextOnlyQuestionStyle(length) {
    const fontSize = length <= 28
        ? 'clamp(72px, 6vw, 112px)'
        : length <= 55
            ? 'clamp(64px, 5.2vw, 98px)'
            : length <= 90
                ? 'clamp(54px, 4.4vw, 84px)'
                : 'clamp(46px, 3.7vw, 70px)';
    return {
        width: 'min(1380px, 96%)',
        maxHeight: 'none',
        padding: 0,
        overflow: 'visible',
        fontSize,
        lineHeight: 1.16,
        textAlign: 'center',
        wordBreak: 'keep-all',
        overflowWrap: 'anywhere',
    };
}
function getChoiceSize(length) {
    if (length <= 18)
        return 'choice-lg';
    if (length <= 34)
        return 'choice-md';
    return 'choice-sm';
}
const oxStyles = {
    page: {
        height: '100%',
        minHeight: 0,
        padding: '16px',
        display: 'grid',
        gridTemplateRows: '42px minmax(0, 1fr) 54px',
        gap: '10px',
        overflow: 'hidden',
    },
    toolbar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toolbarButton: {
        padding: '8px 12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        color: 'var(--text)',
        border: '1px solid var(--line)',
        borderRadius: '8px',
        background: 'var(--panel-soft)',
        fontWeight: 800,
        cursor: 'pointer',
    },
    toolbarTitle: {
        color: 'var(--accent)',
        fontSize: '15px',
        fontWeight: 900,
        letterSpacing: '0.12em',
    },
    questionStage: {
        minHeight: 0,
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr) minmax(80px, 18%)',
        alignItems: 'center',
        overflow: 'hidden',
    },
    questionLabel: {
        justifySelf: 'center',
        padding: '7px 18px',
        color: 'var(--accent)',
        fontSize: '18px',
        fontWeight: 900,
        letterSpacing: '0.12em',
    },
    questionText: {
        width: 'min(1080px, 94%)',
        maxHeight: '100%',
        margin: '0 auto',
        padding: 0,
        display: 'grid',
        placeItems: 'center',
        overflow: 'visible',
        color: 'var(--text)',
        textAlign: 'center',
        fontSize: 'clamp(58px, 5vw, 88px)',
        lineHeight: 1.22,
        fontWeight: 900,
        letterSpacing: '-0.04em',
        wordBreak: 'keep-all',
        overflowWrap: 'anywhere',
    },
    choices: {
        width: 'min(940px, 88%)',
        height: 'auto',
        margin: '0 auto',
        paddingTop: '20px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '52px',
        alignItems: 'center',
    },
    choice: {
        minHeight: 0,
        display: 'grid',
        placeItems: 'center',
        color: 'var(--accent)',
        border: '2px solid var(--accent)',
        borderRadius: '24px',
        background: 'var(--card)',
        fontSize: 'clamp(70px, 10vh, 120px)',
        lineHeight: 1,
        fontWeight: 900,
    },
    answerStage: {
        minHeight: 0,
        display: 'grid',
        gridTemplateRows: 'minmax(0, 1fr) auto auto',
        placeItems: 'center',
        overflow: 'hidden',
        textAlign: 'center',
    },
    answerSymbol: {
        width: '100%',
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--accent)',
        fontSize: 'clamp(120px, 24vh, 240px)',
        lineHeight: 0.85,
        fontWeight: 900,
    },
    answerText: {
        color: 'var(--text)',
        fontSize: 'clamp(38px, 3.5vw, 62px)',
        lineHeight: 1,
        fontWeight: 900,
    },
    answerScore: {
        marginTop: '14px',
        color: 'var(--accent)',
        fontSize: 'clamp(24px, 2vw, 34px)',
        lineHeight: 1,
        fontWeight: 900,
    },
    footer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerButton: {
        minWidth: '210px',
        height: '50px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        color: '#07111d',
        border: 0,
        borderRadius: '9px',
        background: 'var(--accent)',
        fontSize: '17px',
        fontWeight: 900,
        cursor: 'pointer',
    },
};
function OxQuestionView({ question, showAnswer, onToggleAnswer, onBack, }) {
    const answer = question.answer.trim().toUpperCase() === 'X'
        ? 'X'
        : 'O';
    return (_jsxs("main", { className: "question-view", style: {
            ...oxStyles.page,
            position: 'relative',
        }, children: [_jsx(QuestionAudioControl, { questionId: question.id, showAnswer: showAnswer }), _jsxs("header", { style: oxStyles.toolbar, children: [_jsxs("button", { style: oxStyles.toolbarButton, onClick: onBack, children: [_jsx(ArrowLeft, { size: 18 }), "\uBB38\uC81C\uD310"] }), _jsx("span", { style: oxStyles.toolbarTitle, children: showAnswer ? 'OX 정답' : 'OX 문제' })] }), showAnswer ? (_jsxs("section", { style: oxStyles.answerStage, children: [_jsx("div", { style: oxStyles.answerSymbol, children: answer }), _jsx("strong", { style: oxStyles.answerText, children: "\uC815\uB2F5\uC785\uB2C8\uB2E4!" })] })) : (_jsxs("section", { style: oxStyles.questionStage, children: [_jsx("div", { style: oxStyles.questionLabel, children: "\uBB38\uC81C" }), _jsx("div", { style: oxStyles.questionText, children: question.question }), _jsxs("div", { style: oxStyles.choices, "aria-label": "O \uB610\uB294 X \uC120\uD0DD", children: [_jsx("div", { style: oxStyles.choice, children: "O" }), _jsx("div", { style: oxStyles.choice, children: "X" })] })] })), _jsx("footer", { style: oxStyles.footer, children: _jsxs("button", { style: oxStyles.footerButton, onClick: onToggleAnswer, children: [showAnswer ? _jsx(EyeOff, { size: 21 }) : _jsx(Eye, { size: 21 }), showAnswer ? '문제 다시 보기' : '정답 보기'] }) })] }));
}
export function QuestionPage({ question, showAnswer, onToggleAnswer, onBack, }) {
    const type = question.type ?? 'general';
    const answerType = question.answerType ?? 'short';
    const isHiddenPicture = type === 'hidden';
    const isOx = type === 'ox';
    if (isOx) {
        return (_jsx(OxQuestionView, { question: question, showAnswer: showAnswer, onToggleAnswer: onToggleAnswer, onBack: onBack }));
    }
    const questionImage = question.questionImageUrl ??
        ((type === 'image' || type === 'person' || type === 'hidden')
            ? question.mediaUrl
            : undefined);
    const visibleImage = showAnswer
        ? question.answerImageUrl ?? questionImage
        : questionImage;
    const visibleText = showAnswer
        ? question.answer
        : question.question;
    const audioMeta = getQuestionAudioMeta(question.id);
    const hasAudioMedia = !showAnswer &&
        Boolean(audioMeta.audioName &&
            audioMeta.audioLinked !== false);
    const hasVideoMedia = !showAnswer &&
        type === 'video' &&
        Boolean(question.mediaUrl);
    const hasImageMedia = Boolean(visibleImage);
    const hasMedia = !isHiddenPicture &&
        (hasVideoMedia ||
            hasImageMedia ||
            hasAudioMedia);
    const choices = question.choices ?? [];
    return (_jsxs("main", { className: "question-view", style: { position: 'relative' }, children: [_jsxs("header", { className: "question-toolbar", children: [_jsxs("button", { onClick: onBack, children: [_jsx(ArrowLeft, { size: 18 }), "\uBB38\uC81C\uD310"] }), _jsx("span", { children: showAnswer ? '정답' : '문제' })] }), _jsx("section", { className: `question-stage ${isHiddenPicture ? 'hidden-picture-stage' : ''}`, style: hasMedia
                    ? {
                        display: 'grid',
                        gridTemplateRows: !showAnswer &&
                            answerType ===
                                'multiple' &&
                            choices.length > 0
                            ? 'minmax(0, 1fr) auto auto'
                            : 'minmax(0, 1fr) auto',
                        alignItems: 'stretch',
                        gap: 10,
                        minHeight: 0,
                        overflow: 'visible',
                    }
                    : undefined, children: isHiddenPicture ? (_jsxs("div", { style: {
                        width: '100%',
                        height: '100%',
                        minHeight: 0,
                        display: 'grid',
                        gridTemplateRows: question.hiddenShowText && visibleText.trim()
                            ? 'minmax(0, 1fr) auto'
                            : 'minmax(0, 1fr)',
                        gap: question.hiddenShowText && visibleText.trim()
                            ? 8
                            : 0,
                    }, children: [visibleImage ? (_jsx(AdaptiveQuestionImage, { className: "hidden-picture", src: visibleImage, alt: showAnswer ? '정답 표시 그림' : '숨은그림 원본' })) : (_jsx("div", { className: "empty-media", children: "\uC774\uBBF8\uC9C0\uB97C \uB4F1\uB85D\uD574 \uC8FC\uC138\uC694." })), question.hiddenShowText && visibleText.trim() && (_jsx("div", { className: "hidden-picture-text", style: {
                                padding: '5px 14px 2px',
                                textAlign: 'center',
                                fontSize: 'clamp(18px, 1.45vw, 26px)',
                                lineHeight: 1.2,
                                fontWeight: 750,
                                color: '#f8fafc',
                                whiteSpace: 'pre-wrap',
                            }, children: visibleText }))] })) : (_jsxs(_Fragment, { children: [hasMedia && (_jsxs("div", { className: "question-media", style: {
                                width: '100%',
                                height: '100%',
                                maxWidth: '100%',
                                maxHeight: '100%',
                                minWidth: 0,
                                minHeight: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'visible',
                            }, children: [hasVideoMedia && (_jsx(QuestionVideo, { questionId: question.id, fallbackUrl: question.mediaUrl })), !hasVideoMedia &&
                                    hasImageMedia &&
                                    visibleImage && (_jsx(AdaptiveQuestionImage, { src: visibleImage, alt: showAnswer
                                        ? '정답 이미지'
                                        : '문제 이미지' })), !hasVideoMedia &&
                                    !hasImageMedia &&
                                    hasAudioMedia && (_jsx(QuestionAudioControl, { questionId: question.id, showAnswer: showAnswer, variant: "media" }))] })), _jsx("div", { className: `question-text ${getTextSize(visibleText.length)}`, style: hasMedia
                                ? {
                                    width: '100%',
                                    maxHeight: '24vh',
                                    padding: '10px 18px',
                                    overflow: 'hidden',
                                    lineHeight: 1.22,
                                    textAlign: 'center',
                                    wordBreak: 'keep-all',
                                    overflowWrap: 'anywhere',
                                }
                                : getTextOnlyQuestionStyle(visibleText.length), children: visibleText }), !showAnswer &&
                            answerType === 'multiple' &&
                            choices.length > 0 && (_jsx("div", { className: "choice-list", children: choices.map((choice, index) => (_jsxs("div", { className: `choice ${getChoiceSize(choice.length)}`, children: [_jsx("span", { children: index + 1 }), _jsx("strong", { children: choice })] }, `${question.id}-${index}`))) }))] })) }), _jsx("footer", { className: "question-footer", children: _jsxs("button", { onClick: onToggleAnswer, children: [showAnswer ? _jsx(EyeOff, { size: 21 }) : _jsx(Eye, { size: 21 }), isHiddenPicture
                            ? showAnswer
                                ? '원본 보기'
                                : '정답 그림 보기'
                            : showAnswer
                                ? '문제 다시 보기'
                                : '정답 보기'] }) })] }));
}

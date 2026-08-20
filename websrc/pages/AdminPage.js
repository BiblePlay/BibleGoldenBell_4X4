import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState, } from 'react';
import { ArrowLeft, Download, FileAudio, FileVideo, FolderOpen, ImagePlus, Play, RefreshCw, Save, Trash2, UploadCloud, } from 'lucide-react';
import { uploadProjectAsset } from '../utils/questionStorage.js';
import { exportDataPack as exportPortableDataPack, importDataPack as importPortableDataPack, } from '../utils/dataPack.js';
const SLOT_NUMBERS = Array.from({ length: 16 }, (_, index) => index + 1);
const FIXED_SCORES = [
    10, 10,
    20, 20,
    30, 30,
    40, 40,
    50, 50,
];
const ASSET_META_KEY = 'biblebell-4x4-admin-asset-meta';
const ASSET_DB_NAME = 'biblebell-4x4-admin-assets';
const ASSET_STORE_NAME = 'assets';
const AUTOSAVE_DELAY = 700;
const SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
];
const MAX_IMAGE_EDGE = 1920;
const emptyForm = {
    type: 'general',
    answerType: 'short',
    question: '',
    answer: '',
    hint: '',
    choices: ['', '', '', ''],
    mediaUrl: '',
    questionImageUrl: '',
    answerImageUrl: '',
    hiddenShowText: false,
};
const emptyAssetMeta = {};
const typeLabels = {
    general: '일반·초성·빈칸',
    ox: 'OX',
    image: '그림퀴즈',
    person: '인물퀴즈',
    video: '영상퀴즈',
    hidden: '숨은그림찾기',
};
const styles = {
    workspace: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) clamp(300px, 32vw, 430px)',
        gap: 22,
        alignItems: 'start',
        minWidth: 0,
    },
    editor: {
        minWidth: 0,
        display: 'grid',
        gap: 18,
    },
    preview: {
        position: 'sticky',
        top: 12,
        width: '100%',
        minWidth: 0,
        maxWidth: 430,
        maxHeight: 'calc(100vh - 96px)',
        padding: 14,
        display: 'grid',
        alignContent: 'start',
        gap: 10,
        overflow: 'auto',
        border: '1px solid #d9dee7',
        borderRadius: 12,
        background: '#f4f6f9',
    },
    previewHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    previewTabs: {
        display: 'flex',
        gap: 6,
    },
    previewTab: {
        height: 36,
        padding: '0 14px',
        border: '1px solid #c9d0dc',
        borderRadius: 7,
        background: '#fff',
        color: '#0e3166',
        fontWeight: 800,
        cursor: 'pointer',
    },
    previewTabActive: {
        color: '#fff',
        borderColor: '#ff730f',
        background: '#ff730f',
    },
    previewScreen: {
        width: '100%',
        minWidth: 0,
        minHeight: 0,
        aspectRatio: '16 / 9',
        padding: 14,
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr) auto',
        gap: 9,
        overflow: 'hidden',
        color: '#fff',
        borderRadius: 10,
        background: 'linear-gradient(180deg, #0e1d33, #07111f)',
    },
    previewTop: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        color: '#9fb0c7',
        fontSize: 11,
        lineHeight: 1,
        fontWeight: 800,
    },
    previewBody: {
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'center',
        gap: 8,
        overflow: 'hidden',
    },
    previewMedia: {
        width: '100%',
        minHeight: 0,
        flex: '1 1 auto',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        borderRadius: 7,
        background: '#050c15',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
    },
    previewVideo: {
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        display: 'block',
        objectFit: 'contain',
    },
    previewText: {
        width: '100%',
        flex: '0 0 auto',
        maxHeight: '34%',
        overflow: 'hidden',
        color: '#fff',
        fontSize: 20,
        lineHeight: 1.22,
        fontWeight: 900,
        textAlign: 'center',
        wordBreak: 'keep-all',
        overflowWrap: 'anywhere',
    },
    previewTextWithImage: {
        maxHeight: '25%',
        padding: '2px 4px 0',
        fontSize: 14,
        lineHeight: 1.24,
    },
    previewHint: {
        width: '100%',
        overflow: 'hidden',
        color: '#ffb14d',
        fontSize: 11,
        lineHeight: 1.25,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },
    previewChoiceGrid: {
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 5,
    },
    previewChoice: {
        minHeight: 30,
        padding: '5px 7px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        overflow: 'hidden',
        border: '1px solid #294565',
        borderRadius: 6,
        background: '#101c2e',
        fontSize: 10,
        lineHeight: 1.15,
        fontWeight: 800,
    },
    previewChoiceNumber: {
        width: 18,
        height: 18,
        flex: '0 0 18px',
        display: 'grid',
        placeItems: 'center',
        color: '#07111f',
        borderRadius: 4,
        background: '#ff9000',
        fontSize: 9,
    },
    previewScore: {
        justifySelf: 'end',
        color: '#ff9000',
        fontSize: 15,
        lineHeight: 1,
        fontWeight: 900,
    },
    mediaGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 12,
    },
    mediaCard: {
        minWidth: 0,
        padding: 12,
        display: 'grid',
        gap: 9,
        border: '1px solid #d9dee7',
        borderRadius: 10,
        background: '#fff',
        transition: 'border-color 120ms ease, box-shadow 120ms ease',
    },
    mediaCardEmphasis: {
        borderColor: '#ff730f',
        boxShadow: '0 0 0 3px rgba(255, 115, 15, .12)',
    },
    mediaHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    mediaTitle: {
        color: '#0e3166',
        fontWeight: 900,
    },
    mediaName: {
        width: '100%',
        minWidth: 0,
        overflow: 'hidden',
        color: '#6b7280',
        fontSize: 12,
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    dropZone: {
        height: 165,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        border: '1px dashed #aeb8c7',
        borderRadius: 8,
        background: '#eaf0f8',
        cursor: 'pointer',
    },
    dropZoneActive: {
        borderColor: '#ff730f',
        background: '#fff2e8',
    },
    unifiedMediaZone: {
        position: 'relative',
    },
    mediaDropWrap: {
        position: 'relative',
        minWidth: 0,
    },
    mediaDeleteOverlay: {
        position: 'absolute',
        right: 9,
        bottom: 9,
        zIndex: 8,
        width: 32,
        minWidth: 32,
        height: 32,
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        border: '1px solid rgba(255, 255, 255, .72)',
        borderRadius: 7,
        background: 'rgba(20, 28, 40, .78)',
        boxShadow: '0 3px 10px rgba(0, 0, 0, .22)',
        cursor: 'pointer',
    },
    unifiedMediaHint: {
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        pointerEvents: 'none',
    },
    unifiedMediaHintBox: {
        maxWidth: '82%',
        padding: '10px 14px',
        display: 'grid',
        placeItems: 'center',
        gap: 6,
        color: '#0e3166',
        borderRadius: 9,
        background: 'rgba(255, 255, 255, .9)',
        boxShadow: '0 4px 16px rgba(14, 49, 102, .12)',
        fontSize: 12,
        lineHeight: 1.45,
        fontWeight: 800,
        textAlign: 'center',
    },
    unifiedMediaFooter: {
        width: '100%',
        minWidth: 0,
        display: 'grid',
        gap: 7,
    },
    mediaPreviewImage: {
        width: '100%',
        height: '100%',
        display: 'block',
        objectPosition: 'center',
    },
    mediaPreviewContain: {
        objectFit: 'contain',
    },
    mediaPreviewCover: {
        objectFit: 'cover',
    },
    mediaPreviewVideo: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        background: '#07111f',
    },
    mediaEmpty: {
        padding: 16,
        display: 'grid',
        placeItems: 'center',
        gap: 8,
        color: '#7d8795',
        fontSize: 13,
        textAlign: 'center',
    },
    mediaActions: {
        width: '100%',
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'nowrap',
        gap: 7,
        overflow: 'hidden',
    },
    selectButton: {
        width: 34,
        minWidth: 34,
        maxWidth: 34,
        height: 34,
        minHeight: 34,
        padding: 0,
        boxSizing: 'border-box',
        flex: '0 0 34px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        border: 0,
        borderRadius: 7,
        background: '#0e3166',
        lineHeight: 1,
        overflow: 'hidden',
        cursor: 'pointer',
    },
    mediaActionButton: {
        width: 34,
        minWidth: 34,
        maxWidth: 34,
        height: 34,
        minHeight: 34,
        padding: 0,
        boxSizing: 'border-box',
        flex: '0 0 34px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#0e3166',
        border: '1px solid #c9d0dc',
        borderRadius: 7,
        background: '#fff',
        lineHeight: 1,
        overflow: 'hidden',
        cursor: 'pointer',
    },
    disabledButton: {
        color: '#9aa3af',
        borderColor: '#dfe3e8',
        background: '#f3f5f7',
        cursor: 'not-allowed',
        opacity: .68,
    },
    hiddenInput: {
        display: 'none',
    },
    deleteButton: {
        width: 34,
        minWidth: 34,
        maxWidth: 34,
        height: 34,
        minHeight: 34,
        padding: 0,
        boxSizing: 'border-box',
        flex: '0 0 34px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#b42318',
        border: '1px solid #efc8bf',
        borderRadius: 7,
        background: '#fff',
        lineHeight: 1,
        overflow: 'hidden',
        cursor: 'pointer',
    },
    audioPreview: {
        width: '100%',
    },
    audioOptionGroup: {
        padding: 10,
        display: 'grid',
        gap: 8,
        border: '1px solid #d9dee7',
        borderRadius: 8,
        background: '#fff',
    },
    audioOptionRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
    },
    audioOptionLabel: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: '#0e3166',
        fontSize: 13,
        fontWeight: 800,
        cursor: 'pointer',
    },
    autosave: {
        color: '#13795b',
        fontSize: 12,
        fontWeight: 800,
    },
    note: {
        margin: 0,
        color: '#6b7280',
        fontSize: 12,
        lineHeight: 1.45,
    },
};
function getFixedScore(_number) {
    return 0;
}
function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(new Error('파일 읽기 실패'));
        reader.readAsDataURL(file);
    });
}
function loadImageElement(sourceUrl) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('이미지를 불러오지 못했습니다.'));
        image.src = sourceUrl;
    });
}
function canvasToBlob(canvas, mimeType) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
                return;
            }
            reject(new Error('이미지 최적화에 실패했습니다.'));
        }, mimeType, mimeType === 'image/png'
            ? undefined
            : 0.9);
    });
}
async function optimizeImage(file) {
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        throw new Error('JPG, PNG, WEBP 형식만 등록할 수 있습니다.');
    }
    const sourceUrl = URL.createObjectURL(file);
    try {
        const image = await loadImageElement(sourceUrl);
        const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
        if (longestEdge <=
            MAX_IMAGE_EDGE) {
            return readFileAsDataUrl(file);
        }
        const scale = MAX_IMAGE_EDGE /
            longestEdge;
        const width = Math.max(1, Math.round(image.naturalWidth *
            scale));
        const height = Math.max(1, Math.round(image.naturalHeight *
            scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('이미지 최적화를 지원하지 않는 브라우저입니다.');
        }
        context.imageSmoothingEnabled =
            true;
        context.imageSmoothingQuality =
            'high';
        context.drawImage(image, 0, 0, width, height);
        const optimizedBlob = await canvasToBlob(canvas, file.type);
        return readFileAsDataUrl(optimizedBlob);
    }
    finally {
        URL.revokeObjectURL(sourceUrl);
    }
}
function loadMetaMap() {
    try {
        const saved = window.localStorage.getItem(ASSET_META_KEY);
        if (!saved)
            return {};
        const parsed = JSON.parse(saved);
        return parsed &&
            typeof parsed === 'object'
            ? parsed
            : {};
    }
    catch {
        return {};
    }
}
function saveMetaMap(metaMap) {
    window.localStorage.setItem(ASSET_META_KEY, JSON.stringify(metaMap));
}
function openAssetDb() {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(ASSET_DB_NAME, 1);
        request.onupgradeneeded =
            () => {
                const database = request.result;
                if (!database.objectStoreNames.contains(ASSET_STORE_NAME)) {
                    database.createObjectStore(ASSET_STORE_NAME);
                }
            };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
async function putAsset(key, file) {
    const database = await openAssetDb();
    await new Promise((resolve, reject) => {
        const transaction = database.transaction(ASSET_STORE_NAME, 'readwrite');
        transaction
            .objectStore(ASSET_STORE_NAME)
            .put(file, key);
        transaction.oncomplete =
            () => resolve();
        transaction.onerror =
            () => reject(transaction.error);
    });
    database.close();
}
async function getAsset(key) {
    const database = await openAssetDb();
    const result = await new Promise((resolve, reject) => {
        const transaction = database.transaction(ASSET_STORE_NAME, 'readonly');
        const request = transaction
            .objectStore(ASSET_STORE_NAME)
            .get(key);
        request.onsuccess = () => resolve(request.result instanceof
            Blob
            ? request.result
            : null);
        request.onerror = () => reject(request.error);
    });
    database.close();
    return result;
}
async function deleteAsset(key) {
    const database = await openAssetDb();
    await new Promise((resolve, reject) => {
        const transaction = database.transaction(ASSET_STORE_NAME, 'readwrite');
        transaction
            .objectStore(ASSET_STORE_NAME)
            .delete(key);
        transaction.oncomplete =
            () => resolve();
        transaction.onerror =
            () => reject(transaction.error);
    });
    database.close();
}
function getAssetKey(questionId, kind) {
    return `${questionId}:${kind}`;
}
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const value = String(reader.result ?? '');
            resolve(value.includes(',') ? value.split(',', 2)[1] : value);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}
function base64ToBlob(base64, type) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return new Blob([bytes], { type: type || 'application/octet-stream' });
}
function inferFileName(value, fallback) {
    if (!value)
        return undefined;
    if (value.startsWith('data:')) {
        return fallback;
    }
    const clean = value.split('?')[0];
    return (clean.split('/').pop() ||
        fallback);
}
function AdaptiveImagePreview({ src, alt, baseStyle, }) {
    const [hasTransparency, setHasTransparency,] = useState(null);
    useEffect(() => {
        let active = true;
        const image = new Image();
        image.onload = () => {
            if (!active)
                return;
            const sourceType = src.slice(5, src.indexOf(';'));
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
    return (_jsx("img", { style: {
            ...(baseStyle ??
                styles.mediaPreviewImage),
            ...(hasTransparency ===
                true
                ? styles.mediaPreviewContain
                : styles.mediaPreviewCover),
        }, src: src, alt: alt }));
}
function DropMediaCard({ title, icon, accept, fileName, preview, emptyText, emphasized, hasFile, previewLabel, unifiedMediaPicker, emptyActionLabel, onPreview, onSelect, onDelete, }) {
    const [dragging, setDragging,] = useState(false);
    const handleDrop = (event) => {
        event.preventDefault();
        setDragging(false);
        onSelect(event.dataTransfer
            .files?.[0]);
    };
    const fileInput = (_jsx("input", { style: styles.hiddenInput, type: "file", accept: accept, onChange: (event) => {
            onSelect(event.target
                .files?.[0]);
            event.target.value = '';
        } }));
    return (_jsxs("section", { style: {
            ...styles.mediaCard,
            ...(emphasized
                ? styles.mediaCardEmphasis
                : {}),
        }, children: [_jsxs("div", { style: styles.mediaHeader, children: [_jsx("span", { style: styles.mediaTitle, children: title }), icon] }), _jsxs("div", { style: styles.mediaDropWrap, children: [_jsxs("label", { style: {
                            ...styles.dropZone,
                            ...(unifiedMediaPicker
                                ? styles.unifiedMediaZone
                                : {}),
                            ...(dragging
                                ? styles.dropZoneActive
                                : {}),
                        }, onDragEnter: (event) => {
                            event.preventDefault();
                            setDragging(true);
                        }, onDragOver: (event) => {
                            event.preventDefault();
                            setDragging(true);
                        }, onDragLeave: () => setDragging(false), onDrop: handleDrop, children: [preview || (_jsxs("span", { style: styles.mediaEmpty, children: [unifiedMediaPicker ? (_jsx(FolderOpen, { size: 28 })) : (_jsx(UploadCloud, { size: 28 })), unifiedMediaPicker
                                        ? emptyActionLabel ??
                                            emptyText
                                        : emptyText, _jsx("small", { children: "\uB4DC\uB798\uADF8\uD558\uAC70\uB098 \uD074\uB9AD\uD574\uC11C \uC120\uD0DD" })] })), unifiedMediaPicker &&
                                preview &&
                                dragging && (_jsx("span", { style: styles.unifiedMediaHint, children: _jsxs("span", { style: styles.unifiedMediaHintBox, children: [_jsx(FolderOpen, { size: 22 }), "\uC0C8 \uD30C\uC77C\uC744 \uB193\uC73C\uBA74 \uAD50\uCCB4\uB429\uB2C8\uB2E4."] }) })), fileInput] }), hasFile && (_jsx("button", { type: "button", style: styles.mediaDeleteOverlay, title: "\uC0AD\uC81C", "aria-label": "\uC0AD\uC81C", onClick: (event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onDelete();
                        }, children: _jsx(Trash2, { size: 15 }) }))] }), !unifiedMediaPicker && (_jsx("div", { style: styles.mediaName, title: fileName, children: hasFile && fileName
                    ? fileName
                    : '등록된 파일 없음' })), unifiedMediaPicker ? (_jsxs("div", { style: styles.unifiedMediaFooter, children: [_jsx("div", { style: styles.mediaName, title: fileName, children: hasFile && fileName
                            ? fileName
                            : '등록된 파일 없음' }), _jsx("div", { style: styles.mediaActions, children: previewLabel && (_jsx("button", { type: "button", style: {
                                ...styles.mediaActionButton,
                                ...(!hasFile
                                    ? styles.disabledButton
                                    : {}),
                            }, title: previewLabel, "aria-label": previewLabel, disabled: !hasFile, onClick: onPreview, children: _jsx(Play, { size: 16 }) })) })] })) : (_jsxs("div", { style: styles.mediaActions, children: [_jsxs("label", { style: styles.selectButton, title: "\uD30C\uC77C \uC120\uD0DD", "aria-label": "\uD30C\uC77C \uC120\uD0DD", children: [_jsx(FolderOpen, { size: 17 }), fileInput] }), previewLabel && (_jsx("button", { type: "button", style: {
                            ...styles.mediaActionButton,
                            ...(!hasFile
                                ? styles.disabledButton
                                : {}),
                        }, title: previewLabel, "aria-label": previewLabel, disabled: !hasFile, onClick: onPreview, children: _jsx(Play, { size: 16 }) })), _jsxs("label", { style: {
                            ...styles.mediaActionButton,
                            ...(!hasFile
                                ? styles.disabledButton
                                : {}),
                        }, title: "\uBCC0\uACBD", "aria-label": "\uBCC0\uACBD", children: [_jsx(RefreshCw, { size: 16 }), hasFile && fileInput] })] }))] }));
}
export function AdminPage({ questions, onSave, onBack, }) {
    const [categoryId, setCategoryId] = useState('joseph');
    const [selectedNumber, setSelectedNumber,] = useState(1);
    const [form, setForm] = useState(emptyForm);
    const [assetMeta, setAssetMeta,] = useState(emptyAssetMeta);
    const [videoPreviewUrl, setVideoPreviewUrl,] = useState('');
    const [audioPreviewUrl, setAudioPreviewUrl,] = useState('');
    const [previewMode, setPreviewMode,] = useState('question');
    const [message, setMessage] = useState('');
    const [excelLoading, setExcelLoading] = useState(false);
    const [packBusy, setPackBusy] = useState(false);
    const packInputRef = useRef(null);
    const [autosaveState, setAutosaveState,] = useState('');
    const loadingRef = useRef(true);
    const autosaveTimerRef = useRef(null);
    const videoElementRef = useRef(null);
    const audioElementRef = useRef(null);
    const selectedQuestion = useMemo(() => questions.find((item) => item.categoryId ===
        categoryId &&
        item.number ===
            selectedNumber), [
        categoryId,
        questions,
        selectedNumber,
    ]);
    const questionId = selectedQuestion?.id ??
        `${categoryId}-${selectedNumber}`;
    useEffect(() => {
        loadingRef.current = true;
        if (!selectedQuestion) {
            setForm(emptyForm);
        }
        else {
            setForm({
                type: selectedQuestion.type ??
                    'general',
                answerType: selectedQuestion.answerType ??
                    'short',
                question: selectedQuestion.question,
                answer: selectedQuestion.answer,
                hint: selectedQuestion.hint ??
                    '',
                choices: selectedQuestion
                    .choices?.length === 4
                    ? [
                        ...selectedQuestion.choices,
                    ]
                    : ['', '', '', ''],
                mediaUrl: selectedQuestion.mediaUrl ??
                    '',
                questionImageUrl: selectedQuestion
                    .questionImageUrl ??
                    ((selectedQuestion.type ===
                        'image' ||
                        selectedQuestion.type ===
                            'person' ||
                        selectedQuestion.type ===
                            'hidden')
                        ? selectedQuestion
                            .mediaUrl ?? ''
                        : ''),
                answerImageUrl: selectedQuestion
                    .answerImageUrl ?? '',
                hiddenShowText: selectedQuestion.hiddenShowText ?? false,
            });
        }
        const metaMap = loadMetaMap();
        setAssetMeta(metaMap[questionId] ??
            emptyAssetMeta);
        let videoObjectUrl = '';
        let audioObjectUrl = '';
        const loadStoredAssets = async () => {
            try {
                const [videoBlob, audioBlob,] = await Promise.all([
                    getAsset(getAssetKey(questionId, 'video')),
                    getAsset(getAssetKey(questionId, 'audio')),
                ]);
                const currentMeta = loadMetaMap()[questionId] ??
                    emptyAssetMeta;
                const videoIsLinked = currentMeta.videoLinked ??
                    Boolean(currentMeta.videoName ||
                        selectedQuestion?.mediaUrl);
                const audioIsLinked = currentMeta.audioLinked ??
                    Boolean(currentMeta.audioName);
                if (videoBlob &&
                    videoIsLinked) {
                    videoObjectUrl =
                        URL.createObjectURL(videoBlob);
                    setVideoPreviewUrl(videoObjectUrl);
                }
                else if (videoIsLinked) {
                    setVideoPreviewUrl(selectedQuestion
                        ?.mediaUrl ?? '');
                }
                else {
                    setVideoPreviewUrl('');
                }
                if (audioBlob &&
                    audioIsLinked) {
                    audioObjectUrl =
                        URL.createObjectURL(audioBlob);
                    setAudioPreviewUrl(audioObjectUrl);
                }
                else {
                    setAudioPreviewUrl('');
                }
            }
            catch {
                setVideoPreviewUrl(selectedQuestion
                    ?.mediaUrl ?? '');
                setAudioPreviewUrl('');
            }
            finally {
                window.setTimeout(() => {
                    loadingRef.current = false;
                }, 0);
            }
        };
        void loadStoredAssets();
        return () => {
            if (videoObjectUrl) {
                URL.revokeObjectURL(videoObjectUrl);
            }
            if (audioObjectUrl) {
                URL.revokeObjectURL(audioObjectUrl);
            }
        };
    }, [
        categoryId,
        questionId,
        selectedNumber,
        selectedQuestion,
    ]);
    const updateMeta = (nextMeta) => {
        setAssetMeta(nextMeta);
        const metaMap = loadMetaMap();
        metaMap[questionId] =
            nextMeta;
        saveMetaMap(metaMap);
    };
    const buildQuestion = (targetCategoryId = categoryId, targetNumber = selectedNumber) => {
        const questionText = form.question.trim();
        const answerText = form.answer.trim();
        const choices = form.choices.map((choice) => choice.trim());
        return {
            id: targetCategoryId ===
                categoryId &&
                targetNumber ===
                    selectedNumber
                ? selectedQuestion?.id ??
                    `${targetCategoryId}-${targetNumber}`
                : `${targetCategoryId}-${targetNumber}`,
            categoryId: targetCategoryId,
            number: targetNumber,
            score: 0,
            type: form.type,
            answerType: form.type === 'ox'
                ? 'multiple'
                : form.answerType,
            question: form.type === 'hidden'
                ? questionText
                : questionText,
            answer: form.type === 'hidden'
                ? answerText
                : answerText,
            hint: form.hint.trim() ||
                undefined,
            choices: form.type === 'ox'
                ? ['O', 'X']
                : form.answerType ===
                    'multiple'
                    ? choices
                    : undefined,
            mediaUrl: form.type === 'video'
                ? form.mediaUrl.trim() ||
                    undefined
                : undefined,
            questionImageUrl: form.questionImageUrl ||
                undefined,
            answerImageUrl: form.answerImageUrl ||
                undefined,
            hiddenShowText: form.type === 'hidden'
                ? form.hiddenShowText
                : undefined,
        };
    };
    const buildQuestionSetWithCurrent = () => {
        const savedQuestion = buildQuestion();
        return [
            ...questions.filter((item) => !(item.categoryId ===
                categoryId &&
                item.number ===
                    selectedNumber)),
            savedQuestion,
        ].sort((a, b) => a.categoryId.localeCompare(b.categoryId) ||
            a.number - b.number);
    };
    const saveCurrentQuestion = (showMessage = true) => {
        const next = buildQuestionSetWithCurrent();
        onSave(next);
        if (showMessage) {
            setMessage(`${selectedNumber}번 문제가 저장되었습니다.`);
        }
    };
    const exportDataPack = async () => {
        if (packBusy)
            return;
        setPackBusy(true);
        setMessage('16문제와 이미지·동영상·오디오를 데이터 파일 하나로 모으는 중입니다...');
        try {
            const nextQuestions = buildQuestionSetWithCurrent();
            onSave(nextQuestions);
            const result = await exportPortableDataPack(nextQuestions);
            setMessage(`저장 완료 · ${result.fileName} · 미디어 ${result.assetCount}개 포함`);
        }
        catch (error) {
            setMessage(error instanceof Error
                ? error.message
                : '데이터 저장에 실패했습니다.');
        }
        finally {
            setPackBusy(false);
        }
    };
    const importDataPack = async (file) => {
        if (!file || packBusy)
            return;
        const confirmed = window.confirm('현재 16문제를 선택한 데이터 파일의 내용으로 바꿀까요?\n이미지·동영상·오디오도 함께 불러옵니다.');
        if (!confirmed) {
            if (packInputRef.current)
                packInputRef.current.value = '';
            return;
        }
        setPackBusy(true);
        setMessage('데이터 파일에서 문제와 미디어를 불러오는 중입니다...');
        try {
            const result = await importPortableDataPack(file);
            saveMetaMap(result.assetMeta);
            onSave(result.questions);
            setSelectedNumber(1);
            setAssetMeta(result.assetMeta[result.questions[0]?.id] ?? emptyAssetMeta);
            setMessage(`불러오기 완료 · 16문제와 미디어 ${result.importedFileCount}개를 적용했습니다.`);
        }
        catch (error) {
            setMessage(error instanceof Error
                ? error.message
                : '데이터 불러오기에 실패했습니다.');
        }
        finally {
            setPackBusy(false);
            if (packInputRef.current)
                packInputRef.current.value = '';
        }
    };
    useEffect(() => {
        if (loadingRef.current) {
            return;
        }
        if (autosaveTimerRef.current) {
            window.clearTimeout(autosaveTimerRef.current);
        }
        setAutosaveState('자동 저장 대기 중');
        autosaveTimerRef.current =
            window.setTimeout(() => {
                saveCurrentQuestion(false);
                setAutosaveState('자동 저장 완료');
            }, AUTOSAVE_DELAY);
        return () => {
            if (autosaveTimerRef.current) {
                window.clearTimeout(autosaveTimerRef.current);
            }
        };
    }, [form]);
    const updateImage = async (field, file) => {
        if (!file)
            return;
        try {
            const blob = field === 'questionImageUrl'
                ? await optimizeImage(file)
                : await readFileAsDataUrl(file);
            const uploadBlob = typeof blob === 'string'
                ? await (await fetch(blob)).blob()
                : blob;
            const value = await uploadProjectAsset(questionId, field === 'questionImageUrl' ? 'questionImage' : 'answerImage', uploadBlob, file.name);
            setForm((current) => ({
                ...current,
                [field]: value,
            }));
            updateMeta({
                ...assetMeta,
                [field ===
                    'questionImageUrl'
                    ? 'questionImageName'
                    : 'answerImageName']: file.name,
            });
            setMessage(field ===
                'questionImageUrl'
                ? '문제 이미지를 최적화하여 불러왔습니다.'
                : '이미지를 불러왔습니다.');
        }
        catch (error) {
            setMessage(error instanceof Error
                ? error.message
                : '이미지를 읽지 못했습니다.');
        }
    };
    const removeImage = (field) => {
        setForm((current) => ({
            ...current,
            [field]: '',
        }));
        const nextMeta = {
            ...assetMeta,
        };
        if (field ===
            'questionImageUrl') {
            delete nextMeta.questionImageName;
        }
        else {
            delete nextMeta.answerImageName;
        }
        updateMeta(nextMeta);
    };
    const updateVideo = async (file) => {
        if (!file)
            return;
        try {
            const savedUrl = await uploadProjectAsset(questionId, 'video', file, file.name);
            setVideoPreviewUrl(URL.createObjectURL(file));
            updateMeta({
                ...assetMeta,
                videoName: file.name,
                videoLinked: true,
            });
            setForm((current) => ({
                ...current,
                mediaUrl: savedUrl,
            }));
            setMessage('동영상을 불러왔습니다.');
        }
        catch {
            setMessage('동영상을 읽지 못했습니다.');
        }
    };
    const removeVideo = async () => {
        setVideoPreviewUrl('');
        setForm((current) => ({
            ...current,
            mediaUrl: '',
        }));
        updateMeta({
            ...assetMeta,
            videoLinked: false,
        });
        setMessage('현재 문제와 동영상의 연결을 해제했습니다.');
    };
    const updateAudio = async (file) => {
        if (!file)
            return;
        try {
            const savedUrl = await uploadProjectAsset(questionId, 'audio', file, file.name);
            await putAsset(getAssetKey(questionId, 'audio'), file);
            setAudioPreviewUrl(savedUrl);
            updateMeta({
                ...assetMeta,
                audioName: file.name,
                audioLinked: true,
                audioPlayback: assetMeta.audioPlayback ??
                    'manual',
            });
            setMessage('오디오를 등록했습니다.');
        }
        catch {
            setMessage('오디오를 읽지 못했습니다.');
        }
    };
    const removeAudio = async () => {
        setAudioPreviewUrl('');
        updateMeta({
            ...assetMeta,
            audioLinked: false,
        });
        setMessage('현재 문제와 오디오의 연결을 해제했습니다.');
    };
    const submit = (event) => {
        event.preventDefault();
        const questionText = form.question.trim();
        const answerText = form.answer.trim();
        const choices = form.choices.map((choice) => choice.trim());
        if (form.type !== 'hidden' &&
            (!questionText ||
                !answerText)) {
            setMessage('문제와 정답을 입력해 주세요.');
            return;
        }
        if (form.type === 'hidden' &&
            !form.questionImageUrl) {
            setMessage('숨은그림 원본 이미지를 등록해 주세요.');
            return;
        }
        if (form.answerType ===
            'multiple' &&
            form.type !== 'ox') {
            if (choices.some((choice) => !choice)) {
                setMessage('보기 4개를 모두 입력해 주세요.');
                return;
            }
            if (!choices.includes(answerText)) {
                setMessage('정답은 보기 중 하나와 같아야 합니다.');
                return;
            }
        }
        if (form.type === 'video' &&
            !form.mediaUrl.trim()) {
            setMessage('동영상을 선택하거나 영상 주소를 입력해 주세요.');
            return;
        }
        saveCurrentQuestion(true);
    };
    const showTextFields = form.type !== 'hidden' ||
        form.hiddenShowText;
    const showChoices = form.answerType ===
        'multiple' &&
        form.type !== 'ox' &&
        form.type !== 'hidden';
    const showAnswerInput = form.type !== 'hidden' ||
        form.hiddenShowText;
    const showQuestionImage = true;
    const showAnswerImage = true;
    const showVideo = true;
    const showAudio = true;
    const previewImage = previewMode === 'question'
        ? form.questionImageUrl
        : form.answerImageUrl;
    const previewText = previewMode === 'question'
        ? form.question
        : form.answer;
    const isQuestionImageEmphasized = form.type === 'image' ||
        form.type === 'hidden';
    const hasQuestionImage = Boolean(form.questionImageUrl);
    const hasAnswerImage = Boolean(form.answerImageUrl);
    const hasVideo = Boolean(videoPreviewUrl &&
        assetMeta.videoLinked !== false);
    const hasAudio = Boolean(audioPreviewUrl &&
        assetMeta.audioLinked !== false);
    return (_jsx("main", { className: "admin-page", children: _jsxs("section", { className: "admin-panel", children: [_jsxs("header", { className: "admin-header", children: [_jsxs("div", { children: [_jsx("span", { children: "ADMIN" }), _jsx("h1", { children: "16\uBB38\uC81C \uAD00\uB9AC" }), _jsx("p", { children: "1\uBC88\uBD80\uD130 16\uBC88\uAE4C\uC9C0 \uAC01 \uBB38\uC81C\uC758 \uC720\uD615\uACFC \uB0B4\uC6A9\uC744 \uC9C1\uC811 \uC124\uC815\uD569\uB2C8\uB2E4." })] }), _jsxs("div", { className: "admin-header-actions", children: [_jsx("input", { ref: packInputRef, type: "file", accept: ".bb4,application/octet-stream", hidden: true, onChange: (event) => void importDataPack(event.target.files?.[0]) }), _jsxs("button", { type: "button", className: "admin-secondary-button", disabled: packBusy, onClick: () => void exportDataPack(), children: [_jsx(Download, { size: 18 }), packBusy
                                            ? '처리 중'
                                            : '데이터 저장'] }), _jsxs("button", { type: "button", className: "admin-secondary-button", disabled: packBusy, onClick: () => packInputRef.current?.click(), children: [_jsx(UploadCloud, { size: 18 }), "\uB370\uC774\uD130 \uBD88\uB7EC\uC624\uAE30"] }), _jsxs("button", { type: "button", className: "admin-secondary-button", onClick: onBack, children: [_jsx(ArrowLeft, { size: 18 }), "\uD589\uC0AC \uD654\uBA74"] })] })] }), _jsxs("div", { className: "admin-layout", children: [_jsxs("aside", { className: "admin-nav", children: [_jsx("div", { className: "admin-nav-kicker", children: "4\u00D74 BOARD" }), _jsx("div", { className: "admin-nav-title", children: "16\uBB38\uC81C" }), _jsx("div", { className: "admin-slot-label", children: "\uBB38\uC81C \uBC88\uD638" }), _jsx("div", { className: "admin-slots", children: SLOT_NUMBERS.map((number) => {
                                        const question = questions.find((item) => item.categoryId ===
                                            categoryId &&
                                            item.number ===
                                                number);
                                        return (_jsx("button", { type: "button", className: [
                                                selectedNumber ===
                                                    number
                                                    ? 'is-selected'
                                                    : '',
                                                question &&
                                                    (question.question.trim() ||
                                                        question.answer.trim() ||
                                                        question.questionImageUrl ||
                                                        question.answerImageUrl ||
                                                        question.mediaUrl)
                                                    ? 'is-filled'
                                                    : '',
                                            ]
                                                .filter(Boolean)
                                                .join(' '), onClick: () => {
                                                setSelectedNumber(number);
                                                setMessage('');
                                            }, children: _jsx("strong", { children: number }) }, number));
                                    }) })] }), _jsxs("form", { className: "admin-form", onSubmit: submit, children: [_jsxs("div", { className: "admin-form-title", children: [selectedNumber, "\uBC88 \uBB38\uC81C"] }), _jsxs("div", { style: styles.workspace, children: [_jsxs("div", { style: styles.editor, children: [_jsxs("div", { className: "admin-form-grid", children: [_jsxs("label", { children: [_jsx("span", { children: "\uBB38\uC81C \uC720\uD615" }), _jsx("select", { value: form.type, onChange: (event) => setForm((current) => ({
                                                                        ...current,
                                                                        type: event.target
                                                                            .value,
                                                                        answerType: event.target
                                                                            .value ===
                                                                            'ox'
                                                                            ? 'multiple'
                                                                            : current.answerType,
                                                                    })), children: Object.entries(typeLabels).map(([value, label,]) => (_jsx("option", { value: value, children: label }, value))) })] }), form.type !==
                                                            'ox' &&
                                                            form.type !==
                                                                'hidden' && (_jsxs("label", { children: [_jsx("span", { children: "\uB2F5\uBCC0 \uBC29\uC2DD" }), _jsxs("select", { value: form.answerType, onChange: (event) => setForm((current) => ({
                                                                        ...current,
                                                                        answerType: event
                                                                            .target
                                                                            .value,
                                                                    })), children: [_jsx("option", { value: "short", children: "\uB2E8\uB2F5\uD615" }), _jsx("option", { value: "multiple", children: "4\uC9C0\uC120\uB2E4" })] })] }))] }), form.type === 'hidden' && (_jsxs("label", { style: {
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 10,
                                                        padding: '12px 14px',
                                                        border: '1px solid #d9dee7',
                                                        borderRadius: 10,
                                                        background: '#f8fafc',
                                                    }, children: [_jsx("input", { type: "checkbox", checked: form.hiddenShowText, onChange: (event) => setForm((current) => ({
                                                                ...current,
                                                                hiddenShowText: event.target.checked,
                                                            })), style: { width: 18, height: 18 } }), _jsx("span", { children: "\uC228\uC740\uADF8\uB9BC \uD654\uBA74\uC5D0 \uBB38\uC81C\u00B7\uC815\uB2F5 \uAE00\uC790 \uD45C\uC2DC" })] })), showTextFields && (_jsxs("label", { children: [_jsx("span", { children: "\uBB38\uC81C" }), _jsx("textarea", { rows: form.type === 'hidden' ? 2 : 7, value: form.question, onChange: (event) => setForm((current) => ({
                                                                ...current,
                                                                question: event.target
                                                                    .value,
                                                            })) })] })), showChoices && (_jsxs("div", { className: "admin-choices", children: [_jsx("span", { children: "\uBCF4\uAE30" }), form.choices.map((choice, index) => (_jsxs("label", { children: [_jsx("strong", { children: index + 1 }), _jsx("input", { value: choice, onChange: (event) => setForm((current) => ({
                                                                        ...current,
                                                                        choices: current.choices.map((item, itemIndex) => itemIndex ===
                                                                            index
                                                                            ? event
                                                                                .target
                                                                                .value
                                                                            : item),
                                                                    })) })] }, index)))] })), showAnswerInput && (_jsxs("label", { children: [_jsx("span", { children: "\uC815\uB2F5" }), form.type ===
                                                            'ox' ? (_jsxs("select", { value: form.answer, onChange: (event) => setForm((current) => ({
                                                                ...current,
                                                                answer: event
                                                                    .target
                                                                    .value,
                                                            })), children: [_jsx("option", { value: "", children: "\uC120\uD0DD" }), _jsx("option", { value: "O", children: "O" }), _jsx("option", { value: "X", children: "X" })] })) : (_jsx("input", { value: form.answer, onChange: (event) => setForm((current) => ({
                                                                ...current,
                                                                answer: event
                                                                    .target
                                                                    .value,
                                                            })) }))] })), _jsxs("label", { children: [_jsx("span", { children: "\uD78C\uD2B8 (\uC120\uD0DD)" }), _jsx("input", { value: form.hint, onChange: (event) => setForm((current) => ({
                                                                ...current,
                                                                hint: event.target
                                                                    .value,
                                                            })), placeholder: "\uD544\uC694\uD55C \uBB38\uC81C\uC5D0\uB9CC \uC785\uB825\uD558\uC138\uC694." })] }), (showQuestionImage ||
                                                    showAnswerImage ||
                                                    showVideo ||
                                                    showAudio) && (_jsxs("div", { style: styles.mediaGrid, children: [showQuestionImage && (_jsx(DropMediaCard, { title: form.type ===
                                                                'hidden'
                                                                ? '원본 그림'
                                                                : '문제 이미지', icon: _jsx(ImagePlus, { size: 18 }), accept: "image/jpeg,image/png,image/webp", hasFile: hasQuestionImage, unifiedMediaPicker: true, emptyActionLabel: "\uC774\uBBF8\uC9C0 \uB123\uAE30", emphasized: isQuestionImageEmphasized, fileName: assetMeta.questionImageName ??
                                                                inferFileName(form.questionImageUrl, '기존 등록 이미지'), preview: form.questionImageUrl ? (_jsx(AdaptiveImagePreview, { src: form.questionImageUrl, alt: "\uBB38\uC81C \uC774\uBBF8\uC9C0 \uBBF8\uB9AC\uBCF4\uAE30" })) : null, emptyText: "\uBB38\uC81C \uC774\uBBF8\uC9C0\uB97C \uB4F1\uB85D\uD558\uC138\uC694.", onSelect: (file) => void updateImage('questionImageUrl', file), onDelete: () => removeImage('questionImageUrl') })), showAnswerImage && (_jsx(DropMediaCard, { title: form.type ===
                                                                'hidden'
                                                                ? '정답 그림'
                                                                : '정답 이미지', icon: _jsx(ImagePlus, { size: 18 }), accept: "image/jpeg,image/png,image/webp", hasFile: hasAnswerImage, unifiedMediaPicker: true, emptyActionLabel: "\uC774\uBBF8\uC9C0 \uB123\uAE30", fileName: assetMeta.answerImageName ??
                                                                inferFileName(form.answerImageUrl, '기존 등록 이미지'), preview: form.answerImageUrl ? (_jsx(AdaptiveImagePreview, { src: form.answerImageUrl, alt: "\uC815\uB2F5 \uC774\uBBF8\uC9C0 \uBBF8\uB9AC\uBCF4\uAE30" })) : null, emptyText: "\uC815\uB2F5 \uC774\uBBF8\uC9C0\uB97C \uB4F1\uB85D\uD558\uC138\uC694.", onSelect: (file) => void updateImage('answerImageUrl', file), onDelete: () => removeImage('answerImageUrl') })), showVideo && (_jsx(DropMediaCard, { title: "\uB3D9\uC601\uC0C1", icon: _jsx(FileVideo, { size: 18 }), accept: "video/*", hasFile: hasVideo, unifiedMediaPicker: true, emptyActionLabel: "\uB3D9\uC601\uC0C1 \uB4F1\uB85D", emphasized: true, previewLabel: "\uBBF8\uB9AC\uBCF4\uAE30", onPreview: () => {
                                                                void videoElementRef.current?.play();
                                                            }, fileName: hasVideo
                                                                ? assetMeta.videoName ??
                                                                    inferFileName(form.mediaUrl, '기존 등록 영상')
                                                                : undefined, preview: videoPreviewUrl ? (_jsx("video", { ref: videoElementRef, style: styles.mediaPreviewVideo, src: videoPreviewUrl, controls: true, muted: true, preload: "metadata" })) : null, emptyText: "\uB3D9\uC601\uC0C1\uC744 \uB4F1\uB85D\uD558\uC138\uC694.", onSelect: (file) => void updateVideo(file), onDelete: () => void removeVideo() })), showAudio && (_jsxs("div", { style: {
                                                                display: 'grid',
                                                                gap: 10,
                                                            }, children: [_jsx(DropMediaCard, { title: "\uC624\uB514\uC624", icon: _jsx(FileAudio, { size: 18 }), accept: "audio/*", hasFile: hasAudio, unifiedMediaPicker: true, emptyActionLabel: "\uC624\uB514\uC624 \uB4F1\uB85D", emphasized: true, previewLabel: "\uC7AC\uC0DD", onPreview: () => {
                                                                        void audioElementRef.current?.play();
                                                                    }, fileName: hasAudio
                                                                        ? assetMeta.audioName
                                                                        : undefined, preview: audioPreviewUrl ? (_jsx("audio", { ref: audioElementRef, style: styles.audioPreview, src: audioPreviewUrl, controls: true, preload: "metadata" })) : null, emptyText: "\uC624\uB514\uC624\uB97C \uB4F1\uB85D\uD558\uC138\uC694.", onSelect: (file) => void updateAudio(file), onDelete: () => void removeAudio() }), _jsxs("div", { style: styles.audioOptionGroup, children: [_jsx("span", { children: "\uC624\uB514\uC624 \uC7AC\uC0DD \uBC29\uC2DD" }), _jsxs("div", { style: styles.audioOptionRow, children: [_jsxs("label", { style: {
                                                                                        ...styles.audioOptionLabel,
                                                                                        ...(!hasAudio
                                                                                            ? styles.disabledButton
                                                                                            : {}),
                                                                                    }, children: [_jsx("input", { type: "radio", name: "audio-playback", value: "auto", disabled: !hasAudio, checked: (assetMeta.audioPlayback ??
                                                                                                'manual') === 'auto', onChange: () => updateMeta({
                                                                                                ...assetMeta,
                                                                                                audioPlayback: 'auto',
                                                                                            }) }), "\uC790\uB3D9 \uC7AC\uC0DD"] }), _jsxs("label", { style: {
                                                                                        ...styles.audioOptionLabel,
                                                                                        ...(!hasAudio
                                                                                            ? styles.disabledButton
                                                                                            : {}),
                                                                                    }, children: [_jsx("input", { type: "radio", name: "audio-playback", value: "manual", disabled: !hasAudio, checked: (assetMeta.audioPlayback ??
                                                                                                'manual') === 'manual', onChange: () => updateMeta({
                                                                                                ...assetMeta,
                                                                                                audioPlayback: 'manual',
                                                                                            }) }), "\uC218\uB3D9 \uC7AC\uC0DD"] })] })] })] }))] })), form.type ===
                                                    'video' && (_jsxs("label", { children: [_jsx("span", { children: "\uC601\uC0C1 \uC8FC\uC18C" }), _jsx("input", { value: form.mediaUrl, onChange: (event) => setForm((current) => ({
                                                                ...current,
                                                                mediaUrl: event.target
                                                                    .value,
                                                            })), placeholder: "/videos/question.mp4 \uB610\uB294 \uC601\uC0C1 URL" })] })), _jsx("p", { style: styles.note, children: "\uC785\uB825 \uB0B4\uC6A9\uC740 \uC790\uB3D9 \uC800\uC7A5\uB418\uBA70, \uC800\uC7A5 \uBC84\uD2BC\uC73C\uB85C \uC989\uC2DC \uC218\uB3D9 \uC800\uC7A5\uD560 \uC218\uB3C4 \uC788\uC2B5\uB2C8\uB2E4." })] }), _jsxs("aside", { style: styles.preview, children: [_jsxs("div", { style: styles.previewHeader, children: [_jsx("strong", { children: "\uC2E4\uC81C \uD654\uBA74 \uBBF8\uB9AC\uBCF4\uAE30" }), _jsx("div", { style: styles.previewTabs, children: [
                                                                'question',
                                                                'answer',
                                                            ].map((mode) => (_jsx("button", { type: "button", style: {
                                                                    ...styles.previewTab,
                                                                    ...(previewMode ===
                                                                        mode
                                                                        ? styles.previewTabActive
                                                                        : {}),
                                                                }, onClick: () => setPreviewMode(mode), children: mode ===
                                                                    'question'
                                                                    ? '문제'
                                                                    : '정답' }, mode))) })] }), _jsxs("div", { style: styles.previewScreen, children: [_jsxs("div", { style: styles.previewTop, children: [_jsx("span", { children: "4\u00D74 BOARD" }), _jsxs("span", { children: [selectedNumber, "\uBC88"] })] }), _jsxs("div", { style: styles.previewBody, children: [form.type ===
                                                                    'video' &&
                                                                    previewMode ===
                                                                        'question' &&
                                                                    videoPreviewUrl ? (_jsx("div", { style: styles.previewMedia, children: _jsx("video", { style: styles.previewVideo, src: videoPreviewUrl, controls: true, muted: true, preload: "metadata" }) })) : previewImage ? (_jsx("div", { style: styles.previewMedia, children: _jsx(AdaptiveImagePreview, { baseStyle: styles.previewImage, src: previewImage, alt: "\uBB38\uC81C \uD654\uBA74 \uBBF8\uB9AC\uBCF4\uAE30" }) })) : null, (form.type !== 'hidden' ||
                                                                    form.hiddenShowText) && (_jsx("div", { style: {
                                                                        ...styles.previewText,
                                                                        ...(previewImage
                                                                            ? styles.previewTextWithImage
                                                                            : {}),
                                                                    }, children: previewText ||
                                                                        (previewMode ===
                                                                            'question'
                                                                            ? '문제 내용이 여기에 표시됩니다.'
                                                                            : '정답 내용이 여기에 표시됩니다.') })), previewMode ===
                                                                    'question' &&
                                                                    form.answerType ===
                                                                        'multiple' &&
                                                                    form.type !==
                                                                        'ox' && (_jsx("div", { style: styles.previewChoiceGrid, children: form.choices.map((choice, index) => (_jsxs("div", { style: styles.previewChoice, children: [_jsx("span", { style: styles.previewChoiceNumber, children: index + 1 }), _jsx("span", { children: choice ||
                                                                                    `보기 ${index + 1}` })] }, index))) })), previewMode ===
                                                                    'question' &&
                                                                    form.type ===
                                                                        'ox' && (_jsx("div", { style: styles.previewChoiceGrid, children: ['O', 'X'].map((choice) => (_jsx("div", { style: {
                                                                            ...styles.previewChoice,
                                                                            justifyContent: 'center',
                                                                            fontSize: 22,
                                                                        }, children: choice }, choice))) })), form.hint &&
                                                                    previewMode ===
                                                                        'question' && (_jsxs("div", { style: styles.previewHint, children: ["\uD78C\uD2B8: ", form.hint] })), audioPreviewUrl && (_jsx("audio", { style: styles.audioPreview, src: audioPreviewUrl, controls: true, preload: "metadata" }))] }), _jsxs("div", { style: styles.previewScore, children: [selectedNumber, "\uBC88"] })] })] })] }), _jsxs("footer", { className: "admin-form-footer", children: [_jsxs("div", { children: [_jsx("p", { children: message }), _jsx("span", { style: styles.autosave, children: autosaveState })] }), _jsxs("button", { type: "submit", children: [_jsx(Save, { size: 18 }), "\uC800\uC7A5"] })] })] })] })] }) }));
}

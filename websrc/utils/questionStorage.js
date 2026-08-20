import { questions as seedQuestions } from '../data/questions.js';
const STORAGE_KEY = 'biblegoldenbell-4x4-questions-json';
const LEGACY_STORAGE_KEY = 'biblebell-4x4-questions-json';
const EXPECTED_QUESTION_COUNT = 16;
const BASE_PATH = '/BibleGoldenBell_4X4/';
const ASSET_DB_NAME = 'biblebell-4x4-admin-assets';
const ASSET_STORE_NAME = 'assets';
const QUESTION_DB_NAME = 'biblegoldenbell-4x4-content';
const QUESTION_STORE_NAME = 'data';
const QUESTION_RECORD_KEY = 'questions';
const LOCAL_STORAGE_SOFT_LIMIT = 2500000;
function normalizeQuestion(question) {
    const type = question.type ?? 'general';
    return {
        ...question,
        type,
        answerType: question.answerType ?? 'short',
        score: 0,
        choices: question.answerType === 'multiple' && Array.isArray(question.choices)
            ? question.choices.slice(0, 4)
            : undefined,
        questionImageUrl: question.questionImageUrl ??
            ((type === 'image' || type === 'person' || type === 'hidden')
                ? question.mediaUrl
                : undefined),
    };
}
function isValidQuestionSet(value) {
    return Array.isArray(value) && value.length === EXPECTED_QUESTION_COUNT;
}
function normalizeSet(value) {
    return [...value]
        .sort((a, b) => a.number - b.number)
        .slice(0, EXPECTED_QUESTION_COUNT)
        .map(normalizeQuestion);
}
function openQuestionDb() {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(QUESTION_DB_NAME, 1);
        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(QUESTION_STORE_NAME)) {
                database.createObjectStore(QUESTION_STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
async function readQuestionsFromDb() {
    try {
        const database = await openQuestionDb();
        const result = await new Promise((resolve, reject) => {
            const transaction = database.transaction(QUESTION_STORE_NAME, 'readonly');
            const request = transaction
                .objectStore(QUESTION_STORE_NAME)
                .get(QUESTION_RECORD_KEY);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        database.close();
        return isValidQuestionSet(result) ? normalizeSet(result) : null;
    }
    catch {
        return null;
    }
}
async function writeQuestionsToDb(questions) {
    const database = await openQuestionDb();
    await new Promise((resolve, reject) => {
        const transaction = database.transaction(QUESTION_STORE_NAME, 'readwrite');
        transaction
            .objectStore(QUESTION_STORE_NAME)
            .put(questions, QUESTION_RECORD_KEY);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
    database.close();
}
function loadLocalQuestions() {
    for (const key of [STORAGE_KEY, LEGACY_STORAGE_KEY]) {
        try {
            const saved = window.localStorage.getItem(key);
            if (!saved)
                continue;
            const parsed = JSON.parse(saved);
            if (isValidQuestionSet(parsed))
                return normalizeSet(parsed);
        }
        catch {
            // Try the next source.
        }
    }
    return null;
}
function cacheSmallQuestionSet(questions) {
    try {
        const serialized = JSON.stringify(questions);
        if (serialized.length <= LOCAL_STORAGE_SOFT_LIMIT) {
            window.localStorage.setItem(STORAGE_KEY, serialized);
        }
        else {
            window.localStorage.removeItem(STORAGE_KEY);
        }
    }
    catch {
        window.localStorage.removeItem(STORAGE_KEY);
    }
}
function openAssetDb() {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(ASSET_DB_NAME, 1);
        request.onupgradeneeded = () => {
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
        transaction.objectStore(ASSET_STORE_NAME).put(file, key);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
    database.close();
}
function readBlobAsDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}
export function loadQuestions() {
    return loadLocalQuestions() ?? seedQuestions.map(normalizeQuestion);
}
export async function loadQuestionsFromProject() {
    const databaseQuestions = await readQuestionsFromDb();
    if (databaseQuestions) {
        cacheSmallQuestionSet(databaseQuestions);
        return databaseQuestions;
    }
    const localQuestions = loadLocalQuestions();
    if (localQuestions) {
        void writeQuestionsToDb(localQuestions).catch(() => undefined);
        cacheSmallQuestionSet(localQuestions);
        return localQuestions;
    }
    try {
        const response = await fetch(`${BASE_PATH}content/questions.json`, {
            cache: 'no-store',
        });
        if (!response.ok)
            throw new Error('seed unavailable');
        const parsed = await response.json();
        if (!isValidQuestionSet(parsed))
            throw new Error('invalid seed');
        const normalized = normalizeSet(parsed);
        await writeQuestionsToDb(normalized).catch(() => undefined);
        cacheSmallQuestionSet(normalized);
        return normalized;
    }
    catch {
        const normalized = seedQuestions.map(normalizeQuestion);
        await writeQuestionsToDb(normalized).catch(() => undefined);
        cacheSmallQuestionSet(normalized);
        return normalized;
    }
}
export function saveQuestions(questions) {
    const normalized = normalizeSet(questions);
    cacheSmallQuestionSet(normalized);
    void writeQuestionsToDb(normalized).catch((error) => {
        console.error('문제 데이터 저장 실패', error);
    });
}
export async function uploadProjectAsset(questionId, kind, file, _filename) {
    if (kind === 'questionImage' || kind === 'answerImage') {
        return readBlobAsDataUrl(file);
    }
    const key = `${questionId}:${kind}`;
    await putAsset(key, file);
    return `bb4asset://${key}`;
}

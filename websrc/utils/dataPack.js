const FORMAT = 'BibleGoldenBell4X4DataPack';
const VERSION = 2;
const MAGIC = 'BB4PACK2';
const ASSET_META_KEY = 'biblebell-4x4-admin-asset-meta';
const ASSET_DB_NAME = 'biblebell-4x4-admin-assets';
const ASSET_STORE_NAME = 'assets';
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
async function getAsset(key) {
    const database = await openAssetDb();
    const result = await new Promise((resolve, reject) => {
        const transaction = database.transaction(ASSET_STORE_NAME, 'readonly');
        const request = transaction.objectStore(ASSET_STORE_NAME).get(key);
        request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
        request.onerror = () => reject(request.error);
    });
    database.close();
    return result;
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
async function deleteAsset(key) {
    const database = await openAssetDb();
    await new Promise((resolve, reject) => {
        const transaction = database.transaction(ASSET_STORE_NAME, 'readwrite');
        transaction.objectStore(ASSET_STORE_NAME).delete(key);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
    database.close();
}
function getAssetKey(questionId, kind) {
    return `${questionId}:${kind}`;
}
function loadMetaMap() {
    try {
        const saved = window.localStorage.getItem(ASSET_META_KEY);
        if (!saved)
            return {};
        const parsed = JSON.parse(saved);
        return parsed && typeof parsed === 'object' ? parsed : {};
    }
    catch {
        return {};
    }
}
function saveMetaMap(metaMap) {
    window.localStorage.setItem(ASSET_META_KEY, JSON.stringify(metaMap));
}
function dataUrlToBlob(value) {
    if (!value.startsWith('data:'))
        return null;
    const commaIndex = value.indexOf(',');
    if (commaIndex < 0)
        return null;
    const header = value.slice(5, commaIndex);
    const payload = value.slice(commaIndex + 1);
    const [typePart, ...flags] = header.split(';');
    const isBase64 = flags.includes('base64');
    try {
        if (isBase64) {
            const binary = window.atob(payload);
            const bytes = new Uint8Array(binary.length);
            for (let index = 0; index < binary.length; index += 1) {
                bytes[index] = binary.charCodeAt(index);
            }
            return new Blob([bytes], {
                type: typePart || 'application/octet-stream',
            });
        }
        return new Blob([decodeURIComponent(payload)], {
            type: typePart || 'application/octet-stream',
        });
    }
    catch {
        return null;
    }
}
function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
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
function validateQuestions(value) {
    if (!Array.isArray(value) || value.length !== 16) {
        throw new Error('데이터 파일에 16문제가 들어 있지 않습니다.');
    }
    const sorted = [...value];
    sorted.sort((a, b) => Number(a.number) - Number(b.number));
    return sorted;
}
function inferImageName(meta, kind, questionId, type) {
    const known = kind === 'questionImage' ? meta.questionImageName : meta.answerImageName;
    if (known)
        return known;
    const ext = type.includes('png')
        ? 'png'
        : type.includes('webp')
            ? 'webp'
            : 'jpg';
    return `${questionId}-${kind}.${ext}`;
}
function downloadBlob(blob, fileName) {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
export async function exportDataPack(questions) {
    const normalizedQuestions = [...questions]
        .sort((a, b) => a.number - b.number)
        .slice(0, 16);
    if (normalizedQuestions.length !== 16) {
        throw new Error('16문제가 모두 준비되어 있어야 데이터를 저장할 수 있습니다.');
    }
    const metaMap = loadMetaMap();
    const packedQuestions = normalizedQuestions.map((question) => ({ ...question }));
    const blobs = [];
    const assets = [];
    const addAsset = (key, kind, blob, name) => {
        assets.push({
            key,
            kind,
            type: blob.type || 'application/octet-stream',
            name,
            size: blob.size,
        });
        blobs.push(blob);
    };
    for (const question of packedQuestions) {
        const meta = metaMap[question.id] ?? {};
        for (const kind of ['questionImage', 'answerImage']) {
            const field = kind === 'questionImage' ? 'questionImageUrl' : 'answerImageUrl';
            const value = question[field] ?? '';
            const blob = dataUrlToBlob(value);
            if (!blob)
                continue;
            const key = getAssetKey(question.id, kind);
            addAsset(key, kind, blob, inferImageName(meta, kind, question.id, blob.type));
            question[field] = `bb4pack://${key}`;
        }
        for (const kind of ['video', 'audio']) {
            const linked = kind === 'video' ? meta.videoLinked !== false : meta.audioLinked !== false;
            if (!linked)
                continue;
            const key = getAssetKey(question.id, kind);
            const blob = await getAsset(key);
            if (!blob)
                continue;
            addAsset(key, kind, blob, kind === 'video'
                ? meta.videoName ?? `${question.id}-video`
                : meta.audioName ?? `${question.id}-audio`);
        }
    }
    const manifest = {
        format: FORMAT,
        version: VERSION,
        exportedAt: new Date().toISOString(),
        questions: packedQuestions,
        assetMeta: metaMap,
        assets,
    };
    const encoder = new TextEncoder();
    const magicBytes = encoder.encode(MAGIC);
    const manifestBytes = encoder.encode(JSON.stringify(manifest));
    const lengthBytes = new Uint8Array(4);
    new DataView(lengthBytes.buffer).setUint32(0, manifestBytes.byteLength, true);
    const packBlob = new Blob([magicBytes, lengthBytes, manifestBytes, ...blobs], { type: 'application/octet-stream' });
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `BibleGoldenBell_4X4_${date}.bb4`;
    downloadBlob(packBlob, fileName);
    return { fileName, assetCount: assets.length };
}
async function importVersion2(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const decoder = new TextDecoder();
    const magic = decoder.decode(bytes.slice(0, MAGIC.length));
    if (magic !== MAGIC)
        throw new Error('invalid v2 pack');
    if (bytes.byteLength < MAGIC.length + 4) {
        throw new Error('데이터 파일이 손상되었습니다.');
    }
    const manifestLength = new DataView(bytes.buffer, bytes.byteOffset + MAGIC.length, 4).getUint32(0, true);
    const manifestStart = MAGIC.length + 4;
    const manifestEnd = manifestStart + manifestLength;
    if (manifestEnd > bytes.byteLength) {
        throw new Error('데이터 파일이 손상되었습니다.');
    }
    const manifest = JSON.parse(decoder.decode(bytes.slice(manifestStart, manifestEnd)));
    if (manifest.format !== FORMAT || manifest.version !== VERSION) {
        throw new Error('지원하지 않는 BibleGoldenBell 4X4 데이터 파일입니다.');
    }
    const questions = validateQuestions(manifest.questions).map((question) => ({
        ...question,
    }));
    const metaMap = manifest.assetMeta && typeof manifest.assetMeta === 'object'
        ? manifest.assetMeta
        : {};
    for (const question of questions) {
        await deleteAsset(getAssetKey(question.id, 'video')).catch(() => undefined);
        await deleteAsset(getAssetKey(question.id, 'audio')).catch(() => undefined);
    }
    let offset = manifestEnd;
    let importedFileCount = 0;
    for (const asset of Array.isArray(manifest.assets) ? manifest.assets : []) {
        const end = offset + Number(asset.size || 0);
        if (end > bytes.byteLength || end < offset) {
            throw new Error('데이터 파일의 미디어 정보가 손상되었습니다.');
        }
        const blob = new Blob([bytes.slice(offset, end)], {
            type: asset.type || 'application/octet-stream',
        });
        offset = end;
        if (asset.kind === 'video' || asset.kind === 'audio') {
            await putAsset(asset.key, blob);
            importedFileCount += 1;
            continue;
        }
        const questionId = asset.key.split(':')[0];
        const question = questions.find((item) => item.id === questionId);
        if (!question)
            continue;
        const dataUrl = await blobToDataUrl(blob);
        if (asset.kind === 'questionImage')
            question.questionImageUrl = dataUrl;
        if (asset.kind === 'answerImage')
            question.answerImageUrl = dataUrl;
        importedFileCount += 1;
    }
    saveMetaMap(metaMap);
    return { questions, assetMeta: metaMap, importedFileCount };
}
async function importLegacyJson(file) {
    let parsed;
    try {
        parsed = JSON.parse(await file.text());
    }
    catch {
        throw new Error('데이터 파일을 읽을 수 없습니다.');
    }
    if (parsed.format !== FORMAT) {
        throw new Error('BibleGoldenBell 4X4 데이터 파일이 아닙니다.');
    }
    const questions = validateQuestions(parsed.questions);
    const metaMap = parsed.assetMeta && typeof parsed.assetMeta === 'object'
        ? parsed.assetMeta
        : {};
    for (const question of questions) {
        await deleteAsset(getAssetKey(question.id, 'video')).catch(() => undefined);
        await deleteAsset(getAssetKey(question.id, 'audio')).catch(() => undefined);
    }
    let importedFileCount = 0;
    if (Array.isArray(parsed.assets)) {
        for (const item of parsed.assets) {
            if (!item?.key || !item?.base64)
                continue;
            const blob = base64ToBlob(item.base64, item.type ?? 'application/octet-stream');
            await putAsset(item.key, blob);
            importedFileCount += 1;
        }
    }
    saveMetaMap(metaMap);
    return { questions, assetMeta: metaMap, importedFileCount };
}
export async function importDataPack(file) {
    const prefix = new TextDecoder().decode(new Uint8Array(await file.slice(0, MAGIC.length).arrayBuffer()));
    if (prefix === MAGIC)
        return importVersion2(file);
    return importLegacyJson(file);
}

// ---------------------------------------------------------
// 定数定義
// ---------------------------------------------------------

// ★ 通常プレイ用ワープ機能：到達済みワープ先の解放管理
const UNLOCKED_WARP_KEY = 'pchack_unlocked_warp';

// 指定されたワープ先を解放済みとして記録する
function unlockWarpDestination(skipId) {
    const unlocked = getUnlockedWarps();
    if (!unlocked.includes(skipId)) {
        unlocked.push(skipId);
        localStorage.setItem(UNLOCKED_WARP_KEY, JSON.stringify(unlocked));
    }
}

// 解放済みワープ先のリストを取得する
function getUnlockedWarps() {
    try {
        const data = localStorage.getItem(UNLOCKED_WARP_KEY);
        return data ? JSON.parse(data) : [];
    } catch(e) {
        return [];
    }
}

// 全ワープ先の解放状態をリセットする（新規ゲーム開始時に使用）
function resetUnlockedWarps() {
    localStorage.removeItem(UNLOCKED_WARP_KEY);
}
const CONSTANTS = {
    PASSWORD: "0815",
    VIRUS_TIMER_SECONDS: 30,
    LEWD_CLICK_THRESHOLD: 45,
    ABORT_LIMIT: 9,
    NOTEPAD_CLOSE_LIMIT: 6,
    SPAM_MSG_LIMIT: 5,
    SPAM_TIMEOUT_SECONDS: 100,
    TWITCH_CHAT_INTERVAL_MS: 800,
    TWITCH_MAX_MSGS: 25
};

// ---------------------------------------------------------
// グローバル変数・フラグ
// ---------------------------------------------------------
let zIndex = 100;
let isRoomExplorable = false;
let isWifiOff = false;
let scenarioPhase = 0; // 0:前, 1:ハッキング中, 2:解決後
let scenarioStarted = false;
let penaltyDone = false;
let isPenaltyRunning = false;
let isBlockAllInteraction = false;
let isDialogueRunning = false;
let isSecretNoteOpened = false;
let abortCount = 0; // ループ回数
const openedApps = {};
window.hackingIntervals = {};

// localStorageから音量設定を読み込み
function loadVolumeSettings() {
    try {
        const saved = localStorage.getItem('pchack_volume');
        if (saved) {
            const vol = JSON.parse(saved);
            return {
                seVolume: typeof vol.seVolume === 'number' ? vol.seVolume : 70,
                bgmVolume: typeof vol.bgmVolume === 'number' ? vol.bgmVolume : 50,
                textDelay: typeof vol.textDelay === 'number' ? vol.textDelay : 20
            };
        }
    } catch(e) { /* ignore */ }
    return { seVolume: 70, bgmVolume: 50, textDelay: 20 };
}

// 音量+テキスト速度設定をlocalStorageに保存
function saveVolumeSettings() {
    try {
        localStorage.setItem('pchack_volume', JSON.stringify({
            seVolume: gameState.seVolume,
            bgmVolume: gameState.bgmVolume,
            textDelay: gameState.textDelay
        }));
    } catch(e) { /* ignore */ }
}

// ---------------------------------------------------------
// セーブ禁止ゾーン（ロック機構）
// ---------------------------------------------------------
let isSaveLocked = false;

// セーブを禁止する（asyncシーケンスの開始時に呼ぶ）
function lockSave() {
    isSaveLocked = true;
}

// セーブ禁止を解除する（asyncシーケンスの終了時に呼ぶ）
function unlockSave() {
    isSaveLocked = false;
}

// ---------------------------------------------------------
// セーブ/ロード機能（複数スロット対応）
// ---------------------------------------------------------
const SAVE_SLOT_KEYS = Array.from({length: 50}, (_, i) => 'pchack_save_' + i);
const AUTOSAVE_KEY = 'pchack_autosave';
const SAVE_SLOT_COUNT = 50;

// スロット番号に対応するlocalStorageキーを取得
function getSlotKey(slotIndex) {
    if (slotIndex === 'autosave') return AUTOSAVE_KEY;
    if (slotIndex >= 0 && slotIndex < SAVE_SLOT_COUNT) return SAVE_SLOT_KEYS[slotIndex];
    return null;
}

// セーブ可能なグローバル変数をまとめて取得
function collectSaveData() {
    return {
        gameState: JSON.parse(JSON.stringify(gameState)),
        isWifiOff: isWifiOff,
        scenarioPhase: scenarioPhase,
        scenarioStarted: scenarioStarted,
        penaltyDone: penaltyDone,
        isSecretNoteOpened: isSecretNoteOpened,
        abortCount: abortCount,
        isTwoichDiscovered: isTwoichDiscovered,
        policeCallCount: policeCallCount,
        sendHistory: sendHistory,
        timeoutUntil: timeoutUntil,
        isHackingSequenceRunning: !!gameState.isHackingSequenceRunning,
        isRoomExplorable: !!isRoomExplorable,
        savedAt: Date.now()
    };
}

// セーブデータをグローバル変数に復元
function restoreSaveData(data) {
    if (!data) return false;
    // gameState をマージ（音量は上書きしない）
    const volSE = gameState.seVolume;
    const volBGM = gameState.bgmVolume;
    const textDelay = gameState.textDelay;
    Object.assign(gameState, data.gameState);
    gameState.seVolume = volSE;
    gameState.bgmVolume = volBGM;
    gameState.textDelay = textDelay;
    // グローバル変数
    isWifiOff = !!data.isWifiOff;
    scenarioPhase = data.scenarioPhase || 0;
    scenarioStarted = !!data.scenarioStarted;
    penaltyDone = !!data.penaltyDone;
    isSecretNoteOpened = !!data.isSecretNoteOpened;
    abortCount = data.abortCount || 0;
    isTwoichDiscovered = !!data.isTwoichDiscovered;
    policeCallCount = data.policeCallCount || 0;
    sendHistory = Array.isArray(data.sendHistory) ? data.sendHistory : [];
    timeoutUntil = data.timeoutUntil || 0;
    // ハッキング演出中フラグを復元
    if (typeof data.isHackingSequenceRunning !== 'undefined') {
        gameState.isHackingSequenceRunning = !!data.isHackingSequenceRunning;
    }
    // 部屋探索状態を復元
    if (typeof data.isRoomExplorable !== 'undefined') {
        isRoomExplorable = !!data.isRoomExplorable;
    }
    return true;
}

// 指定スロットにセーブ
function saveGame(slotIndex) {
    // ★ セーブ禁止ゾーン中はセーブを拒否
    if (isSaveLocked) {
        console.warn('[SaveLock] セーブ禁止ゾーン中のためセーブを拒否しました');
        // ★ エラー音（ビープ音1.mp3 を2倍速で再生）
        try {
            SoundManager.playCustomSE('assets/se/ビープ音1.mp3', 2.0);
        } catch(e) { /* ignore */ }
        return false;
    }
    try {
        const key = getSlotKey(slotIndex);
        if (!key) return false;
        const data = collectSaveData();
        data.slotIndex = slotIndex;
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch(e) { return false; }
}

// オートセーブ
function autoSave() {
    if (gameState.day > 0 && scenarioStarted) {
        saveGame('autosave');
    }
}

// ★ セーブデータを読み取り専用で取得（リロードなし）- 画面表示用
function readSaveData(slotIndex) {
    try {
        const key = getSlotKey(slotIndex);
        if (!key) return null;
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data || !data.gameState || typeof data.gameState.day !== 'number') {
            return null;
        }
        return data;
    } catch(e) { return null; }
}

// 指定スロットからロード（リロード方式）
function loadGame(slotIndex) {
    try {
        const key = getSlotKey(slotIndex);
        if (!key) return false;
        const raw = localStorage.getItem(key);
        if (!raw) return false;
        const data = JSON.parse(raw);
        // 簡易バリデーション
        if (!data || !data.gameState || typeof data.gameState.day !== 'number') {
            return false;
        }
        // ★ セーブデータを sessionStorage に保存してリロード
        sessionStorage.setItem('pchack_pending_load', JSON.stringify(data));
        // ★ 直接 location.reload() を呼び出し、その後のコード実行を完全に停止する
        //    location.reload() は同期的に動作し、その後は一切のJS実行が継続されない
        location.reload();
        // ★ リロード後はここに到達しないが、念のため throw で後続処理を防止
        throw new Error('reload');
    } catch(e) { return false; }
}

// 指定スロットのセーブデータ有無を確認
function hasSaveData(slotIndex) {
    const key = getSlotKey(slotIndex);
    if (!key) return false;
    return localStorage.getItem(key) !== null;
}

// いずれかのスロットにセーブデータがあるか確認
function hasAnySaveData() {
    for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
        if (hasSaveData(i)) return true;
    }
    return hasSaveData('autosave');
}

// 指定スロットのセーブデータを削除
function deleteSaveData(slotIndex) {
    try {
        const key = getSlotKey(slotIndex);
        if (key) localStorage.removeItem(key);
    } catch(e) { /* ignore */ }
}

// 全スロットのセーブデータを削除
function deleteAllSaveData() {
    try {
        for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
            localStorage.removeItem(SAVE_SLOT_KEYS[i]);
        }
        localStorage.removeItem(AUTOSAVE_KEY);
    } catch(e) { /* ignore */ }
}

// 全ストレージデータをクリア（セーブ・実績・ワープ・音量設定）
function clearAllStorage() {
    try {
        // セーブデータ
        for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
            localStorage.removeItem(SAVE_SLOT_KEYS[i]);
        }
        localStorage.removeItem(AUTOSAVE_KEY);
        // 実績
        localStorage.removeItem('pchack_achievements');
        // ワープ解放状態
        localStorage.removeItem(UNLOCKED_WARP_KEY);
        // 音量設定
        localStorage.removeItem('pchack_volume');
        // sessionStorage もクリア
        sessionStorage.removeItem('skipPhase');
        sessionStorage.removeItem('pchack_skip_warning');
        sessionStorage.removeItem('pchack_pending_load');
    } catch(e) { /* ignore */ }
}

// スロット情報を取得（セーブ/ロード画面表示用）- ★ readSaveData() を使用（リロード防止）
function getSaveSlotInfo(slotIndex) {
    const data = readSaveData(slotIndex);
    if (!data) {
        return { exists: false, day: 0, savedAt: null, scenarioPhase: 0 };
    }
    const gs = data.gameState || {};
    return {
        exists: true,
        day: gs.day || 0,
        savedAt: data.savedAt || 0,
        scenarioPhase: data.scenarioPhase || 0,
        scenarioStarted: !!data.scenarioStarted,
        // ★ ワープ先を区別するための内部フラグ
        day1SleepReady: !!gs.day1SleepReady,
        intrusionSequenceSeen: !!gs.intrusionSequenceSeen,
        routerShielded: !!gs.routerShielded,
        isFinalChoicePhase: !!gs.isFinalChoicePhase,
        isRoomExplorable: !!data.isRoomExplorable,
        isWifiOff: !!data.isWifiOff,
        isTwoichDiscovered: !!data.isTwoichDiscovered
    };
}

const _vol = loadVolumeSettings();

// ゲーム全体の状態管理
const gameState = {
    day: 1,                   // 現在の日: 1, 2, 3
    passwordSolved: false,    // パスワード謎解き済み
    hintRead: false,          // ヒント（日記）を読んだか
    textDelay: _vol.textDelay, // テキスト表示の遅延（ms）※localStorageから復元
    day1SleepReady: false,    // 1日目の説明完了
    day3NotepadCloseCount: 0, // 3日目にメモ帳を閉じた回数
    isFinalChoicePhase: false, // 最終的な結末を選ぶフェーズか
    lewdClickCount: 0,        // 1日目の隠し要素用カウンター
    lewdEasterEggSeen: false, // 隠し要素を見たかどうか
    seVolume: _vol.seVolume,  // 効果音音量 (0-300) ※localStorageから復元
    bgmVolume: _vol.bgmVolume, // BGM音量 (0-300) ※localStorageから復元
    virusSequenceSeen: false, // ウイルス感染演出を見たか
    intrusionSequenceSeen: false, // 侵入演出を見たか
    isHackingSequenceRunning: false, // ハッキング演出（バグ発生中）かどうか
    routerShielded: false // ルーターが透明な金属で保護されているか
};

// ネットワーク状態管理
let isTwoichDiscovered = false; // Twoich配信に気づいたか
let policeCallCount = 0; // 警察への通報回数
let sendHistory = []; // 送信履歴（スパム検知用）
let timeoutUntil = 0; // タイムアウト終了時刻

// macOS アイコン
const icons = {
    folder: `<svg viewBox="0 0 24 24" fill="#5ac8fa"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`,
    text: `<svg viewBox="0 0 24 24" fill="#ffffff"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0-2-.9-2-2V8l-6-6zM13 3.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/></svg>`,
    image: `<svg viewBox="0 0 24 24" fill="#ffcc00"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>`,
    zip: `<svg viewBox="0 0 24 24" fill="#ff9500"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 10h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V6h4v2z"/></svg>`,
    lock: `<svg viewBox="0 0 24 24" fill="#ff6b6b"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>`,
    browser: `<svg viewBox="0 0 24 24" fill="#34c759"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`,
    twoich: `<svg viewBox="0 0 24 24" fill="#9146ff"><path d="M11.571 4.714h1.715v5.143H11.57V4.714zm4.715 0H18v5.143h-1.714V4.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0H6zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714v9.429z"/></svg>`
};

const fileSystem = {
    'root': [
        { name: '書類', type: 'folder', target: 'documents' },
        { name: 'ピクチャ', type: 'folder', target: 'pictures' },
        { name: 'NHCKブラウザ', type: 'browser' },
        { name: 'Twoich', type: 'twoich' },
        { name: '履歴.txt', type: 'text', desc: "これまでの買い物の記録だ。結構使い込んじゃったな。" },
        { name: 'ゴミ箱', type: 'folder', target: 'trash' }
    ],
    'documents': [
        { name: 'RJ012345.zip', type: 'zip', desc: "これ、めちゃくちゃエッチだったんだよなぁ...。" },
        { name: 'RJ999999.zip', type: 'zip', desc: "発売日に即買いしたやつだ。最高だった。" },
        { name: 'RJ555444.zip', type: 'zip', desc: "友達に勧められて買ったけど、まだ開けてない。" },
        { name: '極秘_閲覧禁止.docx', type: 'text', desc: "中身はただの妄想ノート。絶対に見られたくない。" },
        { name: '同人誌_新刊.pdf', type: 'text', desc: "この作家さんの絵、本当に好きなんだよな。" }
    ],
    'pictures': [
        { name: 'えっちな画像(1).jpg', type: 'image', isTrigger: true },
        { name: '秘密の自撮り.png', type: 'image', desc: "鏡の前で撮ったやつ。自分でも何やってるんだか。" },
        { name: '夏の思い出.jpg', type: 'image', desc: "海に行った時の写真...いや、これは保存したやつか。" },
        { name: '絶対に見ないで.png', type: 'image', desc: "これをクリックする奴は変態だ。自分も含めてな。" },
        { name: 'コスプレ衣装案.jpg', type: 'image', desc: "いつか着てみたいと思って保存したやつ。" }
    ],
    'trash': [
        { name: '古い履歴書.pdf', type: 'text', desc: "見たくない過去の遺物だ。" }
    ],
    'day1_root': [
        { name: '書類', type: 'folder', target: 'documents' },
        { name: 'ピクチャ', type: 'folder', target: 'pictures' },
        { name: 'NHCKブラウザ', type: 'browser' },
        { name: 'Twoich', type: 'twoich' },
        { name: '日記_2019.txt', type: 'text', desc: "2019年8月15日\n今日はじいちゃんの誕生日。\n誕生日プレゼントに、じいちゃんが好きな数字『0815』でロックをかけた写真集を送った。\n喜んでくれるといいなぁ。" },
        { name: '🔒 秘密フォルダ', type: 'lock', target: 'secret_locked' },
        { name: '秘密の画像.jpg', type: 'image', desc: "えっちだ...。" },
        { name: 'ゴミ箱', type: 'folder', target: 'trash' }
    ],
    'secret_locked': [],
    'secret_unlocked': [
        { name: '覚書.txt', type: 'text', desc: "ここに書いてあることは誰にも言うな。\nVPNを切るな。ファイアウォールを止めるな。\nもし誰かが侵入してきたら...すべてを失う覚悟をしろ。" },
        { name: '緊急連絡先.txt', type: 'text', desc: "警察: 110\nサイバー犯罪相談: 03-xxxx-xxxx\n...でも、こんなもの役に立つのか？" },
        { name: 'これだけは絶対に見るな.txt', type: 'text', isDay1EndTrigger: true }
    ]
};

// ---------------------------------------------------------
// 実績システム
// ---------------------------------------------------------
const ACHIEVEMENTS = [
    { id: 'ending_throw',      name: '廃棄エンド',         desc: 'PCを廃棄した', icon: '🗑️' },
    { id: 'ending_runthrough', name: '真実エンド',         desc: '真実を暴いた', icon: '🔍' },
    { id: 'ending_police',    name: '逮捕エンド',         desc: '警察に通報した', icon: '🚔' },
    { id: 'ending_hacked',    name: 'ハッキングエンド',   desc: 'ハッカーに敗れた', icon: '💀' },
    { id: 'ending_flame',     name: '炎上エンド',         desc: 'ネットで拡散された', icon: '🔥' },
    { id: 'ending_discard',   name: '破棄エンド',         desc: '全てを捨てた', icon: '🌀' },
    { id: 'ending_neighbor',  name: '隣人エンド',         desc: '隣人に襲われた', icon: '🚪' },
    { id: 'easter_egg',       name: 'イースターエッグ',   desc: 'えっちな画像を45回開いた', icon: '🥚' },
    { id: 'secret_note',      name: '秘密を知る者',       desc: '秘密フォルダを開いた', icon: '📄' },
    { id: 'virus_survive',    name: 'ウイルス生還',       desc: 'ウイルスタイマーを生き延びた', icon: '🛡️' }
];

// 実績の解除状態をlocalStorageから読み込み
function loadAchievements() {
    try {
        const saved = localStorage.getItem('pchack_achievements');
        if (saved) return JSON.parse(saved);
    } catch(e) { /* ignore */ }
    return {};
}

// 実績を解除
function unlockAchievement(id) {
    const ach = loadAchievements();
    if (ach[id]) return false; // 既に解除済み
    ach[id] = true;
    try {
        localStorage.setItem('pchack_achievements', JSON.stringify(ach));
    } catch(e) { /* ignore */ }
    // 解除通知を表示
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (a) showAchievementPopup(a);
    return true;
}

// 実績解除ポップアップ表示
function showAchievementPopup(ach) {
    const popup = document.createElement('div');
    popup.style.cssText = `
        position:fixed; top:20px; right:20px; z-index:999999;
        background:rgba(0,0,0,0.9); border:2px solid #ffd700;
        border-radius:12px; padding:16px 24px;
        color:#fff; font-family:'Noto Sans JP',sans-serif;
        transform:translateX(120%); transition:transform 0.5s ease;
        max-width:320px; box-shadow:0 0 30px rgba(255,215,0,0.3);
    `;
    popup.innerHTML = `
        <div style="font-size:0.8rem; color:#ffd700; margin-bottom:4px;">🏆 実績解除</div>
        <div style="font-size:1.3rem; margin-bottom:2px;">${ach.icon} ${ach.name}</div>
        <div style="font-size:0.85rem; color:rgba(255,255,255,0.7);">${ach.desc}</div>
    `;
    document.body.appendChild(popup);
    requestAnimationFrame(() => { popup.style.transform = 'translateX(0)'; });
    setTimeout(() => {
        popup.style.transform = 'translateX(120%)';
        setTimeout(() => popup.remove(), 500);
    }, 4000);
}

// ニュースデータ
const newsData = {
    day1: [
        { title: "記録的な猛暑、全国で熱中症に警戒", category: "社会", date: "2024/07/15", highlight: false },
        { title: "新型AI「Nexus」、人間並みの会話能力を実証", category: "IT", date: "2024/07/15", highlight: true },
        { title: "プロ野球：ベアーズが劇的な逆転サヨナラ勝ち", category: "スポーツ", date: "2024/07/15", highlight: false },
        { title: "映画「昨日の影」が興行収入100億円突破", category: "エンタメ", date: "2024/07/14", highlight: false }
    ],
    day2: [
        { title: "【注意喚起】新種のランサムウェアが急増", category: "IT", date: "2024/07/16", highlight: true },
        { title: "国内のISPで大規模な通信障害、原因調査中", category: "社会", date: "2024/07/16", highlight: true },
        { title: "SNSで「知らないアカウントからフォローされた」報告相次ぐ", category: "ネット", date: "2024/07/16", highlight: false },
        { title: "サイバーセキュリティ専門家「個人での対策には限界がある」", category: "IT", date: "2024/07/16", highlight: false }
    ],
    day3: [
        { title: "【緊急】大規模な個人情報流出、ハッキング被害か", category: "速報", date: "2024/07/17", highlight: true },
        { title: "東京都内の20代男性、自宅からハッキング被害を訴え", category: "事件", date: "2024/07/17", highlight: true },
        { title: "ネット掲示板で特定祭り「こいつの人生終わったな」", category: "ネット", date: "2024/07/17", highlight: false },
        { title: "警察、ハッキング犯の足取りを追うも難航", category: "社会", date: "2024/07/17", highlight: false }
    ]
};

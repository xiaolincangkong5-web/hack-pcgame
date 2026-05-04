// ---------------------------------------------------------
// 初期化・メイン処理
// ---------------------------------------------------------

// デバッグ用スキップ機能
function skipTo(p) { sessionStorage.setItem('skipPhase', p); location.reload(); }

// ★ 全ワープ先の定義（実際のプレイ順）— デバッグワープ・通常ワープで共通
const WARP_DESTINATIONS = [
    // ===== Day1 =====
    { day: 1, label: 'Day1導入演出',              skip: 'day1' },
    // ===== Day2 =====
    { day: 2, label: 'Day2デスクトップ探索',       skip: 'day2_desktop' },
    { day: 2, label: 'Day2ハッキング演出',         skip: 'hacking' },
    { day: 2, label: 'Day2ハッカー再接続',         skip: 'free_explore' },
    { day: 2, label: 'Day2物色後（PC不通）',       skip: 'post_shatter' },
    { day: 2, label: 'Day2PC再起動後',             skip: 'offline' },
    // { day: 2, label: 'Day2Twoich発見後',           skip: 'day2_twoich' }, // 必要に応じて再有効化
    // ===== Day3 =====
    { day: 3, label: 'Day3導入演出',              skip: 'day3' },
    { day: 3, label: 'Day3最終選択',              skip: 'day3_room' },
];

// ゲームの状態をUIに反映させる（スキップ時やロード用）
function applyStateToUI() {
    // 金属ルーターの反映
    const shelf = document.getElementById('obj-shelf');
    if (shelf) {
        if (gameState.routerShielded) {
            shelf.classList.add('shielded-object');
        } else {
            shelf.classList.remove('shielded-object');
        }
    }
}

// アイコンクリックイベントの登録
document.getElementById('icon-notepad').onclick = () => SoundManager.beep(400, 0.1);
document.getElementById('icon-notepad').ondblclick = () => {
    if (gameState.day === 3) return;
    SoundManager.init();
    openWindow('notepad', 'メモ帳');
};

document.getElementById('icon-files').onclick = () => SoundManager.beep(400, 0.1);
document.getElementById('icon-files').ondblclick = () => {
    if (gameState.day === 3) return;
    SoundManager.init();
    openWindow('files', 'フォルダー');
};

// デスクトップアイコンの動的作成と追加
(function setupDesktopIcons() {
    const grid = document.getElementById('icons-grid');
    if (!grid) return;

    // Twoich
    const twoichIcon = document.createElement('div');
    twoichIcon.className = 'icon-item';
    twoichIcon.id = 'icon-twoich';
    twoichIcon.innerHTML = `<div class="icon-wrapper"><svg viewBox="0 0 24 24" fill="#9146ff"><path d="M11.571 4.714h1.715v5.143H11.57V4.714zm4.715 0H18v5.143h-1.714V4.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0H6zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714v9.429z"/></svg></div><span class="icon-label">Twoich</span>`;
    twoichIcon.onclick = () => SoundManager.beep(400, 0.1);
    twoichIcon.ondblclick = () => {
        if (gameState.day === 3) return;
        handleFileClick('Twoich');
    };
    grid.appendChild(twoichIcon);

    // Browser
    const browserIcon = document.createElement('div');
    browserIcon.className = 'icon-item';
    browserIcon.id = 'icon-browser';
    browserIcon.innerHTML = `<div class="icon-wrapper"><svg viewBox="0 0 24 24" fill="#34c759"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg></div><span class="icon-label">NHCKブラウザ</span>`;
    browserIcon.onclick = () => SoundManager.beep(400, 0.1);
    browserIcon.ondblclick = () => {
        if (gameState.day === 3 && isDialogueRunning) return;
        openWindow('browser', 'NHCKブラウザ');
    };
    grid.appendChild(browserIcon);
})();

// タイトルに戻る（オートセーブしてリロード）
function returnToTitle() {
    // ★ 保留中のロードデータをクリアしてからリロード（タイトル画面に正しく戻るため）
    sessionStorage.removeItem('pchack_pending_load');
    autoSave();
    location.reload();
}

// settings-menuの内容を動的に構築（キャッシュ問題対策）
function buildSettingsMenu() {
    const menu = document.getElementById('settings-menu');
    if (!menu) return;
    // 既に構築済みならスキップ
    if (menu.dataset.built === 'true') return;
    menu.innerHTML = '<div class="debug-content glass-panel">' +
        '<h3>設定</h3>' +
        '<div class="volume-control" style="margin-bottom:15px;">' +
            '<div style="display:flex; justify-content:space-between;">' +
                '<label>効果音 (SE): </label>' +
                '<span id="se-vol-debug">100%</span>' +
            '</div>' +
            '<input type="range" id="se-slider-debug" min="0" max="300" value="100" style="width:100%;" oninput="gameState.seVolume = parseInt(this.value); document.getElementById(\'se-vol-debug\').innerText = this.value + \'%\'; SoundManager.beep(600, 0.05, \'sine\', 0.01); saveVolumeSettings();">' +
        '</div>' +
        '<div class="volume-control" style="margin-bottom:15px;">' +
            '<div style="display:flex; justify-content:space-between;">' +
                '<label>環境音 (BGM): </label>' +
                '<span id="bgm-vol-debug">100%</span>' +
            '</div>' +
            '<input type="range" id="bgm-slider-debug" min="0" max="300" value="100" style="width:100%;" oninput="gameState.bgmVolume = parseInt(this.value); document.getElementById(\'bgm-vol-debug\').innerText = this.value + \'%\'; AmbientManager.updateVolume(); saveVolumeSettings();">' +
        '</div>' +
        '<div class="volume-control" style="margin-bottom:20px;">' +
            '<div style="display:flex; justify-content:space-between;">' +
                '<label>テキスト速度: </label>' +
                '<span id="speed-val">50</span>' +
            '</div>' +
            '<input type="range" min="10" max="110" value="50" step="10" style="width:100%;" oninput="gameState.textDelay = (110 - this.value); document.getElementById(\'speed-val\').innerText = (this.value == 110 ? \'最速\' : this.value)">' +
        '</div>' +
        '<div style="display:flex; gap:8px; margin-top:8px;">' +
            '<button id="settings-warp-btn" style="flex:1; background:rgba(255,200,50,0.1); color:#ffc832; border:1px solid rgba(255,200,50,0.3); padding:8px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem;" onmouseenter="this.style.borderColor=\'rgba(255,200,50,0.6)\'" onmouseleave="this.style.borderColor=\'rgba(255,200,50,0.3)\'">🚀 ワープ</button>' +
            '<button id="settings-quit-btn" style="flex:1; background:rgba(255,100,100,0.1); color:rgba(255,100,100,0.8); border:1px solid rgba(255,100,100,0.3); padding:8px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem;" onmouseenter="this.style.borderColor=\'rgba(255,100,100,0.6)\'" onmouseleave="this.style.borderColor=\'rgba(255,100,100,0.3)\'">🏠 タイトルへ</button>' +
        '</div>' +
        '<p style="font-size: 12px; margin-top: 10px; color: rgba(255,255,255,0.5);">※ESCキーで閉じる</p>' +
    '</div>';
    menu.dataset.built = 'true';
    // ★ ボタンに直接onclick属性を設定
    const quitBtn = document.getElementById('settings-quit-btn');
    if (quitBtn) {
        quitBtn.onclick = function() {
            returnToTitle();
        };
    }

    // ★ ワープボタン：通常プレイヤー用ワープメニューを開く
    const warpBtn = document.getElementById('settings-warp-btn');
    if (warpBtn) {
        warpBtn.onclick = function() {
            document.getElementById('settings-menu').style.display = 'none';
            renderPlayerWarpMenu();
            document.getElementById('player-warp-menu').style.display = 'flex';
        };
    }

}

// スロット選択画面をレンダリング（セーブ用）
function renderSaveSlots() {
    const list = document.getElementById('save-slot-list');
    if (!list) return;
    let html = '';
    // オートセーブスロット
    const autoInfo = getSaveSlotInfo('autosave');
    html += buildSlotHTML('autosave', '🔄 オートセーブ', autoInfo, true);
    // 手動スロット
    for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
        const info = getSaveSlotInfo(i);
        html += buildSlotHTML(i, 'スロット ' + (i + 1), info, true);
    }
    list.innerHTML = html;
    // 各スロットにクリックイベントを設定
    document.querySelectorAll('.save-slot-btn').forEach(function(el) {
        el.addEventListener('click', function() {
            var idx = this.dataset.slotIndex;
            var target = idx === 'autosave' ? 'autosave' : parseInt(idx);
            if (saveGame(target)) {
                renderSaveSlots();
                var feedback = document.createElement('div');
                feedback.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:rgba(0,0,0,0.9); color:#5ac8fa; padding:20px 40px; border-radius:12px; font-size:1.2rem; font-weight:bold; z-index:999999; border:2px solid #5ac8fa;';
                feedback.textContent = '✓ セーブしました';
                document.body.appendChild(feedback);
                setTimeout(function() { feedback.remove(); }, 1200);
            }
        });
    });
}

// スロット選択画面をレンダリング（ロード用）
function renderLoadSlots() {
    const list = document.getElementById('load-slot-list');
    if (!list) return;
    let html = '';
    // オートセーブスロット
    const autoInfo = getSaveSlotInfo('autosave');
    html += buildSlotHTML('autosave', '🔄 オートセーブ', autoInfo, false);
    // 手動スロット
    for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
        const info = getSaveSlotInfo(i);
        html += buildSlotHTML(i, 'スロット ' + (i + 1), info, false);
    }
    list.innerHTML = html;
    // 各スロットにクリックイベントを設定
    document.querySelectorAll('.load-slot-btn').forEach(function(el) {
        el.addEventListener('click', function() {
            var idx = this.dataset.slotIndex;
            var target = idx === 'autosave' ? 'autosave' : parseInt(idx);
            // ★ loadGame() が成功すると location.reload() を呼ぶ
            //    リロード後はページが再初期化されるので、ここでの後続処理は不要
            var result = loadGame(target);
            if (!result) {
                // ロード失敗（データなし）
                var feedback = document.createElement('div');
                feedback.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:rgba(0,0,0,0.9); color:#ff4444; padding:20px 40px; border-radius:12px; font-size:1.2rem; font-weight:bold; z-index:999999; border:2px solid #ff4444;';
                feedback.textContent = 'データがありません';
                document.body.appendChild(feedback);
                setTimeout(function() { feedback.remove(); renderLoadSlots(); }, 1200);
            }
            // ★ 成功時は location.reload() が呼ばれているので、ここで return して後続処理を防ぐ
            if (result) return;
        });
    });
    // 削除ボタンのイベント設定
    document.querySelectorAll('.delete-slot-btn').forEach(function(el) {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            var idx = this.dataset.slotIndex;
            var target = idx === 'autosave' ? 'autosave' : parseInt(idx);
            var label = idx === 'autosave' ? 'オートセーブ' : 'スロット ' + (parseInt(idx) + 1);
            if (confirm('「' + label + '」のセーブデータを削除しますか？')) {
                deleteSaveData(target);
                renderLoadSlots();
            }
        });
    });
}

// スロット表示用HTMLを生成
function buildSlotHTML(slotIndex, label, info, isSave) {
    var btnClass = isSave ? 'save-slot-btn' : 'load-slot-btn';
    if (!info.exists) {
        var emptyHtml = '<button class="' + btnClass + '" data-slot-index="' + slotIndex + '" style="display:flex; align-items:center; gap:14px; padding:14px 16px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; cursor:pointer; width:100%; text-align:left; color:#fff; font-family:\'Noto Sans JP\',sans-serif; transition:all 0.2s;" onmouseenter="this.style.borderColor=\'rgba(255,255,255,0.3)\'" onmouseleave="this.style.borderColor=\'rgba(255,255,255,0.08)\'">' +
            '<div style="font-size:1.2rem; min-width:100px; color:rgba(255,255,255,0.5);">' + label + '</div>' +
            '<div style="flex:1; text-align:center; color:rgba(255,255,255,0.3); font-size:0.85rem;">--- 空きスロット ---</div>' +
            '</button>';
        return emptyHtml;
    }
    var dateStr = info.savedAt ? new Date(info.savedAt).toLocaleString('ja-JP') : '不明';
    var dayStr = 'Day ' + info.day;
    // ★ 内部フラグに基づいて完全に一意のフェーズ名を生成
    //   ワープメニュー（renderWarpMenu）のラベルと統一
    var phaseStr = '';
    if (info.day === 1) {
        if (info.scenarioPhase === 0 && !info.day1SleepReady) phaseStr = 'Day1導入演出';
        else if (info.scenarioPhase === 0 && info.day1SleepReady) phaseStr = 'Day1→Day2（寝て翌朝）';
        else if (info.scenarioPhase === 1) phaseStr = 'Day1ハッキング中';
        else phaseStr = 'Day1デスクトップ探索';
    } else if (info.day === 2) {
        // ★ 復元処理（main.js loadイベント内）の条件分岐と完全に一致させる
        //    優先順位（セーブ可能な状態のみ）:
        //    1. routerShielded → 物色後（PC不通）
        //    2. intrusionSequenceSeen → ハッカー再接続
        //    3. scenarioPhase === 2 → PC再起動後（??? .txt出現）
        //    4. isTwoichDiscovered → Twoich発見後（部屋で寝る選択肢）
        //    5. それ以外 → デスクトップ探索
        //    ※ scenarioPhase === 1 は lockSave() でセーブ禁止のためラベル不要
        if (info.routerShielded) phaseStr = 'Day2物色後（PC不通）';
        else if (info.intrusionSequenceSeen) phaseStr = 'Day2ハッカー再接続';
        else if (info.scenarioPhase === 2) phaseStr = 'Day2PC再起動後';
        else if (info.isTwoichDiscovered) phaseStr = 'Day2Twoich発見後';
        else phaseStr = 'Day2デスクトップ探索';
    } else if (info.day === 3) {
        if (info.scenarioPhase === 0 && !info.isFinalChoicePhase) phaseStr = 'Day3導入演出';
        else if (info.scenarioPhase === 2 && info.isFinalChoicePhase) phaseStr = 'Day3最終選択';
        else phaseStr = 'Day3導入演出';
    } else {
        phaseStr = '不明';
    }
    var hint = isSave ? 'クリックで上書き保存' : 'クリックでロード';
    // ロード画面の場合のみ削除ボタンを追加
    var deleteBtn = isSave ? '' : '<button class="delete-slot-btn" data-slot-index="' + slotIndex + '" title="このセーブデータを削除" style="background:rgba(255,80,80,0.15); border:1px solid rgba(255,80,80,0.3); color:rgba(255,80,80,0.8); border-radius:6px; cursor:pointer; padding:6px 10px; font-size:0.9rem; flex-shrink:0; transition:all 0.2s;" onmouseenter="this.style.background=\'rgba(255,80,80,0.3)\'" onmouseleave="this.style.background=\'rgba(255,80,80,0.15)\'">🗑</button>';
    return '<div style="display:flex; gap:6px; align-items:stretch;">' +
        '<button class="' + btnClass + '" data-slot-index="' + slotIndex + '" style="flex:1; display:flex; align-items:center; gap:14px; padding:14px 16px; background:rgba(90,200,250,0.06); border:1px solid rgba(90,200,250,0.2); border-radius:10px; cursor:pointer; text-align:left; color:#fff; font-family:\'Noto Sans JP\',sans-serif; transition:all 0.2s;" onmouseenter="this.style.borderColor=\'rgba(90,200,250,0.5)\'" onmouseleave="this.style.borderColor=\'rgba(90,200,250,0.2)\'">' +
            '<div style="font-size:1.2rem; min-width:100px; color:#5ac8fa;">' + label + '</div>' +
            '<div style="flex:1;">' +
                '<div style="font-weight:bold; font-size:0.95rem;">' + dayStr + ' - ' + phaseStr + '</div>' +
                '<div style="font-size:0.75rem; color:rgba(255,255,255,0.4);">' + dateStr + '</div>' +
            '</div>' +
            '<div style="font-size:0.8rem; color:rgba(255,255,255,0.5);">' + hint + '</div>' +
        '</button>' +
        deleteBtn +
        '</div>';
}

// ★ ワープメニューをレンダリング（Ctrl+Shift+Fで開く - 既存デバッグメニューとは別）
//   セーブデータの有無に関わらず、全ワープ先（Day1〜Day3の全セーブ可能状態）を表示
//   skipTo() 経由で location.reload() するが、エピレプシー警告は自動スキップする
// ★ デバッグワープメニュー（Ctrl+Shift+F）— 全ワープ先を表示
function renderWarpMenu() {
    const list = document.getElementById('warp-slot-list');
    if (!list) return;

    // Dayごとにグループ化
    const dayGroups = {};
    WARP_DESTINATIONS.forEach(function(d) {
        if (!dayGroups[d.day]) dayGroups[d.day] = [];
        dayGroups[d.day].push(d);
    });

    // Dayの昇順でソート（Day1 → Day2 → Day3）
    const sortedDays = Object.keys(dayGroups).map(Number).sort(function(a, b) { return a - b; });

    let html = '';
    sortedDays.forEach(function(day) {
        const dayDests = dayGroups[day];
        html += '<div style="margin-bottom:10px;">';
        html += '<div style="font-size:0.85rem; font-weight:bold; color:#5ac8fa; padding:4px 0; border-bottom:1px solid rgba(90,200,250,0.2); margin-bottom:6px;">Day ' + day + '</div>';

        dayDests.forEach(function(d) {
            html += '<button class="warp-dest-btn" data-skip="' + d.skip + '" style="display:flex; align-items:center; gap:10px; width:100%; padding:10px 14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; cursor:pointer; text-align:left; color:#fff; font-family:\'Noto Sans JP\',sans-serif; font-size:0.85rem; transition:all 0.15s; margin-bottom:4px;" onmouseenter="this.style.borderColor=\'rgba(255,200,50,0.5)\'; this.style.background=\'rgba(255,200,50,0.08)\'" onmouseleave="this.style.borderColor=\'rgba(255,255,255,0.1)\'; this.style.background=\'rgba(255,255,255,0.04)\'">' +
                '<span style="flex:1; font-weight:bold; color:#ffc832;">' + d.label + '</span>' +
                '<span style="font-size:0.8rem; color:rgba(255,200,50,0.6);">🚀 ワープ</span>' +
            '</button>';
        });

        html += '</div>';
    });

    list.innerHTML = html;

    // 各ワープボタンにクリックイベントを設定
    document.querySelectorAll('.warp-dest-btn').forEach(function(el) {
        el.addEventListener('click', function() {
            var skipId = this.dataset.skip;
            // ワープメニューを閉じる
            document.getElementById('warp-menu').style.display = 'none';
            // ★ エピレプシー警告スキップフラグをセットしてから skipTo() でリロード
            //    リロード後、loadイベントでこのフラグをチェックし、自動で警告を通過する
            sessionStorage.setItem('pchack_skip_warning', '1');
            skipTo(skipId);
        });
    });
}

// ★ 通常プレイヤー用ワープメニュー（ESCメニューから開く）— 到達済みのみ表示
function renderPlayerWarpMenu() {
    const list = document.getElementById('player-warp-slot-list');
    if (!list) return;

    const unlocked = getUnlockedWarps();

    // Dayごとにグループ化
    const dayGroups = {};
    WARP_DESTINATIONS.forEach(function(d) {
        if (!dayGroups[d.day]) dayGroups[d.day] = [];
        dayGroups[d.day].push(d);
    });

    // Dayの昇順でソート（Day1 → Day2 → Day3）
    const sortedDays = Object.keys(dayGroups).map(Number).sort(function(a, b) { return a - b; });

    let html = '';
    sortedDays.forEach(function(day) {
        const dayDests = dayGroups[day];
        html += '<div style="margin-bottom:10px;">';
        html += '<div style="font-size:0.85rem; font-weight:bold; color:#5ac8fa; padding:4px 0; border-bottom:1px solid rgba(90,200,250,0.2); margin-bottom:6px;">Day ' + day + '</div>';

        dayDests.forEach(function(d) {
            // ★ Day2ハッカー再接続はESCメニューに表示しない（没データのため）
            if (d.skip === 'free_explore') return;
            
            const isUnlocked = unlocked.includes(d.skip);
            if (isUnlocked) {
                // ★ 解放済み：ワープ可能なボタン
                html += '<button class="player-warp-dest-btn" data-skip="' + d.skip + '" style="display:flex; align-items:center; gap:10px; width:100%; padding:10px 14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; cursor:pointer; text-align:left; color:#fff; font-family:\'Noto Sans JP\',sans-serif; font-size:0.85rem; transition:all 0.15s; margin-bottom:4px;" onmouseenter="this.style.borderColor=\'rgba(255,200,50,0.5)\'; this.style.background=\'rgba(255,200,50,0.08)\'" onmouseleave="this.style.borderColor=\'rgba(255,255,255,0.1)\'; this.style.background=\'rgba(255,255,255,0.04)\'">' +
                    '<span style="flex:1; font-weight:bold; color:#ffc832;">' + d.label + '</span>' +
                    '<span style="font-size:0.8rem; color:rgba(255,200,50,0.6);">🚀 ワープ</span>' +
                '</button>';
            } else {
                // ★ 未解放：🔒 ??? で伏せる（クリック不可）
                html += '<div style="display:flex; align-items:center; gap:10px; width:100%; padding:10px 14px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px; color:rgba(255,255,255,0.25); font-family:\'Noto Sans JP\',sans-serif; font-size:0.85rem; margin-bottom:4px; cursor:default;">' +
                    '<span style="flex:1;">🔒 ???</span>' +
                '</div>';
            }
        });

        html += '</div>';
    });

    list.innerHTML = html;

    // 各ワープボタンにクリックイベントを設定
    document.querySelectorAll('.player-warp-dest-btn').forEach(function(el) {
        el.addEventListener('click', function() {
            var skipId = this.dataset.skip;
            // ワープメニューを閉じる
            document.getElementById('player-warp-menu').style.display = 'none';
            // ★ エピレプシー警告スキップフラグをセットしてから skipTo() でリロード
            sessionStorage.setItem('pchack_skip_warning', '1');
            skipTo(skipId);
        });
    });
}

// 設定メニュー（ESC: 音量・テキスト速度） / ワープメニュー（Ctrl+Shift+F）
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // ★ デバッグワープメニューが開いていれば閉じる
        const warpMenu = document.getElementById('warp-menu');
        if (warpMenu && warpMenu.style.display === 'flex') {
            warpMenu.style.display = 'none';
            return;
        }
        // ★ 通常プレイヤーワープメニューが開いていれば閉じる
        const playerWarpMenu = document.getElementById('player-warp-menu');
        if (playerWarpMenu && playerWarpMenu.style.display === 'flex') {
            playerWarpMenu.style.display = 'none';
            return;
        }
        // ★ タイトル画面専用の子画面（実績・設定・遊び方）が開いていれば閉じてタイトルに戻る
        const achScreen = document.getElementById('achievement-screen');
        if (achScreen && achScreen.style.display === 'flex') {
            achScreen.style.display = 'none';
            document.getElementById('title-screen').style.display = 'flex';
            return;
        }
        const titleSettingsScreen = document.getElementById('title-settings-screen');
        if (titleSettingsScreen && titleSettingsScreen.style.display === 'flex') {
            titleSettingsScreen.style.display = 'none';
            document.getElementById('title-screen').style.display = 'flex';
            return;
        }
        const howtoScreen = document.getElementById('howto-screen');
        if (howtoScreen && howtoScreen.style.display === 'flex') {
            howtoScreen.style.display = 'none';
            document.getElementById('title-screen').style.display = 'flex';
            return;
        }

        // タイトル画面ではESCメニューを開かない
        const titleScreen = document.getElementById('title-screen');
        if (titleScreen && titleScreen.style.display === 'flex') return;

        const m = document.getElementById('settings-menu');
        if (m) {
            // 動的にメニュー内容を構築（キャッシュ対策）
            buildSettingsMenu();
            const wasOpen = (m.style.display === 'flex');
            m.style.display = wasOpen ? 'none' : 'flex';
            // ★ ESCメニューの開閉に合わせて _isMenuOpen を更新
            //    メニューが開いている間は waitClick() がクリックを無視する
            _isMenuOpen = (m.style.display === 'flex');
            // ★ メニューを閉じたとき、waitClick() を強制解決してクリック待機を再開させる
            if (!_isMenuOpen) {
                _clickAbortFlag = true;
                setTimeout(() => { _clickAbortFlag = false; }, 100);
            }
            // メニューを開くときに現在の値を反映
            if (m.style.display === 'flex') {
                document.getElementById('se-slider-debug').value = gameState.seVolume;
                document.getElementById('se-vol-debug').innerText = gameState.seVolume + '%';
                document.getElementById('bgm-slider-debug').value = gameState.bgmVolume;
                document.getElementById('bgm-vol-debug').innerText = gameState.bgmVolume + '%';
                // テキスト速度スライダーの値反映（HTMLのidは speed-val）
                const speedSlider = document.querySelector('#settings-menu input[type="range"][min="10"]');
                if (speedSlider) {
                    const val = 110 - gameState.textDelay;
                    speedSlider.value = val;
                    const label = document.getElementById('speed-val');
                    if (label) label.innerText = (val == 110 ? '最速' : val);
                }
                // セーブ/ロード/タイトルへボタンの表示状態を更新
                const saveBtn = document.getElementById('settings-save-btn');
                const loadBtnEl = document.getElementById('settings-load-btn');
                const quitBtn = document.getElementById('settings-quit-btn');
                if (saveBtn) saveBtn.style.display = 'block';
                if (loadBtnEl) loadBtnEl.style.display = 'block';
                if (quitBtn) quitBtn.style.display = 'block';
            }
        }
        return;
    }
    // ★ Ctrl+Shift+F: ワープメニュー
    if (e.ctrlKey && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        const m = document.getElementById('warp-menu');
        if (m) {
            const wasOpen = (m.style.display === 'flex');
            if (!wasOpen) {
                // 開くときにリストを再構築
                renderWarpMenu();
            }
            m.style.display = wasOpen ? 'none' : 'flex';
        }
    }
});

// ゲーム開始処理（タイトル画面の「新しく始める」から呼ばれる）
function startGame() {
    // エピレプシー警告を非表示
    const warning = document.getElementById('epilepsy-warning');
    if (warning) warning.style.display = 'none';
    
    // スキップフラグのチェック
    const p = sessionStorage.getItem('skipPhase');
    if (!p) {
        setTimeout(() => startDay1(), 500);
    } else {
        sessionStorage.removeItem('skipPhase');
        if (p === 'day1') {
            setNetworkStatus(true);
            setTimeout(() => startDay1(), 500);
        } else if (p === 'hacking') {
            gameState.day = 2;
            setTimeout(() => {
                AmbientManager.play(2);
                triggerHackingSequence();
            }, 500);
        } else if (p === 'free_explore') {
            gameState.day = 2;
            scenarioStarted = true; isWifiOff = false; isSecretNoteOpened = false; scenarioPhase = 1;
            gameState.intrusionSequenceSeen = true;
            gameState.routerShielded = true;
            document.getElementById('desktop').style.display = 'block';
            document.getElementById('blackout').style.display = 'none';
            document.getElementById('room-view').style.display = 'none';
            setNetworkStatus(true);
            setTimeout(() => {
                AmbientManager.play(2);
                resumeHackingSequence();
            }, 500);
        } else if (p === 'blackout') {
            gameState.day = 2;
            scenarioStarted = true;
            document.getElementById('desktop').style.display = 'none';
            document.getElementById('room-view').style.display = 'flex';
            setTimeout(() => { AmbientManager.play(2); playRoomSequence(); }, 500);
        } else if (p === 'day2_desktop') {
            // ★ Day2デスクトップ（導入演出後、えっちな画像を開くとハッキングが起きる状態）
            gameState.day = 2;
            scenarioStarted = false;
            document.getElementById('desktop').style.display = 'block';
            document.getElementById('room-view').style.display = 'none';
            document.getElementById('room-dialogue').innerHTML = '';
            setNetworkStatus(true);
            setTimeout(function() {
                AmbientManager.play(2);
                showDesktopDialogue('（PCを起動しよう...）');
            }, 500);
        } else if (p === 'day2_twoich') {
            // ★ Day2Twoich発見後（部屋で寝る選択肢が出る状態）
            gameState.day = 2;
            scenarioStarted = true;
            isTwoichDiscovered = true;
            document.getElementById('desktop').style.display = 'none';
            document.getElementById('room-view').style.display = 'flex';
            isRoomExplorable = true;
            document.getElementById('room-dialogue').innerHTML = '（部屋の気になる場所をクリックして調べよう）';
            setTimeout(function() {
                AmbientManager.play(2);
            }, 500);
        } else if (p === 'offline' || p === 'scene5') {
            gameState.day = 2;
            scenarioStarted = true; isWifiOff = true; isSecretNoteOpened = false; scenarioPhase = 2;
            document.getElementById('desktop').style.display = 'block';
            document.getElementById('room-view').style.display = 'none';
            document.getElementById('icons-grid').style.display = 'grid';
            setNetworkStatus(false);
            setTimeout(() => { AmbientManager.play(2); playDesktopSequence(); }, 500);
        } else if (p === 'post_shatter') {
            gameState.day = 2;
            scenarioStarted = true;
            gameState.routerShielded = true;
            document.getElementById('desktop').style.display = 'none';
            document.getElementById('room-view').style.display = 'flex';
            setTimeout(() => {
                AmbientManager.play(2);
                applyStateToUI();
                isRoomExplorable = true;
                document.getElementById('room-dialogue').innerHTML = "（部屋の気になる場所をクリックして調べよう）";
            }, 500);
        } else if (p === 'day3') {
            gameState.day = 3;
            scenarioStarted = true; isWifiOff = true; scenarioPhase = 2;
            setNetworkStatus(true);
            setTimeout(() => { AmbientManager.play(3); startDay3(); }, 500);
        } else if (p === 'day3_room') {
            gameState.day = 3;
            scenarioStarted = true; isWifiOff = true; scenarioPhase = 2;
            gameState.isFinalChoicePhase = true;
            document.getElementById('desktop').style.display = 'none';
            document.getElementById('room-view').style.display = 'flex';
            document.getElementById('btn-return-reality').style.display = 'block';
            isRoomExplorable = true;
            document.getElementById('room-dialogue').innerHTML = "（部屋の気になる場所をクリックして調べよう）";
            setNetworkStatus(true);
            setTimeout(() => { AmbientManager.play(3); }, 500);
        }
    }
}

// 実績一覧画面をレンダリング
function renderAchievements() {
    const list = document.getElementById('achievement-list');
    if (!list) return;
    const unlocked = loadAchievements();
    const total = ACHIEVEMENTS.length;
    const unlockedCount = ACHIEVEMENTS.filter(a => unlocked[a.id]).length;
    // ヘッダーに進捗表示
    const header = document.getElementById('achievement-header');
    if (header) {
        header.innerHTML = `🏆 実績一覧 <span style="font-size:0.8rem; color:rgba(255,215,0,0.7); font-weight:normal;">（${unlockedCount}/${total}）</span>`;
    }
    list.innerHTML = ACHIEVEMENTS.map(a => {
        const isUnlocked = unlocked[a.id];
        return `
            <div style="display:flex; align-items:center; gap:14px; padding:12px 16px; background:${isUnlocked ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)'}; border-radius:10px; border:1px solid ${isUnlocked ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.06)'}; opacity:${isUnlocked ? 1 : 0.4};">
                <div style="font-size:1.8rem;">${isUnlocked ? a.icon : '🔒'}</div>
                <div style="flex:1; text-align:left;">
                    <div style="font-weight:bold; font-size:0.95rem; ${isUnlocked ? '' : 'color:rgba(255,255,255,0.4)'};">${isUnlocked ? a.name : '???'}</div>
                    <div style="font-size:0.8rem; color:${isUnlocked ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)'};">${isUnlocked ? a.desc : '???'}</div>
                </div>
                <div style="font-size:0.75rem; color:${isUnlocked ? '#ffd700' : 'rgba(255,255,255,0.2)'};">${isUnlocked ? '✓ 解除済み' : '未解除'}</div>
            </div>
        `;
    }).join('');
}

// 起動時の処理
window.addEventListener('load', () => {
    // タスクバーの時計更新（ワープ時の早期リターンより前に定義しておく）
    const updateTime = () => {
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        const dateStr = (now.getMonth() + 1) + '/' + now.getDate();
        const timeEl = document.getElementById('current-time');
        const dateEl = document.getElementById('current-date');
        if (timeEl) timeEl.textContent = timeStr;
        if (dateEl) dateEl.textContent = dateStr;
    };
    updateTime();
    setInterval(updateTime, 1000);

    // ★ ワープメニューからのスキップ：エピレプシー警告を自動通過し、直接ゲーム開始
    //    renderWarpMenu() が skipTo() の直前に pchack_skip_warning をセットする
    const skipWarning = sessionStorage.getItem('pchack_skip_warning');
    if (skipWarning) {
        sessionStorage.removeItem('pchack_skip_warning');
        // エピレプシー警告を非表示
        document.getElementById('epilepsy-warning').style.display = 'none';
        // タイトル画面も表示せず、直接ゲームを開始（skipPhase がセットされているので該当シーンへワープする）
        SoundManager.init();
        // ★ ワープ時も時計を更新してから startGame() へ
        updateTime();
        startGame();
        return; // 以降の通常初期化処理をスキップ
    }

    // ★ 保留中のロードデータがあれば復元（リロード方式）
    const pendingRaw = sessionStorage.getItem('pchack_pending_load');
    if (pendingRaw) {
        sessionStorage.removeItem('pchack_pending_load');
        try {
            const pendingData = JSON.parse(pendingRaw);
            if (pendingData && pendingData.gameState && typeof pendingData.gameState.day === 'number') {
                // 復元してシーン遷移
                restoreSaveData(pendingData);
                // 全画面を非表示
                document.getElementById('epilepsy-warning').style.display = 'none';
                document.getElementById('title-screen').style.display = 'none';
                document.getElementById('save-screen').style.display = 'none';
                document.getElementById('load-screen').style.display = 'none';
                document.getElementById('settings-menu').style.display = 'none';
                document.getElementById('achievement-screen').style.display = 'none';
                document.getElementById('howto-screen').style.display = 'none';
                document.getElementById('title-settings-screen').style.display = 'none';
                // デスクトップ表示
                document.getElementById('desktop').style.display = 'block';
                document.getElementById('room-view').style.display = 'none';
                document.getElementById('hallway-view').style.display = 'none';
                document.getElementById('elevator-view').style.display = 'none';
                document.getElementById('police-station-front-view').style.display = 'none';
                setNetworkStatus(!isWifiOff);
                AmbientManager.play(gameState.day);
                // 音量スライダー反映
                const seSlider = document.getElementById('se-slider-debug');
                if (seSlider) seSlider.value = gameState.seVolume;
                const bgmSlider = document.getElementById('bgm-slider-debug');
                if (bgmSlider) bgmSlider.value = gameState.bgmVolume;
                // 進行度に応じて適切なシーンへ
                if (gameState.day === 1) {
                    if (gameState.day1SleepReady) {
                        document.getElementById('desktop').style.display = 'none';
                        document.getElementById('room-view').style.display = 'flex';
                        isRoomExplorable = true;
                        document.getElementById('room-dialogue').innerHTML = '（部屋の気になる場所をクリックして調べよう）';
                    } else {
                        startDay1();
                    }
                } else if (gameState.day === 2) {
                    // ★ 復元条件の優先順位（セーブスロットラベルと完全一致させる）
                    //    1. routerShielded → 部屋探索（ルーターがシールドされている）
                    //    2. intrusionSequenceSeen → ハッキング再開（ファイル物色後）
                    //    3. scenarioPhase === 2 → ルーター電源オフ後（playDesktopSequenceで??? .txt出現）
                    //    4. isTwoichDiscovered → Twoich発見後（部屋で寝る選択肢が出る）
                    //    5. それ以外 → デスクトップ初期状態
                    if (gameState.routerShielded) {
                        document.getElementById('desktop').style.display = 'none';
                        document.getElementById('room-view').style.display = 'flex';
                        applyStateToUI();
                        isRoomExplorable = true;
                        document.getElementById('room-dialogue').innerHTML = '（部屋の気になる場所をクリックして調べよう）';
                    } else if (gameState.intrusionSequenceSeen) {
                        resumeHackingSequence();
                    } else if (scenarioPhase === 2) {
                        // ★ ルーター電源オフ後：playDesktopSequence() で「??? .txt」アイコンを出現させる
                        document.getElementById('desktop').style.display = 'block';
                        document.getElementById('room-view').style.display = 'none';
                        document.getElementById('room-dialogue').innerHTML = '';
                        setNetworkStatus(false);
                        setTimeout(function() {
                            playDesktopSequence();
                        }, 500);
                    } else if (isTwoichDiscovered) {
                        // ★ Twoich発見後：部屋で寝る選択肢が出る状態
                        document.getElementById('desktop').style.display = 'none';
                        document.getElementById('room-view').style.display = 'flex';
                        isRoomExplorable = true;
                        document.getElementById('room-dialogue').innerHTML = '（部屋の気になる場所をクリックして調べよう）';
                    } else {
                        document.getElementById('desktop').style.display = 'block';
                        document.getElementById('room-view').style.display = 'none';
                        document.getElementById('room-dialogue').innerHTML = '';
                        setTimeout(function() {
                            showDesktopDialogue('（PCを起動しよう...）');
                        }, 500);
                    }
                } else if (gameState.day === 3) {
                    if (gameState.isFinalChoicePhase) {
                        document.getElementById('desktop').style.display = 'none';
                        document.getElementById('room-view').style.display = 'flex';
                        document.getElementById('btn-return-reality').style.display = 'block';
                        isRoomExplorable = true;
                        document.getElementById('room-dialogue').innerHTML = '（部屋の気になる場所をクリックして調べよう）';
                    } else {
                        startDay3();
                    }
                }
                return; // 復元後は通常の初期化処理をスキップ
            }
        } catch(e) { /* ignore */ }
    }

    // ★ 通常初期化パス：念のため sessionStorage のゴミをクリア
    //    以前 loadGame() が sessionStorage.setItem() まで実行したが
    //    location.reload() が実行されずにブラウザが閉じられた場合などに、
    //    古いデータが残っていると次回ページを開いたときにワープしてしまう
    sessionStorage.removeItem('pchack_pending_load');

    // settings-menuを動的構築（キャッシュ対策）
    buildSettingsMenu();

    setNetworkStatus(true);
    
    // エピレプシー警告の「ゲームを開始」ボタン → タイトル画面へ
    const okBtn = document.getElementById('epilepsy-ok-btn');
    if (okBtn) {
        okBtn.addEventListener('click', () => {
            SoundManager.init();
            // エピレプシー警告を非表示、タイトル画面を表示
            document.getElementById('epilepsy-warning').style.display = 'none';
            const title = document.getElementById('title-screen');
            if (title) title.style.display = 'flex';
        });
    }

    // タイトル画面「ゲームを開始」（新規） - セーブデータは維持
    const startBtn = document.getElementById('title-start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            document.getElementById('title-screen').style.display = 'none';
            startGame();
        });
    }

    // タイトル画面「実績を見る」
    const achBtn = document.getElementById('title-achievements-btn');
    if (achBtn) {
        achBtn.addEventListener('click', () => {
            renderAchievements();
            document.getElementById('title-screen').style.display = 'none';
            document.getElementById('achievement-screen').style.display = 'flex';
        });
    }

    // 実績画面「戻る」
    const backBtn = document.getElementById('ach-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.getElementById('achievement-screen').style.display = 'none';
            document.getElementById('title-screen').style.display = 'flex';
        });
    }

    // タイトル画面「遊び方」 - 初回光るアニメーション制御
    const howtoBtn = document.getElementById('title-howto-btn');
    if (howtoBtn) {
        // 初回起動時（遊び方を一度も見たことがない）は光るアニメーションを付ける
        if (!localStorage.getItem('pchack_has_seen_howto')) {
            howtoBtn.classList.add('howto-btn-glow');
        }
        howtoBtn.addEventListener('click', () => {
            // 遊び方を開いたら光るアニメーションを消す（二度と光らない）
            howtoBtn.classList.remove('howto-btn-glow');
            localStorage.setItem('pchack_has_seen_howto', '1');
            document.getElementById('title-screen').style.display = 'none';
            document.getElementById('howto-screen').style.display = 'flex';
        });
    }

    // 遊び方画面「戻る」
    const howtoBackBtn = document.getElementById('howto-back-btn');
    if (howtoBackBtn) {
        howtoBackBtn.addEventListener('click', () => {
            document.getElementById('howto-screen').style.display = 'none';
            document.getElementById('title-screen').style.display = 'flex';
        });
    }

    // タイトル画面「設定」→ 専用設定画面（背景が透けない）
    const settingsBtn = document.getElementById('title-settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            document.getElementById('title-screen').style.display = 'none';
            const ts = document.getElementById('title-settings-screen');
            if (ts) {
                ts.style.display = 'flex';
                // スライダーに現在値を反映
                document.getElementById('title-se-slider').value = gameState.seVolume;
                document.getElementById('title-se-vol').innerText = gameState.seVolume + '%';
                document.getElementById('title-bgm-slider').value = gameState.bgmVolume;
                document.getElementById('title-bgm-vol').innerText = gameState.bgmVolume + '%';
                const speedSlider = document.getElementById('title-speed-slider');
                if (speedSlider) {
                    const val = 110 - gameState.textDelay;
                    speedSlider.value = val;
                    const label = document.getElementById('title-speed-val');
                    if (label) label.innerText = (val == 110 ? '最速' : val);
                }
            }
        });
    }

    // タイトル画面「ストレージをクリア」（確認ダイアログ付き）
    const clearBtn = document.getElementById('title-clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            // 確認ダイアログ
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:999999;font-family:\'Noto Sans JP\',sans-serif;';
            overlay.innerHTML = `
                <div style="background:rgba(30,30,30,0.95);border:2px solid #ff4444;border-radius:12px;padding:30px 40px;text-align:center;max-width:420px;box-shadow:0 0 40px rgba(255,50,50,0.3);">
                    <div style="font-size:1.5rem;color:#ff6666;margin-bottom:20px;font-weight:bold;">⚠ 警告</div>
                    <div style="font-size:1.1rem;color:#fff;margin-bottom:10px;line-height:1.6;">全てのデータを削除しますか？</div>
                    <div style="font-size:0.85rem;color:rgba(255,255,255,0.5);margin-bottom:25px;line-height:1.5;">削除されるもの：<br>セーブデータ / 実績 / ワープ解放状態 / 音量設定<br><span style="color:#ff6666;">この操作は取り消せません。</span></div>
                    <div style="display:flex;gap:15px;justify-content:center;">
                        <button id="clear-confirm-btn" style="background:#cc3333;color:#fff;border:2px solid #ff6666;padding:12px 30px;font-size:1.1rem;border-radius:8px;cursor:pointer;font-weight:bold;transition:all 0.2s;">削除する</button>
                        <button id="clear-cancel-btn" style="background:#444;color:#fff;border:2px solid #888;padding:12px 30px;font-size:1.1rem;border-radius:8px;cursor:pointer;font-weight:bold;transition:all 0.2s;">キャンセル</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            document.getElementById('clear-confirm-btn').onclick = () => {
                clearAllStorage();
                document.body.removeChild(overlay);
                location.reload();
            };
            document.getElementById('clear-cancel-btn').onclick = () => {
                document.body.removeChild(overlay);
            };
        });
    }

    // タイトル設定画面「戻る」
    const titleSettingsBack = document.getElementById('title-settings-back-btn');
    if (titleSettingsBack) {
        titleSettingsBack.addEventListener('click', () => {
            document.getElementById('title-settings-screen').style.display = 'none';
            document.getElementById('title-screen').style.display = 'flex';
        });
    }

    // ★ ESCメニューボタン・セーブ/ロード画面「戻る」ボタンのイベントは
    //    buildSettingsMenu() 内の onclick で設定済みのため、ここでは不要

    // 最初のクリックで音声を有効化（フォールバック）
    const initAudio = () => {
        SoundManager.init();
        if (gameState.day > 0) {
            AmbientManager.play(gameState.day);
        }
        document.removeEventListener('mousedown', initAudio);
        document.removeEventListener('touchstart', initAudio);
    };
    document.addEventListener('mousedown', initAudio);
    document.addEventListener('touchstart', initAudio);
});

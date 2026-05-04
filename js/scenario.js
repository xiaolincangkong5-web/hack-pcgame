/**
 * scenario.js
 * ゲーム全体のシナリオ進行、章の遷移、およびメインストーリーの
 * ロジックを管理します。
 */

// 1日目の開始
async function startDay1() {
    lockSave();
    try {
        gameState.day = 1;
        // ★ Day1導入演出に到達したので解放
        unlockWarpDestination('day1');
        AmbientManager.play(1); // Day 1 の環境音開始
        await showDayTransition(1, "異変の予兆");
        isDialogueRunning = true;
        await showDesktopDialogue("...なんだか今日はPCの調子が変だな。");
        await showDesktopDialogue("デスクトップに見慣れないファイルがある...");
        isDialogueRunning = false;
    } finally {
        unlockSave();
    }
}

// シナリオのトリガーチェック
async function startScenario() {
    if (scenarioStarted || gameState.day !== 2) return;
    // ロード後に古い非同期処理が残っている場合はガード
    if (gameState.isHackingSequenceRunning) return;
    lockSave();
    scenarioStarted = true; scenarioPhase = 1;
    gameState.isHackingSequenceRunning = true;
    
    // --- 【ステップ2】本格的な侵入演出 ---
    if (!gameState.intrusionSequenceSeen) {
        gameState.intrusionSequenceSeen = true;
        isBlockAllInteraction = true;
        await sleep(1000);

        // 1. コマンドプロンプト起動 (操作不能にするため canClose=false, isDraggable=false)
        const term = openWindow('terminal', 'C:\\Windows\\system32\\cmd.exe', false, false);
        if (term) {
            term.classList.add('virus-terminal');
            term.style.width = '500px'; term.style.height = '350px';
            term.style.left = '50%'; term.style.top = '50%'; term.style.transform = 'translate(-50%, -50%)';
            const display = term.querySelector('.window-content');
            display.innerHTML = '<div id="cmd-text" style="padding:10px;">Microsoft Windows [Version 10.0.19045.3208]<br>(c) Microsoft Corporation. All rights reserved.<br><br>C:\\Users\\User> </div>';
            
            const cmdText = document.getElementById('cmd-text');
            const runCmd = async (text, delay = 50) => {
                for(let char of text) {
                    cmdText.innerHTML += char;
                    if (char !== ' ') SoundManager.type();
                    await sleep(delay);
                }
                cmdText.innerHTML += '<br>';
            };

            await sleep(1000);
            await runCmd("whoami"); await sleep(500);
            cmdText.innerHTML += "NT AUTHORITY\\SYSTEM<br><br>C:\\Users\\User> ";
            await sleep(800);
            await runCmd("netstat -ano | findstr :443"); await sleep(500);
            cmdText.innerHTML += "TCP    192.168.1.15:52341  [REDACTED_IP]:443  ESTABLISHED<br><br>C:\\Users\\User> ";
            await sleep(1000);
            await runCmd("taskkill /F /IM explorer.exe"); await sleep(300);
            document.getElementById('icons-grid').style.display = 'none'; // アイコン消失
            cmdText.innerHTML += "SUCCESS: The process \"explorer.exe\" has been terminated.<br><br>C:\\Users\\User> ";
            await sleep(1200);
            await runCmd("echo REMOTE_ACCESS: GRANTED > C:\\Security\\auth.log");
            await sleep(500);
            cmdText.innerHTML += "<span style='color:#f00; font-weight:bold;'>*** ACCESS GRANTED: [HACKER_CLIENT_v4.2] ***</span><br><br>C:\\Users\\User> ";
            await sleep(1500);
            await runCmd("start notepad.exe");
            await sleep(500);
        }
        closeWindow('terminal');
    }

    // 2. メモ帳が勝手に開く (位置調整: 左側)
    SoundManager.init();
    const noteWin = openWindow('notepad', 'メモ帳', true, true);
    if (noteWin) {
        noteWin.style.left = '15%'; noteWin.style.top = '20%';
        noteWin.style.transform = 'none';
        const display = noteWin.querySelector('.notepad-display');
        if (display) display.contentEditable = 'false';
    }
    
    isBlockAllInteraction = false;

    // --- 【ステップ3】ハッカーとの対話 ---
    
    // 回数に応じた警告メッセージ
    const warnings = [
        "", // 1回目
        "...無駄な抵抗はしないことだな\n",
        "...意味ないよ\n",
        "...しつこい人は嫌われるよ\n",
        "...はぁ。無駄だってわからないかな？\n",
        "...やめろ。\n",
        "...意味ない。やめろ。\n",
        "...意味ないって言ってるじゃん。\n",
        "...最終警告だ。\n"
    ];
    
    if (abortCount > 0 && abortCount < 9) {
        if (penaltyDone) return;
        isDialogueRunning = true;
        await typeInNotepad(noteWin, warnings[abortCount]);
        await sleep(1000);
        isDialogueRunning = false;
    }
    
    if (penaltyDone) return;
    await playHackerBrowsingSequence(noteWin);
    gameState.isHackingSequenceRunning = false;
    unlockSave();
}

let isAborting = false;
async function abortScenario() {
    if (isAborting) return;
    lockSave();
    isAborting = true;
    isBlockAllInteraction = true; penaltyDone = true;
    abortCount++; 
    SoundManager.init();

    Object.keys(openedApps).forEach(id => closeWindow(id));
    
    if (abortCount >= CONSTANTS.ABORT_LIMIT) {
        await sleep(2000);
        await triggerPCBreakdownPenalty();
        isAborting = false;
        unlockSave();
        return;
    }
    
    if (abortCount === 1) {
        await sleep(2000);
        await triggerPenalty();
    } else {
        await sleep(3000);
    }
    
    penaltyDone = false; isBlockAllInteraction = false;
    scenarioStarted = false;
    isAborting = false;
    unlockSave();
    startScenario();
}

async function playDesktopSequence() {
    lockSave();
    // ★ Day2PC再起動後に到達したので解放
    unlockWarpDestination('offline');
    const grid = document.getElementById('icons-grid');
    if (grid) {
        grid.style.display = 'grid'; // グリッドを再表示
        // ハッキング演出で消された個別アイコンのスタイルをリセット
        const icons = grid.querySelectorAll('.icon-item');
        icons.forEach(icon => {
            icon.style.opacity = '1';
            icon.style.transform = 'none';
        });
    }
    await sleep(2000);
    const sf = document.createElement('div'); sf.className = 'icon-item'; sf.id = 'icon-secret';
    sf.style.position = 'absolute'; sf.style.left = '50%'; sf.style.top = '50%'; sf.style.transform = 'translate(-50%, -50%)';
    sf.innerHTML = `<div class="icon-wrapper"><svg viewBox="0 0 24 24" fill="#ffffff"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0-2-.9-2-2V8l-6-6zM13 3.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/></svg></div><span class="icon-label">??? .txt</span>`;
    document.getElementById('desktop').appendChild(sf); SoundManager.beep(1200, 0.2);
    sf.onclick = () => SoundManager.beep(400, 0.1);
    sf.ondblclick = () => handleSecretNote();
    unlockSave();
}

// Day 1/2 日付遷移表示
async function showDayTransition(day, subtitle) {
    const el = document.createElement('div');
    el.className = 'day-transition'; el.id = 'day-transition';
    el.innerHTML = `
        <div class="day-transition-label">CHAPTER</div>
        <div class="day-transition-title" style="opacity:0; transform:translateY(20px); transition: all 1s ease;">Day ${day}</div>
        <div class="day-transition-sub" style="opacity:0; transition: opacity 1s ease 0.5s;">${subtitle}</div>`;
    document.body.appendChild(el);
    await sleep(200);
    el.querySelector('.day-transition-title').style.opacity = '1';
    el.querySelector('.day-transition-title').style.transform = 'translateY(0)';
    await sleep(800);
    el.querySelector('.day-transition-sub').style.opacity = '1';
    await sleep(2500);
    el.style.opacity = '0'; el.style.transition = 'opacity 1s ease';
    await sleep(1000); el.remove();
}

// Day 3 開始（PC再起動・ハッキング再開）
async function transitionToDay3() {
    lockSave();
    gameState.day = 3;
    gameState.isFinalChoicePhase = false;
    AmbientManager.stop();
    
    const blackout = document.getElementById('blackout');
    blackout.style.display = 'flex';
    blackout.style.background = '#000';
    blackout.style.zIndex = '80000';
    blackout.innerHTML = `<div class="day-transition-label" style="opacity:0; transition:opacity 1s;">Day 2</div>
                         <div class="day-transition-title" style="opacity:0; transition:opacity 1s; color:#ff4500;">...END?</div>`;
    await sleep(500);
    blackout.querySelector('.day-transition-label').style.opacity = '1';
    await sleep(800);
    blackout.querySelector('.day-transition-title').style.opacity = '1';
    await sleep(2000);
    
    // 破壊・再起動演出
    SoundManager.glitch(1.0, 2.0);
    document.body.style.filter = 'invert(1) contrast(5)';
    blackout.style.background = '#f00';
    blackout.innerHTML = `<div class="blackout-text" style="color:#000; font-size:4rem; font-weight:bold;">REBOOTING...</div>`;
    await sleep(200);
    blackout.style.background = '#000';
    document.body.style.filter = '';
    await sleep(1500);
    
    // 本来の Day 3 へ
    document.body.style.filter = 'none';
    blackout.innerHTML = '';
    blackout.style.display = 'none';
    Object.keys(openedApps).forEach(id => closeWindow(id));
    document.getElementById('room-view').style.display = 'none';
    document.getElementById('desktop').style.display = 'block';
    document.getElementById('btn-return-reality').style.display = 'none';
    setNetworkStatus(true); // 強制オンライン
    
    AmbientManager.play(3);
    await showDayTransition(3, "終焉");
    await startDay3();
    unlockSave();
}

async function startDay3() {
    lockSave();
    gameState.day = 3; scenarioPhase = 2;
    // ★ Day3導入演出に到達したので解放
    unlockWarpDestination('day3');
    isDialogueRunning = true;
    await showDesktopDialogue("...PCが勝手に再起動した？");
    await showDesktopDialogue("ネットワークが...勝手につながってる...！？");
    await showDesktopDialogue("ルーターの電源を切ったはずなのに...！");
    isDialogueRunning = false;
    
    await sleep(1000);
    SoundManager.glitch(0.3);
    const browserWin = openWindow('browser', 'ブラウザ');
    if (browserWin) {
        browserWin.style.width = '750px'; browserWin.style.height = '500px';
        browserWin.style.left = '150px'; browserWin.style.top = '80px';
    }
    await sleep(1500);
    isDialogueRunning = true;
    await showDesktopDialogue("これは...SNS？俺の情報がネットに...！？");
    isDialogueRunning = false;
    await sleep(2000);
    SoundManager.beep(1200, 0.2);
    const noteWin = openWindow('notepad', 'メモ帳');
    if (noteWin) {
        const display = noteWin.querySelector('.notepad-display');
        if (display) display.contentEditable = 'false';
        noteWin.style.left = '300px'; noteWin.style.top = '200px';
        bringToFront(noteWin);
    }
    await sleep(500);
    isBlockAllInteraction = false;
    isDialogueRunning = true;

    // 初回の挨拶（閉じられた回数によって変化させる）
    const count = gameState.day3NotepadCloseCount;
    if (count === 0) {
        await typeInNotepad(noteWin, "Hacker: よくもまあ、しぶとく抵抗するね。\n");
    } else {
        await typeInNotepad(noteWin, "Hacker: おかえり。何度閉じても無駄だって、まだわからないかな？\n");
    }
    
    await sleep(1500);
    await typeInNotepad(noteWin, "Hacker: でも、もう手遅れだ。\n");
    await sleep(1500);
    await typeInNotepad(noteWin, "Hacker: 君の情報はすでにネット中に拡散されている。\n");
    await sleep(1500);
    await typeInNotepad(noteWin, "Hacker: 名前。住所。趣味。検索履歴。全部だ。\n");
    await sleep(2000);
    await typeInNotepad(noteWin, "\nHacker: どうするかは、君が決めろ。\n");
    await sleep(1500);
    await typeInNotepad(noteWin, "Hacker: ただし...時間はあまりないぞ。\n");
    await sleep(1500);

    // Day 3 最終局面として部屋側の専用分岐を有効化
    gameState.isFinalChoicePhase = true;
    // ★ Day3最終選択に到達したので解放
    unlockWarpDestination('day3_room');
    document.getElementById('btn-return-reality').style.display = 'block';
    
    // ゴミ箱アイコンを表示（廃棄END用）- 左下に浮かび上がる
    const trashIcon = document.getElementById('icon-trash');
    if (trashIcon) {
        trashIcon.style.display = 'flex';
        // ダブルクリックで発動
        let clickCount = 0;
        trashIcon.onclick = () => {
            if (isBlockAllInteraction || isDialogueRunning) return;
            clickCount++;
            if (clickCount >= 2) {
                clickCount = 0;
                triggerDiscardEnding();
            }
            setTimeout(() => { clickCount = 0; }, 500);
        };
    }
    
    isDialogueRunning = false;
    unlockSave();
}

async function triggerDay3NotepadPenalty(win) {
    lockSave();
    // 選択肢表示中などは true になっているが、強制的に演出を開始する
    isDialogueRunning = true;
    gameState.day3NotepadCloseCount++;
    const count = gameState.day3NotepadCloseCount;
    win.classList.add('closing'); win.remove();
    delete openedApps['notepad'];
    if (count >= CONSTANTS.NOTEPAD_CLOSE_LIMIT) { await triggerFlameEnding(); return; }
    await sleep(3000); SoundManager.glitch(0.2, 1.5);
    const newWin = openWindow('notepad', 'メモ帳');
    if (newWin) {
        newWin.style.left = '300px'; newWin.style.top = '200px';
        const display = newWin.querySelector('.notepad-display');
        if (display) display.contentEditable = 'false';
    }
    await sleep(500);
    let msg = "";
    if (count === 1) msg = "Hacker: 意味ないよ。ちゃんと聞いて。\n";
    else if (count === 2) msg = "Hacker: 学ばないね。君、そんなに暇なの？\n";
    else if (count === 3) msg = "Hacker: 逃げても何も変わらないよ。現実を見なよ。\n";
    else if (count === 4) msg = "Hacker: ...ここまで馬鹿だとあきれるよ。いい加減にしてくれないか。\n";
    else if (count === 5) msg = "Hacker: 最終警告だ。次やったら、PCだけじゃ済まないよ？\n";
    await typeInNotepad(newWin, msg + "\n");
    await sleep(1000);
    await typeInNotepad(newWin, "\nHacker: どうするかは、君が決めろ。\n");
    await sleep(1500);
    await typeInNotepad(newWin, "Hacker: ただし...時間はあまりないぞ。\n");
    await sleep(2000);
    isDialogueRunning = false;
    unlockSave();
}

// 1日目の隠し要素: えっちながぞお
async function triggerLewdEasterEgg() {
    lockSave();
    const win = openWindow('lewd-egg', 'えっちながぞお');
    if (!win) return;
    win.style.width = '400px'; win.style.height = '400px';
    win.style.left = '50%'; win.style.top = '50%'; win.style.transform = 'translate(-50%, -50%)';
    
    win.querySelector('.window-content').innerHTML = `
        <div class="mosaic-container" style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; background:#ccc; overflow:hidden; position:relative;">
            <img src="assets/images/lewd_egg.png" style="width:100%; height:100%; object-fit:contain; filter:blur(1px) contrast(1.2); mix-blend-mode: multiply;">
            <div class="mosaic-overlay" style="position:absolute; top:0; left:0; width:100%; height:100%; background:radial-gradient(circle, transparent 40%, rgba(0,0,0,0.3) 100%); pointer-events:none;"></div>
        </div>
    `;
    SoundManager.glitch(0.5, 1.0);
    await showDesktopDialogue("これは...。");
    await sleep(1000);
    win.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    win.style.opacity = '0';
    win.style.transform = 'translate(-50%, -50%) scale(0.95)';
    await sleep(800);
    closeWindow('lewd-egg');
    await showDesktopDialogue("今のは何だったんだ...");
    gameState.lewdEasterEggSeen = true;
    unlockAchievement('easter_egg');
    unlockSave();
}

// 偽のルーター廃棄エンディング演出
async function triggerFakeDiscardEnding() {
  lockSave();
  try {
    isBlockAllInteraction = true;
    isDialogueRunning = true;
    isRoomExplorable = false;

    clearHackingVisuals();
    AmbientManager.stop();
    if (virusTimerInterval) { clearInterval(virusTimerInterval); virusTimerInterval = null; }
    document.getElementById('virus-timer').style.display = 'none';
    document.getElementById('btn-return-reality').style.display = 'none';
    document.getElementById('room-choices').style.display = 'none';
    
    isBlockAllInteraction = false;
    const roomDlg = document.getElementById('room-dialogue');
    async function safeRoomDialogue(text) {
        roomDlg.textContent = '';
        for (let i = 0; i < text.length; i++) {
            roomDlg.textContent += text[i];
            if (text[i] !== ' ' && text[i] !== '　') SoundManager.type();
            await sleep(gameState.textDelay * 0.8);
        }
        roomDlg.innerHTML += '<span class="blink"> ▼</span>';
        await waitClick();
    }

    await safeRoomDialogue("「...そうだ、ルーターだ。これを捨ててしまえばいいんだ。」");
    await safeRoomDialogue("俺はWi-Fiルーターのケーブルを乱暴に引き抜き、ゴミ袋に突っ込んだ。");
    await safeRoomDialogue("「これで、もうどこにも繋がらない。俺の勝ちだ。」");

    await showAnimatedBlackout("あれから1日", 3000);
    await safeRoomDialogue("あれから1日。PCは捨てていないが、ルーターを捨てたおかげか何も起きていない。");
    await safeRoomDialogue("結局、ハッカーも物理的な回線がなければ何もできなかったんだろう。");
    await safeRoomDialogue("少しだけ、平和な日常が戻ってきた気がする。");
    
    const endEl = document.createElement('div');
    endEl.className = 'ending-screen glass-panel';
    endEl.style.zIndex = "80000";
    endEl.style.background = "#000";
    endEl.innerHTML = `
        <div class="ending-tag">ENDING: NORMAL LIFE?</div>
        <div class="ending-title">平和な日常</div>
        <div class="ending-body">あなたは脅威を排除し、平穏を取り戻した。</div>
    `;
    document.body.appendChild(endEl);
    await sleep(3000);
    
    // 1. 亀裂演出 (放射状)
    const crackContainer = document.createElement('div');
    crackContainer.className = 'screen-crack';
    
    // スケッチに基づき、中央から放射状に広がるギザギザな線を描画
    let paths = "";
    const edges = [[0,0],[25,0],[50,0],[75,0],[100,0],[100,25],[100,50],[100,75],[100,100],[75,100],[50,100],[25,100],[0,100],[0,75],[0,50],[0,25]];
    edges.forEach(edge => {
        let d = "M 500 500 ";
        let curX = 500, curY = 500;
        let tx = edge[0] * 10, ty = edge[1] * 10;
        for(let i=1; i<=4; i++) {
            let ratio = i / 4;
            let nx = 500 + (tx - 500) * ratio + (Math.random() - 0.5) * 80;
            let ny = 500 + (ty - 500) * ratio + (Math.random() - 0.5) * 80;
            d += `L ${nx} ${ny} `;
        }
        paths += `<path d="${d}" fill="none" />`;
    });
    crackContainer.innerHTML = `<svg viewBox="0 0 1000 1000">${paths}</svg>`;
    document.body.appendChild(crackContainer);

    await sleep(200);
    crackContainer.classList.add('active');
    SoundManager.playCustomSE('assets/se/ガラスにヒビが入る.mp3', 1.25);
    await sleep(1500);

    // 2. 粉砕・落下演出
    SoundManager.horrorImpact();
    crackContainer.remove(); // 粉砕開始と同時に亀裂の線を消す
    
    // 背後を隠すための黒いレイヤー
    const bgLayer = document.createElement('div');
    bgLayer.style.position = 'fixed';
    bgLayer.style.top = '0'; bgLayer.style.left = '0';
    bgLayer.style.width = '100vw'; bgLayer.style.height = '100vh';
    bgLayer.style.background = '#000';
    bgLayer.style.zIndex = '89999';
    document.body.appendChild(bgLayer);

    // 元の画面を非表示にし、破片（クローン）を作成して落下させる
    endEl.style.opacity = '0';
    
    const shardPolys = [
        "50% 50%, 0% 0%, 25% 0%", "50% 50%, 25% 0%, 50% 0%", "50% 50%, 50% 0%, 75% 0%", "50% 50%, 75% 0%, 100% 0%",
        "50% 50%, 100% 0%, 100% 25%", "50% 50%, 100% 25%, 100% 50%", "50% 50%, 100% 50%, 100% 75%", "50% 50%, 100% 75%, 100% 100%",
        "50% 50%, 100% 100%, 75% 100%", "50% 50%, 75% 100%, 50% 100%", "50% 50%, 50% 100%, 25% 100%", "50% 50%, 25% 100%, 0% 100%",
        "50% 50%, 0% 100%, 0% 75%", "50% 50%, 0% 75%, 0% 50%", "50% 50%, 0% 50%, 0% 25%", "50% 50%, 0% 25%, 0% 0%"
    ];

    shardPolys.forEach((poly, i) => {
        const piece = document.createElement('div');
        piece.className = 'shatter-piece';
        piece.innerHTML = endEl.innerHTML;
        piece.style.clipPath = `polygon(${poly})`;
        piece.style.setProperty('--tx', (Math.random() - 0.5) * 300 + 'px');
        piece.style.setProperty('--rot', (Math.random() - 0.5) * 120 + 'deg');
        document.body.appendChild(piece);
        
        setTimeout(() => piece.classList.add('falling'), i * 30);
    });

    await sleep(2000);
    endEl.remove();
    bgLayer.remove();
    document.querySelectorAll('.shatter-piece').forEach(p => p.remove());
    
    await showAnimatedBlackout("数分後", 2000);
    await safeRoomDialogue("「ただいまー。ふぅ、コンビニ行くのも一苦労だな。」");
    await safeRoomDialogue("「...あれ？」");
    await safeRoomDialogue("「なんで、棚の上にルーターが...？」");
    
    gameState.routerShielded = true;
    // ★ Day2物色後（PC不通）に到達したので解放
    unlockWarpDestination('post_shatter');
    // ルーターが置かれている棚を白く発光させる
    const shelf = document.getElementById('obj-shelf');
    if (shelf) shelf.classList.add('shielded-object');
    await safeRoomDialogue("「しかもこれ、なんだ...？ 透明な金属みたいなもので覆われていて...触れない。」");
    await safeRoomDialogue("「コンセントまでガチガチに固められてる...。これじゃあ、もう電源を切ることすらできない。」");
    await safeRoomDialogue("「...そうだ、PCの状態を確認しなきゃ。あのハッカーがまだ何かしてるかもしれない。」");
    
    // PCデスクトップに戻る
    document.getElementById('room-view').style.display = 'none';
    document.getElementById('desktop').style.display = 'block';
    setNetworkStatus(true);
    AmbientManager.play(2); // 環境音再開
    isBlockAllInteraction = false;
    isDialogueRunning = false;
    
    // ハッカーがメモ帳でメッセージを送ってくる
    const note = openWindow('notepad', 'メモ帳', true, true);
    if (note) {
        isDialogueRunning = true;
        await typeInNotepad(note, "Hacker: やあ。ルーターを元に戻すの、結構苦労したんだよ？\n");
        await sleep(1000);
        await typeInNotepad(note, "Hacker: せっかく君のために用意した環境なんだ。勝手に壊さないでほしいな。\n");
        await sleep(1000);
        await typeInNotepad(note, "Hacker: さて、遊びを続けようか。\n");
        await sleep(500);
        // ファイル物色シーンへ
        await playHackerBrowsingSequence(note);
    }
    unlockSave();
  } catch (e) {
    console.error('[DISCARD] ERROR:', e);
    // エラー時も確実に状態を復旧
    isBlockAllInteraction = false;
    isDialogueRunning = false;
    isRoomExplorable = true;
    document.getElementById('room-view').style.display = 'flex';
    document.getElementById('desktop').style.display = 'none';
    // クリーンアップ
    document.querySelectorAll('.shatter-piece, .screen-crack, .ending-screen').forEach(el => el.remove());
    const bgLayer = document.querySelector('div[style*="z-index: 89999"]');
    if (bgLayer) bgLayer.remove();
    unlockSave();
  }
}

// ハッキング再開演出（部屋のセリフからデスクトップ移行までの一連の流れ）
async function resumeHackingSequence() {
    // ロード後に古い非同期処理が残っている場合はガード
    if (gameState.isHackingSequenceRunning) return;
    lockSave();
    // ★ Day2ハッカー再接続に到達したので解放
    unlockWarpDestination('free_explore');
    isBlockAllInteraction = true;
    isDialogueRunning = true;
    gameState.isHackingSequenceRunning = true;
    
    // 1. 部屋での気づき
    document.getElementById('desktop').style.display = 'none';
    document.getElementById('room-view').style.display = 'flex';
    const roomDlg = document.getElementById('room-dialogue');
    async function safeRoomDialogue(text) {
        roomDlg.textContent = '';
        for (let i = 0; i < text.length; i++) {
            roomDlg.textContent += text[i];
            if (text[i] !== ' ' && text[i] !== '　') SoundManager.type();
            await sleep(gameState.textDelay * 0.8);
        }
        roomDlg.innerHTML += '<span class="blink"> ▼</span>';
        await waitClick();
    }
    await safeRoomDialogue("「...PCが付いてる。」");
    
    // 2. デスクトップへ移行
    document.getElementById('room-view').style.display = 'none';
    document.getElementById('desktop').style.display = 'block';
    setNetworkStatus(true);
    
    // 3. ハッカーのタイピング開始
    const note = openWindow('notepad', 'メモ帳', true, true);
    if (note) {
        await typeInNotepad(note, "Hacker: やあ。ルーターを元に戻すの、結構苦労したんだよ？\n");
        await sleep(1000);
        await typeInNotepad(note, "Hacker: せっかく君のために用意した環境なんだ。勝手に壊さないでほしいな。\n");
        await sleep(1000);
        await typeInNotepad(note, "Hacker: さて、遊びを続けようか。\n");
        await sleep(500);
    }
    
    // 4. ファイル物色シーンへ
    await playHackerBrowsingSequence(note);
    gameState.isHackingSequenceRunning = false;
    unlockSave();
}

/**
 * events.js
 * ハッキング演出、タイマー、特殊ペナルティ演出など、
 * 主にPC画面上での動的なイベントを管理します。
 */

var isVirusSequenceRunning = false;
window.hackingIntervals = window.hackingIntervals || {}; // ハッキング演出のインターバル管理

// ハッキング開始のトリガー演出（超豪華版）
async function triggerHackingSequence() {
    lockSave();
    try {
        if (scenarioStarted || gameState.day !== 2 || isVirusSequenceRunning) return;
        // ★ Day2ハッキング演出に到達したので解放
        unlockWarpDestination('hacking');
    
        if (gameState.virusSequenceSeen) {
            startScenario();
            return;
        }
        
        // 初回のみウイルス演出を実行
        if (!gameState.virusSequenceSeen) {
            isVirusSequenceRunning = true;
            gameState.virusSequenceSeen = true;
            isBlockAllInteraction = false; 
            
            const desktop = document.getElementById('desktop');
            const grid = document.getElementById('icons-grid');
            const icons = Array.from(grid.children);

            // 1. 予兆 (0-3s): 画面が震えだし、アイコンが消えていく
            SoundManager.horrorImpact();
            desktop.classList.add('virus-shake');
            document.body.style.filter = 'contrast(2) saturate(2) brightness(0.8)';
            
            const overlay = document.createElement('div');
            overlay.className = 'virus-overlay';
            overlay.style.opacity = '1';
            overlay.innerHTML = 'DETECTION';
            document.body.appendChild(overlay);
            
            // ウイルス制限時間タイマーの開始
            gameState.isHackingSequenceRunning = true;
            const vTimer = document.getElementById('virus-timer');
            vTimer.style.display = 'block';
            vTimer.style.color = '#ff0000';
            vTimer.style.fontSize = '4rem';
            
            document.getElementById('btn-return-reality').style.display = 'block';
            startVirusTimer();

            for (let i = 0; i < icons.length; i++) {
                setTimeout(() => {
                    icons[i].style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                    icons[i].style.transform = 'scale(0) rotate(1080deg)';
                    icons[i].style.opacity = '0';
                    SoundManager.beep(100 + i * 30, 0.05, 'sawtooth', 0.05);
                }, i * 150);
            }
            await sleep(3000);
            if (!gameState.isHackingSequenceRunning) return; // 中断チェック
            
            overlay.innerHTML = 'INTRUSION';
            SoundManager.glitch(0.5, 1.0);
            document.body.style.filter = 'invert(1) contrast(5)';
            await sleep(1000);
            document.body.style.filter = '';

            // 2. 侵食 (4-10s): ターミナルとウィンドウの乱舞
            window.hackingIntervals.glitchSound = setInterval(() => {
                if (isDialogueRunning) return;
                SoundManager.glitch(0.1, 0.3);
            }, 150);

            const dummyWindows = [];
            let logCount = 0;
            for (let i = 0; i < 6; i++) {
                const win = openWindow('virus', `SYSTEM_FAILURE_${i}`, false);
                if (win) {
                    win.classList.add('virus-terminal');
                    win.querySelector('.window-content').innerHTML = `<div style="padding:10px; height:100%;" id="term-${i}"></div>`;
                    dummyWindows.push(win);
                    window.hackingIntervals[`log-${i}`] = setInterval(() => {
                        if (isDialogueRunning) return;
                        const el = document.getElementById(`term-${i}`);
                        if (!el) { clearInterval(window.hackingIntervals[`log-${i}`]); return; }
                        const logs = ["Deleting C:/Users/User/Documents...", "Accessing Private Keys...", "Encrypting File System...", "UPLOADING TO CLOUD...", "FAILED TO ABORT", "PORT 8080 OPENED"];
                        el.innerHTML += `<div>> ${logs[Math.floor(Math.random() * logs.length)]}</div>`;
                        el.scrollTop = el.scrollHeight;
                        if (logCount++ > 50) el.innerHTML = "";
                    }, 100);
                }
                await sleep(800);
                if (!gameState.isHackingSequenceRunning) return; // 中断チェック
            }

            // 3. 恐怖 (10-20s): 全画面オーバーレイと画面反転
            overlay.innerHTML = ""; // 内容をクリア
            if (!gameState.isHackingSequenceRunning) { overlay.remove(); return; } // 中断チェック

            const messages = ["I AM WATCHING YOU", "ACCESS DENIED", "LOLOLOLOLOLOL", "GIVE ME EVERYTHING", "IT IS TOO LATE"];
            window.hackingIntervals.flash = setInterval(() => {
                if (isDialogueRunning) return;
                overlay.innerText = messages[Math.floor(Math.random() * messages.length)];
                overlay.style.opacity = overlay.style.opacity === "0" ? "1" : "0";
                if (Math.random() > 0.7) desktop.classList.toggle('virus-invert');
                SoundManager.beep(Math.random() * 1000 + 100, 0.05, 'sawtooth', 0.01);
            }, 150);

            await sleep(10000);
            if (!gameState.isHackingSequenceRunning) return; // 中断チェック

            window.hackingIntervals.spawn = setInterval(() => {
                if (isDialogueRunning) return;
                const popup = document.createElement('div');
                popup.className = 'window glass-panel opening';
                popup.style.width = '200px'; popup.style.height = '100px';
                popup.style.left = Math.random() * (window.innerWidth - 200) + 'px';
                popup.style.top = Math.random() * (window.innerHeight - 100) + 'px';
                popup.style.zIndex = 10000 + dummyWindows.length;
                popup.innerHTML = `<div class="window-header" style="background:#f00; height:20px;"></div><div style="padding:10px; color:#f00; font-weight:bold; text-align:center;">ERROR</div>`;
                document.getElementById('window-manager').appendChild(popup);
                dummyWindows.push(popup);
                SoundManager.beep(800, 0.05, 'sine', 0.02);
            }, 100);

            let angle = 0;
            window.hackingIntervals.swirl = setInterval(() => {
                if (isDialogueRunning) return;
                angle += 0.1;
                dummyWindows.forEach((win, idx) => {
                    const r = 100 + idx * 10;
                    const x = window.innerWidth / 2 + Math.cos(angle + idx * 0.5) * r - (win.offsetWidth / 2);
                    const y = window.innerHeight / 2 + Math.sin(angle + idx * 0.5) * r - (win.offsetHeight / 2);
                    win.style.left = x + 'px';
                    win.style.top = y + 'px';
                    win.style.transform = `rotate(${angle * 50}deg) scale(${1 + Math.sin(angle)})`;
                });
            }, 30);

            // 4. 侵入完了: 画面反転演出
            await sleep(10000);
            if (!gameState.isHackingSequenceRunning) return; // 中断チェック
            desktop.classList.add('virus-invert');

            // 5. 終焉: タイマーが0になるのを待つ（演出とタイマーを完璧に合わせる）
            while (virusTimeLeft > 0) {
                await sleep(100);
                if (!gameState.isHackingSequenceRunning) return;
            }
            
            isBlockAllInteraction = true;
            
            // クリーニング
            clearHackingVisuals();
            
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
            desktop.classList.remove('virus-shake', 'virus-invert');
            
            dummyWindows.forEach(win => win.remove());
            Object.keys(openedApps).forEach(id => {
                if (openedApps[id]) {
                    openedApps[id].remove();
                    delete openedApps[id];
                }
            });
            
            grid.style.display = 'none';

            SoundManager.horrorImpact();
            const blackout = document.getElementById('blackout');
            blackout.style.display = 'flex';
            blackout.innerHTML = `<div class="blackout-text" style="color:#ff0000; font-size:3em; text-shadow: 0 0 10px #f00;">SYSTEM COMPROMISED</div>`;
            await sleep(2000);
            blackout.style.display = 'none';
            
            grid.style.display = 'grid';
            isBlockAllInteraction = false;
            await startScenario();
        }
    } catch (e) {
        console.error('triggerHackingSequence error:', e);
        isBlockAllInteraction = false;
        isVirusSequenceRunning = false;
        clearHackingVisuals();
    } finally {
        unlockSave();
    }
}

// ハッキング演出のクリーニング
function clearHackingVisuals() {
    gameState.isHackingSequenceRunning = false;
    
    // インターバルをすべて停止
    Object.keys(window.hackingIntervals).forEach(key => {
        clearInterval(window.hackingIntervals[key]);
    });
    window.hackingIntervals = {};

    const desktop = document.getElementById('desktop');
    if (desktop) {
        desktop.classList.remove('virus-shake', 'virus-invert');
    }
    document.body.style.filter = '';
    
    const overlays = document.querySelectorAll('.virus-overlay');
    overlays.forEach(o => o.remove());
    
    Object.keys(openedApps).forEach(id => {
        const win = openedApps[id];
        if (win) win.remove();
        delete openedApps[id];
    });
    
    const windows = document.querySelectorAll('.window');
    windows.forEach(win => { win.remove(); });

    // ※ タイマーはここでは消さない（タイムアップまで表示し続けるため）
    
    // ウイルスタイマーがまだ動いている状態でハッキングが終了＝生還
    if (virusTimerInterval) {
        clearInterval(virusTimerInterval);
        virusTimerInterval = null;
        document.getElementById('virus-timer').style.display = 'none';
        unlockAchievement('virus_survive');
    }
}

// ハッカーがファイルを閲覧し対話する共通演出
async function playHackerBrowsingSequence(noteWin) {
    lockSave();
    scenarioStarted = true; scenarioPhase = 1;
    gameState.isHackingSequenceRunning = true;
    // ウィンドウのドラッグ移動を許可するためブロックを解除
    // ファイル操作は isDialogueRunning / scenarioPhase で別途制御されている
    isBlockAllInteraction = false;
    if (penaltyDone) return;
    const filesWin = openWindow('files', 'フォルダー', true, true);
    if (filesWin) {
        filesWin.style.left = '550px'; filesWin.style.top = '150px';
    }
    
    isDialogueRunning = true;
    if (penaltyDone) return;
    await typeInNotepad(noteWin, "Hacker: へぇ...面白そうなフォルダがあるな。覗いてやるよ。\n");
    if (penaltyDone) return;
    await sleep(1500);
    
    window.updateFiles('win-files', 'pictures', true); // 強制移動
    if (penaltyDone) return;
    await typeInNotepad(noteWin, "Hacker: 『ピクチャ』フォルダか。どれどれ...\n");
    if (penaltyDone) return;
    await sleep(1500);
    
    if (penaltyDone) return;
    await typeInNotepad(noteWin, "Hacker: 『秘密の画像.jpg』...これは傑作だね。気に入ったよ。\n");
    if (penaltyDone) return;
    await sleep(1500);
    
    if (penaltyDone) return;
    window.updateFiles('win-files', 'documents', true); // 強制移動
    if (penaltyDone) return;
    await typeInNotepad(noteWin, "Hacker: 次は『書類』フォルダだ。こっちは真面目そうだな...\n");
    if (penaltyDone) return;
    await sleep(2000);
    
    if (penaltyDone) return;
    await typeInNotepad(noteWin, "Hacker: ...お。この履歴、面白い買い物をした記録があるじゃないか。RJ番号ばっかりｗ\n");
    if (penaltyDone) return;
    await sleep(1500);
    
    if (penaltyDone) return;
    await typeInNotepad(noteWin, "Hacker: 隠したつもりだろうけど、俺には全部筒抜けなんだよ。\n");
    if (penaltyDone) return;
    await sleep(1500);

    if (penaltyDone) return;
    await typeInNotepad(noteWin, "\nHacker: ...全部見せてもらったよ。なかなかいい趣味してるね。\n\n");
    if (penaltyDone) return;
    await sleep(1000);
    
    isDialogueRunning = false;
    if (penaltyDone) return;
    const choice1 = await showChoices(noteWin, [
        { text: "政府の人間ですか？", value: "gov" },
        { text: "お前は誰だ！", value: "who" }
    ]);
    
    if (penaltyDone) return;
    isDialogueRunning = true;
    if (choice1 === "gov") {
        await typeInNotepad(noteWin, "Me: 政府の人間ですか？\n"); if (penaltyDone) return; await sleep(1500);
        const d = noteWin.querySelector('.notepad-display');
        if (d) {
            d.innerHTML = d.innerHTML.replace("政府", '<span class="black-bar">政府</span>'); // 黒塗り演出
            SoundManager.glitch();
        }
        if (penaltyDone) return;
        await sleep(1000);
        await typeInNotepad(noteWin, "Hacker: 違います。国家権力なんて退屈なものじゃない。\n");
    } else {
        await typeInNotepad(noteWin, "Me: お前は誰だ！勝手に覗き見するな！\n"); if (penaltyDone) return; await sleep(1000);
        await typeInNotepad(noteWin, "Hacker: 怒るなって。ただの暇つぶしだよ。\n");
    }
    
    if (penaltyDone) return;
    await sleep(1000);
    isDialogueRunning = false;
    if (penaltyDone) return;
    const choice2 = await showChoices(noteWin, [
        { text: "おじん？", value: "ojin", glitch: true },
        { text: "何が目的だ？", value: "target" }
    ]);
    
    if (penaltyDone) return;
    isDialogueRunning = true;
    if (choice2 === "ojin") {
        await typeInNotepad(noteWin, "Me: おじん？\n"); if (penaltyDone) return; await sleep(1000);
        const d = noteWin.querySelector('.notepad-display');
        if (d) {
            const lines = d.innerHTML.split('<br>');
            let lastLine = lines[lines.length - 2];
            
            // おじん -> こじん 書き換え演出
            for(let k=0; k<3; k++) {
                if (penaltyDone) return;
                lastLine = lastLine.replace("おじん", "こじん"); lines[lines.length-2] = lastLine; d.innerHTML = lines.join('<br>');
                SoundManager.beep(800, 0.05); await sleep(300);
                lastLine = lastLine.replace("こじん", "おじん"); lines[lines.length-2] = lastLine; d.innerHTML = lines.join('<br>');
                SoundManager.beep(400, 0.05); await sleep(300);
            }
            lastLine = lastLine.replace("おじん", "こじん"); lines[lines.length-2] = lastLine; d.innerHTML = lines.join('<br>');
        }
        if (penaltyDone) return;
        await sleep(1000);
        await typeInNotepad(noteWin, "Hacker: はい　こじんです。組織じゃない。\n");
    } else {
        await typeInNotepad(noteWin, "Me: 何が目的だ？金か？\n"); if (penaltyDone) return; await sleep(1000);
        await typeInNotepad(noteWin, "Hacker: 金もいいけど、君のリアクションが最高でね。\n");
    }
    
    if (penaltyDone) return;
    await sleep(2000);
    isDialogueRunning = false;
    gameState.isHackingSequenceRunning = false;
    unlockSave();
    await transitionToDay2Room();
}

async function triggerPenalty() {
    if (isPenaltyRunning) return;
    lockSave();
    isPenaltyRunning = true; isBlockAllInteraction = true; SoundManager.init();
    const spamLayer = document.getElementById('penalty-spam'); spamLayer.style.display = 'block'; spamLayer.innerHTML = "";
    const garbledChars = "@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~!@#$%^&*()_+";
    let count = 0;
    const spamInterval = setInterval(() => {
        for(let j=0; j<5; j++) {
            let text = ""; for(let i=0; i<20; i++) text += garbledChars[Math.floor(Math.random() * garbledChars.length)];
            const div = document.createElement('div');
            div.style.position = 'absolute'; div.style.left = Math.random() * 90 + '%'; div.style.top = Math.random() * 95 + '%';
            div.textContent = text; spamLayer.appendChild(div); 
            SoundManager.glitch(0.05, 0.33);
        }
        count++; if (count >= 50) clearInterval(spamInterval);
    }, 100);
    await sleep(5000); spamLayer.style.display = 'none';
    const blackout = document.getElementById('blackout'); blackout.style.display = 'flex'; blackout.innerHTML = "";
    await sleep(3000);
    const item = document.createElement('div'); item.className = 'penalty-text-center'; item.textContent = "逃げられると思うな";
    blackout.appendChild(item); SoundManager.thud(); await sleep(3000);
    blackout.style.display = 'none'; isBlockAllInteraction = false; isPenaltyRunning = false;
    unlockSave();
}

// ウイルス制限時間タイマーのロジック
let virusTimeLeft = 30.0;
let virusTimerInterval = null;
let timerLastTick = 0;

function startVirusTimer() {
    virusTimeLeft = CONSTANTS.VIRUS_TIMER_SECONDS;
    timerLastTick = performance.now();
    updateVirusTimerDisplay();
    
    if (virusTimerInterval) clearInterval(virusTimerInterval);
    virusTimerInterval = setInterval(() => {
        const now = performance.now();
        const delta = (now - timerLastTick) / 1000;
        timerLastTick = now;

        // 一時停止中（会話中など）は時間を減らさない
        if (isDialogueRunning || (isBlockAllInteraction && !gameState.isHackingSequenceRunning)) {
            return;
        }

        virusTimeLeft = Math.max(0, virusTimeLeft - delta);
        
        if (virusTimeLeft <= 0) {
            virusTimeLeft = 0;
            clearInterval(virusTimerInterval);
            virusTimerInterval = null;
            onVirusTimeUp();
        }
        updateVirusTimerDisplay();
    }, 50); // 精度はdeltaで保つため、更新頻度は50ms程度で十分
}

function updateVirusTimerDisplay() {
    const el = document.getElementById('virus-timer');
    if (el) el.textContent = virusTimeLeft.toFixed(2);
}

async function onVirusTimeUp() {
    if (!gameState.isHackingSequenceRunning) return;
    lockSave();
    
    // 即座にすべての演出と音を停止
    gameState.isHackingSequenceRunning = false;
    clearHackingVisuals();
    AmbientManager.stop();
    
    isBlockAllInteraction = true; 
    isDialogueRunning = false;
    
    const roomView = document.getElementById('room-view');
    if (roomView && roomView.style.display === 'flex') {
        isRoomExplorable = false;
        document.getElementById('room-choices').style.display = 'none';
        
        const dlg = document.getElementById('room-dialogue');
        dlg.textContent = "「...はっ！ 戻らなきゃ！！」";
        SoundManager.glitch(0.5, 2.0);
        document.body.style.animation = 'glitch-anim 0.1s infinite';
        
        await sleep(1500);
        
        document.getElementById('room-view').style.display = 'none';
        document.getElementById('desktop').style.display = 'block';
        document.body.style.animation = '';
    }
    
    document.getElementById('virus-timer').style.display = 'none';
    document.getElementById('btn-return-reality').style.display = 'none';

    SoundManager.glitch(1.0, 3.0);
    document.body.style.filter = 'invert(1) contrast(2)';
    await sleep(1000);
    unlockSave();
    triggerEnding('hacked');
}

// メモ帳でのハッカー退治（エキソシズム）演出
window.triggerNotepadExorcism = async () => {
    if (!gameState.isHackingSequenceRunning || isBlockAllInteraction) return;
    lockSave();
    
    isBlockAllInteraction = true;
    SoundManager.glitch(0.5, 1.0);
    
    gameState.isHackingSequenceRunning = false;
    document.getElementById('virus-timer').style.display = 'none';
    document.getElementById('btn-return-reality').style.display = 'none';
    if (virusTimerInterval) { clearInterval(virusTimerInterval); virusTimerInterval = null; }

    const noteWin = openedApps['notepad'];
    if (noteWin) {
        const display = noteWin.querySelector('.notepad-display');
        display.innerHTML += "\n<span style='color:#0f0; font-weight:bold;'>[SYSTEM] EXORCISM_PROTOCOL_EXECUTED...</span>\n";
        await sleep(1000);
        
        document.body.classList.add('virus-invert');
        SoundManager.beep(200, 0.5, 'sawtooth', 0.1);
        await sleep(500);
        document.body.classList.remove('virus-invert');
        
        await typeInNotepad(noteWin, "Hacker: ！？　な、何をした...！？\n");
        await sleep(1000);
        await typeInNotepad(noteWin, "Hacker: 僕との接続を...強制的に切断するつもりか...！？\n");
        await sleep(1500);
        await typeInNotepad(noteWin, "Hacker: ...くっ、今日はここまでにしておいてあげるよ。\n");
        await sleep(1000);
        await typeInNotepad(noteWin, "Hacker: でも、これで終わりだと思わないことだね...。\n");
        await sleep(2000);
    }

    unlockSave();
    await transitionToDay2Room();
};

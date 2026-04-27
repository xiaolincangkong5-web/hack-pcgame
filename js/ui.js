// ---------------------------------------------------------
// 基本ユーティリティ
// ---------------------------------------------------------
// ロード中断フラグ（ロード時に true にセットすると sleep が即座に解決する）
let _loadAbortFlag = false;
// ★ ESCメニューやセーブ/ロード画面が開いている間はクリックを無視するフラグ
let _isMenuOpen = false;
// ★ waitClick() を強制解決するためのフラグ
let _clickAbortFlag = false;
function sleep(ms) {
    return new Promise(resolve => {
        if (_loadAbortFlag) {
            _loadAbortFlag = false;
            resolve();
            return;
        }
        const timer = setTimeout(() => { resolve(); }, ms);
        const checkInterval = setInterval(() => {
            if (_loadAbortFlag) {
                clearTimeout(timer);
                clearInterval(checkInterval);
                _loadAbortFlag = false;
                resolve();
            }
        }, 50);
    });
}

async function typeInNotepad(win, text, delay = null) {
    if (!win || penaltyDone) return;
    const d = delay !== null ? delay : gameState.textDelay;
    const display = win.querySelector('.notepad-display');
    const container = win.querySelector('.notepad-container');
    if (!display || !container) return;
    
    const originalEditable = display.contentEditable;
    display.contentEditable = 'false'; // タイピング中は強制ロック
    
    for (let i = 0; i < text.length; i++) {
        if (penaltyDone || !openedApps[win.id.replace('win-', '')]) return; // ウィンドウが閉じられたか中断されたら停止
        
        // 会話や選択肢が表示されている間は一時停止（ただし、自身のタイピング中は除外したいが、isDialogueRunningは主に他者の会話用）
        // 現実モードでの選択肢などを考慮
        while (isDialogueRunning && !win.id.includes('notepad')) { await sleep(100); } 

        const char = text[i];
        if (char === '\n') display.innerHTML += '<br>';
        else display.innerHTML += char;
        
        container.scrollTop = container.scrollHeight;
        
        if (i % 3 === 0) SoundManager.beep(600 + Math.random()*200, 0.05, 'square', 0.01);
        await sleep(d);
    }
    
    // 演出中でなければ（またはタイマー稼働中なら）編集を許可
    if (gameState.isHackingSequenceRunning) {
        display.contentEditable = 'true';
    } else if (scenarioStarted && scenarioPhase === 1) {
        display.contentEditable = 'false';
    } else {
        display.contentEditable = originalEditable;
    }
}

async function typeDialogue(elId, text, speed = null) {
    const el = document.getElementById(elId);
    if (!el) return;
    const s = speed !== null ? speed : (gameState.textDelay * 0.8); 
    el.textContent = "";
    for (let i = 0; i < text.length; i++) {
        if (penaltyDone) return; // 中断されたら停止
        el.textContent += text[i];
        if (i % 2 === 0) SoundManager.beep(800, 0.05, 'sine', 0.05);
        await sleep(s);
    }
}

async function waitClick() {
    return new Promise(resolve => {
        // ★ アボートフラグが立っていたら即座に解決（ESCメニューを閉じた後の復帰用）
        if (_clickAbortFlag) {
            _clickAbortFlag = false;
            resolve();
            return;
        }
        const listener = (e) => {
            // ★ ESCメニューやセーブ/ロード画面が開いている間はクリックを無視
            if (_isMenuOpen) return;
            document.removeEventListener('mousedown', listener);
            resolve();
        };
        document.addEventListener('mousedown', listener);
    });
}

async function showDialogue(elId, text) {
    const el = document.getElementById(elId);
    if (!el) return;
    await typeDialogue(elId, text);
    el.innerHTML += '<span class="blink"> ▼</span>';
    await waitClick();
}

async function showRoomDialogue(text) { await showDialogue('room-dialogue', text); }

// ドットが動く待機画面を表示する
async function showAnimatedBlackout(baseText, durationMs) {
    const blackout = document.getElementById('blackout');
    if (!blackout) return;
    blackout.style.display = 'flex';
    blackout.style.zIndex = '100000'; // 最前面（他の全ウィンドウより上）
    
    const startTime = Date.now();
    const dots = ["", ".", "..", "..."];
    let i = 0;
    
    while (Date.now() - startTime < durationMs) {
        blackout.innerHTML = `<div class="blackout-text">${baseText}${dots[i % 4]}</div>`;
        i++;
        await sleep(500);
    }
    
    blackout.style.display = 'none';
}

async function showDesktopDialogue(text) { 
    const container = document.getElementById('desktop-dialogue-container');
    const display = document.getElementById('desktop-dialogue');
    if (!container || !display) return;
    display.innerHTML = "";
    container.style.display = 'flex';
    await typeDialogue('desktop-dialogue', text);
    display.innerHTML += '<span class="blink"> ▼</span>';
    await waitClick();
    container.style.display = 'none';
}

async function showChoices(win, choices) {
    const wasDialogueRunning = isDialogueRunning;
    isDialogueRunning = true; // 選択中はタイマー停止
    const container = win.querySelector('.choices-container');
    container.innerHTML = ''; container.style.display = 'flex';
    
    const notepadContainer = win.querySelector('.notepad-container');
    if (notepadContainer) notepadContainer.scrollTop = notepadContainer.scrollHeight;

    return new Promise(resolve => {
        choices.forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn'; btn.textContent = c.text;
            btn.onclick = (e) => {
                e.stopPropagation(); SoundManager.beep(800, 0.1);
                container.style.display = 'none'; 
                isDialogueRunning = wasDialogueRunning;
                resolve(c.value);
            };
            container.appendChild(btn);
        });
    });
}

async function showRoomChoices(choices) {
    const wasDialogueRunning = isDialogueRunning;
    isDialogueRunning = true; // 選択中はタイマー停止
    return new Promise(resolve => {
        const container = document.getElementById('room-choices');
        container.innerHTML = ''; container.style.display = 'flex';
        choices.forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'room-choice-btn'; btn.textContent = c.text;
            btn.onclick = (e) => {
                e.stopPropagation(); SoundManager.beep(800, 0.1);
                container.style.display = 'none'; 
                isDialogueRunning = wasDialogueRunning;
                resolve(c.val);
            };
            container.appendChild(btn);
        });
    });
}

// パスワード入力ダイアログ
function showPasswordDialog() {
    if (gameState.passwordSolved) {
        handleFileDesc("もうロックは解除されている。");
        return;
    }
    const overlay = document.createElement('div');
    overlay.className = 'password-overlay';
    overlay.id = 'password-overlay';
    overlay.innerHTML = `
        <div class="password-box glass-panel">
            <div class="password-title">🔒 パスワードを入力</div>
            <div class="password-subtitle">このフォルダはロックされています</div>
            <input type="password" class="password-input" id="password-field" maxlength="8" placeholder="****" autofocus>
            <div class="password-error" id="password-error" style="display:none;"></div>
            <div class="password-buttons">
                <button id="btn-password-submit">解除</button>
                <button id="btn-password-cancel">キャンセル</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    
    // アニメーション用に少し遅らせてフォーカス
    setTimeout(() => document.getElementById('password-field')?.focus(), 100);

    const submit = overlay.querySelector('#btn-password-submit');
    const cancel = overlay.querySelector('#btn-password-cancel');
    const input = overlay.querySelector('#password-field');
    const errEl = overlay.querySelector('#password-error');

    const closeDialog = () => overlay.remove();

    const checkPassword = async () => {
        const val = input.value.trim();
        if (val === CONSTANTS.PASSWORD) {
            closeDialog();
            gameState.passwordSolved = true;

            // 日記（ヒント）を読んでいないのに正解した場合の特殊演出
            if (!gameState.hintRead) {
                SoundManager.glitch(1.5, 3.0);
                document.body.style.filter = 'contrast(2) brightness(0.5) invert(1)';
                await sleep(1500);
                document.body.style.filter = '';
                
                isDialogueRunning = true;
                await showDesktopDialogue("...え？");
                await showDesktopDialogue("なんで、パスワードを知っているんだ...？");
                isDialogueRunning = false;
                await sleep(1000);
            } else {
                SoundManager.beep(1000, 0.2, 'sine', 0.06);
            }
            
            // ファイルシステム内のロックフォルダをアンロック済みに差し替え
            const d1root = fileSystem['day1_root'];
            const idx = d1root.findIndex(f => f.type === 'lock');
            if (idx !== -1) {
                d1root[idx] = { name: '秘密フォルダ', type: 'folder', target: 'secret_unlocked' };
            }
            
            // ファイルウィンドウが開いている場合は表示を更新（中身には勝手に飛ばない）
            const filesWin = openedApps['files'];
            if (filesWin) {
                window.updateFiles('win-files', 'day1_root', true);
            }
            
            isDialogueRunning = true;
            await showDesktopDialogue("ロックが解除された！");
            isDialogueRunning = false;
            gameState.day1SleepReady = true;
        } else {
            SoundManager.beep(200, 0.3, 'square', 0.04);
            if (errEl) { errEl.textContent = "パスワードが違います"; errEl.style.display = 'block'; }
            input.value = '';
        }
    };

    submit.onclick = checkPassword;
    cancel.onclick = closeDialog;
    input.onkeydown = (e) => { if (e.key === 'Enter') checkPassword(); };
}

// ---------------------------------------------------------
// ウィンドウ・システム
// ---------------------------------------------------------
function openWindow(id, title, isDraggable = true, canClose = true) {
    if (openedApps[id]) { 
        const win = openedApps[id];
        win.dataset.canClose = canClose; // フラグを更新
        bringToFront(win); 
        return win; 
    }
    const template = document.getElementById('window-template');
    if (!template) return null;
    const win = template.content.cloneNode(true).querySelector('.window');
    win.id = 'win-' + id;
    win.querySelector('.window-title').textContent = title;
    win.dataset.canClose = canClose; // フラグをセット
    
    const contentArea = win.querySelector('.window-content');
    if (id === 'notepad' || id === 'secret-note') {
        const isEditable = !scenarioStarted;
        contentArea.innerHTML = `<div class="notepad-container" style="display:flex; flex-direction:column; height:100%; width:100%; box-sizing:border-box; background:transparent; color:#ffffff; padding:15px; font-family:'Consolas', 'Monaco', monospace; font-size:16px; overflow-y:auto; scroll-behavior:smooth; line-height:1.4;"><div class="notepad-display" style="white-space:pre-wrap; outline:none; color:#ffffff; margin-bottom:15px;" contenteditable="${isEditable}"></div><div class="choices-container" style="display:none;"></div></div>`;
        if (id === 'notepad') {
            const display = win.querySelector('.notepad-display');
            // プレイヤーが勝手に編集するのを防ぐガード
            display.addEventListener('focus', () => {
                if (isDialogueRunning || (scenarioStarted && scenarioPhase === 1 && !gameState.isHackingSequenceRunning)) {
                    display.blur();
                }
            });
            display.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const text = display.innerText.toLowerCase().trim();
                    const commands = ['退治', '消去', 'kill -9 hacker', 'killall hacker'];
                    if (gameState.isHackingSequenceRunning && commands.some(cmd => text.includes(cmd))) {
                        e.preventDefault();
                        if (typeof window.triggerNotepadExorcism === 'function') {
                            window.triggerNotepadExorcism();
                        }
                    }
                }
            });
        }
    } else if (id === 'files') {
        const dirId = (gameState.day === 1) ? 'day1_root' : 'root';
        renderFiles(win, dirId);
    } else if (id === 'twoich') renderTwoich(win);
    else if (id === 'browser') renderBrowser(win);
    
    document.getElementById('window-manager').appendChild(win);
    openedApps[id] = win;
    const offset = Object.keys(openedApps).length * 30;
    win.style.left = (100 + offset) + 'px'; win.style.top = (100 + offset) + 'px';
    win.style.zIndex = zIndex++;
    requestAnimationFrame(() => win.classList.add('opening'));
    
    setupWindowInteractions(win, id, isDraggable, canClose);
    return win;
}

function closeWindow(id) {
    if (id === 'twoich' && isDialogueRunning) return;
    
    const win = openedApps[id];
    if (win) {
        // 既に閉じかけのウィンドウは二重処理しない
        if (win.classList.contains('closing')) return;
        win.classList.add('closing');
        const isVirus = (id.includes('virus') || id.includes('error'));
        setTimeout(() => {
            if (win.parentNode) win.remove();
            delete openedApps[id];
            
            // ウイルス/エラー窓の場合、ハッキング中なら即座に別の場所に復活させる
            if (isVirus && gameState.isHackingSequenceRunning) {
                const newId = 'virus_' + Math.random().toString(36).substr(2, 5);
                const newWin = openWindow('virus', `SYSTEM_FAILURE_${Math.floor(Math.random()*100)}`, false, true);
                if (newWin) {
                    newWin.style.left = Math.random() * (window.innerWidth - 300) + 'px';
                    newWin.style.top = Math.random() * (window.innerHeight - 200) + 'px';
                }
            }
        }, 300);
        SoundManager.beep(200, 0.2, 'square', 0.01);
    }
}

function bringToFront(win) { win.style.zIndex = zIndex++; }

function setupWindowInteractions(win, id, isDraggable = true, canClose = true) {
    win.dataset.canClose = canClose;
    const header = win.querySelector('.window-header');
    const closeBtn = win.querySelector('.mac-close');
    
    if (!canClose) {
        closeBtn.style.display = 'none';
    }
    
    closeBtn.addEventListener('mousedown', async (e) => {
        e.stopPropagation(); 
        const currentCanClose = win.dataset.canClose === 'true';
        const isNotepad = (id === 'notepad');
        
        // 基本的にいつでも反応を返すようにし、その後の判定で挙動を分ける
        SoundManager.init();
        
        // 1. 会話中のビープ音判定（メモ帳・ブラウザ・ファイルのみ）
        // ただし抵抗演出を発生させるため、Day 2/Day 3 の特定アプリは除外する
        if (isDialogueRunning && (id === 'notepad' || id === 'files' || id === 'browser')) {
            const isDay2Resistance = (gameState.day === 2 && (id === 'notepad' || id === 'files'));
            const isDay3Resistance = (gameState.day === 3 && id === 'notepad');
            
            if (!isDay2Resistance && !isDay3Resistance) {
                SoundManager.beep(400, 0.1); 
                return;
            }
        }

        // 2. 閉じられない設定の確認（シークレットノートなど）
        if (!currentCanClose && !isNotepad) {
            SoundManager.beep(400, 0.1); 
            return;
        }

        // 3. Day 3 の特殊イベント判定（メモ帳）
        if (id === 'notepad' && gameState.day === 3) {
            closeWindow(id);
            triggerDay3NotepadPenalty(win); 
            return;
        }

        // 4. ブラウザなどの汎用クローズ制限
        if (gameState.day === 3 && id === 'browser' && isDialogueRunning) {
            SoundManager.beep(400, 0.1); return; 
        }

        // 5. Twoichの特定クローズイベント
        if (id === 'twoich') {
            closeWindow(id);
            setTimeout(async () => {
                isDialogueRunning = true;
                await showDesktopDialogue("今の見なかったことにしよう...");
                if (gameState.day === 2) {
                    await showDesktopDialogue("...いや、どう考えてもヤバい。もうどうすればいいか分からない。");
                    isDialogueRunning = false;
                    document.getElementById('desktop').style.display = 'none';
                    document.getElementById('room-view').style.display = 'flex';
                    isRoomExplorable = false;
                    await showRoomDialogue("パニックになり、一旦デスクトップから離れた。");
                    await showRoomDialogue("もう疲れた...少し休もう。起きたら全部夢だったってことにならないかな。");
                    isRoomExplorable = true;
                    document.getElementById('room-dialogue').innerHTML = "（ベッドをクリックして寝よう）";
                } else {
                    isDialogueRunning = false;
                }
            }, 100);
            return;
        }

        // 6. Day 2 のアプリクローズ（ペナルティ中断イベント）
        if (scenarioStarted && scenarioPhase === 1 && (id === 'notepad' || id === 'files')) { 
            // 会話中であっても強制的に閉じ、ペナルティ演出を開始する
            closeWindow(id);
            abortScenario(); 
            return; 
        }
        closeWindow(id);
    });
    win.addEventListener('mousedown', () => { 
        SoundManager.init();
        if(!isBlockAllInteraction) bringToFront(win); 
    });
    
    if (isDraggable) {
        let isDragging = false, offsetX = 0, offsetY = 0;
        header.addEventListener('mousedown', (e) => {
            if (isBlockAllInteraction || e.target.closest('.control-btn')) return;
            isDragging = true; bringToFront(win);
            
            // transform (-50%, -50%) などが設定されている場合のズレを補正
            const rect = win.getBoundingClientRect();
            if (win.style.transform && win.style.transform !== 'none') {
                win.style.transition = 'none'; // アニメーションを一時停止
                win.style.transform = 'none';
                win.style.left = rect.left + 'px';
                win.style.top = rect.top + 'px';
            }
            
            offsetX = e.clientX - rect.left; offsetY = e.clientY - rect.top;
            document.body.style.userSelect = 'none'; header.style.cursor = 'grabbing';
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging || isBlockAllInteraction) return;
            let newX = e.clientX - offsetX, newY = e.clientY - offsetY; newY = Math.max(0, newY);
            win.style.left = `${newX}px`; win.style.top = `${newY}px`;
        });
        document.addEventListener('mouseup', () => { isDragging = false; document.body.style.userSelect = ''; header.style.cursor = ''; });
    } else {
        header.style.cursor = 'default';
    }
}

// ---------------------------------------------------------
// ネットワーク状態表示
// ---------------------------------------------------------
function setNetworkStatus(isOnline) {
    const el = document.getElementById('network-status');
    if (!el) return;
    el.innerHTML = ''; 
    el.className = 'network-status-container';
    
    if (isOnline) {
        const real = document.createElement('div');
        real.className = 'network-status online';
        real.innerHTML = '<span class="status-dot"></span> <span class="status-text">オンライン</span>';
        el.appendChild(real);
        el.onmousedown = null;
    } else {
        const real = document.createElement('div');
        real.id = 'real-network';
        real.className = 'network-status online';
        real.style.zIndex = '1';
        real.innerHTML = '<span class="status-dot"></span> <span class="status-text">オンライン</span>';
        real.style.display = 'none'; 
        
        const fake = document.createElement('div');
        fake.id = 'fake-network';
        fake.className = 'network-status offline';
        fake.style.zIndex = '2';
        fake.innerHTML = '<span class="status-dot"></span> <span class="status-text">オフライン</span>';
        
        el.appendChild(real);
        el.appendChild(fake);
        setupDraggableNetwork(fake);
    }
}

function setupDraggableNetwork(fake) {
    let isDragging = false, startX, startY, origX, origY;
    fake.onmousedown = (e) => {
        if (isBlockAllInteraction || isDialogueRunning) return;
        SoundManager.init();
        e.stopPropagation();
        
        if (!isTwoichDiscovered) {
            handleFileDesc("ちゃんとWifiは切れているようだ。");
            return;
        }
        
        const real = document.getElementById('real-network');
        real.style.display = 'flex';
        real.onclick = async () => {
            if (isDialogueRunning) return;
            isDialogueRunning = true;
            await showDesktopDialogue("...嘘だろ。いつから繋がってたんだ？");
            await showDesktopDialogue("ずっと見られてたのか...？画面の向こう側の奴らに...。");
            isDialogueRunning = false;
        };
        
        isDragging = true;
        startX = e.clientX; startY = e.clientY;
        const rect = fake.getBoundingClientRect();
        origX = rect.left; origY = rect.top;
        fake.style.position = 'fixed';
        fake.style.zIndex = '1501';
        fake.style.opacity = '0.8';
        document.body.style.userSelect = 'none';
    };
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        fake.style.left = (e.clientX - (startX - origX)) + 'px';
        fake.style.top = (e.clientY - (startY - origY)) + 'px';
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            document.body.style.userSelect = '';
            fake.style.display = 'none';
            fake.remove();
            SoundManager.beep(600, 0.1, 'sine', 0.05);
        }
    });
}

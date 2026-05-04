/**
 * hallway.js
 * マンション廊下・エレベーター・隣人END・警察署前UIのロジック
 */

// 廊下の状態管理
let isHallwayExplorable = false;
let isHallwayDialogueRunning = false;
let canReturnToRoom = false; // 隣人END後、自分の部屋に戻れるフラグ
let neighborEndingTriggered = false; // 隣人ENDが既に発生したか

// 警察署前UIの状態
let isPoliceStationFrontActive = false;
let isPoliceStationDialogueRunning = false;
let psfBgmAudio = null; // 警察署前UIのBGM

// 廊下の台詞表示（部屋のUIと同じタイプ音＋クリック待機）
async function showHallwayDialogue(text) {
    const el = document.getElementById('hallway-dialogue');
    if (!el) return;
    el.innerHTML = '';
    isHallwayDialogueRunning = true;
    const speed = gameState.textDelay * 0.8;
    for (let i = 0; i < text.length; i++) {
        el.innerHTML += text[i];
        if (i % 2 === 0) SoundManager.beep(800, 0.05, 'sine', 0.05);
        await sleep(speed);
    }
    // クリック待機インジケーター
    el.innerHTML += '<span class="blink"> ▼</span>';
    await new Promise(resolve => {
        const listener = () => {
            document.removeEventListener('mousedown', listener);
            isHallwayDialogueRunning = false;
            resolve();
        };
        document.addEventListener('mousedown', listener);
    });
}

// 廊下の選択肢表示
async function showHallwayChoices(choices) {
    const container = document.getElementById('hallway-choices');
    if (!container) return null;
    container.style.display = 'flex';
    container.innerHTML = '';
    return new Promise(resolve => {
        choices.forEach(c => {
            const btn = document.createElement('button');
            btn.textContent = c.text;
            btn.onclick = () => {
                container.style.display = 'none';
                container.innerHTML = '';
                isHallwayDialogueRunning = false;
                resolve(c.val);
            };
            container.appendChild(btn);
        });
    });
}

// 廊下シーケンス開始
async function startHallwaySequence() {
    lockSave();
    isBlockAllInteraction = true;
    gameState.isFinalChoicePhase = false;
    
    // 部屋ビューを非表示、廊下ビューを表示
    document.getElementById('room-view').style.display = 'none';
    document.getElementById('hallway-view').style.display = 'flex';
    
    // 部屋のマーキング
    document.getElementById('obj-hallway-605').classList.add('is-player'); // 主人公
    document.getElementById('obj-hallway-602').classList.add('is-neighbor'); // 隣人
    
    isHallwayExplorable = true;
    isBlockAllInteraction = false;
    document.getElementById('hallway-dialogue').innerHTML = "（廊下に出た。どこかへ向かおう。）";
    unlockSave();
}

// 廊下オブジェクトのインタラクション
window.interactHallway = async (objId) => {
    if (!isHallwayExplorable || isBlockAllInteraction || isHallwayDialogueRunning) return;
    isHallwayExplorable = false;
    isHallwayDialogueRunning = true;
    await sleep(100);
    
    if (objId === 'elevator') {
        // エレベーターへ
        await showHallwayDialogue("エレベーターだ。これで下の階に行ける。");
        isHallwayDialogueRunning = false;
        await startElevatorSequence();
        return;
    }
    
    const roomNum = parseInt(objId);
    
    if (roomNum === 605) {
        // 自分の部屋
        if (canReturnToRoom) {
            // 隣人END後：部屋に戻る（特殊演出）
            await showHallwayDialogue("自分の部屋だ。玄関に見慣れない靴がある...。");
            await showHallwayDialogue("この部屋の中に誰かいるのか...？");
            isHallwayDialogueRunning = false;
            await triggerRoomInvasionSequence();
            return;
        } else {
            await showHallwayDialogue("自分の部屋だ。今は戻っても仕方ない。");
        }
    } else if (roomNum === 602) {
        // 向かいの部屋（602は上段中央、605は下段中央＝斜め向かい）
        if (neighborEndingTriggered) {
            await showHallwayDialogue("向かいの部屋だ。さっきの音が忘れられない...。");
        } else {
            await showHallwayDialogue("向かいの部屋だ。ここに住んでいる人に助けを求めてみようか...？");
            const c = await showHallwayChoices([
                {text: "助けを求める", val: "ask"},
                {text: "やめておく", val: "leave"}
            ]);
            if (c === 'ask') {
                isHallwayDialogueRunning = false;
                await triggerNeighborEnding();
                return;
            }
        }
    } else {
        // その他の部屋
        await showHallwayDialogue("部屋番号" + roomNum + "だ。");
        await showHallwayDialogue("知らない人の部屋に助けを求めるのは気が引ける...。");
        const c = await showHallwayChoices([
            {text: "助けを求める", val: "ask"},
            {text: "やめておく", val: "leave"}
        ]);
        if (c === 'ask') {
            await showHallwayDialogue("...やめておこう。");
        }
    }
    
    isHallwayDialogueRunning = false;
    isHallwayExplorable = true;
    document.getElementById('hallway-dialogue').innerHTML = "（廊下に立っている。どこかへ向かおう。）";
};

// エレベーターシーケンス
async function startElevatorSequence() {
    lockSave();
    isBlockAllInteraction = true;
    
    // 暗転を入れてからエレベーターへ
    const blackout = document.getElementById('blackout');
    blackout.style.display = 'flex';
    blackout.style.zIndex = '100000';
    blackout.style.background = '#000';
    blackout.innerHTML = '<div class="blackout-text" style="font-size:2rem;">（エレベーターに乗った...）</div>';
    await sleep(2000);
    blackout.style.display = 'none';
    
    document.getElementById('hallway-view').style.display = 'none';
    document.getElementById('elevator-view').style.display = 'flex';
    
    const dialogueEl = document.getElementById('elevator-dialogue');
    const monitorEl = document.getElementById('elevator-monitor');
    
    dialogueEl.innerHTML = "エレベーターに乗った。<br>最寄りの警察署にいこう！<br>もうそれしか選択肢はない。<br>電話じゃダメだ。直接行くしかない。";
    
    // 現在階を6Fに設定
    monitorEl.textContent = '6F';
    document.querySelectorAll('.elevator-floor-btn').forEach(btn => {
        btn.classList.remove('current-floor');
        if (btn.textContent.trim() === '6F') btn.classList.add('current-floor');
    });
    
    await sleep(2000);
    isBlockAllInteraction = false;
    unlockSave();
}

// 階数ボタン処理
window.pressElevatorFloor = async (floor) => {
    if (isBlockAllInteraction) return;
    isBlockAllInteraction = true;
    
    // スイッチを押す音
    SoundManager.playCustomSE('assets/se/スイッチを押す.mp3');
    
    const dialogueEl = document.getElementById('elevator-dialogue');
    const monitorEl = document.getElementById('elevator-monitor');
    
    // 現在の階を取得
    const currentFloorText = monitorEl.textContent;
    const currentFloor = parseInt(currentFloorText);
    
    if (floor === currentFloor) {
        dialogueEl.innerHTML = "すでにこの階にいる。";
        isBlockAllInteraction = false;
        return;
    }
    
    if (floor === 6) {
        dialogueEl.innerHTML = "6階には戻りたくない...。";
        isBlockAllInteraction = false;
        return;
    }
    
    // 2〜5階は後日対応
    if (floor >= 2 && floor <= 5) {
        dialogueEl.innerHTML = "この階で降りるのは...やめておこう。<br>まだ用事はない。";
        isBlockAllInteraction = false;
        return;
    }
    
    // 1階 → 警察署前UIへ
    if (floor === 1) {
        dialogueEl.innerHTML = "1階のボタンを押した...。";
        await sleep(1000);
        
        // ポチッという効果音
        SoundManager.beep(800, 0.1, 'sine', 0.05);
        
        // モニター更新アニメーション
        for (let f = currentFloor; f > 1; f--) {
            monitorEl.textContent = f + 'F → ' + (f-1) + 'F';
            await sleep(500);
        }
        monitorEl.textContent = '1F';
        
        await sleep(1000);
        dialogueEl.innerHTML = "1階に着いた。<br>警察署へ向かおう。";
        await sleep(1500);
        
        // エレベーターを閉じて警察署前UIへ
        document.getElementById('elevator-view').style.display = 'none';
        document.getElementById('hallway-view').style.display = 'none';
        
        // 暗転
        const blackout = document.getElementById('blackout');
        blackout.style.display = 'flex';
        blackout.style.zIndex = '100000';
        blackout.style.background = '#000';
        blackout.innerHTML = '<div class="blackout-text" style="font-size:2rem;">（警察署へ向かおう...）</div>';
        await sleep(2500);
        blackout.style.display = 'none';
        
        isBlockAllInteraction = false;
        await startPoliceStationFrontSequence();
        return;
    }
    
    isBlockAllInteraction = false;
};

// 隣人END
async function triggerNeighborEnding() {
    if (neighborEndingTriggered) return;
    lockSave();
    neighborEndingTriggered = true;
    isBlockAllInteraction = true;
    
    await showHallwayDialogue("（勇気を振り絞って、向かいの部屋のドアをノックした。）");
    
    // ドアを叩く音
    try {
        const knockSound = document.getElementById('se-knock') || (() => {
            const a = new Audio('assets/se/ドアをドンドン叩く.mp3');
            a.id = 'se-knock';
            a.volume = 0.3;
            document.body.appendChild(a);
            return a;
        })();
        knockSound.currentTime = 0;
        knockSound.play().catch(() => {});
    } catch(e) {}
    
    await showHallwayDialogue("「あっ、あの！」");
    await showHallwayDialogue("「ハッカーにPCを乗っ取られてて！」");
    await showHallwayDialogue("「助けてくれませんか！」");
    
    // 自分の部屋の方から盾で防御の音（改変）
    try {
        const shieldSound = document.getElementById('se-shield') || (() => {
            const a = new Audio('assets/se/盾で防御.mp3');
            a.id = 'se-shield';
            a.volume = 0.4;
            a.playbackRate = 0.7; // 低く遅く＝鈍器のような音に
            document.body.appendChild(a);
            return a;
        })();
        shieldSound.currentTime = 0;
        shieldSound.playbackRate = 0.7;
        shieldSound.play().catch(() => {});
    } catch(e) {}
    
    // 効果音後のドラマチックな間
    await sleep(1500);
    await showHallwayDialogue("（自分の部屋の方から、鈍い音が聞こえた...！）");
    await showHallwayDialogue("「！？」");
    await showHallwayDialogue("「なんだ、今の音...？」");
    
    // 探索フェーズに戻る（自分の部屋に戻れるフラグON）
    canReturnToRoom = true;
    isHallwayExplorable = true;
    isBlockAllInteraction = false;
    document.getElementById('hallway-dialogue').innerHTML = "（気になる...でも、今はどうするか考えないと。）";
    unlockSave();
}

// 部屋侵入シーケンス（隣人END後、自分の部屋に戻る）
async function triggerRoomInvasionSequence() {
    lockSave();
    isBlockAllInteraction = true;
    
    // 暗転を入れてから部屋に戻る
    const blackout = document.getElementById('blackout');
    blackout.style.display = 'flex';
    blackout.style.zIndex = '100000';
    blackout.style.background = '#000';
    blackout.innerHTML = '<div class="blackout-text" style="font-size:2rem;">（部屋に戻ろう...）</div>';
    await sleep(2000);
    blackout.style.display = 'none';
    
    // 廊下を非表示、部屋ビューを表示
    document.getElementById('hallway-view').style.display = 'none';
    document.getElementById('room-view').style.display = 'flex';
    
    // 部屋の状態をリセット
    isRoomExplorable = false;
    isDialogueRunning = true;
    
    // 先にフラグを設定
    gameState.isRoomInvaded = true;
    
    // typeDialogueでテキスト表示（クリック待機なし＝家具のonclickと競合しない）
    await typeDialogue('room-dialogue', "玄関に見慣れない靴がある。");
    await sleep(1500);
    await typeDialogue('room-dialogue', "この部屋の中に誰かいるのか...？");
    await sleep(1500);
    
    isBlockAllInteraction = false;
    isDialogueRunning = false;
    isRoomExplorable = true;
    document.getElementById('room-dialogue').innerHTML = "（何かがおかしい...どうする？）";
    unlockSave();
}

// 電話シーケンス
async function triggerPhoneCallSequence() {
    lockSave();
    isBlockAllInteraction = true;
    isRoomExplorable = false;
    isDialogueRunning = true;
    
    await showRoomDialogue("（スマートフォンを取り出して、110番に電話した。）");
    await showRoomDialogue("「もしもし、そちら警察ですか？」");
    await showRoomDialogue("警察：「はい、110番です。どのようなご用件でしょうか？」");
    await showRoomDialogue("「部屋に見慣れない靴があって、誰かが部屋に侵入しているみたいなんです。」");
    await showRoomDialogue("警察：「わかりました。すぐに確認に向かいます。あなたは安全な場所に避難してください。」");
    await showRoomDialogue("「はい！今すぐに助けにk...」");
    SoundManager.playCustomSE('assets/se/盾で防御.mp3', 0.8);
    
    // 白フラッシュ＋画面揺れ
    const roomView = document.getElementById('room-view');
    roomView.style.background = '#fff';
    roomView.style.transition = 'none';
    await sleep(100);
    roomView.style.background = '';
    roomView.classList.add('shake-vertical');
    setTimeout(() => roomView.classList.remove('shake-vertical'), 500);
    
    // フラッシュ後のドラマチックな間
    await sleep(800);
    await showRoomDialogue("警察：「もしもし？大丈夫ですか？」");
    
    // 犯人の登場
    await showRoomDialogue("「...」");
    await showRoomDialogue("犯人：「君が警察に電話するのがいけないんだよ。」");
    await showRoomDialogue("犯人：「警察に通報さえしなければ、穏便にことを済ませれたのに。」");
    await showRoomDialogue("犯人：「...さようなら。」");
    
    // 殺害音（盾で防御.mp3 を改変）
    try {
        const killSound = document.getElementById('se-kill') || (() => {
            const a = new Audio('assets/se/盾で防御.mp3');
            a.id = 'se-kill';
            a.volume = 0.6;
            a.playbackRate = 0.5; // さらに低く鈍器で殴る音に
            document.body.appendChild(a);
            return a;
        })();
        killSound.currentTime = 0;
        killSound.playbackRate = 0.5;
        killSound.play().catch(() => {});
    } catch(e) {}
    
    // 殺害後の間
    await sleep(2000);
    
    // 隣人END画面
    await showEndingScreen('neighbor',
        '隣人END',
        '#ff0000',
        '助けを求めた先にいたのは、\nより深い闇だった。\n\n向かいの住人は、ただの偶然の住人ではなかった。\nハッカーは、もっと近くにいたのだ。\n\n向かいのあの部屋で、\nすべては仕組まれていた。\n\n君の最後の選択は、\n運命の扉を開けてしまった。',
        'ending_neighbor'
    );
    unlockSave();
}

// ============================================================
// 警察署前UI
// ============================================================

// 警察署前UI表示
async function startPoliceStationFrontSequence() {
    lockSave();
    isBlockAllInteraction = true;
    isPoliceStationFrontActive = true;
    
    document.getElementById('police-station-front-view').style.display = 'flex';
    
    // 街の道路BGMをループ再生
    try {
        psfBgmAudio = new Audio('assets/se/街の道路.mp3');
        psfBgmAudio.loop = true;
        psfBgmAudio.volume = 0.3;
        psfBgmAudio.play().catch(() => {});
    } catch(e) {
        console.warn("PSF BGM play failed:", e);
    }
    
    // 初期メッセージ
    const dialogueEl = document.getElementById('psf-dialogue');
    dialogueEl.innerHTML = "（警察署の前に着いた。\nどうする？）";
    
    isBlockAllInteraction = false;
    unlockSave();
}

// 警察署前UIのインタラクション
window.interactPoliceStationFront = async (objId) => {
    if (!isPoliceStationFrontActive || isBlockAllInteraction || isPoliceStationDialogueRunning) return;
    isBlockAllInteraction = true;
    isPoliceStationDialogueRunning = true;
    
    const dialogueEl = document.getElementById('psf-dialogue');
    
    if (objId === 'psf-police') {
        // 警察署を選択 → 警察END演出
        await showPSFDialogue("警察署に入ろう。");
        await sleep(1000);
        isBlockAllInteraction = false;
        isPoliceStationDialogueRunning = false;
        await triggerPoliceEndingSequence();
        return;
        
    } else if (objId === 'psf-apartment1' || objId === 'psf-apartment2') {
        // マンションを選択
        await showPSFDialogue("警察署に行かないと...！");
        await sleep(1500);
        dialogueEl.innerHTML = "（警察署の前に着いた。\nどうする？）";
        
    } else if (objId === 'psf-park') {
        // 公園を選択
        await showPSFDialogue("今は遊んでいる場合ではない。");
        await showPSFDialogue("いや、公園でゲートボールをするか...？");
        
        // 選択肢
        const c = await showPSFChoices([
            {text: "遊ぶ", val: "play"},
            {text: "遊ばない", val: "leave"}
        ]);
        
        if (c === 'play') {
            await triggerGateballSequence();
        } else {
            await showPSFDialogue("...やっぱりやめておこう。");
        }
        
        dialogueEl.innerHTML = "（警察署の前に着いた。\nどうする？）";
    }
    
    isBlockAllInteraction = false;
    isPoliceStationDialogueRunning = false;
};

// 警察署前UIの台詞表示
async function showPSFDialogue(text) {
    const el = document.getElementById('psf-dialogue');
    if (!el) return;
    el.innerHTML = '';
    const speed = gameState.textDelay * 0.8;
    for (let i = 0; i < text.length; i++) {
        el.innerHTML += text[i];
        if (i % 2 === 0) SoundManager.beep(800, 0.05, 'sine', 0.05);
        await sleep(speed);
    }
    el.innerHTML += '<span class="blink"> ▼</span>';
    await new Promise(resolve => {
        const listener = () => {
            document.removeEventListener('mousedown', listener);
            resolve();
        };
        document.addEventListener('mousedown', listener);
    });
}

// 警察署前UIの選択肢（room-choice-btn を使用して統一）
async function showPSFChoices(choices) {
    const container = document.getElementById('psf-choices');
    if (!container) return null;
    container.innerHTML = '';
    container.style.display = 'flex';
    return new Promise(resolve => {
        choices.forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'room-choice-btn';
            btn.textContent = c.text;
            btn.onclick = (e) => {
                e.stopPropagation();
                SoundManager.beep(800, 0.1);
                container.style.display = 'none';
                container.innerHTML = '';
                resolve(c.val);
            };
            container.appendChild(btn);
        });
    });
}

// ゲートボールミニゲーム
async function triggerGateballSequence() {
    lockSave();
    isBlockAllInteraction = true;
    
    // 公園に行くので道路BGMを一時停止
    if (psfBgmAudio) {
        psfBgmAudio.pause();
    }
    
    const blackout = document.getElementById('blackout');
    blackout.style.display = 'flex';
    blackout.style.zIndex = '100000';
    blackout.style.background = '#000';
    blackout.innerHTML = '<div class="blackout-text" style="font-size:2rem;">ゲートボール中...</div>';
    
    // 数秒待機（ゲートボール中）
    await sleep(4000);
    
    blackout.innerHTML = '<div class="blackout-text" style="font-size:2rem;">ふう、疲れた。</div>';
    await sleep(2000);
    blackout.innerHTML = '<div class="blackout-text" style="font-size:2rem;">...警察署に行かないと。</div>';
    await sleep(2000);
    
    blackout.style.display = 'none';
    
    // 警察署前に戻ったのでBGM再開
    if (psfBgmAudio) {
        psfBgmAudio.currentTime = 0;
        psfBgmAudio.play().catch(() => {});
    }
    
    isBlockAllInteraction = false;
    isPoliceStationDialogueRunning = false;
    
    const dialogueEl = document.getElementById('psf-dialogue');
    dialogueEl.innerHTML = "（警察署の前に着いた。\nどうする？）";
    unlockSave();
}

// 警察署ENDシーケンス
async function triggerPoliceEndingSequence() {
    lockSave();
    isBlockAllInteraction = true;
    isPoliceStationFrontActive = false;
    
    // 警察署前UIを非表示
    document.getElementById('police-station-front-view').style.display = 'none';
    
    // 街の道路BGMを停止
    if (psfBgmAudio) {
        psfBgmAudio.pause();
        psfBgmAudio.currentTime = 0;
        psfBgmAudio = null;
    }
    
    const blackout = document.getElementById('blackout');
    
    // === フェーズ1: 警察署内の会話（黒背景に中央テキスト） ===
    async function showBlackoutText(text, duration = 3000) {
        blackout.style.display = 'flex';
        blackout.style.zIndex = '100000';
        blackout.style.background = '#000';
        blackout.innerHTML = `<div class="blackout-text" style="font-size:1.1rem; color:rgba(255,255,255,0.75); text-align:center; line-height:1.8;">${text}</div>`;
        await sleep(duration);
    }
    
    await showBlackoutText("（警察署の中へ...）", 2500);
    await showBlackoutText("「すみません！通報したいことがあって！」", 2500);
    await showBlackoutText("警察官：「はい、どうされました？」", 2500);
    await showBlackoutText("「ハッカーにPCを乗っ取られてて...」<br>「それに、部屋に誰かが侵入した形跡があって...」", 3500);
    await showBlackoutText("警察官：「わかりました。詳しく教えてください。」", 2500);
    await showBlackoutText("（事情を説明した。）", 2000);
    await showBlackoutText("警察官：「なるほど。確認しますので、少々お待ちください。」", 3000);
    
    // === 時間経過 ===
    await showBlackoutText("...", 1500);
    await showBlackoutText("（数時間後）", 2500);
    await showBlackoutText("警察官：「あなたの部屋を調査しましたが、<br>　誰もいませんでした。」", 3500);
    await showBlackoutText("警察官：「侵入の痕跡も見つかりませんでした。」", 3000);
    await showBlackoutText("「そんな...確かに靴があったんです！」", 2500);
    await showBlackoutText("警察官：「しかし...」", 2000);
    
    // === フェーズ2: PC押収 → 押収品リスト ===
    await showBlackoutText("警察官：「あなたのPCを、<br>　証拠として押収します。」", 3000);
    await showBlackoutText("「え...？」", 2000);
    
    // 押収品リスト（箇条書きで淡々と表示）
    blackout.style.display = 'flex';
    blackout.style.zIndex = '100000';
    blackout.style.background = '#000';
    blackout.innerHTML = `
        <div style="text-align:center; color:rgba(255,255,255,0.5); font-size:1.1rem; margin-bottom:20px; letter-spacing:4px;">━━━ 押収品リスト ━━━</div>
        <div id="seizure-list" style="text-align:left; display:inline-block; color:rgba(255,255,255,0.75); font-size:1.1rem; line-height:1.8;"></div>
    `;
    
    const seizureItems = [
        { name: "PC本体（デスクトップ）", note: "証拠品番号: 001" },
        { name: "ハッキングツール（推定）", note: "複数の不正アクセス痕跡" },
        { name: "えっちな画像(1).jpg", note: "ダウンロードフォルダ内" },
        { name: "絶対に見ないで.png", note: "デスクトップ" },
        { name: "RJ012345.zip", note: "ダウンロードフォルダ内" },
        { name: "同人誌_新刊.pdf", note: "ダウンロードフォルダ内" },
        { name: "これだけは絶対に見るな.txt", note: "デスクトップ" },
        { name: "内部データ（暗号化済み）", note: "解析不能" },
        { name: "ブラウザ履歴", note: "全記録保存済み" },
        { name: "通信ログ", note: "不正アクセス時の記録" }
    ];
    
    const listEl = document.getElementById('seizure-list');
    for (let item of seizureItems) {
        const lineDiv = document.createElement('div');
        lineDiv.style.opacity = '0';
        lineDiv.style.transition = 'opacity 0.8s ease';
        lineDiv.style.marginBottom = '4px';
        lineDiv.innerHTML = `　<span style="color:#ff5f56;">■</span> ${item.name} <span style="color:rgba(255,255,255,0.4); font-size:0.9rem;">（${item.note}）</span>`;
        listEl.appendChild(lineDiv);
        
        requestAnimationFrame(() => { lineDiv.style.opacity = '1'; });
        await sleep(600);
    }
    
    await sleep(2000);
    
    // === フェーズ3: 逮捕 ===
    await showBlackoutText("警察官：「あなたを、<br>　違法ファイル所持の容疑で逮捕します。」", 3500);
    await showBlackoutText("「違う！それはハッカーが！」", 2500);
    await showBlackoutText("警察官：「署でゆっくり話を聞きましょう。」", 3000);
    await showBlackoutText("（手錠がかけられた。）", 2500);
    await showBlackoutText("（何もかも、ハッカーの思うがままだった。）", 3000);
    
    // === フェーズ4: showEndingScreen で締め ===
    showEndingScreen('police',
        '警察署END',
        '#4488ff',
        '助けを求めた先で、自分の罪が暴かれた。\n\nハッカーの真の目的は、金でも愉快犯でもなく、\n「正義」だったのかもしれない。\n\n...いや、そんなわけがない。\nあいつはただ、人の人生を壊して楽しんでいただけだ。\n\nだが、結果は変わらない。\n僕の人生は、ここで終わった。',
        'ending_police'
    );
    
    isBlockAllInteraction = false;
    unlockSave();
}

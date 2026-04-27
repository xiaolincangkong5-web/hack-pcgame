// ---------------------------------------------------------
// マルチエンディング
// ---------------------------------------------------------

let isEndingRunning = false;

async function triggerEnding(type) {
    if (isEndingRunning) return;
    lockSave();
    isEndingRunning = true;
    
    isBlockAllInteraction = true;
    gameState.isHackingSequenceRunning = false; // ハッキング中なら停止
    gameState.isFinalChoicePhase = false; // 最終局面フラグを終了
    AmbientManager.stop(); // 全ての音を停止
    document.body.style.filter = 'none'; // 演出用の画面反転などを解除
    document.getElementById('btn-return-reality').style.display = 'none';
    Object.keys(openedApps).forEach(id => closeWindow(id));
    
    const blackout = document.getElementById('blackout');
    blackout.style.display = 'flex'; blackout.style.zIndex = '70000';
    blackout.innerHTML = '';
    
    if (type === 'throw') {
        blackout.innerHTML = `<div class="blackout-text">PCをつかんで窓に向かった...</div>`;
        await sleep(3000);
        
        document.getElementById('desktop').style.display = 'none';
        blackout.style.display = 'none';
        document.getElementById('room-view').style.display = 'flex';
        
        isRoomExplorable = false;
        await showRoomDialogue("こんなもの...もう二度と見たくない！");
        await showRoomDialogue("窓を開けて...");
        
        const windowObj = document.getElementById('obj-window');
        if (windowObj) {
            windowObj.style.background = '#ff4444';
            windowObj.style.borderColor = '#ff6666';
            windowObj.style.animation = 'blink-anim 0.5s infinite';
            windowObj.textContent = '🪟 ここから投げろ！';
        }
        
        await showRoomDialogue("（窓をクリックしてPCを投げ捨てろ！）");
        
        await new Promise(resolve => {
            if (windowObj) windowObj.onclick = () => resolve();
        });
        
        SoundManager.thud();
        document.getElementById('room-view').style.display = 'none';
        
        blackout.style.display = 'flex';
        blackout.innerHTML = `<div class="blackout-text" style="font-size:4rem;">ガシャーン！！</div>`;
        SoundManager.glitch(1.0, 3.0);
        await sleep(2000);
        blackout.innerHTML = `<div class="blackout-text">PCは窓の外に消えていった...</div>`;
        await sleep(3000);
        blackout.innerHTML = `<div class="blackout-text">静寂が訪れた。</div>`;
        await sleep(3000);
        
        await showEndingScreen('throw',
            '投棄エンド',
            '#ff6b6b',
            'すべてを捨てた。\nPCも、データも、あの恐怖も。\n\n翌朝、下の階の住人から苦情が来た。\n「窓からパソコン降ってきたんですけど...」\n\nPCは粉々に砕け散った。\nデータは完全に失われた。\nでも、記憶は消えない。\nネットに拡散された情報も...消えない。',
            'ending_throw'
        );
        
    } else if (type === 'runthrough') {
        blackout.innerHTML = `<div class="blackout-text">ハッカーの正体を暴く...</div>`;
        await sleep(2000);
        blackout.innerHTML = `<div class="blackout-text" style="font-size:1.5rem;">IPアドレスを追跡中...</div>`;
        await sleep(2000);
        blackout.innerHTML = `<div class="blackout-text" style="font-size:1.5rem;">逆探知に成功した...！</div>`;
        SoundManager.beep(1200, 0.3, 'sine', 0.06);
        await sleep(2500);
        
        blackout.innerHTML = `<div class="blackout-text" style="font-size:1.2rem;">
            ハッカーの正体は...<br><br>
            <span style="color:#ff6b6b; font-size:2rem;">向かいの部屋の住人だった。</span>
        </div>`;
        await sleep(4000);
        
        blackout.innerHTML = `<div class="blackout-text" style="font-size:1.2rem;">
            同じWi-Fiネットワークに接続していた向かいの住人。<br>
            顔も名前も知らない、壁一枚向こうの人間。<br><br>
            <span style="color:#ffeb3b;">「ずっと見てたよ。毎晩、壁越しにタイピング音が聞こえてさ。」</span><br>
            <span style="color:#ffeb3b;">「何してるのか気になったから、覗いてみただけだよ。」</span>
        </div>`;
        await sleep(6000);
        
        blackout.innerHTML = `<div class="blackout-text" style="font-size:1rem;">
            証拠はすべて保存した。<br>
            サイバー犯罪対策課に通報し、向かいの住人は逮捕された。<br><br>
            しかし...拡散された情報は、もう消せない。
        </div>`;
        await sleep(4000);
        
        await showEndingScreen('runthrough',
            '真実エンド',
            '#34c759',
            'ハッカーの正体を暴き、事件は解決した。\n\nだが、ネットに晒された過去は永遠に残り続ける。\nデジタルタトゥーという言葉の意味を、\n身をもって知ることになった。\n\nそれでも、逃げずに立ち向かった。\nそれだけは、誇っていいはずだ。',
            'ending_runthrough'
        );
        
    } else if (type === 'police') {
        blackout.innerHTML = `<div class="blackout-text">110番に電話した...</div>`;
        await sleep(2000);
        SoundManager.beep(400, 0.5, 'sine', 0.05);
        await sleep(1000);
        
        blackout.innerHTML = `<div class="blackout-text" style="font-size:1.2rem;">
            警察：「はい、110番です。」<br><br>
            「ハッキングされて、個人情報を晒されているんです！」<br><br>
            警察：「わかりました。すぐに向かいます。」
        </div>`;
        await sleep(4000);
        
        blackout.innerHTML = `<div class="blackout-text">30分後...</div>`;
        SoundManager.knock();
        await sleep(3000);
        
        blackout.innerHTML = `<div class="blackout-text" style="font-size:1.2rem;">
            警察：「お話を伺いに来ました。」<br><br>
            警察：「...あの、このPCに保存されているファイルについてなんですが。」<br><br>
            警察：「いくつか、問題のあるデータが見つかりまして...」
        </div>`;
        await sleep(5000);
        
        blackout.innerHTML = `<div class="blackout-text" style="font-size:1.5rem; color:#ff5f56;">
            警察：「あなたを、問題のあるデータ所持の疑いで<br>任意同行をお願いします。」
        </div>`;
        await sleep(800);
        
        SoundManager.glitch(0.3, 1.5);
        blackout.innerHTML = `<div class="blackout-text" style="font-size:1.5rem; color:#ff5f56;">
            警察：「あなたを、<span class="black-bar">問題のあるデータ</span>所持の疑いで<br>任意同行をお願いします。」
        </div>`;
        SoundManager.thud();
        await sleep(5000);
        
        blackout.innerHTML = `<div class="blackout-text" style="font-size:1rem;">
            被害者のはずだった自分が、<br>
            いつの間にか加害者になっていた。<br><br>
            保存していたファイルの中に、<br>
            法律に抵触するデータが含まれていたのだ。<br><br>
            <span style="color:#ff5f56;">ハッカーは、これを知っていた。</span>
        </div>`;
        await sleep(5000);
        
        await showEndingScreen('police',
            '逮捕エンド',
            '#ff5f56',
            '助けを求めた先で、自分の罪が暴かれた。\n\nハッカーの真の目的は、金でも愉快犯でもなく、\n「正義」だったのかもしれない。\n\n...いや、そんなわけがない。\nあいつはただ、人の人生を壊して楽しんでいただけだ。\n\nだが、結果は変わらない。\n僕の人生は、ここで終わった。',
            'ending_police'
        );
    } else if (type === 'hacked') {
        blackout.style.display = 'flex';
        blackout.style.background = '#000';
        
        SoundManager.glitch(1.0, 3.0);
        blackout.innerHTML = `<div class="blackout-text" style="color:#ff0000; font-size:3rem; font-weight:bold; text-shadow: 0 0 20px #f00;">SYSTEM COMPROMISED</div>`;
        await sleep(3000);
        
        blackout.innerHTML = `<div class="blackout-text">ハッカーにすべての主導権を奪われた。</div>`;
        await sleep(2000);
        blackout.innerHTML = `<div class="blackout-text">画面の向こうで、誰かが嘲笑っている...</div>`;
        SoundManager.glitch(0.3, 1.0);
        await sleep(3000);
        
        await showEndingScreen('hacked',
            '完全支配エンド',
            '#ff0000',
            '抵抗は虚しく終わった。\n\nPC内の全データは暗号化され、\n君の秘密はすべて彼の手に渡った。\n\nもはやこのPCは、君のものではない。\n彼の「遊び場」となったのだ。\n\n...君の背後にいるのは、誰だろうね？',
            'ending_hacked'
        );
    }
    unlockSave();
}

async function triggerFlameEnding() {
    lockSave();
    isDialogueRunning = true;
    isBlockAllInteraction = true;
    gameState.isFinalChoicePhase = false;
    document.getElementById('btn-return-reality').style.display = 'none';
    SoundManager.glitch(0.5, 2.0);
    const blackout = document.getElementById('blackout');
    blackout.style.display = 'flex'; blackout.style.zIndex = '60000';
    blackout.style.background = 'transparent';
    blackout.innerHTML = '';
    
    let noiseInt = setInterval(() => {
        SoundManager.glitch(0.05, 1.0);
        document.body.style.filter = `invert(${Math.random()}) contrast(${Math.random()*10})`;
    }, 100);
    
    await sleep(2000);
    clearInterval(noiseInt);
    document.body.style.filter = '';
    blackout.style.display = 'none';
    
    const browserWin = openWindow('browser', 'ブラウザ');
    if (browserWin) {
        bringToFront(browserWin);
        browserWin.style.width = '750px'; browserWin.style.height = '550px';
        browserWin.style.left = '150px'; browserWin.style.top = '50px';
        renderBrowser(browserWin);
        await sleep(1000);
        
        // v2 のタブ構造に対応（#page-sns 内を探す）
        const content = browserWin.querySelector('#page-sns');
        if (!content) return;
        
        const nhckPost = Array.from(content.querySelectorAll('.sns-user')).find(el => el.textContent === '@NHCK_breaking')?.parentElement;
        const matomePost = Array.from(content.querySelectorAll('.sns-user')).find(el => el.textContent === '@まとめ速報')?.parentElement;
        const lawyerPost = Array.from(content.querySelectorAll('.sns-user')).find(el => el.textContent === '@弁護士_田中')?.parentElement;
        const neighborPost = Array.from(content.querySelectorAll('.sns-user')).find(el => el.textContent === '@ご近所さん')?.parentElement;
        
        async function typeComment(postEl, text) {
            if (!postEl) return;
            // スクロール先の要素
            postEl.scrollIntoView({behavior: 'smooth', block: 'center'});
            await sleep(800);
            const replyBox = document.createElement('div');
            replyBox.className = 'sns-reply-box';
            replyBox.style.padding = '10px'; replyBox.style.marginTop = '10px';
            replyBox.style.background = 'rgba(255,255,255,0.05)';
            replyBox.style.borderLeft = '3px solid #ff5f56';
            replyBox.innerHTML = `<div style="font-weight:bold; color:#ff5f56; font-size:0.9em; margin-bottom:5px;">↳ あなたの返信を自動入力中...</div><div class="reply-text" style="font-size:0.9em;"></div>`;
            postEl.appendChild(replyBox);
            
            const textEl = replyBox.querySelector('.reply-text');
            for (let i = 0; i < text.length; i++) {
                textEl.textContent += text[i];
                SoundManager.type();
                await sleep(40);
            }
            await sleep(1000);
        }
        
        async function addReaction(postEl, reactionText) {
            if (!postEl) return;
            postEl.scrollIntoView({behavior: 'smooth', block: 'center'});
            await sleep(300);
            const reaction = document.createElement('div');
            reaction.style.padding = '5px 10px';
            reaction.style.marginTop = '5px';
            reaction.style.marginLeft = '20px';
            reaction.style.fontSize = '0.9em';
            reaction.style.color = '#fff';
            reaction.style.fontWeight = 'bold';
            reaction.style.background = 'rgba(0,0,0,0.5)';
            reaction.style.borderLeft = '2px solid #aaa';
            reaction.innerHTML = `<span style="color:#aaa;">@ネット民:</span> ${reactionText}`;
            postEl.appendChild(reaction);
            SoundManager.beep(600, 0.05);
            await sleep(1500);
        }
        
        await typeComment(matomePost, "お前らみたいなまとめサイトにいるゴミどもよりはましなPCの中身だろwww お前ら現実もダメだもんなｗ俺は現実だと年収500万で英検2級だぞww");
        await addReaction(matomePost, "うわ、本物降臨じゃんｗｗ");
        await addReaction(matomePost, "年収500万でドヤ顔は草");
        await addReaction(matomePost, "英検2級とか中学生レベルで草生える");
        await addReaction(matomePost, "顔真っ赤で書き込んでると思うとニチャァってなるわ");
        
        await typeComment(lawyerPost, "黙れやゴミインプ稼ぎ弁護士wそんなことの解説してないでもっと弁護したり情報発信することあるだろバーカwww");
        await addReaction(lawyerPost, "弁護士に喧嘩売るとか人生終わったな");
        await addReaction(lawyerPost, "はい、開示請求確定");
        await addReaction(lawyerPost, "インプ稼ぎとか言いつつ自分が一番燃料投下しててワロタ");
        
        await typeComment(neighborPost, "は？お前うそ乙wじゃあ実際に家まで来てみろやwww どーせ注目集めたいだけの一般人だろwww");
        await addReaction(neighborPost, "煽り耐性ゼロで笑う");
        await addReaction(neighborPost, "凸者出そうだなこれ");
        await addReaction(neighborPost, "場所特定班まだー？");
        await addReaction(neighborPost, "まじで近所なら特定余裕だわ");
        
        await typeComment(nhckPost, "いつもお疲れ様です。情報発信ありがとうございます。");
        await addReaction(nhckPost, "ここだけ謎に丁寧で草");
        await addReaction(nhckPost, "ハッカーに人格乗っ取られてる説");
        await addReaction(nhckPost, "ギャグセンス高すぎだろｗｗ");
        
        await sleep(2000);
        
        // 炎上演出のクライマックス
        const blackout = document.getElementById('blackout');
        blackout.style.display = 'flex';
        blackout.style.zIndex = '90000';
        blackout.style.background = 'radial-gradient(circle, #ff4500 0%, #000 70%)';
        blackout.innerHTML = `<div class="blackout-text" style="color:#fff; font-size:3rem; font-weight:bold; animation: shake-anim 0.1s infinite;">🔥 炎 上 🔥</div>`;
        SoundManager.glitch(1.0, 3.0);
        await sleep(3000);
    }
    unlockSave();
    await showEndingScreen('flame',
        '炎上エンド',
        '#ff8c00',
        '最悪の状況で、最悪の行動をとってしまった。\n\nハッカーに操られるままに放った暴言は、\nさらなる燃料となり、大炎上を引き起こした。\n\nもう、インターネットの世界にも、現実の世界にも、\n俺の居場所はどこにもない。',
        'ending_flame'
    );
}

async function triggerPCBreakdownPenalty() {
    lockSave();
    isBlockAllInteraction = true;
    SoundManager.init();
    const blackout = document.getElementById('blackout');
    blackout.style.display = 'flex';
    blackout.style.background = '#000';
    blackout.innerHTML = `<div class="penalty-text-center" style="font-size:3rem; color:#fff;">...最終警告っていったよな？</div>`;
    SoundManager.thud();
    await sleep(3000);
    
    const spamLayer = document.getElementById('penalty-spam');
    spamLayer.style.display = 'block';
    let noiseInt = setInterval(() => {
        SoundManager.glitch(0.1, 2.0);
        document.body.style.filter = `invert(${Math.random()}) contrast(${Math.random()*10})`;
    }, 50);
    
    await sleep(2000);
    clearInterval(noiseInt);
    
    document.body.style.filter = "none";
    spamLayer.style.display = 'none';
    blackout.innerHTML = ""; 
    blackout.style.background = "#000";
    console.error("CRITICAL SYSTEM FAILURE: PC DESTROYED");
    unlockSave();
}

async function showEndingScreen(type, title, color, body, achievementId) {
    const blackout = document.getElementById('blackout');
    blackout.style.display = 'flex';
    blackout.style.zIndex = '100000';
    blackout.style.background = '#000';
    blackout.innerHTML = '';
    
    const screen = document.createElement('div');
    screen.className = 'ending-screen';
    
    // 背景効果（エンディングタイプによって変える）
    if (type === 'flame') {
        screen.style.background = 'radial-gradient(circle at center, #300 0%, #000 100%)';
    } else if (type === 'police') {
        screen.style.background = 'linear-gradient(180deg, #001 0%, #000 100%)';
    } else if (type === 'discard') {
        screen.style.background = 'linear-gradient(180deg, #1a0a00 0%, #000 100%)';
    } else {
        screen.style.background = 'linear-gradient(180deg, #111 0%, #000 100%)';
    }
    
    screen.innerHTML = `
        <div class="ending-tag">ENDING</div>
        <div class="ending-title" style="color:${color}; opacity:0; transform:translateY(30px);">${title}</div>
        <div class="ending-body" style="white-space:pre-line;"></div>
        <button class="ending-restart" style="opacity:0;">最初からやり直す</button>`;
    
    blackout.appendChild(screen);
    
    // アニメーション開始
    await sleep(500);
    const titleEl = screen.querySelector('.ending-title');
    titleEl.style.transition = 'all 2s ease';
    titleEl.style.opacity = '1';
    titleEl.style.transform = 'translateY(0)';
    
    await sleep(1500);
    
    // ボディテキストの段階的表示
    const bodyEl = screen.querySelector('.ending-body');
    const lines = body.split('\n');
    for (let line of lines) {
        const lineDiv = document.createElement('div');
        lineDiv.style.opacity = '0';
        lineDiv.style.transition = 'opacity 1s ease';
        lineDiv.textContent = line || ' '; // 空行対応
        bodyEl.appendChild(lineDiv);
        
        requestAnimationFrame(() => { lineDiv.style.opacity = '1'; });
        await sleep(800);
    }
    
    await sleep(1000);
    const restartBtn = screen.querySelector('.ending-restart');
    restartBtn.onclick = () => {
        deleteSaveData();
        location.reload();
    };
    restartBtn.style.transition = 'opacity 1.5s ease';
    restartBtn.style.opacity = '1';
    
    // エンディング画面完全表示後に実績解除
    if (achievementId) {
        unlockAchievement(achievementId);
    }
}

// ============================================================
// 廃棄END（ゴミ箱に全部吸い込ませる）
// ============================================================
let isDiscardEndingRunning = false;

async function triggerDiscardEnding() {
    if (isDiscardEndingRunning) return;
    lockSave();
    isDiscardEndingRunning = true;
    isBlockAllInteraction = true;
    isDialogueRunning = true;
    
    // === フェーズ0: 選択肢ダイアログ（blackoutレイヤー上に表示） ===
    const blackout = document.getElementById('blackout');
    blackout.style.display = 'flex';
    blackout.style.zIndex = '100000';
    blackout.style.background = 'rgba(0,0,0,0.85)';
    blackout.innerHTML = `
        <div class="discard-dialog" style="background:rgba(30,30,30,0.95); border:2px solid #ff4444; border-radius:12px; padding:30px 40px; text-align:center; box-shadow:0 0 40px rgba(255,50,50,0.3);">
            <div style="font-size:1.5rem; color:#ff6666; margin-bottom:20px; font-weight:bold;">⚠ 警告</div>
            <div style="font-size:1.2rem; color:#fff; margin-bottom:30px; line-height:1.6;">全部のデータを削除するか...？<br><span style="font-size:0.9rem; color:rgba(255,255,255,0.5);">この操作は取り消せません。</span></div>
            <div style="display:flex; gap:15px; justify-content:center;">
                <button id="discard-btn-delete" class="discard-choice-btn" style="background:#cc3333; color:#fff; border:2px solid #ff6666; padding:12px 30px; font-size:1.1rem; border-radius:8px; cursor:pointer; font-weight:bold; transition:all 0.2s;">削除する</button>
                <button id="discard-btn-back" class="discard-choice-btn" style="background:#444; color:#fff; border:2px solid #888; padding:12px 30px; font-size:1.1rem; border-radius:8px; cursor:pointer; font-weight:bold; transition:all 0.2s;">戻る</button>
            </div>
        </div>
    `;
    
    // ホバーエフェクト
    document.querySelectorAll('.discard-choice-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.05)';
            btn.style.boxShadow = '0 0 15px rgba(255,255,255,0.2)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = 'none';
        });
    });
    
    const choice = await new Promise(resolve => {
        document.getElementById('discard-btn-delete').onclick = () => resolve('delete');
        document.getElementById('discard-btn-back').onclick = () => resolve('back');
    });
    
    blackout.style.display = 'none';
    blackout.innerHTML = '';
    
    if (choice === 'back') {
        isBlockAllInteraction = false;
        isDialogueRunning = false;
        return;
    }
    
    // 「削除する」を選択
    isBlockAllInteraction = true;
    
    // === フェーズ1: 竜巻吸い込み演出（強化版） ===
    const desktop = document.getElementById('desktop');
    
    // 効果音：吸い込み開始（低いブーン）
    SoundManager.horrorImpact();
    
    // 画面シェイク開始
    desktop.classList.add('virus-shake');
    document.body.style.filter = 'contrast(1.5) saturate(1.5) brightness(0.6)';
    
    // カラフルな竜巻パーティクルを大量生成
    const colors = ['#ff4444', '#44ff44', '#4488ff', '#ffff44', '#ff44ff', '#44ffff', '#ffffff'];
    for (let i = 0; i < 60; i++) {
        const particle = document.createElement('div');
        particle.className = 'tornado-particle';
        const size = 3 + Math.random() * 15;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = (Math.random() * 100) + 'vw';
        particle.style.top = (Math.random() * 100) + 'vh';
        particle.style.setProperty('--tx', (Math.random() - 0.5) * 300 + 'px');
        particle.style.setProperty('--ty', (Math.random() - 0.5) * 300 + 'px');
        particle.style.animationDelay = (Math.random() * 0.8) + 's';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.boxShadow = `0 0 ${2 + Math.random() * 6}px ${particle.style.background}`;
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 3000);
    }
    
    // 風切り音エフェクト（連続ビープで風を表現）
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            SoundManager.beep(80 + i * 30, 0.3, 'sine', 0.02);
        }, i * 200);
    }
    
    // 全UI要素をゴミ箱に吸い込むアニメーション（竜巻風）
    const elementsToSuck = [
        document.getElementById('icons-grid'),
        document.getElementById('window-manager'),
        document.getElementById('taskbar'),
        document.getElementById('network-status'),
        document.getElementById('virus-timer'),
        document.getElementById('btn-return-reality')
    ];
    
    // 各要素に遅延をかけて順番に吸い込ませる
    elementsToSuck.forEach((el, index) => {
        if (el) {
            el.style.animationDelay = (index * 0.12) + 's';
            el.classList.add('trash-suck');
        }
    });
    
    // 吸い込み中のグリッチエフェクト
    const glitchInterval = setInterval(() => {
        document.body.style.filter = `contrast(1.5) saturate(${1 + Math.random() * 2}) brightness(${0.4 + Math.random() * 0.3})`;
        document.body.style.transform = `translate(${(Math.random() - 0.5) * 4}px, ${(Math.random() - 0.5) * 4}px)`;
    }, 100);
    
    // ゴミ箱アイコン自体も拡大して吸い込む
    const trashIcon = document.getElementById('icon-trash');
    if (trashIcon) {
        trashIcon.style.transition = 'all 1.8s ease-in';
        trashIcon.style.transform = 'scale(5) rotate(30deg)';
        trashIcon.style.opacity = '0';
        trashIcon.style.filter = 'brightness(2)';
        // フラッシュエフェクト（強化）
        setTimeout(() => {
            // グリッチ停止
            clearInterval(glitchInterval);
            document.body.style.transform = '';
            
            const flash = document.createElement('div');
            flash.className = 'trash-flash';
            flash.style.position = 'fixed';
            flash.style.top = '0';
            flash.style.left = '0';
            flash.style.width = '100vw';
            flash.style.height = '100vh';
            flash.style.zIndex = '99998';
            flash.style.pointerEvents = 'none';
            document.body.appendChild(flash);
            
            // フラッシュ時の衝撃音
            SoundManager.glitch(0.5, 2.0);
            
            setTimeout(() => flash.remove(), 500);
        }, 1500);
    } else {
        // trashIconがない場合もグリッチ停止
        setTimeout(() => {
            clearInterval(glitchInterval);
            document.body.style.transform = '';
        }, 1500);
    }
    
    await sleep(2500);
    
    // 画面シェイクとフィルターをリセット
    desktop.classList.remove('virus-shake');
    document.body.style.filter = '';
    
    // === フェーズ2: 暗転「一日後...」 ===
    blackout.style.display = 'flex';
    blackout.style.zIndex = '100000';
    blackout.style.background = '#000';
    blackout.innerHTML = '<div class="blackout-text" style="font-size:2rem;">一日後...</div>';
    await sleep(3000);
    
    // === フェーズ3: 現実の部屋UI ===
    // 暗転解除
    blackout.style.display = 'none';
    
    // デスクトップを非表示、元のroom-view（家具配置あり）を表示
    document.getElementById('desktop').style.display = 'none';
    document.getElementById('room-view').style.display = 'flex';
    document.getElementById('room-dialogue').innerHTML = '';
    document.getElementById('room-choices').style.display = 'none';
    
    // room-mapを元の状態に戻す（家具を再生成）
    const roomMap = document.querySelector('.room-map');
    if (roomMap) {
        roomMap.innerHTML = `
            <div class="room-object" id="obj-bed" style="top:5%; left:5%; width:20%; height:50%;">ベッド</div>
            <div class="room-object" id="obj-desk-hobby" style="top:5%; left:28%; width:30%; height:30%;">趣味の机</div>
            <div class="room-object" id="obj-desk-pc" style="top:5%; left:62%; width:33%; height:30%;">PCデスク<br>（新しいPC）</div>
            <div class="room-object" id="obj-window" style="top:38%; right:5%; width:15%; height:38%; border:3px solid #87ceeb; background:#2a4a6a;">🪟 窓</div>
            <div class="room-object" id="obj-door" style="bottom:5%; left:5%; width:15%; height:10%;">ドア</div>
            <div class="room-object" id="obj-shelf" style="bottom:5%; left:25%; width:40%; height:15%; border:3px solid #ffeb3b;">棚・引き出し</div>
            <div class="room-object" id="obj-closet" style="bottom:5%; left:70%; width:25%; height:15%;">クローゼット</div>
        `;
    }
    
    // 主人公のセリフ（room-viewのダイアログで表示）
    await showRoomDialogue("...よし。PC新調したことだしぃ？");
    await showRoomDialogue("また、自由なネットライフ生活（？）");
    await showRoomDialogue("スタートだっっ！");
    
    // === フェーズ4: ノック音 ===
    try {
        const knockAudio = new Audio('assets/se/木のドアをノック2.mp3');
        knockAudio.volume = 0.5;
        knockAudio.play().catch(() => {});
    } catch(e) {
        console.warn('Knock SE play failed:', e);
    }
    await showRoomDialogue("！？");
    await sleep(800);
    
    // === フェーズ5: ドアを開ける ===
    try {
        const doorAudio = new Audio('assets/se/ドアを開ける3.mp3');
        doorAudio.volume = 0.5;
        doorAudio.play().catch(() => {});
    } catch(e) {
        console.warn('Door SE play failed:', e);
    }
    await showRoomDialogue("（主人公がドアを開ける）");
    
    // === フェーズ6: 警察との会話（黒背景に中央テキスト） ===
    async function showBlackoutText(text, duration = 3000) {
        blackout.style.display = 'flex';
        blackout.style.zIndex = '100000';
        blackout.style.background = '#000';
        blackout.innerHTML = `<div class="blackout-text" style="font-size:1.1rem; color:rgba(255,255,255,0.75); text-align:center; line-height:1.8;">${text}</div>`;
        await sleep(duration);
    }
    
    await showBlackoutText("警察：「おはようございます。お時間よろしいでしょうか？」", 2500);
    await showBlackoutText("「え...警察？な、なんで...」", 2000);
    await showBlackoutText("警察：「先日、こちらでサイバー犯罪の通報がありまして。」", 2500);
    await showBlackoutText("警察：「よろしければ、お宅のPCを簡単に確認させていただいても？」", 3000);
    await showBlackoutText("「（まさか...もう来たのか？でもPCはもう捨てたし...）", 2500);
    await showBlackoutText("「...はい、どうぞ。」", 2000);
    
    // === フェーズ7: 暗転→物語テキスト ===
    blackout.style.display = 'flex';
    blackout.style.zIndex = '100000';
    blackout.style.background = '#000';
    blackout.innerHTML = '';
    
    const storyLines = [
        "警察が部屋に入る。",
        "新しいPCが置いてあるのを確認する。",
        "「以前お使いだったPCは？」",
        "「...壊れたんで、廃棄しました。」",
        "警察は怪しみながらも、証拠がない以上どうしようもない。",
        "「...わかりました。何かあればまた連絡します。」",
        "警察が去っていく。",
        "",
        "主人公はファイルやPCごと廃棄したので、",
        "証拠が見つからずに撤収された。",
        "",
        "すべてのデータは失われた。",
        "ハッカーの痕跡も、自分の痕跡も。",
        "",
        "何もかもを失った。",
        "それでも、",
        "自由になった気がした。"
    ];
    
    let storyContainer = document.createElement('div');
    storyContainer.style.textAlign = 'center';
    storyContainer.style.color = 'rgba(255,255,255,0.75)';
    storyContainer.style.fontSize = '1.1rem';
    storyContainer.style.lineHeight = '1.8';
    blackout.appendChild(storyContainer);
    
    for (let line of storyLines) {
        const lineDiv = document.createElement('div');
        lineDiv.style.opacity = '0';
        lineDiv.style.transition = 'opacity 1s ease';
        lineDiv.textContent = line || ' ';
        storyContainer.appendChild(lineDiv);
        requestAnimationFrame(() => { lineDiv.style.opacity = '1'; });
        await sleep(1500);
    }
    
    await sleep(2000);
    unlockSave();
    showEndingScreen('discard',
        '廃棄END',
        '#ff9500',
        'すべてを捨てた先に、自由はあった。\n\nPCもデータも、過去の自分も。\nすべてを手放した。\n\n何もかもを失った。\nそれでも、\n自由になった気がした。',
        'ending_discard'
    );
}

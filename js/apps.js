// ---------------------------------------------------------
// ファイルマネージャ
// ---------------------------------------------------------
function renderFiles(win, dirId) {
    const contentArea = win.querySelector('.window-content');
    const items = fileSystem[dirId];
    if (!items) return;
    const isRootActive = (dirId === 'root' || dirId === 'day1_root');
    const sideClick = (target) => `if(isDialogueRunning || (scenarioStarted && scenarioPhase === 1)) return; window.updateFiles('${win.id}', '${target}')`;
    let html = `<div class="sidebar">
        <div class="sidebar-item ${isRootActive ? 'active' : ''}" onclick="${sideClick('root')}">デスクトップ</div>
        <div class="sidebar-item ${dirId === 'documents' ? 'active' : ''}" onclick="${sideClick('documents')}">書類</div>
        <div class="sidebar-item ${dirId === 'pictures' ? 'active' : ''}" onclick="${sideClick('pictures')}">ピクチャ</div>
    </div><div class="main-content">`;
    items.forEach(item => {
        let clickAction = "";
        if (isDialogueRunning || (scenarioStarted && scenarioPhase === 1)) {
            clickAction = `onclick="SoundManager.beep(400, 0.1); return false;"`;
        } else if (item.type === 'lock') {
            clickAction = `onclick="SoundManager.beep(400, 0.1)" ondblclick="showPasswordDialog()"`;
        } else if (item.type === 'folder') {
            clickAction = `onclick="window.updateFiles('${win.id}', '${item.target}')"`;
        } else if (item.type === 'twoich') {
            clickAction = `onclick="handleFileClick('Twoich')"`;
        } else if (item.type === 'browser') {
            clickAction = `onclick="openWindow('browser', 'NHCKブラウザ')"`;
        } else if (item.isTrigger && !scenarioStarted) {
            if (gameState.day === 1) {
                clickAction = `onclick="SoundManager.beep(400, 0.1)" ondblclick="handleFileDesc('えっちだ...。')"`;
            } else {
                clickAction = `onclick="SoundManager.beep(400, 0.1)" ondblclick="triggerHackingSequence()"`;
            }
        } else if (item.isDay1EndTrigger) {
            clickAction = `onclick="SoundManager.beep(400, 0.1)" ondblclick="triggerDay1RoomTransition()"`;
        } else {
            // 元の長いデフォルト文を復元
            const safeDesc = (item.desc || "これは大事なファイルだ。勝手に消さないようにしないと。").replace(/'/g, "\\'").replace(/\n/g, "\\n");
            if (item.name === '???.txt' || item.name === '??? .txt') {
                clickAction = `onclick="SoundManager.beep(400, 0.1)" ondblclick="handleFileClick('${item.name}')"`;
            } else {
                clickAction = `onclick="SoundManager.beep(400, 0.1)" ondblclick="handleFileDesc('${safeDesc}')"`;
            }
        }
        html += `<div class="file-item" ${clickAction}><div class="file-icon">${icons[item.type] || icons.text}</div><span class="file-name">${item.name}</span></div>`;
    });
    html += `</div>`;
    contentArea.innerHTML = html;
}

async function handleFileClick(name) {
    if (name === 'Twoich') {
        if ((scenarioStarted && scenarioPhase === 1) || isDialogueRunning || isBlockAllInteraction) return;
        if (!isWifiOff) {
            isDialogueRunning = true; await showDesktopDialogue("配信...しようと思ったけど勇気がでないんだよな..."); isDialogueRunning = false; return;
        }
        if (!isSecretNoteOpened) {
            isDialogueRunning = true; await showDesktopDialogue("Wifiついてないのに開く意味あるのか...？"); isDialogueRunning = false; return;
        }
        if (openedApps['twoich']) return;
        const win = openWindow('twoich', 'Twoich - ライブ配信中');
        win.style.width = '800px'; win.style.height = '500px';
        if (!isTwoichDiscovered) {
            isTwoichDiscovered = true; unlockWarpDestination('day2_twoich'); isDialogueRunning = true;
            await showDesktopDialogue("なんだ...？これは。俺のPCが勝手に配信されている...？");
            await showDesktopDialogue("いや...いまWifiはつながっていないはず...。");
            isDialogueRunning = false;
        }
        startTwoichChat(win);
    } else if (name === '???.txt' || name === '??? .txt') {
        handleSecretNote();
    }
}



async function handleFileDesc(desc) {
    if (isDialogueRunning || (scenarioStarted && scenarioPhase === 1)) return;
    isDialogueRunning = true; 
    
    if (desc.includes('0815')) gameState.hintRead = true;
    
    // 1日目のエッチな画像カウンター
    if (gameState.day === 1 && desc === "えっちだ...。") {
        gameState.lewdClickCount++;
        if (gameState.lewdClickCount >= CONSTANTS.LEWD_CLICK_THRESHOLD && !gameState.lewdEasterEggSeen) {
            await triggerLewdEasterEgg();
            isDialogueRunning = false;
            return;
        }
    }

    await showDesktopDialogue(desc); 
    isDialogueRunning = false;
}

let isSecretNoteProcessing = false;
async function handleSecretNote() {
    if (isSecretNoteProcessing || isDialogueRunning || isBlockAllInteraction) return;
    
    if (isSecretNoteOpened) {
        isDialogueRunning = true;
        await showDesktopDialogue("...やめておこう");
        isDialogueRunning = false;
        return;
    }
    
    isSecretNoteProcessing = true; 
    const note = openWindow('secret-note', '??? .txt', false, false);
    if (!note) return;
    note.querySelector('.notepad-display').setAttribute('contenteditable', 'false');
    note.style.left = '50%'; note.style.top = '40%'; note.style.transform = 'translate(-50%, -50%)';
    
    isBlockAllInteraction = true;
    await typeInNotepad(note, "やあ。Wifiを切って何とかPCに接続できたようだね。\n"); await sleep(1000);
    await typeInNotepad(note, "でも、まだ安全とは言えるかな？君の家にはまだWifiルーターがあるんだ。"); await sleep(1500);
    
    setNetworkStatus(true); SoundManager.glitch(0.5); await sleep(500); setNetworkStatus(false); await sleep(1000);
    
    await showDesktopDialogue("「▼.てう.やお」.めこ ▼.てうやお」 めこ ▼てうお」 こ ▼う」");
    await showDesktopDialogue("今のは...？");
    
    isBlockAllInteraction = false;
    await showDesktopDialogue("...終わった。");
    await showDesktopDialogue("もう、誰も僕を覗き見することはできない。");
    isSecretNoteOpened = true;
    closeWindow('secret-note');
    isSecretNoteProcessing = false;
    unlockAchievement('secret_note');
}

window.updateFiles = (winId, dirId, isForced = false) => {
    if ((isDialogueRunning || (scenarioStarted && scenarioPhase === 1)) && !isForced) return;
    if (gameState.day === 1 && dirId === 'root') dirId = 'day1_root';
    const win = document.getElementById(winId);
    if (win) { SoundManager.beep(600, 0.05); renderFiles(win, dirId); }
};

// ---------------------------------------------------------
// Twoichアプリ
// ---------------------------------------------------------
function renderTwoich(win) {
    win.querySelector('.window-content').innerHTML = `
        <div class="twoich-container">
            <div class="twoich-main">
                <div class="twoich-video">
                    <div class="obs-mirror">
                        <div class="mirror-text">LIVE: MY DESKTOP</div>
                        <div class="mirror-sub">12,432 Viewers</div>
                    </div>
                </div>
                <div class="twoich-info">
                    <div class="twoich-title">【悲報】このオタクのPC中身ヤバすぎワロタｗｗｗ</div>
                    <div class="twoich-meta">カテゴリ: リアルタイム暴露</div>
                    <div class="twoich-actions">
                        <button onclick="window.sendTwoichMsg('stop')">配信を止めろ！</button>
                        <button onclick="window.sendTwoichMsg('who')">誰が見てるんだ</button>
                        <button onclick="window.sendTwoichMsg('police')">警察に通報する</button>
                        <button onclick="window.sendTwoichMsg('panic')">あああああ！</button>
                    </div>
                </div>
            </div>
            <div class="twoich-chat">
                <div class="chat-header">ストリームチャット</div>
                <div class="chat-msgs" id="twoich-msgs"></div>
                <div class="chat-input-box"><div class="chat-placeholder">メッセージを送信...</div></div>
            </div>
        </div>`;
}

let twoichChatInterval = null;
function startTwoichChat(win) {
    const msgs = win.querySelector('#twoich-msgs');
    if (!msgs) return;
    const comments = ["ｗｗｗｗｗｗ", "誰だよこいつｗ", "一般人のPC中身とか誰得だよ", "と言いつつ見ちゃうｗ", "履歴ヤバすぎだろ...", "これ本人気づいてるの？", "うわあああ恥ずか死ぬｗｗ", "特定はよ", "住所どこ？", "こいつの人生終わったな", "ハッカーさんもっとやれｗｗ", "親泣くぞこれ", "卒業アルバムとか晒してほしい", "デスクトップから漂うオタク臭", "中身見られるとか一生のトラウマだろ", "今の表情、絶望してて草", "ネットのゴミ箱へようこそ", "デジタルタトゥー確定ｗ", "次、メールの中身見ようぜ", "一般人のプライバシーｗｗｗ", "晒しイベント最高", "見てるこっちが恥ずかしくなる", "ハッカー有能すぎて草", "通報したところで手遅れなんだよなぁ", "明日から外歩けないね", "名前特定まだー？", "ネットは広大だわ"];
    const users = ["ゲスト12", "名無し", "通りすがり", "ROM", "暇つぶし中", "匿名くん", "ネットの住人", "晒しスレ民", "傍観者A", "悪意の塊"];
    if (twoichChatInterval) clearInterval(twoichChatInterval);
    twoichChatInterval = setInterval(() => {
        if (!openedApps['twoich']) { clearInterval(twoichChatInterval); return; }
        const div = document.createElement('div'); div.className = 't-msg';
        div.innerHTML = `<span class="t-user">${users[Math.floor(Math.random() * users.length)]}:</span> ${comments[Math.floor(Math.random() * comments.length)]}`;
        msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight;
        if (msgs.children.length > CONSTANTS.TWITCH_MAX_MSGS) msgs.removeChild(msgs.firstChild);
    }, CONSTANTS.TWITCH_CHAT_INTERVAL_MS);
}

window.sendTwoichMsg = async function(val) {
    if (isBlockAllInteraction) return;
    const now = Date.now();
    if (now < timeoutUntil && val !== 'police') {
        addManualTwoichMsg(`システム: あなたはタイムアウト中です。あと ${Math.ceil((timeoutUntil - now) / 1000)} 秒待ってください。`); return;
    }
    if (val !== 'police') {
        sendHistory = sendHistory.filter(t => now - t < 1000); sendHistory.push(now);
        if (sendHistory.length >= CONSTANTS.SPAM_MSG_LIMIT) {
            timeoutUntil = now + (CONSTANTS.SPAM_TIMEOUT_SECONDS * 1000); addManualTwoichMsg("システム: スパム行為を検知しました。" + CONSTANTS.SPAM_TIMEOUT_SECONDS + "秒間の送信禁止処分（タイムアウト）を受けました。"); return;
        }
    }
    if (isDialogueRunning) return;
    
    if (val === "stop") {
        addManualTwoichMsg("Me: 配信を止めてくれ！！見ないでくれ！！"); await sleep(1000);
        addManualTwoichMsg("視聴者: 本人キターーーー！！"); addManualTwoichMsg("視聴者: 無理でーすｗｗｗ");
    } else if (val === "who") {
        addManualTwoichMsg("Me: 誰が見てるんだこれ..."); await sleep(1000);
        addManualTwoichMsg("視聴者: 1万人以上が見てるぞ"); addManualTwoichMsg("視聴者: ネットは広大だわ");
    } else if (val === "police") {
        policeCallCount++; isDialogueRunning = true;
        if (policeCallCount === 1) {
            addManualTwoichMsg("（...プルルル、プルルル）");
            SoundManager.beep(400, 0.5, 'sine', 0.05); await sleep(1000);
            SoundManager.beep(400, 0.5, 'sine', 0.05); await sleep(1000);
            await showDesktopDialogue("「もしもし？そちら警察ですか？ ハッキングされてるんです！」");
            await showDesktopDialogue("警察：『はい、こちら 110 番です。どうされました？』");
            await showDesktopDialogue("「PCの中身が勝手にネットに晒されていて...今すぐ止めてください！」");
            await showDesktopDialogue("警察：『あー...ネットのトラブルは、専門の相談窓口へお願いしますね。』");
            await showDesktopDialogue("警察：『とりあえず電源を切って寝てみてください。では。』");
            await showDesktopDialogue("（ツーツー...）");
            addManualTwoichMsg("Me: 切られた...。");
        } else if (policeCallCount === 2) {
            addManualTwoichMsg("（...プルルル）");
            SoundManager.beep(400, 0.5, 'sine', 0.05); await sleep(800);
            await showDesktopDialogue("警察：『...はい、110番です。さっきの方ですか？』");
            await showDesktopDialogue("「そうです！まだ配信が続いてるんです！助けてください！」");
            await showDesktopDialogue("警察：『あのね、同じ件で何度もかけられても困るんですよ。業務妨害になりますよ？』");
            await showDesktopDialogue("警察：『最寄りの警察署に直接行ってください。ガチャッ。』");
            addManualTwoichMsg("Me: 逆ギレされた...。そんな...。");
        } else if (policeCallCount === 3) {
            addManualTwoichMsg("（プルル...）");
            SoundManager.beep(400, 0.5, 'sine', 0.05); await sleep(500);
            await showDesktopDialogue("警察：『...はい、110番。いい加減にしてください。次かけたら厳重注意ですよ。』");
            await showDesktopDialogue("「待って、本当に、本当にヤバいんです！！」");
            await showDesktopDialogue("警察：『プツッ。』");
            addManualTwoichMsg("Me: 話すら聞いてくれない...。");
        } else {
            addManualTwoichMsg("（プー、プー、プー...）");
            SoundManager.beep(400, 0.2, 'sine', 0.05); await sleep(300);
            SoundManager.beep(400, 0.2, 'sine', 0.05); await sleep(300);
            SoundManager.beep(400, 0.2, 'sine', 0.05); await sleep(300);
            await showDesktopDialogue("...つながらない。着信拒否されたのか...？");
            addManualTwoichMsg("Me: 警察にまで見捨てられた...。");
        }
        await sleep(1000);
        const reaction = ["視聴者: 警察(笑)", "視聴者: 粘着通報ニキ草", "視聴者: 逆ギレされててワロタ", "視聴者: BANされるぞｗ", "視聴者: 通報厨の末路", "視聴者: 警察さん乙"];
        addManualTwoichMsg(reaction[Math.floor(Math.random() * reaction.length)]);
        isDialogueRunning = false;
    } else if (val === "panic") {
        addManualTwoichMsg("Me: あああああああああ！！"); await sleep(1000);
        addManualTwoichMsg("視聴者: 壊れたｗｗｗ"); addManualTwoichMsg("視聴者: おもちゃ発見");
    }
};

function addManualTwoichMsg(text) {
    const msgs = document.getElementById('twoich-msgs'); if (!msgs) return;
    const div = document.createElement('div'); div.className = 't-msg';
    div.innerHTML = `<span class="t-user-me">${text}</span>`;
    msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight;
}

// ---------------------------------------------------------
// ブラウザアプリ (詳細演出復刻版)
// ---------------------------------------------------------
function renderBrowser(win) {
    const day = Number(gameState.day);
    let snsHtml = ``;
    if (day === 1) {
        snsHtml = `
            <div class="sns-header">トレンド - 国内</div>
            <div class="sns-post"><div class="sns-user">@スイーツ大好き</div>
                <div class="sns-body">新作のパンケーキ、ふわっふわで最高だった...！また行きたいな🍰</div>
                <div class="sns-stats">♥ 42 🔁 5</div></div>
            <div class="sns-post"><div class="sns-user">@鉄道ファン</div>
                <div class="sns-body">今日の臨時列車、ヘッドマークが特別仕様で格好良かった。撮り鉄の人すごかった。</div>
                <div class="sns-stats">♥ 128 🔁 45</div></div>
            <div class="sns-post"><div class="sns-user">@就活つらい</div>
                <div class="sns-body">今日も祈られた。もう何社目だろう。人生の難易度高すぎない？</div>
                <div class="sns-stats">♥ 5 🔁 0</div></div>`;
    } else if (day === 2) {
        snsHtml = `
            <div class="sns-header">トレンド - ネット不調報告続出</div>
            <div class="sns-post sns-hot"><div class="sns-user">@ネット監視bot</div>
                <div class="sns-body">【障害情報】午後2時頃より国内複数ISPで通信障害が発生。復旧作業中と発表。</div>
                <div class="sns-stats">♥ 2,341 🔁 1,802</div></div>
            <div class="sns-post"><div class="sns-user">@ゲーマー太郎</div>
                <div class="sns-body">回線不安定すぎてオンラインゲームにならねぇ...誰か同じ状況の人いる？</div>
                <div class="sns-stats">♥ 89 🔁 34</div></div>
            <div class="sns-post"><div class="sns-user">@セキュリティ初心者</div>
                <div class="sns-body">知らない人から変なファイル送られてきたんだけど、これってウイルス？開けちゃったんだけど大丈夫かな...</div>
                <div class="sns-stats">♥ 156 🔁 89</div></div>
            <div class="sns-post"><div class="sns-user">@IT新聞</div>
                <div class="sns-body">【速報】新種のマルウェアがSNS経由で拡散中。セキュリティソフトの更新を推奨。</div>
                <div class="sns-stats">♥ 3,102 🔁 1,567</div></div>`;
    } else if (day === 3) {
        snsHtml = `
            <div class="sns-header">🔥 全国ニュース - 大炎上中</div>
            <div class="sns-post sns-hot"><div class="sns-user">@NHCK_breaking</div>
                <div class="sns-body">【速報】PCハッキング被害者の個人情報が大量流出。被害者の実名・住所が特定される。サイバー犯罪対策課が捜査開始。</div>
                <div class="sns-stats">♥ 89,241 🔁 41,205</div></div>
            <div class="sns-post sns-hot"><div class="sns-user">@名無し速報</div>
                <div class="sns-body">【悲報】一般人のPC中身が配信で晒される事件発生ｗｗｗ</div>
                <div class="sns-stats">♥ 3,241 🔁 1,205</div>
                <div class="sns-reaction" style="padding:5px 10px; margin-top:5px; margin-left:20px; font-size:0.9em; color:#fff; font-weight:bold; background:rgba(0,0,0,0.5); border-left:2px solid #aaa;"><span style="color:#aaa;">@ネット民:</span> 誰だよこいつｗ 特定はよ</div>
            </div>
            <div class="sns-post sns-hot"><div class="sns-user">@まとめ速報</div>
                <div class="sns-body">ハッキング配信の被害者、過去の検索履歴がヤバすぎて逆に同情されなくなるｗｗｗ</div>
                <div class="sns-stats">♥ 45,891 🔁 22,342</div></div>
            <div class="sns-post"><div class="sns-user">@弁護士_田中</div>
                <div class="sns-body">この事件、被害者も加害者も両方捜査対象になりえます。保存していたファイルの中身次第では...</div>
                <div class="sns-stats">♥ 12,100 🔁 5,800</div></div>`;
    }

    const news = (day === 3) ? newsData.day3 : (day === 2 ? newsData.day2 : newsData.day1);
    let newsHtml = `<div class="news-container"><div class="news-top">NHCK NEWS ONLINE</div><div class="news-list">`;
    if (news && news.length > 0) {
        news.forEach(n => {
            newsHtml += `<div class="news-item ${n.highlight ? 'news-highlight' : ''}"><div class="news-meta"><span>${n.category}</span> <span>${n.date}</span></div><div class="news-title">${n.title}</div></div>`;
        });
    }
    newsHtml += `</div></div>`;

    win.querySelector('.window-content').innerHTML = `
        <div class="browser-container">
            <div class="browser-bar">
                <div class="browser-tabs">
                    <div class="browser-tab active" id="tab-sns">SNS</div>
                    <div class="browser-tab" id="tab-news">NHCK News</div>
                </div>
                <div class="browser-url-bar"><input class="browser-url" id="browser-address" value="https://www.nhck-news.jp/sns" readonly></div>
            </div>
            <div class="browser-content" style="background:#f5f5f5; color:#111; overflow-y:auto; height:100%;">
                <div id="page-sns" style="padding:20px;">${snsHtml}</div>
                <div id="page-news" style="display:none;">${newsHtml}</div>
            </div>
        </div>`;

    const btnSns = win.querySelector('#tab-sns'); const btnNews = win.querySelector('#tab-news');
    const pageSns = win.querySelector('#page-sns'); const pageNews = win.querySelector('#page-news');
    const address = win.querySelector('#browser-address');
    if (btnSns && btnNews) {
        btnSns.onclick = (e) => {
            e.stopPropagation(); SoundManager.beep(600, 0.05);
            btnSns.classList.add('active'); btnNews.classList.remove('active');
            pageSns.style.display = 'block'; pageNews.style.display = 'none'; address.value = "https://www.nhck-news.jp/sns";
        };
        btnNews.onclick = (e) => {
            e.stopPropagation(); SoundManager.beep(600, 0.05);
            btnNews.classList.add('active'); btnSns.classList.remove('active');
            pageNews.style.display = 'block'; pageSns.style.display = 'none'; address.value = "https://www.nhck-news.jp/news";
        };
    }
}

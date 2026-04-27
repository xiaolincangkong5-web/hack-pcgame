/**
 * room.js
 * 「現実モード（部屋の探索）」に関するロジックを管理します。
 */

// 部屋のシーケンス
async function playRoomSequence() {
    lockSave();
    isRoomExplorable = false;
    await showRoomDialogue("...ハッカーが接続を切ったのか？PCの画面が真っ暗になった。");
    await showRoomDialogue("電源を押しても... 付かない。");
    await showRoomDialogue("どうやったらPCを付けられるんだ...？ハッカーの干渉を受けないようにするためには...");
    isRoomExplorable = true;
    isBlockAllInteraction = false;
    document.getElementById('room-dialogue').innerHTML = "（部屋の気になる場所をクリックして調べよう）";
    unlockSave();
}

// 部屋の探索イベント
window.interactRoom = async (objId) => {
    if (!isRoomExplorable || isBlockAllInteraction || isDialogueRunning) return;
    isRoomExplorable = false;
    isDialogueRunning = true; // 会話中はタイマー停止・重複操作防止
    await sleep(100);
    
    // 隣人END後の侵入モード（全家具クリック可能）
    if (gameState.isRoomInvaded) {
        if (objId === 'bed') {
            await showRoomDialogue("ベッドの下にも誰か隠れているかもしれない...。");
            await showRoomDialogue("いや、気のせいだ。落ち着け。");
        } else if (objId === 'desk-hobby') {
            await showRoomDialogue("趣味の机だ。何も変わっていない...はずなのに、全てが違って見える。");
        } else if (objId === 'desk-pc') {
            await showRoomDialogue("PCデスク。あの画面の向こうに、現実の脅威が迫っている。");
            await showRoomDialogue("今はPCを触っている場合じゃない。");
        } else if (objId === 'window') {
            await showRoomDialogue("窓の外は暗い。街灯の明かりだけが、静かに道を照らしている。");
            await showRoomDialogue("...あの靴の主は、どこから入ってきたんだ？");
        } else if (objId === 'door') {
            await showRoomDialogue("玄関のドアだ。鍵はかけたはずなのに...。");
            await showRoomDialogue("やはり、警察に通報したほうがいいかもしれない。");
            const c = await showRoomChoices([
                {text: "警察に電話する", val: "call"},
                {text: "まだ様子を見る", val: "stay"}
            ]);
            if (c === 'call') {
                isDialogueRunning = false;
                await triggerPhoneCallSequence();
                return;
            }
        } else if (objId === 'shelf') {
            await showRoomDialogue("棚の中を確認する。特に変わったものはない。");
            await showRoomDialogue("...いや、引き出しの位置が少しずれている気がする。");
            await showRoomDialogue("誰かが漁ったのか...？");
        } else if (objId === 'closet') {
            await showRoomDialogue("クローゼットだ。開けるのが怖い...。");
            await showRoomDialogue("（ゆっくりと開ける。）");
            await showRoomDialogue("...何もいない。ただの服だけだ。");
            await showRoomDialogue("ほっとしたような、拍子抜けしたような気分だ。");
        }
        isDialogueRunning = false;
        isRoomExplorable = true;
        document.getElementById('room-dialogue').innerHTML = "（何かがおかしい...どうする？）";
        return;
    }
    
    const isFinal = (gameState.day === 3 && gameState.isFinalChoicePhase);
    const isHackingExploration = gameState.isHackingSequenceRunning;

    if (objId === 'bed') {
        if (isFinal) {
            await showRoomDialogue("ベッドだ。ここで毛布にくるまっても、ネット上の俺は晒され続けている。");
            await showRoomDialogue("逃げ場なんて、もうどこにもないんだ。");
            await showRoomDialogue("...いや、まだだ。もう一度頭を冷やして、考え直そう。");
            const c = await showRoomChoices([
                {text: "休んでやり過ごす", val: "rest"},
                {text: "やっぱり起きている", val: "stay"}
            ]);
            if (c === 'rest') {
                await showAnimatedBlackout("逃げ出したい気持ちを抑えて", 3000);
                await showRoomDialogue("...少し落ち着いた気がする。");
                await showRoomDialogue("まだ終わったわけじゃない。もう一度、考えよう。");
            }
        } else if (isHackingExploration) {
            await showRoomDialogue("ベッドだ。今はゆっくり寝ている暇なんてない。");
        } else if (gameState.day === 1 && gameState.day1SleepReady) {
            await showRoomDialogue("もう遅い...今日は寝よう。");
            await showRoomDialogue("明日になれば、きっと大丈夫だ...そう思いたい。");
            const c = await showRoomChoices([{text: "寝る", val: "sleep"}, {text: "まだ起きてる", val: "stay"}]);
            if (c === 'sleep') {
                isDialogueRunning = false;
                gameState.day = 2;
                AmbientManager.play(2);
                await showAnimatedBlackout("zzz", 3000);
                document.getElementById('room-view').style.display = 'none';
                document.getElementById('desktop').style.display = 'block';
                await showDayTransition(2, "侵入");
                isDialogueRunning = true;
                await showDesktopDialogue("...おはよう。昨日は変な夢を見た気がする。");
                await showDesktopDialogue("とりあえず、PCを立ち上げるか。");
                isDialogueRunning = false;
                return;
            } else {
                await showRoomDialogue("...もう少しだけ起きていよう。");
            }
        } else if (gameState.day === 2 && isTwitchDiscovered) {
            await showRoomDialogue("もう画面を見たくない...今日は寝よう。");
            await showRoomDialogue("明日になれば、きっと大丈夫だ...そう思いたい。");
            const c = await showRoomChoices([{text: "寝る", val: "sleep"}, {text: "まだ起きてる", val: "stay"}]);
            if (c === 'sleep') {
                isDialogueRunning = false;
                await transitionToDay3();
                return;
            } else {
                await showRoomDialogue("...もう少しだけ起きていよう。");
            }
        } else if (gameState.day === 1) {
            await showRoomDialogue("ベッドだ。まだ寝る気にはなれない...何か気になることがある。");
        } else {
            await showRoomDialogue("いつものベッドだ。今は寝ている場合じゃない。");
        }
    }
    else if (objId === 'desk-hobby') {
        if (isFinal) {
            await showRoomDialogue("趣味の机だ。大切にしていた物さえ、今はハッカーに汚されたように感じる。");
            await showRoomDialogue("世界中の人間に、俺の趣味が笑われているんだ...");
        } else {
            await showRoomDialogue(gameState.day === 1 ? "趣味の机。色々な物が置いてあるが、今は特に気になるものはない。" : "趣味の机。色々な物が置いてあるが、ハッキング対策にはならない。");
        }
    }
    else if (objId === 'desk-pc') {
        if (isFinal) {
            await showRoomDialogue("PCデスクだ。あの画面の向こうに、数万人の悪意が渦巻いている。");
            await showRoomDialogue("「現実に戻る」ボタンでここに来たが、結局あの画面から逃げることはできないのか...？");
            await showRoomDialogue("...いや。このPCを使って、ハッカーの正体を突き止める方法があるかもしれない。");
            const c = await showRoomChoices([
                {text: "PCでハッカーの正体を暴く", val: "runthrough"},
                {text: "PC画面に戻る", val: "pc"},
                {text: "離れる", val: "stay"}
            ]);
            if (c === 'runthrough') {
                isDialogueRunning = false;
                await triggerEnding('runthrough');
                return;
            } else if (c === 'pc') {
                document.getElementById('room-view').style.display = 'none';
                document.getElementById('desktop').style.display = 'block';
                isDialogueRunning = false;
                isRoomExplorable = true;
                return;
            }
        } else if (gameState.day === 1) {
            await showRoomDialogue("自分のPCデスクだ。今日はもうPCを触る気になれない。");
        } else {
            if (isWifiOff) {
                await showRoomDialogue("PCデスクだ。今は起動してデスクトップ画面が表示されている。");
            } else {
                await showRoomDialogue("PCデスクだ。ハッカーに制御を奪われていて、全く操作を受け付けない。");
                await showRoomDialogue("外部からのアクセスをどうにかして遮断しないと、何もできない...");
                await showRoomDialogue("PCの角をたたいてみるか...？治るとは思えないが...");
                const c = await showRoomChoices([{text: "叩いてみる", val: "hit"}, {text: "やめておく", val: "leave"}]);
                if (c === 'hit') { await showRoomDialogue("（バコンッ！）"); await showRoomDialogue("...何も起きない。やはり叩いて治るような代物ではないようだ。"); }
                else await showRoomDialogue("精密機械だ、やめておこう。");
            }
        }
    } else if (objId === 'door') {
        if (isFinal) {
            await showRoomDialogue("ドアだ。廊下から誰かの笑い声が聞こえる気がする。");
            await showRoomDialogue("外に出れば助かるのか？ それとも、外の世界もすでに敵なのか...。");
            const c = await showRoomChoices([
                {text: "警察に通報しに行く", val: "police"},
                {text: "やめておく", val: "stay"}
            ]);
            if (c === 'police') {
                isDialogueRunning = false;
                await startHallwaySequence();
                return;
            }
        } else if (isHackingExploration) {
            await showRoomDialogue("ドアだ。鍵はかかっているはずなのに、誰かに見られている気がする。");
        } else if (gameState.day === 1) {
            await showRoomDialogue("ドアだ。特に変わったところはない。");
            await showRoomDialogue("外に出ても解決しないだろう。今日はもう休おう。");
        } else {
            await showRoomDialogue("ドアだ。外に出ても解決しないだろう。");
            await showRoomDialogue("...いや。外に出てみるか？いっそ。");
            const c = await showRoomChoices([{text: "外に出る", val: "out"}, {text: "部屋に残る", val: "stay"}]);
            if (c === 'out') {
                await showAnimatedBlackout("リフレッシュ中", 3000);
                await showRoomDialogue("外の空気を吸って少し気分が晴れた。だが、PCの問題はまだ残っている。");
            } else await showRoomDialogue("今は部屋で何とかしないと。");
        }
    } else if (objId === 'closet') {
        if (isFinal) {
            await showRoomDialogue("クローゼットだ。この中に隠れたところで、ネットの視線からは逃げられない。");
            await showRoomDialogue("俺の居場所は、もう世界中に知れ渡っているんだから。");
        } else if (isHackingExploration) {
            await showRoomDialogue("クローゼットだ。隠れても無駄な気がする。");
        } else {
            await showRoomDialogue("クローゼットだ。服がしまってある。");
            if (gameState.day >= 2) {
                await showRoomDialogue("服を着替えてみるか...？何かが変わるかもしれない。");
                const c = await showRoomChoices([{text: "着替える", val: "change"}, {text: "やめておく", val: "leave"}]);
                if (c === 'change') {
                    await showAnimatedBlackout("着替え中", 2000);
                    await showRoomDialogue("...まあ、何も起きないか。");
                } else await showRoomDialogue("今はそんな気分じゃない。");
            }
        }
    } else if (objId === 'shelf') {
        if (isFinal) {
            await showRoomDialogue("Wi-Fiルーターだ。電源は切れているのに、PCは繋がっている。");
            await showRoomDialogue("論理的な説明なんてつかない。これは、もっと別の「何か」だ。");
        } else if (isHackingExploration) {
            if (gameState.routerShielded) {
                await showRoomDialogue("Wi-Fiルーターだ。透明な金属のようなもので覆われていて、触ることすらできない。");
                await showRoomDialogue("コンセントの部分まで完全に固められている...。");
            } else {
                await showRoomDialogue("Wi-Fiルーターだ。不気味にランプが点滅している。");
                const c = await showRoomChoices([
                    {text: "ルーターを捨てる", val: "discard"},
                    {text: "ルーターの電源を切る", val: "off"},
                    {text: "そのままにする", val: "leave"}
                ]);
                if (c === 'discard') {
                    isDialogueRunning = false;
                    await triggerFakeDiscardEnding();
                    return;
                } else if (c === 'off') {
                    await showRoomDialogue("（プツッ...）");
                    await showRoomDialogue("ルーターの電源を切った。");
                    await showRoomDialogue("「ふぅ。これで一旦は安心か...？」");
                    await sleep(1000);
                    SoundManager.beep(800, 0.2);
                    await showRoomDialogue("（ピッ！）");
                    await showRoomDialogue("「えっ...！？ 勝手に電源が入った！？」");
                    await showRoomDialogue("何度やっても、勝手に電源が入ってしまうようだ。");
                }
            }
        } else if (gameState.day === 1) {
            await showRoomDialogue("棚・引き出しだ。上にWi-Fiルーターが置かれている。");
            await showRoomDialogue("ランプは正常に点滅している。今は触る必要はないだろう。");
        } else {
            if (!isWifiOff) {
                await showRoomDialogue("棚・引き出しだ。上にWi-Fiルーターが置かれている。");
                if (gameState.routerShielded) {
                    await showRoomDialogue("「...ハッカーの干渉を断つには、これの電源を落とせばいいのか？」");
                    await showRoomDialogue("...だが、周りが不気味に発光している金属に覆われているせいで電源ボタンは押せないだろう。");
                    const c = await showRoomChoices([
                        {text: "金属をフライパンで叩いてみる", val: "pan"},
                        {text: "もう少しルーターの周りを調べてみる", val: "search"}
                    ]);
                    if (c === 'pan') {
                        await showRoomDialogue("「よしっ。このフライパンで力いっぱい叩けば、ひびくらい入るはずだ！」");
                        await showRoomDialogue("「えいっ！！」");
                        // 衝撃音再生
                        SoundManager.playShieldImpact();
                        // 画面揺らし演出
                        const roomView = document.getElementById('room-view');
                        if (roomView) {
                            roomView.classList.add('shake-vertical');
                            setTimeout(() => roomView.classList.remove('shake-vertical'), 500);
                        }
                        
                        await showRoomDialogue("（ガギィィン！！）");
                        await showRoomDialogue("「うわっ、手が痺れる……。たたいても傷一つついていない。どうすれば電源を切れるんだ...。」");
                    } else if (c === 'search') {
                        await showRoomDialogue("「いったん落ち着いて、周りを詳しく調べてみるか。何か別の方法があるかもしれない。」");
                        await showRoomDialogue("「（ゴソゴソ……）」");
                        await showRoomDialogue("「...！？ こんなところに、遠隔で操作できる物理スイッチが隠れてる！？ これならいけるかも……！」");
                        await showRoomDialogue("（カチッ）");
                        await showRoomDialogue("「よし、これで電源は落ちたはずだ。外部からのアクセスは遮断されたはず……！」");
                        isWifiOff = true;
                        if (gameState.isHackingSequenceRunning) {
                            gameState.isHackingSequenceRunning = false;
                            document.getElementById('virus-timer').style.display = 'none';
                            document.getElementById('btn-return-reality').style.display = 'none';
                        }
                        await showRoomDialogue("「...ウィィィン」"); await showRoomDialogue("PCの方から起動音が聞こえた！再起動したようだ。");
                        // フェーズを進めてからウィンドウを閉じる（abortScenarioの誤発動を防止）
                        scenarioPhase = 2;
                        Object.keys(openedApps).forEach(id => closeWindow(id));
                        document.getElementById('room-view').style.display = 'none'; document.getElementById('desktop').style.display = 'block';
                        setNetworkStatus(false);
                        isDialogueRunning = false;
                        await playDesktopSequence(); return;
                    }
                } else {
                    await showRoomDialogue("「...ハッカーの干渉を断つには、これの電源を落とせばいいのか？」");
                    const c = await showRoomChoices([{text: "ルーターの電源を切る", val: "off"}, {text: "そのままにする", val: "leave"}]);
                    if (c === 'off') {
                        await showRoomDialogue("（プツッ...）"); await showRoomDialogue("ルーターの電源を切った。これで外部からのアクセスは遮断されたはずだ。");
                        isWifiOff = true; 
                        if (gameState.isHackingSequenceRunning) {
                            gameState.isHackingSequenceRunning = false;
                            document.getElementById('virus-timer').style.display = 'none';
                            document.getElementById('btn-return-reality').style.display = 'none';
                        }
                        await showRoomDialogue("「...ウィィィン」"); await showRoomDialogue("PCの方から起動音が聞こえた！再起動したようだ。");
                        // フェーズを進めてからウィンドウを閉じる（abortScenarioの誤発動を防止）
                        scenarioPhase = 2;
                        Object.keys(openedApps).forEach(id => closeWindow(id));
                        document.getElementById('room-view').style.display = 'none'; document.getElementById('desktop').style.display = 'block';
                        setNetworkStatus(false);
                        isDialogueRunning = false;
                        await playDesktopSequence(); return;
                    } else await showRoomDialogue("今は触らないでおこう。");
                }
            } else {
                await showRoomDialogue("Wi-Fiルーターの電源は切してある。");
            }
        }
    } else if (objId === 'window') {
        if (isFinal) {
            await showRoomDialogue("窓だ。ここからPCを投げ捨てれば...すべてを終わりにできるだろうか。");
            const c = await showRoomChoices([{text: "PCを窓から投げ捨てる", val: "throw"}, {text: "やめておく", val: "stay"}]);
            if (c === 'throw') {
                isDialogueRunning = false;
                await triggerEnding('throw');
                return;
            }
        } else if (isHackingExploration) {
            await showRoomDialogue("窓だ。外は静かだが、俺の心臓はうるさいほど高鳴っている。");
        } else {
            await showRoomDialogue("窓だ。外は暗い...。");
            if (gameState.day >= 2) await showRoomDialogue("ここからPCを投げ捨てたら...全部終わるのかな。");
        }
    }
    isDialogueRunning = false;
    isRoomExplorable = true; 
    document.getElementById('room-dialogue').innerHTML = "（部屋の気になる場所をクリックして調べよう）";
};

// 現実を調べるボタンの処理
window.triggerReturnReality = () => {
    if (isDialogueRunning || isBlockAllInteraction) return;
    SoundManager.beep(600, 0.1);
    document.getElementById('desktop').style.display = 'none';
    document.getElementById('room-view').style.display = 'flex';
    isRoomExplorable = true;
    document.getElementById('room-dialogue').innerHTML = "（部屋の気になる場所をクリックして調べよう）";
};

async function transitionToDay2Room() {
    lockSave();
    isBlockAllInteraction = true;
    SoundManager.glitch(0.5, 2.0);
    document.body.style.animation = 'glitch-anim 0.1s infinite';
    await sleep(1500);
    
    const blackout = document.getElementById('blackout');
    blackout.style.display = 'flex';
    blackout.innerHTML = `<div class="blackout-text" style="color:#ff0000; font-family:monospace;">FATAL ERROR: ACCESS DENIED</div>`;
    SoundManager.thud();
    await sleep(2000);
    blackout.style.display = 'none';
    document.body.style.animation = '';
    
    document.getElementById('desktop').style.display = 'none';
    document.getElementById('room-view').style.display = 'flex';
    await playRoomSequence();
    unlockSave();
}

// Day1: 部屋への遷移
async function triggerDay1RoomTransition() {
    if (isDialogueRunning) return;
    lockSave();
    isDialogueRunning = true;
    const win = openWindow('notepad', 'これだけは絶対に見るな.txt');
    if (win) {
        const display = win.querySelector('.notepad-display');
        display.innerHTML = `【極秘】問題のあるデータの安全な入手手順\n\n1. 海外のVPNを経由し、身元を隠蔽する。\n2. DarkWebの専用掲示板へアクセス。\n3. 仮想通貨を用いて...`;
    }
    await sleep(800);
    SoundManager.glitch(0.3, 1.5);
    if (win) {
        const display = win.querySelector('.notepad-display');
        display.innerHTML = `<span class="black-bar" style="background:#000; color:#000; display:block; padding:20px; font-weight:bold;">検閲済み：法律により保護されたコンテンツ</span>`;
        document.body.style.filter = `invert(1)`;
        setTimeout(() => document.body.style.filter = '', 150);
    }
    await sleep(1000);
    isDialogueRunning = false;
    Object.keys(openedApps).forEach(id => closeWindow(id));
    document.getElementById('desktop').style.display = 'none';
    document.getElementById('room-view').style.display = 'flex';
    isRoomExplorable = false;
    await sleep(500); SoundManager.knock(); await sleep(1500);
    await showRoomDialogue("...なんだ今のファイルは...。");
    await showRoomDialogue("...それに、今、ドアの方からノックの音がしなかったか？");
    await showRoomDialogue("気のせいか...？でも、なんだか嫌な感じがする。");
    await showRoomDialogue("疲れたな...今日はもう寝るか。");
    isRoomExplorable = true;
    document.getElementById('room-dialogue').innerHTML = "（ベッドをクリックして寝よう）";
    unlockSave();
}

// ---------------------------------------------------------
// サウンド管理
// ---------------------------------------------------------
const SoundManager = {
    ctx: null,
    cache: {},
    init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    getSEVol() { return (gameState.seVolume / 100) * 0.8; }, // ベース音量を少し抑えめに調整
    
    // 外部音声ファイルを読み込むヘルパー
    async loadAudio(url) {
        if (this.cache[url]) return this.cache[url];
        this.init();
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            this.cache[url] = audioBuffer;
            return audioBuffer;
        } catch (e) {
            console.warn("Audio file load failed, using fallback:", url);
            return null;
        }
    },

    beep(freq = 440, duration = 0.1, type = 'sine', vol = 0.03) {
        this.init(); const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = type; osc.frequency.value = freq; gain.gain.setValueAtTime(vol * this.getSEVol(), this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + duration);
    },
    glitch(duration = 0.05, volScale = 1.0) {
        this.init(); const bufferSize = this.ctx.sampleRate * duration; const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource(); noise.buffer = buffer;
        const gain = this.ctx.createGain(); gain.gain.value = 0.05 * this.getSEVol() * volScale;
        const filter = this.ctx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 1000;
        noise.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
        noise.start();
    },
    thud() {
        this.init(); const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(150, this.ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.1 * this.getSEVol(), this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.5);
    },
    horrorImpact() {
        this.init();
        const now = this.ctx.currentTime;
        const masterVol = this.getSEVol() * 1.5; // 音量ブーストを3倍→1.5倍に調整
        
        // 1. 地響きのような超低音 (Deep Sub)
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(60, now);
        sub.frequency.exponentialRampToValueAtTime(10, now + 3.0);
        subGain.gain.setValueAtTime(0.4 * masterVol, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
        sub.connect(subGain); subGain.connect(this.ctx.destination);
        
        // 2. 金属的な不協和音 (Metalic Dissonance)
        [150, 155, 162, 220, 440].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = (i % 2 === 0) ? 'sawtooth' : 'square'; // 攻撃的な波形
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.linearRampToValueAtTime(freq * 0.5, now + 1.5);
            g.gain.setValueAtTime(0.1 * masterVol, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
            osc.connect(g); g.connect(this.ctx.destination);
            osc.start(); osc.stop(now + 2.0);
        });

        // 3. 爆発的なホワイトノイズ (Explosive Noise)
        const bufSize = this.ctx.sampleRate * 1.0;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buf;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.2 * masterVol, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        
        // フィルターで音を鋭くする
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        noise.connect(filter); filter.connect(nGain); nGain.connect(this.ctx.destination);

        sub.start(); sub.stop(now + 3.0);
        noise.start();
    },
    type() {
        this.init(); const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = 'square'; osc.frequency.value = 400 + Math.random() * 200;
        gain.gain.setValueAtTime(0.02 * this.getSEVol(), this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.03);
    },
    async knock() {
        this.init();
        const url = 'assets/se/木のドアをノック2.mp3';
        
        // ローカル環境(file://)でも確実に再生できる方式に切り替え
        const audio = new Audio(url);
        audio.volume = Math.min(1.0, this.getSEVol() * 2.0);
        
        audio.play().catch(e => {
            console.warn("Audio file play failed, using fallback:", e);
            // ファイルがない、または読み込めない場合のバックアップ（生成音）
            [0, 350, 700].forEach(delay => {
                setTimeout(() => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.18);
                    gain.gain.setValueAtTime(0.18 * this.getSEVol(), this.ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
                    osc.connect(gain); gain.connect(this.ctx.destination);
                    osc.start(); osc.stop(this.ctx.currentTime + 0.25);
                }, delay);
            });
        });
    },

    playCustomSE(url, rate = 1.0) {
        try {
            const audio = new Audio(url);
            audio.playbackRate = rate;
            audio.volume = Math.min(1.0, this.getSEVol());
            audio.play().catch(e => {
                console.warn("Custom SE play failed (async):", e);
            });
        } catch (e) {
            console.warn("Custom SE play failed (sync):", e);
        }
    },

    playShieldImpact() {
        const url = 'assets/se/盾で防御.mp3';
        // file://プロトコルではfetchがCORSエラーになるので、直接playCustomSEを使用
        if (location.protocol === 'file:') {
            this.playCustomSE(url, 0.6);
            return;
        }
        if (!this.ctx) this.init();
        fetch(url).then(res => res.arrayBuffer()).then(buf => this.ctx.decodeAudioData(buf)).then(audioBuf => {
            const source = this.ctx.createBufferSource();
            source.buffer = audioBuf;
            source.playbackRate.value = 0.6;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 800;
            const delay = this.ctx.createDelay();
            delay.delayTime.value = 0.15;
            const feedback = this.ctx.createGain();
            feedback.gain.value = 0.4;
            const wet = this.ctx.createGain();
            wet.gain.value = 0.4;
            source.connect(filter);
            filter.connect(this.ctx.destination);
            filter.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay);
            delay.connect(wet);
            wet.connect(this.ctx.destination);
            source.start(0);
        }).catch(e => {
            console.warn("Shield SE Web Audio failed, falling back to playCustomSE:", e);
            this.playCustomSE(url, 0.6);
        });
    }
};

// ---------------------------------------------------------
// 環境音（アンビエント）管理
// ---------------------------------------------------------
const AmbientManager = {
    nodes: [],
    masterGain: null,
    currentDay: 0,
    active: false,

    init() { SoundManager.init(); },

    play(day) {
        this.stop();
        this.init();
        this.currentDay = day;
        this.active = true;

        const ctx = SoundManager.ctx;
        this.masterGain = ctx.createGain();
        this.updateVolume();
        this.masterGain.connect(ctx.destination);
        this.nodes.push(this.masterGain);

        if (day === 1) {
            this.createDrone(ctx, this.masterGain, 55, 'sine', 0.1);
            this.createNoise(ctx, this.masterGain, 0.005, 0.5);
        } else if (day === 2) {
            this.createDrone(ctx, this.masterGain, 50, 'sine', 0.15);
            this.createDrone(ctx, this.masterGain, 52, 'sine', 0.15);
            this.createNoise(ctx, this.masterGain, 0.01, 0.2); 
        } else if (day === 3) {
            this.createDrone(ctx, this.masterGain, 40, 'triangle', 0.2);
            this.createDrone(ctx, this.masterGain, 41, 'triangle', 0.2);
            this.createPulse(ctx, this.masterGain, 60, 0.8);
        }
    },

    updateVolume() {
        if (!this.masterGain || !SoundManager.ctx) return;
        const vol = (gameState.bgmVolume / 100) * 0.4; // ベース音量調整
        this.masterGain.gain.setTargetAtTime(vol, SoundManager.ctx.currentTime, 0.1);
    },

    createDrone(ctx, dest, freq, type, vol) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = vol;
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        this.nodes.push(osc, gain);
    },

    createNoise(ctx, dest, vol, hpFreq) {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = hpFreq * 2000;

        const gain = ctx.createGain();
        gain.gain.value = vol;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        noise.start();
        this.nodes.push(noise, filter, gain);
    },

    createPulse(ctx, dest, freq, interval) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.value = 0;
        
        osc.connect(gain);
        gain.connect(dest);
        osc.start();

        const pulse = () => {
            if (!this.active) return;
            const now = ctx.currentTime;
            gain.gain.cancelScheduledValues(now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.exponentialRampToValueAtTime(0.1, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            setTimeout(pulse, interval * 1000);
        };
        pulse();
        this.nodes.push(osc, gain);
    },

    stop() {
        this.active = false;
        if (this.nodes.length > 0) {
            this.nodes.forEach(node => {
                try {
                    if (node.stop) node.stop();
                    node.disconnect();
                } catch (e) {}
            });
        }
        this.nodes = [];
        this.masterGain = null;
    }
};

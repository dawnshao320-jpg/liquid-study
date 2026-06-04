/* =========================================================
   AudioEngine v3
   · 音乐：生成式，8 种区分度更大的风格
   · 环境声：真实录音(Google 免费音效库，CORS 开放) 经 Web Audio
            处理 —— 每层可独立增益(可>1 放大) + 可选低通(隔窗降噪)
            不支持 .ogg 的浏览器(Safari) 自动回退到合成环境声
   ========================================================= */
const AudioEngine = (() => {
  const OGG_OK = (() => { try { return !!document.createElement('audio').canPlayType('audio/ogg; codecs="vorbis"'); } catch { return false; } })();
  const SND = (p) => `https://actions.google.com/sounds/v1/${p}`;

  let ctx = null, built = false, running = false;
  let master, musicBus, musicLP, reverb, reverbGain, beatBus, ambMaster;
  let pads = [], timers = { chord: null, melody: null, beat: null }, chordIdx = 0;
  let musicVol = 0.42, ambVol = 0.55, presetIdx = 0, musicPaused = false;

  // 合成回退环境声
  let gBus, gNoise = {}, gHP, gLP, gSwell, gLFO, gLFODepth, gBuilt = false;
  // 文件环境声（Web Audio）
  let ambLayers = [], curSceneKey = null, lastScene = null;

  const A4 = 440, mtof = (m) => A4 * Math.pow(2, (m - 69) / 12);

  /* ---------------- 8 种音乐风格（拉大区分度） ---------------- */
  const MUSIC = [
    { id:'piano',  name:'静谧钢琴', en:'Still Piano',
      chords:[[48,52,55,59],[45,48,52,55],[41,45,48,52],[43,47,50,54]],
      penta:[72,74,76,79,81,84], w1:'sine', w2:'sine',
      chordMs:9000, melMin:2800, melMax:5400, melProb:0.7, rev:0.6, lp:2600, peak:0.085, beat:null },
    { id:'lofi',   name:'暖阳 Lo-Fi', en:'Warm Lo-Fi',
      chords:[[41,45,48,52],[43,47,50,55],[45,48,52,57],[40,43,47,52]],
      penta:[69,72,74,77,79,81], w1:'triangle', w2:'sine',
      chordMs:5200, melMin:1900, melMax:3000, melProb:0.7, rev:0.38, lp:2000, peak:0.07, beat:{gap:1380, kick:0.16, tick:true} },
    { id:'ambient',name:'空灵氛围', en:'Ethereal Drift',
      chords:[[45,52,57,64],[43,50,55,62],[41,48,55,60],[40,47,52,59]],
      penta:[76,79,81,83,86,88], w1:'sine', w2:'sine',
      chordMs:15000, melMin:5000, melMax:9000, melProb:0.55, rev:0.78, lp:3200, peak:0.095, beat:null },
    { id:'forest', name:'森林冥想', en:'Forest Calm',
      chords:[[50,57,62,66],[48,55,60,64],[45,52,57,61],[43,50,55,59]],
      penta:[74,76,78,81,83,86], w1:'triangle', w2:'triangle',
      chordMs:7000, melMin:1700, melMax:3000, melProb:0.72, rev:0.5, lp:2400, peak:0.062, beat:null },
    { id:'jazz',   name:'雨夜爵士', en:'Night Jazz',
      chords:[[45,48,52,55,59],[50,53,57,60,64],[43,47,50,53,57],[40,44,47,52,55]],
      penta:[69,72,74,76,79,81], w1:'sine', w2:'triangle',
      chordMs:6000, melMin:2000, melMax:3400, melProb:0.75, rev:0.45, lp:2050, peak:0.06, beat:{gap:1500, kick:0.1, tick:false} },
    { id:'sunrise',name:'晨光协奏', en:'Sunrise',
      chords:[[52,56,59,64],[50,54,57,62],[48,52,55,60],[47,50,55,59]],
      penta:[76,78,80,83,85,88], w1:'sine', w2:'triangle',
      chordMs:6500, melMin:1300, melMax:2400, melProb:0.85, rev:0.55, lp:2800, peak:0.07, beat:null },
    { id:'deep',   name:'深海低吟', en:'Deep Current',
      chords:[[33,40,45,52],[31,38,43,50],[36,43,48,55],[34,41,46,53]],
      penta:[60,62,65,67,69], w1:'sine', w2:'sine',
      chordMs:16000, melMin:7000, melMax:12000, melProb:0.4, rev:0.82, lp:1300, peak:0.11, beat:null },
    { id:'city',   name:'City 律动', en:'City Beat',
      chords:[[45,48,52,55],[50,53,57,60],[43,47,50,53],[48,52,55,58]],
      penta:[72,75,77,79,82], w1:'triangle', w2:'sine',
      chordMs:4000, melMin:1100, melMax:2000, melProb:0.8, rev:0.3, lp:2200, peak:0.06, beat:{gap:1000, kick:0.2, tick:true} },
  ];
  const preset = () => MUSIC[presetIdx];

  /* ---------------- 合成回退配方 ---------------- */
  const GEN = {
    forest:{ color:'pink',  hp:220, lp:3200, base:0.9,  depth:0.10, lfo:0.10 },
    rain:  { color:'white', hp:600, lp:6800, base:1.0,  depth:0.06, lfo:0.30 },
    waves: { color:'brown', hp:90,  lp:900,  base:0.6,  depth:0.42, lfo:0.085 },
    wind:  { color:'brown', hp:120, lp:700,  base:0.7,  depth:0.30, lfo:0.06 },
    night: { color:'brown', hp:80,  lp:520,  base:0.95, depth:0.15, lfo:0.05 },
    snow:  { color:'white', hp:480, lp:2600, base:0.8,  depth:0.22, lfo:0.08 },
    city:  { color:'brown', hp:140, lp:620,  base:0.8,  depth:0.18, lfo:0.05 },
    stream:{ color:'white', hp:300, lp:3000, base:0.85, depth:0.12, lfo:0.18 },
  };

  function noiseBuffer(color) {
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    if (color === 'white') { for (let i=0;i<len;i++) d[i]=Math.random()*2-1; }
    else if (color === 'pink') {
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
      for (let i=0;i<len;i++){ const w=Math.random()*2-1;
        b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759; b2=0.96900*b2+w*0.1538520;
        b3=0.86650*b3+w*0.3104856; b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
        d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6=w*0.115926; }
    } else { let last=0; for (let i=0;i<len;i++){ const w=Math.random()*2-1; last=(last+0.02*w)/1.02; d[i]=last*3.5; } }
    return buf;
  }
  function impulse(sec, decay) {
    const len = ctx.sampleRate*sec, buf = ctx.createBuffer(2,len,ctx.sampleRate);
    for (let c=0;c<2;c++){ const d=buf.getChannelData(c); for (let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,decay); }
    return buf;
  }

  /* ---------------- 构建 ---------------- */
  function build() {
    if (built) return;
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = musicPaused ? 0 : musicVol; musicBus.connect(master);
    musicLP = ctx.createBiquadFilter(); musicLP.type='lowpass'; musicLP.frequency.value=preset().lp; musicLP.Q.value=0.4; musicLP.connect(musicBus);
    reverb = ctx.createConvolver(); reverb.buffer = impulse(3.2,2.6);
    reverbGain = ctx.createGain(); reverbGain.gain.value = preset().rev; reverb.connect(reverbGain); reverbGain.connect(musicBus);
    beatBus = ctx.createGain(); beatBus.gain.value = 0.9; beatBus.connect(master);
    ambMaster = ctx.createGain(); ambMaster.gain.value = ambVol; ambMaster.connect(master);
    built = true;
  }
  function buildGen() {
    if (gBuilt) return;
    gBus = ctx.createGain(); gBus.gain.value = ambVol; gBus.connect(master);
    gSwell = ctx.createGain(); gSwell.gain.value = 0.85; gSwell.connect(gBus);
    gLP = ctx.createBiquadFilter(); gLP.type='lowpass'; gLP.frequency.value=1800; gLP.connect(gSwell);
    gHP = ctx.createBiquadFilter(); gHP.type='highpass'; gHP.frequency.value=200; gHP.connect(gLP);
    ['white','pink','brown'].forEach(c=>{ const s=ctx.createBufferSource(); s.buffer=noiseBuffer(c); s.loop=true;
      const g=ctx.createGain(); g.gain.value=0; s.connect(g); g.connect(gHP); s.start(); gNoise[c]={s,g}; });
    gLFO = ctx.createOscillator(); gLFO.type='sine'; gLFO.frequency.value=0.1;
    gLFODepth = ctx.createGain(); gLFODepth.gain.value=0.1; gLFO.connect(gLFODepth); gLFODepth.connect(gSwell.gain); gLFO.start();
    gBuilt = true;
  }
  function applyGen(type, instant) {
    if (!gBuilt) return;
    const c = GEN[type] || GEN.forest, now = ctx.currentTime, tc = instant ? 0.01 : 1.0;
    ['white','pink','brown'].forEach(k=> gNoise[k].g.gain.setTargetAtTime(k===c.color?0.9:0, now, tc));
    gHP.frequency.setTargetAtTime(c.hp, now, tc); gLP.frequency.setTargetAtTime(c.lp, now, tc);
    gSwell.gain.setTargetAtTime(c.base, now, tc); gLFO.frequency.setTargetAtTime(c.lfo, now, tc); gLFODepth.gain.setTargetAtTime(c.depth, now, tc);
  }

  /* ---------------- 音乐：和弦垫 / 点缀 / 拍点 ---------------- */
  function playPad(chord) {
    const now = ctx.currentTime, P = preset(), h = { oscs:[], gains:[] };
    chord.forEach((m,i)=>{ [0,1].forEach(k=>{
      const o=ctx.createOscillator(); o.type=k?P.w2:P.w1; o.frequency.value=mtof(m+12);
      o.detune.value=(k?6:-6)+(Math.random()*6-3);
      const g=ctx.createGain(); g.gain.value=0; o.connect(g); g.connect(musicLP); g.connect(reverb);
      const peak=(i===0?P.peak:P.peak*0.7)/(k?2:1);
      g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(peak, now+2.6);
      o.start(now); h.oscs.push(o); h.gains.push(g);
    });});
    const b=ctx.createOscillator(); b.type='sine'; b.frequency.value=mtof(chord[0]-12);
    const bg=ctx.createGain(); bg.gain.value=0; b.connect(bg); bg.connect(musicBus);
    bg.gain.setValueAtTime(0,now); bg.gain.linearRampToValueAtTime(0.06, now+2.6);
    b.start(now); h.oscs.push(b); h.gains.push(bg);
    return h;
  }
  function releasePad(h, rel=3) { if(!h) return; const now=ctx.currentTime;
    h.gains.forEach(g=>{ g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value,now); g.gain.linearRampToValueAtTime(0,now+rel); });
    h.oscs.forEach(o=>{ try{o.stop(now+rel+0.2);}catch(e){} }); }
  function nextChord() {
    const P = preset(), chord = P.chords[chordIdx % P.chords.length];
    pads.push(playPad(chord));
    if (pads.length>1) releasePad(pads.shift(), 3);
    chordIdx++; timers.chord = setTimeout(nextChord, P.chordMs);
  }
  function melodyTick() {
    const P = preset();
    if (Math.random()<P.melProb) {
      const midi = P.penta[Math.floor(Math.random()*P.penta.length)] - (Math.random()<0.4?12:0), now=ctx.currentTime;
      const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=mtof(midi);
      const g=ctx.createGain(); g.gain.value=0; o.connect(g); g.connect(musicLP); g.connect(reverb);
      g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(0.12,now+0.02); g.gain.exponentialRampToValueAtTime(0.0008,now+2.4);
      o.start(now); o.stop(now+2.6);
    }
    timers.melody = setTimeout(melodyTick, P.melMin + Math.random()*(P.melMax-P.melMin));
  }
  function beatTick() {
    const P = preset(), B = P.beat;
    if (B) { const now=ctx.currentTime;
      const o=ctx.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(98,now); o.frequency.exponentialRampToValueAtTime(46,now+0.12);
      const g=ctx.createGain(); g.gain.value=0; o.connect(g); g.connect(beatBus);
      g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(B.kick,now+0.01); g.gain.exponentialRampToValueAtTime(0.001,now+0.3);
      o.start(now); o.stop(now+0.34);
      if (B.tick) { const t=now+B.gap/2000;       // 反拍轻击
        const o2=ctx.createOscillator(); o2.type='square'; o2.frequency.value=2400;
        const g2=ctx.createGain(); g2.gain.value=0; o2.connect(g2); g2.connect(beatBus);
        g2.gain.setValueAtTime(0,t); g2.gain.linearRampToValueAtTime(0.02,t+0.005); g2.gain.exponentialRampToValueAtTime(0.0005,t+0.05);
        o2.start(t); o2.stop(t+0.07);
      }
      timers.beat = setTimeout(beatTick, B.gap);
    } else { timers.beat = setTimeout(beatTick, 1500); }
  }
  function startMusicLoops() { stopMusicLoops(); chordIdx=0; nextChord(); timers.melody=setTimeout(melodyTick,1200); timers.beat=setTimeout(beatTick,800); }
  function stopMusicLoops() { Object.keys(timers).forEach(k=>{ clearTimeout(timers[k]); timers[k]=null; }); pads.forEach(p=>releasePad(p,1.2)); pads=[]; }
  function applyPreset() { if(!built) return; const P=preset(), now=ctx.currentTime;
    musicLP.frequency.setTargetAtTime(P.lp,now,0.3); reverbGain.gain.setTargetAtTime(P.rev,now,0.3); }

  /* ---------------- 文件环境声（Web Audio：增益/滤波/交叉淡入） ---------------- */
  function makeLayer(def) {
    const el = new Audio(SND(def.url)); el.loop = true; el.crossOrigin = 'anonymous'; el.preload = 'auto';
    let src;
    try { src = ctx.createMediaElementSource(el); } catch (e) { return null; }
    const g = ctx.createGain(); g.gain.value = 0;
    let node = src;
    if (def.lp) { const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=def.lp; lp.Q.value=0.5; src.connect(lp); node = lp; }
    node.connect(g); g.connect(ambMaster);
    el.play().catch(()=>{});
    return { el, src, g, gain: def.gain == null ? 1 : def.gain };
  }
  function setSceneFiles(defs, key) {
    if (key === curSceneKey) return; curSceneKey = key;
    const now = ctx.currentTime;
    const old = ambLayers;
    old.forEach(L => { L.g.gain.cancelScheduledValues(now); L.g.gain.setValueAtTime(L.g.gain.value, now); L.g.gain.linearRampToValueAtTime(0, now + 1.0);
      setTimeout(() => { try { L.el.pause(); L.src.disconnect(); L.g.disconnect(); L.el.src=''; } catch(e){} }, 1300); });
    ambLayers = (defs || []).map(d => makeLayer(d)).filter(Boolean);
    ambLayers.forEach(L => { L.g.gain.setValueAtTime(0, now); L.g.gain.linearRampToValueAtTime(L.gain, now + 1.2); });
  }

  /* ---------------- 公共 API ---------------- */
  return {
    musicList: () => MUSIC.map(m => ({ id:m.id, name:m.name, en:m.en })),
    oggSupported: () => OGG_OK,
    async start() {
      if (!ctx) { const AC = window.AudioContext||window.webkitAudioContext; if(!AC) return; ctx = new AC(); }
      if (ctx.state==='suspended') await ctx.resume();
      build();
      if (!running) { running = true; if (!musicPaused) startMusicLoops(); }
      if (lastScene) this.setScene(lastScene);
    },
    stop() {
      stopMusicLoops();
      const now = ctx ? ctx.currentTime : 0;
      ambLayers.forEach(L => { try { L.g.gain.cancelScheduledValues(now); L.g.gain.linearRampToValueAtTime(0, now+0.4); setTimeout(()=>{ try{L.el.pause(); L.src.disconnect();}catch(e){} }, 500); } catch(e){} });
      ambLayers = []; curSceneKey = null;
      if (master && ctx) master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
      running = false;
    },
    resumeMaster() { if (master && ctx) master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.4); },
    setMusic(v) { musicVol = v; if (musicBus && !musicPaused) musicBus.gain.setTargetAtTime(v, ctx.currentTime, 0.15); },
    setAmbience(v) { ambVol = v;
      if (OGG_OK) { if (ambMaster) ambMaster.gain.setTargetAtTime(v, ctx.currentTime, 0.15); }
      else if (gBus) gBus.gain.setTargetAtTime(v, ctx.currentTime, 0.15);
    },
    setScene(scene) {
      lastScene = scene;
      if (!ctx) return;
      if (OGG_OK) { if (running) setSceneFiles(scene.amb, scene.id); }
      else { buildGen(); applyGen(scene.gen || 'forest', !running); }
    },
    setMusicPreset(i) { presetIdx = Math.max(0, Math.min(MUSIC.length-1, i)); applyPreset(); if (running && !musicPaused) startMusicLoops(); },
    getMusicPreset() { return presetIdx; },
    pauseMusic() { musicPaused = true; stopMusicLoops(); if (musicBus) musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.3); },
    resumeMusic() { musicPaused = false; if (musicBus) musicBus.gain.setTargetAtTime(musicVol, ctx.currentTime, 0.3); if (running) startMusicLoops(); },
    isMusicPaused() { return musicPaused; },
    chime() {
      if (!ctx) return; const seq=[72,76,79,84], now=ctx.currentTime;
      seq.forEach((m,i)=>{ const t=now+i*0.16; const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=mtof(m);
        const g=ctx.createGain(); g.gain.value=0; o.connect(g); if(reverb)g.connect(reverb); g.connect(master);
        g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.18,t+0.02); g.gain.exponentialRampToValueAtTime(0.0006,t+1.8);
        o.start(t); o.stop(t+2); });
    },
    isRunning() { return running; }
  };
})();

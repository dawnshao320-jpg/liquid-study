/* =========================================================
   StudyWithMe AI — 应用逻辑 v2
   ========================================================= */
(() => {
  'use strict';
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get: (k, d) => { try { const v = localStorage.getItem('sw_' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem('sw_' + k, JSON.stringify(v)); } catch {} },
  };
  const rand = (a) => a[Math.floor(Math.random() * a.length)];

  /* ---------- 图片 ---------- */
  const imgUrl = (id, w = 2400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
  const HERO_IMG = '1469474968028-56623f02e42e';

  /* ---------- 场景（10 个，环境声各不相同） ---------- */
  const SCENES = [
    { id:'mist',  name:'晨雾山林', en:'Morning Mist',  desc:'晨光 · 薄雾 · 安静书桌', desc_en:'Dawn light, soft mist, a quiet desk', tag:'森林晨鸟', tag_en:'Forest birds', img:'1470071459604-3b5ec3a7fe05', gen:'forest',
      amb:[{url:'ambiences/spring_day_forest.ogg', gain:0.85}] },
    { id:'rain',  name:'雨落松林', en:'Rainy Pines',   desc:'细雨 · 湿润 · 低声环境', desc_en:'Fine rain, low and damp ambience', tag:'细雨声', tag_en:'Light rain', img:'1505765050516-f72dcac9c60e', gen:'rain',
      amb:[{url:'weather/light_rain.ogg', gain:0.9}] },
    { id:'lake',  name:'湖光山色', en:'Quiet Lake',    desc:'清风 · 湖面 · 开阔视野', desc_en:'Light breeze over an open lake', tag:'湖水微风', tag_en:'Lake breeze', img:'1501785888041-af3ef285b470', gen:'wind',
      amb:[{url:'water/water_lapping_wind.ogg', gain:0.85}] },
    { id:'sea',   name:'海边晨曦', en:'Seaside Dawn',  desc:'海风 · 蓝调 · 开阔视野', desc_en:'Sea breeze, blue tones, open horizon', tag:'海浪声', tag_en:'Ocean waves', img:'1507525428034-b723cf961d3e', gen:'waves',
      amb:[{url:'water/waves_crashing_on_rock_beach.ogg', gain:0.85}] },
    { id:'night', name:'星空旷野', en:'Starry Night',  desc:'星空 · 旷野 · 深度专注', desc_en:'Starry skies for deep focus', tag:'夏夜虫鸣', tag_en:'Night crickets', img:'1419242902214-272b3f66ee7a', gen:'night',
      amb:[{url:'ambiences/july_night.ogg', gain:0.85}] },
    { id:'snow',  name:'雪山静谧', en:'Snowy Peaks',   desc:'雪峰 · 清冷 · 纯净空气', desc_en:'Snowy peaks, crisp and pure', tag:'清冷风声', tag_en:'Cold wind', img:'1483728642387-6c3bdd6c93e5', gen:'snow',
      amb:[{url:'weather/wind.ogg', gain:0.7}] },
    { id:'woods', name:'雨落林间', en:'Rainy Woods',   desc:'细雨 · 松林 · 湿润空气', desc_en:'Rain through the pines, damp air', tag:'雨打树叶', tag_en:'Rain on leaves', img:'1490604001847-b712b0c2f967', gen:'rain',
      amb:[{url:'weather/rain_on_roof.ogg', gain:0.7},{url:'ambiences/summer_forest.ogg', gain:0.55}] },
    { id:'city',  name:'纽约夜窗', en:'Manhattan Night', desc:'夜色 · 玻璃幕墙 · 远处车流', desc_en:'Night city behind floor-to-ceiling glass', tag:'隔窗都市声', tag_en:'Muffled city', img:'1754766621748-2a96cbf56a1f', gen:'city',
      amb:[{url:'ambiences/distant_highway.ogg', gain:0.78},{url:'weather/room_tone_wind_blowing_long.ogg', gain:0.32}] },
    { id:'tokyo', name:'东京夜行', en:'Tokyo Night',   desc:'霓虹 · 街道 · 浪漫夜色', desc_en:'Neon streets and a romantic night', tag:'静夜微风', tag_en:'Quiet night', img:'1764418658791-771bb04efdcd', gen:'night',
      amb:[{url:'ambiences/outside_night.ogg', gain:0.72},{url:'weather/light_breeze.ogg', gain:0.3}] },
    { id:'jiangnan', name:'江南烟雨', en:'Misty Jiangnan', desc:'细雨 · 水雾 · 青瓦白墙', desc_en:'Drizzle, mist, water-town morning', tag:'雨声溪流', tag_en:'Rain & stream', img:'1769931446194-ede80f4a1719', gen:'rain',
      amb:[{url:'weather/light_rain.ogg', gain:0.6},{url:'water/small_stream_flowing.ogg', gain:0.5}] },
  ];
  const GALLERY = [
    '1470071459604-3b5ec3a7fe05','1505765050516-f72dcac9c60e','1501785888041-af3ef285b470',
    '1507525428034-b723cf961d3e','1419242902214-272b3f66ee7a','1483728642387-6c3bdd6c93e5',
    '1490604001847-b712b0c2f967','1754766621748-2a96cbf56a1f','1764418658791-771bb04efdcd',
    '1769931446194-ede80f4a1719','1426604966848-d7adac402bff','1439853949127-fa647821eba0',
    '1433086966358-54859d0ed716','1473773508845-188df298d2d1','1470770841072-f978cf4d019e',
    '1444703686981-a3abbc4d4fe3','1469474968028-56623f02e42e','1506744038136-46273834b3fb',
  ];

  /* ---------- 勉励语 ---------- */
  const PRAISE = {
    zh:[
      '你刚刚完成了一段高质量的专注，这份坚持值得骄傲。',
      '又一轮稳稳的专注，你正在变成更好的自己。',
      '了不起，你把分心挡在了门外，继续保持。',
      '每一次专注，都在为未来积蓄力量，你做得很好。',
      '认真的你最迷人，刚才的投入非常棒。',
      '你与目标的距离，又因这段专注缩短了一点。',
      '坚持到这一刻已经赢过了很多人，真的很棒。',
      '专注是一种温柔的自律，你掌握得越来越好了。',
      '为刚才心无旁骛的自己鼓掌，你值得。',
      '这一程你很专心，给自己一个肯定的微笑吧。',
    ],
    en:[
      'You just finished a focused stretch — be proud of that.',
      "Another solid round. You're becoming a better you.",
      'You kept distraction at the door. Keep it up.',
      'Every focused minute stores energy for your future.',
      'Focused you is the best you. That was great work.',
      'You just closed a little more distance to your goal.',
      'Making it this far already beats most. Well done.',
      "Focus is gentle discipline — and you're mastering it.",
      'Applaud the you who stayed undistracted. You earned it.',
      'You were truly present. Give yourself a quiet smile.',
    ],
  };

  /* ---------- 状态 ---------- */
  let lang = store.get('lang', 'zh');
  let selectedSceneId = store.get('scene', 'mist');
  let currentView = 'hero';
  const sceneById = (id) => SCENES.find(s => s.id === id) || SCENES[0];

  /* =========================================================
     背景交叉淡入
     ========================================================= */
  const layersEl = [$('.bg__layer--a'), $('.bg__layer--b')];
  let activeLayer = 0;
  function setBackground(id) {
    const url = imgUrl(id), next = (activeLayer + 1) % 2, img = new Image();
    img.onload = () => {
      layersEl[next].style.backgroundImage = `url("${url}")`;
      layersEl[next].classList.add('is-active');
      layersEl[activeLayer].classList.remove('is-active');
      activeLayer = next;
    };
    img.onerror = () => {};
    img.src = url;
  }

  /* =========================================================
     首屏加载
     ========================================================= */
  function boot() {
    const first = new Image();
    const done = () => {
      layersEl[0].style.backgroundImage = `url("${imgUrl(HERO_IMG)}")`;
      layersEl[0].classList.add('is-active');
      document.body.classList.remove('loading');
      setTimeout(revealView, 250);
    };
    first.onload = done; first.onerror = done; first.src = imgUrl(HERO_IMG);
    setTimeout(() => { if (document.body.classList.contains('loading')) done(); }, 4000);
  }
  function revealView() {
    const view = $('.view.is-active') || $('#view-hero');
    $$('.reveal', view).filter(e => !e.classList.contains('in')).forEach((el, i) => setTimeout(() => el.classList.add('in'), 80 * i));
  }

  /* =========================================================
     视图切换
     ========================================================= */
  const VIEW_EL = { hero: $('#view-hero'), setup: $('#view-setup'), room: $('#view-room') };
  function showView(name) {
    if (name === currentView) return;
    const from = VIEW_EL[currentView], to = VIEW_EL[name];
    document.body.classList.toggle('view-room', name === 'room');
    document.body.classList.toggle('view-hero', name === 'hero');
    to.hidden = false; void to.offsetWidth; to.classList.add('is-active');
    if (from) { from.classList.remove('is-active'); setTimeout(() => { if (!from.classList.contains('is-active')) from.hidden = true; }, 700); }
    currentView = name; setTimeout(revealView, 60);
  }

  /* =========================================================
     场景卡片
     ========================================================= */
  function sceneCardHTML(s) {
    const desc = lang === 'en' ? s.desc_en : s.desc, tag = lang === 'en' ? s.tag_en : s.tag, name = lang === 'en' ? s.en : s.name;
    return `<button class="scene-card sheen ${s.id === selectedSceneId ? 'is-active' : ''}" data-scene="${s.id}">
        <div class="scene-card__img" style="background-image:url('${imgUrl(s.img, 900)}')"></div>
        <div class="scene-card__shade"></div><span class="scene-card__tag">SCENE</span>
        <div class="scene-card__body"><h3>${name}</h3><p class="sc-desc">${desc}</p><p class="sc-sub">${tag}</p></div>
        <div class="scene-card__ring"></div></button>`;
  }
  function renderScenes() {
    $('#sceneGrid').innerHTML = SCENES.map(sceneCardHTML).join('');
    $('#scenePickerGrid').innerHTML = SCENES.map(sceneCardHTML).join('');
    bindSceneCards();
  }
  function bindSceneCards() {
    $$('#sceneGrid .scene-card').forEach(c => c.onclick = () => selectScene(c.dataset.scene));
    $$('#scenePickerGrid .scene-card').forEach(c => c.onclick = () => selectScene(c.dataset.scene, { fromPicker: true }));
  }
  function selectScene(id, { preview = true, fromPicker = false } = {}) {
    selectedSceneId = id; store.set('scene', id);
    $$('.scene-card').forEach(c => c.classList.toggle('is-active', c.dataset.scene === id));
    const s = sceneById(id);
    $('#sceneName').textContent = lang === 'en' ? s.en : s.name;
    if (preview) setBackground(s.img);
    if (AudioEngine.isRunning()) AudioEngine.setScene(s);
    if (fromPicker) { closeScenePicker(); $('#autoSwitch').checked = false; stopAutoSwitch(); }
  }

  /* =========================================================
     音乐风格
     ========================================================= */
  let musicIdx = store.get('music', 0);
  const musicList = AudioEngine.musicList();
  function renderMusicStyles() {
    $('#musicStyles').innerHTML = musicList.map((m, i) =>
      `<button class="style-chip ${i === musicIdx ? 'is-active' : ''}" data-mi="${i}">${lang === 'en' ? m.en : m.name}</button>`).join('');
    $$('#musicStyles .style-chip').forEach(c => c.onclick = () => selectMusic(+c.dataset.mi));
    updateMusicName();
  }
  function updateMusicName() { $('#musicName').textContent = lang === 'en' ? musicList[musicIdx].en : musicList[musicIdx].name; }
  function selectMusic(i) {
    musicIdx = i; store.set('music', i);
    $$('#musicStyles .style-chip').forEach(c => c.classList.toggle('is-active', +c.dataset.mi === i));
    updateMusicName();
    AudioEngine.setMusicPreset(i);
    if (document.body.classList.contains('music-paused')) { document.body.classList.remove('music-paused'); AudioEngine.resumeMusic(); }
  }

  /* =========================================================
     背景自动切换
     ========================================================= */
  let autoTimer = null, autoIdx = 0;
  function startAutoSwitch() {
    stopAutoSwitch();
    autoTimer = setInterval(() => { autoIdx = (autoIdx + 1) % GALLERY.length; setBackground(GALLERY[autoIdx]); }, 50000);
    toast(t('已开启背景自动切换', 'Auto scenery switching on'));
  }
  function stopAutoSwitch() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }

  /* =========================================================
     音量滑块
     ========================================================= */
  function fill(el) { el.style.setProperty('--p', el.value + '%'); }
  function wireSliderPair(a, b, apply, key) {
    const sync = (val) => { a.value = b.value = val; fill(a); fill(b); apply(val / 100); store.set(key, +val); };
    [a, b].forEach(el => el.addEventListener('input', () => sync(el.value)));
    sync(store.get(key, +a.value));
  }

  /* =========================================================
     统计 + 时钟
     ========================================================= */
  const todayStr = () => new Date().toISOString().slice(0, 10);
  let stat = store.get('stat', { date: todayStr(), sessions: 0, minutes: 0 });
  function ensureStatDay() { if (stat.date !== todayStr()) { stat = { date: todayStr(), sessions: 0, minutes: 0 }; store.set('stat', stat); } }
  function addStat(min) { ensureStatDay(); stat.sessions += 1; stat.minutes += min; store.set('stat', stat); renderStat(); }
  function renderStat() {
    ensureStatDay();
    $('#statToday').textContent = lang === 'en' ? `Today ${stat.sessions} · ${stat.minutes} min` : `今日 ${stat.sessions} 段 · ${stat.minutes} 分钟`;
  }
  function tickClock() { const d = new Date(); $('#clock').textContent = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }

  /* =========================================================
     番茄钟
     ========================================================= */
  const pomo = {
    focus: store.get('dur', 50), brk: store.get('break', 10), longBreak: store.get('longbreak', true),
    mode: 'work', total: 0, remaining: 0, paused: false, number: 1, cycle: 0, timer: null,
  };
  const pad2 = (n) => String(n).padStart(2, '0');

  function setStatus() {
    const tag = $('#statusTag'), span = tag.querySelector('span');
    tag.classList.remove('paused', 'break');
    let zh, en;
    if (pomo.paused) { tag.classList.add('paused'); zh = '已暂停'; en = 'Paused'; }
    else if (pomo.mode === 'break') { tag.classList.add('break'); zh = '休息中'; en = 'Break'; }
    else { zh = '学习中'; en = 'Focusing'; }
    span.dataset.en = en; span.textContent = lang === 'en' ? en : zh;
  }
  function renderTimer() {
    const m = Math.floor(pomo.remaining / 60), s = pomo.remaining % 60;
    $('#timerDisplay').textContent = `${pad2(m)}:${pad2(s)}`;
    const pct = pomo.total ? Math.min(100, ((pomo.total - pomo.remaining) / pomo.total) * 100) : 0;
    $('#progressBar').style.width = pct + '%';
    $('#progressPct').textContent = Math.round(pct) + '%';
    $('#pomoCount').textContent = '#' + pomo.number;
    if (currentView === 'room') document.title = `${pad2(m)}:${pad2(s)} · StudyWithMe AI`;
  }
  function startWork(min = pomo.focus) {
    pomo.mode = 'work'; pomo.focus = min; pomo.total = min * 60; pomo.remaining = min * 60; pomo.paused = false;
    document.body.classList.remove('is-paused'); setStatus(); renderTimer();
  }
  function startBreak(min = pomo.brk) {
    pomo.mode = 'break'; pomo.total = min * 60; pomo.remaining = min * 60; pomo.paused = false;
    document.body.classList.remove('is-paused'); setStatus(); renderTimer();
  }
  function tick() {
    if (pomo.paused || currentView !== 'room') return;
    if (pomo.remaining > 0) { pomo.remaining--; renderTimer(); }
    if (pomo.remaining === 0) onPhaseEnd();
  }
  function onPhaseEnd() {
    pomo.paused = true;                 // 暂停，等待用户在弹窗中确认
    AudioEngine.chime();
    if (pomo.mode === 'work') {
      addStat(pomo.focus);
      pomo.cycle += 1;
      const isLong = pomo.longBreak && pomo.cycle % 4 === 0;
      const bmin = isLong ? Math.max(pomo.brk, 20) : pomo.brk;
      openFocusModal({
        kind: 'work',
        eyebrow: 'FOCUS COMPLETE',
        title: t('本轮专注完成', 'Focus complete'),
        quote: rand(PRAISE[lang]),
        sub: isLong
          ? t(`已完成 4 轮专注，给自己 ${bmin} 分钟的长休息吧。`, `4 rounds done — take a ${bmin}-minute long break.`)
          : t(`该起身活动一下了，${bmin} 分钟后我们继续。`, `Time to stretch — back in ${bmin} minutes.`),
        btn: t('开始休息', 'Start break'),
        action: () => startBreak(bmin),
      });
    } else {
      pomo.number += 1;
      openFocusModal({
        kind: 'break',
        eyebrow: 'BREAK OVER',
        title: t('休息结束', 'Break over'),
        quote: rand(PRAISE[lang]),
        sub: t('准备好了吗？让我们开始新一轮专注。', "Ready? Let's begin a fresh focus round."),
        btn: t('开始专注', 'Start focusing'),
        action: () => startWork(pomo.focus),
      });
    }
  }
  function ensureTicking() { if (!pomo.timer) pomo.timer = setInterval(tick, 1000); }
  function stopTicking() { clearInterval(pomo.timer); pomo.timer = null; document.title = 'StudyWithMe AI · 清净自习室'; }

  /* ---------- 完成 / 休息 弹窗 ---------- */
  let pendingAction = null;
  function openFocusModal({ kind, eyebrow, title, quote, sub, btn, action }) {
    $('#focusEyebrow').textContent = eyebrow;
    $('#focusTitle').textContent = title;
    $('#focusQuote').textContent = '“' + quote + '”';
    $('#focusSub').textContent = sub;
    $('#focusBtn').querySelector('span').textContent = btn;
    $('#focusModal').querySelector('.modal__panel').classList.toggle('is-break', kind === 'break');
    pendingAction = action;
    openModal('#focusModal');
  }

  /* =========================================================
     进入 / 离开自习室
     ========================================================= */
  async function enterRoom() {
    const s = sceneById(selectedSceneId);
    setBackground(s.img); showView('room');
    renderStat(); tickClock();
    startWork(pomo.focus); ensureTicking();
    try {
      await AudioEngine.start(); AudioEngine.resumeMaster();
      AudioEngine.setMusicPreset(musicIdx); AudioEngine.setScene(s);
      AudioEngine.setMusic(($('#musicVol').value) / 100); AudioEngine.setAmbience(($('#ambienceVol').value) / 100);
      if (document.body.classList.contains('music-paused')) { document.body.classList.remove('music-paused'); }
    } catch (e) {}
  }
  function leaveRoom() {
    stopTicking(); stopAutoSwitch();
    document.body.classList.remove('immersive', 'show-ui', 'is-paused', 'music-paused');
    closeModal('#focusModal'); pendingAction = null;
    AudioEngine.stop(); setBackground(HERO_IMG); showView('hero');
  }

  /* =========================================================
     沉浸模式
     ========================================================= */
  let uiTimer = null;
  function enterImmersive() {
    if (currentView !== 'room') return;
    document.body.classList.add('immersive');
    if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    flashUI();
  }
  function exitImmersive() {
    document.body.classList.remove('immersive', 'show-ui');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }
  function flashUI() {
    if (!document.body.classList.contains('immersive')) return;
    document.body.classList.add('show-ui'); clearTimeout(uiTimer);
    uiTimer = setTimeout(() => document.body.classList.remove('show-ui'), 2600);
  }

  /* =========================================================
     浮层 / 弹窗 / Toast
     ========================================================= */
  function openScenePicker() { const p = $('#scenePicker'); p.hidden = false; void p.offsetWidth; p.classList.add('show'); }
  function closeScenePicker() { const p = $('#scenePicker'); p.classList.remove('show'); setTimeout(() => p.hidden = true, 400); }
  function openModal(id) { const m = $(id); m.hidden = false; void m.offsetWidth; m.classList.add('show'); }
  function closeModal(id) { const m = $(id); m.classList.remove('show'); setTimeout(() => m.hidden = true, 400); }
  let toastTimer = null;
  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.hidden = false; void el.offsetWidth; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.hidden = true, 400); }, 2400);
  }

  /* =========================================================
     多语言
     ========================================================= */
  const t = (zh, en) => (lang === 'en' ? en : zh);
  function fixPhAttr() { $$('[data-en-ph]').forEach(el => { el.dataset.enPh = el.getAttribute('data-en-ph'); }); }
  function applyLang() {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    $$('[data-en]').forEach(el => { if (!el.dataset.zh) el.dataset.zh = el.textContent; el.textContent = lang === 'en' ? el.dataset.en : el.dataset.zh; });
    $$('[data-en-ph]').forEach(el => { if (!el.dataset.zhPh) el.dataset.zhPh = el.getAttribute('placeholder') || ''; el.setAttribute('placeholder', lang === 'en' ? el.dataset.enPh : el.dataset.zhPh); });
    $('#langLabel').textContent = lang === 'en' ? 'English' : '中文';
    const s = sceneById(selectedSceneId); $('#sceneName').textContent = lang === 'en' ? s.en : s.name;
    setStatus(); renderStat(); renderScenes(); renderMusicStyles();
  }

  /* =========================================================
     导航
     ========================================================= */
  function go(target) {
    switch (target) {
      case 'hero':   if (currentView === 'room') leaveRoom(); else showView('hero'); break;
      case 'setup':  setBackground(sceneById(selectedSceneId).img); showView('setup'); break;
      case 'sound':  setBackground(sceneById(selectedSceneId).img); showView('setup');
                     setTimeout(() => $('.setup__side')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400); break;
      case 'setup-quick': enterRoom(); break;
      case 'plan':   toast(t('学习计划功能开发中，敬请期待 ✨', 'Study plans are coming soon ✨')); break;
      case 'member': toast(t('会员体系开发中，敬请期待 ✨', 'Membership is coming soon ✨')); break;
    }
  }

  /* =========================================================
     绑定
     ========================================================= */
  function bind() {
    document.addEventListener('click', (e) => { const el = e.target.closest('[data-nav]'); if (el) { e.preventDefault(); go(el.dataset.nav); } });

    // 专注时长
    $$('#durationGrid .dur-btn').forEach(b => b.onclick = () => {
      $$('#durationGrid .dur-btn').forEach(x => x.classList.remove('is-active')); b.classList.add('is-active');
      pomo.focus = +b.dataset.min; store.set('dur', pomo.focus); $('#timerDisplay').textContent = pad2(pomo.focus) + ':00';
    });
    $$('#durationGrid .dur-btn').forEach(b => b.classList.toggle('is-active', +b.dataset.min === pomo.focus));
    // 休息时长
    $$('#breakGrid .dur-btn').forEach(b => b.onclick = () => {
      $$('#breakGrid .dur-btn').forEach(x => x.classList.remove('is-active')); b.classList.add('is-active');
      pomo.brk = +b.dataset.min; store.set('break', pomo.brk);
    });
    $$('#breakGrid .dur-btn').forEach(b => b.classList.toggle('is-active', +b.dataset.min === pomo.brk));
    // 长休息
    const lb = $('#longBreakToggle'); lb.checked = pomo.longBreak;
    lb.onchange = () => { pomo.longBreak = lb.checked; store.set('longbreak', lb.checked); };

    $('#enterRoomBtn').onclick = enterRoom;

    // 计时 暂停 / 继续
    $('#playPauseBtn').onclick = () => {
      pomo.paused = !pomo.paused; document.body.classList.toggle('is-paused', pomo.paused); setStatus();
    };
    // 音乐 暂停 / 播放（独立于计时）
    $('#musicToggle').onclick = async () => {
      await AudioEngine.start(); AudioEngine.resumeMaster();
      if (AudioEngine.isMusicPaused()) { AudioEngine.resumeMusic(); document.body.classList.remove('music-paused'); }
      else { AudioEngine.pauseMusic(); document.body.classList.add('music-paused'); }
    };
    $('#skipBtn').onclick = () => { pomo.mode === 'work' ? startBreak(pomo.brk) : startWork(pomo.focus); };
    $('#resetBtn').onclick = () => { pomo.mode === 'work' ? startWork(pomo.focus) : startBreak(Math.round(pomo.total / 60)); };

    // 完成弹窗按钮
    $('#focusBtn').onclick = () => { closeModal('#focusModal'); const a = pendingAction; pendingAction = null; if (a) a(); };

    // 音乐风格快捷切换（自习室内循环）
    $('#musicChip').onclick = () => selectMusic((musicIdx + 1) % musicList.length);

    // 场景
    $('#sceneChip').onclick = openScenePicker;
    $('#scenePickerClose').onclick = closeScenePicker;
    $('#scenePicker').addEventListener('click', (e) => { if (e.target.id === 'scenePicker') closeScenePicker(); });
    $('#autoSwitch').onchange = (e) => { e.target.checked ? startAutoSwitch() : stopAutoSwitch(); };

    // 沉浸
    $('#immersiveBtn').onclick = () => document.body.classList.contains('immersive') ? exitImmersive() : enterImmersive();
    document.addEventListener('mousemove', () => { if (document.body.classList.contains('immersive')) flashUI(); });
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) document.body.classList.remove('immersive', 'show-ui'); });

    // 语言
    $('#langBtn').onclick = () => { lang = lang === 'en' ? 'zh' : 'en'; store.set('lang', lang); applyLang(); };

    // 登录（演示）
    $('#loginBtn').onclick = () => openModal('#loginModal');
    $('#loginClose').onclick = () => closeModal('#loginModal');
    $('#loginModal').addEventListener('click', (e) => { if (e.target.id === 'loginModal') closeModal('#loginModal'); });
    $('#loginSubmit').onclick = () => { closeModal('#loginModal'); toast(t('这是演示界面，未连接服务器。', 'Demo only — not connected to a server.')); };

    // 目标
    const goal = $('#goalInput'); goal.value = store.get('goal', ''); goal.addEventListener('input', () => store.set('goal', goal.value));

    // 键盘
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { exitImmersive(); closeScenePicker(); closeModal('#loginModal'); }
      if (e.code === 'Space' && currentView === 'room' && e.target.tagName !== 'INPUT' && $('#focusModal').hidden) { e.preventDefault(); $('#playPauseBtn').click(); }
    });
  }

  /* =========================================================
     初始化
     ========================================================= */
  function init() {
    fixPhAttr();
    VIEW_EL.hero.classList.add('is-active');
    renderScenes();
    renderMusicStyles();
    selectScene(selectedSceneId, { preview: false });
    AudioEngine.setMusicPreset(musicIdx);
    wireSliderPair($('#musicVol'), $('#musicVol2'), v => AudioEngine.setMusic(v), 'vol_music');
    wireSliderPair($('#ambienceVol'), $('#ambienceVol2'), v => AudioEngine.setAmbience(v), 'vol_amb');
    $('#timerDisplay').textContent = pad2(pomo.focus) + ':00';
    renderStat(); tickClock(); setInterval(tickClock, 15000);
    bind();
    if (lang === 'en') applyLang();
    boot();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

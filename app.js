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
      amb:[{url:'ambiences/spring_day_forest.ogg', gain:1.1}] },
    { id:'rain',  name:'雨落松林', en:'Rainy Pines',   desc:'细雨 · 湿润 · 低声环境', desc_en:'Fine rain, low and damp ambience', tag:'细雨声', tag_en:'Light rain', img:'1505765050516-f72dcac9c60e', gen:'rain',
      amb:[{url:'weather/light_rain.ogg', gain:1.15}] },
    { id:'lake',  name:'湖光山色', en:'Quiet Lake',    desc:'清风 · 湖面 · 开阔视野', desc_en:'Light breeze over an open lake', tag:'湖水微风', tag_en:'Lake breeze', img:'1501785888041-af3ef285b470', gen:'wind',
      amb:[{url:'water/water_lapping_wind.ogg', gain:1.35}] },
    { id:'sea',   name:'海边晨曦', en:'Seaside Dawn',  desc:'海风 · 蓝调 · 开阔视野', desc_en:'Sea breeze, blue tones, open horizon', tag:'海浪声', tag_en:'Ocean waves', img:'1507525428034-b723cf961d3e', gen:'waves',
      amb:[{url:'water/waves_crashing_on_rock_beach.ogg', gain:1.0}] },
    { id:'night', name:'星空旷野', en:'Starry Night',  desc:'星空 · 旷野 · 深度专注', desc_en:'Starry skies for deep focus', tag:'夏夜虫鸣', tag_en:'Night crickets', img:'1419242902214-272b3f66ee7a', gen:'night',
      amb:[{url:'ambiences/july_night.ogg', gain:2.0}] },
    { id:'snow',  name:'雪山静谧', en:'Snowy Peaks',   desc:'雪峰 · 清冷 · 纯净空气', desc_en:'Snowy peaks, crisp and pure', tag:'清冷风声', tag_en:'Cold wind', img:'1483728642387-6c3bdd6c93e5', gen:'snow',
      amb:[{url:'weather/wind.ogg', gain:1.0}] },
    { id:'woods', name:'林深听雨', en:'Rain in the Woods', desc:'密林 · 细雨 · 湿润空气', desc_en:'Rain on leaves deep in the woods', tag:'雨打树叶', tag_en:'Rain on leaves', img:'1490604001847-b712b0c2f967', gen:'rain',
      amb:[{url:'weather/rain_on_roof.ogg', gain:1.0},{url:'ambiences/summer_forest.ogg', gain:0.65}] },
    { id:'city',  name:'纽约夜窗', en:'Manhattan Night', desc:'夜色 · 玻璃幕墙 · 远处车流', desc_en:'Night city behind floor-to-ceiling glass', tag:'隔窗都市声', tag_en:'Muffled city', img:'1754766621748-2a96cbf56a1f', gen:'city',
      amb:[{url:'ambiences/distant_highway.ogg', gain:1.3, lp:700},{url:'weather/wind.ogg', gain:0.4, lp:500}] },
    { id:'tokyo', name:'东京夜行', en:'Tokyo Night',   desc:'霓虹 · 街道 · 浪漫夜色', desc_en:'Neon streets and a romantic night', tag:'静夜微风', tag_en:'Quiet night', img:'1764418658791-771bb04efdcd', gen:'night',
      amb:[{url:'ambiences/outside_night.ogg', gain:1.4},{url:'weather/light_breeze.ogg', gain:0.6}] },
    { id:'jiangnan', name:'江南烟雨', en:'Misty Jiangnan', desc:'细雨 · 水雾 · 青瓦白墙', desc_en:'Drizzle, mist, water-town morning', tag:'雨声溪流', tag_en:'Rain & stream', img:'1769931446194-ede80f4a1719', gen:'stream',
      amb:[{url:'water/small_stream_flowing.ogg', gain:1.2},{url:'weather/light_rain.ogg', gain:0.45}] },
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
  function addStat(min) {
    ensureStatDay(); stat.sessions += 1; stat.minutes += min; store.set('stat', stat);
    const fd = store.get('focusdays', {}); fd[todayStr()] = (fd[todayStr()] || 0) + 1; store.set('focusdays', fd);
    renderStat(); renderCalendar();
  }
  function renderStat() {
    ensureStatDay();
    const mins = Math.round(stat.minutes);
    $('#statToday').textContent = lang === 'en' ? `Today ${stat.sessions} · ${mins} min` : `今日 ${stat.sessions} 段 · ${mins} 分钟`;
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
    pomo.paused = true;                 // 暂停，等待用户在弹窗中选择
    AudioEngine.chime();
    if (pomo.mode === 'work') {
      addStat(pomo.focus);
      pomo.cycle += 1;
      const isLong = pomo.longBreak && pomo.cycle % 4 === 0;
      const bmin = isLong ? Math.max(pomo.brk, 20) : pomo.brk;
      openFocusModal({
        kind: 'work',
        eyebrow: 'FOCUS COMPLETE',
        title: t('到休息时间啦', 'Time for a break'),
        quote: rand(PRAISE[lang]),
        sub: isLong
          ? t(`已完成 4 轮专注，建议给自己 ${bmin} 分钟的长休息。`, `4 rounds done — a ${bmin}-minute long break is recommended.`)
          : t(`这段你很专注，要不要休息 ${bmin} 分钟？`, `You focused well — take a ${bmin}-minute break?`),
        primary: t('开始休息', 'Start break'), onPrimary: () => startBreak(bmin),
        secondary: t('继续专注', 'Keep focusing'), onSecondary: () => { pomo.number += 1; startWork(pomo.focus); },
      });
    } else {
      openFocusModal({
        kind: 'break',
        eyebrow: 'BREAK OVER',
        title: t('休息结束', 'Break over'),
        quote: rand(PRAISE[lang]),
        sub: t('准备好了吗？可以再来一轮，或结束今天的专注。', 'Ready? Start another round, or end your session.'),
        primary: t('再来一轮', 'One more round'), onPrimary: () => { pomo.number += 1; startWork(pomo.focus); },
        secondary: t('结束专注', 'End session'), onSecondary: () => leaveRoom(),
      });
    }
  }
  function ensureTicking() { if (!pomo.timer) pomo.timer = setInterval(tick, 1000); }
  function stopTicking() { clearInterval(pomo.timer); pomo.timer = null; document.title = 'StudyWithMe AI · 清净自习室'; }

  /* ---------- 完成 / 休息 弹窗（两个选项） ---------- */
  let primaryAction = null, secondaryAction = null;
  function openFocusModal({ kind, eyebrow, title, quote, sub, primary, onPrimary, secondary, onSecondary }) {
    $('#focusEyebrow').textContent = eyebrow;
    $('#focusTitle').textContent = title;
    $('#focusQuote').textContent = '“' + quote + '”';
    $('#focusSub').textContent = sub;
    $('#focusBtn').querySelector('span').textContent = primary;
    $('#focusBtn2').querySelector('span').textContent = secondary;
    $('#focusModal').querySelector('.modal__panel').classList.toggle('is-break', kind === 'break');
    primaryAction = onPrimary; secondaryAction = onSecondary;
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
    if (typeof renderCalendar === 'function') renderCalendar();
    if (typeof renderQuick === 'function') renderQuick();
    if (typeof renderTiers === 'function') { renderTiers(); renderPlanList(); renderUser(); }
    if (!$('#loginModal').hidden) setAuthMode(authMode);
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
      case 'plan':   $('#userMenu').hidden = true; renderPlanList(); openModal('#planModal'); break;
      case 'member': $('#userMenu').hidden = true; renderTiers(); openModal('#memberModal'); break;
    }
  }

  /* =========================================================
     绑定
     ========================================================= */
  function bind() {
    document.addEventListener('click', (e) => { const el = e.target.closest('[data-nav]'); if (el) { e.preventDefault(); go(el.dataset.nav); } });

    // B：导航大胶囊 + 液体流动指示器
    (function navPill() {
      const nav = $('#nav'), pill = $('#navPill'); if (!nav || !pill) return;
      const links = $$('.nav__link', nav);
      const moveTo = (link) => {
        pill.style.width = link.offsetWidth + 'px';
        pill.style.transform = `translateX(${link.offsetLeft}px)`;
        nav.classList.add('pill-on');
        links.forEach(l => l.classList.toggle('is-hot', l === link));
      };
      links.forEach(l => l.addEventListener('mouseenter', () => moveTo(l)));
      nav.addEventListener('mouseleave', () => { nav.classList.remove('pill-on'); links.forEach(l => l.classList.remove('is-hot')); });
    })();

    // 专注时长
    $$('#durationGrid .dur-btn').forEach(b => b.onclick = () => {
      $$('#durationGrid .dur-btn').forEach(x => x.classList.remove('is-active')); b.classList.add('is-active');
      pomo.focus = +b.dataset.min; store.set('dur', pomo.focus); $('#timerDisplay').textContent = pad2(pomo.focus) + ':00';
      $('#customFocus').value = '';
    });
    $$('#durationGrid .dur-btn').forEach(b => b.classList.toggle('is-active', +b.dataset.min === pomo.focus));
    // 自定义休息时间点
    const cf = $('#customFocus');
    if (![25, 45, 50, 90].includes(pomo.focus)) cf.value = pomo.focus;
    cf.addEventListener('input', () => {
      const v = parseInt(cf.value, 10);
      if (v >= 1 && v <= 240) { pomo.focus = v; store.set('dur', v); $$('#durationGrid .dur-btn').forEach(x => x.classList.remove('is-active')); $('#timerDisplay').textContent = pad2(v) + ':00'; }
    });
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

    // 完成弹窗：两个选项
    $('#focusBtn').onclick = () => { closeModal('#focusModal'); const a = primaryAction; primaryAction = secondaryAction = null; if (a) a(); };
    $('#focusBtn2').onclick = () => { closeModal('#focusModal'); const a = secondaryAction; primaryAction = secondaryAction = null; if (a) a(); };

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

    // 登录 / 注册（仅大厅）
    $('#loginBtn').onclick = openAuth;
    $('#loginClose').onclick = () => closeModal('#loginModal');
    $('#loginModal').addEventListener('click', (e) => { if (e.target.id === 'loginModal') closeModal('#loginModal'); });
    $$('.auth__tab').forEach(tab => tab.onclick = () => setAuthMode(tab.dataset.tab));
    $('#authSubmit').onclick = submitAuth;
    ['#authName', '#authEmail', '#authPass', '#authPass2'].forEach(sel => $(sel).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submitAuth(); } }));
    $('#userChip').onclick = (e) => { e.stopPropagation(); $('#userMenu').hidden = !$('#userMenu').hidden; };
    $('#logoutBtn').onclick = logoutUser;
    document.addEventListener('click', (e) => { if (!e.target.closest('#userChip') && !e.target.closest('#userMenu')) $('#userMenu').hidden = true; });

    // 日历
    $('#calPrev').onclick = () => calShift(-1);
    $('#calNext').onclick = () => calShift(1);

    // AI 伴学
    $('#aiFab').onclick = aiOpen;
    $('#aiClose').onclick = aiClose;
    $('#aiForm').addEventListener('submit', (e) => { e.preventDefault(); aiSend($('#aiInput').value); });

    // 会员中心
    $('#memberClose').onclick = () => closeModal('#memberModal');
    $('#memberModal').addEventListener('click', (e) => { if (e.target.id === 'memberModal') closeModal('#memberModal'); });

    // 学习计划
    $('#planClose').onclick = () => closeModal('#planModal');
    $('#planModal').addEventListener('click', (e) => { if (e.target.id === 'planModal') closeModal('#planModal'); });
    $('#planSave').onclick = savePlan;

    // 目标
    const goal = $('#goalInput'); goal.value = store.get('goal', ''); goal.addEventListener('input', () => store.set('goal', goal.value));

    // 键盘
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { exitImmersive(); closeScenePicker(); closeModal('#loginModal'); closeModal('#memberModal'); closeModal('#planModal'); aiClose(); $('#userMenu').hidden = true; }
      if (e.code === 'Space' && currentView === 'room' && e.target.tagName !== 'INPUT' && $('#focusModal').hidden) { e.preventDefault(); $('#playPauseBtn').click(); }
    });
  }

  /* =========================================================
     登录 / 注册（本地演示账户，密码经哈希后仅存于本浏览器）
     ========================================================= */
  async function hashPass(p) {
    try { const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('sw|' + p));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join(''); }
    catch { let h = 0; for (let i = 0; i < p.length; i++) h = (h * 31 + p.charCodeAt(i)) | 0; return 'x' + (h >>> 0).toString(16); }
  }
  const accounts = () => store.get('accounts', {});
  let authMode = 'login';
  function setAuthMode(m) {
    authMode = m;
    $('#loginModal .auth').classList.toggle('is-register', m === 'register');
    $$('.auth__tab').forEach(tab => tab.classList.toggle('is-active', tab.dataset.tab === m));
    $('.auth-name').hidden = m !== 'register'; $('.auth-confirm').hidden = m !== 'register';
    $('#authErr').hidden = true;
    $('#authTitle').textContent = m === 'register' ? t('创建账户', 'Create account') : t('欢迎回来', 'Welcome back');
    $('#authSub').textContent = m === 'register' ? t('注册后即可保存偏好与专注记录。', 'Register to save your preferences and focus stats.') : t('登录后同步你的场景与专注记录。', 'Sign in to sync your scenes and focus stats.');
    $('#authSubmit').querySelector('span').textContent = m === 'register' ? t('注册', 'Register') : t('登录', 'Sign in');
  }
  function authErr(msg) { const e = $('#authErr'); e.textContent = msg; e.hidden = false; }
  const validEmail = (s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
  async function submitAuth() {
    const email = $('#authEmail').value.trim().toLowerCase(), pass = $('#authPass').value;
    if (!validEmail(email)) return authErr(t('请输入有效的邮箱地址。', 'Please enter a valid email.'));
    if (pass.length < 6) return authErr(t('密码至少需要 6 位。', 'Password must be at least 6 characters.'));
    const accs = accounts();
    if (authMode === 'register') {
      if (pass !== $('#authPass2').value) return authErr(t('两次输入的密码不一致。', 'Passwords do not match.'));
      if (accs[email]) return authErr(t('该邮箱已注册，请直接登录。', 'Email already registered — please sign in.'));
      const name = $('#authName').value.trim() || email.split('@')[0];
      accs[email] = { name, hash: await hashPass(pass) }; store.set('accounts', accs);
      loginUser(email); closeModal('#loginModal'); toast(t('注册成功，欢迎加入 ✨', 'Welcome aboard ✨'));
    } else {
      const acc = accs[email];
      if (!acc || acc.hash !== await hashPass(pass)) return authErr(t('邮箱或密码不正确。', 'Incorrect email or password.'));
      loginUser(email); closeModal('#loginModal'); toast(t('登录成功，欢迎回来 ✨', 'Welcome back ✨'));
    }
  }
  function currentUser() { const e = store.get('user', null); if (!e) return null; const a = accounts()[e]; return a ? { email: e, name: a.name } : null; }
  function loginUser(email) { store.set('user', email); renderUser(); }
  function logoutUser() { store.set('user', null); $('#userMenu').hidden = true; renderUser(); toast(t('已退出登录', 'Signed out')); }
  function renderUser() {
    const u = currentUser();
    $('#loginBtn').hidden = !!u; $('#userChip').hidden = !u;
    if (u) { $('#userNameLabel').textContent = u.name; $('#userAvatar').textContent = (u.name[0] || 'U').toUpperCase(); $('#userMenuEmail').textContent = u.email;
      $('#userMenuPlan').textContent = (lang === 'en' ? 'Plan · ' : '当前方案 · ') + tierName(curTier); }
  }
  function openAuth() { setAuthMode('login'); ['#authEmail', '#authPass', '#authPass2', '#authName'].forEach(s => $(s).value = ''); openModal('#loginModal'); }

  /* =========================================================
     日历（自习室内，标记有专注记录的日期）
     ========================================================= */
  let calView = null;
  const EN_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dkey = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  function renderCalendar() {
    if (!$('#calGrid')) return;
    if (!calView) { const n = new Date(); calView = { y: n.getFullYear(), m: n.getMonth() }; }
    const { y, m } = calView, startDow = new Date(y, m, 1).getDay(), dim = new Date(y, m + 1, 0).getDate(), prevDim = new Date(y, m, 0).getDate();
    const fd = store.get('focusdays', {}), tk = todayStr();
    $('#calTitle').textContent = lang === 'en' ? `${EN_MONTHS[m]} ${y}` : `${y}年${m + 1}月`;
    let html = '';
    for (let i = 0; i < 42; i++) {
      const idx = i - startDow + 1; let dn, cy = y, cm = m, other = false;
      if (idx < 1) { dn = prevDim + idx; cm = m - 1; other = true; if (cm < 0) { cm = 11; cy--; } }
      else if (idx > dim) { dn = idx - dim; cm = m + 1; other = true; if (cm > 11) { cm = 0; cy++; } }
      else dn = idx;
      const key = dkey(cy, cm, dn);
      html += `<div class="cal-day${other ? ' other' : ''}${key === tk ? ' today' : ''}${fd[key] ? ' has-focus' : ''}">${dn}</div>`;
    }
    $('#calGrid').innerHTML = html;
  }
  function calShift(d) { let { y, m } = calView; m += d; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } calView = { y, m }; renderCalendar(); }

  /* =========================================================
     AI 伴学（本地智能；若部署了 Netlify 函数则自动接入真实 AI）
     ========================================================= */
  const AI_QUICK = [ { zh:'我有点分心', en:"I'm distracted" }, { zh:'给我打打气', en:'Cheer me up' }, { zh:'番茄钟怎么用？', en:'How does Pomodoro work?' }, { zh:'推荐学习方法', en:'Study tips' } ];
  function renderQuick() {
    if (!$('#aiQuick')) return;
    $('#aiQuick').innerHTML = AI_QUICK.map(q => `<button class="ai-chip">${lang === 'en' ? q.en : q.zh}</button>`).join('');
    $$('#aiQuick .ai-chip').forEach((c, i) => c.onclick = () => aiSend(lang === 'en' ? AI_QUICK[i].en : AI_QUICK[i].zh));
  }
  function aiOpen() { const p = $('#aiPanel'); p.hidden = false; void p.offsetWidth; p.classList.add('show'); renderQuick(); if (!$('#aiMsgs').children.length) aiGreet(); setTimeout(() => $('#aiInput').focus(), 300); }
  function aiClose() { const p = $('#aiPanel'); p.classList.remove('show'); setTimeout(() => p.hidden = true, 400); }
  function aiAdd(text, who) { const el = document.createElement('div'); el.className = 'msg msg--' + who; el.textContent = text; $('#aiMsgs').appendChild(el); $('#aiMsgs').scrollTop = $('#aiMsgs').scrollHeight; return el; }
  function aiTyping() { const el = document.createElement('div'); el.className = 'msg msg--ai'; el.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>'; $('#aiMsgs').appendChild(el); $('#aiMsgs').scrollTop = $('#aiMsgs').scrollHeight; return el; }
  function aiGreet() { const u = currentUser(); const hi = u ? t('嗨 ' + u.name + '，', 'Hi ' + u.name + ', ') : t('嗨，', 'Hi, '); aiAdd(hi + t('我是伴学小光，专注路上有我陪着你。需要打气、番茄钟建议，还是聊聊今天的目标？', "I'm your study buddy. Need a boost, Pomodoro tips, or want to talk through today's goal?"), 'ai'); }
  async function aiSend(text) { text = (text || '').trim(); if (!text) return; aiAdd(text, 'me'); $('#aiInput').value = ''; const typ = aiTyping(); const reply = await aiReply(text); typ.remove(); aiAdd(reply, 'ai'); }
  async function aiReply(text) {
    await new Promise(r => setTimeout(r, 450 + Math.random() * 500));
    try { const res = await fetch('/.netlify/functions/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: text, lang }) });
      if (res.ok) { const j = await res.json(); if (j && j.reply) return j.reply; } } catch (e) {}
    return localReply(text);
  }
  function localReply(text) {
    const s = text.toLowerCase(); const has = (...ks) => ks.some(k => text.includes(k) || s.includes(k.toLowerCase()));
    if (has('分心','走神','distract','cant focus',"can't focus")) return t('分心很正常。先深呼吸三次，把手机调成勿扰，给自己定一个"只做这一件事"的 25 分钟，我陪你开始。', "Distraction is normal. Take three deep breaths, silence your phone, and commit to one task for 25 minutes — I'll start with you.");
    if (has('打气','鼓励','加油','cheer','encourage','motivat','boost')) return rand(PRAISE[lang]);
    if (has('番茄','pomodoro','计时','timer')) return t('番茄钟：专注 25–50 分钟，再休息 5–10 分钟，每 4 轮来一次长休息。在设置里挑"专注/休息时长"，到点我会弹窗提醒你。', "Pomodoro: focus 25–50 min, break 5–10 min, with a longer break every 4 rounds. Pick your lengths in setup — I'll pop up when it's time.");
    if (has('方法','技巧','怎么学','study tip','method','how to study')) return t('试试三招：① 写下今天"唯一最重要的一件事"；② 用番茄钟切成小段；③ 每段结束花 1 分钟回顾。要不要现在写进上方"今日目标"？', "Three tips: 1) write your single most important task; 2) split it with Pomodoro; 3) review for 1 min after each round. Want to jot it in 'Today's goal' above?");
    if (has('累','困','疲惫','tired','sleepy','exhausted')) return t('累了就该歇一下，别硬撑。起身喝口水、远眺窗外 20 秒。需要我帮你开始一段休息吗？', "If you're tired, take a real break — stand, sip water, look far away for 20s. Want me to start a break?");
    if (has('目标','计划','goal','plan')) return t('目标越具体越好，比如"读完第三章并做 5 道题"。写进"今日目标"，完成时的成就感会很真实。', "The more specific the goal, the better — e.g. 'finish chapter 3 + 5 problems'. Put it in Today's goal; finishing it feels great.");
    if (has('你好','在吗','hello','hey')) return t('我在呢～准备好了就告诉我，我们一起进入专注状态。', "I'm here! Tell me when you're ready and we'll get into focus together.");
    if (has('谢谢','thank')) return t('不客气，能陪你学习是我的荣幸。继续保持，你很棒！', "Anytime — it's a joy to study with you. Keep going, you're doing great!");
    return t('我记下了。专注时若需要鼓励、番茄钟建议或学习方法，随时叫我。要不要先选个场景、戴上耳机开始这一轮？', "Got it. Whenever you need a boost, Pomodoro tips, or methods, just ask. Shall we pick a scene and start this round?");
  }

  /* =========================================================
     会员中心
     ========================================================= */
  const TIERS = [
    { id:'free', name:{zh:'免费版',en:'Free'}, price:'¥0', unit:{zh:'永久',en:'forever'}, pop:false,
      feats:[ {zh:'6+ 自然场景与番茄钟',en:'6+ nature scenes & Pomodoro'}, {zh:'5 种专注音乐与真实环境声',en:'5 focus styles & real ambience'}, {zh:'本地学习计划与目标记录',en:'Local study plans & goals'} ],
      cta:{zh:'选择免费版',en:'Choose Free'} },
    { id:'pro', name:{zh:'专注 Pro',en:'Focus Pro'}, price:'¥18', unit:{zh:'/月',en:'/mo'}, pop:true,
      feats:[ {zh:'高清场景库与每日推荐',en:'HD scene library & daily picks'}, {zh:'AI 伴学复盘与计划拆解',en:'AI review & plan breakdown'}, {zh:'更多休息节奏与专注报告',en:'More break rhythms & focus reports'} ],
      cta:{zh:'选择 Pro',en:'Choose Pro'} },
    { id:'max', name:{zh:'Focus Max',en:'Focus Max'}, price:'¥48', unit:{zh:'/月',en:'/mo'}, pop:false,
      feats:[ {zh:'跨设备同步学习记录',en:'Cross-device sync'}, {zh:'长期计划追踪与周报',en:'Long-term tracking & weekly report'}, {zh:'自定义声音组合与背景收藏',en:'Custom sound mixes & saved scenes'} ],
      cta:{zh:'选择 Max',en:'Choose Max'} },
  ];
  let curTier = store.get('tier', 'free');
  function tierName(id) { const T = TIERS.find(x => x.id === id); return T ? (lang === 'en' ? T.name.en : T.name.zh) : ''; }
  function renderTiers() {
    if (!$('#planGrid')) return;
    const L = lang === 'en';
    $('#planGrid').innerHTML = TIERS.map(p => {
      const cur = p.id === curTier;
      const feats = p.feats.map(f => `<li>${L ? f.en : f.zh}</li>`).join('');
      const cta = cur ? t('当前方案', 'Current plan') : (L ? p.cta.en : p.cta.zh);
      return `<div class="plan-card${p.pop ? ' is-pop' : ''}${cur ? ' is-current' : ''}">
        ${p.pop ? `<span class="plan-badge">${t('推荐', 'Popular')}</span>` : ''}
        <h4>${L ? p.name.en : p.name.zh}</h4>
        <div class="plan-price">${p.price}<span>${L ? p.unit.en : p.unit.zh}</span></div>
        <ul class="plan-feats">${feats}</ul>
        <button class="plan-cta" data-tier="${p.id}"${cur ? ' disabled' : ''}>${cta}</button>
      </div>`;
    }).join('');
    $$('#planGrid .plan-cta').forEach(b => b.onclick = () => chooseTier(b.dataset.tier));
  }
  function chooseTier(id) {
    curTier = id; store.set('tier', id); renderTiers(); renderUser();
    toast(id === 'free' ? t('已切换为免费版', 'Switched to Free') : t(`已切换到 ${tierName(id)}（演示版，未接入支付）`, `Switched to ${tierName(id)} (demo — no real charge)`));
  }

  /* =========================================================
     学习计划
     ========================================================= */
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const plansAll = () => store.get('plans', []);
  function renderPlanList() {
    if (!$('#planList')) return;
    const list = plansAll();
    if (!list.length) { $('#planList').innerHTML = `<p class="plan-empty">${t('还没有保存的计划。', 'No saved plans yet.')}</p>`; return; }
    $('#planList').innerHTML = list.map(p => `<div class="plan-note">
        <div class="plan-note__h"><strong>${escapeHtml(p.title || t('未命名计划', 'Untitled'))}</strong><button class="plan-note__del" data-id="${p.id}" aria-label="删除">×</button></div>
        ${p.body ? `<p>${escapeHtml(p.body)}</p>` : ''}
        <span class="plan-note__date">${p.date}</span>
      </div>`).join('');
    $$('#planList .plan-note__del').forEach(b => b.onclick = () => { store.set('plans', plansAll().filter(x => x.id !== b.dataset.id)); renderPlanList(); });
  }
  function savePlan() {
    const title = $('#planTitle').value.trim(), body = $('#planBody').value.trim();
    if (!title && !body) { toast(t('先写点内容再保存～', 'Write something first~')); return; }
    const d = new Date(), date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const list = plansAll();
    list.unshift({ id: 'p' + d.getTime().toString(36) + Math.floor(Math.random() * 1e4).toString(36), title, body, date });
    store.set('plans', list);
    if (!$('#goalInput').value && title) { $('#goalInput').value = title; store.set('goal', title); }
    $('#planTitle').value = ''; $('#planBody').value = '';
    renderPlanList(); toast(t('计划已保存 ✨', 'Plan saved ✨'));
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
    renderTiers(); renderPlanList(); renderUser(); renderCalendar(); renderQuick(); setAuthMode('login');
    bind();
    if (lang === 'en') applyLang();
    boot();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

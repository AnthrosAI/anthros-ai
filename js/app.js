/**
 * AnthrosAI — app.js
 * Core: state, navigation, AI coach, persistence, utilities
 */

'use strict';

// ── CONSTANTS ──────────────────────────────────────────────
const GROQ_KEY = '';
const GROQ_URL  = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const AI_FREE_LIMIT = 5;

// ── STATE ──────────────────────────────────────────────────
window.U = {
  name:'', gender:'male', dob:'', height:0, weight:0, goalWeight:0,
  goal:'cut', actIdx:2, rateIdx:4,
  tdee:0, calories:0, protein:0, carbs:0, fats:0,
  bmi:0, timeline:0, email:''
};

window.foodLog    = { Breakfast:[], Lunch:[], Dinner:[], Snack:[] };
window.totalCals  = 0;
window.totalPro   = 0;
window.totalCarb  = 0;
window.totalFat   = 0;
window.waterGlasses = 0;
window.selectedMeal = 'Breakfast';
window.isPro      = false;
window.aiMsgCount = 0;
window.msgHistory = [];
window._chatSessions = [];
window._currentChatId = null;
window._favorites = [];
window._notes     = [];
window._photoLogs = [];
window._sleepLog  = [];
window._weightLog = [];
window._moodLog   = [];
window._todayMood = null;
window._stepsToday = 0;
window._stepsGoal  = 10000;
window._weeklySteps = [0,0,0,0,0,0,0];
window._healthConnected = false;
window._lastWaterTime = null;
window._wkFilter  = '';
window.microTotals = {zinc:0, iron:0, mag:0, calc:0, vitd:0, fiber:0};
window.obStep = 0;
window.currentDayOffset = 0;
window._dayOffset = 0;
window._selectedSleepQuality = 3;
window.openEditField = null;
window.fastRunning = false;
window.fastStart   = null;
window.fastInterval = null;
window.FAST_GOAL_H = 16;
window._sfFilters  = {};
window._foodsTab   = 'all';
window._selectedSleepQuality = 3;
window._supplements = [
  {id:'creatine',  name:'Creatine Monohydrate', dose:'5g',    unit:'g',  dailyMax:5,  taken:false, color:'#4FC3F7'},
  {id:'magnesium', name:'Magnesium Glycinate',  dose:'400mg', unit:'mg', dailyMax:400, taken:false, color:'#A5D6A7'},
  {id:'vitd',      name:'Vitamin D3',            dose:'4000IU',unit:'IU', dailyMax:4000,taken:false, color:'#FFD54F'},
  {id:'omega3',    name:'Omega-3 Fish Oil',      dose:'2g',    unit:'g',  dailyMax:2,  taken:false, color:'#EF9A9A'},
  {id:'zinc',      name:'Zinc',                  dose:'25mg',  unit:'mg', dailyMax:25, taken:false, color:'#CE93D8'},
  {id:'b12',       name:'Vitamin B12',            dose:'500mcg',unit:'mcg',dailyMax:500,taken:false, color:'#80DEEA'},
];
window._wkFilter = '';

const DV_REF = {
  zinc:{dv:11,unit:'mg',label:'Zinc'}, iron:{dv:18,unit:'mg',label:'Iron'},
  mag:{dv:400,unit:'mg',label:'Magnesium'}, calc:{dv:1000,unit:'mg',label:'Calcium'},
  vitd:{dv:20,unit:'µg',label:'Vitamin D'}, fiber:{dv:28,unit:'g',label:'Fiber'}
};

const TOTAL_STEPS = 9;
const tncState = { tos:false, disclaimer:false, marketing:false };
let rateIdx = 4;
let rateStepIdx = 3;

// Activity multipliers
const ACT_MULT = [1.2, 1.375, 1.465, 1.55, 1.725, 1.9];
const ACT_NAMES = ['Sedentary','Lightly Active','Moderately Active','Active','Very Active','Athlete'];

// ── NAVIGATION ─────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.bnav').forEach(b => b.classList.remove('active'));
  const pgEl = document.getElementById('pg-' + id);
  if (pgEl) pgEl.classList.add('active');
  if (btn) btn.classList.add('active');
  // Page init hooks
  if (id === 'progress')   { renderProgress(); setTimeout(renderProgressCharts, 80); }
  if (id === 'nutrition')  { initNutritionPage(); }
  if (id === 'workout')    { renderWorkoutPage(); }
  if (id === 'more')       { initMorePage(); }
  if (id === 'profile')    { initProfilePage(); }
  if (id === 'dash')       { renderDashboard(); }
  updateDateNav();
}

function renderDashboard() {
  renderWater();
  updateMacroDisplay();
  renderMealBlocks();
  renderStepsWidget();
  renderMoodTracker();
}

// ── TOAST ──────────────────────────────────────────────────
function showToast(msg, type) {
  let t = document.getElementById('globalToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'globalToast';
    t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:9999;pointer-events:none;';
    document.body.appendChild(t);
  }
  const bg = type==='err' ? '#FF3B3B' : type==='ok' ? '#34C759' : '#333';
  t.innerHTML = `<div style="background:${bg};color:white;padding:10px 20px;border-radius:30px;font-size:.82rem;font-weight:700;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,.4);animation:toastSlideIn .25s ease;">${msg}</div>`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.innerHTML = ''; }, 2400);
}

// ── DATE NAVIGATION ────────────────────────────────────────
function updateDateNav() {
  const el = document.getElementById('dateNavLabel');
  if (!el) return;
  const d = new Date(); d.setDate(d.getDate() + (_dayOffset||0));
  const opts = { weekday:'short', month:'short', day:'numeric' };
  el.textContent = _dayOffset === 0 ? 'Today' : d.toLocaleDateString('en-US', opts);
}

function changeDay(delta) {
  _dayOffset = (_dayOffset||0) + delta;
  if (_dayOffset > 0) _dayOffset = 0;
  window._dayOffset = _dayOffset;
  updateDateNav();
  updateMacroDisplay();
  renderMealBlocks();
}

// ── MACRO DISPLAY ──────────────────────────────────────────
function updateMacroDisplay() {
  // Update net calories
  if (typeof calcNetCalories === 'function') setTimeout(calcNetCalories, 0);
  // Update net consumed display
  var ncEl = document.getElementById('netConsumed'); if (ncEl) ncEl.textContent = Math.round(window.totalCals||0);
  const ids = { cal:'dashCal', pro:'dashPro', carb:'dashCarb', fat:'dashFat' };
  const vals = { cal:totalCals, pro:totalPro, carb:totalCarb, fat:totalFat };
  const goals = { cal:U.calories||2000, pro:U.protein||150, carb:U.carbs||200, fat:U.fats||60 };
  for (const [key, id] of Object.entries(ids)) {
    const el = document.getElementById(id);
    if (el) el.textContent = Math.round(vals[key]);
  }
  // Macro rings
  ['cal','pro','carb','fat'].forEach(k => {
    const pct = Math.min(1, (vals[k]||0) / (goals[k]||1));
    const ring = document.getElementById('ring-' + k);
    if (ring) {
      const c = 2*Math.PI*30;
      ring.style.strokeDashoffset = c * (1 - pct);
    }
  });
  // Calorie progress bar
  const pBar = document.getElementById('calProgressBar');
  if (pBar) pBar.style.width = Math.min(100, (totalCals/(U.calories||2000))*100) + '%';
}

// ── WATER WIDGET ───────────────────────────────────────────
function renderWater() {
  const grid = document.getElementById('waterGlassesGrid');
  if (!grid) return;
  const MAX = 12; // allow up to 12 for elite
  const BASE = 8;
  grid.innerHTML = '';
  for (let i = 0; i < MAX; i++) {
    const btn = document.createElement('button');
    btn.className = 'water-glass-btn' + (i < waterGlasses ? (i >= BASE ? ' elite' : ' filled') : '');
    btn.setAttribute('onclick', `addWater(${i})`);
    btn.innerHTML = i < waterGlasses ? '💧' : '○';
    btn.style.display = (i < BASE || waterGlasses >= BASE) ? 'flex' : 'none';
    grid.appendChild(btn);
  }
  // Status text
  const status = document.getElementById('waterStatus');
  if (status) {
    if (waterGlasses >= 12) {
      status.innerHTML = '<span class="water-elite-badge">🏆 HYDRATION ELITE — 3L!</span>';
    } else if (waterGlasses >= 8) {
      status.innerHTML = `<span style="color:var(--water);font-weight:700">✓ Goal reached! ${waterGlasses}/8 — keep going!</span>`;
    } else {
      status.textContent = `${waterGlasses}/8 glasses · ${waterGlasses*250}ml`;
    }
  }
  // Show extra glasses when at 8
  if (waterGlasses >= BASE) {
    grid.querySelectorAll('.water-glass-btn').forEach((b, i) => {
      if (i >= BASE) b.style.display = 'flex';
    });
  }
}

function addWater(idx) {
  const target = idx + 1;
  waterGlasses = (waterGlasses === target) ? target - 1 : target;
  if (waterGlasses < 0) waterGlasses = 0;
  window.waterGlasses = waterGlasses;
  window._lastWaterTime = new Date().toISOString();
  renderWater();
  saveAppState();
  if (waterGlasses === 8) showToast('🎉 Daily goal reached!', 'ok');
  if (waterGlasses === 12) showToast('🏆 Hydration Elite — 3L!', 'ok');
}

// ── MOOD TRACKER ───────────────────────────────────────────
const MOODS = ['😫','😔','😐','🙂','😄'];
function setMood(idx) {
  _todayMood = MOODS[idx];
  window._todayMood = _todayMood;
  const dateKey = new Date().toDateString();
  _moodLog = _moodLog.filter(m => m.date !== dateKey);
  _moodLog.push({ date: dateKey, mood: _todayMood, idx });
  renderMoodTracker();
  saveAppState();
  showToast('Mood logged ' + _todayMood, 'ok');
}

function renderMoodTracker() {
  const wrap = document.getElementById('moodBtns');
  if (!wrap) return;
  wrap.innerHTML = MOODS.map((m, i) =>
    `<button onclick="setMood(${i})" style="font-size:1.6rem;background:${_todayMood===m?'rgba(255,138,0,0.2)':'transparent'};border:2px solid ${_todayMood===m?'var(--cal)':'var(--border)'};border-radius:12px;padding:6px 10px;cursor:pointer;transition:all .15s">${m}</button>`
  ).join('');
}

// ── AI COACH ───────────────────────────────────────────────
function buildSysPrompt() {
  const bmiLbl = U.bmi<18.5?'underweight':U.bmi<25?'healthy':U.bmi<30?'overweight':'obese';
  let micro = '';
  if (microTotals.iron  < 8)   micro += 'Low iron (try lentils/spinach). ';
  if (microTotals.zinc  < 5)   micro += 'Low zinc (try beef/seeds). ';
  if (microTotals.fiber < 15)  micro += 'Low fiber (try oats/veggies). ';
  if (microTotals.calc  < 600) micro += 'Low calcium (try dairy/almonds). ';
  if (microTotals.iron > 0 && microTotals.calc < 400)
    micro += '⚠️ Iron absorption tip: pair iron-rich foods with vitamin C (bell peppers, citrus), avoid calcium within 2h. ';
  const waterCtx = waterGlasses < 4
    ? `Only ${waterGlasses} glasses water (needs more)`
    : `${waterGlasses}/8 glasses water`;
  return [
    'You are AnthrosAI Coach — knowledgeable, warm, elite fitness expert.',
    'Answer ANY question helpfully. If off-topic, answer naturally.',
    '',
    `USER: ${U.name||'User'} | Age ${U.age||'?'} | ${U.gender} | ${U.height}cm | ${U.weight}kg → goal ${U.goalWeight}kg`,
    `BMI ${U.bmi} (${bmiLbl}) | TDEE ${U.tdee} kcal | Target ${U.calories} kcal`,
    `Macros: ${U.protein}g P / ${U.carbs}g C / ${U.fats}g F`,
    '',
    `TODAY: ${totalCals}/${U.calories} kcal | ${totalPro}g P | ${totalCarb}g C | ${totalFat}g F`,
    `${waterCtx} | Steps: ${_stepsToday||0} | Mood: ${_todayMood||'not logged'}`,
    `Nutrient alerts: ${micro||'None — great!'}`,
    '',
    'RULES: 1. Answer any question. 2. Reference user numbers naturally, not robotically.',
    '3. 2-3 sentences unless depth needed. 4. Tone: smart friend + expert.'
  ].join('\n');
}

function addAiMsg(text) {
  const chat = document.getElementById('chatMessages');
  if (!chat) return;
  const div = document.createElement('div');
  div.className = 'chat-msg ai';
  div.innerHTML = `<div class="chat-bubble ai-bubble">${text.replace(/\n/g,'<br>')}</div>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

function addUsrMsg(text) {
  const chat = document.getElementById('chatMessages');
  if (!chat) return;
  const div = document.createElement('div');
  div.className = 'chat-msg user';
  div.innerHTML = `<div class="chat-bubble user-bubble">${text}</div>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function addTyping() {
  const chat = document.getElementById('chatMessages');
  if (!chat) return null;
  const div = document.createElement('div');
  div.className = 'chat-msg ai typing-wrap';
  div.innerHTML = '<div class="chat-bubble ai-bubble"><span class="typing-dots"><span></span><span></span><span></span></span></div>';
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

async function sendMsg() {
  const inp = document.getElementById('aiInput');
  if (!inp) return;
  const text = inp.value.trim();
  if (!text) return;
  if (!isPro && aiMsgCount >= AI_FREE_LIMIT) {
    addAiMsg(`🔒 You've used your ${AI_FREE_LIMIT} free messages. Upgrade to PRO for unlimited AI coaching!`);
    setTimeout(() => openPaywall(), 800);
    return;
  }
  inp.value = '';
  addUsrMsg(text);
  aiMsgCount++;
  msgHistory.push({ role:'user', content:text });
  const typing = addTyping();
  const sbtn = document.getElementById('aiSendBtn');
  if (sbtn) sbtn.disabled = true;
  try {
    const res = await fetch(GROQ_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${GROQ_KEY}`},
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 512,
        messages: [{ role:'system', content: buildSysPrompt() }, ...msgHistory]
      })
    });
    const data = await res.json();
    if (typing) typing.remove();
    const reply = data.choices?.[0]?.message?.content || 'No response';
    msgHistory.push({ role:'assistant', content:reply });
    addAiMsg(reply);
    setTimeout(saveChatSession, 300);
  } catch(err) {
    if (typing) typing.remove();
    addAiMsg('Connection issue. Check your internet and try again.');
  } finally {
    if (sbtn) sbtn.disabled = false;
    saveAppState();
  }
}

function quickAsk(q) {
  const inp = document.getElementById('aiInput');
  if (inp) inp.value = q;
  sendMsg();
}

// ── CHAT SESSIONS ──────────────────────────────────────────
function openChatSidebar() {
  const el = document.getElementById('chatSidebarOverlay');
  if (el) el.classList.add('open');
  renderChatHistory();
}
function closeChatSidebar() {
  const el = document.getElementById('chatSidebarOverlay');
  if (el) el.classList.remove('open');
}
function renderChatHistory() {
  const el = document.getElementById('chatHistoryList');
  if (!el) return;
  if (!_chatSessions.length) { el.innerHTML = '<div style="padding:16px;color:var(--muted2);font-size:.8rem">No previous chats</div>'; return; }
  el.innerHTML = _chatSessions.map(s =>
    `<div class="chat-history-item${s.id===_currentChatId?' active':''}" onclick="loadChatSession('${s.id}')">${s.title}</div>`
  ).join('');
}
function newChatSession() {
  if (msgHistory.length > 0) saveChatSession();
  msgHistory.length = 0;
  _currentChatId = null;
  const chat = document.getElementById('chatMessages');
  if (chat) chat.innerHTML = '';
  addAiMsg(`Hey ${U.name||'there'}! I'm your AnthrosAI Coach. What's on your mind today?`);
  closeChatSidebar();
}
function saveChatSession() {
  if (!msgHistory.length) return;
  const firstUser = msgHistory.find(m => m.role==='user');
  const title = firstUser ? firstUser.content.substring(0,40) + (firstUser.content.length>40?'...':'') : 'Chat';
  if (_currentChatId) {
    const ex = _chatSessions.find(s => s.id===_currentChatId);
    if (ex) { ex.messages = [...msgHistory]; return; }
  }
  const id = 'chat_' + Date.now();
  _currentChatId = id;
  _chatSessions.unshift({ id, title, messages:[...msgHistory] });
  if (_chatSessions.length > 30) _chatSessions.pop();
  saveAppState();
}
function loadChatSession(id) {
  const session = _chatSessions.find(s => s.id===id);
  if (!session) return;
  if (msgHistory.length) saveChatSession();
  msgHistory.length = 0;
  session.messages.forEach(m => msgHistory.push(m));
  _currentChatId = id;
  const chat = document.getElementById('chatMessages');
  if (chat) {
    chat.innerHTML = '';
    session.messages.forEach(m => m.role==='user' ? addUsrMsg(m.content) : addAiMsg(m.content));
  }
  closeChatSidebar();
}

// ── FAB ────────────────────────────────────────────────────
function openFAB() {
  const m = document.getElementById('fabModal');
  if (m) m.classList.add('open');
}
function closeFAB() {
  const m = document.getElementById('fabModal');
  if (m) m.classList.remove('open');
}
function openFABOption(opt) {
  closeFAB();
  if (opt==='suggest') openSuggestFood();
  else if (opt==='scan') openAIAnalyzer();
  else if (opt==='fast') openFastModal();
  else if (opt==='sleep') openSleepLog();
  else if (opt==='weight') openWeightLog();
  else if (opt==='exercise') openExerciseLog();
}

// ── NOTES ──────────────────────────────────────────────────
function addNote() {
  const m = document.getElementById('addNoteModal');
  if (m) m.classList.add('open');
  const label = document.getElementById('noteDateLabel');
  if (label) label.textContent = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  const inp = document.getElementById('noteInput');
  if (inp) { inp.value = ''; inp.focus(); }
  renderNotesList();
}
function closeNoteModal() {
  const m = document.getElementById('addNoteModal');
  if (m) m.classList.remove('open');
}
function saveNote() {
  const titleEl = document.getElementById('noteTitleInput');
  const contentEl = document.getElementById('noteInput');
  const title = titleEl ? titleEl.value.trim() : '';
  const content = contentEl ? contentEl.value.trim() : '';
  if (!content && !title) { showToast('Write something first','err'); return; }
  _notes.unshift({
    id: Date.now(),
    title: title || 'Note',
    content,
    date: new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),
    ts: Date.now()
  });
  if (titleEl) titleEl.value = '';
  if (contentEl) contentEl.value = '';
  renderNotesList();
  saveAppState();
  showToast('Note saved ✓','ok');
}
function renderNotesList() {
  const el = document.getElementById('notesList');
  if (!el) return;
  if (!_notes.length) { el.innerHTML = '<div style="text-align:center;color:var(--muted2);font-size:.78rem;padding:12px">No notes yet</div>'; return; }
  el.innerHTML = _notes.map(n =>
    `<div class="note-card">
      <div class="note-title">${n.title}</div>
      <div class="note-date">${n.date}</div>
      <div class="note-content">${n.content}</div>
      <button onclick="_notes=_notes.filter(x=>x.id!=${n.id});renderNotesList();saveAppState();" style="background:none;border:none;color:var(--muted2);font-size:.72rem;cursor:pointer;margin-top:6px">Delete</button>
    </div>`
  ).join('');
}

// ── WEIGHT LOG ─────────────────────────────────────────────
function openWeightLog() {
  const m = document.getElementById('weightModal');
  if (m) m.classList.add('open');
  const cur = document.getElementById('wlCurrentWeight');
  if (cur) cur.textContent = U.weight || '—';
}
function closeWeightModal() {
  const m = document.getElementById('weightModal');
  if (m) m.classList.remove('open');
}
function saveWeightLog() {
  const inp = document.getElementById('wlInput');
  const w = parseFloat(inp?.value);
  if (!w || isNaN(w)) { showToast('Enter a valid weight','err'); return; }
  U.weight = w;
  _weightLog.unshift({ weight:w, date:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'}), ts:Date.now() });
  if (_weightLog.length > 90) _weightLog.pop();
  closeWeightModal();
  saveAppState();
  renderWeightHistory();
  showToast(`${w} kg logged ✓`,'ok');
  if (inp) inp.value = '';
}
function renderWeightHistory() {
  const el = document.getElementById('weightHistoryList');
  if (!el) return;
  if (!_weightLog.length) { el.innerHTML = '<div style="color:var(--muted2);font-size:.78rem;padding:8px">No entries yet</div>'; return; }
  el.innerHTML = _weightLog.slice(0,10).map(e =>
    `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
      <span style="font-weight:700">${e.weight} kg</span>
      <span style="color:var(--muted2);font-size:.78rem">${e.date}</span>
    </div>`
  ).join('');
}

// ── PHOTO LOG ──────────────────────────────────────────────
function openPhotoLog() {
  const m = document.getElementById('photoLogModal');
  if (m) m.classList.add('open');
  renderPhotoHistory();
}
function closePhotoLog() {
  const m = document.getElementById('photoLogModal');
  if (m) m.classList.remove('open');
}
function previewPhotoLog(input) {
  if (!input.files?.[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('photoPreviewImg');
    const area = document.getElementById('photoPreviewArea');
    const prompt = document.getElementById('photoUploadPrompt');
    if (img) img.src = e.target.result;
    if (area) area.style.display = 'block';
    if (prompt) prompt.style.display = 'none';
  };
  reader.readAsDataURL(input.files[0]);
}
function savePhotoLog() {
  const img = document.getElementById('photoPreviewImg');
  const name = document.getElementById('photoLogName')?.value.trim() || 'Progress Photo';
  if (!img?.src || img.src.length < 50) { showToast('Select a photo first','err'); return; }
  _photoLogs.unshift({ name, src: img.src, date: new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}), ts:Date.now() });
  if (_photoLogs.length > 30) _photoLogs.pop();
  renderPhotoHistory();
  saveAppState();
  closePhotoLog();
  showToast('Photo saved ✓','ok');
}
function renderPhotoHistory() {
  const el = document.getElementById('photoLogHistory');
  if (!el) return;
  if (!_photoLogs.length) { el.innerHTML = '<div style="text-align:center;color:var(--muted2);font-size:.78rem;padding:12px">No photos yet — start tracking!</div>'; return; }
  el.innerHTML = _photoLogs.map(p =>
    `<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)">
      <img src="${p.src}" style="width:50px;height:50px;border-radius:8px;object-fit:cover">
      <div><div style="font-weight:700;font-size:.82rem">${p.name}</div><div style="color:var(--muted2);font-size:.7rem">${p.date}</div></div>
    </div>`
  ).join('');
}

// ── SLEEP ──────────────────────────────────────────────────
function openSleepLog() {
  const m = document.getElementById('sleepModal');
  if (m) m.classList.add('open');
  updateSleepStats();
}
function showSleepPage() { showPage('sleep', document.getElementById('nav-sleep')); }
function setSleepQuality(n) {
  _selectedSleepQuality = n;
  window._selectedSleepQuality = n;
  document.querySelectorAll('.sleep-quality-btn').forEach((b,i) => {
    b.classList.toggle('sel', i+1 === n);
  });
}
function logSleep() {
  const hrs = parseFloat(document.getElementById('sleepHours')?.value);
  if (isNaN(hrs) || hrs<0 || hrs>24) { showToast('Enter valid sleep hours (0-24)','err'); return; }
  _sleepLog.unshift({ hours:hrs, quality:_selectedSleepQuality, date:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'}), ts:Date.now() });
  if (_sleepLog.length>60) _sleepLog.pop();
  saveAppState();
  updateSleepStats();
  renderSleepHistory();
  showToast(`${hrs}h sleep logged ✓`,'ok');
  const m = document.getElementById('sleepModal');
  if (m) m.classList.remove('open');
}
function updateSleepStats() {
  const avg = document.getElementById('sleepAvg');
  const last = document.getElementById('sleepLast');
  if (_sleepLog.length) {
    const a = _sleepLog.slice(0,7).reduce((s,e)=>s+e.hours,0) / Math.min(_sleepLog.length,7);
    if (avg) avg.textContent = a.toFixed(1)+'h';
    if (last) last.textContent = _sleepLog[0].hours+'h';
  }
}
function renderSleepHistory() {
  const el = document.getElementById('sleepHistory');
  if (!el) return;
  if (!_sleepLog.length) { el.innerHTML = '<div style="color:var(--muted2);font-size:.78rem">No entries yet</div>'; return; }
  const stars = n => '⭐'.repeat(n);
  el.innerHTML = _sleepLog.slice(0,7).map(e =>
    `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border)">
      <span style="font-weight:700">${e.hours}h</span>
      <span>${stars(e.quality)}</span>
      <span style="color:var(--muted2);font-size:.75rem">${e.date}</span>
    </div>`
  ).join('');
}

// ── STEPS ──────────────────────────────────────────────────
function initStepsWidget() {
  renderStepsWidget();
}
function renderStepsWidget() {
  const el = document.getElementById('stepsCount');
  if (el) el.textContent = (_stepsToday||0).toLocaleString();
  const goal = document.getElementById('stepsGoal');
  if (goal) goal.textContent = (_stepsGoal||10000).toLocaleString();
  const pct = Math.min(100, ((_stepsToday||0)/(_stepsGoal||10000))*100);
  const bar = document.getElementById('stepsBar');
  if (bar) bar.style.width = pct+'%';
}
function addSteps(n) {
  _stepsToday = (_stepsToday||0) + n;
  window._stepsToday = _stepsToday;
  renderStepsWidget();
  saveAppState();
  showToast(`+${n} steps added`,'ok');
}
function manualStepsInput() {
  const val = prompt('Enter steps to add:');
  const n = parseInt(val);
  if (!isNaN(n) && n>0) addSteps(n);
}
function saveStepsState() { saveAppState(); }
function openDevicesModal() {
  const m = document.getElementById('devicesModal');
  if (m) m.classList.add('open');
}
function closeDevicesModal() {
  const m = document.getElementById('devicesModal');
  if (m) m.classList.remove('open');
}
function connectDevice(name) {
  showToast(`${name} — coming soon in native app`,'ok');
  closeDevicesModal();
}
function startMotionStepCount() {
  if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) {
    DeviceMotionEvent.requestPermission().then(p => {
      if (p === 'granted') showToast('Motion tracking enabled','ok');
    }).catch(() => showToast('Motion permission denied','err'));
  }
}

// ── PROGRESS ───────────────────────────────────────────────
function renderProgress() {
  const diff = U.weight && U.goalWeight ? Math.abs(U.weight - U.goalWeight).toFixed(1) : '—';
  const psSub = document.getElementById('progSub');
  if (psSub) psSub.textContent = `${diff}kg to goal · ${U.goal||'cut'}`;
  renderWeightHistory();
  renderProgressCharts();
}
function renderProgressCharts() {
  renderWeightLineChart();
  renderStepsLineChart();
}
function renderWeightLineChart() {
  const canvas = document.getElementById('weightChart');
  if (!canvas || !_weightLog.length) return;
  const ctx = canvas.getContext('2d');
  const data = _weightLog.slice(0,14).reverse();
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  if (data.length < 2) return;
  const weights = data.map(d=>d.weight);
  const min = Math.min(...weights)-1, max = Math.max(...weights)+1;
  const toX = i => (i/(data.length-1))*W;
  const toY = w => H - ((w-min)/(max-min))*H*0.8 - H*0.1;
  ctx.beginPath();
  ctx.strokeStyle = '#FF8A00';
  ctx.lineWidth = 2;
  data.forEach((d,i) => i===0 ? ctx.moveTo(toX(i),toY(d.weight)) : ctx.lineTo(toX(i),toY(d.weight)));
  ctx.stroke();
}
function renderStepsLineChart() {
  const canvas = document.getElementById('stepsChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  const data = _weeklySteps || [0,0,0,0,0,0,0];
  const max = Math.max(...data,1000);
  const toX = i => (i/(data.length-1))*W;
  const toY = v => H - (v/max)*H*0.8 - H*0.1;
  ctx.beginPath();
  ctx.strokeStyle = '#34C759';
  ctx.lineWidth = 2;
  data.forEach((v,i) => i===0 ? ctx.moveTo(toX(i),toY(v)) : ctx.lineTo(toX(i),toY(v)));
  ctx.stroke();
}
function renderWeeklyChart() { renderStepsLineChart(); }

// ── FASTING ────────────────────────────────────────────────
function openFastModal() {
  const m = document.getElementById('fastingModal');
  if (m) m.classList.add('open');
  updateFastDisplay();
}
function closeFastModal() {
  const m = document.getElementById('fastingModal');
  if (m) m.classList.remove('open');
}
function openFastPage() { openFastModal(); }
function toggleFast() {
  if (!fastRunning) startFast(); else resetFast();
}
function startFast() {
  fastRunning = true;
  fastStart = Date.now();
  fastInterval = setInterval(updateFastTimer, 1000);
  const btn = document.getElementById('fastMainBtn');
  if (btn) { btn.textContent = 'Stop Fast ⏹'; btn.style.background = 'rgba(255,59,59,.15)'; }
  saveAppState();
}
function resetFast() {
  fastRunning = false;
  fastStart = null;
  clearInterval(fastInterval);
  fastInterval = null;
  const btn = document.getElementById('fastMainBtn');
  if (btn) { btn.textContent = 'Start Fast 🕐'; btn.style.background = ''; }
  updateFastDisplay();
  saveAppState();
}
function updateFastTimer() {
  if (!fastRunning || !fastStart) return;
  const elapsed = Date.now() - fastStart;
  const total = FAST_GOAL_H * 3600000;
  const pct = Math.min(1, elapsed/total);
  const secs = Math.floor(elapsed/1000);
  const h = Math.floor(secs/3600), m = Math.floor((secs%3600)/60), s = secs%60;
  const display = document.getElementById('fastTimerDisplay');
  if (display) display.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  const ring = document.getElementById('fastRingFill');
  if (ring) ring.style.strokeDashoffset = 283 * (1-pct);
  if (pct >= 1) {
    fireNotif('AnthrosAI ⏱', `${FAST_GOAL_H}h fast complete! Breaking window open.`);
    resetFast();
    showToast(`${FAST_GOAL_H}h fast complete! 🎉`,'ok');
  }
}
function updateFastDisplay() {
  const display = document.getElementById('fastTimerDisplay');
  if (display && !fastRunning) display.textContent = '00:00:00';
  const status = document.getElementById('fastStatus');
  if (status) status.textContent = fastRunning ? 'Fasting...' : 'Not started — tap Start Fast';
}

// ── DAILY REPORT ───────────────────────────────────────────
function openDailyReport() {
  const m = document.getElementById('dailyReportModal');
  if (m) m.classList.add('open');
  renderDailyReport();
}
function closeDailyReport() {
  const m = document.getElementById('dailyReportModal');
  if (m) m.classList.remove('open');
}
function renderDailyReport() {
  const el = document.getElementById('dailyReportContent');
  if (!el) return;
  const calPct = Math.round((totalCals/(U.calories||2000))*100);
  const proPct = Math.round((totalPro/(U.protein||150))*100);
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
      <div style="background:var(--bg2);border-radius:12px;padding:12px;text-align:center">
        <div style="font-size:1.4rem;font-weight:800;color:var(--cal)">${totalCals}</div>
        <div style="font-size:.7rem;color:var(--muted2)">kcal / ${U.calories||2000}</div>
        <div style="font-size:.68rem;color:var(--cal);margin-top:3px">${calPct}%</div>
      </div>
      <div style="background:var(--bg2);border-radius:12px;padding:12px;text-align:center">
        <div style="font-size:1.4rem;font-weight:800;color:var(--pro)">${totalPro}g</div>
        <div style="font-size:.7rem;color:var(--muted2)">protein / ${U.protein||150}g</div>
        <div style="font-size:.68rem;color:var(--pro);margin-top:3px">${proPct}%</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">
      <div style="background:var(--bg2);border-radius:10px;padding:10px;text-align:center">
        <div style="font-weight:800;color:var(--carb)">${totalCarb}g</div>
        <div style="font-size:.65rem;color:var(--muted2)">Carbs</div>
      </div>
      <div style="background:var(--bg2);border-radius:10px;padding:10px;text-align:center">
        <div style="font-weight:800;color:var(--fat)">${totalFat}g</div>
        <div style="font-size:.65rem;color:var(--muted2)">Fat</div>
      </div>
      <div style="background:var(--bg2);border-radius:10px;padding:10px;text-align:center">
        <div style="font-weight:800;color:var(--water)">${waterGlasses}</div>
        <div style="font-size:.65rem;color:var(--muted2)">Glasses</div>
      </div>
    </div>`;
}
function toggleDrSection(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = el.style.display==='none'?'block':'none';
}

// ── SUPPLEMENT TRACKER ─────────────────────────────────────
function renderSupplements() {
  const el = document.getElementById('supplementList');
  if (!el) return;
  el.innerHTML = _supplements.map(s => `
    <div class="supp-card">
      <div class="supp-header">
        <div>
          <div class="supp-name" style="color:${s.color}">${s.name}</div>
          <div class="supp-dose">${s.dose} daily</div>
        </div>
        <button class="supp-toggle${s.taken?' on':''}" onclick="toggleSupp('${s.id}')"></button>
      </div>
      ${s.taken ? `<div style="font-size:.7rem;color:#34C759;font-weight:600">✓ Taken today</div>` : `<div style="font-size:.7rem;color:var(--muted2)">Not taken yet</div>`}
    </div>
  `).join('');
}
function toggleSupp(id) {
  const s = _supplements.find(x => x.id===id);
  if (s) { s.taken = !s.taken; saveAppState(); renderSupplements(); }
  const taken = _supplements.filter(x=>x.taken).length;
  showToast(taken + '/' + _supplements.length + ' supplements taken','ok');
}

// ── NOTIFICATIONS ──────────────────────────────────────────
function openNotificationsModal() {
  const m = document.getElementById('notificationsModal');
  if (m) m.classList.add('open');
  updateNotifStatus();
}
function closeNotificationsModal() {
  const m = document.getElementById('notificationsModal');
  if (m) m.classList.remove('open');
}
function updateNotifStatus() {
  const st = document.getElementById('notifStatusText');
  if (!st) return;
  if (!('Notification' in window)) { st.textContent = 'Not supported in this browser'; return; }
  st.textContent = Notification.permission === 'granted' ? 'Enabled — reminders active' :
    Notification.permission === 'denied' ? 'Blocked — enable in Settings > Safari' : 'Not yet enabled';
}
function requestNotifications() {
  if (!('Notification' in window)) { showToast('Not supported','err'); return; }
  if (Notification.permission === 'granted') { scheduleSmartNotifications(); showToast('Notifications active!','ok'); return; }
  Notification.requestPermission().then(p => {
    updateNotifStatus();
    if (p === 'granted') {
      scheduleSmartNotifications();
      showToast('Notifications enabled! 🔔','ok');
      setTimeout(() => fireNotif('AnthrosAI','Reminders are now active!','🔥'), 500);
    } else {
      showToast('Enable in iPhone Settings > Safari','err');
    }
  });
}
function fireNotif(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try { new Notification(title||'AnthrosAI', { body:body||'', icon:'apple-touch-icon.png', tag:'anthrosai-'+Date.now() }); }
  catch(e) {}
}
function scheduleSmartNotifications() {
  if (window._notifIntervals) window._notifIntervals.forEach(clearInterval);
  window._notifIntervals = [];
  window._notifIntervals.push(setInterval(() => {
    const h = new Date().getHours();
    if (h>=7 && h<=22 && waterGlasses < 8)
      fireNotif('AnthrosAI 💧', `Drink water! ${waterGlasses}/8 glasses today.`);
  }, 3*60*60*1000));
  window._notifIntervals.push(setInterval(() => {
    const now = new Date();
    [{h:8,msg:'Time for breakfast!'},{h:13,msg:'Lunch time!'},{h:19,msg:'Dinner reminder.'}]
      .forEach(t => { if (now.getHours()===t.h && now.getMinutes()===0) fireNotif('AnthrosAI 🍽️', t.msg); });
  }, 60*1000));
}

// ── PRIVACY / MORE MODAL ───────────────────────────────────
function openPrivacyModal() {
  const m = document.getElementById('privacyModal');
  if (m) m.classList.add('open');
}
function closePrivacyModal() {
  const m = document.getElementById('privacyModal');
  if (m) m.classList.remove('open');
}

// ── PROFILE ────────────────────────────────────────────────
function initProfilePage() {
  document.querySelectorAll('[data-field]').forEach(el => {
    const f = el.dataset.field;
    el.textContent = U[f] || '—';
  });
  const badge = document.getElementById('planBadge');
  if (badge) { badge.textContent = isPro ? 'PRO' : 'FREE'; badge.className = 'plan-badge' + (isPro?' pro':''); }
  renderWeightHistory();
  renderSupplements();
  renderNotesList();
}
function saveProfileField(field, val) {
  U[field] = isNaN(val) ? val : parseFloat(val) || val;
  saveAppState();
  refreshPlanNums();
}
function toggleEdit(field) {
  const view = document.getElementById('view-'+field);
  const edit = document.getElementById('edit-'+field);
  if (!view || !edit) return;
  view.style.display = 'none';
  edit.style.display = 'flex';
  openEditField = field;
}
function cancelEdit(field) {
  const view = document.getElementById('view-'+field);
  const edit = document.getElementById('edit-'+field);
  if (view) view.style.display = 'flex';
  if (edit) edit.style.display = 'none';
  openEditField = null;
}
function recalc() { calculateMacros(); refreshPlanNums(); saveAppState(); }
function refreshPlanNums() {
  calculateMacros();
  const els = {
    planCal: U.calories, planPro: U.protein+'g',
    planCarb: U.carbs+'g', planFat: U.fats+'g', planTDEE: U.tdee
  };
  Object.entries(els).forEach(([id,v]) => { const el = document.getElementById(id); if (el) el.textContent = v; });
}
function initMorePage() {
  const nm = document.getElementById('moreName');
  const em = document.getElementById('moreEmail');
  const av = document.getElementById('moreAvatar');
  if (nm) nm.textContent = U.name || 'User';
  if (em) em.textContent = U.email || 'Not set';
  if (av) av.textContent = (U.name||'?')[0]?.toUpperCase() || '?';
}
function handleLogout() {
  if (!confirm('Log out and clear all data?')) return;
  logoutApp();
}
function logoutApp() {
  localStorage.removeItem('anthros_state');
  localStorage.removeItem('anthros_logged_in');
  location.reload();
}
function calculateBMI() {
  if (U.height && U.weight) U.bmi = (U.weight / ((U.height/100)**2)).toFixed(1);
}
function onProActivated() {
  isPro = true;
  saveAppState();
  showToast('🎉 PRO unlocked!','ok');
  const badge = document.getElementById('planBadge');
  if (badge) { badge.textContent = 'PRO'; badge.className = 'plan-badge pro'; }
}
function checkPaymentReturn() {
  const p = new URLSearchParams(window.location.search);
  if (p.get('payment') === 'success') {
    window.history.replaceState({}, '', window.location.pathname);
    setTimeout(() => { activatePro(); showToast('Payment confirmed! Welcome to PRO! 🎉','ok'); }, 800);
  }
}

// ── PERSIST ────────────────────────────────────────────────
function saveAppState() {
  try {
    const dateKey = new Date().toISOString().split('T')[0];
    const state = {
      dateKey, foodLog, totalCals, totalPro, totalCarb, totalFat,
      waterGlasses, U, isPro, aiMsgCount,
      _favorites, _notes, _photoLogs, _sleepLog, _weightLog, _moodLog, _todayMood,
      _stepsToday, _stepsGoal, _weeklySteps, _chatSessions, _currentChatId,
      exercises, _supplements, _lastWaterTime,
      fastRunning, fastStart, FAST_GOAL_H,
      lastSaveDate: new Date().toDateString()
    };
    localStorage.setItem('anthros_state', JSON.stringify(state));
    if (U.name) { localStorage.setItem('anthros_logged_in','1'); localStorage.setItem('anthros_session','active'); }
  } catch(e) { console.warn('Save failed:', e); }
}

function loadAppState() {
  try {
    const raw = localStorage.getItem('anthros_state');
    if (!raw) return false;
    const st = JSON.parse(raw);
    // Reset food data if new day
    const isToday = st.lastSaveDate === new Date().toDateString();
    if (!isToday) {
      Object.assign(window, { totalCals:0, totalPro:0, totalCarb:0, totalFat:0, waterGlasses:0 });
      foodLog.Breakfast=[]; foodLog.Lunch=[]; foodLog.Dinner=[]; foodLog.Snack=[];
      microTotals = {zinc:0,iron:0,mag:0,calc:0,vitd:0,fiber:0};
      _supplements.forEach(s => s.taken = false);
    } else {
      Object.assign(window, {
        totalCals: st.totalCals||0, totalPro: st.totalPro||0,
        totalCarb: st.totalCarb||0, totalFat: st.totalFat||0,
        waterGlasses: st.waterGlasses||0
      });
      if (st.foodLog) Object.assign(foodLog, st.foodLog);
    }
    // Always restore profile + logs
    if (st.U) Object.assign(U, st.U);
    Object.assign(window, {
      isPro: st.isPro||false, aiMsgCount: st.aiMsgCount||0,
      _favorites: st._favorites||[], _notes: st._notes||[],
      _photoLogs: st._photoLogs||[], _sleepLog: st._sleepLog||[],
      _weightLog: st._weightLog||[], _moodLog: st._moodLog||[],
      _todayMood: st._todayMood||null, _stepsToday: st._stepsToday||0,
      _stepsGoal: st._stepsGoal||10000, _weeklySteps: st._weeklySteps||[0,0,0,0,0,0,0],
      _chatSessions: st._chatSessions||[], _currentChatId: st._currentChatId||null,
      _lastWaterTime: st._lastWaterTime||null,
      fastRunning: st.fastRunning||false, fastStart: st.fastStart||null,
      FAST_GOAL_H: st.FAST_GOAL_H||16
    });
    if (st.exercises?.length) { exercises.length=0; st.exercises.forEach(e=>exercises.push(e)); }
    if (st._supplements) {
      st._supplements.forEach(saved => {
        const local = _supplements.find(s=>s.id===saved.id);
        if (local && isToday) local.taken = saved.taken||false;
      });
    }
    return true;
  } catch(e) { console.warn('Load failed:', e); return false; }
}

// ── MISC HELPERS ───────────────────────────────────────────
function liveWeightCheck() {}
function showSetupInstructions() { showToast('Check README for deployment guide','ok'); }
function obSkip() { launchApp(); }
function toggleTnc(field) {
  tncState[field] = !tncState[field];
  const btn = document.getElementById('obNextBtn9');
  if (btn) btn.disabled = !(tncState.tos && tncState.disclaimer);
}
function resendEmail() { showToast('Feature coming soon','ok'); }
function closeFood() { document.querySelectorAll('.modal-bg.open').forEach(m=>m.classList.remove('open')); }
function closeFoodModal2() { closeFood(); }
function selGender(g) {
  U.gender = g;
  document.querySelectorAll('.gender-btn').forEach(b => b.classList.toggle('sel', b.dataset.val===g));
}
function selGoal(g) {
  U.goal = g;
  document.querySelectorAll('.goal-btn').forEach(b => b.classList.toggle('sel', b.dataset.val===g));
}
function setActivity(n) {
  U.actIdx = n;
  document.querySelectorAll('.act-btn').forEach((b,i) => b.classList.toggle('sel', i===n));
}
function selPlan(p) {}
function changeRate(d) {
  rateStepIdx = Math.max(0, Math.min(6, rateStepIdx+d));
  updateRateDisplay();
}
function updateRateDisplay() {
  const rates = [0.25,0.5,0.75,1,1.25,1.5,1.75];
  U.rateIdx = rateStepIdx;
  const el = document.getElementById('rateDisplay');
  if (el) el.textContent = (rates[rateStepIdx]||1) + ' kg/week';
}
function checkExtremeRate() {}
function checkGoalWeight() {}



// ═══════════════════════════════════════════════════════════
// GLOBAL SCOPE BRIDGE
// Exposes every function to window so HTML onclick="" attributes
// work across all JS modules regardless of load order.
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// GLOBAL SCOPE — Direct window assignments for HTML onclick
// Runs after all modules parse. Safe to call before DOM ready.
// ═══════════════════════════════════════════════════════════
function _bindAllToWindow() {
  const fns = ['activatePro',
    'addAiMsg',
    'addNote',
    'addNutrToDiary',
    'addSteps',
    'addTyping',
    'addUsrMsg',
    'addWater',
    'analyzeFood',
    'bindGlobalScope',
    'buildNutrGrid',
    'buildSysPrompt',
    'calculateBMI',
    'calculateMacros',
    'cancelEdit',
    'changeDay',
    'changeRate',
    'checkExtremeRate',
    'checkGoalWeight',
    'checkPaymentReturn',
    'closeAIAnalyzer',
    'closeChatSidebar',
    'closeDailyReport',
    'closeDevicesModal',
    'closeExerciseModal',
    'closeFAB',
    'closeFastModal',
    'closeFood',
    'closeFoodModal',
    'closeFoodModal2',
    'closeFoodScanner',
    'closeNoteModal',
    'closeNotificationsModal',
    'closeNutrModal',
    'closePaywall',
    'closePhotoLog',
    'closePrivacyModal',
    'closeSuggestFood',
    'closeWeightModal',
    'connectDevice',
    'createCustomFood',
    'fetchEdamam',
    'fetchEdamamNutrition',
    'filterFoodCat',
    'filterFoodDB',
    'filterNutr',
    'filterWorkout',
    'fireNotif',
    'foodsPageFilter',
    'getStripe',
    'getSuggestions',
    'handleLogout',
    'initApp',
    'initMorePage',
    'initNutritionPage',
    'initProfilePage',
    'initStepsWidget',
    'injectAdSense',
    'injectMainAds',
    'launchApp',
    'liveWeightCheck',
    'loadAppState',
    'loadChatSession',
    'logAnalyzedFood',
    'logFood',
    'logScannedFood',
    'logScannedFoodTo',
    'logSleep',
    'logoutApp',
    'manualStepsInput',
    'newChatSession',
    'obBack',
    'obNext',
    'obSkip',
    'obUpdateUI',
    'onFoodSearch',
    'onProActivated',
    'onScanFileChange',
    'openAIAnalyzer',
    'openChatSidebar',
    'openDailyReport',
    'openDevicesModal',
    'openExerciseLog',
    'openFAB',
    'openFABOption',
    'openFastModal',
    'openFastPage',
    'openFoodModal',
    'openFoodScanner',
    'openFoodSearch',
    'openFoodSearchModal',
    'openNotificationsModal',
    'openNutrDetail',
    'openNutrMenu',
    'openPaywall',
    'openPhotoLog',
    'openPrivacyModal',
    'openSleepLog',
    'openSuggestFood',
    'openWeightLog',
    'parseScan',
    'previewPhotoLog',
    'qf',
    'quickAddExercise',
    'quickAddFoodByIdx',
    'quickAddFromDB',
    'quickAddFromLibrary',
    'quickAsk',
    'quickLogFood',
    'recalc',
    'refreshPlanNums',
    'removeExercise',
    'renderChatHistory',
    'renderDV',
    'renderDailyReport',
    'renderDashboard',
    'renderExerciseLibrary',
    'renderExercises',
    'renderFavorites',
    'renderFoodDB',
    'renderFoodSearchResults',
    'renderMealBlocks',
    'renderMoodTracker',
    'renderNotesList',
    'renderPhotoHistory',
    'renderProgress',
    'renderProgressCharts',
    'renderScanResult',
    'renderSleepHistory',
    'renderStepsLineChart',
    'renderStepsWidget',
    'renderSupplements',
    'renderWater',
    'renderWeeklyChart',
    'renderWeightHistory',
    'renderWeightLineChart',
    'renderWorkoutPage',
    'requestNotifications',
    'resendEmail',
    'resetFast',
    'rm',
    'runFoodScan',
    'saveAppState',
    'saveChatSession',
    'saveExercise',
    'saveNote',
    'savePhotoLog',
    'saveProfileField',
    'saveStepsState',
    'saveWeightLog',
    'scanFoodByText',
    'scheduleSmartNotifications',
    'searchExercises',
    'selGender',
    'selGoal',
    'selMealTab',
    'selMealTabByName',
    'selPlan',
    'selectPlan',
    'selectSearchFood',
    'sendMsg',
    'setActivity',
    'setFoodCat',
    'setMood',
    'setSleepQuality',
    'showPage',
    'showScreen',
    'showSetupInstructions',
    'showSleepPage',
    'showToast',
    'startCheckout',
    'startFast',
    'startMotionStepCount',
    'switchFoodsTab',
    'toggleDrSection',
    'toggleEdit',
    'toggleEx',
    'toggleFast',
    'toggleFavorite',
    'toggleMealSection',
    'toggleNutrAccordion',
    'toggleNutrLib',
    'toggleSFFilter',
    'toggleSet',
    'toggleSupp',
    'toggleTnc',
    'updateDateNav',
    'updateFastDisplay',
    'updateFastTimer',
    'updateMacroDisplay',
    'updateNotifStatus',
    'updateRateDisplay',
    'updateSleepStats',
    'updateWorkoutStats',
    'validateStep'
  ];
  fns.forEach(function(name) {
    try {
      // eslint-disable-next-line no-eval
      var fn = eval(name);
      if (typeof fn === 'function') window[name] = fn;
    } catch(e) {}
  });
  // Explicit aliases for commonly missing ones
  window.openLogSleep   = window.openSleepLog   || function(){};
  window.showDatePicker = window.updateDateNav   || function(){};
  window.initNutritionPage = function() {
    if (typeof buildNutrGrid === 'function') {
      var g = document.getElementById('nlGrid');
      var c = document.getElementById('nlCollapse');
      if (g && g.children.length === 0) buildNutrGrid(typeof NUTRIENTS !== 'undefined' ? NUTRIENTS : []);
      if (c && (c.style.display === 'none' || !c.style.display)) {
        c.style.display = 'block';
        var tog = document.getElementById('nlToggle');
        if (tog) tog.textContent = '▴';
      }
    }
  };
}

// ── Stub stubs for missing inline handlers ──────────────────
window.openLogSleep  = function() { openSleepLog(); };
window.showDatePicker = function() { /* native date nav is enough */ };

// ═══════════════════════════════════════════════════════════
// ADSENSE INJECTION (native card style, FREE users only)
// ═══════════════════════════════════════════════════════════
function injectMainAds() {
  if (window.isPro) return; // No ads for PRO ✨
  const container = document.getElementById('mainAdContainer');
  if (!container || container.dataset.injected) return;
  container.dataset.injected = '1';

  container.innerHTML = `
    <div style="
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: 16px;
      margin: 14px 0 4px;
      padding: 8px;
      overflow: hidden;
    ">
      <div style="font-size:.6rem;color:var(--muted);text-align:center;
                  letter-spacing:.5px;margin-bottom:4px;text-transform:uppercase">
        Sponsored
      </div>
      <script async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7252126084365082"
        crossorigin="anonymous"><\/script>
      <ins class="adsbygoogle"
           style="display:block;border-radius:10px;overflow:hidden"
           data-ad-client="ca-pub-7252126084365082"
           data-ad-slot="4518705482"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});<\/script>
    </div>`;
}
window.injectMainAds = injectMainAds;

// ═══════════════════════════════════════════════════════════
// BOOT — Single entry point. Runs after all modules load.
// ═══════════════════════════════════════════════════════════
function _anthrosBoot() {
  // Bind all module functions to window FIRST
  _bindAllToWindow();

  try {
    // 1. Restore persisted state
    const restored = loadAppState();

    // 2. Hide loading screen regardless
    const loader = document.getElementById('loadingScreen');
    if (loader) {
      loader.style.transition = 'opacity .35s ease';
      loader.style.opacity = '0';
      setTimeout(() => { loader.style.display = 'none'; }, 380);
    }

    // 3. Decide screen: onboarding vs main app
    if (restored && window.U && window.U.name) {
      // Returning user — go straight to dashboard
      showScreen('app');
      showPage('dash', document.getElementById('nav-dash'));

      // Hydrate UI
      setTimeout(() => {
        updateMacroDisplay();
        renderMealBlocks();
        renderWater();
        renderMoodTracker();
        renderStepsWidget();
        renderNotesList();
        if (window.fastRunning && window.fastStart) {
          clearInterval(window.fastInterval);
          window.fastInterval = setInterval(updateFastTimer, 1000);
        }
        // AdSense — delay to not block render
        setTimeout(injectMainAds, 2500);
      }, 80);
    } else {
      // New user — show onboarding
      showScreen('onboarding');
      if (typeof obUpdateUI === 'function') obUpdateUI();
    }

    // 4. Check Stripe payment return
    checkPaymentReturn();

    // 5. Wake up smart notifications if granted
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {
      scheduleSmartNotifications();
    }

    console.log('✅ AnthrosAI booted');
  } catch (err) {
    console.error('Boot error:', err);
    // Fail-safe: show onboarding
    const loader = document.getElementById('loadingScreen');
    if (loader) loader.style.display = 'none';
    if (typeof showScreen === 'function') showScreen('onboarding');
  }
}

// Fire when all scripts are parsed (window.load > DOMContentLoaded for safety)
window.addEventListener('load', function() {
  setTimeout(_anthrosBoot, 300);
});

// ── NET CALORIES (consumed - burned) ──────────────────────
function calcNetCalories() {
  var burned = calcCaloriesBurned();
  var net = (totalCals || 0) - burned;
  window._netCalories = net;
  window._caloriesBurned = burned;
  // Update net display if element exists
  var netEl = document.getElementById('netCalDisplay');
  if (netEl) netEl.textContent = net;
  var burnEl = document.getElementById('burnedDisplay');
  if (burnEl) burnEl.textContent = burned;
  // Update calorie ring to reflect NET
  var ringNum = document.getElementById('ringNum');
  if (ringNum) ringNum.textContent = totalCals;
  var ringFill = document.getElementById('ringCalFill');
  if (ringFill && U.calories) {
    var pct = Math.min(1, totalCals / U.calories);
    ringFill.style.strokeDashoffset = 314 * (1 - pct);
  }
  return net;
}
window.calcNetCalories = calcNetCalories;

function calcCaloriesBurned() {
  var workoutBurn = (exercises || []).reduce(function(sum, ex) {
    var sets = Array.isArray(ex.sets) ? ex.sets : [];
    var doneSets = sets.filter(function(s){ return s.done; }).length;
    // Rough: ~50 kcal per completed set (adjustable)
    return sum + doneSets * 50;
  }, 0);
  var stepsBurn = Math.round((_stepsToday || 0) * 0.04); // ~0.04 kcal/step
  return workoutBurn + stepsBurn;
}
window.calcCaloriesBurned = calcCaloriesBurned;

window.showPage = showPage;
window.showScreen = showScreen;
window.showToast = showToast;

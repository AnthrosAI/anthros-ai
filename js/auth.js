/**
 * AnthrosAI — auth.js
 * Onboarding flow, user profile setup, macro calculation
 */

'use strict';

// ── CONSTANTS (self-contained so auth.js works without app.js) ──
var _ACT_MULT  = [1.2, 1.375, 1.465, 1.55, 1.725, 1.9];
var _ACT_NAMES = ['Sedentary','Lightly Active','Moderately Active','Active','Very Active','Athlete'];
var _ACT_DESCS = [
  'Desk job, no exercise.',
  'Light exercise 1-3 days/week or daily walking.',
  '3-5 days exercise or moderate-intensity job.',
  'Hard exercise 6-7 days/week or physical job.',
  'Very hard exercise daily, or two-a-days.',
  'Professional athlete or extreme training.'
];
var _RATES = [-1.0, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1.0];
// Also expose as globals for app.js references
if (typeof window !== 'undefined') {
  window._ACT_MULT  = _ACT_MULT;
  window._ACT_NAMES = _ACT_NAMES;
  window._ACT_DESCS = _ACT_DESCS;
  window._RATES     = _RATES;
}

function calculateMacros() {
  var age    = window.U.age    || 22;
  var gender = window.U.gender || 'male';
  var height = window.U.height || 175;
  var weight = window.U.weight || 75;
  var actIdx = window.U.actIdx != null ? window.U.actIdx : 2;

  // Mifflin-St Jeor BMR
  var bmr = gender === 'male'
    ? 10*weight + 6.25*height - 5*age + 5
    : 10*weight + 6.25*height - 5*age - 161;

  var mult = _ACT_MULT[Math.max(0, Math.min(5, actIdx))] || 1.465;
  var tdee = Math.round(bmr * mult);
  window.U.tdee = tdee;

  // Rate: use rateStepIdx if defined, else rateIdx on U
  var rsi  = (typeof window.rateStepIdx !== 'undefined') ? window.rateStepIdx
           : (window.U.rateIdx != null ? window.U.rateIdx : 4);
  var weeklyRateRaw = _RATES[Math.max(0, Math.min(_RATES.length-1, rsi))] || 0;

  // Flip sign for bulk goal
  var weeklyRate = weeklyRateRaw;
  if (window.U.goal === 'bulk' && weeklyRate <= 0) weeklyRate = Math.abs(weeklyRate) || 0.25;
  if (window.U.goal === 'cut'  && weeklyRate >= 0) weeklyRate = -(Math.abs(weeklyRate) || 0.25);
  if (window.U.goal === 'maintain') weeklyRate = 0;

  var dailyDelta = Math.round(weeklyRate * 7700 / 7);
  window.U.calories = Math.max(1200, Math.round(tdee + dailyDelta));

  window.U.protein = Math.round(weight * 2.2);
  window.U.fats    = Math.round(window.U.calories * 0.25 / 9);
  window.U.carbs   = Math.max(0, Math.round((window.U.calories - window.U.protein*4 - window.U.fats*9) / 4));

  var hm = height / 100;
  window.U.bmi = Math.round((weight / (hm*hm)) * 10) / 10;

  var diff    = Math.abs((window.U.goalWeight||weight) - weight);
  var absRate = Math.abs(weeklyRate) || 0.5;
  window.U.timeline = diff > 0 ? Math.round(diff / absRate) : 0;

  // Sync app.js globals if they exist
  if (typeof rateStepIdx !== 'undefined') window.rateStepIdx = rsi;
}
window.calculateMacros = calculateMacros;


function launchApp() {
  window.U = window.U || {};
  if (!window.U.name)       window.U.name       = 'Athlete';
  if (!window.U.height)     window.U.height     = 175;
  if (!window.U.weight)     window.U.weight     = 75;
  if (!window.U.goalWeight) window.U.goalWeight = window.U.weight - 5;
  if (!window.U.age)        window.U.age        = 22;
  if (window.U.actIdx == null) window.U.actIdx  = 2;
  calculateMacros();
  if (typeof saveAppState === 'function') saveAppState();
  if (typeof showScreen === 'function') showScreen('app');
  if (typeof showPage === 'function') showPage('dash', document.getElementById('nav-dash'));
  if (typeof initApp === 'function') setTimeout(initApp, 50);
}
window.launchApp = launchApp;


function initApp() {
  var _e = function(id){ return document.getElementById(id); };
  var _set = function(id, v){ var el = _e(id); if(el) el.textContent = v; };
  _set('avatarEl', U.name && U.name[0] ? U.name[0].toUpperCase() : '?');
  const hour = new Date().getHours();
  const gr = hour < 12 ? 'Good Morning' : hour < 17 ? 'Let\'s Work' : 'Evening Grind';
  _set('greetH2', gr + ', ' + (U.name||'Athlete') + ' 👊');
  _set('greetSub', (U.calories||2000).toLocaleString() + ' kcal · ' + (U.protein||0) + 'g protein today.');

  // macro goals
  ['proG','carbG','fatG'].forEach((id,i) => {
    _set(id, [U.protein, U.carbs, U.fats][i]);
  });
  _set('stat4Cal', (U.calories||0).toLocaleString());
  const wkGoal = U.goal === 'cut' ? `−${Math.abs(RATES[rateStepIdx])}kg` : U.goal === 'bulk' ? `+${RATES[rateStepIdx]}kg` : 'Recomp';
  _set('stat4Wk', wkGoal);
  _set('nsGoal', U.calories||0);
  _set('nsLeft', U.calories||0);

  // water glasses
  renderWater();
  // exercises
  renderExercises();
  // meal blocks
  renderMealBlocks();
  // progress
  renderProgress();

  // V5 element initialization
  (function() {
    var e = function(id){ return document.getElementById(id); };
    if(e('msProteinTarget')) e('msProteinTarget').textContent = U.protein || 0;
    if(e('msCarbsTarget')) e('msCarbsTarget').textContent = U.carbs || 0;
    if(e('msFatTarget')) e('msFatTarget').textContent = U.fats || 0;
    if(e('moreAvatar')) e('moreAvatar').textContent = U.name ? U.name[0].toUpperCase() : '?';
    if(e('moreName')) e('moreName').textContent = U.name || 'Athlete';
    if(e('moreEmail')) e('moreEmail').textContent = U.email || '';
    if(typeof updateDateNav === 'function') updateDateNav();
    // initialize foods page
    setTimeout(function() {
      if(typeof renderFoodDB === 'function') renderFoodDB();
  renderMealBlocks();
    }, 300);
    // initialize V5 macro badges to show 0%
    var pBadges = ['Energy','Protein','Carbs','Fat'];
    pBadges.forEach(function(b) {
      var pe = e('pct'+b);
      if(pe) { pe.textContent='0%'; pe.className='mbadge-pct grey'; }
    });
  })();

  // AI greeting
  setTimeout(() => {
    _set('aiCtxChip', U.weight+'kg · '+U.calories+'kcal');
    const bmiLbl = U.bmi < 18.5 ? 'underweight' : U.bmi < 25 ? 'healthy' : U.bmi < 30 ? 'overweight' : 'obese range';
    const goalVerb = U.goal === 'cut' ? `lose ${(U.weight - U.goalWeight).toFixed(1)}kg` : U.goal === 'bulk' ? `gain ${(U.goalWeight - U.weight).toFixed(1)}kg of muscle` : 'maintain and recomp';
    addAiMsg(`Wassup ${U.name}! 🔥 I've processed your stats — ${U.weight}kg at ${U.height}cm, BMI **${U.bmi}** (${bmiLbl}).\n\nYour personalized plan:\n• **Calories: ${U.calories.toLocaleString()} kcal/day** (TDEE: ${U.tdee.toLocaleString()})\n• **Protein: ${U.protein}g** · Carbs: **${U.carbs}g** · Fats: **${U.fats}g**\n• Goal: ${goalVerb} in ~**${U.timeline || '?'}** weeks\n\nI'm fully loaded with your context. Ask me anything — nutrition, training, recovery, supplements. Let's get it. 💪`);
  }, 400);
}

function validateStep() {
  // Step 1: name
  if (obStep === 1) {
    const n = document.getElementById('f-name').value.trim();
    if (!n) { document.getElementById('f-name').classList.add('error'); return false; }
    document.getElementById('f-name').classList.remove('error');
    U.name = n;
  }
  // Step 2: profile
  if (obStep === 2) {
    const dob = document.getElementById('f-dob').value;
    const h = parseFloat(document.getElementById('f-height').value);
    const w = parseFloat(document.getElementById('f-weight').value);
    if (!dob || !h || !w || h < 100 || w < 30) {
      [dob ? null : document.getElementById('f-dob'),
       h ? null : document.getElementById('f-height'),
       w ? null : document.getElementById('f-weight')].forEach(el => el && el.classList.add('error'));
      return false;
    }
    U.dob = dob; U.height = h; U.weight = w;
    const age = new Date().getFullYear() - new Date(dob).getFullYear();
    U.age = age;
    calculateBMI();
  }
  // Step 4: goal weight
  if (obStep === 4) {
    const gw = parseFloat(document.getElementById('f-goalwt').value);
    if (!gw || gw < 30) { document.getElementById('f-goalwt').classList.add('error'); return false; }
    const errEl = document.getElementById('goalWtError');
    if (errEl.classList.contains('show')) return false; // blocked by BMI check
    U.goalWeight = gw;
    document.getElementById('f-goalwt').classList.remove('error');
  }
  // Step 5: rate
  if (obStep === 5) { U.rateIdx = rateIdx; calculateMacros(); }
  // Step 6: account
  if (obStep === 6) {
    const name = document.getElementById('a-name').value.trim();
    const email = document.getElementById('a-email').value.trim();
    const pass = document.getElementById('a-pass').value;
    const pass2 = document.getElementById('a-pass2').value;
    const errEl = document.getElementById('accountError');
    if (!name || !email || !pass || !pass2) { errEl.textContent='Please fill in all fields.'; errEl.classList.add('show'); return false; }
    if (!email.includes('@') || !email.includes('.')) { errEl.textContent='Please enter a valid email address.'; errEl.classList.add('show'); return false; }
    if (pass.length < 8) { errEl.textContent='Password must be at least 8 characters.'; errEl.classList.add('show'); return false; }
    if (pass !== pass2) { errEl.textContent='Passwords do not match.'; errEl.classList.add('show'); return false; }
    errEl.classList.remove('show');
    U.name = name || U.name; U.email = email;
    document.getElementById('a-name').value = U.name;
    document.getElementById('verifyEmailShow').textContent = email;
  }
  // Step 7: T&C
  if (obStep === 7) {
    if (!tncState.tos || !tncState.disclaimer) {
      document.getElementById('tncError').classList.add('show'); return false;
    }
    document.getElementById('tncError').classList.remove('show');
  }
  return true;
}

function obUpdateUI() {
  const pct = ((obStep+1)/TOTAL_STEPS)*100;
  document.getElementById('obProg').style.width = pct+'%';
  document.getElementById('obStepLbl').textContent = `Step ${obStep+1} of ${TOTAL_STEPS}`;
  document.getElementById('obSlides').style.transform = `translateX(-${obStep * 100}%)`;

  const ctaLabels = [
    'Get Started →', 'Next →', 'Next →', 'Next →',
    'Next →', 'Review My Plan →', 'Create Account →',
    'Accept & Continue →', 'Enter FITGRIND 🔥'
  ];
  document.getElementById('obCta').textContent = ctaLabels[obStep] || 'Next →';
  document.getElementById('obSkipLink').style.display = obStep < 7 ? 'block' : 'none';
  document.getElementById('obBackBtn').style.opacity = obStep === 0 ? '0.3' : '1';

  if (obStep === 5) recalc();
}

function obNext() {
  if (!validateStep()) return;

  if (obStep < TOTAL_STEPS - 1) {
    obStep++;
    obUpdateUI();
  } else {
    launchApp();
  }
}

function obBack() {
  if (obStep === 0) return;
  obStep--;
  obUpdateUI();
}
// ── Auth window bindings ──
window.obUpdateUI = obUpdateUI;
window.initApp = initApp;
window.validateStep = validateStep;
window.obBack = obBack;
window.launchApp = launchApp;
window.obNext = obNext;
window.calculateMacros = calculateMacros;


function setActivity(n) {
  n = Math.max(0, Math.min(5, parseInt(n, 10)));
  if (isNaN(n)) n = 2;
  window.U.actIdx = n;

  var titleEl = document.getElementById('actArrowTitle') || document.getElementById('actTitle');
  var descEl  = document.getElementById('actArrowDesc')  || document.getElementById('actDesc');
  if (titleEl) titleEl.textContent = _ACT_NAMES[n];
  if (descEl)  descEl.textContent  = _ACT_DESCS[n];

  // Legacy dots highlight
  document.querySelectorAll('.activity-dot').forEach(function(d, i) {
    d.classList.toggle('sel', i === n);
  });
  if (typeof recalc === 'function') recalc();
}
window.setActivity = setActivity;
function selGoal(g) {
  // Accept either a string or a DOM element (onclick="selGoal(this)")
  var val = (typeof g === 'string') ? g : (g && g.dataset ? g.dataset.val : g);
  if (!val) return;
  window.U.goal = val;
  document.querySelectorAll('.goal-btn').forEach(function(b) {
    b.classList.toggle('sel', b.dataset.val === val);
  });
  if (typeof recalc === 'function') recalc();
}
window.selGoal = selGoal;
function selGender(g) {
  var val = (typeof g === 'string') ? g : (g && g.dataset ? g.dataset.val : g);
  if (!val) return;
  window.U.gender = val;
  document.querySelectorAll('.gender-btn').forEach(function(b) {
    b.classList.toggle('sel', b.dataset.val === val);
  });
  if (typeof recalc === 'function') recalc();
}
window.selGender = selGender;
function checkGoalWeight() {
  var gw  = parseFloat((document.getElementById('f-goalwt') || {}).value) || 0;
  var h   = window.U.height || 175;
  var err = document.getElementById('goalWtError');
  if (!gw || !h) { if (err) err.classList.remove('show'); return; }
  var hm  = h / 100;
  var bmi = gw / (hm * hm);
  var msg = '';
  if (bmi < 16)        msg = '⚠️ This goal weight gives a BMI of ' + bmi.toFixed(1) + ' — dangerously underweight.';
  else if (bmi < 18.5) msg = '⚠️ BMI ' + bmi.toFixed(1) + ' — this is underweight. Consider a safer goal.';
  else if (bmi > 35)   msg = '⚠️ BMI ' + bmi.toFixed(1) + ' — this goal is in the obese range.';
  else if (bmi > 30)   msg = '⚠️ BMI ' + bmi.toFixed(1) + ' — slightly above healthy range (18.5–25).';
  if (err) {
    err.textContent = msg;
    err.classList.toggle('show', msg !== '');
  }
  if (gw > 0) {
    window.U.goalWeight = gw;
    if (typeof recalc === 'function') recalc();
  }
}
window.checkGoalWeight = checkGoalWeight;
function liveWeightCheck() {
  var w = parseFloat((document.getElementById('f-weight') || {}).value) || 0;
  var h = parseFloat((document.getElementById('f-height') || {}).value) || 0;
  if (w) window.U.weight = w;
  if (h) window.U.height = h;
  if (w && h) {
    if (typeof calculateMacros === 'function') calculateMacros();
  }
}
window.liveWeightCheck = liveWeightCheck;
function refreshPlanNums() {
  calculateMacros();
  var U = window.U;
  function _set(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }

  // Onboarding review panel
  var rsi  = (typeof window.rateStepIdx !== 'undefined') ? window.rateStepIdx : (U.rateIdx||4);
  var rates = [-1.0,-0.75,-0.5,-0.25,0,0.25,0.5,0.75,1.0];
  var wkRate = rates[Math.max(0,Math.min(rates.length-1,rsi))];
  var dailyDelta = Math.round(Math.abs(wkRate) * 7700 / 7);
  var sign = (U.goal==='bulk') ? '+' : (U.goal==='cut') ? '−' : '±';

  _set('goEnergy',   (U.calories||0).toLocaleString() + ' kcal/day');
  _set('goDelta',    sign + dailyDelta + ' kcal/day');
  _set('goForecast', (U.timeline||0) + ' weeks');
  _set('goPro',      (U.protein||0) + 'g/day');
  _set('goCarb',     (U.carbs||0)   + 'g/day');
  _set('goFat',      (U.fats||0)    + 'g/day');

  // Main plan panel
  _set('planCal',  U.calories||0);
  _set('planPro',  (U.protein||0)+'g');
  _set('planCarb', (U.carbs||0)+'g');
  _set('planFat',  (U.fats||0)+'g');
  _set('planTDEE', U.tdee||0);

  // BMI bar
  var bmiEl = document.getElementById('bmiVal');
  if (bmiEl) bmiEl.textContent = (U.bmi||0).toFixed(1);
  var bmiBar = document.getElementById('bmiBar');
  if (bmiBar) {
    var pct = Math.min(100, Math.max(0, ((U.bmi||22) - 15) / (40-15) * 100));
    bmiBar.style.width = pct + '%';
  }
}
window.refreshPlanNums = refreshPlanNums;
function recalc() {
  if (!window.U.height || !window.U.weight) return;
  calculateMacros();
  if (typeof refreshPlanNums === 'function') refreshPlanNums();
  if (typeof saveAppState === 'function') saveAppState();
}
window.recalc = recalc;function obSkip() {
  window.U = window.U || {};
  if (!window.U.name)       window.U.name       = 'Athlete';
  if (!window.U.height)     window.U.height     = 175;
  if (!window.U.weight)     window.U.weight     = 75;
  if (!window.U.age)        window.U.age        = 22;
  if (!window.U.goalWeight) window.U.goalWeight = window.U.weight - 5;
  if (window.U.actIdx == null) window.U.actIdx  = 2;
  calculateMacros();
  document.querySelectorAll('.modal-bg, .modal-sheet, [id$="Modal"]').forEach(function(m) {
    m.style.display = 'none';
  });
  launchApp();
}
window.obSkip = obSkip;

/**
 * AnthrosAI — auth.js
 * Onboarding flow, user profile setup, macro calculation
 */

'use strict';

function calculateMacros() {
  const { age, gender, height, weight, actIdx } = U;
  const bmr = gender === 'male'
    ? 10*weight + 6.25*height - 5*(age||22) + 5
    : 10*weight + 6.25*height - 5*(age||22) - 161;

  const tdee = Math.round(bmr * (ACTIVITY[actIdx||2].mult));
  U.tdee = tdee;

  const weeklyRate = RATES[rateStepIdx];
  const dailyDelta = Math.round(weeklyRate * 7700 / 7);
  U.calories = Math.max(1200, Math.round(tdee + dailyDelta));

  U.protein = Math.round(weight * 2.2);
  U.fats = Math.round(U.calories * 0.25 / 9);
  U.carbs = Math.max(0, Math.round((U.calories - U.protein*4 - U.fats*9) / 4));

  const hm = height / 100;
  U.bmi = Math.round((weight / (hm*hm)) * 10) / 10;

  const diff = Math.abs((U.goalWeight||weight) - weight);
  const absRate = Math.abs(weeklyRate) || 0.5;
  U.timeline = diff > 0 ? Math.round(diff / absRate) : 0;
}


function launchApp() {
  if (!window.U.name) window.U.name = 'Athlete';
  if (!window.U.height) { window.U.height=175; window.U.weight=75; window.U.goalWeight=70; window.U.age=22; }
  if (typeof calculateMacros === 'function') calculateMacros();
  if (typeof showScreen === 'function') showScreen('app');
  if (typeof initApp === 'function') initApp();
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
  n = Math.max(0, Math.min(5, parseInt(n) || 0));
  window.U.actIdx = n;
  // Update arrow selector labels
  var actNames = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Active', 'Very Active', 'Athlete'];
  var actDescs = ['Desk job, no exercise. Minimal movement throughout the day.', 'Light exercise 1-3 days/week or daily walking.', '3-5 days exercise or moderate-intensity job.', 'Hard exercise 6-7 days/week or physical job.', 'Very hard exercise daily, or two-a-days.', 'Professional athlete or extremely intense training.'];
  var titleEl = document.getElementById('actArrowTitle') || document.getElementById('actTitle');
  var descEl  = document.getElementById('actArrowDesc')  || document.getElementById('actDesc');
  if (titleEl) titleEl.textContent = actNames[n] || actNames[2];
  if (descEl)  descEl.textContent  = actDescs[n] || actDescs[2];
  // Legacy dots (if still present)
  document.querySelectorAll('.activity-dot').forEach(function(d, i) {
    d.classList.toggle('sel', i === n);
  });
  if (typeof recalc === 'function') recalc();
}
window.setActivity = setActivity;

/**
 * AnthrosAI — auth.js  v10
 * ─────────────────────────────────────────────────────────
 * Architecture:
 *  • Zero inline onclick. All events via delegation on #onboarding.
 *  • data-action  → button actions  (ob-next, ob-back, rate-inc…)
 *  • data-sel-group + data-sel-val → selection groups (gender, goal…)
 *  • data-tnc-key → T&C checkboxes
 *  • Onboarding draft auto-saved to localStorage at every step.
 *  • window.U carries _lastSave + _lastDailyReset for daily resets.
 *  • All AI calls proxy through /api/groq — no client-side key ever.
 * ─────────────────────────────────────────────────────────
 */

'use strict';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS — self-contained; no dependency on app.js order
   ═══════════════════════════════════════════════════════════ */
var AUTH = (function () {

  // ── Activity levels ──────────────────────────────────────
  var ACT = [
    { mult: 1.200, name: 'Sedentary',         icon: '🪑',
      desc: 'Desk job or mostly sitting. Little to no exercise.',
      ex:   'Office worker, driver, or student who rarely exercises.' },
    { mult: 1.375, name: 'Lightly Active',     icon: '🚶',
      desc: 'Light exercise 1–3 days per week.',
      ex:   'Casual walking, light yoga, or recreational sports.' },
    { mult: 1.465, name: 'Moderately Active',  icon: '🏃',
      desc: 'Moderate exercise 3–5 days per week.',
      ex:   'Gym sessions, running 3×/week, active job like retail.' },
    { mult: 1.550, name: 'Active',             icon: '🏋️',
      desc: 'Hard exercise 6–7 days per week.',
      ex:   'Daily training, construction work, or sports competition.' },
    { mult: 1.725, name: 'Very Active',        icon: '⚡',
      desc: 'Very intense exercise daily or two-a-day sessions.',
      ex:   'Competitive athletes in heavy training blocks.' },
    { mult: 1.900, name: 'Athlete',            icon: '🏆',
      desc: 'Professional-level training or extreme physical labour.',
      ex:   'Elite athletes, soldiers in field training.' }
  ];

  // ── Goal-rate options ─────────────────────────────────────
  // [rateVal kg/wk, label, level]
  var RATES = [
    { v: -1.00, label: '−1.00 kg / week', level: 'extreme'  },
    { v: -0.75, label: '−0.75 kg / week', level: 'fast'     },
    { v: -0.50, label: '−0.50 kg / week', level: 'moderate' },
    { v: -0.25, label: '−0.25 kg / week', level: 'gentle'   },
    { v:  0.00, label: 'Maintain weight',  level: 'maintain' },
    { v: +0.25, label: '+0.25 kg / week',  level: 'gentle'   },
    { v: +0.50, label: '+0.50 kg / week',  level: 'moderate' },
    { v: +0.75, label: '+0.75 kg / week',  level: 'fast'     },
    { v: +1.00, label: '+1.00 kg / week',  level: 'extreme'  }
  ];

  // ── Goal metadata ─────────────────────────────────────────
  var GOALS = {
    cut:      { label: 'Lose Fat',     defaultRateIdx: 2 },
    bulk:     { label: 'Build Muscle', defaultRateIdx: 6 },
    maintain: { label: 'Maintain',     defaultRateIdx: 4 },
    perform:  { label: 'Performance',  defaultRateIdx: 6 }
  };

  // ── Onboarding step definitions ───────────────────────────
  var STEPS = 8;       // slides 0-7; slide 8 is the email confirm (post-submit)
  var DRAFT_KEY = 'anthros_ob_v10';

  /* ─────────────────────────────────────────────────────────
     STATE
     ───────────────────────────────────────────────────────── */
  var state = {
    step:     0,
    rateIdx:  2,       // default → −0.50 kg/wk for "cut"
    tnc:      { tos: false, disclaimer: false, marketing: false }
  };

  /* ─────────────────────────────────────────────────────────
     window.U  — canonical user object
     _lastSave        ISO timestamp of last full save
     _lastDailyReset  ISO date-string (YYYY-MM-DD) for daily-reset checks
     ───────────────────────────────────────────────────────── */
  function buildEmptyU() {
    return {
      // Identity
      name:       '',
      email:      '',
      // Biometrics
      gender:     'male',
      dob:        '',
      age:        22,
      height:     0,   // cm
      weight:     0,   // kg
      goalWeight: 0,   // kg
      bmi:        0,
      // Training profile
      actIdx:     2,
      goal:       'cut',
      rateIdx:    2,
      // Computed macros
      tdee:       0,
      calories:   0,
      protein:    0,
      carbs:      0,
      fats:       0,
      timeline:   0,
      // Housekeeping — used by app.js for daily resets
      _lastSave:        null,
      _lastDailyReset:  null,
      // Future: tie to DB user
      _uid:             null,
      _authToken:       null
    };
  }

  /* ─────────────────────────────────────────────────────────
     MACRO ENGINE  (Mifflin-St Jeor)
     ───────────────────────────────────────────────────────── */
  function calculateMacros() {
    var U = window.U;
    if (!U.height || !U.weight) return;

    var age    = U.age    || 22;
    var height = U.height;
    var weight = U.weight;
    var gender = U.gender || 'male';
    var actIdx = (U.actIdx != null) ? U.actIdx : 2;

    // BMR
    var bmr = gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

    // TDEE
    var mult = ACT[Math.min(5, Math.max(0, actIdx))].mult;
    U.tdee = Math.round(bmr * mult);

    // Weekly rate — sign follows goal direction
    var ri      = (state.rateIdx != null) ? state.rateIdx : (U.rateIdx || 2);
    var rawRate = RATES[Math.min(RATES.length - 1, Math.max(0, ri))].v;
    var rate    = rawRate;

    // Enforce direction by goal
    if (U.goal === 'cut')      rate = -Math.abs(rate) || -0.25;
    if (U.goal === 'bulk')     rate =  Math.abs(rate) ||  0.25;
    if (U.goal === 'maintain') rate = 0;
    if (U.goal === 'perform')  rate =  Math.abs(rate) ||  0.5;

    var dailyDelta = Math.round(rate * 7700 / 7);
    U.calories = Math.max(1200, U.tdee + dailyDelta);

    // Macros
    U.protein = Math.round(weight * 2.2);
    U.fats    = Math.round(U.calories * 0.25 / 9);
    U.carbs   = Math.max(0, Math.round((U.calories - U.protein * 4 - U.fats * 9) / 4));

    // BMI (current)
    var hm  = height / 100;
    U.bmi   = Math.round((weight / (hm * hm)) * 10) / 10;

    // Timeline
    var diff    = Math.abs((U.goalWeight || weight) - weight);
    var absRate = Math.abs(rate) || 0.25;
    U.timeline  = diff > 0 ? Math.round(diff / absRate) : 0;

    // Sync legacy globals that app.js may reference
    window.rateStepIdx = ri;
    U.rateIdx = ri;
  }

  /* ─────────────────────────────────────────────────────────
     BMI HELPERS
     ───────────────────────────────────────────────────────── */
  function bmiLabel(bmi) {
    if (bmi < 16)   return { text: 'Dangerously underweight', color: '#FF3B3B' };
    if (bmi < 18.5) return { text: 'Underweight',             color: '#FF9500' };
    if (bmi < 25)   return { text: 'Healthy',                 color: '#34C759' };
    if (bmi < 30)   return { text: 'Overweight',              color: '#FF9500' };
    if (bmi < 35)   return { text: 'Obese',                   color: '#FF3B3B' };
    return             { text: 'Severely obese',           color: '#FF3B3B' };
  }

  // Returns true if BMI is so extreme we must block progress
  function bmiIsBlocking(bmi) {
    return bmi < 15 || bmi > 45;
  }

  /* ─────────────────────────────────────────────────────────
     PERSISTENCE
     ───────────────────────────────────────────────────────── */
  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        step:     state.step,
        rateIdx:  state.rateIdx,
        tnc:      state.tnc,
        U:        window.U
      }));
    } catch (e) { /* storage full or private mode */ }
  }

  function loadDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return false;
      var d = JSON.parse(raw);
      if (!d || !d.U) return false;
      state.step    = d.step    || 0;
      state.rateIdx = d.rateIdx != null ? d.rateIdx : 2;
      state.tnc     = d.tnc    || { tos: false, disclaimer: false, marketing: false };
      // Merge saved U into window.U (keep defaults for missing fields)
      var base = buildEmptyU();
      window.U = Object.assign(base, d.U);
      return true;
    } catch (e) { return false; }
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
  }

  /* ─────────────────────────────────────────────────────────
     DOM HELPERS
     ───────────────────────────────────────────────────────── */
  function $ (id) { return document.getElementById(id); }
  function $$ (sel) { return document.querySelectorAll(sel); }

  function setVal(id, v) {
    var el = $(id);
    if (el) el.textContent = (v == null ? '—' : v);
  }

  function showErr(id, msg) {
    var el = $(id);
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('ob-error--visible', !!msg);
  }

  function showWarn(id, msg) {
    var el = $(id);
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('ob-warn--visible', !!msg);
  }

  function clearFieldError(id) {
    var el = $(id);
    if (el) el.classList.remove('ob-field--error');
  }

  function fieldError(id) {
    var el = $(id);
    if (el) el.classList.add('ob-field--error');
    return false;
  }

  /* Selection group: highlight the chosen option */
  function applySelGroup(group, val) {
    $$('[data-sel-group="' + group + '"]').forEach(function (btn) {
      btn.classList.toggle('is-selected', btn.dataset.selVal === String(val));
    });
  }

  /* ─────────────────────────────────────────────────────────
     STEP RENDERERS  — called each time we arrive at a slide
     ───────────────────────────────────────────────────────── */
  var stepRenderers = {

    0: function () { /* welcome — nothing to hydrate */ },

    1: function () {
      var el = $('f-name');
      if (el && window.U.name) el.value = window.U.name;
    },

    2: function () {
      var U = window.U;
      applySelGroup('gender', U.gender || 'male');
      if ($('f-dob')    && U.dob)    $('f-dob').value    = U.dob;
      if ($('f-height') && U.height) $('f-height').value = U.height;
      if ($('f-weight') && U.weight) $('f-weight').value = U.weight;
    },

    3: function () {
      renderActivityCard(window.U.actIdx != null ? window.U.actIdx : 2);
    },

    4: function () {
      var U = window.U;
      applySelGroup('goal', U.goal || 'cut');
      if ($('f-goalwt') && U.goalWeight) $('f-goalwt').value = U.goalWeight;
      validateGoalWeight(true); // silent re-check
    },

    5: function () {
      syncRateToGoal();
      renderRateDisplay();
      calculateMacros();
      renderPlanReview();
    },

    6: function () {
      var U = window.U;
      if ($('a-name')  && U.name)  $('a-name').value  = U.name;
      if ($('a-email') && U.email) $('a-email').value = U.email;
    },

    7: function () {
      renderTnc();
    },

    8: function () {
      setVal('verifyEmailShow', window.U.email || '—');
    }
  };

  function renderActivityCard(idx) {
    idx = Math.max(0, Math.min(5, idx));
    var a = ACT[idx];
    setVal('actCardIcon',  a.icon);
    setVal('actCardName',  a.name);
    setVal('actCardDesc',  a.desc);
    setVal('actCardEx',    a.ex);
    setVal('actCardCount', (idx + 1) + ' / ' + ACT.length);
    // dots
    $$('.ob-act-dot').forEach(function (d, i) {
      d.classList.toggle('is-active', i === idx);
    });
    window.U.actIdx = idx;
  }

  function syncRateToGoal() {
    // If rateIdx still points to a direction that contradicts goal, flip it
    var goal = window.U.goal || 'cut';
    var r    = RATES[state.rateIdx];
    if (!r) { state.rateIdx = 2; return; }
    if (goal === 'cut'  && r.v > 0)  state.rateIdx = 2; // −0.50
    if (goal === 'bulk' && r.v < 0)  state.rateIdx = 6; // +0.50
    if (goal === 'maintain')          state.rateIdx = 4; // 0
  }

  function renderRateDisplay() {
    var r    = RATES[state.rateIdx] || RATES[2];
    var goal = window.U.goal || 'cut';
    setVal('rateDisplayLabel', r.label);

    var isExtreme = r.level === 'extreme';
    showWarn('rateWarn', isExtreme
      ? '⚠️ Extreme rate — very large deficit or surplus. Consult a dietitian.'
      : '');

    // Show available direction based on goal
    var decBtn = $('rate-dec-btn');
    var incBtn = $('rate-inc-btn');
    if (decBtn) decBtn.disabled = (state.rateIdx === 0) || goal === 'bulk' || goal === 'maintain';
    if (incBtn) incBtn.disabled = (state.rateIdx === RATES.length - 1) || goal === 'cut' || goal === 'maintain';
  }

  function renderPlanReview() {
    calculateMacros();
    var U    = window.U;
    var r    = RATES[state.rateIdx] || RATES[2];
    var sign = r.v < 0 ? '−' : (r.v > 0 ? '+' : '±');
    var delta = Math.round(Math.abs(r.v) * 7700 / 7);
    var gLabel = GOALS[U.goal] ? GOALS[U.goal].label : 'Goal';

    setVal('goTitle',    gLabel);
    setVal('goSub',      r.label);
    setVal('goEnergy',   (U.calories || 0).toLocaleString() + ' kcal/day');
    setVal('goDelta',    sign + delta + ' kcal/day');
    setVal('goForecast', (U.timeline || '—') + (U.timeline ? ' weeks' : ''));
    setVal('goPro',      (U.protein || 0) + 'g / day');
    setVal('goCarb',     (U.carbs   || 0) + 'g / day');
    setVal('goFat',      (U.fats    || 0) + 'g / day');

    // BMI gauge
    var bmi  = U.bmi || 0;
    var info = bmiLabel(bmi);
    setVal('bmiVal',   bmi.toFixed(1));
    setVal('bmiLabel', info.text);

    var needle = $('bmiNeedle');
    if (needle) {
      // scale: 15=0%, 40=100%
      var pct = Math.min(100, Math.max(0, (bmi - 15) / 25 * 100));
      needle.style.left = pct + '%';
      needle.style.background = info.color;
    }
  }

  function renderTnc() {
    ['tos', 'disclaimer', 'marketing'].forEach(function (key) {
      var box = $('tnc-box-' + key);
      if (box) box.classList.toggle('is-checked', !!state.tnc[key]);
    });
    updateCtaState();
  }

  /* ─────────────────────────────────────────────────────────
     NAVIGATION STATE
     ───────────────────────────────────────────────────────── */
  function updateTopbar() {
    var prog = $('obProg');
    if (prog) prog.style.width = ((state.step + 1) / (STEPS + 1) * 100) + '%';

    var lbl = $('obStepLbl');
    if (lbl) lbl.textContent = 'Step ' + (state.step + 1) + ' of ' + (STEPS + 1);

    var back = $('obBackBtn');
    if (back) {
      back.style.opacity  = state.step === 0 ? '0.3' : '1';
      back.style.pointerEvents = state.step === 0 ? 'none' : '';
    }
  }

  function updateCtaLabel() {
    var labels = [
      'Get Started →',    // 0
      'Next →',           // 1
      'Next →',           // 2
      'Next →',           // 3
      'Next →',           // 4
      'Review My Plan →', // 5
      'Create Account →', // 6
      'Accept & Enter →', // 7
      'Enter AnthrosAI 🔥'// 8
    ];
    var btn = $('obCta');
    if (btn) btn.textContent = labels[state.step] || 'Next →';
  }

  function updateCtaState() {
    var btn = $('obCta');
    if (!btn) return;
    // On T&C step, require both required boxes
    if (state.step === 7) {
      btn.disabled = !(state.tnc.tos && state.tnc.disclaimer);
    } else {
      btn.disabled = false;
    }
  }

  function goTo(step) {
    // Slide the viewport
    var slides = $('obSlides');
    if (slides) slides.style.transform = 'translateX(-' + (step * 100) + '%)';
    state.step = step;
    updateTopbar();
    updateCtaLabel();
    updateCtaState();
    // Run the slide's hydration
    if (stepRenderers[step]) stepRenderers[step]();
    saveDraft();
  }

  /* ─────────────────────────────────────────────────────────
     VALIDATORS — return null on pass, string on fail
     ───────────────────────────────────────────────────────── */
  var validators = {

    0: function () { return null; }, // welcome — always pass

    1: function () {
      var n = ($('f-name') || {}).value.trim();
      if (!n) { fieldError('f-name'); return 'Please enter your name.'; }
      clearFieldError('f-name');
      window.U.name = n;
      return null;
    },

    2: function () {
      var dobEl = $('f-dob');
      var hEl   = $('f-height');
      var wEl   = $('f-weight');
      var dob   = dobEl ? dobEl.value   : '';
      var h     = hEl   ? parseFloat(hEl.value) : 0;
      var w     = wEl   ? parseFloat(wEl.value) : 0;

      var errors = [];
      if (!dob)          { fieldError('f-dob');    errors.push('date of birth'); }
      else               clearFieldError('f-dob');
      if (!h || h < 100 || h > 250) { fieldError('f-height'); errors.push('height (100–250 cm)'); }
      else               clearFieldError('f-height');
      if (!w || w < 30  || w > 300) { fieldError('f-weight'); errors.push('weight (30–300 kg)'); }
      else               clearFieldError('f-weight');

      if (errors.length) return 'Please fix: ' + errors.join(', ') + '.';

      window.U.dob    = dob;
      window.U.height = h;
      window.U.weight = w;
      var yr  = new Date().getFullYear();
      var byy = new Date(dob).getFullYear();
      window.U.age    = Math.max(13, yr - byy);

      // BMI safety check on current weight
      var hm  = h / 100;
      var bmi = Math.round((w / (hm * hm)) * 10) / 10;
      window.U.bmi = bmi;
      if (bmiIsBlocking(bmi)) {
        showErr('profileBmiError',
          '⚠️ Your current BMI (' + bmi + ') is outside the supported range (15–45). ' +
          'Please check your height and weight values.');
        return 'BMI out of supported range.';
      }
      showErr('profileBmiError', '');
      return null;
    },

    3: function () {
      // Activity is always valid — user just picks
      return null;
    },

    4: function () {
      var gw  = parseFloat(($('f-goalwt') || {}).value);
      if (!gw || gw < 30 || gw > 300) {
        fieldError('f-goalwt');
        return 'Please enter a valid goal weight (30–300 kg).';
      }
      clearFieldError('f-goalwt');
      window.U.goalWeight = gw;

      var warnMsg = validateGoalWeight(false);
      if (warnMsg) return warnMsg;  // hard-block on extreme BMI

      return null;
    },

    5: function () {
      calculateMacros();
      return null;
    },

    6: function () {
      var name   = ($('a-name')  || {}).value.trim();
      var email  = ($('a-email') || {}).value.trim();
      var pass   = ($('a-pass')  || {}).value;
      var pass2  = ($('a-pass2') || {}).value;
      var errEl  = $('accountError');

      if (!name || !email || !pass || !pass2) {
        showErr('accountError', 'Please fill in all fields.');
        return 'Fill all fields.';
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showErr('accountError', 'Please enter a valid email address.');
        return 'Invalid email.';
      }
      if (pass.length < 8) {
        showErr('accountError', 'Password must be at least 8 characters.');
        return 'Password too short.';
      }
      if (pass !== pass2) {
        showErr('accountError', 'Passwords do not match.');
        return 'Passwords differ.';
      }
      showErr('accountError', '');
      window.U.name  = name;
      window.U.email = email;
      if ($('verifyEmailShow')) $('verifyEmailShow').textContent = email;

      var SUPA_URL = 'https://fmuscweewkgpcvzjnteo.supabase.co';
      var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdXNjd2Vld2tncGN2empudGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4ODU2NzAsImV4cCI6MjA4ODQ2MTY3MH0.6UUs98UU4fCaQMcKIyLzBO8k-5gHfrOe3TuJyTS-XzE';

      var btn = $('obCta');
      if (btn) { btn.disabled = true; btn.textContent = 'Creating account…'; }

      fetch(SUPA_URL + '/auth/v1/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPA_KEY,
          'Authorization': 'Bearer ' + SUPA_KEY
        },
        body: JSON.stringify({
          email: email,
          password: pass,
          data: { full_name: name }
        })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error) {
          showErr('accountError', data.error.message || 'Signup failed.');
          if (btn) { btn.disabled = false; btn.textContent = 'Create Account →'; }
          return;
        }
        if (data.user) window.U._uid = data.user.id;
        goTo(8);
      })
      .catch(function() {
        showErr('accountError', 'Network error. Please try again.');
        if (btn) { btn.disabled = false; btn.textContent = 'Create Account →'; }
      });

      return 'pending';
    },
    },

    7: function () {
      if (!state.tnc.tos || !state.tnc.disclaimer) {
        showErr('tncError', 'Please accept the required terms to continue.');
        return 'Terms not accepted.';
      }
      showErr('tncError', '');
      return null;
    },

    8: function () { return null; } // email verify step — always allow continue
  };

  /* ─────────────────────────────────────────────────────────
     GOAL WEIGHT BMI VALIDATOR
     ───────────────────────────────────────────────────────── */
  function validateGoalWeight(silent) {
    var gw  = parseFloat(($('f-goalwt') || {}).value) || window.U.goalWeight;
    var h   = window.U.height || 175;
    if (!gw || !h) return null;

    var hm  = h / 100;
    var bmi = gw / (hm * hm);
    var msg = '';

    if (bmi < 15) {
      msg = '🚫 BMI ' + bmi.toFixed(1) + ' — this goal is dangerously underweight and cannot be set. Please choose a healthier target.';
    } else if (bmi < 18.5) {
      msg = '⚠️ BMI ' + bmi.toFixed(1) + ' — this goal is underweight (healthy range: 18.5–24.9). We strongly recommend a safer target.';
    } else if (bmi > 40) {
      msg = '🚫 BMI ' + bmi.toFixed(1) + ' — this goal is in the severely obese range and cannot be set here. Please consult a healthcare professional.';
    } else if (bmi > 30) {
      msg = '⚠️ BMI ' + bmi.toFixed(1) + ' — this goal is in the obese range (healthy: 18.5–24.9). Consider a closer intermediate target.';
    }

    if (!silent) {
      var isHardBlock = bmi < 15 || bmi > 40;
      if (isHardBlock) {
        showErr('goalWtError', msg);
        showWarn('goalWtWarn', '');
        return msg; // blocks Next
      } else {
        showErr('goalWtError', '');
        showWarn('goalWtWarn', msg);
        return null; // warns but doesn't block
      }
    }
    return null;
  }

  /* ─────────────────────────────────────────────────────────
     NEXT / BACK
     ───────────────────────────────────────────────────────── */
  function next() {
    // Show step-level error placeholder
    showErr('stepError', '');

    var err = validators[state.step] ? validators[state.step]() : null;
    if (err) {
      // showErr('stepError', err); — field-level errors already shown
      return;
    }

    if (state.step < STEPS) {
      goTo(state.step + 1);
    } else {
      // Final step — launch app
      finalize();
    }
  }

  function back() {
    if (state.step === 0) return;
    showErr('stepError', '');
    showErr('profileBmiError', '');
    goTo(state.step - 1);
  }

  /* ─────────────────────────────────────────────────────────
     FINALIZE
     ───────────────────────────────────────────────────────── */
  function finalize() {
    var now = new Date().toISOString();
    window.U._lastSave        = now;
    window.U._lastDailyReset  = new Date().toDateString();
    calculateMacros();

    if (typeof saveAppState === 'function') saveAppState();
    clearDraft();

    if (typeof showScreen === 'function') showScreen('app');
    if (typeof showPage   === 'function') showPage('dash', $('nav-dash'));
    if (typeof initApp    === 'function') setTimeout(initApp, 80);
  }

  /* ─────────────────────────────────────────────────────────
     EVENT DELEGATION
     All user interaction flows through this single listener.
     ───────────────────────────────────────────────────────── */
  function handleDelegated(e) {
    var target  = e.target;
    var closest = function (sel) { return target.closest ? target.closest(sel) : null; };

    // ── data-action buttons ───────────────────────────────
    var actionEl = closest('[data-action]');
    if (actionEl) {
      var action = actionEl.dataset.action;
      switch (action) {
        case 'ob-next':    next();  break;
        case 'ob-back':    back();  break;
        case 'act-prev':   renderActivityCard(Math.max(0, (window.U.actIdx || 2) - 1)); saveDraft(); break;
        case 'act-next':   renderActivityCard(Math.min(5, (window.U.actIdx || 2) + 1)); saveDraft(); break;
        case 'rate-dec':   adjustRate(-1); break;
        case 'rate-inc':   adjustRate(+1); break;
        case 'resend-email': resendEmail(); break;
        case 'continue-anyway': finalize(); break;
      }
      return;
    }

    // ── data-sel-group selection groups ──────────────────
    var selEl = closest('[data-sel-group]');
    if (selEl && selEl.dataset.selVal != null) {
      var group = selEl.dataset.selGroup;
      var val   = selEl.dataset.selVal;
      applySelGroup(group, val);

      switch (group) {
        case 'gender':
          window.U.gender = val;
          break;
        case 'goal':
          window.U.goal = val;
          syncRateToGoal();
          renderRateDisplay();
          break;
      }
      saveDraft();
      return;
    }

    // ── T&C checkboxes ────────────────────────────────────
    var tncEl = closest('[data-tnc-key]');
    if (tncEl) {
      var key = tncEl.dataset.tncKey;
      state.tnc[key] = !state.tnc[key];
      renderTnc();
      return;
    }
  }

  function adjustRate(dir) {
    var goal    = window.U.goal || 'cut';
    var newIdx  = state.rateIdx + dir;
    var min     = 0;
    var max     = RATES.length - 1;

    // Clamp to direction allowed by goal
    if (goal === 'cut')      max = 3;  // max −0.25
    if (goal === 'bulk')     min = 5;  // min +0.25
    if (goal === 'maintain') { min = 4; max = 4; }
    if (goal === 'perform')  min = 5;

    state.rateIdx = Math.min(max, Math.max(min, newIdx));
    renderRateDisplay();
    calculateMacros();
    renderPlanReview();
    saveDraft();
  }

  /* ─────────────────────────────────────────────────────────
     LIVE FIELD LISTENERS  (attached once, not delegated)
     ───────────────────────────────────────────────────────── */
  function attachFieldListeners() {
    function on(id, fn) {
      var el = $(id);
      if (el) el.addEventListener('input', fn);
    }

    on('f-name', function () {
      window.U.name = this.value.trim();
    });

    on('f-height', function () {
      window.U.height = parseFloat(this.value) || 0;
      showErr('profileBmiError', '');
    });

    on('f-weight', function () {
      window.U.weight = parseFloat(this.value) || 0;
      showErr('profileBmiError', '');
    });

    on('f-dob', function () {
      window.U.dob = this.value;
      if (this.value) {
        var yr = new Date().getFullYear();
        var by = new Date(this.value).getFullYear();
        window.U.age = Math.max(13, yr - by);
      }
    });

    on('f-goalwt', function () {
      var gw = parseFloat(this.value);
      if (gw) {
        window.U.goalWeight = gw;
        validateGoalWeight(false);
      }
    });

    on('a-name',  function () { window.U.name  = this.value.trim(); });
    on('a-email', function () { window.U.email = this.value.trim(); });
  }

  /* ─────────────────────────────────────────────────────────
     RESEND EMAIL  (stub — wire to your backend)
     ───────────────────────────────────────────────────────── */
  function resendEmail() {
    var btn = $('resend-email-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Sent ✓'; }
    setTimeout(function () {
      if (btn) { btn.disabled = false; btn.textContent = 'Resend Email'; }
    }, 30000);
    // TODO: POST /api/resend-verification { email: window.U.email }
  }

  /* ─────────────────────────────────────────────────────────
     BOOT
     ───────────────────────────────────────────────────────── */
  function init() {
    // Ensure window.U exists
    if (!window.U || !window.U.name) {
      window.U = buildEmptyU();
    }

    // Try to resume from draft
    var resumed = loadDraft();

    // Attach single delegated listener on the onboarding container
    var ob = $('onboarding');
    if (ob) {
      ob.addEventListener('click', handleDelegated);
      ob.addEventListener('change', handleDelegated); // for <select> if needed
    }

    attachFieldListeners();

    // Go to saved step (or 0 for fresh users)
    goTo(resumed ? state.step : 0);
  }

  /* ─────────────────────────────────────────────────────────
     PUBLIC API
     ───────────────────────────────────────────────────────── */
  return {
    init:            init,
    calculateMacros: calculateMacros,
    refreshPlanNums: function () { calculateMacros(); renderPlanReview(); },
    resendEmail:     resendEmail,
    finalize:        finalize,
    // Expose for legacy calls from app.js
    ACT:  ACT,
    RATES: RATES
  };

}()); // end AUTH IIFE

/* ═══════════════════════════════════════════════════════════
   MACRO ENGINE — also available globally for app.js
   ═══════════════════════════════════════════════════════════ */
window.calculateMacros  = AUTH.calculateMacros;
window.refreshPlanNums  = AUTH.refreshPlanNums;
window.resendEmail       = AUTH.resendEmail;

/* launchApp: called if boot detects returning user (no onboarding needed) */
function launchApp() {
  window.U = window.U || {};
  if (!window.U.name)       window.U.name       = 'Athlete';
  if (!window.U.height)     window.U.height     = 175;
  if (!window.U.weight)     window.U.weight     = 75;
  if (!window.U.goalWeight) window.U.goalWeight = 70;
  if (!window.U.age)        window.U.age        = 22;
  if (window.U.actIdx == null) window.U.actIdx  = 2;
  AUTH.calculateMacros();
  if (typeof saveAppState === 'function') saveAppState();
  if (typeof showScreen   === 'function') showScreen('app');
  if (typeof showPage     === 'function') showPage('dash', document.getElementById('nav-dash'));
  if (typeof initApp      === 'function') setTimeout(initApp, 80);
}
window.launchApp = launchApp;

/* initApp: called after showScreen('app') to hydrate the dashboard */
function initApp() {
  var U  = window.U;
  var _s = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };

  _s('avatarEl',  U.name && U.name[0] ? U.name[0].toUpperCase() : '?');
  var hour = new Date().getHours();
  var gr   = hour < 12 ? 'Good Morning' : hour < 17 ? "Let's Work" : 'Evening Grind';
  _s('greetH2',  gr + ', ' + (U.name || 'Athlete') + ' 👊');
  _s('greetSub', (U.calories || 2000).toLocaleString() + ' kcal · ' + (U.protein || 0) + 'g protein today.');

  ['proG','carbG','fatG'].forEach(function (id, i) {
    _s(id, [U.protein, U.carbs, U.fats][i]);
  });
  _s('stat4Cal', (U.calories || 0).toLocaleString());
  _s('nsGoal', U.calories || 0);
  _s('nsLeft', U.calories || 0);

  if (typeof renderWater      === 'function') renderWater();
  if (typeof renderExercises  === 'function') renderExercises();
  if (typeof renderMealBlocks === 'function') renderMealBlocks();
  if (typeof renderProgress   === 'function') renderProgress();

  // Secondary elements
  (function () {
    var e = function (id) { return document.getElementById(id); };
    if (e('msProteinTarget')) e('msProteinTarget').textContent = U.protein || 0;
    if (e('msCarbsTarget'))   e('msCarbsTarget').textContent   = U.carbs   || 0;
    if (e('msFatTarget'))     e('msFatTarget').textContent     = U.fats    || 0;
    if (e('moreAvatar'))      e('moreAvatar').textContent      = U.name ? U.name[0].toUpperCase() : '?';
    if (e('moreName'))        e('moreName').textContent        = U.name  || 'Athlete';
    if (e('moreEmail'))       e('moreEmail').textContent       = U.email || '';
    if (typeof updateDateNav === 'function') updateDateNav();
    setTimeout(function () {
      if (typeof renderFoodDB     === 'function') renderFoodDB();
      if (typeof renderMealBlocks === 'function') renderMealBlocks();
    }, 300);
    var badges = ['Energy','Protein','Carbs','Fat'];
    badges.forEach(function (b) {
      var pe = e('pct' + b);
      if (pe) { pe.textContent = '0%'; pe.className = 'mbadge-pct grey'; }
    });
  }());

  // AI welcome message — routes through /api/groq, no client key
  setTimeout(function () {
    var bmiInfo    = U.bmi < 18.5 ? 'underweight' : U.bmi < 25 ? 'healthy' : U.bmi < 30 ? 'overweight' : 'obese range';
    var goalDiff   = ((U.goalWeight || U.weight) - U.weight).toFixed(1);
    var goalVerb   = U.goal === 'cut'
      ? 'lose ' + Math.abs(goalDiff) + 'kg'
      : U.goal === 'bulk'
        ? 'gain ' + goalDiff + 'kg of muscle'
        : 'maintain and recomp';

    if (typeof addAiMsg === 'function') {
      addAiMsg(
        'Wassup ' + U.name + '! 🔥 Stats loaded — ' +
        U.weight + 'kg at ' + U.height + 'cm, BMI **' + U.bmi + '** (' + bmiInfo + ').\n\n' +
        'Your plan:\n' +
        '• **Calories: ' + (U.calories || 0).toLocaleString() + ' kcal/day** (TDEE: ' + (U.tdee || 0).toLocaleString() + ')\n' +
        '• **Protein: ' + (U.protein || 0) + 'g** · Carbs: **' + (U.carbs || 0) + 'g** · Fats: **' + (U.fats || 0) + 'g**\n' +
        '• Goal: ' + goalVerb + ' in ~**' + (U.timeline || '?') + '** weeks\n\n' +
        "Ask me anything — let's go. 💪"
      );
    }
    var chip = document.getElementById('aiCtxChip');
    if (chip) chip.textContent = U.weight + 'kg · ' + (U.calories || 0) + 'kcal';
  }, 500);
}
window.initApp = initApp;

/* Boot hook — called by app.js _anthrosBoot() */
document.addEventListener('DOMContentLoaded', function () {
  AUTH.init();
});

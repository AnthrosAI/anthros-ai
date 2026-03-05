/**
 * AnthrosAI — workout.js
 * Exercise tracking, workout log, sets/reps, muscle groups
 * ARCHITECTURE: Dedicated workout page (pg-workout) with search,
 * filter chips, set checkboxes, and quick-add library
 */

'use strict';

// ── EXERCISE DATABASE ───────────────────────────────────────
var exercises = [
  {n:'Bench Press',     sets:'4×8',  wt:'185 lbs', muscle:'Chest',       done:false},
  {n:'Incline DB Press',sets:'3×10', wt:'65 lbs',  muscle:'Upper Chest', done:false},
  {n:'Overhead Press',  sets:'4×6',  wt:'135 lbs', muscle:'Shoulders',   done:false},
  {n:'Lateral Raises',  sets:'3×15', wt:'20 lbs',  muscle:'Side Delts',  done:false},
  {n:'Tricep Dips',     sets:'3×12', wt:'BW+45',   muscle:'Triceps',     done:false},
  {n:'Cable Flyes',     sets:'3×15', wt:'40 lbs',  muscle:'Chest',       done:false},
];

// ── FULL EXERCISE LIBRARY ───────────────────────────────────
const EXERCISE_LIBRARY = [
  // CHEST
  {n:'Bench Press',muscle:'Chest',type:'Barbell',icon:'🏋️'},
  {n:'Incline Bench Press',muscle:'Chest',type:'Barbell',icon:'🏋️'},
  {n:'Decline Bench Press',muscle:'Chest',type:'Barbell',icon:'🏋️'},
  {n:'Dumbbell Flyes',muscle:'Chest',type:'Dumbbell',icon:'🏋️'},
  {n:'Cable Crossover',muscle:'Chest',type:'Cable',icon:'⚡'},
  {n:'Push-ups',muscle:'Chest',type:'Bodyweight',icon:'💪'},
  {n:'Incline DB Press',muscle:'Chest',type:'Dumbbell',icon:'🏋️'},
  // BACK
  {n:'Deadlift',muscle:'Back',type:'Barbell',icon:'⛏️'},
  {n:'Pull-ups',muscle:'Back',type:'Bodyweight',icon:'🔼'},
  {n:'Bent-Over Row',muscle:'Back',type:'Barbell',icon:'🏋️'},
  {n:'Lat Pulldown',muscle:'Back',type:'Cable',icon:'⚡'},
  {n:'Seated Cable Row',muscle:'Back',type:'Cable',icon:'⚡'},
  {n:'T-Bar Row',muscle:'Back',type:'Barbell',icon:'🏋️'},
  {n:'Single Arm DB Row',muscle:'Back',type:'Dumbbell',icon:'🏋️'},
  // SHOULDERS
  {n:'Overhead Press',muscle:'Shoulders',type:'Barbell',icon:'🙌'},
  {n:'Dumbbell Shoulder Press',muscle:'Shoulders',type:'Dumbbell',icon:'🙌'},
  {n:'Lateral Raises',muscle:'Shoulders',type:'Dumbbell',icon:'🙌'},
  {n:'Front Raises',muscle:'Shoulders',type:'Dumbbell',icon:'🙌'},
  {n:'Face Pulls',muscle:'Shoulders',type:'Cable',icon:'⚡'},
  {n:'Arnold Press',muscle:'Shoulders',type:'Dumbbell',icon:'🙌'},
  // LEGS
  {n:'Squat',muscle:'Legs',type:'Barbell',icon:'🦵'},
  {n:'Leg Press',muscle:'Legs',type:'Machine',icon:'🦵'},
  {n:'Romanian Deadlift',muscle:'Legs',type:'Barbell',icon:'🦵'},
  {n:'Leg Curl',muscle:'Legs',type:'Machine',icon:'🦵'},
  {n:'Leg Extension',muscle:'Legs',type:'Machine',icon:'🦵'},
  {n:'Lunges',muscle:'Legs',type:'Bodyweight',icon:'🦵'},
  {n:'Bulgarian Split Squat',muscle:'Legs',type:'Dumbbell',icon:'🦵'},
  {n:'Hip Thrust',muscle:'Legs',type:'Barbell',icon:'🦵'},
  {n:'Calf Raises',muscle:'Legs',type:'Bodyweight',icon:'🦵'},
  // ARMS
  {n:'Barbell Curl',muscle:'Arms',type:'Barbell',icon:'💪'},
  {n:'Dumbbell Curl',muscle:'Arms',type:'Dumbbell',icon:'💪'},
  {n:'Hammer Curl',muscle:'Arms',type:'Dumbbell',icon:'💪'},
  {n:'Tricep Pushdown',muscle:'Arms',type:'Cable',icon:'💪'},
  {n:'Skull Crushers',muscle:'Arms',type:'Barbell',icon:'💪'},
  {n:'Overhead Tricep Extension',muscle:'Arms',type:'Dumbbell',icon:'💪'},
  {n:'Preacher Curl',muscle:'Arms',type:'Barbell',icon:'💪'},
  {n:'Dips',muscle:'Arms',type:'Bodyweight',icon:'💪'},
  // CORE
  {n:'Plank',muscle:'Core',type:'Bodyweight',icon:'🧘'},
  {n:'Crunches',muscle:'Core',type:'Bodyweight',icon:'🧘'},
  {n:'Russian Twists',muscle:'Core',type:'Bodyweight',icon:'🧘'},
  {n:'Leg Raises',muscle:'Core',type:'Bodyweight',icon:'🧘'},
  {n:'Ab Wheel Rollout',muscle:'Core',type:'Equipment',icon:'🧘'},
  {n:'Cable Woodchop',muscle:'Core',type:'Cable',icon:'⚡'},
  // CARDIO
  {n:'Running',muscle:'Cardio',type:'Cardio',icon:'🏃'},
  {n:'Cycling',muscle:'Cardio',type:'Cardio',icon:'🚴'},
  {n:'Jump Rope',muscle:'Cardio',type:'Cardio',icon:'🪢'},
  {n:'Rowing',muscle:'Cardio',type:'Cardio',icon:'🚣'},
  {n:'HIIT',muscle:'Cardio',type:'Cardio',icon:'🔥'},
  {n:'Swimming',muscle:'Cardio',type:'Cardio',icon:'🏊'},
];

let _wkFilter = '';
let _wkSearch = '';

// ── WORKOUT PAGE ────────────────────────────────────────────
function initNutritionPage() {
  // placeholder — nutrition.js handles this
}

function renderWorkoutPage() {
  _renderExerciseList();
  updateWorkoutStats();
  renderExerciseLibrary();
}

function _renderExerciseList() {
  const list = document.getElementById('wkExerciseList');
  if (!list) return;
  let filtered = exercises;
  if (_wkFilter) filtered = filtered.filter(e => e.muscle && e.muscle.toLowerCase().includes(_wkFilter.toLowerCase()));
  if (!filtered.length) {
    list.innerHTML = `<div style="text-align:center;color:var(--muted2);padding:40px 20px">
      <div style="font-size:2.5rem;margin-bottom:12px">🏋️</div>
      <div style="font-weight:700;margin-bottom:6px">No exercises logged</div>
      <div style="font-size:.82rem">Search below or tap + Add Exercise</div>
    </div>`;
    return;
  }
  list.innerHTML = filtered.map((ex, ei) => {
    const realIdx = exercises.indexOf(ex);
    const sets = Array.isArray(ex.sets) ? ex.sets : [{label:ex.sets||'3×10',done:false}];
    const doneSets = sets.filter(s=>s.done).length;
    const allDone = doneSets === sets.length;
    return `<div class="wk-exercise-card${allDone?' done':''}">
      <div class="wk-ex-header">
        <div>
          <div class="wk-ex-name">${ex.n}</div>
          ${ex.muscle ? `<div style="font-size:.65rem;color:var(--muted2);margin-top:2px">${ex.muscle}${ex.wt&&ex.wt!=='—'?' · '+ex.wt+' kg':''}</div>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="font-size:.72rem;color:${allDone?'var(--cal)':'var(--muted2)'};font-weight:700">${doneSets}/${sets.length}</div>
          <button onclick="removeExercise(${realIdx})" style="background:none;border:none;color:var(--muted2);cursor:pointer;font-size:1rem;padding:2px 6px">×</button>
        </div>
      </div>
      ${sets.map((s,si) => `
        <div class="wk-set-row">
          <div class="wk-set-check${s.done?' done':''}" onclick="toggleSet(${realIdx},${si})">
            ${s.done ? '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/></svg>' : ''}
          </div>
          <div class="wk-set-label">Set ${si+1} · ${s.label}${ex.wt&&ex.wt!=='—'?' · '+ex.wt+' kg':''}</div>
        </div>`).join('')}
    </div>`;
  }).join('');
}

function updateWorkoutStats() {
  const total = exercises.length;
  let totalSets = 0, doneSets = 0;
  exercises.forEach(ex => {
    const sets = Array.isArray(ex.sets) ? ex.sets : [{done:false}];
    totalSets += sets.length;
    doneSets += sets.filter(s=>s.done).length;
  });
  const pct = totalSets > 0 ? Math.round(doneSets/totalSets*100) : 0;
  const te = document.getElementById('wkTotalExercises');
  const ts = document.getElementById('wkTotalSets');
  const cp = document.getElementById('wkCompletePct');
  const pb = document.getElementById('wkProgressBar');
  if (te) te.textContent = total;
  if (ts) ts.textContent = doneSets;
  if (cp) cp.textContent = pct + '%';
  if (pb) pb.style.width = pct + '%';
}

function filterWorkout(btn, muscle) {
  _wkFilter = muscle;
  document.querySelectorAll('.wk-filter-btn').forEach(b => {
    b.style.background = b === btn ? 'var(--cal)' : 'var(--card)';
    b.style.color = b === btn ? 'black' : 'var(--muted2)';
    b.style.border = b === btn ? 'none' : '1px solid var(--border)';
  });
  _renderExerciseList();
}

// ── EXERCISE LIBRARY WITH SEARCH ───────────────────────────
function renderExerciseLibrary(query) {
  const el = document.getElementById('exerciseLibraryList');
  if (!el) return;
  const q = (query || _wkSearch || '').toLowerCase().trim();
  let items = EXERCISE_LIBRARY;
  if (_wkFilter) items = items.filter(e => e.muscle.toLowerCase().includes(_wkFilter.toLowerCase()));
  if (q) items = items.filter(e => e.n.toLowerCase().includes(q) || e.muscle.toLowerCase().includes(q));
  if (!items.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--muted2);padding:20px;font-size:.82rem">No exercises found</div>';
    return;
  }
  // Group by muscle
  const groups = {};
  items.forEach(e => { if (!groups[e.muscle]) groups[e.muscle] = []; groups[e.muscle].push(e); });
  el.innerHTML = Object.entries(groups).map(([muscle, exs]) => `
    <div style="margin-bottom:10px">
      <div style="font-size:.65rem;font-weight:800;color:var(--muted2);letter-spacing:.8px;padding:6px 0;text-transform:uppercase">${muscle}</div>
      ${exs.map(e => `
        <div class="lib-ex-row" onclick="quickAddFromLibrary('${e.n.replace(/'/g,"\'")}','${e.muscle}')">
          <span style="font-size:.95rem">${e.icon}</span>
          <div style="flex:1">
            <div style="font-size:.82rem;font-weight:600">${e.n}</div>
            <div style="font-size:.65rem;color:var(--muted2)">${e.type}</div>
          </div>
          <div style="color:var(--cal);font-size:1.2rem;font-weight:300">+</div>
        </div>`).join('')}
    </div>`).join('');
}

function searchExercises(val) {
  _wkSearch = val || '';
  renderExerciseLibrary(_wkSearch);
}

function quickAddFromLibrary(name, muscle) {
  const sets = Array.from({length:3}, () => ({label:'3×10', done:false}));
  exercises.push({n:name, sets, wt:'', muscle, done:false});
  saveAppState();
  renderWorkoutPage();
  showToast(name + ' added! 💪', 'ok');
}

// ── SET / EXERCISE MANAGEMENT ──────────────────────────────
function renderExercises() {
  var el = document.getElementById('exList');
  if (!el) return;
  if (!exercises || !exercises.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--muted2);padding:20px;font-size:.82rem">No exercises yet — tap + to add your workout</div>';
    return;
  }
  el.innerHTML = exercises.map(function(ex, ei) {
    var sets = Array.isArray(ex.sets) ? ex.sets : [{label: ex.sets||'3x10', done: ex.done||false}];
    return '<div class="wk-exercise-card">' +
      '<div class="wk-ex-header">' +
        '<div class="wk-ex-name">' + ex.n + '</div>' +
        (ex.muscle ? '<div class="wk-ex-muscle">' + ex.muscle + '</div>' : '') +
        '<button onclick="removeExercise(' + ei + ')" style="background:none;border:none;color:var(--muted2);cursor:pointer;font-size:1rem;padding:2px 6px">×</button>' +
      '</div>' +
      sets.map(function(s, si) {
        return '<div class="wk-set-row">' +
          '<div class="wk-set-check' + (s.done?' done':'') + '" onclick="toggleSet(' + ei + ',' + si + ')">' + (s.done ? '✓' : '') + '</div>' +
          '<div class="wk-set-label">' + s.label + (ex.wt ? ' · ' + ex.wt : '') + '</div>' +
        '</div>';
      }).join('') +
    '</div>';
  }).join('') +
  '<button class="wk-add-ex-btn" onclick="openExerciseLog()">+ Add Exercise</button>';
}

function toggleEx(i) {
  exercises[i].done = !exercises[i].done;
  renderExercises();
}

function saveExercise() {
  var name = document.getElementById('exName');
  var setsReps = document.getElementById('exSetsReps');
  var weight = document.getElementById('exWeightKg');
  var muscle = document.getElementById('exMuscle') || {};
  var nv = name ? name.value.trim() : '';
  var sv = setsReps ? setsReps.value.trim() : '3x10';
  var wv = weight ? weight.value.trim() : '';
  var mv = muscle.value ? muscle.value.trim() : '';
  if (!nv) { showToast('Enter exercise name', 'err'); return; }
  // Parse sets x reps into individual set objects
  var parts = sv.split('x').length > 1 ? parseInt(sv.split('x')[0]) : 3;
  if (isNaN(parts) || parts < 1) parts = 3;
  var setArr = [];
  for (var i = 0; i < parts; i++) setArr.push({label: sv, done: false});
  exercises.push({n: nv, sets: setArr, wt: wv, muscle: mv, done: false});
  saveAppState();
  renderExercises();
  renderWorkoutPage();
  closeExerciseModal();
  showToast(nv + ' added to workout', 'ok');
}

function openExerciseLog() {
  var m = document.getElementById('exerciseModal');
  if (m) { m.classList.add('open'); return; }
  showToast('Exercise log coming soon', 'ok');
}

function closeExerciseModal() {
  var m = document.getElementById('exerciseModal');
  if (m) m.classList.remove('open');
}

function removeExercise(idx) {
  exercises.splice(idx, 1);
  saveAppState();
  renderExercises();
}

function toggleSet(exIdx, setIdx) {
  if (!exercises[exIdx] || !exercises[exIdx].sets[setIdx]) return;
  exercises[exIdx].sets[setIdx].done = !exercises[exIdx].sets[setIdx].done;
  // Check if all sets done → mark exercise done
  exercises[exIdx].done = exercises[exIdx].sets.every(function(s){ return s.done; });
  saveAppState();
  renderExercises();
}

function renderWorkoutPage() {
  var list = document.getElementById('wkExerciseList');
  if (!list) return;
  var filtered = _wkFilter ? exercises.filter(function(e){ return e.muscle && e.muscle.toLowerCase().includes(_wkFilter.toLowerCase()); }) : exercises;
  if (!filtered.length) {
    list.innerHTML = '<div style="text-align:center;color:var(--muted2);padding:40px 20px;font-size:.85rem"><div style="font-size:2.5rem;margin-bottom:12px">🏋️</div><div style="font-weight:700;margin-bottom:6px">No exercises yet</div><div>Tap \"Add Exercise\" to log your workout</div></div>';
  } else {
    list.innerHTML = filtered.map(function(ex, ei) {
      var sets = Array.isArray(ex.sets) ? ex.sets : [{label: ex.sets||'3×10', done: false}];
      var doneSets = sets.filter(function(s){return s.done;}).length;
      var allDone = doneSets === sets.length;
      var realIdx = exercises.indexOf(ex);
      return '<div class="wk-exercise-card" style="' + (allDone ? 'opacity:0.65;' : '') + '">' +
        '<div class="wk-ex-header">' +
          '<div>' +
            '<div class="wk-ex-name" style="' + (allDone ? 'text-decoration:line-through;' : '') + '">' + ex.n + '</div>' +
            (ex.muscle ? '<div style="font-size:.65rem;color:var(--muted2);margin-top:2px">' + ex.muscle + (ex.wt && ex.wt !== '—' ? ' · ' + ex.wt + ' kg' : '') + '</div>' : '') +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<div style="font-size:.72rem;color:' + (allDone?'var(--cal)':'var(--muted2)') + ';font-weight:700">' + doneSets + '/' + sets.length + '</div>' +
            '<button onclick="removeExercise(' + realIdx + ')" style="background:none;border:none;color:var(--muted2);cursor:pointer;font-size:1rem;padding:2px 6px">×</button>' +
          '</div>' +
        '</div>' +
        sets.map(function(s, si) {
          return '<div class="wk-set-row">' +
            '<div class="wk-set-check' + (s.done?' done':'') + '" onclick="toggleSet(' + realIdx + ',' + si + ');renderWorkoutPage();updateWorkoutStats()">' + (s.done ? '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/></svg>' : '') + '</div>' +
            '<div class="wk-set-label">Set ' + (si+1) + ' · ' + s.label + (ex.wt && ex.wt !== '—' ? ' · ' + ex.wt + ' kg' : '') + '</div>' +
          '</div>';
        }).join('') +
      '</div>';
    }).join('');
  }
  updateWorkoutStats();
}

function updateWorkoutStats() {
  var total = exercises.length;
  var totalSets = 0, doneSets = 0;
  exercises.forEach(function(ex) {
    var sets = Array.isArray(ex.sets) ? ex.sets : [{done:false}];
    totalSets += sets.length;
    doneSets += sets.filter(function(s){return s.done;}).length;
  });
  var pct = totalSets > 0 ? Math.round(doneSets/totalSets*100) : 0;
  var te = document.getElementById('wkTotalExercises');
  var ts = document.getElementById('wkTotalSets');
  var cp = document.getElementById('wkCompletePct');
  var pb = document.getElementById('wkProgressBar');
  if (te) te.textContent = total;
  if (ts) ts.textContent = doneSets;
  if (cp) cp.textContent = pct + '%';
  if (pb) pb.style.width = pct + '%';
}

function filterWorkout(btn, muscle) {
  _wkFilter = muscle;
  document.querySelectorAll('.wk-filter-btn').forEach(function(b) {
    b.style.background = 'var(--card)';
    b.style.color = 'var(--muted2)';
    b.style.border = '1px solid var(--border)';
  });
  btn.style.background = 'var(--cal)';
  btn.style.color = 'black';
  btn.style.border = 'none';
  renderWorkoutPage();
}

function quickAddExercise(name, muscle, setsStr, weight) {
  var parts = setsStr.match(/^(\d+)x(\d+)$/) || setsStr.match(/^(\d+) min$/);
  var numSets = parts ? parseInt(parts[1]) : 3;
  var setArr = [];
  for (var i=0;i<numSets;i++) setArr.push({label:setsStr,done:false});
  exercises.push({n:name, sets:setArr, wt:weight||'', muscle:muscle, done:false});
  saveAppState();
  renderWorkoutPage();
  showToast(name + ' added to workout!', 'ok');
}


function quickAddExercise(name, muscle, setsStr, weight) {
  const numSets = parseInt(setsStr?.split('x')[0]) || 3;
  const setArr = Array.from({length:numSets}, () => ({label:setsStr||'3×10', done:false}));
  exercises.push({n:name, sets:setArr, wt:weight||'', muscle, done:false});
  saveAppState();
  renderWorkoutPage();
  showToast(name + ' added to workout!', 'ok');
}

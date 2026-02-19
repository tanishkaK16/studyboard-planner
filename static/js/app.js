/* StudyBoard — App Logic */

let state = {
  todos: [], goals: { daily: [], weekly: [], monthly: [] }, timetable: {}, notes: [],
  waterCount: 0, workouts: [], pomodoroTime: 1500, pomodoroRunning: false,
  pomodoroBreak: false, pomodoroSessions: 0, pomodoroInterval: null,
  journalEntries: [], currentMood: '', gratitudeItems: [],
  planner: { 1: {sem1:[],sem2:[]}, 2: {sem1:[],sem2:[]}, 3: {sem1:[],sem2:[]}, 4: {sem1:[],sem2:[]} },
  skills: [], photos: [], photoDump: [], currentFilter: 'all'
};

document.addEventListener('DOMContentLoaded', () => {
  loadState(); initDashboard(); renderTodos(); renderGoals('daily'); renderGoals('weekly');
  renderGoals('monthly'); initTimetable(); renderNotes(); initWater(); renderWorkouts();
  initPomodoro(); renderJournalEntries(); renderPlanner(1); renderSkills(); renderPhotoDump();
  updateDashboardStats(); fetchQuote();
});

function loadState() {
  const saved = localStorage.getItem('studyboard_state');
  if (saved) { try { state = { ...state, ...JSON.parse(saved) }; } catch(e) {} }
  const today = new Date().toDateString();
  if (localStorage.getItem('studyboard_lastDate') !== today) {
    state.waterCount = 0; state.pomodoroSessions = 0;
    localStorage.setItem('studyboard_lastDate', today);
  }
}
function saveState() {
  const s = { ...state }; delete s.pomodoroInterval; delete s.pomodoroRunning;
  localStorage.setItem('studyboard_state', JSON.stringify(s));
}
function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

function switchSection(section) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('section-' + section).classList.add('active');
  const ni = document.querySelector('.nav-item[data-section="' + section + '"]');
  if (ni) ni.classList.add('active');
  document.getElementById('sidebar').classList.remove('open');
}
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

function initDashboard() {
  const h = new Date().getHours();
  let g = 'Morning'; if (h >= 12 && h < 17) g = 'Afternoon'; else if (h >= 17) g = 'Evening';
  document.getElementById('greetingTime').textContent = g;
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', opts);
  const jd = document.getElementById('journalDate');
  if (jd) jd.textContent = new Date().toLocaleDateString('en-US', opts);
  renderDashboardGoals();
}

function fetchQuote() {
  fetch('/api/quote').then(r => r.json()).then(d => {
    document.getElementById('quoteText').textContent = d.text;
    document.getElementById('quoteAuthor').textContent = '— ' + d.author;
  }).catch(() => {
    document.getElementById('quoteText').textContent = 'The expert in anything was once a beginner.';
    document.getElementById('quoteAuthor').textContent = '— Helen Hayes';
  });
}

function updateDashboardStats() {
  document.getElementById('statTodos').textContent = state.todos.filter(t => t.completed).length;
  document.getElementById('statWater').textContent = state.waterCount + '/8';
  document.getElementById('statPomodoro').textContent = state.pomodoroSessions;
  document.getElementById('statWorkout').textContent = state.workouts.length;
  document.getElementById('todoBadge').textContent = state.todos.filter(t => !t.completed).length;
}

function renderDashboardGoals() {
  const el = document.getElementById('dashboardGoals');
  const goals = state.goals.daily;
  if (!goals.length) { el.innerHTML = '<div class="empty-state"><div class="empty-icon">🎯</div><p>No goals set for today. Click Goals to add some!</p></div>'; return; }
  el.innerHTML = goals.slice(0, 5).map(g => {
    const p = g.completed ? 100 : 0, o = 125.6 - (125.6 * p / 100);
    return '<div class="goal-progress"><div class="progress-ring"><svg><circle class="bg" cx="24" cy="24" r="20"/><circle class="fg" cx="24" cy="24" r="20" stroke-dasharray="125.6" stroke-dashoffset="'+o+'"/></svg><span class="percentage">'+p+'%</span></div><div class="goal-info"><h4>'+escapeHtml(g.text)+'</h4><p>'+(g.completed?'Completed ✓':'In progress')+'</p></div></div>';
  }).join('');
}

function addTodo() {
  const input = document.getElementById('todoInput'), text = input.value.trim();
  if (!text) return;
  state.todos.push({ id: Date.now(), text, category: document.getElementById('todoCategory').value, priority: document.getElementById('todoPriority').value, completed: false, createdAt: new Date().toISOString() });
  input.value = ''; saveState(); renderTodos(); updateDashboardStats();
}
function toggleTodo(id) { const t = state.todos.find(t => t.id === id); if (t) t.completed = !t.completed; saveState(); renderTodos(); updateDashboardStats(); }
function deleteTodo(id) { state.todos = state.todos.filter(t => t.id !== id); saveState(); renderTodos(); updateDashboardStats(); }
function filterTodos(filter, btn) {
  state.currentFilter = filter;
  document.querySelectorAll('.todo-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active'); renderTodos();
}
function renderTodos() {
  const el = document.getElementById('todoList');
  let todos = [...state.todos]; const f = state.currentFilter;
  if (f === 'active') todos = todos.filter(t => !t.completed);
  else if (f === 'completed') todos = todos.filter(t => t.completed);
  else if (['study','work','personal','urgent'].includes(f)) todos = todos.filter(t => t.category === f);
  if (!todos.length) { el.innerHTML = '<div class="empty-state"><div class="empty-icon">✨</div><p>No tasks here. Add one above!</p></div>'; return; }
  el.innerHTML = todos.map(t =>
    '<div class="todo-item '+(t.completed?'completed':'')+'"><div class="todo-checkbox '+(t.completed?'checked':'')+'" onclick="toggleTodo('+t.id+')">'+(t.completed?'✓':'')+'</div><span class="todo-text">'+escapeHtml(t.text)+'</span><span class="todo-category '+t.category+'">'+t.category+'</span><span class="todo-priority '+t.priority+'">'+t.priority+'</span><span class="todo-delete" onclick="deleteTodo('+t.id+')">✕</span></div>'
  ).join('');
}

function switchGoalTab(tab, btn) {
  document.querySelectorAll('.goals-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active'); document.getElementById('goals-' + tab).classList.add('active');
}
function addGoal(type) {
  const input = document.getElementById(type + 'GoalInput'), text = input.value.trim();
  if (!text) return;
  state.goals[type].push({ id: Date.now(), text, completed: false });
  input.value = ''; saveState(); renderGoals(type); renderDashboardGoals(); updateDashboardStats();
}
function toggleGoal(type, id) { const g = state.goals[type].find(g => g.id === id); if (g) g.completed = !g.completed; saveState(); renderGoals(type); renderDashboardGoals(); }
function deleteGoal(type, id) { state.goals[type] = state.goals[type].filter(g => g.id !== id); saveState(); renderGoals(type); renderDashboardGoals(); }
function renderGoals(type) {
  const el = document.getElementById(type + 'GoalsList'), goals = state.goals[type];
  if (!goals.length) { el.innerHTML = '<div class="empty-state"><div class="empty-icon">🎯</div><p>No '+type+' goals yet!</p></div>'; return; }
  el.innerHTML = goals.map(g => {
    const p = g.completed ? 100 : 0, o = 125.6 - (125.6 * p / 100);
    return '<div class="goal-progress" style="cursor:pointer" onclick="toggleGoal(\''+type+'\','+g.id+')"><div class="progress-ring"><svg><circle class="bg" cx="24" cy="24" r="20"/><circle class="fg" cx="24" cy="24" r="20" stroke-dasharray="125.6" stroke-dashoffset="'+o+'"/></svg><span class="percentage">'+p+'%</span></div><div class="goal-info"><h4 style="'+(g.completed?'text-decoration:line-through;opacity:0.5':'')+'">'+escapeHtml(g.text)+'</h4><p>'+(g.completed?'Completed ✓':'Click to complete')+'</p></div><span class="todo-delete" onclick="event.stopPropagation();deleteGoal(\''+type+'\','+g.id+')" style="opacity:1;cursor:pointer;color:var(--danger)">✕</span></div>';
  }).join('');
}

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const TIMES = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM'];
const COLORS = ['linear-gradient(135deg,#C4956A,#D4AD8A)','linear-gradient(135deg,#7B9E6B,#9AB88E)','linear-gradient(135deg,#6A8FC4,#8BA0D8)','linear-gradient(135deg,#C4706A,#D4908A)','linear-gradient(135deg,#D4A547,#E4C577)','linear-gradient(135deg,#8B6F4E,#A68B6B)','linear-gradient(135deg,#9B7FB0,#B99FC8)'];

function hashCode(s) { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i); return h; }
function initTimetable() {
  const grid = document.getElementById('timetableGrid');
  let html = '<div class="timetable-header">Time</div>';
  DAYS.forEach(d => html += '<div class="timetable-header">'+d+'</div>');
  TIMES.forEach(time => {
    html += '<div class="timetable-time">'+time+'</div>';
    DAYS.forEach(day => {
      const key = day + '_' + time, cls = state.timetable[key];
      html += '<div class="timetable-cell" onclick="editTimetableCell(\''+key+'\')">';
      if (cls) { const ci = Math.abs(hashCode(cls)) % COLORS.length; html += '<div class="class-block" style="background:'+COLORS[ci]+'">'+escapeHtml(cls)+'</div>'; }
      html += '</div>';
    });
  });
  grid.innerHTML = html;
}
function editTimetableCell(key) {
  const current = state.timetable[key] || '';
  const val = prompt('Enter class/subject name (leave empty to clear):', current);
  if (val === null) return;
  if (val.trim()) state.timetable[key] = val.trim(); else delete state.timetable[key];
  saveState(); initTimetable();
}
function openTimetableModal() {
  const subject = prompt('Enter subject name:');
  if (!subject || !subject.trim()) return;
  const day = prompt('Enter day (Mon/Tue/Wed/Thu/Fri/Sat/Sun):');
  if (!day || !DAYS.includes(day)) { alert('Invalid day!'); return; }
  const time = prompt('Enter time slot (e.g., 9:00 AM):');
  if (!time) return;
  state.timetable[day + '_' + time] = subject.trim();
  saveState(); initTimetable();
}

function openNoteModal() {
  const title = prompt('Note title:');
  if (!title || !title.trim()) return;
  const content = prompt('Note content:');
  if (content === null) return;
  const category = prompt('Category (study/work/personal/ideas):', 'study');
  state.notes.push({ id: Date.now(), title: title.trim(), content: content.trim(), category: category || 'study', createdAt: new Date().toISOString() });
  saveState(); renderNotes();
}
function deleteNote(id) { state.notes = state.notes.filter(n => n.id !== id); saveState(); renderNotes(); }
function searchNotes() { renderNotes(); }
function renderNotes() {
  const el = document.getElementById('notesGrid');
  const search = (document.getElementById('noteSearch') ? document.getElementById('noteSearch').value : '').toLowerCase();
  let notes = state.notes;
  if (search) notes = notes.filter(n => n.title.toLowerCase().includes(search) || n.content.toLowerCase().includes(search));
  if (!notes.length) { el.innerHTML = '<div class="empty-state" style="column-span:all"><div class="empty-icon">📝</div><p>No notes yet. Create your first note!</p></div>'; return; }
  el.innerHTML = notes.map(n => {
    const date = new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return '<div class="note-card" onclick="editNote('+n.id+')"><h4>'+escapeHtml(n.title)+'</h4><p>'+escapeHtml(n.content).substring(0,150)+(n.content.length>150?'...':'')+'</p><div class="note-meta"><span class="note-date">'+date+'</span><span class="note-category-tag">'+escapeHtml(n.category)+'</span></div></div>';
  }).join('');
}
function editNote(id) {
  const n = state.notes.find(n => n.id === id); if (!n) return;
  const title = prompt('Edit title:', n.title); if (title === null) return;
  const content = prompt('Edit content:', n.content); if (content === null) return;
  n.title = title.trim() || n.title; n.content = content.trim();
  saveState(); renderNotes();
}

function initWater() {
  const el = document.getElementById('waterGlasses'); let html = '';
  for (let i = 0; i < 8; i++) html += '<div class="water-glass '+(i < state.waterCount ? 'filled' : '')+'" onclick="toggleWater('+i+')"><span class="glass-icon">💧</span></div>';
  el.innerHTML = html;
  document.getElementById('waterCount').textContent = state.waterCount;
}
function toggleWater(i) { state.waterCount = (i < state.waterCount) ? i : i + 1; saveState(); initWater(); updateDashboardStats(); }
function resetWater() { state.waterCount = 0; saveState(); initWater(); updateDashboardStats(); }

function addWorkout() {
  const type = document.getElementById('workoutType').value;
  const duration = document.getElementById('workoutDuration').value;
  const notes = document.getElementById('workoutNotes').value;
  if (!duration) { alert('Please enter duration'); return; }
  state.workouts.push({ id: Date.now(), type, duration: parseInt(duration), notes: notes.trim(), date: new Date().toISOString() });
  document.getElementById('workoutDuration').value = ''; document.getElementById('workoutNotes').value = '';
  saveState(); renderWorkouts(); updateDashboardStats();
}
function deleteWorkout(id) { state.workouts = state.workouts.filter(w => w.id !== id); saveState(); renderWorkouts(); updateDashboardStats(); }
function renderWorkouts() {
  const el = document.getElementById('workoutLog');
  if (!state.workouts.length) { el.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">💪</div><p>No workouts logged yet!</p></div></div>'; return; }
  el.innerHTML = state.workouts.slice().reverse().map(w => {
    const icon = w.type.split(' ')[0];
    return '<div class="workout-entry"><div class="workout-icon">'+icon+'</div><div class="workout-details"><h4>'+escapeHtml(w.type)+'</h4><p>'+(w.notes?escapeHtml(w.notes):new Date(w.date).toLocaleDateString())+'</p></div><div class="workout-stats"><div class="workout-stat"><div class="value">'+w.duration+'</div><div class="label">Minutes</div></div></div><span class="todo-delete" onclick="deleteWorkout('+w.id+')" style="opacity:1;cursor:pointer;color:var(--danger)">✕</span></div>';
  }).join('');
}

function initPomodoro() { updatePomodoroDisplay(); renderPomodoroSessions(); renderSessionLog(); }
function updatePomodoroDisplay() {
  const m = Math.floor(state.pomodoroTime / 60), s = state.pomodoroTime % 60;
  document.getElementById('pomodoroTimer').textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  document.getElementById('pomodoroLabel').textContent = state.pomodoroBreak ? 'Break Time ☕' : 'Focus Time 🎯';
}
function togglePomodoro() {
  if (state.pomodoroRunning) {
    clearInterval(state.pomodoroInterval); state.pomodoroRunning = false;
    document.getElementById('pomodoroStart').textContent = '▶ Start';
  } else {
    state.pomodoroRunning = true; document.getElementById('pomodoroStart').textContent = '⏸ Pause';
    state.pomodoroInterval = setInterval(() => {
      state.pomodoroTime--;
      if (state.pomodoroTime <= 0) {
        clearInterval(state.pomodoroInterval); state.pomodoroRunning = false;
        document.getElementById('pomodoroStart').textContent = '▶ Start';
        if (!state.pomodoroBreak) {
          state.pomodoroSessions++; state.pomodoroTime = 300; state.pomodoroBreak = true;
          saveState(); renderSessionLog(); updateDashboardStats();
          alert('🎉 Focus session complete! Take a 5 minute break.');
        } else { state.pomodoroTime = 1500; state.pomodoroBreak = false; alert('☕ Break over! Ready for another focus session?'); }
      }
      updatePomodoroDisplay(); renderPomodoroSessions();
    }, 1000);
  }
}
function resetPomodoro() {
  clearInterval(state.pomodoroInterval); state.pomodoroRunning = false; state.pomodoroBreak = false;
  state.pomodoroTime = 1500; document.getElementById('pomodoroStart').textContent = '▶ Start'; updatePomodoroDisplay();
}
function skipPomodoro() {
  clearInterval(state.pomodoroInterval); state.pomodoroRunning = false;
  if (!state.pomodoroBreak) { state.pomodoroBreak = true; state.pomodoroTime = 300; }
  else { state.pomodoroBreak = false; state.pomodoroTime = 1500; }
  document.getElementById('pomodoroStart').textContent = '▶ Start'; updatePomodoroDisplay();
}
function renderPomodoroSessions() {
  const el = document.getElementById('pomodoroSessions'); let html = '';
  for (let i = 0; i < 8; i++) html += '<div class="session-dot '+(i < state.pomodoroSessions ? 'completed' : '')+'"></div>';
  el.innerHTML = html;
}
function renderSessionLog() {
  const el = document.getElementById('sessionLog');
  if (!state.pomodoroSessions) { el.innerHTML = '<div class="empty-state"><div class="empty-icon">⏱️</div><p>No sessions completed today. Start focusing!</p></div>'; return; }
  let html = '';
  for (let i = 0; i < state.pomodoroSessions; i++) html += '<div class="workout-entry"><div class="workout-icon">🍅</div><div class="workout-details"><h4>Focus Session #'+(i+1)+'</h4><p>25 minutes of focused work</p></div></div>';
  el.innerHTML = html;
}

function selectMood(mood, btn) { state.currentMood = mood; document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); }
function addGratitude() {
  const input = document.getElementById('gratitudeInput'), text = input.value.trim();
  if (!text) return; state.gratitudeItems.push(text); input.value = ''; renderGratitudeList();
}
function renderGratitudeList() {
  const el = document.getElementById('gratitudeList');
  el.innerHTML = state.gratitudeItems.map((item, i) => '<li>'+escapeHtml(item)+' <span onclick="removeGratitude('+i+')" style="cursor:pointer;color:var(--danger);margin-left:8px">✕</span></li>').join('');
}
function removeGratitude(i) { state.gratitudeItems.splice(i, 1); renderGratitudeList(); }
function saveJournalEntry() {
  const reflection = document.getElementById('reflectionInput').value.trim();
  if (!state.currentMood && !state.gratitudeItems.length && !reflection) { alert('Please add at least a mood, gratitude item, or reflection!'); return; }
  state.journalEntries.push({ id: Date.now(), date: new Date().toISOString(), mood: state.currentMood, gratitude: [...state.gratitudeItems], reflection });
  state.currentMood = ''; state.gratitudeItems = [];
  document.getElementById('reflectionInput').value = '';
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
  renderGratitudeList(); saveState(); renderJournalEntries(); alert('✨ Journal entry saved!');
}
function renderJournalEntries() {
  const el = document.getElementById('journalEntries');
  if (!state.journalEntries.length) { el.innerHTML = '<div class="empty-state"><div class="empty-icon">🌸</div><p>No journal entries yet. Start writing!</p></div>'; return; }
  const me = { amazing:'🤩', happy:'😊', good:'🙂', okay:'😐', sad:'😢', stressed:'😰' };
  el.innerHTML = state.journalEntries.slice().reverse().map(e => {
    const dt = new Date(e.date).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
    return '<div class="journal-entry-card"><div class="journal-date">'+dt+' '+(e.mood?me[e.mood]||'':'')+'</div>'+(e.gratitude.length?'<ul class="gratitude-list">'+e.gratitude.map(g => '<li>'+escapeHtml(g)+'</li>').join('')+'</ul>':'')+(e.reflection?'<p style="margin-top:12px;font-size:0.88rem;color:var(--text-secondary)">'+escapeHtml(e.reflection)+'</p>':'')+'<span class="todo-delete" onclick="deleteJournal('+e.id+')" style="opacity:1;cursor:pointer;color:var(--danger);float:right;margin-top:8px">Delete</span></div>';
  }).join('');
}
function deleteJournal(id) { state.journalEntries = state.journalEntries.filter(e => e.id !== id); saveState(); renderJournalEntries(); }

let currentYear = 1;
function switchYear(year, btn) { currentYear = year; document.querySelectorAll('.year-tab').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderPlanner(year); }
function renderPlanner(year) {
  const el = document.getElementById('yearContent');
  const sems = [{ key:'sem1', label:'Semester '+((year-1)*2+1), badge:'Year '+year+' - Odd' }, { key:'sem2', label:'Semester '+((year-1)*2+2), badge:'Year '+year+' - Even' }];
  el.innerHTML = sems.map(sem => {
    const courses = (state.planner[year] && state.planner[year][sem.key]) || [];
    return '<div class="semester-card"><h3>'+sem.label+' <span class="sem-badge">'+sem.badge+'</span></h3><table class="course-table"><thead><tr><th>Subject</th><th>Code</th><th>Credits</th><th>Grade</th><th></th></tr></thead><tbody>'+courses.map((c,i) => '<tr><td>'+escapeHtml(c.name)+'</td><td>'+escapeHtml(c.code)+'</td><td>'+c.credits+'</td><td>'+(c.grade||'—')+'</td><td><span onclick="deleteCourse('+year+',\''+sem.key+'\','+i+')" style="cursor:pointer;color:var(--danger)">✕</span></td></tr>').join('')+'</tbody></table><button class="btn btn-sm btn-secondary" onclick="addCourse('+year+',\''+sem.key+'\')" style="margin-top:12px">＋ Add Course</button></div>';
  }).join('');
  calculateCGPA();
}
function addCourse(year, sem) {
  const name = prompt('Subject name:'); if (!name) return;
  const code = prompt('Subject code:', 'CS101');
  const credits = parseInt(prompt('Credits:', '4')) || 4;
  const grade = prompt('Grade (O/A+/A/B+/B/C/F or leave empty):', '');
  if (!state.planner[year]) state.planner[year] = { sem1: [], sem2: [] };
  if (!state.planner[year][sem]) state.planner[year][sem] = [];
  state.planner[year][sem].push({ name: name.trim(), code: code||'', credits, grade: grade||'' });
  saveState(); renderPlanner(currentYear);
}
function deleteCourse(year, sem, i) { state.planner[year][sem].splice(i, 1); saveState(); renderPlanner(currentYear); }
function calculateCGPA() {
  const gp = { 'O':10, 'A+':9, 'A':8, 'B+':7, 'B':6, 'C':5, 'F':0 };
  let tc = 0, tp = 0;
  for (let y = 1; y <= 4; y++) for (const s of ['sem1','sem2']) {
    const courses = (state.planner[y] && state.planner[y][s]) || [];
    courses.forEach(c => { if (c.grade && gp[c.grade] !== undefined) { tc += c.credits; tp += c.credits * gp[c.grade]; } });
  }
  document.getElementById('cgpaValue').textContent = tc > 0 ? (tp / tc).toFixed(2) : '0.00';
}

function renderSkills() {
  const el = document.getElementById('skillsGrid');
  if (!state.skills.length) { el.innerHTML = '<p style="font-size:0.82rem;color:var(--text-muted);grid-column:1/-1">No skills added yet. Track what you learn!</p>'; return; }
  el.innerHTML = state.skills.map((s, i) => '<div class="skill-tag" onclick="removeSkill('+i+')">'+escapeHtml(s)+' ✕</div>').join('');
}
function openSkillModal() { const s = prompt('Enter a skill:'); if (!s || !s.trim()) return; state.skills.push(s.trim()); saveState(); renderSkills(); }
function removeSkill(i) { state.skills.splice(i, 1); saveState(); renderSkills(); }

let cameraStream = null;
function startCamera() {
  const video = document.getElementById('cameraVideo');
  navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
    cameraStream = stream; video.srcObject = stream; video.style.display = 'block';
  }).catch(() => alert('Could not access camera. Please allow camera permissions.'));
}
function stopCamera() { if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; } document.getElementById('cameraVideo').srcObject = null; }
function capturePhoto() {
  const video = document.getElementById('cameraVideo'), canvas = document.getElementById('cameraCanvas');
  if (!cameraStream) { alert('Please start the camera first!'); return; }
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');
  state.photos.push({ id: Date.now(), url: dataUrl }); saveState(); renderPhotoStrip();
  fetch('/api/upload-photo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: dataUrl }) }).catch(() => {});
}
function renderPhotoStrip() {
  document.getElementById('photoStrip').innerHTML = state.photos.map(p => '<img src="'+p.url+'" alt="Photo" onclick="openLightbox(\''+p.url.substring(0,50)+'\')">').join('');
}

function uploadPhotoDump(event) {
  Array.from(event.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      state.photoDump.push({ id: Date.now()+Math.random(), url: e.target.result, date: new Date().toISOString(), month: new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'}) });
      saveState(); renderPhotoDump();
    };
    reader.readAsDataURL(file);
  });
}
function renderPhotoDump() {
  const el = document.getElementById('photoDumpGrid');
  if (!state.photoDump.length) { el.innerHTML = '<div class="empty-state" style="column-span:all"><div class="empty-icon">🖼️</div><p>No photos yet. Upload your memories!</p></div>'; return; }
  el.innerHTML = state.photoDump.map(p => '<div class="photo-dump-item"><img src="'+p.url+'" alt="Photo" loading="lazy"></div>').join('');
}

function openLightbox(url) { document.getElementById('lightboxImg').src = url; document.getElementById('lightbox').style.display = 'flex'; }
function closeLightbox() { document.getElementById('lightbox').style.display = 'none'; }
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }

function toggleChat() { document.getElementById('chatPanel').classList.toggle('open'); }
function sendChat() {
  const input = document.getElementById('chatInput'), msg = input.value.trim();
  if (!msg) return; addChatMessage(msg, 'user'); input.value = '';
  const msgs = document.getElementById('chatMessages');
  const typing = document.createElement('div'); typing.className = 'typing-indicator'; typing.id = 'typingIndicator';
  typing.innerHTML = '<span></span><span></span><span></span>'; msgs.appendChild(typing); msgs.scrollTop = msgs.scrollHeight;
  fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) })
    .then(r => r.json()).then(d => { const ti = document.getElementById('typingIndicator'); if (ti) ti.remove(); addChatMessage(d.response, 'bot'); })
    .catch(() => { const ti = document.getElementById('typingIndicator'); if (ti) ti.remove(); addChatMessage('Sorry, having trouble connecting. Try again!', 'bot'); });
}
function addChatMessage(text, type) {
  const msgs = document.getElementById('chatMessages'), div = document.createElement('div');
  div.className = 'chat-message ' + type;
  div.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight;
}

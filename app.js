'use strict';

/* =========================================================
   STATION — logique applicative
   Persistance exclusive via window.storage (jamais localStorage)
   ========================================================= */

const STORAGE_KEY = 'station_data_v1';
const RING_CIRC_MAIN = 2 * Math.PI * 86;   // anneau principal (r=86)
const RING_CIRC_MINI = 2 * Math.PI * 21;   // mini-anneaux métriques (r=21)

let state = null;
let viewedDate = new Date();      // jour consulté dans "Tableau de bord"
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let currentTab = 'dashboard';

/* ---------------------------------------------------------
   Pont de stockage — window.storage uniquement
   --------------------------------------------------------- */

const StorageBridge = {
  available: false,
  mode: null,
  lastError: null,
  lastSaveAt: null,

  detect() {
    if (typeof window.storage === 'undefined' || window.storage === null) {
      this.available = false; this.mode = null; return;
    }
    if (typeof window.storage.get === 'function' && typeof window.storage.set === 'function') {
      this.available = true; this.mode = 'get/set'; return;
    }
    if (typeof window.storage.getItem === 'function' && typeof window.storage.setItem === 'function') {
      this.available = true; this.mode = 'getItem/setItem'; return;
    }
    this.available = false; this.mode = null;
  },

  async load(key) {
    this.detect();
    if (!this.available) throw new Error("window.storage est introuvable dans cet environnement.");
    let raw;
    if (this.mode === 'get/set') raw = await window.storage.get(key);
    else raw = await window.storage.getItem(key);
    if (raw === undefined || raw === null || raw === '') return null;
    if (typeof raw === 'object') return raw;
    try { return JSON.parse(raw); }
    catch (e) { throw new Error('Données corrompues dans window.storage (' + e.message + ').'); }
  },

  async save(key, value) {
    this.detect();
    if (!this.available) throw new Error("window.storage est introuvable dans cet environnement.");
    const raw = JSON.stringify(value);
    if (this.mode === 'get/set') await window.storage.set(key, raw);
    else await window.storage.setItem(key, raw);
    this.lastSaveAt = new Date();
  }
};

/* ---------------------------------------------------------
   Modèle de données
   --------------------------------------------------------- */

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function defaultState() {
  return {
    version: 1,
    habitsDefs: [
      { id: uid(), icon: '☾', label: 'Sommeil suffisant' },
      { id: uid(), icon: '⚡', label: 'Sport' },
      { id: uid(), icon: '📖', label: 'Lecture' },
      { id: uid(), icon: '◎', label: 'Méditation' }
    ],
    metricsDefs: [
      { id: uid(), icon: '☾', label: 'Sommeil', unit: 'h', target: 7.5, direction: 'max' },
      { id: uid(), icon: '👣', label: 'Pas', unit: 'pas', target: 8000, direction: 'max' },
      { id: uid(), icon: '▭', label: 'Écran', unit: 'h', target: 3, direction: 'min' }
    ],
    categories: [
      { id: uid(), label: 'Travail', color: '#E8A33D' },
      { id: uid(), label: 'Santé', color: '#4FC3D9' },
      { id: uid(), label: 'Perso', color: '#8AB4F8' },
      { id: uid(), label: 'Autre', color: '#6B7684' }
    ],
    goals: [],
    days: {},
    events: {}
  };
}

function migrateState(loaded) {
  const base = defaultState();
  if (!loaded || typeof loaded !== 'object') return base;
  return {
    version: 1,
    habitsDefs: Array.isArray(loaded.habitsDefs) ? loaded.habitsDefs : base.habitsDefs,
    metricsDefs: Array.isArray(loaded.metricsDefs) ? loaded.metricsDefs : base.metricsDefs,
    categories: Array.isArray(loaded.categories) ? loaded.categories : base.categories,
    goals: Array.isArray(loaded.goals) ? loaded.goals : [],
    days: (loaded.days && typeof loaded.days === 'object') ? loaded.days : {},
    events: (loaded.events && typeof loaded.events === 'object') ? loaded.events : {}
  };
}

/* ---------------------------------------------------------
   Dates
   --------------------------------------------------------- */

function pad2(n) { return String(n).padStart(2, '0'); }
function dateKey(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function parseDateKey(key) { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function isSameDay(a, b) { return dateKey(a) === dateKey(b); }

function formatDayLabel(d) {
  const s = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(d);
  return s.toUpperCase();
}

function formatRelative(d) {
  const today = new Date();
  const diff = Math.round((new Date(dateKey(d)) - new Date(dateKey(today))) / 86400000);
  if (diff === 0) return "AUJOURD'HUI";
  if (diff === -1) return 'HIER';
  if (diff === 1) return 'DEMAIN';
  if (diff < 0) return `IL Y A ${Math.abs(diff)} JOURS`;
  return `DANS ${diff} JOURS`;
}

/* ---------------------------------------------------------
   Accès / mutation des jours
   --------------------------------------------------------- */

function getDay(key) {
  return state.days[key] || { habits: {}, metrics: {}, tasks: [], notes: '' };
}

function mutateDay(key, fn) {
  if (!state.days[key]) state.days[key] = { habits: {}, metrics: {}, tasks: [], notes: '' };
  fn(state.days[key]);
}

function computeDayScore(dayData) {
  const totalHabits = state.habitsDefs.length;
  const totalMetrics = state.metricsDefs.length;
  const total = totalHabits + totalMetrics;
  let done = 0;
  state.habitsDefs.forEach(h => { if (dayData?.habits?.[h.id]) done++; });
  state.metricsDefs.forEach(m => {
    const v = dayData?.metrics?.[m.id];
    if (v === undefined || v === null || v === '') return;
    const num = Number(v);
    if (Number.isNaN(num)) return;
    if (m.direction === 'min') { if (num <= m.target) done++; }
    else { if (num >= m.target) done++; }
  });
  return { done, total, score: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/* ---------------------------------------------------------
   Persistance
   --------------------------------------------------------- */

async function persist() {
  setSyncState('syncing');
  try {
    await StorageBridge.save(STORAGE_KEY, state);
    setSyncState('ok');
    updateDiagBox();
  } catch (err) {
    setSyncState('error', err.message);
    showToast('error', 'Échec de sauvegarde', err.message);
    updateDiagBox();
    throw err;
  }
}

function setSyncState(status, detail) {
  const led = document.getElementById('syncLed');
  const label = document.getElementById('syncLabel');
  led.classList.remove('state-error', 'state-syncing');
  if (status === 'ok') { label.textContent = 'SYNC OK'; led.title = 'Dernière sauvegarde réussie'; }
  else if (status === 'syncing') { led.classList.add('state-syncing'); label.textContent = 'SYNC…'; }
  else if (status === 'error') {
    led.classList.add('state-error');
    label.textContent = 'SYNC ERREUR';
    led.title = detail || 'Échec de sauvegarde';
  }
}

function updateDiagBox() {
  const box = document.getElementById('diagBox');
  if (!box) return;
  StorageBridge.detect();
  const lines = [];
  lines.push(`API détectée : <span class="${StorageBridge.available ? 'ok' : 'err'}">${StorageBridge.mode || 'AUCUNE'}</span>`);
  lines.push(`Disponibilité : <span class="${StorageBridge.available ? 'ok' : 'err'}">${StorageBridge.available ? 'OK' : 'INDISPONIBLE'}</span>`);
  lines.push(`Dernière sauvegarde : ${StorageBridge.lastSaveAt ? StorageBridge.lastSaveAt.toLocaleTimeString('fr-FR') : '—'}`);
  if (StorageBridge.lastError) lines.push(`Dernière erreur : <span class="err">${StorageBridge.lastError}</span>`);
  box.innerHTML = lines.join('<br>');
}

/* ---------------------------------------------------------
   Toasts
   --------------------------------------------------------- */

function showToast(type, title, msg, timeout = 5500) {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<strong>${escapeHtml(title)}</strong>${escapeHtml(msg || '')}`;
  el.addEventListener('click', () => el.remove());
  container.appendChild(el);
  if (type === 'error') StorageBridge.lastError = msg;
  setTimeout(() => el.remove(), timeout);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

/* ---------------------------------------------------------
   Debounce
   --------------------------------------------------------- */

function debounce(fn, wait) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

/* ---------------------------------------------------------
   Onglets
   --------------------------------------------------------- */

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(b => {
    const active = b.dataset.tab === tab;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`panel-${tab}`).classList.add('active');
  document.getElementById('tabsToggle').parentElement && document.getElementById('tabsToggle');
  document.querySelector('.tabs').classList.remove('open');
  renderCurrentTab();
}

function renderCurrentTab() {
  if (currentTab === 'dashboard') renderDashboard();
  else if (currentTab === 'calendar') renderCalendar();
  else if (currentTab === 'history') renderHistory();
  else if (currentTab === 'settings') renderSettings();
}

function renderAll() {
  renderDashboard();
  renderCalendar();
  renderHistory();
  renderSettings();
}

/* ---------------------------------------------------------
   TABLEAU DE BORD
   --------------------------------------------------------- */

function renderDashboard() {
  const key = dateKey(viewedDate);
  const day = getDay(key);
  const { done, total, score } = computeDayScore(day);

  document.getElementById('currentDateLabel').textContent = formatDayLabel(viewedDate);
  document.getElementById('currentDateRelative').textContent = formatRelative(viewedDate);

  const ringFg = document.getElementById('scoreRingFg');
  ringFg.style.strokeDasharray = String(RING_CIRC_MAIN);
  ringFg.style.strokeDashoffset = String(RING_CIRC_MAIN * (1 - score / 100));
  ringFg.style.stroke = score >= 70 ? 'var(--amber)' : score >= 40 ? 'var(--cyan)' : 'var(--red)';
  document.getElementById('scoreValue').textContent = score;
  document.getElementById('scoreSub').textContent = `${done} / ${total} objectifs atteints`;

  renderHabitsGrid(key, day);
  renderMetricsGrid(key, day);
  renderTaskList(key, day);
  renderGoalList();

  const notesArea = document.getElementById('notesArea');
  if (document.activeElement !== notesArea) notesArea.value = day.notes || '';

  renderTrendChart();
}

function renderHabitsGrid(key, day) {
  const grid = document.getElementById('habitsGrid');
  const defs = state.habitsDefs;
  document.getElementById('habitsCount').textContent = `${defs.filter(h => day.habits?.[h.id]).length}/${defs.length}`;
  document.getElementById('habitsEmptyHint').hidden = defs.length > 0;
  grid.innerHTML = defs.map(h => {
    const checked = !!day.habits?.[h.id];
    return `<div class="habit-card ${checked ? 'checked' : ''}" data-id="${h.id}" role="button" tabindex="0">
      <span class="habit-card__led"></span>
      <span class="habit-card__icon">${escapeHtml(h.icon || '◆')}</span>
      <span class="habit-card__label">${escapeHtml(h.label)}</span>
    </div>`;
  }).join('');
  grid.querySelectorAll('.habit-card').forEach(card => {
    const toggle = () => {
      const id = card.dataset.id;
      mutateDay(key, d => { d.habits[id] = !d.habits[id]; });
      persist().catch(() => {});
      renderDashboard();
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });
}

function renderMetricsGrid(key, day) {
  const grid = document.getElementById('metricsGrid');
  const defs = state.metricsDefs;
  let reached = 0;
  defs.forEach(m => {
    const v = day.metrics?.[m.id];
    if (v === undefined || v === '' || v === null) return;
    const num = Number(v);
    if (Number.isNaN(num)) return;
    if (m.direction === 'min' ? num <= m.target : num >= m.target) reached++;
  });
  document.getElementById('metricsCount').textContent = `${reached}/${defs.length}`;
  document.getElementById('metricsEmptyHint').hidden = defs.length > 0;

  grid.innerHTML = defs.map(m => {
    const raw = day.metrics?.[m.id];
    const num = raw === undefined || raw === '' ? null : Number(raw);
    const isReached = num !== null && !Number.isNaN(num) && (m.direction === 'min' ? num <= m.target : num >= m.target);
    let progress = 0;
    if (num !== null && !Number.isNaN(num) && m.target !== 0) {
      progress = m.direction === 'min'
        ? (num <= m.target ? 1 : Math.max(0, Math.min(1, m.target / num)))
        : Math.max(0, Math.min(1, num / m.target));
    } else if (num !== null && m.direction === 'min' && m.target === 0) {
      progress = num === 0 ? 1 : 0;
    }
    const offset = RING_CIRC_MINI * (1 - progress);
    const dirLabel = m.direction === 'min' ? '≤' : '≥';
    return `<div class="metric-card ${isReached ? 'reached' : ''}" data-id="${m.id}">
      <svg class="metric-ring" viewBox="0 0 50 50">
        <circle class="m-bg" cx="25" cy="25" r="21"></circle>
        <circle class="m-fg" cx="25" cy="25" r="21" style="stroke-dashoffset:${offset}"></circle>
      </svg>
      <div class="metric-card__body">
        <div class="metric-card__label">${escapeHtml(m.icon || '◆')} ${escapeHtml(m.label)}</div>
        <div class="metric-card__target">Cible ${dirLabel} ${m.target}${escapeHtml(m.unit || '')}</div>
        <div class="metric-card__input-row">
          <input type="number" step="any" class="metric-card__input" data-id="${m.id}"
                 value="${raw !== undefined && raw !== null ? raw : ''}" placeholder="—">
          <span class="metric-card__unit">${escapeHtml(m.unit || '')}</span>
        </div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.metric-card__input').forEach(input => {
    input.addEventListener('input', debounce(() => {
      const id = input.dataset.id;
      const val = input.value === '' ? '' : Number(input.value);
      mutateDay(key, d => { d.metrics[id] = val; });
      persist().catch(() => {});
      renderDashboard();
    }, 500));
  });
}

function renderTaskList(key, day) {
  const list = document.getElementById('taskList');
  list.innerHTML = (day.tasks || []).map(t => `
    <li class="task-item ${t.done ? 'done' : ''}" data-id="${t.id}">
      <button class="task-item__check" type="button">${t.done ? '✓' : ''}</button>
      <span class="task-item__text">${escapeHtml(t.text)}</span>
      <button class="item-del" type="button" title="Supprimer">✕</button>
    </li>`).join('') || '<p class="empty-hint">Aucune tâche pour ce jour.</p>';

  list.querySelectorAll('.task-item').forEach(li => {
    const id = li.dataset.id;
    li.querySelector('.task-item__check').addEventListener('click', () => {
      mutateDay(key, d => { const t = d.tasks.find(x => x.id === id); if (t) t.done = !t.done; });
      persist().catch(() => {});
      renderTaskList(key, getDay(key));
    });
    li.querySelector('.item-del').addEventListener('click', () => {
      mutateDay(key, d => { d.tasks = d.tasks.filter(x => x.id !== id); });
      persist().catch(() => {});
      renderTaskList(key, getDay(key));
    });
  });
}

function renderGoalList() {
  const list = document.getElementById('goalList');
  list.innerHTML = state.goals.map(g => `
    <li class="goal-item ${g.done ? 'done' : ''}" data-id="${g.id}">
      <button class="goal-item__check" type="button">${g.done ? '✓' : ''}</button>
      <span class="goal-item__text">${escapeHtml(g.text)}</span>
      <button class="item-del" type="button" title="Supprimer">✕</button>
    </li>`).join('') || '<p class="empty-hint">Aucun objectif long terme.</p>';

  list.querySelectorAll('.goal-item').forEach(li => {
    const id = li.dataset.id;
    li.querySelector('.goal-item__check').addEventListener('click', () => {
      const g = state.goals.find(x => x.id === id); if (g) g.done = !g.done;
      persist().catch(() => {});
      renderGoalList();
    });
    li.querySelector('.item-del').addEventListener('click', () => {
      state.goals = state.goals.filter(x => x.id !== id);
      persist().catch(() => {});
      renderGoalList();
    });
  });
}

function renderTrendChart() {
  const today = new Date();
  const points = [];
  for (let i = 29; i >= 0; i--) {
    const d = addDays(today, -i);
    const { score } = computeDayScore(getDay(dateKey(d)));
    points.push(score);
  }
  const avg7 = points.map((_, i) => {
    const from = Math.max(0, i - 6);
    const slice = points.slice(from, i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });

  const w = 620, h = 170, padY = 12;
  const stepX = w / (points.length - 1);
  const toY = v => padY + (1 - v / 100) * (h - padY * 2);
  const scoreLine = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');
  const avgLine = avg7.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');

  const svg = document.getElementById('trendChart');
  svg.innerHTML = `
    <line x1="0" y1="${toY(0)}" x2="${w}" y2="${toY(0)}" stroke="#1F252E" stroke-width="1"/>
    <line x1="0" y1="${toY(50)}" x2="${w}" y2="${toY(50)}" stroke="#1F252E" stroke-width="1" stroke-dasharray="2 4"/>
    <line x1="0" y1="${toY(100)}" x2="${w}" y2="${toY(100)}" stroke="#1F252E" stroke-width="1"/>
    <path d="${avgLine}" fill="none" stroke="#4FC3D9" stroke-width="2" opacity="0.85"/>
    <path d="${scoreLine}" fill="none" stroke="#E8A33D" stroke-width="2.2"
          style="filter:drop-shadow(0 0 3px rgba(232,163,61,.6))"/>
  `;

  const last7 = points.slice(-7);
  const prev7 = points.slice(-14, -7);
  const avgLast7 = last7.reduce((a, b) => a + b, 0) / (last7.length || 1);
  const avgPrev7 = prev7.length ? prev7.reduce((a, b) => a + b, 0) / prev7.length : avgLast7;
  const delta = Math.round(avgLast7 - avgPrev7);

  const badge = document.getElementById('trendBadge');
  const arrow = document.getElementById('trendArrow');
  const value = document.getElementById('trendValue');
  badge.classList.remove('up', 'down');
  if (delta > 1) { badge.classList.add('up'); arrow.textContent = '▲'; }
  else if (delta < -1) { badge.classList.add('down'); arrow.textContent = '▼'; }
  else { arrow.textContent = '▬'; }
  value.textContent = `${delta > 0 ? '+' : ''}${delta}% sur 7j`;
}

/* ---------------------------------------------------------
   CALENDRIER
   --------------------------------------------------------- */

function heatLevel(score, hasData) {
  if (!hasData) return 0;
  if (score >= 95) return 4;
  if (score >= 75) return 3;
  if (score >= 45) return 2;
  if (score >= 15) return 1;
  return 0;
}

function renderCalendar() {
  const title = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(calYear, calMonth, 1));
  document.getElementById('calTitle').textContent = title.toUpperCase();

  const first = new Date(calYear, calMonth, 1);
  const startOffset = (first.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();

  const grid = document.getElementById('calGrid');
  let html = '';
  for (let i = 0; i < startOffset; i++) html += '<div class="cal-cell empty"></div>';

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(calYear, calMonth, day);
    const key = dateKey(d);
    const hasData = !!state.days[key];
    const { score } = computeDayScore(getDay(key));
    const level = heatLevel(score, hasData);
    const events = state.events[key] || [];
    const isToday = isSameDay(d, today);
    const eventDots = events.slice(0, 4).map(ev => {
      const cat = state.categories.find(c => c.id === ev.categoryId);
      return `<span class="cal-event-dot" style="background:${cat ? cat.color : '#6B7684'}"></span>`;
    }).join('');
    const more = events.length > 4 ? `<span class="cal-cell__more">+${events.length - 4}</span>` : '';
    html += `<div class="cal-cell ${isToday ? 'today' : ''}" data-key="${key}">
      <span class="cal-cell__num">${day}</span>
      <span class="cal-cell__score-dot heat-${level}"></span>
      <div class="cal-cell__events">${eventDots}${more}</div>
    </div>`;
  }

  grid.innerHTML = html;
  grid.querySelectorAll('.cal-cell:not(.empty)').forEach(cell => {
    cell.addEventListener('click', () => openDayModal(cell.dataset.key));
  });
}

/* ---------------------------------------------------------
   Modale — événements d'un jour
   --------------------------------------------------------- */

function openDayModal(key) {
  const root = document.getElementById('modalRoot');
  const d = parseDateKey(key);
  const events = (state.events[key] || []).slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const catOptions = state.categories.map(c => `<option value="${c.id}">${escapeHtml(c.label)}</option>`).join('');

  root.innerHTML = `
    <div class="modal-backdrop" id="modalBackdrop">
      <div class="modal">
        <button class="modal-close" id="modalClose">✕</button>
        <h3>${escapeHtml(formatDayLabel(d))}</h3>
        <ul class="event-list" id="eventList">
          ${events.length ? events.map(ev => {
            const cat = state.categories.find(c => c.id === ev.categoryId);
            return `<li class="event-item" data-id="${ev.id}">
              <span class="event-item__color" style="background:${cat ? cat.color : '#6B7684'}"></span>
              <div class="event-item__body">
                <div class="event-item__title">${ev.time ? `<strong>${escapeHtml(ev.time)}</strong> — ` : ''}${escapeHtml(ev.title)}</div>
                <div class="event-item__meta">${cat ? escapeHtml(cat.label) : 'Sans catégorie'}</div>
                ${ev.note ? `<div class="event-item__note">${escapeHtml(ev.note)}</div>` : ''}
              </div>
              <button class="item-del" type="button" title="Supprimer">✕</button>
            </li>`;
          }).join('') : '<p class="empty-hint">Aucun événement ce jour.</p>'}
        </ul>
        <form id="eventForm" class="form-grid">
          <input type="text" id="evTitle" placeholder="Titre de l'événement" required maxlength="100">
          <div class="form-row">
            <input type="time" id="evTime">
            <select id="evCategory">${catOptions}</select>
          </div>
          <textarea id="evNote" placeholder="Note (optionnel)" rows="2" maxlength="300"></textarea>
          <div class="form-actions">
            <button type="submit" class="pill-btn pill-btn--accent">Ajouter l'événement</button>
          </div>
        </form>
        <button class="link-btn" id="gotoDashboard" type="button">Voir ce jour dans le Tableau de bord →</button>
      </div>
    </div>`;

  const close = () => { root.innerHTML = ''; };
  document.getElementById('modalClose').addEventListener('click', close);
  document.getElementById('modalBackdrop').addEventListener('click', e => { if (e.target.id === 'modalBackdrop') close(); });

  document.getElementById('eventList').querySelectorAll('.item-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.event-item').dataset.id;
      state.events[key] = (state.events[key] || []).filter(ev => ev.id !== id);
      persist().catch(() => {});
      renderCalendar();
      openDayModal(key);
    });
  });

  document.getElementById('eventForm').addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('evTitle').value.trim();
    if (!title) return;
    const ev = {
      id: uid(),
      title,
      time: document.getElementById('evTime').value || '',
      categoryId: document.getElementById('evCategory').value || null,
      note: document.getElementById('evNote').value.trim()
    };
    if (!state.events[key]) state.events[key] = [];
    state.events[key].push(ev);
    persist().catch(() => {});
    renderCalendar();
    openDayModal(key);
  });

  document.getElementById('gotoDashboard').addEventListener('click', () => {
    viewedDate = d;
    close();
    switchTab('dashboard');
  });
}

/* ---------------------------------------------------------
   HISTORIQUE
   --------------------------------------------------------- */

function renderHistory() {
  const search = (document.getElementById('historySearch').value || '').trim().toLowerCase();
  const todayKey = dateKey(new Date());
  const keys = new Set(Object.keys(state.days));
  keys.add(todayKey);

  let rows = Array.from(keys).sort((a, b) => b.localeCompare(a)).map(key => {
    const day = getDay(key);
    const { done, total, score } = computeDayScore(day);
    const habitsDone = state.habitsDefs.filter(h => day.habits?.[h.id]).length;
    const metricsDone = done - habitsDone;
    const tasksDone = (day.tasks || []).filter(t => t.done).length;
    const tasksTotal = (day.tasks || []).length;
    return { key, day, score, habitsDone, metricsDone, tasksDone, tasksTotal };
  });

  if (search) {
    rows = rows.filter(r => {
      const label = formatDayLabel(parseDateKey(r.key)).toLowerCase();
      const notes = (r.day.notes || '').toLowerCase();
      const tasks = (r.day.tasks || []).map(t => t.text.toLowerCase()).join(' ');
      return r.key.includes(search) || label.includes(search) || notes.includes(search) || tasks.includes(search);
    });
  }

  document.getElementById('historyCount').textContent = `${rows.length} jour(s)`;
  document.getElementById('historyEmptyHint').hidden = rows.length > 0;

  const body = document.getElementById('historyBody');
  body.innerHTML = rows.map(r => `
    <tr>
      <td>${escapeHtml(formatDayLabel(parseDateKey(r.key)))}</td>
      <td><span class="hist-score"><span class="hist-score__bar"><span class="hist-score__fill" style="width:${r.score}%"></span></span>${r.score}%</span></td>
      <td>${r.habitsDone}/${state.habitsDefs.length}</td>
      <td>${r.metricsDone}/${state.metricsDefs.length}</td>
      <td>${r.tasksDone}/${r.tasksTotal}</td>
      <td><button class="hist-view-btn" data-key="${r.key}" type="button">Ouvrir</button></td>
    </tr>`).join('');

  body.querySelectorAll('.hist-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      viewedDate = parseDateKey(btn.dataset.key);
      switchTab('dashboard');
    });
  });
}

function exportData() {
  try {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `station_export_${dateKey(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('success', 'Export réussi', 'Le fichier JSON a été généré.');
  } catch (err) {
    showToast('error', "Échec de l'export", err.message);
  }
}

/* ---------------------------------------------------------
   RÉGLAGES
   --------------------------------------------------------- */

function renderSettings() {
  document.getElementById('habitsDefList').innerHTML = state.habitsDefs.map(h => `
    <li class="def-item" data-id="${h.id}">
      <span class="def-item__icon">${escapeHtml(h.icon || '◆')}</span>
      <span class="def-item__body">${escapeHtml(h.label)}</span>
      <button class="item-del" type="button">✕</button>
    </li>`).join('') || '<p class="empty-hint">Aucune habitude.</p>';

  document.getElementById('metricsDefList').innerHTML = state.metricsDefs.map(m => `
    <li class="def-item" data-id="${m.id}">
      <span class="def-item__icon">${escapeHtml(m.icon || '◆')}</span>
      <span class="def-item__body">${escapeHtml(m.label)}<div class="def-item__meta">Cible ${m.direction === 'min' ? '≤' : '≥'} ${m.target} ${escapeHtml(m.unit || '')}</div></span>
      <button class="item-del" type="button">✕</button>
    </li>`).join('') || '<p class="empty-hint">Aucune métrique.</p>';

  document.getElementById('categoryDefList').innerHTML = state.categories.map(c => `
    <li class="def-item" data-id="${c.id}">
      <span class="def-item__color" style="background:${c.color}"></span>
      <span class="def-item__body">${escapeHtml(c.label)}</span>
      <button class="item-del" type="button">✕</button>
    </li>`).join('') || '<p class="empty-hint">Aucune catégorie.</p>';

  bindDefDeletes('habitsDefList', 'habitsDefs');
  bindDefDeletes('metricsDefList', 'metricsDefs');
  bindDefDeletes('categoryDefList', 'categories');

  updateDiagBox();
}

function bindDefDeletes(listId, stateKey) {
  document.getElementById(listId).querySelectorAll('.item-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.def-item').dataset.id;
      state[stateKey] = state[stateKey].filter(x => x.id !== id);
      persist().catch(() => {});
      renderSettings();
    });
  });
}

/* ---------------------------------------------------------
   Liaison des événements statiques
   --------------------------------------------------------- */

function bindStaticEvents() {
  document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  document.getElementById('tabsToggle').addEventListener('click', () => document.querySelector('.tabs').classList.toggle('open'));

  document.getElementById('syncLed').addEventListener('click', () => {
    persist().then(() => showToast('success', 'Synchronisation', 'Sauvegarde forcée réussie.')).catch(() => {});
  });

  document.getElementById('prevDay').addEventListener('click', () => { viewedDate = addDays(viewedDate, -1); renderDashboard(); });
  document.getElementById('nextDay').addEventListener('click', () => { viewedDate = addDays(viewedDate, 1); renderDashboard(); });
  document.getElementById('todayBtn').addEventListener('click', () => { viewedDate = new Date(); renderDashboard(); });

  document.getElementById('taskForm').addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('taskInput');
    const text = input.value.trim();
    if (!text) return;
    const key = dateKey(viewedDate);
    mutateDay(key, d => d.tasks.push({ id: uid(), text, done: false }));
    input.value = '';
    persist().catch(() => {});
    renderDashboard();
  });

  document.getElementById('goalForm').addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('goalInput');
    const text = input.value.trim();
    if (!text) return;
    state.goals.push({ id: uid(), text, done: false });
    input.value = '';
    persist().catch(() => {});
    renderGoalList();
  });

  const notesArea = document.getElementById('notesArea');
  const notesIndicator = document.getElementById('notesSaveIndicator');
  const debouncedNotesSave = debounce(() => {
    const key = dateKey(viewedDate);
    mutateDay(key, d => { d.notes = notesArea.value; });
    notesIndicator.textContent = 'ENREGISTREMENT…';
    notesIndicator.className = 'save-indicator saving';
    persist().then(() => {
      notesIndicator.textContent = 'ENREGISTRÉ';
      notesIndicator.className = 'save-indicator saved';
    }).catch(() => { notesIndicator.textContent = 'ÉCHEC'; notesIndicator.className = 'save-indicator'; });
  }, 700);
  notesArea.addEventListener('input', debouncedNotesSave);

  document.getElementById('prevMonth').addEventListener('click', () => {
    calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  });
  document.getElementById('nextMonth').addEventListener('click', () => {
    calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  });

  document.getElementById('historySearch').addEventListener('input', debounce(renderHistory, 200));
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('exportBtn2').addEventListener('click', exportData);

  document.getElementById('habitDefForm').addEventListener('submit', e => {
    e.preventDefault();
    const label = document.getElementById('habitDefLabel').value.trim();
    if (!label) return;
    const icon = document.getElementById('habitDefIcon').value.trim() || '◆';
    state.habitsDefs.push({ id: uid(), icon, label });
    e.target.reset();
    persist().catch(() => {});
    renderSettings(); renderDashboard();
  });

  document.getElementById('metricDefForm').addEventListener('submit', e => {
    e.preventDefault();
    const label = document.getElementById('metricDefLabel').value.trim();
    const target = Number(document.getElementById('metricDefTarget').value);
    if (!label || Number.isNaN(target)) return;
    const icon = document.getElementById('metricDefIcon').value.trim() || '◆';
    const unit = document.getElementById('metricDefUnit').value.trim();
    const direction = document.getElementById('metricDefDir').value;
    state.metricsDefs.push({ id: uid(), icon, label, unit, target, direction });
    e.target.reset();
    persist().catch(() => {});
    renderSettings(); renderDashboard();
  });

  document.getElementById('categoryDefForm').addEventListener('submit', e => {
    e.preventDefault();
    const label = document.getElementById('categoryDefLabel').value.trim();
    if (!label) return;
    const color = document.getElementById('categoryDefColor').value;
    state.categories.push({ id: uid(), label, color });
    e.target.reset();
    document.getElementById('categoryDefColor').value = '#4FC3D9';
    persist().catch(() => {});
    renderSettings(); renderCalendar();
  });

  document.getElementById('importFile').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== 'object') throw new Error('Format de fichier invalide.');
        if (!window.confirm('Importer ce fichier remplacera toutes les données actuelles. Continuer ?')) return;
        state = migrateState(parsed);
        persist().then(() => {
          showToast('success', 'Import réussi', 'Les données ont été restaurées.');
          renderAll();
        }).catch(() => {});
      } catch (err) {
        showToast('error', "Échec de l'import", err.message);
      } finally {
        e.target.value = '';
      }
    };
    reader.onerror = () => showToast('error', "Échec de l'import", 'Impossible de lire le fichier.');
    reader.readAsText(file);
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!window.confirm('Réinitialiser supprimera définitivement toutes les données STATION. Continuer ?')) return;
    state = defaultState();
    persist().then(() => {
      showToast('info', 'Réinitialisation', 'Toutes les données ont été effacées.');
      renderAll();
    }).catch(() => {});
  });
}

/* ---------------------------------------------------------
   Horloge
   --------------------------------------------------------- */

function startClock() {
  const el = document.getElementById('clock');
  const tick = () => { el.textContent = new Date().toLocaleTimeString('fr-FR'); };
  tick();
  setInterval(tick, 1000);
}

/* ---------------------------------------------------------
   Démarrage
   --------------------------------------------------------- */

async function init() {
  bindStaticEvents();
  try {
    const loaded = await StorageBridge.load(STORAGE_KEY);
    if (loaded) {
      state = migrateState(loaded);
      setSyncState('ok');
    } else {
      state = defaultState();
      await persist();
    }
  } catch (err) {
    state = defaultState();
    setSyncState('error', err.message);
    showToast('error', 'Stockage indisponible', err.message + ' Les modifications resteront locales à cette session et ne seront pas sauvegardées.', 9000);
  }
  updateDiagBox();
  startClock();
  renderAll();
}

document.addEventListener('DOMContentLoaded', init);

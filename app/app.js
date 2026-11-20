/* Leonida Trophy Atlas — tracker logic. No libraries, no network at run time:
   the only requests are the two local JSON files beside this script. */
'use strict';

const STORAGE = 'leonida-trophy-atlas-v1';
const KIND_NAMES = {
  all: 'All', platinum: 'Platinum', story: 'Story', missable: 'Missable',
  collectible: 'Collectibles', activity: 'Activities', side: 'Side quests',
  crime: 'Crime & robberies', money: 'Money & property',
  exploration: 'Exploration', misc: 'Other', online: 'Online',
};
const KIND_SEQ = ['all', 'story', 'missable', 'collectible', 'activity', 'side', 'crime', 'money', 'exploration', 'misc', 'online'];
const GRADE_SEQ = ['platinum', 'gold', 'silver', 'bronze'];

let list = [];
let guide = null;
let saved = readSaved();
let view = { kind: 'all', grade: 'all', status: 'all', query: '', spoilers: true, openId: null };

function readSaved() {
  const blank = { earned: {}, counts: {} };
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return blank;
    const data = JSON.parse(raw);
    return {
      earned: data.earned && typeof data.earned === 'object' ? data.earned : {},
      counts: data.counts && typeof data.counts === 'object' ? data.counts : {},
    };
  } catch (err) {
    return blank;
  }
}

function writeSaved() {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(saved));
  } catch (err) {
    /* Storage full or blocked: the page still works, it just will not remember. */
  }
}

function byId(id) {
  return list.find((t) => t.id === id);
}

function earned(t) {
  return Boolean(saved.earned[t.id]);
}

function tally(t) {
  const n = Number(saved.counts[t.id] || 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function spoilerHidden(t) {
  return view.spoilers && t.kind === 'story' && !earned(t);
}

function fmt(n) {
  return n.toLocaleString('en-US');
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function loadData() {
  const [tres, gres] = await Promise.all([
    fetch('data/trophies.json'),
    fetch('data/guide.json'),
  ]);
  if (!tres.ok || !gres.ok) throw new Error('data files did not load');
  const tdata = await tres.json();
  guide = await gres.json();
  list = tdata.trophies;
}

function readUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('filter') && (KIND_NAMES[params.get('filter')] || params.get('filter') === 'all')) view.kind = params.get('filter');
  if (params.has('grade') && (params.get('grade') === 'all' || GRADE_SEQ.includes(params.get('grade')))) view.grade = params.get('grade');
  if (params.has('status') && ['all', 'earned', 'remaining'].includes(params.get('status'))) view.status = params.get('status');
  if (params.has('q')) view.query = params.get('q');
  if (params.get('spoilers') === 'off') view.spoilers = false;
  if (params.has('trophy')) {
    const id = Number(params.get('trophy'));
    if (Number.isInteger(id) && id >= 1) view.openId = id;
  }
  return params;
}

function syncControls() {
  document.getElementById('search').value = view.query;
  document.getElementById('grade-filter').value = view.grade;
  document.getElementById('status-filter').value = view.status;
  document.getElementById('spoiler-toggle').checked = view.spoilers;
}

function renderProgress() {
  const got = list.filter(earned);
  const total = list.length;
  const pct = total ? Math.round((got.length / total) * 100) : 0;
  document.getElementById('earned-count').textContent = String(got.length);
  document.getElementById('earned-pct').textContent = pct + '%';
  const fill = document.getElementById('progress-fill');
  fill.style.width = pct + '%';
  document.getElementById('progress-bar').setAttribute('aria-valuenow', String(got.length));
  const box = document.getElementById('grade-counts');
  box.innerHTML = '';
  GRADE_SEQ.forEach((grade) => {
    const inGrade = list.filter((t) => t.grade === grade);
    const gotInGrade = inGrade.filter(earned).length;
    const span = document.createElement('span');
    const label = document.createElement('span');
    label.textContent = cap(grade) + ': ';
    const value = document.createElement('b');
    value.textContent = gotInGrade + ' / ' + inGrade.length;
    span.append(label, value);
    box.append(span);
  });
}

function renderChips() {
  const box = document.getElementById('kind-chips');
  box.innerHTML = '';
  KIND_SEQ.forEach((kind) => {
    const count = kind === 'all' ? list.length
      : kind === 'missable' ? list.filter((t) => t.missable).length
      : kind === 'online' ? 0
      : list.filter((t) => t.kind === kind).length;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.setAttribute('aria-pressed', String(view.kind === kind));
    chip.textContent = KIND_NAMES[kind] + ' ';
    const num = document.createElement('span');
    num.className = 'n';
    num.textContent = '(' + count + ')';
    chip.append(num);
    chip.addEventListener('click', () => {
      view.kind = kind;
      renderAll();
    });
    box.append(chip);
  });
}

function visible(t) {
  if (view.kind === 'online') return false;
  if (view.kind === 'missable' && !t.missable) return false;
  if (view.kind !== 'all' && view.kind !== 'missable' && t.kind !== view.kind) return false;
  if (view.grade !== 'all' && t.grade !== view.grade) return false;
  if (view.status === 'earned' && !earned(t)) return false;
  if (view.status === 'remaining' && earned(t)) return false;
  if (view.query) {
    if (spoilerHidden(t)) return false;
    const hay = [t.name, t.description, t.guide, ...(t.steps || [])].join(' ').toLowerCase();
    if (!hay.includes(view.query.toLowerCase())) return false;
  }
  return true;
}

function gradeTag(t) {
  const tag = document.createElement('span');
  tag.className = 'tag grade-' + t.grade;
  tag.textContent = cap(t.grade);
  return tag;
}

function kindTag(t) {
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = KIND_NAMES[t.kind] || t.kind;
  return tag;
}

function sourceAnchor(key) {
  const src = guide.sources[key];
  if (!src) return null;
  const a = document.createElement('a');
  a.href = src.url;
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = src.name;
  return a;
}

function counterBox(t) {
  const wrap = document.createElement('div');
  wrap.className = 'counter';
  const minus = document.createElement('button');
  minus.type = 'button';
  minus.textContent = '−';
  minus.setAttribute('aria-label', 'Decrease count for ' + t.name);
  const value = document.createElement('span');
  value.className = 'count-value';
  const plus = document.createElement('button');
  plus.type = 'button';
  plus.textContent = '+';
  plus.setAttribute('aria-label', 'Increase count for ' + t.name);
  const refresh = () => {
    const cur = tally(t);
    value.innerHTML = '';
    const main = document.createElement('span');
    main.textContent = fmt(cur) + ' / ' + fmt(t.target);
    const sub = document.createElement('small');
    sub.textContent = t.targetLabel + (t.targetTotal && t.targetTotal !== t.target
      ? ' (of ' + fmt(t.targetTotal) + ' in the game)' : '');
    value.append(main, sub);
    minus.disabled = cur <= 0;
    plus.disabled = cur >= t.target;
  };
  minus.addEventListener('click', () => bumpCount(t, -1));
  plus.addEventListener('click', () => bumpCount(t, 1));
  wrap.append(minus, value, plus);
  refresh();
  return wrap;
}

function bumpCount(t, delta) {
  const next = Math.max(0, Math.min(t.target, tally(t) + delta));
  saved.counts[t.id] = next;
  if (next >= t.target && t.target > 0) saved.earned[t.id] = true;
  writeSaved();
  renderAll();
}

function setEarned(t, on) {
  if (on) saved.earned[t.id] = true;
  else delete saved.earned[t.id];
  writeSaved();
  renderAll();
}

function guidePanel(t) {
  const panel = document.createElement('div');
  panel.className = 'guide';
  const text = document.createElement('p');
  text.textContent = t.guide;
  panel.append(text);
  if (t.steps && t.steps.length) {
    const head = document.createElement('h4');
    head.textContent = 'How to do it';
    const steps = document.createElement('ol');
    t.steps.forEach((step) => {
      const li = document.createElement('li');
      li.textContent = step;
      steps.append(li);
    });
    panel.append(head, steps);
  }
  if (t.target) panel.append(counterBox(t));
  if (t.sources && t.sources.length) {
    const head = document.createElement('h4');
    head.textContent = 'Sources';
    const line = document.createElement('p');
    line.className = 'sources';
    line.textContent = 'Facts above come from: ';
    t.sources.forEach((key) => {
      const a = sourceAnchor(key);
      if (a) line.append(a);
    });
    panel.append(head, line);
  }
  return panel;
}

function renderList() {
  const ol = document.getElementById('trophy-list');
  ol.innerHTML = '';
  const shown = list.filter(visible);
  document.getElementById('result-count').textContent =
    'Showing ' + shown.length + ' of ' + list.length + ' trophies · ' +
    list.filter(earned).length + ' earned';
  const empty = document.getElementById('empty-state');
  if (view.kind === 'online') {
    empty.hidden = false;
    empty.childNodes[0].textContent = 'No online trophies: all 55 are single-player and offline. ';
  } else {
    empty.hidden = shown.length !== 0;
    if (shown.length === 0) empty.childNodes[0].textContent = 'No trophies match these filters. ';
  }
  shown.forEach((t) => {
    const item = document.createElement('li');
    item.className = 'trophy' + (earned(t) ? ' earned' : '');
    item.id = 'trophy-' + t.id;
    const row = document.createElement('div');
    row.className = 'trophy-row';
    const checkWrap = document.createElement('label');
    checkWrap.className = 'trophy-check';
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = earned(t);
    check.setAttribute('aria-label', 'Mark earned: ' + (spoilerHidden(t) ? 'hidden story trophy' : t.name));
    check.addEventListener('change', () => setEarned(t, check.checked));
    checkWrap.append(check);
    const main = document.createElement('div');
    main.className = 'trophy-main';
    const name = document.createElement('div');
    name.className = 'trophy-name';
    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    if (spoilerHidden(t)) {
      name.textContent = 'Hidden story trophy';
      name.classList.add('spoiler-hidden');
      desc.textContent = 'Spoilers hidden. Tick the box once you have earned it, or switch off “Hide story spoilers” above.';
      desc.classList.add('spoiler-hidden');
    } else {
      name.textContent = t.name;
      desc.textContent = t.description;
    }
    const meta = document.createElement('div');
    meta.className = 'trophy-meta';
    meta.append(gradeTag(t), kindTag(t));
    if (t.missable) {
      const tag = document.createElement('span');
      tag.className = 'tag missable';
      tag.textContent = 'Missable';
      meta.append(tag);
    }
    if (t.hidden) {
      const tag = document.createElement('span');
      tag.className = 'tag hidden-t';
      tag.textContent = 'Hidden on PSN';
      meta.append(tag);
    }
    if (t.unconfirmed) {
      const tag = document.createElement('span');
      tag.className = 'tag unconfirmed';
      tag.textContent = 'Unconfirmed';
      meta.append(tag);
    }
    if (t.target) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = fmt(tally(t)) + ' / ' + fmt(t.target) + ' ' + t.targetLabel;
      meta.append(tag);
    }
    main.append(name, desc, meta);
    row.append(checkWrap, main);
    if (!spoilerHidden(t)) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'guide-toggle';
      const open = view.openId === t.id;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Hide guide' : 'Guide';
      toggle.addEventListener('click', () => {
        view.openId = view.openId === t.id ? null : t.id;
        renderAll();
      });
      row.append(toggle);
    }
    item.append(row);
    if (!spoilerHidden(t) && view.openId === t.id) item.append(guidePanel(t));
    ol.append(item);
  });
}

function renderRoadmap() {
  const facts = guide.facts;
  document.getElementById('roadmap-facts').textContent =
    facts.gradeSplit + ' · ' + facts.hiddenCount + ' hidden on PlayStation · ' +
    facts.online + ' online · about ' + facts.time + ' (' + facts.timeNote + ') · difficulty ' +
    facts.difficulty + ' (' + facts.difficultyNote + ') · ' + facts.playthroughs + ' playthrough';
  const phases = document.getElementById('phases');
  phases.innerHTML = '';
  guide.roadmap.forEach((phase) => {
    const card = document.createElement('div');
    card.className = 'phase';
    const title = document.createElement('h3');
    title.textContent = phase.title;
    const hours = document.createElement('p');
    hours.className = 'hours';
    hours.textContent = phase.hours;
    const note = document.createElement('p');
    note.textContent = phase.note;
    const ids = document.createElement('div');
    ids.className = 'trophy-ids';
    phase.ids.forEach((id) => {
      const t = byId(id);
      if (!t) return;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = earned(t) ? 'done' : '';
      chip.textContent = spoilerHidden(t) ? 'Hidden story trophy' : t.name;
      chip.addEventListener('click', () => {
        view.kind = 'all';
        view.grade = 'all';
        view.status = 'all';
        view.query = '';
        document.getElementById('search').value = '';
        view.openId = t.id;
        renderAll();
        const row = document.getElementById('trophy-' + t.id);
        if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      ids.append(chip);
    });
    card.append(title, hours, note, ids);
    phases.append(card);
  });
  const warnings = document.getElementById('warnings');
  warnings.innerHTML = '';
  guide.warnings.forEach((w) => {
    const li = document.createElement('li');
    li.textContent = w.text;
    warnings.append(li);
  });
}

function renderSources() {
  const ul = document.getElementById('sources');
  ul.innerHTML = '';
  Object.values(guide.sources).forEach((src) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = src.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = src.name;
    li.append(a);
    ul.append(li);
  });
}

function renderAll() {
  renderProgress();
  renderChips();
  renderRoadmap();
  renderList();
}

function doExport() {
  const payload = {
    app: 'leonida-trophy-atlas',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: list.filter(earned).map((t) => t.id),
    counts: saved.counts,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function doImport(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      const got = {};
      (data.earned || []).forEach((id) => {
        if (byId(Number(id))) got[Number(id)] = true;
      });
      const counts = {};
      Object.entries(data.counts || {}).forEach(([id, value]) => {
        const t = byId(Number(id));
        if (t && Number.isFinite(Number(value))) {
          counts[Number(id)] = Math.max(0, Math.min(t.target || Number(value), Math.floor(Number(value))));
        }
      });
      saved = { earned: got, counts };
      writeSaved();
      renderAll();
    } catch (err) {
      window.alert('That file is not a Leonida Trophy Atlas progress export.');
    }
  };
  reader.readAsText(file);
}

function doReset() {
  if (!window.confirm('Clear all earned trophies and counts in this browser?')) return;
  saved = { earned: {}, counts: {} };
  writeSaved();
  renderAll();
}

function bindControls() {
  document.getElementById('search').addEventListener('input', (event) => {
    view.query = event.target.value;
    renderList();
  });
  document.getElementById('grade-filter').addEventListener('change', (event) => {
    view.grade = event.target.value;
    renderList();
  });
  document.getElementById('status-filter').addEventListener('change', (event) => {
    view.status = event.target.value;
    renderList();
  });
  document.getElementById('spoiler-toggle').addEventListener('change', (event) => {
    view.spoilers = event.target.checked;
    renderAll();
  });
  document.getElementById('export-btn').addEventListener('click', doExport);
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) doImport(file);
    event.target.value = '';
  });
  document.getElementById('reset-btn').addEventListener('click', doReset);
  document.getElementById('clear-filters').addEventListener('click', () => {
    view = { kind: 'all', grade: 'all', status: 'all', query: '', spoilers: view.spoilers, openId: null };
    syncControls();
    renderAll();
  });
  document.getElementById('missable-jump').addEventListener('click', () => {
    view.kind = 'collectible';
    view.grade = 'all';
    view.status = 'all';
    view.query = '';
    document.getElementById('search').value = '';
    view.openId = 28;
    renderAll();
    const row = document.getElementById('trophy-28');
    if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

async function init() {
  const params = readUrl();
  try {
    await loadData();
  } catch (err) {
    document.getElementById('trophy-list').innerHTML =
      '<li class="trophy"><p>This guide needs its data files, so please serve the app folder over HTTP ' +
      '(for example: node serve.ts) instead of opening index.html directly from disk.</p></li>';
    return;
  }
  syncControls();
  if (view.openId && !byId(view.openId)) view.openId = null;
  bindControls();
  renderAll();
  renderSources();
  if (params.get('view') === 'roadmap') {
    document.getElementById('roadmap').scrollIntoView({ behavior: 'instant' });
  } else if (view.openId) {
    const row = document.getElementById('trophy-' + view.openId);
    if (row) row.scrollIntoView({ behavior: 'instant', block: 'center' });
  }
}

/* Small handle for local checks and screenshots: mark trophies earned or set a count. */
window.TrophyAtlas = {
  setEarned(ids) {
    ids.forEach((id) => { if (byId(id)) saved.earned[id] = true; });
    writeSaved();
    renderAll();
  },
  setCount(id, value) {
    const t = byId(id);
    if (!t) return;
    saved.counts[id] = Math.max(0, Math.min(t.target || value, value));
    if (t.target && value >= t.target) saved.earned[id] = true;
    writeSaved();
    renderAll();
  },
  getState() {
    return { earned: Object.keys(saved.earned).map(Number), counts: saved.counts };
  },
};

init();

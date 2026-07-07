const API   = 'http://localhost:3000';
const CANDS = ['Alice','Bob','Carol'];
const PFXS  = { info:'›', success:'✓', warning:'⚠', error:'✗' };
let logCount = 0;

// ── helpers ────────────────────────────────────────────────────────────────

async function api(method, path, body) {
  const opts = { method, headers: {'Content-Type':'application/json'},
    signal: AbortSignal.timeout(120000) };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function spin(id, on) {
  document.getElementById('sp-' + id).style.display = on ? 'inline-block' : 'none';
}

function escH(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── log ────────────────────────────────────────────────────────────────────

function appendLog(entries) {
  if (entries.length === logCount) return;
  const body = document.getElementById('log-body');
  entries.slice(logCount).forEach(e => {
    const ts = new Date().toLocaleTimeString('en-GB',
      {hour:'2-digit',minute:'2-digit',second:'2-digit'});
    const d  = document.createElement('div');
    d.className = 'le ' + e.level;
    d.innerHTML = `<span class="ts">${ts}</span>`
      + `<span class="pfx">${PFXS[e.level]||'›'}</span> `
      + `<span class="msg">${escH(e.message)}</span>`;
    body.appendChild(d);
  });
  logCount = entries.length;
  body.scrollTop = body.scrollHeight;
}

function clearLog() {
  document.getElementById('log-body').innerHTML = '';
  logCount = 0;
}

// ── state rendering ────────────────────────────────────────────────────────

function renderState(s) {
  // status chips
  const cs = document.getElementById('chip-setup');
  if (s.setup) { cs.textContent = 'ready'; cs.className = 'status-chip on'; }
  else         { cs.textContent = 'not set up'; cs.className = 'status-chip dim'; }

  const reg = s.voters.filter(v => v.registered).length;
  const cv  = document.getElementById('chip-voters');
  cv.textContent = reg + '/' + s.voter_count + ' registered';
  cv.className   = reg > 0 ? 'status-chip on' : 'status-chip dim';

  const cb = document.getElementById('chip-ballots');
  cb.textContent = s.ballots_in_box + ' ballot' + (s.ballots_in_box === 1 ? '' : 's');
  cb.className   = s.ballots_in_box > 0 ? 'status-chip on' : 'status-chip dim';

  // voter chips
  const chips = document.getElementById('voter-chips');
  chips.innerHTML = '';
  s.voters.forEach(v => {
    const c = document.createElement('span');
    let cls = 'voter-chip';
    if (v.registered)  cls += ' registered';
    if (v.fake_votes)  cls += ' has-fake';
    if (v.real_votes)  cls += ' has-real';
    c.className   = cls;
    c.textContent = v.name
      + (v.real_votes ? ` (${v.real_votes}✓)` : '')
      + (v.fake_votes ? ` (${v.fake_votes}⚠)` : '');
    chips.appendChild(c);
  });

  // repopulate selects
  ['sel-reg','sel-voter','sel-fake-voter'].forEach(id => {
    const sel = document.getElementById(id);
    const cur = sel.value;
    sel.innerHTML = '';
    if (!s.setup || s.voters.length === 0) {
      sel.innerHTML = '<option value="">(set up first)</option>';
      return;
    }
    s.voters.forEach(v => {
      const o = document.createElement('option');
      o.value       = v.id;
      o.textContent = v.name + (v.registered ? ' ✓' : '');
      sel.appendChild(o);
    });
    if ([...sel.options].some(o => o.value === cur)) sel.value = cur;
  });

  // results
  if (s.result) renderResults(s.result);

  appendLog(s.log);
}

function renderResults(r) {
  const wrap = document.getElementById('results-wrap');
  const body = document.getElementById('results-body');
  wrap.style.display = 'block';
  const top = Math.max(...r.counts, 0);
  const max = Math.max(top, 1);
  const leaders = top > 0
    ? r.counts.reduce((acc, n, k) => (n === top ? [...acc, k] : acc), [])
    : [];
  let html = '';
  if (leaders.length === 1) {
    html += `<div class="winner-note">🏆 ${CANDS[leaders[0]]} wins with ${top} vote(s)</div>`;
  } else if (leaders.length > 1) {
    const names = leaders.map(k => CANDS[k] || k);
    const list  = names.length === 2
      ? names.join(' and ')
      : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
    html += `<div class="winner-note">🤝 Tie between ${list} with ${top} vote(s) each</div>`;
  }
  r.counts.forEach((n, k) => {
    const pct = (n / max * 100).toFixed(1);
    const win = leaders.includes(k);
    html += `<div class="result-row">
      <span class="result-name">${CANDS[k]||k}</span>
      <div class="result-track"><div class="result-fill${win?' winner':''}" style="width:${pct}%"></div></div>
      <span class="result-n">${n}</span>
    </div>`;
  });
  html += `<div class="result-stats">
    <div class="r-stat"><strong>${r.total_cast}</strong>cast</div>
    <div class="r-stat"><strong>${r.num_duplicates_removed}</strong>dupes removed</div>
    <div class="r-stat"><strong>${r.num_invalid_credential}</strong>invalid creds</div>
    <div class="r-stat"><strong>${r.num_counted}</strong>counted</div>
  </div>`;
  body.innerHTML = html;
}

// ── connection probe ───────────────────────────────────────────────────────

let connected = false;

async function probe() {
  try {
    const s = await api('GET', '/api/state');
    if (!connected) {
      connected = true;
      document.getElementById('offline-card').style.display = 'none';
      document.getElementById('status-bar').style.display   = 'flex';
      document.getElementById('demo-grid').style.display    = 'grid';
    }
    renderState(s);
  } catch (_) {
    if (connected) {
      connected = false;
      document.getElementById('offline-card').style.display = 'block';
      document.getElementById('status-bar').style.display   = 'none';
      document.getElementById('demo-grid').style.display    = 'none';
    } else {
      document.getElementById('offline-card').style.display = 'block';
    }
  }
}

setInterval(probe, 2000);
probe();

// ── actions ────────────────────────────────────────────────────────────────

async function doSetup() {
  const n = parseInt(document.getElementById('n-voters').value) || 3;
  spin('setup', true);
  document.getElementById('btn-setup').disabled = true;
  try {
    await api('POST', '/api/setup', { num_voters: n });
    probe();
  } finally {
    spin('setup', false);
    document.getElementById('btn-setup').disabled = false;
  }
}

async function doRegister() {
  const id = document.getElementById('sel-reg').value;
  if (id === '') return;
  spin('reg', true);
  document.getElementById('btn-reg').disabled = true;
  try {
    await api('POST', '/api/register', { voter_id: parseInt(id) });
    probe();
  } finally {
    spin('reg', false);
    document.getElementById('btn-reg').disabled = false;
  }
}

async function doVote(fake) {
  const voterSel = fake ? 'sel-fake-voter' : 'sel-voter';
  const candSel  = fake ? 'sel-fake-cand'  : 'sel-cand';
  const spId     = fake ? 'fake' : 'vote';
  const btnId    = fake ? 'btn-fake' : 'btn-vote';
  const id   = document.getElementById(voterSel).value;
  const cand = parseInt(document.getElementById(candSel).value);
  if (id === '') return;
  spin(spId, true);
  document.getElementById(btnId).disabled = true;
  try {
    await api('POST', '/api/vote', { voter_id: parseInt(id), candidate: cand, fake });
    probe();
  } finally {
    spin(spId, false);
    document.getElementById(btnId).disabled = false;
  }
}

async function doTabulate() {
  spin('tab', true);
  document.getElementById('btn-tab').disabled = true;
  try {
    await api('POST', '/api/tabulate');
    probe();
  } finally {
    spin('tab', false);
    document.getElementById('btn-tab').disabled = false;
  }
}

async function doReset() {
  logCount = 0;
  document.getElementById('log-body').innerHTML = '';
  document.getElementById('results-wrap').style.display = 'none';
  await api('POST', '/api/reset');
  probe();
}

// ── event bindings (CSP-safe, no inline handlers) ──────────────────────────

document.querySelector('.retry-btn').addEventListener('click', probe);
document.getElementById('btn-setup').addEventListener('click', doSetup);
document.getElementById('btn-reg').addEventListener('click', doRegister);
document.getElementById('btn-vote').addEventListener('click', () => doVote(false));
document.getElementById('btn-fake').addEventListener('click', () => doVote(true));
document.getElementById('btn-tab').addEventListener('click', doTabulate);
document.getElementById('btn-reset').addEventListener('click', doReset);
document.querySelector('.log-clear').addEventListener('click', clearLog);

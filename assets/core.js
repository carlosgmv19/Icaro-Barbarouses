/* Icaro Barbarouses · núcleo: datos, cálculos, cabecera y rutas */
'use strict';
const CFG = Object.assign({ url: '', repo: '' }, window.ICAROS_CONFIG || {});
const EJEMPLO = 'datos-ejemplo.json';
const HOY = new Date();

/* ---------------- utilidades ---------------- */
const $ = (s, el) => (el || document).querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } },
};
const isNum = v => typeof v === 'number' && isFinite(v);
/** número con coma decimal: 1 decimal salvo enteros */
function nf(v, d) {
  if (!isNum(v)) return '—';
  const r = Math.round(v * 10) / 10;
  const s = (d === 1 ? r.toFixed(1) : (Number.isInteger(r) ? String(Math.abs(r)) : Math.abs(r).toFixed(1)));
  return (r < 0 ? '−' : '') + (d === 1 ? s.replace('-', '') : s).replace('.', ',');
}
const n1 = v => nf(v, 1);
const sg = v => !isNum(v) ? '—' : (Math.round(v * 10) / 10 > 0 ? '+' : '') + nf(v);
const pc = v => !isNum(v) ? '—' : nf(v * 100) + '%';
const pc0 = v => !isNum(v) ? '—' : Math.round(v * 100) + '%';
const plain = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
function pd(s) { if (!s) return null; const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s); return m ? new Date(+m[1], m[2] - 1, +m[3]) : null; }
const fd = s => { const d = pd(s); return d ? d.getDate() + ' ' + MESES[d.getMonth()] : '—'; };
const fdy = s => { const d = pd(s); return d ? d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear() : '—'; };
const fdw = s => { const d = pd(s); return d ? DIAS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()] : '—'; };
function toast(m) { let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); } t.textContent = m; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2200); }
const sum = (a, f) => a.reduce((s, x) => s + (f ? f(x) : x), 0);
const uniq = a => [...new Set(a)];
const LOCK = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>';
const SIL = (w, h) => `<svg width="${w}" height="${h}" viewBox="0 0 300 400" fill="none" style="position:relative" aria-hidden="true"><circle cx="150" cy="120" r="70" fill="#3A3018"></circle><path d="M30 400c0-90 54-160 120-160s120 70 120 160z" fill="#3A3018"></path></svg>`;

/* ---------------- carga de datos ---------------- */
const S = { raw: null, M: null, ejemplo: false, error: '', season: null, mode: null, fresh: false };

function dataUrl() { return CFG.url && /^https?:/.test(CFG.url) ? CFG.url : EJEMPLO; }
async function fetchData() {
  const u = dataUrl();
  const r = await fetch(u.endsWith('.json') ? u : u + (u.includes('?') ? '&' : '?') + 'action=all', { cache: 'no-store' });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Respuesta no válida');
  return j.data;
}
async function boot() {
  S.ejemplo = dataUrl() === EJEMPLO;
  S.mode = ls.get('icaros:modo', null) || (matchMedia('(max-width: 760px)').matches ? 'basic' : 'full');
  const cache = ls.get('icaros:datos', null);
  if (cache && cache.src === dataUrl() && cache.data) { setData(cache.data); render(); }
  else renderLoading();
  try {
    const d = await fetchData();
    S.fresh = true;
    ls.set('icaros:datos', { src: dataUrl(), t: Date.now(), data: d });
    setData(d); render();
  } catch (e) {
    console.error(e);
    S.error = 'No se han podido cargar los datos del Sheet' + (S.M ? ': se muestran los últimos guardados en este dispositivo.' : '. Prueba a recargar la página en un momento.');
    render();
  }
}
async function reload() { try { const d = await fetchData(); ls.set('icaros:datos', { src: dataUrl(), t: Date.now(), data: d }); setData(d); render(); } catch (e) { console.error(e); } }

/* ---------------- modelo ---------------- */
const K = ['MIN', 'PTS', 'FGM', 'FGA', '3PM', '3PA', 'FTM', 'FTA', 'REBO', 'REBD', 'REB', 'AST', 'STL', 'BLK', 'TOV', 'PLUS', 'MINUS'];
const num = v => { if (v === '' || v == null) return null; const x = typeof v === 'number' ? v : Number(String(v).replace(',', '.')); return isFinite(x) ? x : null; };
const yes = v => /^s[ií]$/i.test(String(v || '').trim());

function setData(d) {
  S.raw = d;
  const M = {};
  M.seasons = (d.Temporadas || []).map(t => ({ id: String(t.Temporada), actual: yes(t.Actual), comp: t['Competición'] || '', qmin: num(t['Min. cuarto']) || 12 }))
    .sort((a, b) => b.id.localeCompare(a.id));
  M.players = {};
  (d.Jugadores || []).forEach(j => {
    const pos = String(j['Posición'] || '').split('/').map(s => s.trim()).filter(Boolean);
    M.players[j.Nombre] = { name: j.Nombre, dorsal: j.Dorsal != null ? String(j.Dorsal) : '', pos, posTxt: pos.join(' / '), arq: j.Arquetipo || '',
      altura: j['Altura (cm)'] || '', foto: j.Foto || '', fotoAcc: j['Foto acción'] || '', bio: j.Bio || '', desde: String(j.Desde || ''), activo: yes(j.Activo) };
  });
  M.games = (d.Partidos || []).map(p => {
    const g = { id: p.ID, season: String(p.Temporada), fase: p.Fase || 'Liga', j: p.Jornada, date: String(p.Fecha || ''), hora: p.Hora || '', rival: p.Rival || '',
      local: p.Local == null ? null : yes(p.Local), pista: p.Pista || '', estado: p.Estado || '', pf: num(p.PF), pc: num(p.PC), video: p.Video || '', notas: p.Notas || '' };
    g.q = [1, 2, 3, 4].map(i => ({ f: num(p['Q' + i + 'F']), c: num(p['Q' + i + 'C']) }));
    g.ot = num(p.PRF) != null || num(p.PRC) != null ? { f: num(p.PRF) || 0, c: num(p.PRC) || 0 } : null;
    g.played = g.estado === 'Jugado' || (g.pf != null && g.pc != null && g.estado !== 'Programado');
    if (g.played && g.pf == null) g.played = false;
    g.res = g.played ? (g.pf > g.pc ? 'V' : 'D') : null;
    g.po = g.fase === 'Playoffs';
    g.label = g.po ? 'PO' + (g.j || '') : 'J' + (g.j || '');
    return g;
  }).sort((a, b) => a.date.localeCompare(b.date) || String(a.id).localeCompare(String(b.id)));
  M.gameById = {}; M.games.forEach(g => M.gameById[g.id] = g);
  // box: una línea por jugador y partido (Cuarto 0 = partido completo; 1–4 cuartos; 5 = prórroga)
  const acc = {};
  (d.Box || []).forEach(r => {
    const key = r.PartidoID + '|' + r.Jugador;
    const a = acc[key] || (acc[key] = { gid: r.PartidoID, season: String(r.Temporada), p: r.Jugador, full: null, q: {} });
    const o = {}; K.forEach(k => o[k] = num(r[k === 'PLUS' ? '+' : k === 'MINUS' ? '-' : k]));
    const c = num(r.Cuarto) || 0;
    if (c === 0) a.full = o; else a.q[c] = o;
  });
  M.lines = Object.values(acc).map(a => {
    const qs = Object.keys(a.q);
    let t;
    if (qs.length) { t = {}; K.forEach(k => { const v = qs.map(c => a.q[c][k]); t[k] = v.every(x => x == null) ? null : sum(v, x => x || 0); }); }
    else t = a.full || {};
    const L = finishLine(Object.assign({ gid: a.gid, season: a.season, p: a.p }, t));
    if (qs.length) { L.byq = {}; qs.forEach(c => L.byq[c] = finishLine(Object.assign({}, a.q[c]))); }
    const g = M.gameById[a.gid]; L.g = g || null; L.fase = g ? g.fase : 'Liga';
    return L;
  }).filter(l => l.g && (l.MIN || l.PTS || l.FGA || l.REB));
  M.linesByGame = {}; M.lines.forEach(l => (M.linesByGame[l.gid] = M.linesByGame[l.gid] || []).push(l));
  M.lineups = (d.Quintetos || []).map(r => ({ gid: r.PartidoID, season: String(r.Temporada), q: num(r.Cuarto), five: [r.J1, r.J2, r.J3, r.J4, r.J5].filter(Boolean).sort(),
    min: num(r.MIN) || 0, pf: num(r.PF) || 0, pc: num(r.PC) || 0, t2m: num(r.T2M) || 0, t2a: num(r.T2A) || 0, t3m: num(r.T3M) || 0, t3a: num(r.T3A) || 0, tlm: num(r.TLM) || 0, tla: num(r.TLA) || 0 }))
    .filter(r => r.five.length === 5 && r.min > 0);
  M.conv = (d.Convocatoria || []).map(r => ({ season: String(r.Temporada), gid: r.PartidoID, p: r.Jugador, estado: num(r.Estado) == null ? null : Math.min(3, num(r.Estado)), com: r.Comentario || '', t: r.Actualizado || '' }));
  M.media = (d.Media || []).map(r => ({ season: String(r.Temporada || ''), gid: r.PartidoID || '', p: r.Jugador || '', tipo: String(r.Tipo || '').toLowerCase(), url: r.URL || '', desc: r['Descripción'] || '', dest: yes(r.Destacado) })).filter(m => m.url);
  M.clas = d.Clasificacion || [];
  M.actual = (M.seasons.find(s => s.actual) || M.seasons[0] || { id: '' }).id;
  M.playedSeasons = M.seasons.map(s => s.id).filter(id => M.games.some(g => g.season === id && g.played));
  // temporada por defecto: la actual en cuanto tenga un partido jugado; si no, la última con partidos
  M.defSeason = M.playedSeasons.includes(M.actual) ? M.actual : (M.playedSeasons[0] || M.actual);
  S.M = M;
  if (!S.season || !M.seasons.some(s => s.id === S.season)) S.season = M.defSeason;
  roleCache = {};
}
function finishLine(o) {
  if (o.REB == null && o.REBO != null && o.REBD != null) o.REB = o.REBO + o.REBD;
  const z = k => o[k] || 0;
  o.PM = o.PLUS != null || o.MINUS != null ? z('PLUS') - z('MINUS') : null;
  o.EFF = z('PTS') + z('REB') + z('AST') + z('STL') + z('BLK') - (z('FGA') - z('FGM')) - (z('FTA') - z('FTM')) - z('TOV');
  o.VAL = z('PTS') + 1.2 * z('REB') + 1.5 * z('AST') + 2 * (z('STL') + z('BLK')) - 1.5 * z('TOV');
  return o;
}

/* ---------------- cálculos ---------------- */
const SK = ['MIN', 'PTS', 'FGM', 'FGA', '3PM', '3PA', 'FTM', 'FTA', 'REB', 'REBO', 'REBD', 'AST', 'STL', 'BLK', 'TOV', 'PM', 'EFF', 'VAL'];
/** líneas de una temporada (fase: 'Liga' | 'Playoffs' | null = todas) */
function linesOf(season, opt) {
  opt = opt || {};
  return S.M.lines.filter(l => (!season || l.season === season) && (!opt.fase || l.fase === opt.fase) && (!opt.p || l.p === opt.p));
}
/** agrega líneas: totales, medias, por 36 y porcentajes */
function agg(lines) {
  const a = { gp: lines.length, tot: {}, avg: {}, p36: {}, n: {} };
  SK.forEach(k => { const v = lines.filter(l => l[k] != null); a.n[k] = v.length; a.tot[k] = v.length ? sum(v, l => l[k]) : null; });
  SK.forEach(k => { a.avg[k] = a.n[k] ? a.tot[k] / a.n[k] : null; });
  const minRO = sum(lines.filter(l => l.REBO != null), l => l.MIN || 0);
  SK.forEach(k => { const mins = (k === 'REBO' || k === 'REBD') ? minRO : a.tot.MIN; a.p36[k] = k === 'MIN' ? 36 : (mins > 0 && a.tot[k] != null ? a.tot[k] * 36 / mins : null); });
  const t = a.tot, d = (x, y) => (y ? x / y : null);
  a.FGp = d(t.FGM, t.FGA); a.TPp = d(t['3PM'], t['3PA']); a.FTp = d(t.FTM, t.FTA);
  a.eFG = d(t.FGM + 0.5 * t['3PM'], t.FGA); a.TS = d(t.PTS, 2 * (t.FGA + 0.44 * t.FTA));
  a.ATO = t.TOV ? t.AST / t.TOV : null; a.r3 = d(t['3PA'], t.FGA); a.ftr = d(t.FTA, t.FGA);
  a.mpg = a.avg.MIN;
  return a;
}
/** estadísticas por jugador de una temporada */
function seasonPlayers(season, fase) {
  const by = {};
  linesOf(season, { fase }).forEach(l => (by[l.p] = by[l.p] || []).push(l));
  const out = {};
  Object.keys(by).forEach(p => { out[p] = agg(by[p]); out[p].lines = by[p]; });
  return out;
}
const MINPJ = 5;
function gamesOf(season, fase) { return S.M.games.filter(g => g.season === season && (!fase || g.fase === fase)); }
function teamRecord(season) {
  const L = gamesOf(season, 'Liga').filter(g => g.played), P = gamesOf(season, 'Playoffs').filter(g => g.played);
  const all = L.concat(P);
  return { V: L.filter(g => g.res === 'V').length, D: L.filter(g => g.res === 'D').length, poV: P.filter(g => g.res === 'V').length, poD: P.filter(g => g.res === 'D').length,
    pf: L.length ? sum(L, g => g.pf) / L.length : null, pc: L.length ? sum(L, g => g.pc) / L.length : null, n: L.length, all };
}
function bestStreak(games) {
  let best = 0, cur = 0, from = null, bf = null, bt = null;
  games.filter(g => g.played).forEach(g => { if (g.res === 'V') { if (!cur) from = g; cur++; if (cur > best) { best = cur; bf = from; bt = g; } } else cur = 0; });
  return { n: best, from: bf, to: bt };
}
/** jugador -> rol automático (roles.js) por temporada, con caché */
let roleCache = {};
function rolesSeason(season) {
  if (roleCache[season]) return roleCache[season];
  const sp = seasonPlayers(season, 'Liga');
  const js = Object.keys(sp).map(p => ({ nombre: p, posiciones: (S.M.players[p] || {}).pos || [], pj: sp[p].gp, tot: Object.assign({}, sp[p].tot) }));
  return (roleCache[season] = window.Roles ? Roles.calcular(js, { minPJ: MINPJ }) : {});
}
function roleOf(p) {
  const pl = S.M.players[p];
  if (pl && pl.arq) return { titulo: pl.arq, porque: '', rasgos: [], manual: true };
  const list = S.M.seasons.map(s => s.id).filter(id => id <= S.M.actual).map(id => ({ temporada: id, roles: rolesSeason(id) }));
  return window.Roles ? Roles.rolVisible(p, list) : null;
}
/** evolución del rol tras las jornadas 5, 10, 15… de una temporada */
function roleEvolution(p, season) {
  const lg = gamesOf(season, 'Liga').filter(g => g.played);
  const out = [];
  for (let k = 5; k <= lg.length; k += 5) {
    const ids = new Set(lg.slice(0, k).map(g => g.id));
    const by = {};
    S.M.lines.filter(l => ids.has(l.gid)).forEach(l => (by[l.p] = by[l.p] || []).push(l));
    const js = Object.keys(by).map(x => ({ nombre: x, posiciones: (S.M.players[x] || {}).pos || [], pj: by[x].length, tot: agg(by[x]).tot }));
    const r = Roles.calcular(js, { minPJ: Math.max(3, Math.round(k * 0.25)) })[p];
    if (r) out.push({ j: k, t: r.titulo });
  }
  return out;
}
/** última temporada (hasta la elegida) en la que el jugador tiene partidos de liga */
function refSeason(p, upTo) {
  const ids = S.M.seasons.map(s => s.id).filter(id => !upTo || id <= upTo);
  return ids.find(id => linesOf(id, { fase: 'Liga', p }).length) || null;
}

/* ---------------- clips de jugadas ---------------- */
const KW_LABEL = { 'and-1': 'and 1', 'media-distancia': 'media distancia', 'tapon': 'tapón', 'sin-clave': '' };
let CLIPS = null;
function repoInfo() {
  if (CFG.repo) { const [o, r] = CFG.repo.split('/'); return { o, r }; }
  const h = location.hostname; if (!/\.github\.io$/.test(h)) return null;
  const o = h.split('.')[0]; const seg = location.pathname.split('/').filter(Boolean)[0];
  return { o, r: seg && !/\.html$/.test(seg) ? seg : h };
}
function parseClip(name, path) {
  const m = /^(\d{4})-([A-Z]+\d+)__([^_].*?)__(.+?)__(.+?)__(\d+)\.(mp4|webm|mov)$/i.exec(name);
  if (!m) return null;
  const season = m[1].slice(0, 2) + '/' + m[1].slice(2);
  const jor = m[2].toUpperCase().replace(/^J0*/, 'J').replace(/^PO0*/, 'PO');
  const whoPlain = m[3] === 'Equipo' ? [] : m[3].split('_');
  const who = whoPlain.map(w => Object.keys(S.M.players).find(p => plain(p).replace(/[^A-Za-z0-9]+/g, '-') === w) || w.replace(/-/g, ' '));
  const kw = m[4].split('_').map(k => KW_LABEL[k] != null ? KW_LABEL[k] : k.replace(/-/g, ' ')).filter(Boolean);
  const desc = m[5].replace(/-/g, ' ');
  const g = S.M.games.find(x => x.season === season && x.label === jor) || null;
  return { name, url: path, season, jor, who, kw, desc: desc.charAt(0).toUpperCase() + desc.slice(1), n: +m[6], g };
}
async function loadClips() {
  if (CLIPS) return CLIPS;
  let names = [];
  try {
    const ri = repoInfo();
    if (ri) {
      const r = await fetch(`https://api.github.com/repos/${ri.o}/${ri.r}/contents/jugadas`);
      if (r.ok) names = (await r.json()).filter(f => f.type === 'file').map(f => f.name);
    }
    if (!names.length) { const r = await fetch('jugadas/lista.txt', { cache: 'no-store' }); if (r.ok) names = (await r.text()).split(/\r?\n/).map(s => s.trim()).filter(Boolean); }
  } catch (e) { console.warn('Sin lista de jugadas', e); }
  CLIPS = names.map(n => parseClip(n, 'jugadas/' + encodeURIComponent(n))).filter(Boolean)
    .sort((a, b) => (b.g ? b.g.date : '').localeCompare(a.g ? a.g.date : '') || a.n - b.n);
  return CLIPS;
}
function clipCard(c, opt) {
  opt = opt || {};
  const who = c.who.length ? c.who.join(' · ') : 'Equipo';
  const match = c.g ? `${c.g.label} · vs ${esc(c.g.rival)}` : `${c.season} · ${c.jor}`;
  return `<div class="card sm" style="padding:0;overflow:hidden;display:flex;flex-direction:column">
    <div class="vid"><video src="${c.url}" controls preload="metadata" playsinline></video></div>
    <div style="padding:14px 16px;display:flex;flex-direction:column;gap:6px">
      ${opt.noWho ? '' : `<div class="small acc" style="font-weight:600">${esc(who)}</div>`}
      <div style="font-weight:600;font-size:16px">${esc(c.desc)}</div>
      <div class="small mut">${match}</div>
      <div class="chips" style="gap:6px">${c.kw.map(k => `<span class="badge">${esc(k)}</span>`).join('')}</div>
    </div></div>`;
}

/* ---------------- cabecera, pie y rutas ---------------- */
const NAV_FULL = [['', 'Inicio'], ['asistencia', 'Asistencia'], ['calendario', 'Calendario'], ['plantilla', 'Plantilla'], ['estadisticas', 'Estadísticas'], ['graficas', 'Gráficas'], ['quintetos', 'Quintetos'],
  ['records', 'Récords'], ['jugadas', 'Jugadas'], ['historico', 'Histórico']];
const NAV_BASIC = [['', 'Inicio'], ['asistencia', 'Asistencia'], ['calendario', 'Calendario'], ['plantilla', 'Jugadores'], ['estadisticas', 'Stats'], ['jugadas', 'Jugadas']];
const SECTION_OF = { partido: 'calendario', jugador: 'plantilla', herramientas: '' };

function route() {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const [path, qs] = h.split('?');
  const parts = path.split('/').filter(Boolean);
  const q = {}; (qs || '').split('&').filter(Boolean).forEach(kv => { const [k, v] = kv.split('='); q[k] = v; });
  return { page: parts[0] || '', arg: parts.slice(1).join('/'), q };
}
const go = h => { location.hash = '#/' + h; };
function setMode(m) { S.mode = m; ls.set('icaros:modo', m); render(); scrollTo(0, 0); }
function setSeason(s) { S.season = s; render(); }

function modeSwitch() {
  return `<div class="mode" role="group" aria-label="Versión de la web"><button type="button" class="${S.mode === 'basic' ? 'on' : ''}" onclick="setMode('basic')">Básico</button><button type="button" class="${S.mode === 'full' ? 'on' : ''}" onclick="setMode('full')">Completo</button></div>`;
}
function header(R) {
  const sec = SECTION_OF[R.page] != null ? SECTION_OF[R.page] : R.page;
  if (S.mode === 'basic') {
    return `<header class="bhdr"><div class="bhdr-in"><a class="logo" href="#/"><div class="logo-ib">IB</div><div class="logo-tx">ICARO</div></a>${modeSwitch()}</div>
      <nav class="bnav">${NAV_BASIC.map(([k, l]) => `<a href="#/${k}" class="${sec === k ? 'on' : ''}">${l}</a>`).join('')}</nav></header>`;
  }
  const seasons = S.M.seasons.filter(s => S.M.playedSeasons.includes(s.id) || s.id === S.M.actual);
  return `<header class="hdr"><div class="hdr-in">
    <a class="logo" href="#/"><div class="logo-ib">IB</div><div class="logo-tx">ICARO BARBAROUSES</div></a>
    <nav class="nav">${NAV_FULL.map(([k, l]) => `<a href="#/${k}" class="${sec === k ? 'on' : ''}">${l}</a>`).join('')}</nav>
    <div class="hdr-r"><label class="seasel" title="Temporada"><span class="sr" style="position:absolute;left:-9999px">Temporada</span><select onchange="setSeason(this.value)">${seasons.map(s => `<option value="${s.id}" ${s.id === S.season ? 'selected' : ''}>${s.id}</option>`).join('')}</select></label>${modeSwitch()}</div>
  </div></header>`;
}
function footer() {
  return `<footer class="foot"><div>Icaro Barbarouses${S.M && S.M.seasons[0] && S.M.seasons[0].comp ? ' · ' + esc(S.M.seasons[0].comp) : ''}</div><a href="#/herramientas">${LOCK}Herramientas</a></footer>`;
}
function banners() {
  let b = '';
  if (S.ejemplo) b += `<div class="banner">Datos de ejemplo: la web todavía no está conectada al Google Sheet. Se ven los datos cargados hasta el 13 de octubre de 2026.</div>`;
  if (S.error) b += `<div class="banner">${esc(S.error)}</div>`;
  return b;
}
function renderLoading() { document.getElementById('app').innerHTML = `<div class="loading">Cargando datos del equipo…</div>`; }

const PAGES = {}, BPAGES = {};
function render() {
  if (!S.M) { if (S.error) document.getElementById('app').innerHTML = `<div class="loading">${esc(S.error)}</div>`; return; }
  const R = route();
  document.body.classList.toggle('basic', S.mode === 'basic');
  const fn = (S.mode === 'basic' && BPAGES[R.page]) || PAGES[R.page] || PAGES[''];
  let html = '';
  try { html = fn(R); } catch (e) { console.error(e); html = `<div class="loading">Algo ha fallado al mostrar esta página. Recarga o vuelve al inicio.</div>`; }
  document.getElementById('app').innerHTML = header(R) + banners() + `<main>${html}</main>` + footer();
  const titles = { '': 'Inicio', calendario: 'Calendario', partido: 'Partido', plantilla: 'Plantilla', jugador: R.arg, estadisticas: 'Estadísticas', graficas: 'Gráficas', quintetos: 'Quintetos', records: 'Récords', jugadas: 'Jugadas', asistencia: 'Asistencia', historico: 'Histórico', herramientas: 'Herramientas' };
  document.title = 'Icaro Barbarouses · ' + (titles[R.page] || 'Inicio');
  if (typeof afterRender === 'function') afterRender(R);
  (window.AFTER || []).splice(0).forEach(f => { try { f(); } catch (e) { console.error(e); } });
}
window.AFTER = [];
const after = f => window.AFTER.push(f);
let lastPage = null;
window.addEventListener('hashchange', () => { const p = route().page; render(); if (p !== lastPage) scrollTo(0, 0); lastPage = p; });
/* estado de cada página (filtros, orden…) que no va en la URL */
const UI = {};
const ui = (k, d) => (UI[k] === undefined ? (UI[k] = d) : UI[k]);
function setUI(k, v) { UI[k] = v; const y = scrollY; render(); scrollTo(0, y); }

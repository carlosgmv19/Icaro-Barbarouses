/* Icaro Barbarouses · páginas del modo completo (1/2) */
'use strict';
const plink = (p, inner) => `<a href="#/jugador/${encodeURIComponent(p)}" style="color:inherit">${inner == null ? esc(p) : inner}</a>`;
const glink = (g, inner) => `<a href="#/partido/${encodeURIComponent(g.id)}" style="color:inherit">${inner}</a>`;
const on = (k, v) => `onclick="setUI(${esc(JSON.stringify(k))},${esc(JSON.stringify(v))})"`;
const pills = (k, list, cur) => `<div class="pills">${list.map(([v, l]) => `<button type="button" class="${cur === v ? 'on' : ''}" ${on(k, v)}>${l}</button>`).join('')}</div>`;
const resChip = g => `<span class="res ${g && g.res ? g.res : 'N'}">${g && g.res ? g.res : '–'}</span>`;
const sc = g => g && g.played ? g.pf + '–' + g.pc : '—';
const minPJ = season => { const n = gamesOf(season, 'Liga').filter(g => g.played).length; return Math.max(1, Math.min(MINPJ, Math.ceil(n * 0.25))); };
function photo(p, h, numSize) {
  const pl = S.M.players[p] || {};
  return `<div class="ph" style="height:${h}px">${pl.dorsal ? `<div class="num" style="font-size:${numSize}px">#${esc(pl.dorsal)}</div>` : ''}${SIL(Math.round(h * 0.65), Math.round(h * 0.85))}${pl.foto ? `<img class="foto" src="${esc(pl.foto)}" alt="${esc(p)}" loading="lazy" onerror="this.remove()">` : ''}</div>`;
}
function topScorer(g) {
  const ls = (S.M.linesByGame[g.id] || []).slice().sort((a, b) => (b.PTS || 0) - (a.PTS || 0));
  return ls[0] && ls[0].PTS != null ? ls[0] : null;
}
function nextGame() {
  const today = HOY.toISOString().slice(0, 10);
  return S.M.games.find(g => g.season === S.M.actual && !g.played && g.estado !== 'Descanso' && g.estado !== 'No disputado' && g.date >= today) || null;
}
// 0 No puedo ir · 1 No creo que pueda · 2 Seguramente vaya · 3 Voy seguro
const ESTADOS = ['No puedo ir', 'No creo que pueda', 'Seguramente vaya', 'Voy seguro'];
const EST_GROUPS = [
  { k: 3, t: 'Van seguro', chip: 'background:var(--acc);color:var(--ink);border:1px solid var(--acc)', dot: 'var(--acc)' },
  { k: 2, t: 'Seguramente van', chip: 'background:var(--accbg);color:var(--acc2);border:1px solid #5C4410', dot: '#8A6A1E' },
  { k: 1, t: 'No creen que puedan', chip: 'background:var(--card2);color:var(--tx2);border:1px solid var(--line2)', dot: '#5B6475' },
  { k: 0, t: 'No pueden ir', chip: 'background:#2A1715;color:#F08A7E;border:1px solid #5A2A25', dot: '#B5524A' },
  { k: null, t: 'Sin responder', chip: 'background:transparent;color:var(--mut);border:1px dashed var(--line2)', dot: 'transparent;border:1px dashed var(--lose)' }];
function convBoard(g, basic) {
  const by = convOf(g);
  const roster = Object.values(S.M.players).filter(p => p.activo).map(p => p.name).sort();
  const groups = EST_GROUPS.map(G => ({ G, list: G.k == null ? roster.filter(p => !by[p]).map(p => ({ p })) : Object.values(by).filter(c => c.estado === G.k).sort((a, b) => a.p.localeCompare(b.p)) }));
  const total = Math.max(1, sum(groups, x => x.list.length));
  const bar = `<div style="display:flex;height:12px;border-radius:999px;overflow:hidden;background:var(--card2)">${groups.filter(x => x.list.length).map(x => `<i title="${x.G.t}: ${x.list.length}" style="width:${x.list.length / total * 100}%;background:${x.G.dot.split(';')[0]};${x.G.k == null ? 'background:repeating-linear-gradient(45deg,#2A2F3A 0 4px,transparent 4px 8px)' : ''}"></i>`).join('')}</div>`;
  const nums = `<div class="row" style="gap:${basic ? 14 : 22}px;flex-wrap:wrap">${groups.map(x => `<div><div class="cond" style="font-weight:800;font-size:${basic ? 26 : 34}px;line-height:1;color:${x.G.k === 3 ? 'var(--acc)' : x.G.k === 0 ? '#F08A7E' : x.G.k == null ? 'var(--mut)' : 'var(--tx)'}">${x.list.length}</div><div class="small mut">${x.G.t}</div></div>`).join('')}</div>`;
  const rows = groups.map(x => `<div style="border-top:1px solid var(--line);padding-top:12px"><div class="row small" style="gap:8px;margin-bottom:8px"><i style="width:10px;height:10px;border-radius:3px;background:${x.G.dot}"></i><strong>${x.G.t}</strong><span class="mut">· ${x.list.length}</span></div>
    <div class="chips" style="gap:6px">${x.list.length ? x.list.map(c => `<span title="${c.com ? esc(c.com) : ''}" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;font-weight:600;font-size:14px;${x.G.chip}">${esc(c.p)}${c.com ? ' <span style="font-weight:400;opacity:.8">· ' + esc(c.com) + '</span>' : ''}</span>`).join('') : '<span class="small dim">Nadie</span>'}</div></div>`).join('');
  return `<div class="${basic ? 'bcard' : 'card'} stack" style="gap:14px"><strong style="font-size:18px">Así va la convocatoria</strong>${nums}${bar}${rows}</div>`;
}
function convOf(g) {
  const by = {}; S.M.conv.filter(c => c.gid === g.id).forEach(c => { if (!by[c.p] || c.t > by[c.p].t) by[c.p] = c; });
  return by;
}
function qualAvg(season) { const sp = seasonPlayers(season, 'Liga'); const m = minPJ(season); return { sp, q: Object.keys(sp).filter(p => sp[p].gp >= m), m }; }
function rankIn(sp, qual, p, f) { const v = f(sp[p]); return 1 + qual.filter(o => o !== p && (f(sp[o]) || -1e9) > (v || -1e9)).length; }

/* ============ INICIO ============ */
PAGES[''] = () => {
  const s = S.season, rec = teamRecord(s), lg = gamesOf(s).filter(g => g.played);
  const last = lg[lg.length - 1], nx = nextGame();
  const str = bestStreak(gamesOf(s, 'Liga'));
  const form = lg.slice(-10);
  const { sp, q } = qualAvg(s);
  const LEAD = [['PTS', 'Puntos'], ['REB', 'Rebotes'], ['AST', 'Asistencias'], ['STL', 'Robos'], ['BLK', 'Tapones'], ['VAL', 'Valoración']];
  const leaders = LEAD.map(([k, l]) => { const p = q.slice().sort((a, b) => (sp[b].avg[k] || 0) - (sp[a].avg[k] || 0))[0]; return p ? { l, p, v: sp[p].avg[k] } : null; }).filter(Boolean);
  // puntos por cuarto
  const gq = gamesOf(s, 'Liga').filter(g => g.played && g.q.every(x => x.f != null));
  const qa = [0, 1, 2, 3].map(i => ({ f: gq.length ? sum(gq, g => g.q[i].f) / gq.length : null, c: gq.length ? sum(gq, g => g.q[i].c) / gq.length : null }));
  const maxQ = Math.max(1, ...qa.map(x => Math.max(x.f || 0, x.c || 0)));
  const worst = qa.map((x, i) => ({ i, d: (x.f || 0) - (x.c || 0) })).sort((a, b) => a.d - b.d);
  const qNote = gq.length ? (worst[0].d < 0 ? `El ${worst[0].i + 1}º cuarto es el que peor se nos da: ${sg(worst[0].d)} de media.` + (worst[1].d < 0 ? ` Luego el ${worst[1].i + 1}º (${sg(worst[1].d)}).` : '') : 'Ganamos todos los cuartos de media.') : '';
  const ts = last ? topScorer(last) : null;
  const conv = nx ? convOf(nx) : {};
  const vals = Object.values(conv);
  const media = S.M.media.filter(m => !m.p && (!m.season || m.season === s)).sort((a, b) => b.dest - a.dest).slice(0, 4);
  return `
  <section class="sec top grid" style="grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:28px" id="home-hero">
    <div class="card hl" style="padding:36px;display:flex;flex-direction:column;gap:26px">
      <div class="lbl" style="color:var(--acc2)">Temporada ${esc(s)} · Liga regular</div>
      <h1 style="font-size:clamp(36px,8vw,88px);line-height:.9">ICARO<br>BARBAROUSES</h1>
      <div class="grid g3" style="gap:16px">
        <div><div class="lbl">Balance liga</div><div class="big">${rec.V}<span class="mut"> – </span>${rec.D}</div>${rec.poV + rec.poD ? `<div class="small mut">Playoffs ${rec.poV}–${rec.poD}</div>` : ''}</div>
        <div><div class="lbl">Puntos / partido</div><div class="big">${nf(rec.pf)}</div><div class="small mut">Encajados ${nf(rec.pc)}</div></div>
        <div><div class="lbl">Mejor racha</div><div class="big">${str.n} V</div><div class="small mut">${str.n ? fd(str.from.date) + (str.n > 1 ? ' – ' + fd(str.to.date) : '') : 'Aún sin victorias'}</div></div>
      </div>
      ${form.length ? `<div class="stack" style="gap:8px"><div class="lbl">Forma · últimos ${form.length}</div><div class="row" style="gap:6px;flex-wrap:wrap">${form.map(g => glink(g, resChip(g))).join('')}</div></div>` : ''}
    </div>
    <div class="stack" style="gap:20px">
      ${last ? `<a class="card" href="#/partido/${encodeURIComponent(last.id)}" style="color:var(--tx);display:flex;flex-direction:column;gap:12px">
        <div class="between"><div class="lbl">Último partido · ${last.po ? 'Playoffs' : 'Liga'}</div><div class="small mut">${fd(last.date)}${last.hora ? ' · ' + esc(last.hora) : ''}</div></div>
        <div class="row" style="justify-content:space-between"><div class="cond" style="font-weight:700;font-size:26px">Icaro</div><div class="big ${last.res === 'V' ? 'acc' : ''}">${last.pf}</div></div>
        <div class="row" style="justify-content:space-between"><div class="cond tx2" style="font-weight:700;font-size:26px">${esc(last.rival)}</div><div class="big tx2">${last.pc}</div></div>
        ${ts ? `<div class="small mut">Máximo anotador: <strong class="tx2">${esc(ts.p)} · ${nf(ts.PTS)} pts</strong></div>` : ''}
        <div class="small acc" style="font-weight:600">Ver partido →</div></a>` : ''}
      ${nx ? `<div class="card hl" style="display:flex;flex-direction:column;gap:10px">
        <div class="lbl" style="color:var(--acc2)">Próximo partido · ${esc(nx.label.replace('J', 'Jornada '))} · ${esc(nx.season)}</div>
        <div class="cond" style="font-weight:800;font-size:34px">vs ${esc(nx.rival)}</div>
        <div class="tx2">${fdw(nx.date)}${nx.hora ? ' · ' + esc(nx.hora) : ''}${nx.pista ? ' · ' + esc(nx.pista) : ''}${nx.local === true ? ' · en casa' : nx.local === false ? ' · fuera' : ''}</div>
        <div class="row small" style="gap:16px"><span><strong class="acc">${vals.filter(c => c.estado === 3).length}</strong> van seguro</span><span><strong>${vals.filter(c => c.estado === 2).length}</strong> seguramente</span><span><strong style="color:#F08A7E">${vals.filter(c => c.estado <= 1).length}</strong> no</span><a href="#/asistencia" style="margin-left:auto;font-weight:600">¿Vienes? →</a></div></div>` : ''}
    </div>
  </section>
  <section class="sec">
    <div class="between" style="margin-bottom:18px"><h2>Líderes del equipo</h2><a href="#/estadisticas" style="font-weight:600">Todas las estadísticas →</a></div>
    ${leaders.length ? `<div class="grid g6" style="gap:12px">${leaders.map(l => `<a class="card sm" href="#/jugador/${encodeURIComponent(l.p)}" style="color:var(--tx)"><div class="lbl">${l.l}</div><div class="big acc">${nf(l.v)}</div><div class="tx2" style="font-weight:600">${esc(l.p)}</div></a>`).join('')}</div><div class="note" style="margin-top:10px">Media por partido de liga · mínimo ${minPJ(s)} partidos.</div>` : `<div class="empty">Aún no hay partidos jugados esta temporada.</div>`}
  </section>
  ${gq.length ? `<section class="sec grid g2" style="gap:24px">
    <div class="card stack" style="gap:16px"><div class="between"><h3>Puntos por cuarto</h3><div class="row small mut" style="gap:14px"><span class="row" style="gap:6px"><i style="width:12px;height:12px;border-radius:3px;background:var(--acc)"></i>Icaro</span><span class="row" style="gap:6px"><i style="width:12px;height:12px;border-radius:3px;background:var(--lose)"></i>Rival</span></div></div>
      <div class="grid" style="grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;align-items:end">${qa.map((x, i) => `<div class="stack" style="gap:6px;align-items:center">
        <div class="row" style="gap:6px;align-items:flex-end;height:150px"><div style="width:26px;border-radius:5px 5px 0 0;background:var(--acc);height:${Math.round((x.f || 0) / maxQ * 140)}px" title="${nf(x.f)}"></div><div style="width:26px;border-radius:5px 5px 0 0;background:var(--lose);height:${Math.round((x.c || 0) / maxQ * 140)}px" title="${nf(x.c)}"></div></div>
        <div class="small"><strong>${nf(x.f)}</strong> <span class="mut">– ${nf(x.c)}</span></div><div class="small mut">${i + 1}º · <span class="${(x.f - x.c) >= 0 ? 'acc' : ''}">${sg(x.f - x.c)}</span></div></div>`).join('')}</div>
      <div class="note">${qNote}</div></div>
    <div class="card stack" style="gap:6px"><div class="between" style="margin-bottom:8px"><h3>Últimos resultados</h3><a href="#/calendario" style="font-weight:600">Calendario →</a></div>
      ${lg.slice(-6).reverse().map(g => `<a href="#/partido/${encodeURIComponent(g.id)}" class="row" style="color:var(--tx);padding:10px 0;border-top:1px solid var(--line)"><span class="small mut" style="width:56px">${fd(g.date)}</span><span style="flex:1;font-weight:600">${esc(g.rival)}<span class="small mut"> · ${g.po ? 'Playoffs' : g.label}</span></span><span style="font-weight:700">${sc(g)}</span>${resChip(g)}</a>`).join('')}
    </div></section>` : ''}
  ${media.length ? `<section class="sec"><h2 style="margin-bottom:18px">Fotos y vídeos</h2><div class="grid g4">${media.map(mediaCard).join('')}</div></section>` : ''}`;
};
function mediaCard(m) {
  const yt = /(?:youtu\.be\/|v=)([\w-]{6,})/.exec(m.url);
  const drive = /drive\.google\.com\/file\/d\/([\w-]+)/.exec(m.url);
  const img = m.tipo.startsWith('foto') || /\.(jpe?g|png|webp|gif)$/i.test(m.url);
  let inner;
  if (yt) inner = `<img src="https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg" alt="" style="width:100%;height:100%;object-fit:cover">`;
  else if (drive && img) inner = `<img src="https://drive.google.com/thumbnail?id=${drive[1]}&sz=w800" alt="" style="width:100%;height:100%;object-fit:cover">`;
  else if (img) inner = `<img src="${esc(m.url)}" alt="" style="width:100%;height:100%;object-fit:cover">`;
  else inner = `<div class="mut">▶ Vídeo</div>`;
  return `<a href="${esc(m.url)}" target="_blank" rel="noopener" class="card sm" style="padding:0;overflow:hidden;color:var(--tx)"><div class="vid">${inner}</div><div style="padding:12px 14px" class="small tx2">${esc(m.desc || (yt || !img ? 'Vídeo' : 'Foto'))}</div></a>`;
}

/* ============ CALENDARIO ============ */
PAGES.calendario = () => {
  const seasons = uniq([S.M.actual].concat(S.M.playedSeasons));
  const s = ui('cal.s', S.M.actual);
  const isNew = !S.M.games.some(g => g.season === s && g.played);
  const f = ui('cal.f', 'all');
  const list = gamesOf(s).filter(g => {
    if (f === 'all') return true;
    if (f === 'loc') return g.local === true; if (f === 'vis') return g.local === false;
    if (f === 'liga') return !g.po; if (f === 'po') return g.po; if (f === 'v') return g.res === 'V'; if (f === 'd') return g.res === 'D';
    return true;
  });
  const months = [];
  list.forEach(g => { const ym = g.date.slice(0, 7); let m = months.find(x => x.ym === ym); if (!m) months.push(m = { ym, games: [] }); m.games.push(g); });
  const lastVs = rival => { const g = S.M.games.filter(x => x.played && x.rival === rival && x.season !== s).pop(); return g ? `${g.pf}–${g.pc} (${MESES[pd(g.date).getMonth()]} ${pd(g.date).getFullYear()})` : null; };
  const nx = nextGame();
  const card = g => {
    const desc = g.estado === 'Descanso';
    const ts = g.played ? topScorer(g) : null;
    const nP = (S.M.linesByGame[g.id] || []).length;
    const cls = g.res === 'V' || (nx && g.id === nx.id) ? 'card hl' : 'card';
    const inner = `<div class="between"><span class="small mut">${fdw(g.date)}${g.hora && !desc ? ' · ' + esc(g.hora) : ''}</span><span class="tag ${g.po ? 'po' : ''}">${g.po ? 'PLAYOFFS' : 'LIGA'}${g.j ? ' · ' + g.label : ''}</span></div>
      <div class="row" style="justify-content:space-between;gap:10px"><div class="cond" style="font-weight:700;font-size:24px;line-height:1.1">${desc ? 'Jornada de descanso' : esc(g.rival)}</div>${g.played ? resChip(g) : ''}</div>
      <div class="row" style="justify-content:space-between"><span style="font-weight:700;font-size:18px">${g.played ? sc(g) : desc ? '—' : g.estado === 'No disputado' ? 'No disputado' : g.local === true ? 'Local' : g.local === false ? 'Visitante' : 'Programado'}</span><span class="small mut">${g.played ? (nP ? nP + ' jugadores' : '') : esc(g.pista || '')}</span></div>
      <div class="small mut">${g.played ? (ts ? `Máx. anotador: ${esc(ts.p)} · ${nf(ts.PTS)} pts` : 'Sin estadísticas') : desc ? 'No jugamos esta jornada' : (lastVs(g.rival) ? 'Último cruce: ' + lastVs(g.rival) : 'Rival nuevo')}</div>`;
    return g.played ? `<a href="#/partido/${encodeURIComponent(g.id)}" class="${cls}" style="padding:20px;display:flex;flex-direction:column;gap:10px;color:var(--tx)">${inner}</a>`
      : `<div class="${cls}" style="padding:20px;display:flex;flex-direction:column;gap:10px;${desc ? 'background:var(--bg2);border-style:dashed' : ''}">${inner}</div>`;
  };
  const nL = gamesOf(s, 'Liga').filter(g => g.estado !== 'Descanso').length, nPO = gamesOf(s, 'Playoffs').length, nD = gamesOf(s).filter(g => g.estado === 'Descanso').length;
  const sub = isNew ? `${nL} partidos de liga${nD ? ' y ' + nD + ' jornadas de descanso' : ''}${nx ? ' · el próximo, ' + fdw(nx.date) : ''}` : `${nL + nPO} partidos · ${nL} de liga${nPO ? ' y ' + nPO + ' de playoffs' : ''}`;
  const fl = isNew ? [['all', 'Todos'], ['loc', 'Local'], ['vis', 'Visitante']] : [['all', 'Todos'], ['liga', 'Liga'], ['po', 'Playoffs'], ['v', 'Victorias'], ['d', 'Derrotas']];
  return `<div class="pagehead"><div><h1>Calendario y resultados</h1><div class="sub">${sub}</div></div>
    <div class="pills">${seasons.map(x => `<button type="button" class="${x === s ? 'on' : ''}" onclick="UI['cal.f']='all';setUI('cal.s','${x}')">${x}</button>`).join('')}</div></div>
    <section class="sec"><div class="chips" style="margin-bottom:24px">${fl.map(([k, l]) => `<button type="button" class="chip ${f === k ? 'on' : ''}" ${on('cal.f', k)}>${l}</button>`).join('')}</div>
    ${months.length ? months.map(m => { const v = m.games.filter(g => g.res === 'V').length, d = m.games.filter(g => g.res === 'D').length; const d0 = pd(m.ym + '-01');
      return `<div style="margin-bottom:32px"><div class="between" style="margin-bottom:14px"><h3 style="text-transform:capitalize">${MESES_L[d0.getMonth()]} ${d0.getFullYear()}</h3><span class="mut">${isNew ? m.games.filter(g => g.estado !== 'Descanso').length + ' partidos' : v + 'V · ' + d + 'D'}</span></div>
      <div class="grid g4">${m.games.map(card).join('')}</div></div>`; }).join('') : '<div class="empty">Ningún partido con ese filtro.</div>'}</section>`;
};

/* ============ PARTIDO ============ */
const BOXCOLS = [['MIN', 'Min'], ['PTS', 'Pts'], ['REB', 'Reb'], ['AST', 'Ast'], ['STL', 'Rob'], ['BLK', 'Tap'], ['TOV', 'Pér'], ['FG', 'TC'], ['3P', 'T3'], ['FT', 'TL'], ['PM', '+/−'], ['EFF', 'Eff'], ['VAL', 'Val']];
function boxCell(l, k) {
  if (k === 'FG') return (l.FGM ?? '—') + '/' + (l.FGA ?? '—');
  if (k === '3P') return (l['3PM'] ?? '—') + '/' + (l['3PA'] ?? '—');
  if (k === 'FT') return (l.FTM ?? '—') + '/' + (l.FTA ?? '—');
  if (k === 'PM') return sg(l.PM);
  return nf(l[k]);
}
PAGES.partido = R => {
  const g = S.M.gameById[R.arg];
  if (!g) return `<div class="loading">No encuentro ese partido. <a href="#/calendario">Volver al calendario</a></div>`;
  const ss = gamesOf(g.season).filter(x => x.played), i = ss.indexOf(g), prev = ss[i - 1], next = ss[i + 1];
  const lines = (S.M.linesByGame[g.id] || []).slice().sort((a, b) => (b.MIN || 0) - (a.MIN || 0));
  const hasQ = lines.some(l => l.byq);
  const tab = ui('box.t', 'T'); const rx = ui('rx', false);
  const L = tab === 'T' ? lines : lines.map(l => Object.assign({ p: l.p }, (l.byq || {})[tab] || {})).filter(l => l.MIN != null || l.PTS != null);
  const tot = {}; ['MIN', 'PTS', 'REB', 'REBO', 'REBD', 'AST', 'STL', 'BLK', 'TOV', 'FGM', 'FGA', '3PM', '3PA', 'FTM', 'FTA', 'EFF', 'VAL'].forEach(k => tot[k] = L.some(l => l[k] != null) ? sum(L, l => l[k] || 0) : null); tot.PM = null;
  const cols = BOXCOLS.slice(); if (rx) cols.splice(3, 0, ['REBD', 'Def'], ['REBO', 'Of']);
  const best = {}; cols.forEach(([k]) => { if (!['FG', '3P', 'FT', 'MIN', 'TOV'].includes(k)) best[k] = Math.max(...L.map(l => l[k] ?? -1e9)); });
  const head = `<tr><th>Jugador</th>${cols.map(([k, l]) => k === 'REB' ? `<th>Reb<button class="rxbtn" title="${rx ? 'Ocultar' : 'Ver'} ofensivos y defensivos" ${on('rx', !rx)}>${rx ? '‹' : '›'}</button></th>` : `<th class="${k === 'REBD' || k === 'REBO' ? 'split' : ''}">${l}</th>`).join('')}</tr>`;
  const body = L.map(l => `<tr><td>${plink(l.p)}</td>${cols.map(([k]) => `<td class="${best[k] != null && l[k] === best[k] && best[k] > 0 ? 'best' : ''} ${k === 'REBD' || k === 'REBO' ? 'split' : ''}">${boxCell(l, k)}</td>`).join('')}</tr>`).join('')
    + `<tr style="font-weight:700"><td>Equipo</td>${cols.map(([k]) => `<td class="${k === 'REBD' || k === 'REBO' ? 'split' : ''}">${k === 'PM' ? '' : boxCell(tot, k)}</td>`).join('')}</tr>`;
  const qs = g.q.filter(x => x.f != null);
  let run = 0; const adv = g.q.map(x => x.f == null ? null : (run += x.f - x.c));
  const h1 = qs.length === 4 ? (g.q[0].f + g.q[1].f) - (g.q[0].c + g.q[1].c) : null, h2 = qs.length === 4 ? (g.q[2].f + g.q[3].f) - (g.q[2].c + g.q[3].c) : null;
  let story = '';
  if (h1 != null) {
    if (g.res === 'V' && h2 < 0) story = `Remontada rival en la segunda parte (${g.q[2].f + g.q[3].f}–${g.q[2].c + g.q[3].c}), pero la ventaja del descanso (${sg(h1)}) aguantó.`;
    else if (g.res === 'V' && h1 < 0) story = `Remontada: al descanso íbamos ${sg(h1)} y la segunda parte fue nuestra (${g.q[2].f + g.q[3].f}–${g.q[2].c + g.q[3].c}).`;
    else if (g.res === 'D' && h1 > 0) story = `Al descanso íbamos ${sg(h1)}, pero la segunda parte se escapó (${g.q[2].f + g.q[3].f}–${g.q[2].c + g.q[3].c}).`;
    else { const bq = g.q.map((x, k) => ({ k, d: x.f - x.c })).sort((a, b) => b.d - a.d)[0]; story = `Mejor cuarto: el ${bq.k + 1}º (${g.q[bq.k].f}–${g.q[bq.k].c}).`; }
  }
  const lead = (k, lbl, extra) => { const t = lines.filter(l => l[k] != null).sort((a, b) => b[k] - a[k]); if (!t.length || !t[0][k]) return ''; const top = t.filter(l => l[k] === t[0][k]);
    return `<div class="card sm"><div class="lbl">${lbl}</div><div class="big acc">${nf(t[0][k])}</div><div style="font-weight:700">${top.map(l => plink(l.p)).join(' · ')}</div><div class="small mut">${extra ? extra(top[0]) : ''}</div></div>`; };
  const media = S.M.media.filter(m => m.gid === g.id);
  const vid = g.video ? `<a class="btn" href="${esc(g.video)}" target="_blank" rel="noopener">▶ Ver el partido completo</a>` : '';
  return `<section class="sec top" style="padding-bottom:20px"><div class="between"><a href="#/calendario" style="font-weight:600">← Calendario</a>
    <div class="row" style="gap:20px">${prev ? `<a href="#/partido/${encodeURIComponent(prev.id)}">← ${prev.label} · ${esc(prev.rival)}</a>` : ''}${next ? `<a href="#/partido/${encodeURIComponent(next.id)}">${next.label} · ${esc(next.rival)} →</a>` : ''}</div></div></section>
  <section class="sec"><div class="card ${g.res === 'V' ? 'hl' : ''}" style="padding:36px;display:flex;flex-direction:column;gap:18px">
    <div class="row" style="gap:12px;flex-wrap:wrap"><span class="tag ${g.res === 'V' ? 'po' : ''}" style="font-size:14px">${g.res === 'V' ? 'VICTORIA' : g.res === 'D' ? 'DERROTA' : 'SIN JUGAR'}</span><span class="tx2">${g.po ? 'Playoffs' : 'Liga'} · ${g.po ? g.label : 'Jornada ' + (g.j || '')} · ${fdw(g.date)} ${pd(g.date) ? pd(g.date).getFullYear() : ''}${g.hora ? ' · ' + esc(g.hora) : ''}</span></div>
    <div class="row" style="gap:24px;flex-wrap:wrap;align-items:baseline"><span class="cond" style="font-weight:800;font-size:40px">Icaro</span><span class="huge ${g.res === 'V' ? 'acc' : ''}">${g.played ? g.pf : '–'}</span><span class="huge mut">–</span><span class="huge">${g.played ? g.pc : '–'}</span><span class="cond tx2" style="font-weight:800;font-size:40px">${esc(g.rival)}</span></div>
    ${story ? `<div class="tx2" style="font-size:17px">${story}</div>` : ''}${g.notas ? `<div class="tx2">${esc(g.notas)}</div>` : ''}
  </div></section>
  ${qs.length ? `<section class="sec"><div class="tw"><table class="t"><tr><th></th>${g.q.map((_, k) => `<th>${k + 1}º</th>`).join('')}${g.ot ? '<th>Prórroga</th>' : ''}<th>Total</th></tr>
    <tr><td style="font-weight:700">Icaro</td>${g.q.map(x => `<td class="${x.f > x.c ? 'best' : ''}">${x.f ?? '—'}</td>`).join('')}${g.ot ? `<td>${g.ot.f}</td>` : ''}<td style="font-weight:700">${g.pf}</td></tr>
    <tr><td style="font-weight:700">${esc(g.rival)}</td>${g.q.map(x => `<td>${x.c ?? '—'}</td>`).join('')}${g.ot ? `<td>${g.ot.c}</td>` : ''}<td style="font-weight:700">${g.pc}</td></tr>
    <tr><td class="mut">Ventaja al final del cuarto</td>${adv.map(a => `<td class="${a > 0 ? 'acc' : 'mut'}">${a == null ? '—' : sg(a)}</td>`).join('')}${g.ot ? `<td>${sg(g.pf - g.pc)}</td>` : ''}<td></td></tr></table></div></section>` : ''}
  ${lines.length ? `<section class="sec grid g4" style="gap:14px">${lead('PTS', 'Puntos', l => `${l.FGM ?? '–'}/${l.FGA ?? '–'} TC · ${l['3PM'] ?? '–'}/${l['3PA'] ?? '–'} T3 · ${l.FTM ?? '–'}/${l.FTA ?? '–'} TL`)}${lead('REB', 'Rebotes', l => l.REBO != null ? nf(l.REBO) + ' ofensivos' : '')}${lead('AST', 'Asistencias')}${lead('STL', 'Robos')}</section>
  <section class="sec"><div class="between" style="margin-bottom:14px"><h2>Box score</h2>${hasQ ? pills('box.t', [['T', 'Total'], ['1', '1º'], ['2', '2º'], ['3', '3º'], ['4', '4º']].concat(lines.some(l => l.byq && l.byq[5]) ? [['5', 'Prórroga']] : []), tab) : ''}</div>
    <div class="tw"><table class="t sticky1">${head}${body}</table></div>
    <div class="note" style="margin-top:10px">${lines.length} jugadores. ${lines.length === 5 ? 'Sin cambios: 48 minutos cada uno.' : ''} Minutos escalados a ${S.M.seasons.find(x => x.id === g.season)?.qmin || 12} por cuarto.</div></section>` : `<section class="sec"><div class="empty">Este partido no tiene estadísticas apuntadas.</div></section>`}
  ${vid || media.length ? `<section class="sec stack">${vid}${media.length ? `<div class="grid g4">${media.map(mediaCard).join('')}</div>` : ''}</section>` : ''}`;
};

/* ============ PLANTILLA ============ */
function rosterRows() {
  const act = Object.values(S.M.players).filter(p => p.activo);
  const prevS = S.M.seasons.map(s => s.id).filter(id => id < S.M.actual)[0];
  return act.map(pl => {
    const rs = refSeason(pl.name, S.M.actual);
    const a = rs ? agg(linesOf(rs, { fase: 'Liga', p: pl.name })) : null;
    const cur = linesOf(S.M.actual, { fase: 'Liga', p: pl.name }).length;
    const st = cur ? 'Esta temporada' : !rs ? 'Nuevo' : rs === prevS ? 'Sigue' : 'Vuelve';
    return { pl, rs, a, st };
  });
}
PAGES.plantilla = () => {
  const so = ui('pl.s', 'd');
  const rows = rosterRows().sort((x, y) => so === 'd' ? (+x.pl.dorsal || 999) - (+y.pl.dorsal || 999) : ((y.a ? y.a.avg[so] : -1) || -1) - ((x.a ? x.a.avg[so] : -1) || -1));
  return `<div class="pagehead"><div><h1>Plantilla ${esc(S.M.actual)}</h1><div class="sub">${rows.length} jugadores · se ven las medias de liga de su última temporada con nosotros</div></div>
    ${pills('pl.s', [['d', 'Dorsal'], ['PTS', 'Puntos'], ['REB', 'Rebotes'], ['AST', 'Asistencias']], so)}</div>
  <section class="sec grid g4">${rows.map(r => `<a href="#/jugador/${encodeURIComponent(r.pl.name)}" class="card" style="padding:0;overflow:hidden;display:flex;flex-direction:column;color:var(--tx)">
    <div style="position:relative">${photo(r.pl.name, 260, 96)}<span class="badge" style="position:absolute;top:14px;right:14px;background:var(--bg)">${r.st}</span></div>
    <div style="padding:18px 20px 20px;display:flex;flex-direction:column;gap:12px">
      <div><div class="cond" style="font-weight:800;font-size:32px;line-height:1.05">${esc(r.pl.name)}</div><div class="small mut" style="font-size:14px">${esc(r.pl.posTxt || '—')}</div></div>
      <div class="lbl" style="font-size:12px;padding-top:12px;border-top:1px solid var(--line)">${r.a ? 'Liga ' + r.rs + ' · ' + r.a.gp + ' partidos' : 'Sin partidos todavía'}</div>
      <div class="grid g3" style="gap:8px">${['PTS', 'REB', 'AST'].map(k => `<div><div class="lbl" style="font-size:12px">${k}</div><div class="cond" style="font-weight:700;font-size:26px">${r.a ? n1(r.a.avg[k]) : '—'}</div></div>`).join('')}</div>
    </div></a>`).join('')}</section>`;
};

/* ============ JUGADOR ============ */
PAGES.jugador = R => {
  const p = R.arg, pl = S.M.players[p];
  if (!pl && !S.M.lines.some(l => l.p === p)) return `<div class="loading">No encuentro a ese jugador. <a href="#/plantilla">Volver a la plantilla</a></div>`;
  const P = pl || { name: p, pos: [], posTxt: '', dorsal: '' };
  const s = linesOf(S.season, { fase: 'Liga', p }).length ? S.season : refSeason(p, S.season) || refSeason(p);
  const role = roleOf(p);
  const head = `<section class="sec" style="padding-top:32px;padding-bottom:0"><a href="#/plantilla" style="font-weight:600">← Plantilla</a></section>`;
  if (!s) return head + `<section class="sec top grid" id="j-hero" style="grid-template-columns:minmax(0,440px) minmax(0,1fr);gap:48px"><div style="border-radius:24px;overflow:hidden;border:1px solid var(--accline)">${photo(p, 480, 150)}</div>
    <div class="stack" style="justify-content:center;gap:20px"><div class="row" style="gap:10px"><span class="badge" style="background:var(--accbg);color:var(--acc2);font-weight:600">${esc(P.posTxt || '—')}</span><span class="badge" style="background:var(--acc);color:var(--ink);font-weight:700">★ Por descubrir</span></div>
    <h1 style="font-size:clamp(64px,9vw,120px);line-height:.85">${esc(p.toUpperCase())}</h1><div class="tx2">Todavía no ha jugado partidos con nosotros. Sus estadísticas y su rol aparecerán en cuanto juegue.</div>${P.bio ? `<div class="tx2">${esc(P.bio)}</div>` : ''}</div></section>`;
  const { sp, q } = qualAvg(s);
  const A = sp[p], all = linesOf(s, { p }).sort((x, y) => x.g.date.localeCompare(y.g.date));
  const nLg = gamesOf(s, 'Liga').filter(g => g.played).length;
  const qq = q.includes(p) ? q : q.concat(p);
  const tile = (k, l) => { const r = rankIn(sp, qq, p, o => o.avg[k]); return `<div class="card sm"><div class="lbl">${l}</div><div class="big ${r === 1 ? 'acc' : ''}">${n1(A.avg[k])}</div><div class="small mut">${r}º del equipo</div></div>`; };
  const ev = roleEvolution(p, s);
  const mode = ui('j.m', 'avg'); const src = mode === 'avg' ? A.avg : mode === 'p36' ? A.p36 : A.tot;
  const TK = [['PTS', 'Puntos'], ['REB', 'Rebotes'], ['REBO', 'Reb. ofens.'], ['REBD', 'Reb. defens.'], ['AST', 'Asistencias'], ['STL', 'Robos'], ['BLK', 'Tapones'], ['TOV', 'Pérdidas'], ['FGM', 'Tiros anotados'], ['FGA', 'Tiros intentados'], ['3PM', 'Triples'], ['3PA', 'Triples intent.'], ['MIN', 'Minutos'], ['PM', '+/−'], ['EFF', 'Eficiencia'], ['VAL', 'Valoración']];
  const shoot = [['Tiro de campo', A.FGp, `${n1(A.avg.FGM)}/${n1(A.avg.FGA)}`], ['Triples', A.TPp, `${n1(A.avg['3PM'])}/${n1(A.avg['3PA'])}`], ['Tiros libres', A.FTp, `${n1(A.avg.FTM)}/${n1(A.avg.FTA)}`], ['eFG%', A.eFG], ['TS%', A.TS]];
  // por cuarto (solo si hay datos por cuartos)
  const ql = A.lines.filter(l => l.byq);
  let qBox = `<div class="note">Esta temporada no tiene estadísticas por cuarto: se apuntaban solo los totales del partido.</div>`;
  if (ql.length) {
    const qv = [1, 2, 3, 4].map(c => { const ls = ql.map(l => l.byq[c]).filter(Boolean); const a = agg(ls); return { PTS: a.avg.PTS, REB: a.avg.REB, FG: a.FGp, PM: a.avg.PM, EFF: a.avg.EFF }; });
    const row = (lbl, k, f) => { const mx = Math.max(...qv.map(x => x[k] ?? -1e9)); return `<tr><td class="tx2">${lbl}</td>${qv.map(x => `<td class="${x[k] === mx ? 'best' : ''}">${f(x[k])}</td>`).join('')}</tr>`; };
    const eff = qv.map(x => x.EFF || 0), b = eff.indexOf(Math.max(...eff)) + 1, w = eff.indexOf(Math.min(...eff)) + 1;
    qBox = `<div style="overflow-x:auto"><table class="t" style="font-size:16px"><tr><th></th><th>1º</th><th>2º</th><th>3º</th><th>4º</th></tr>${row('Puntos', 'PTS', n1)}${row('Rebotes', 'REB', n1)}${row('% tiro', 'FG', pc0)}${row('+/−', 'PM', sg)}${row('Valoración', 'EFF', n1)}</table></div>
      <div class="note">El ${b}º cuarto es su mejor tramo (más valoración) y el ${w}º el más flojo.</div>`;
  }
  const MXK = [['PTS', 'Puntos'], ['REB', 'Rebotes'], ['AST', 'Asistencias'], ['STL', 'Robos'], ['BLK', 'Tapones'], ['FGM', 'Tiros anotados'], ['3PM', 'Triples'], ['FTM', 'Tiros libres'], ['MIN', 'Minutos'], ['EFF', 'Eficiencia'], ['VAL', 'Valoración'], ['PM', '+/−']];
  const maxima = MXK.map(([k, l]) => { const t = all.filter(x => x[k] != null).sort((a, b) => b[k] - a[k])[0]; return t ? `<a href="#/partido/${encodeURIComponent(t.gid)}" class="card sm" style="color:var(--tx)"><div class="lbl">${l}</div><div class="big acc" style="font-size:42px">${k === 'PM' ? sg(t[k]) : nf(t[k])}</div><div class="small tx2">vs ${esc(t.g.rival)}</div><div class="small mut">${fd(t.g.date)}</div></a>` : ''; }).join('');
  const maxPts = Math.max(1, ...all.map(l => l.PTS || 0)), scl = 200 / maxPts;
  const rx = ui('rx', false);
  const logCols = [['MIN', 'Min'], ['PTS', 'Pts'], ['REB', 'Reb']].concat(rx ? [['REBD', 'Def'], ['REBO', 'Of']] : []).concat([['AST', 'Ast'], ['STL', 'Rob'], ['BLK', 'Tap'], ['TOV', 'Pér'], ['FG', 'TC'], ['3P', 'T3'], ['FT', 'TL'], ['PM', '+/−'], ['VAL', 'Val']]);
  const log = `<div class="tw"><table class="t sticky1"><tr><th>Fecha</th><th class="l">Rival</th><th class="l">Result.</th>${logCols.map(([k, l]) => k === 'REB' ? `<th>Reb<button class="rxbtn" ${on('rx', !rx)} title="${rx ? 'Ocultar' : 'Ver'} ofensivos y defensivos">${rx ? '‹' : '›'}</button></th>` : `<th class="${k === 'REBD' || k === 'REBO' ? 'split' : ''}">${l}</th>`).join('')}</tr>
    ${all.map(l => `<tr class="link" onclick="go('partido/${esc(l.gid)}')"><td class="mut">${fd(l.g.date)}</td><td class="l" style="font-weight:600">${esc(l.g.rival)}${l.g.po ? ' · PO' : ''}</td><td class="l ${l.g.res === 'V' ? 'acc' : 'mut'}" style="font-weight:600">${l.g.res || ''} ${sc(l.g)}</td>${logCols.map(([k]) => `<td class="${k === 'PTS' && l.PTS === maxPts ? 'best' : ''} ${k === 'REBD' || k === 'REBO' ? 'split' : ''}">${boxCell(l, k)}</td>`).join('')}</tr>`).join('')}</table></div>`;
  // evolución entre temporadas
  const seasonsP = S.M.seasons.map(x => x.id).filter(id => linesOf(id, { fase: 'Liga', p }).length);
  const prev = seasonsP.find(id => id < s);
  let evo = '';
  if (prev) {
    const a0 = agg(linesOf(prev, { fase: 'Liga', p })), a1 = A;
    const H = [['Partidos', a0.gp, a1.gp], ['Minutos', a0.avg.MIN, a1.avg.MIN], ['Puntos', a0.avg.PTS, a1.avg.PTS], ['Rebotes', a0.avg.REB, a1.avg.REB], ['Asistencias', a0.avg.AST, a1.avg.AST], ['Robos', a0.avg.STL, a1.avg.STL], ['% tiro', a0.FGp, a1.FGp, 1], ['% triple', a0.TPp, a1.TPp, 1], ['% tiro libre', a0.FTp, a1.FTp, 1]];
    evo = `<div style="overflow-x:auto"><table class="t" style="font-size:16px"><tr><th>Liga, por partido</th><th>${prev}</th><th>${s}</th><th>Cambio</th></tr>${H.map(h => { const d = isNum(h[1]) && isNum(h[2]) ? (h[3] ? (h[2] - h[1]) * 100 : h[2] - h[1]) : null;
      return `<tr><td class="tx2">${h[0]}</td><td class="mut">${h[3] ? pc(h[1]) : nf(h[1])}</td><td style="font-weight:600">${h[3] ? pc(h[2]) : nf(h[2])}</td><td class="${d > 0.5 ? 'acc' : ''}" style="font-weight:700">${d == null ? '—' : sg(d) + (h[3] ? ' pp' : '')}</td></tr>`; }).join('')}</table></div>`;
  }
  const media = S.M.media.filter(m => m.p && m.p.split(/[,;]/).map(x => x.trim()).includes(p));
  if (!CLIPS) loadClips().then(() => render());
  const clips = (CLIPS || []).filter(c => c.who.includes(p));
  const kw = ui('j.kw', null); const kws = uniq(clips.flatMap(c => c.kw)); const shown = clips.filter(c => !kw || c.kw.includes(kw));
  return head + `
  <section class="sec" style="padding-top:24px;display:grid;grid-template-columns:minmax(0,440px) minmax(0,1fr);gap:48px" id="j-hero">
    <div style="border-radius:24px;overflow:hidden;border:1px solid var(--accline)">${photo(p, 540, 150)}</div>
    <div class="stack" style="gap:22px;justify-content:center">
      <div class="row" style="gap:10px;flex-wrap:wrap"><span class="badge" style="background:var(--accbg);color:var(--acc2);font-weight:600;font-size:14px;padding:6px 12px">${esc(P.posTxt || '—')}</span>${role ? `<span class="badge" style="background:var(--acc);color:var(--ink);font-weight:700;font-size:14px;padding:6px 12px">★ ${esc(role.titulo)}</span>` : ''}</div>
      <h1 style="font-size:clamp(72px,9vw,140px);line-height:.85;letter-spacing:-2px">${esc(p.toUpperCase())}</h1>
      <div class="row tx2" style="gap:28px;flex-wrap:wrap"><div>Dorsal <strong style="color:var(--tx)">${esc(P.dorsal || '—')}</strong></div>${P.altura ? `<div>Altura <strong style="color:var(--tx)">${esc(P.altura)} cm</strong></div>` : ''}<div>Partidos <strong style="color:var(--tx)">${A.gp} de ${nLg}</strong></div><div>Minutos <strong style="color:var(--tx)">${n1(A.avg.MIN)} / partido</strong></div></div>
      ${P.bio ? `<div class="tx2" style="font-size:17px;max-width:760px">${esc(P.bio)}</div>` : ''}
      ${role && !role.manual && role.id !== 'nuevo' ? `<div class="card sm" style="border-color:var(--accline);max-width:860px;display:flex;flex-direction:column;gap:10px">
        <div class="between"><div class="lbl" style="font-size:12px">Por qué es su rol · según ${esc(role.temporada)}</div><div class="small mut">Se recalcula solo con cada partido</div></div>
        <div>${esc(role.porque)}</div>
        ${role.rasgos && role.rasgos.length ? `<div class="row" style="gap:6px;flex-wrap:wrap"><span class="small mut">También:</span>${role.rasgos.map(r => `<span class="badge">${esc(r)}</span>`).join('')}</div>` : ''}
        ${ev.length > 1 ? `<div class="grid" style="grid-template-columns:repeat(${Math.min(ev.length, 6)},minmax(0,1fr));gap:6px">${ev.slice(-6).map((e, i, a) => `<div style="padding:8px 12px;border-radius:10px;background:${i === a.length - 1 ? 'var(--accbg)' : 'var(--card2)'}"><div style="font-size:11px;letter-spacing:1px" class="mut">TRAS J${e.j}</div><div style="font-size:14px;font-weight:600;color:${i === a.length - 1 ? 'var(--acc2)' : 'var(--tx2)'}">${esc(e.t)}</div></div>`).join('')}</div>` : ''}
      </div>` : ''}
      <div class="grid g5" style="gap:12px">${tile('PTS', 'PTS')}${tile('REB', 'REB')}${tile('AST', 'AST')}${tile('STL', 'ROB')}${tile('VAL', 'VAL')}</div>
      ${s !== S.season ? `<div class="note">Sin partidos de liga en ${esc(S.season)}: se muestran sus datos de ${esc(s)}.</div>` : ''}
    </div></section>
  <section class="sec"><div class="between" style="margin-bottom:18px"><h2>Estadísticas de liga · ${esc(s)}</h2>${pills('j.m', [['avg', 'Medias'], ['p36', 'Por 36 min'], ['tot', 'Totales']], mode)}</div>
    <div class="grid g8" style="gap:12px">${TK.map(([k, l]) => `<div class="card sm" style="padding:16px"><div class="small mut">${l}</div><div class="cond" style="font-weight:700;font-size:34px">${k === 'PM' ? sg(src[k]) : nf(src[k])}</div></div>`).join('')}</div>
    <div class="note" style="margin-top:10px">${mode === 'avg' ? `Media por partido en ${A.gp} partidos de liga.` : mode === 'p36' ? `Normalizado a 36 minutos: útil para comparar con quien juega menos. ${esc(p)} juega ${Math.round(A.avg.MIN || 0)} de 48.` : `Suma de los ${A.gp} partidos de liga.`}</div></section>
  <section class="sec grid g2" style="gap:24px">
    <div class="card stack" style="gap:18px"><h3>Tiro y eficiencia</h3>${shoot.map(x => `<div style="display:grid;grid-template-columns:120px minmax(0,1fr) 70px;gap:16px;align-items:center"><div class="tx2">${x[0]}${x[2] ? `<div class="small mut">${x[2]}</div>` : ''}</div><div class="bar"><i style="width:${isNum(x[1]) ? Math.min(100, x[1] * 100) : 0}%"></i></div><div style="font-weight:700;font-size:17px;text-align:right">${pc(x[1])}</div></div>`).join('')}
      <div class="row tx2" style="gap:24px;padding-top:14px;border-top:1px solid var(--line);flex-wrap:wrap"><div>AST/PÉR <strong style="color:var(--tx)">${n1(A.ATO)}</strong></div><div>Tasa de triples <strong style="color:var(--tx)">${pc0(A.r3)}</strong></div><div>Tasa de tiros libres <strong style="color:var(--tx)">${pc0(A.ftr)}</strong></div></div></div>
    <div class="card stack" style="gap:18px"><h3>Por cuarto <span class="small mut" style="font-family:Barlow;font-weight:400;font-size:15px">· media por partido</span></h3>${qBox}</div></section>
  <section class="sec"><h2 style="margin-bottom:18px">Máximos de la temporada</h2><div class="grid g6" style="gap:12px">${maxima}</div></section>
  <section class="sec"><div class="card stack" style="gap:18px"><div class="between"><h3>Puntos partido a partido</h3><div class="row small tx2" style="gap:16px"><span class="row" style="gap:6px"><i style="width:12px;height:12px;border-radius:3px;background:var(--acc)"></i>Victoria</span><span class="row" style="gap:6px"><i style="width:12px;height:12px;border-radius:3px;background:var(--lose)"></i>Derrota</span><span>— Media ${n1(A.avg.PTS)}</span></div></div>
    <div style="overflow-x:auto"><div style="position:relative;height:250px;display:flex;align-items:flex-end;gap:8px;min-width:${all.length * 34}px"><div style="position:absolute;left:0;right:0;bottom:${Math.round((A.avg.PTS || 0) * scl) + 20}px;border-top:2px dashed #6B7280"></div>
    ${all.map(l => `<a href="#/partido/${encodeURIComponent(l.gid)}" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;color:var(--tx)" title="vs ${esc(l.g.rival)} · ${fd(l.g.date)}"><span class="small" style="font-weight:600">${nf(l.PTS)}</span><i style="display:block;width:100%;border-radius:5px 5px 0 0;height:${Math.round((l.PTS || 0) * scl)}px;background:${l.g.res === 'V' ? 'var(--acc)' : 'var(--lose)'}"></i><span class="small mut" style="font-size:11px;height:16px">${l.g.label}</span></a>`).join('')}</div></div></div></section>
  <section class="sec"><h2 style="margin-bottom:18px">Partido a partido</h2>${log}</section>
  <section class="sec grid g2" style="gap:24px">
    <div class="card stack" style="gap:14px"><div class="between"><h3>Evolución entre temporadas</h3><a href="#/historico" style="font-weight:600">Histórico →</a></div>${evo || '<div class="note">Es su primera temporada con nosotros.</div>'}</div>
    <div class="stack" style="gap:14px"><h3>Galería</h3>${media.length ? `<div class="grid g2" style="gap:12px">${media.slice(0, 4).map(mediaCard).join('')}</div>` : '<div class="empty">Todavía no hay fotos ni vídeos suyos.</div>'}</div></section>
  <section class="sec stack" style="gap:18px"><div class="between"><h2>Jugadas</h2><div class="row" style="gap:20px"><span class="mut">${CLIPS ? (shown.length === clips.length ? clips.length + ' jugadas' : shown.length + ' de ' + clips.length + ' jugadas') : 'Cargando…'}</span><a href="#/jugadas" style="font-weight:600">Todas las jugadas del equipo →</a></div></div>
    ${kws.length ? `<div class="chips"><button type="button" class="chip ${!kw ? 'on' : ''}" ${on('j.kw', null)}>Todas · ${clips.length}</button>${kws.map(k => `<button type="button" class="chip ${kw === k ? 'on' : ''}" ${on('j.kw', k)}>${esc(k)} · ${clips.filter(c => c.kw.includes(k)).length}</button>`).join('')}</div>` : ''}
    ${shown.length ? `<div class="grid g3">${shown.map(c => clipCard(c)).join('')}</div>` : CLIPS ? '<div class="empty">Todavía no hay jugadas suyas.</div>' : ''}</section>`;
};

/* ============ ESTADÍSTICAS ============ */
const STAT_VIEWS = [['medias', 'Medias'], ['p36', 'Por 36 min'], ['avanzadas', 'Tiro y avanzadas'], ['maximos', 'Máximos']];
const EXPAND = { REB: [['REBD', 'DEF'], ['REBO', 'OFF']], FGp: [['FGM', 'TC met.'], ['FGA', 'TC int.']], TPp: [['3PM', 'T3 met.'], ['3PA', 'T3 int.']], FTp: [['FTM', 'TL met.'], ['FTA', 'TL int.']] };
const EXPAND_KEY = { REB: 'rx', FGp: 'xFG', TPp: 'xTP', FTp: 'xFT' };
function statTable(season, view, rx, sortK) {
  const fase = view === 'maximos' ? null : 'Liga';
  const sp = seasonPlayers(season, fase), m = minPJ(season);
  const mx = (a, k) => { const t = a.lines.filter(l => l[k] != null).sort((a, b) => b[k] - a[k])[0]; return t || null; };
  const shotMax = (a, mk, ak, minA) => { const t = a.lines.filter(l => (l[ak] || 0) >= minA).map(l => ({ l, v: l[mk] / l[ak] })).sort((a, b) => b.v - a.v)[0]; return t || null; };
  let cols;
  if (view === 'medias' || view === 'p36') cols = [['MIN', 'MIN'], ['PTS', 'PTS'], ['REB', 'REB'], ['AST', 'AST'], ['STL', 'ROB'], ['BLK', 'TAP'], ['TOV', 'PÉR', 'low'], ['PM', '+/−'], ['FGp', 'TC%', 'pct'], ['TPp', 'T3%', 'pct'], ['FTp', 'TL%', 'pct'], ['EFF', 'EFF'], ['VAL', 'VAL']];
  else if (view === 'avanzadas') cols = [['FGp', 'TC%', 'pct'], ['TPp', 'T3%', 'pct'], ['FTp', 'TL%', 'pct'], ['eFG', 'eFG%', 'pct'], ['TS', 'TS%', 'pct'], ['ATO', 'AST/PÉR'], ['r3', '% triples', 'pct'], ['ftr', '% libres', 'pct'], ['EFF', 'EFF']];
  else cols = [['PTS', 'PTS'], ['REB', 'REB'], ['AST', 'AST'], ['STL', 'ROB'], ['BLK', 'TAP'], ['3PM', 'T3'], ['FTM', 'TL'], ['MIN', 'MIN'], ['FGp', 'TC%', 'pct'], ['TPp', 'T3%', 'pct'], ['FTp', 'TL%', 'pct'], ['EFF', 'EFF'], ['VAL', 'VAL']];
  // columnas que se despliegan: rebotes en defensivos/ofensivos y cada porcentaje en metidos/intentados
  const ex = Object.assign({ REB: rx }, statTable.ex || {});
  Object.keys(EXPAND).forEach(g => { if (!ex[g]) return; const i = cols.findIndex(c => c[0] === g); if (i < 0) return;
    cols[i] = cols[i].slice(0, 3).concat([g, 'first']); const kids = EXPAND[g].map(([k, l], j, a) => [k, l, 'split', g, j === a.length - 1 ? 'last' : 'mid']);
    cols.splice(i + 1, 0, ...kids); });
  const valA = (a, k, team) => {
    if (view === 'maximos') {
      if (k === 'FGp') { const t = shotMax(a, 'FGM', 'FGA', team ? 15 : 4); return t ? { v: t.v, l: t.l } : null; }
      if (k === 'TPp') { const t = shotMax(a, '3PM', '3PA', team ? 8 : 3); return t ? { v: t.v, l: t.l } : null; }
      if (k === 'FTp') { const t = shotMax(a, 'FTM', 'FTA', team ? 6 : 2); return t ? { v: t.v, l: t.l } : null; }
      const t = mx(a, k); return t ? { v: t[k], l: t } : null;
    }
    if (['FGp', 'TPp', 'FTp', 'eFG', 'TS', 'ATO', 'r3', 'ftr'].includes(k)) return { v: a[k] };
    if (view === 'avanzadas' && k === 'EFF') return { v: a.avg.EFF };
    if (view === 'p36' && k !== 'MIN') return { v: a.p36[k] };
    return { v: a.avg[k] };
  };
  const val = (p, k) => valA(sp[p], k);
  // el equipo: una "línea" por partido sumando a todos (minutos y +/− entre 5: los del equipo)
  const byG = {}; linesOf(season, { fase }).forEach(l => (byG[l.gid] = byG[l.gid] || []).push(l));
  const tLines = Object.values(byG).map(ls => { const o = { gid: ls[0].gid, g: ls[0].g, p: 'Equipo' };
    SK.forEach(k => { const v = ls.filter(l => l[k] != null); o[k] = v.length ? sum(v, l => l[k]) : null; });
    if (o.MIN != null) o.MIN /= 5; if (o.PM != null) o.PM /= 5; return o; });
  const team = Object.assign(agg(tLines), { lines: tLines });
  const teamVal = k => valA(team, k, true);
  const names = Object.keys(sp);
  const qual = names.filter(p => sp[p].gp >= m);
  const best = {}; cols.forEach(([k, , f]) => { const vs = qual.map(p => (val(p, k) || {}).v).filter(isNum); best[k] = vs.length ? (f === 'low' ? Math.min(...vs) : Math.max(...vs)) : null; });
  const sk = sortK || cols[1] && cols[1][0];
  names.sort((a, b) => ((sp[b].gp >= m) - (sp[a].gp >= m)) || (((val(b, sk) || {}).v ?? -1e9) - ((val(a, sk) || {}).v ?? -1e9)) * ((cols.find(c => c[0] === sk) || [])[2] === 'low' ? -1 : 1));
  const fmt = (k, v, f) => f === 'pct' ? pc(v) : k === 'PM' ? sg(v) : view === 'maximos' ? nf(v) : n1(v);
  return { sp, names, cols, val, best, m, fmt, sk, team, teamVal };
}
PAGES.estadisticas = R => {
  const view = STAT_VIEWS.some(v => v[0] === R.arg) ? R.arg : 'medias';
  const s = S.season, rx = ui('rx', false);
  const sortK = ui('st.sort.' + view, null);
  statTable.ex = { FGp: ui('xFG', false), TPp: ui('xTP', false), FTp: ui('xFT', false) };
  const T = statTable(s, view, rx, sortK);
  const nL = gamesOf(s, 'Liga').filter(g => g.played).length;
  const sub = view === 'maximos' ? `Mejor marca en un solo partido · liga y playoffs ${s}` : `${view === 'p36' ? 'Por 36 minutos' : view === 'avanzadas' ? 'Tiro y avanzadas' : 'Media por partido'} · Liga ${s} · ${nL} partidos`;
  const gcls = c => c[3] ? 'grp g-' + c[4] : '';
  const th = T.cols.map(c => { const [k, l] = c; const xk = EXPAND_KEY[k];
    if (xk && view !== 'maximos' || k === 'REB') { const open = !!c[3]; const tip = k === 'REB' ? 'ofensivos y defensivos' : 'metidos e intentados';
      return `<th class="${T.sk === k ? 'sorted' : ''} ${gcls(c)}"><button ${on('st.sort.' + view, k)}>${l}${T.sk === k ? ' ↓' : ''}</button><button class="xbtn ${open ? 'on' : ''}" ${on(xk, !open)} title="${open ? 'Ocultar' : 'Ver'} ${tip}" aria-label="${open ? 'Ocultar' : 'Ver'} ${tip}">${open ? '−' : '+'}</button></th>`; }
    return `<th class="${T.sk === k ? 'sorted' : ''} ${gcls(c)}"><button ${on('st.sort.' + view, k)}>${l}${T.sk === k ? ' ↓' : ''}</button></th>`; }).join('');
  const teamRow = T.team.gp ? `<tr class="teamrow"><td>Equipo</td><td>${T.team.gp}</td>${T.cols.map(c => { const [k, , f] = c; const x = T.teamVal(k) || {}; return `<td class="${gcls(c)}">${T.fmt(k, x.v, f)}</td>`; }).join('')}</tr>` : '';
  const rows = T.names.map(p => `<tr class="${T.sp[p].gp < T.m ? 'dimrow' : ''}"><td>${plink(p)}</td><td>${T.sp[p].gp}</td>${T.cols.map(c => { const [k, , f] = c; const x = T.val(p, k) || {}; return `<td class="${T.sp[p].gp >= T.m && isNum(x.v) && x.v === T.best[k] ? 'best' : ''} ${gcls(c)}">${T.fmt(k, x.v, f)}</td>`; }).join('')}</tr>`).join('');
  const teamNote = { medias: 'Equipo: lo que hace el equipo entero por partido (sus minutos son los del partido; +/−, la diferencia media en el marcador).', p36: 'Equipo: el equipo entero por cada 36 minutos de partido.', avanzadas: 'Equipo: porcentajes y ratios del equipo entero.', maximos: 'Equipo: su mejor partido en cada stat (en TC%, T3% y TL%, con un mínimo de 15, 8 y 6 intentos).' };
  const notes = { medias: 'Media por partido jugado. TC%, T3% y TL% son los porcentajes de toda la temporada; con el botón + al lado se despliegan los tiros metidos e intentados (y en REB, los defensivos y ofensivos).', p36: 'Por 36 minutos. La columna MIN muestra los minutos reales por partido como referencia.', avanzadas: '% triples = qué parte de sus tiros son triples. % libres = tiros libres intentados por cada tiro de campo.', maximos: 'Mejor marca de cada jugador en un solo partido. En TC%, T3% y TL% cuentan partidos con un mínimo de intentos (4, 3 y 2).' };
  let extra = '';
  if (view === 'maximos') {
    const wcols = T.cols.filter(c => c[2] !== 'split');
    extra = `<section class="sec"><div class="between" style="margin-bottom:14px"><h2>¿En qué partido fue?</h2><span class="note">Pulsa un partido para abrir sus estadísticas</span></div>
      <div class="tw"><table class="t sticky1"><tr><th>Jugador</th><th>PJ</th>${wcols.map(c => `<th>${c[1]}</th>`).join('')}</tr>${T.names.map(p => `<tr class="${T.sp[p].gp < T.m ? 'dimrow' : ''}"><td>${plink(p)}</td><td>${T.sp[p].gp}</td>${wcols.map(([k]) => { const x = T.val(p, k); return `<td style="white-space:normal;min-width:84px">${x && x.l ? `<a href="#/partido/${encodeURIComponent(x.l.gid)}" style="color:var(--tx)"><div style="font-size:13px">${esc(x.l.g.rival)}</div><div class="small mut" style="font-size:11px">${fd(x.l.g.date)}</div></a>` : '—'}</td>`; }).join('')}</tr>`).join('')}</table></div>
      <div class="note" style="margin-top:10px">Si un jugador repitió su máximo en varios partidos, se muestra el primero.</div></section>`;
  }
  // récords de un partido de la temporada
  const RK = [['PTS', 'Puntos'], ['REB', 'Rebotes'], ['AST', 'Asistencias'], ['STL', 'Robos'], ['BLK', 'Tapones'], ['3PM', 'Triples'], ['FTM', 'Tiros libres'], ['VAL', 'Valoración']];
  const sl = linesOf(s);
  const recs = RK.map(([k, l]) => { const t = sl.filter(x => x[k] != null).sort((a, b) => b[k] - a[k])[0]; return t && t[k] ? `<a href="#/partido/${encodeURIComponent(t.gid)}" class="card sm" style="color:var(--tx)"><div class="lbl">${l}</div><div class="big acc" style="font-size:40px">${nf(t[k])}</div><div style="font-weight:700">${esc(t.p)}</div><div class="small mut">vs ${esc(t.g.rival)} · ${fd(t.g.date)}</div></a>` : ''; }).join('');
  return `<div class="pagehead"><div><h1>Estadísticas</h1><div class="sub">${sub}</div></div>
    <div class="pills">${STAT_VIEWS.map(([k, l]) => `<button type="button" class="${view === k ? 'on' : ''}" onclick="go('estadisticas/${k}')">${l}</button>`).join('')}</div></div>
  <section class="sec">${T.names.length ? `<div class="tw"><table class="t sticky1"><tr><th>Jugador</th><th>PJ</th>${th}</tr>${rows}${teamRow}</table></div>
    <div class="note" style="margin-top:10px">${notes[view]} ${teamNote[view]} Atenuados: menos de ${T.m} partidos. Pulsa una columna para ordenar.</div>` : '<div class="empty">Aún no hay partidos jugados en esta temporada.</div>'}</section>
  ${extra}
  ${recs ? `<section class="sec"><div class="between" style="margin-bottom:14px"><h2>Récords de un partido</h2><span class="note">Mejores marcas individuales de la temporada, playoffs incluidos</span></div><div class="grid g4" style="gap:12px">${recs}</div></section>` : ''}
  <section class="sec grid g4" style="gap:14px">
    <div class="card sm"><div style="font-weight:700">Eficiencia (EFF)</div><div class="small tx2">Puntos + rebotes + asistencias + robos + tapones − tiros fallados − pérdidas.</div></div>
    <div class="card sm"><div style="font-weight:700">Valoración (VAL)</div><div class="small tx2">PTS + 1,2·REB + 1,5·AST + 2·(ROB + TAP) − 1,5·PÉR. Premia todo lo que aporta un jugador, no solo sus puntos.</div></div>
    <div class="card sm"><div style="font-weight:700">eFG% y TS%</div><div class="small tx2">eFG% da un 50% extra a los triples. TS% además cuenta los tiros libres: la mejor medida de acierto real.</div></div>
    <div class="card sm"><div style="font-weight:700">Por 36 minutos</div><div class="small tx2">Lo que haría cada jugador en 36 minutos a su ritmo. Iguala a quien juega mucho y a quien juega poco.</div></div></section>`;
};

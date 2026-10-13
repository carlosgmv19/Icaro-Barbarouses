/* Icaro Barbarouses · páginas del modo completo (2/2) */
'use strict';

/* ============ GRÁFICAS ============ */
const COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#9085e9'];
const GSTATS = [['PTS', 'Puntos'], ['REB', 'Rebotes'], ['AST', 'Asistencias'], ['STL', 'Robos'], ['BLK', 'Tapones'], ['TOV', 'Pérdidas'], ['MIN', 'Minutos'], ['PM', '+/−'], ['VAL', 'Valoración']];
const GSTATS_X = GSTATS.concat([['TS', 'TS%'], ['FGp', '% tiro'], ['p36PTS', 'Puntos/36'], ['p36REB', 'Rebotes/36']]);
function gval(a, k) { if (k === 'TS' || k === 'FGp') return isNum(a[k]) ? a[k] * 100 : null; if (k.startsWith('p36')) return a.p36[k.slice(3)]; return a.avg[k]; }
PAGES.graficas = () => {
  const s = S.season, sp = seasonPlayers(s, 'Liga'), games = gamesOf(s).filter(g => g.played);
  const names = Object.keys(sp).sort((a, b) => sp[b].gp - sp[a].gp || a.localeCompare(b));
  let sel = ui('gr.sel', null);
  if (!sel || !sel.every(p => sp[p])) { sel = names.slice().sort((a, b) => (sp[b].tot.MIN || 0) - (sp[a].tot.MIN || 0)).slice(0, 3); UI['gr.sel'] = sel; }
  const mode = ui('gr.mode', 'evo'), st = ui('gr.stat', 'PTS'), sy = ui('gr.y', 'REB'), em = ui('gr.em', 'game');
  const col = p => COLORS[sel.indexOf(p) % COLORS.length];
  const W = 900, H = 360, PADL = 48;
  let chart = '', caption = '';
  if (!names.length) chart = '<div class="empty">Aún no hay partidos jugados en esta temporada.</div>';
  else if (mode === 'evo') {
    const N = games.length; const xOf = i => PADL + (i + 0.5) * (W - PADL) / N;
    const valsOf = p => { const raw = games.map(g => { const l = (S.M.linesByGame[g.id] || []).find(x => x.p === p); return l ? l[st] : null; });
      if (em !== 'cum') return raw; let t = 0, c = 0; return raw.map(v => { if (v == null) return null; t += v; c++; return t / c; }); };
    const all = sel.flatMap(p => valsOf(p).filter(isNum));
    let lo = Math.min(0, ...all), hi = Math.max(1, ...all); const step = [1, 2, 5, 10, 20, 25, 50].find(x => (hi - lo) / x <= 6) || 50;
    lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step; const yOf = v => 10 + (H - 20) * (1 - (v - lo) / (hi - lo));
    let grid = ''; for (let v = lo; v <= hi + 1e-9; v += step) grid += `<line x1="${PADL}" x2="${W}" y1="${yOf(v)}" y2="${yOf(v)}" stroke="${v === 0 && lo < 0 ? '#5B6475' : '#262A33'}"/><text x="${PADL - 8}" y="${yOf(v) + 4}" text-anchor="end" fill="#A3AAB6" font-size="12">${nf(v)}</text>`;
    const xl = games.map((g, i) => `<text x="${xOf(i)}" y="${H + 18}" text-anchor="middle" fill="#A3AAB6" font-size="11">${g.label}</text>`).join('');
    const ser = sel.map(p => { const vs = valsOf(p); let d = '', pen = false; vs.forEach((v, i) => { if (!isNum(v)) { pen = false; return; } d += (pen ? 'L' : 'M') + xOf(i).toFixed(1) + ' ' + yOf(v).toFixed(1) + ' '; pen = true; });
      return `<path d="${d}" fill="none" stroke="${col(p)}" stroke-width="2.5" stroke-linejoin="round"/>` + vs.map((v, i) => isNum(v) ? `<circle cx="${xOf(i)}" cy="${yOf(v)}" r="4" fill="${col(p)}" stroke="#161920" stroke-width="2"><title>${esc(p)} · ${games[i].label} vs ${esc(games[i].rival)}: ${nf(v)}</title></circle>` : '').join(''); }).join('');
    chart = `<svg viewBox="0 0 ${W} ${H + 26}" style="width:100%;height:auto;min-width:640px" role="img" aria-label="Evolución">${grid}${xl}${ser}</svg>`;
    caption = `${(GSTATS.find(x => x[0] === st) || [, ''])[1]} ${em === 'cum' ? 'media acumulada' : 'partido a partido'} · ${s} (liga y playoffs). Un hueco es un partido que no jugó.`;
  } else if (mode === 'bars') {
    const ord = sel.slice().sort((a, b) => (gval(sp[b], st) || 0) - (gval(sp[a], st) || 0));
    const mx = Math.max(1e-9, ...ord.map(p => Math.abs(gval(sp[p], st) || 0)));
    chart = `<div class="stack" style="gap:14px">${ord.map(p => { const v = gval(sp[p], st) || 0; return `<div style="display:grid;grid-template-columns:110px minmax(0,1fr) 60px;gap:14px;align-items:center"><div style="font-weight:600">${esc(p)}</div><div style="height:26px;background:#1D212A;border-radius:6px;overflow:hidden"><i style="display:block;height:100%;width:${Math.abs(v) / mx * 100}%;background:${col(p)};border-radius:6px"></i></div><div style="text-align:right;font-weight:700">${st === 'PM' ? sg(v) : nf(v)}</div></div>`; }).join('')}</div>`;
    caption = `Media por partido de liga · ${s}.`;
  } else {
    const pts = names.filter(p => sp[p].gp >= minPJ(s)).map(p => ({ p, x: gval(sp[p], st), y: gval(sp[p], sy) })).filter(o => isNum(o.x) && isNum(o.y));
    const xs = pts.map(o => o.x), ys = pts.map(o => o.y);
    const x0 = Math.min(0, ...xs), x1 = Math.max(1, ...xs) * 1.1, y0 = Math.min(0, ...ys), y1 = Math.max(1, ...ys) * 1.1;
    const X = v => PADL + (v - x0) / (x1 - x0) * (W - PADL - 20), Y = v => 10 + (H - 30) * (1 - (v - y0) / (y1 - y0));
    chart = `<svg viewBox="0 0 ${W} ${H + 10}" style="width:100%;height:auto;min-width:560px" role="img" aria-label="Dispersión"><line x1="${PADL}" x2="${W}" y1="${Y(y0)}" y2="${Y(y0)}" stroke="#3A404C"/><line x1="${PADL}" x2="${PADL}" y1="10" y2="${Y(y0)}" stroke="#3A404C"/>
      ${pts.map(o => `<circle cx="${X(o.x)}" cy="${Y(o.y)}" r="8" fill="${sel.includes(o.p) ? col(o.p) : '#5B6475'}" opacity=".9"><title>${esc(o.p)}: ${nf(o.x)} / ${nf(o.y)}</title></circle><text x="${X(o.x) + 12}" y="${Y(o.y) + 4}" fill="#F1F2F4" font-size="13">${esc(o.p)}</text>`).join('')}
      <text x="${W}" y="${H + 6}" text-anchor="end" fill="#A3AAB6" font-size="12">${esc((GSTATS_X.find(x => x[0] === st) || [, ''])[1])} →</text><text x="${PADL + 6}" y="22" fill="#A3AAB6" font-size="12">↑ ${esc((GSTATS_X.find(x => x[0] === sy) || [, ''])[1])}</text></svg>`;
    caption = `Cada punto es un jugador con al menos ${minPJ(s)} partidos de liga. Los marcados en la lista salen en color.`;
  }
  const tog = p => { const a = sel.slice(); const i = a.indexOf(p); if (i >= 0) a.splice(i, 1); else if (a.length < 6) a.push(p); return a; };
  const statList = mode === 'scatter' ? GSTATS_X : GSTATS;
  const tbl = sel.map(p => { const vs = sp[p].lines.slice().sort((a, b) => a.g.date.localeCompare(b.g.date)).map(l => l[st]).filter(isNum); const k = st.startsWith('p36') || st === 'TS' || st === 'FGp' ? null : st;
    return `<tr><td><span class="row" style="gap:8px"><i style="width:12px;height:12px;border-radius:3px;background:${col(p)}"></i>${plink(p)}</span></td><td>${sp[p].gp}</td><td>${nf(gval(sp[p], st))}</td><td>${k && vs.length ? nf(Math.max(...vs)) : '—'}</td><td>${k && vs.length ? nf(Math.min(...vs)) : '—'}</td><td>${k ? vs.slice(-5).map(nf).join(' · ') : '—'}</td></tr>`; }).join('');
  return `<div class="pagehead"><div><h1>Gráficas</h1><div class="sub">Marca jugadores en la lista y elige qué quieres ver</div></div>${pills('gr.mode', [['evo', 'Evolución'], ['bars', 'Comparar'], ['scatter', 'Dispersión']], mode)}</div>
  <section class="sec grid" style="grid-template-columns:260px minmax(0,1fr);gap:24px" id="gr-grid">
    <div class="card sm stack" style="gap:6px;align-self:start"><div class="between"><strong>Jugadores</strong><span class="small mut">${sel.length}/6</span></div>
      ${names.map(p => `<button type="button" ${on('gr.sel', tog(p))} style="display:flex;align-items:center;gap:10px;height:44px;padding:0 10px;border-radius:10px;border:1px solid ${sel.includes(p) ? 'var(--line2)' : 'transparent'};background:${sel.includes(p) ? 'var(--card2)' : 'transparent'};cursor:pointer;text-align:left">
        <span style="width:20px;height:20px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#0E1014;${sel.includes(p) ? 'background:' + col(p) : 'border:2px solid #5B6475'}">${sel.includes(p) ? '✓' : ''}</span><span style="flex:1;font-weight:600">${esc(p)}</span><span class="small mut">${sp[p].gp} PJ</span></button>`).join('')}
      <div class="row" style="gap:8px;margin-top:6px"><button type="button" class="chip" ${on('gr.sel', [])}>Quitar todos</button><button type="button" class="chip" ${on('gr.sel', names.slice().sort((a, b) => (sp[b].tot.MIN || 0) - (sp[a].tot.MIN || 0)).slice(0, 5))}>Los 5 con más min.</button></div>
      ${sel.length >= 6 ? '<div class="small mut">Máximo 6 a la vez.</div>' : ''}</div>
    <div class="stack" style="gap:16px;min-width:0">
      <div class="chips"><span class="small mut" style="align-self:center">${mode === 'scatter' ? 'Eje horizontal' : 'Estadística'}</span>${statList.map(([k, l]) => `<button type="button" class="chip ${st === k ? 'on' : ''}" ${on('gr.stat', k)}>${l}</button>`).join('')}</div>
      ${mode === 'scatter' ? `<div class="chips"><span class="small mut" style="align-self:center">Eje vertical</span>${GSTATS_X.map(([k, l]) => `<button type="button" class="chip ${sy === k ? 'on' : ''}" ${on('gr.y', k)}>${l}</button>`).join('')}</div>` : ''}
      ${mode === 'evo' ? `<div class="chips">${[['game', 'Partido a partido'], ['cum', 'Media acumulada']].map(([k, l]) => `<button type="button" class="chip ${em === k ? 'on' : ''}" ${on('gr.em', k)}>${l}</button>`).join('')}</div>` : ''}
      <div class="card" style="overflow-x:auto">${mode !== 'scatter' && sel.length ? `<div class="row" style="gap:16px;flex-wrap:wrap;margin-bottom:12px">${sel.map(p => `<span class="row small" style="gap:6px"><i style="width:12px;height:12px;border-radius:3px;background:${col(p)}"></i>${esc(p)}</span>`).join('')}</div>` : ''}${sel.length || mode === 'scatter' ? chart : '<div class="empty">Marca algún jugador en la lista.</div>'}<div class="note" style="margin-top:12px">${caption}</div></div>
      ${mode !== 'scatter' && sel.length ? `<div><h3 style="margin-bottom:12px">En números</h3><div class="tw"><table class="t"><tr><th>Jugador</th><th>PJ</th><th>Media</th><th>Máximo</th><th>Mínimo</th><th>Últimos 5</th></tr>${tbl}</table></div></div>` : ''}
    </div></section>`;
};

/* ============ QUINTETOS ============ */
PAGES.quintetos = () => {
  const s = S.season;
  const L = S.M.lineups.filter(r => r.season === s);
  const head = `<div class="pagehead"><div><h1>Quintetos</h1><div class="sub">Qué cinco funcionan mejor juntos: minutos en pista, puntos a favor y en contra, y acierto en el tiro</div></div></div>`;
  if (!L.length) return head + `<section class="sec"><div class="empty">No hay quintetos apuntados en la temporada ${esc(s)}. Se registran desde la 26/27 con la herramienta de apuntar partidos: en cuanto se envíe el primer partido aparecerán aquí.</div></section>`;
  const by = {};
  L.forEach(r => { const k = r.five.join('|'); const a = by[k] || (by[k] = { five: r.five, min: 0, pf: 0, pc: 0, t2m: 0, t2a: 0, t3m: 0, t3a: 0, tlm: 0, tla: 0 }); ['min', 'pf', 'pc', 't2m', 't2a', 't3m', 't3a', 'tlm', 'tla'].forEach(x => a[x] += r[x]); });
  const inc = ui('q.inc', []), mm = ui('q.min', 0), so = ui('q.sort', 'min');
  const players = uniq(L.flatMap(r => r.five)).sort();
  let rows = Object.values(by).filter(a => inc.every(p => a.five.includes(p)) && a.min >= mm);
  rows.forEach(a => { a.pm = a.pf - a.pc; a.net = a.min ? a.pm * 36 / a.min : 0; });
  rows.sort((a, b) => b[so] - a[so]);
  const totMin = sum(L, r => r.min);
  const shot = (m, a) => `<div style="font-weight:600">${a ? pc0(m / a) : '—'}</div><div class="small mut">${m}/${a}</div>`;
  const tog = p => inc.includes(p) ? inc.filter(x => x !== p) : inc.concat(p);
  // con y sin cada jugador
  const onoff = players.map(p => { const onL = L.filter(r => r.five.includes(p)), off = L.filter(r => !r.five.includes(p));
    const m1 = sum(onL, r => r.min), m0 = sum(off, r => r.min); const n1 = m1 ? sum(onL, r => r.pf - r.pc) * 36 / m1 : null, n0 = m0 ? sum(off, r => r.pf - r.pc) * 36 / m0 : null;
    return { p, m1, m0, n1, n0, d: isNum(n1) && isNum(n0) ? n1 - n0 : null }; }).sort((a, b) => (b.d ?? -1e9) - (a.d ?? -1e9));
  const pairs = {}; L.forEach(r => { for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) { const k = r.five[i] + '|' + r.five[j]; const a = pairs[k] || (pairs[k] = { k, min: 0, pf: 0, pc: 0 }); a.min += r.min; a.pf += r.pf; a.pc += r.pc; } });
  const pr = Object.values(pairs).sort((a, b) => b.min - a.min).slice(0, 10);
  return head + `<section class="sec stack" style="gap:16px">
    <div class="chips"><span class="small mut" style="align-self:center">Quintetos que incluyan a</span>${players.map(p => `<button type="button" class="chip ${inc.includes(p) ? 'on' : ''}" ${on('q.inc', tog(p))}>${esc(p)}</button>`).join('')}</div>
    <div class="row" style="gap:24px;flex-wrap:wrap"><div class="chips"><span class="small mut" style="align-self:center">Minutos juntos</span>${[0, 5, 10, 20].map(m => `<button type="button" class="chip ${mm === m ? 'on' : ''}" ${on('q.min', m)}>${m ? '≥ ' + m : 'Todos'}</button>`).join('')}</div>
      <div class="chips"><span class="small mut" style="align-self:center">Ordenar por</span>${[['min', 'Minutos'], ['net', '+/− por 36'], ['pm', '+/−']].map(([k, l]) => `<button type="button" class="chip ${so === k ? 'on' : ''}" ${on('q.sort', k)}>${l}</button>`).join('')}</div></div>
    ${rows.length ? `<div class="tw"><table class="t sticky1"><tr><th>Quinteto</th><th>Min</th><th>Marcador</th><th>+/−</th><th>Tiros de 2</th><th>Triples</th><th>T. libres</th><th>+/− por 36</th></tr>
      ${rows.map(a => { const pts = 2 * a.t2m + 3 * a.t3m + a.tlm; return `<tr><td style="white-space:normal;min-width:260px"><div style="font-weight:600">${a.five.map(p => plink(p)).join(' · ')}</div>${pts ? `<div class="small mut">De 2 ${pc0(2 * a.t2m / pts)} · triples ${pc0(3 * a.t3m / pts)} · libres ${pc0(a.tlm / pts)}</div>` : ''}</td><td>${nf(a.min)}<div class="small mut">${pc0(a.min / totMin)}</div></td><td>${a.pf}–${a.pc}</td><td class="${a.pm > 0 ? 'best' : ''}">${sg(a.pm)}</td><td>${shot(a.t2m, a.t2a)}</td><td>${shot(a.t3m, a.t3a)}</td><td>${shot(a.tlm, a.tla)}</td><td style="font-weight:700" class="${a.net > 0 ? 'acc' : ''}">${sg(a.net)}</td></tr>`; }).join('')}</table></div>` : '<div class="empty">Ningún quinteto cumple el filtro.</div>'}
    <div class="note">+/− por 36 min = diferencia de puntos si ese quinteto jugara 36 minutos a ese ritmo. Con pocos minutos es muy volátil: mira también la columna Min. Los tiros son los del equipo mientras ese quinteto está en pista (metidos/intentados).</div></section>
  <section class="sec grid g2" style="gap:24px">
    <div class="card stack"><h3>Con y sin cada jugador</h3><div class="note">+/− por 36 min del equipo con él en pista y en el banquillo</div>
      <div style="overflow-x:auto"><table class="t"><tr><th>Jugador</th><th>Min</th><th>En pista</th><th>Fuera</th><th>Diferencia</th></tr>${onoff.map(o => `<tr><td>${plink(o.p)}</td><td>${nf(o.m1)}</td><td>${sg(o.n1)}</td><td style="${o.m0 < 60 ? 'opacity:.5' : ''}">${sg(o.n0)}</td><td class="${o.d > 0 ? 'best' : ''}">${sg(o.d)}</td></tr>`).join('')}</table>
      <div class="note">"Fuera" con menos de 60 minutos no es fiable: sale atenuado.</div></div>
    <div class="card stack"><h3>Parejas</h3><div class="note">Las 10 parejas con más minutos juntas</div>
      <table class="t"><tr><th>Pareja</th><th>Min</th><th>Marcador</th><th>/36</th></tr>${pr.map(a => `<tr><td>${a.k.split('|').map(p => plink(p)).join(' + ')}</td><td>${nf(a.min)}</td><td>${a.pf}–${a.pc}</td><td class="${a.pf > a.pc ? 'best' : ''}">${sg((a.pf - a.pc) * 36 / a.min)}</td></tr>`).join('')}</table></div></section>`;
};

/* ============ RÉCORDS ============ */
PAGES.records = R => {
  const tab = ['partido', 'temporada', 'carrera', 'equipo'].includes(R.arg) ? R.arg : 'partido';
  const all = S.M.lines;
  const RK = [['PTS', 'Puntos'], ['REB', 'Rebotes'], ['AST', 'Asistencias'], ['STL', 'Robos'], ['BLK', 'Tapones'], ['3PM', 'Triples'], ['FTM', 'Tiros libres'], ['VAL', 'Valoración']];
  const topG = k => all.filter(l => isNum(l[k])).sort((a, b) => b[k] - a[k] || a.g.date.localeCompare(b.g.date)).slice(0, 3);
  // medias de temporada (mínimo de partidos)
  const seasonAv = [];
  S.M.playedSeasons.forEach(s => { const sp = seasonPlayers(s, 'Liga'); const need = Math.min(8, minPJ(s) + 3); Object.keys(sp).forEach(p => { if (sp[p].gp >= need) seasonAv.push({ p, s, a: sp[p] }); }); });
  const car = {}; all.forEach(l => (car[l.p] = car[l.p] || []).push(l));
  const career = Object.keys(car).map(p => ({ p, a: agg(car[p]) }));
  const h1 = topG('PTS')[0], h2 = topG('REB')[0];
  const bestAvg = seasonAv.slice().sort((a, b) => b.a.avg.PTS - a.a.avg.PTS)[0];
  const bestCar = career.slice().sort((a, b) => b.a.tot.PTS - a.a.tot.PTS)[0];
  const hero = [h1 && ['Más puntos en un partido', nf(h1.PTS), h1.p, `vs ${esc(h1.g.rival)} · ${fdy(h1.g.date)}`], h2 && ['Más rebotes en un partido', nf(h2.REB), h2.p, `vs ${esc(h2.g.rival)} · ${fdy(h2.g.date)}`],
    bestAvg && ['Mejor media anotadora', n1(bestAvg.a.avg.PTS), bestAvg.p, `Temporada ${bestAvg.s} · ${bestAvg.a.gp} partidos`], bestCar && ['Máximo anotador histórico', nf(bestCar.a.tot.PTS), bestCar.p, `${bestCar.a.gp} partidos · ${n1(bestCar.a.avg.PTS)} de media`]].filter(Boolean);
  let body = '';
  if (tab === 'partido') body = `<div class="grid g4" style="gap:14px">${RK.map(([k, l]) => `<div class="card sm stack" style="gap:10px"><div class="lbl">${l}</div>${topG(k).map((t, i) => `<a href="#/partido/${encodeURIComponent(t.gid)}" class="row" style="gap:12px;color:var(--tx);align-items:baseline"><span class="mut small">${i + 1}</span><span class="cond" style="font-weight:800;font-size:${i ? 26 : 36}px;color:${i ? 'var(--tx2)' : 'var(--acc)'}">${nf(t[k])}</span><span style="flex:1"><strong>${esc(t.p)}</strong><div class="small mut">vs ${esc(t.g.rival)} · ${fd(t.g.date)} ${t.season}</div></span></a>`).join('')}</div>`).join('')}</div>`;
  else if (tab === 'temporada') body = `<div class="grid g3" style="gap:14px">${[['PTS', 'Puntos'], ['REB', 'Rebotes'], ['AST', 'Asistencias'], ['STL', 'Robos'], ['BLK', 'Tapones'], ['VAL', 'Valoración']].map(([k, l]) => `<div class="card sm stack" style="gap:10px"><div class="lbl">${l}</div>${seasonAv.slice().sort((a, b) => (b.a.avg[k] || 0) - (a.a.avg[k] || 0)).slice(0, 3).map((t, i) => `<div class="row" style="gap:12px;align-items:baseline"><span class="cond" style="font-weight:800;font-size:${i ? 26 : 36}px;color:${i ? 'var(--tx2)' : 'var(--acc)'}">${n1(t.a.avg[k])}</span><span>${plink(t.p, '<strong>' + esc(t.p) + '</strong>')}<div class="small mut">${t.s} · ${t.a.gp} PJ</div></span></div>`).join('')}</div>`).join('')}</div><div class="note" style="margin-top:12px">Medias por partido de liga en una temporada, con un mínimo de partidos jugados.</div>`;
  else if (tab === 'carrera') {
    const cs = ui('rc.sort', 'PTS'); const CL = [['gp', 'PJ'], ['PTS', 'Puntos'], ['REB', 'Rebotes'], ['AST', 'Asist.'], ['STL', 'Robos'], ['BLK', 'Tapones'], ['MIN', 'Minutos']];
    const v = (r, k) => k === 'gp' ? r.a.gp : r.a.tot[k];
    const rows = career.slice().sort((a, b) => (v(b, cs) || 0) - (v(a, cs) || 0)); const best = {}; CL.forEach(([k]) => best[k] = Math.max(...career.map(r => v(r, k) || 0)));
    body = `<div class="tw"><table class="t"><tr><th>#</th><th class="l">Jugador</th>${CL.map(([k, l]) => `<th class="${cs === k ? 'sorted' : ''}"><button ${on('rc.sort', k)}>${l}${cs === k ? ' ↓' : ''}</button></th>`).join('')}</tr>
      ${rows.map((r, i) => { const act = (S.M.players[r.p] || {}).activo; return `<tr style="${act ? '' : 'opacity:.6'}"><td class="mut">${i + 1}</td><td class="l">${plink(r.p)}${act ? '' : ' <span class="small mut">· ya no está</span>'}</td>${CL.map(([k]) => `<td class="${v(r, k) === best[k] ? 'best' : ''}" style="${cs === k ? 'font-weight:700' : ''}">${nf(v(r, k))}</td>`).join('')}</tr>`; }).join('')}</table></div><div class="note" style="margin-top:10px">Totales acumulados de todas las temporadas registradas, liga y playoffs.</div>`;
  } else {
    const G = S.M.games.filter(g => g.played);
    const by = (f, d) => G.slice().sort((a, b) => d * (f(b) - f(a)))[0];
    const mPF = by(g => g.pf, 1), mW = G.filter(g => g.res === 'V').sort((a, b) => (b.pf - b.pc) - (a.pf - a.pc))[0], mPC = by(g => g.pc, -1);
    let bq = null; G.forEach(g => g.q.forEach((x, i) => { if (isNum(x.f) && (!bq || x.f > bq.v)) bq = { v: x.f, c: x.c, i, g }; }));
    const str = bestStreak(G);
    const wins = S.M.playedSeasons.map(s => ({ s, r: teamRecord(s) })).sort((a, b) => b.r.V - a.r.V)[0];
    const T = [mPF && ['Más puntos anotados', mPF.pf, `${mPF.pf}–${mPF.pc} vs ${esc(mPF.rival)} · ${fdy(mPF.date)}`, mPF], mW && ['Victoria más amplia', sg(mW.pf - mW.pc), `${mW.pf}–${mW.pc} vs ${esc(mW.rival)} · ${fdy(mW.date)}`, mW],
      mPC && ['Menos puntos encajados', mPC.pc, `${mPC.pf}–${mPC.pc} vs ${esc(mPC.rival)} · ${fdy(mPC.date)}`, mPC], bq && ['Mejor cuarto', bq.v, `${bq.i + 1}º cuarto, ${bq.v}–${bq.c} vs ${esc(bq.g.rival)} · ${fdy(bq.g.date)}`, bq.g],
      ['Racha de victorias', str.n, str.n ? fd(str.from.date) + (str.n > 1 ? ' – ' + fdy(str.to.date) : '') : '—'], wins && ['Victorias en una liga', wins.r.V, `Temporada ${wins.s} (${wins.r.V}–${wins.r.D})`]].filter(Boolean);
    body = `<div class="grid g3" style="gap:14px">${T.map(t => `${t[3] ? `<a href="#/partido/${encodeURIComponent(t[3].id)}" class="card sm" style="color:var(--tx)">` : '<div class="card sm">'}<div class="lbl">${t[0]}</div><div class="big acc">${t[1]}</div><div class="small tx2">${t[2]}</div>${t[3] ? '</a>' : '</div>'}`).join('')}</div>`;
  }
  const first = S.M.playedSeasons[S.M.playedSeasons.length - 1];
  return `<div class="pagehead"><div><h1>Récords del club</h1><div class="sub">Desde la ${esc(first || '')} · liga y playoffs · se actualizan solos con cada partido</div></div></div>
  <section class="sec grid g4" style="gap:14px">${hero.map(h => `<div class="card hl sm"><div class="lbl" style="color:var(--acc2)">${h[0]}</div><div class="big">${h[1]}</div><div style="font-weight:700">${plink(h[2])}</div><div class="small mut">${h[3]}</div></div>`).join('')}</section>
  <section class="sec stack" style="gap:18px"><div class="pills" style="align-self:flex-start">${[['partido', 'Un partido'], ['temporada', 'Una temporada'], ['carrera', 'Carrera'], ['equipo', 'Equipo']].map(([k, l]) => `<button type="button" class="${tab === k ? 'on' : ''}" onclick="go('records/${k}')">${l}</button>`).join('')}</div>${body}</section>`;
};

/* ============ JUGADAS ============ */
PAGES.jugadas = () => {
  if (!CLIPS) { loadClips().then(() => render()); return `<div class="pagehead"><div><h1>Jugadas</h1><div class="sub">Cargando jugadas…</div></div></div>`; }
  const fw = ui('jg.who', null), fk = ui('jg.kw', null), fj = ui('jg.j', null);
  const shown = CLIPS.filter(c => (!fw || (fw === 'Equipo' ? !c.who.length : c.who.includes(fw))) && (!fk || c.kw.includes(fk)) && (!fj || c.season + ' ' + c.jor === fj));
  const whos = uniq(CLIPS.flatMap(c => c.who.length ? c.who : ['Equipo'])), kws = uniq(CLIPS.flatMap(c => c.kw)), jors = uniq(CLIPS.map(c => c.season + ' ' + c.jor));
  const chipRow = (lbl, k, list, cur, cnt) => `<div class="chips"><span class="small mut" style="align-self:center;min-width:70px">${lbl}</span><button type="button" class="chip ${!cur ? 'on' : ''}" ${on(k, null)}>Todas</button>${list.map(x => `<button type="button" class="chip ${cur === x ? 'on' : ''}" ${on(k, x)}>${esc(x)} <small>${cnt(x)}</small></button>`).join('')}</div>`;
  return `<div class="pagehead"><div><h1>Jugadas</h1><div class="sub">Los mejores momentos del equipo · filtra por jugador, tipo de jugada y jornada</div></div><div class="mut">${shown.length === CLIPS.length ? CLIPS.length + ' jugadas' : shown.length + ' de ' + CLIPS.length}</div></div>
  <section class="sec stack" style="gap:12px">${CLIPS.length ? chipRow('Jugador', 'jg.who', whos, fw, x => CLIPS.filter(c => x === 'Equipo' ? !c.who.length : c.who.includes(x)).length) + chipRow('Tipo', 'jg.kw', kws, fk, x => CLIPS.filter(c => c.kw.includes(x)).length) + chipRow('Jornada', 'jg.j', jors, fj, x => CLIPS.filter(c => c.season + ' ' + c.jor === x).length) : ''}</section>
  <section class="sec">${shown.length ? `<div class="grid g3">${shown.map(c => clipCard(c)).join('')}</div>` : CLIPS.length ? `<div class="empty">Ninguna jugada con esos filtros. <button class="chip" onclick="UI['jg.who']=UI['jg.kw']=UI['jg.j']=null;render()">Quitar filtros</button></div>` : '<div class="empty">Todavía no hay jugadas subidas. Se cortan con la herramienta Recortar jugadas y se suben a la carpeta jugadas.</div>'}
  <div class="note" style="margin-top:12px">Las jugadas con varios protagonistas salen también en la ficha de cada uno.</div></section>`;
};

/* ============ ASISTENCIA ============ */
function sendConv(gid, season) {
  const who = ui('as.who', ls.get('icaros:yo', '')), est = ui('as.est', null), com = ($('#as-com') || {}).value || '';
  if (!who) return toast('Elige quién eres');
  if (est == null) return toast('Elige si puedes venir');
  if (S.ejemplo) return toast('La web aún no está conectada al Sheet: no se puede guardar');
  ls.set('icaros:yo', who);
  const b = $('#as-send'); if (b) { b.disabled = true; b.textContent = 'Enviando…'; }
  fetch(CFG.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'convocatoria', temporada: season, partidoId: gid, jugador: who, estado: est, comentario: com }) })
    .then(r => r.json()).then(j => {
      if (!j.ok) throw new Error(j.error);
      S.M.conv = S.M.conv.filter(c => !(c.gid === gid && c.p === who)).concat({ season, gid, p: who, estado: est, com, t: j.fecha || new Date().toISOString() });
      UI['as.saved'] = j.actualizado ? 'Respuesta cambiada ✓' : 'Respuesta guardada ✓'; toast(UI['as.saved']); render(); reload();
    }).catch(e => { console.error(e); toast('No se ha podido enviar. Prueba otra vez.'); if (b) { b.disabled = false; b.textContent = 'Enviar respuesta'; } });
}
function pickWho(p) { UI['as.est'] = undefined; UI['as.saved'] = ''; setUI('as.who', p); }
function convForm(g, basic) {
  const roster = Object.values(S.M.players).filter(p => p.activo).map(p => p.name).sort();
  const who = ui('as.who', ls.get('icaros:yo', '')), est = ui('as.est', null);
  const by = convOf(g); if (who && by[who] && UI['as.est'] === undefined) UI['as.est'] = by[who].estado;
  const cur = ui('as.est', null);
  return `<div class="${basic ? 'bcard' : 'card'} stack" style="gap:16px"><div><strong style="font-size:18px">¿Vienes? Responde aquí</strong>${UI['as.saved'] ? `<div class="small acc">${UI['as.saved']}</div>` : ''}</div>
    <div class="stack" style="gap:8px"><div class="lbl">1 · ¿Quién eres?</div><div class="chips">${roster.map(p => `<button type="button" class="chip ${who === p ? 'on' : ''}" onclick="pickWho(${esc(JSON.stringify(p))})">${esc(p)}</button>`).join('')}</div></div>
    <div class="stack" style="gap:8px"><div class="lbl">2 · ¿Puedes venir?</div><div class="chips">${ESTADOS.map((l, i) => `<button type="button" class="chip ${cur === i ? 'on' : ''}" ${on('as.est', i)}>${l}</button>`).join('')}</div></div>
    ${basic ? '' : `<div class="stack" style="gap:8px"><div class="lbl">3 · Comentario (opcional)</div><input id="as-com" maxlength="200" value="${esc(who && by[who] ? by[who].com : '')}" placeholder="Llego tarde, voy directo…" style="background:var(--bg);border:1px solid var(--line2);border-radius:10px;color:var(--tx);padding:12px;font:inherit"></div>`}
    <button type="button" class="btn" id="as-send" style="align-self:flex-start" onclick="sendConv('${esc(g.id)}','${esc(g.season)}')">Enviar respuesta</button></div>`;
}
PAGES.asistencia = () => {
  const g = nextGame();
  const by = g ? convOf(g) : {};
  const roster = Object.values(S.M.players).filter(p => p.activo).map(p => p.name);
  const groups = [[4, 3], [2], [1], [0]].map(es => ({ es, list: Object.values(by).filter(c => es.includes(c.estado)) }));
  const lbl = ['Van', 'Seguramente', '75% que no', 'No pueden'];
  const pending = roster.filter(p => !by[p]);
  // temporada partido a partido
  const s = S.season, gs = gamesOf(s).filter(x => x.played || x.estado === 'No disputado');
  const ps = uniq(gs.flatMap(x => (S.M.linesByGame[x.id] || []).map(l => l.p)));
  const cnt = p => gs.filter(x => (S.M.linesByGame[x.id] || []).some(l => l.p === p)).length;
  ps.sort((a, b) => cnt(b) - cnt(a));
  const played = gs.filter(x => x.played && (S.M.linesByGame[x.id] || []).length);
  const avgN = played.length ? sum(played, x => S.M.linesByGame[x.id].length) / played.length : 0;
  const five = played.filter(x => S.M.linesByGame[x.id].length === 5).length;
  return `<div class="pagehead"><div><h1>Asistencia</h1><div class="sub">Convocatoria del próximo partido y quién ha estado en cada jornada</div></div></div>
  ${g ? `<section class="sec grid" style="grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:24px" id="as-grid">
    <div class="stack" style="gap:16px"><div class="card hl"><div class="lbl" style="color:var(--acc2)">Próximo partido · vs ${esc(g.rival)} · ${fdw(g.date)}${g.hora ? ', ' + esc(g.hora) : ''}</div><div class="small tx2" style="margin-top:6px">Puedes cambiar tu respuesta cuando quieras.</div></div>${convForm(g)}</div>
    <div class="card stack" style="gap:14px">${groups.map((x, i) => `<div><div class="between"><strong>${lbl[i]}</strong><span class="mut">${x.list.length}</span></div><div class="stack" style="gap:4px;margin-top:6px">${x.list.map(c => `<div class="row small"><span style="flex:1">${esc(c.p)}${c.com ? ` <span class="mut">· ${esc(c.com)}</span>` : ''}</span><span class="mut">${c.t ? fd(String(c.t).slice(0, 10)) : ''}</span></div>`).join('') || '<div class="small dim">—</div>'}</div></div>`).join('')}
      <div><div class="between"><strong>Sin responder</strong><span class="mut">${pending.length}</span></div><div class="small mut" style="margin-top:6px">${pending.map(esc).join(' · ') || '—'}</div></div></div></section>` : `<section class="sec"><div class="empty">No hay ningún partido programado ahora mismo.</div></section>`}
  ${gs.length && ps.length ? `<section class="sec"><div class="between" style="margin-bottom:14px"><h2>Temporada ${esc(s)} partido a partido</h2><div class="row small mut" style="gap:14px"><span>● Jugó</span><span>○ No pudo</span></div></div>
    <div class="tw"><table class="t sticky1"><tr><th>Jugador</th>${gs.map(x => `<th title="${esc(x.rival)} · ${fd(x.date)}">${x.label}</th>`).join('')}<th>Jugados</th></tr>
    ${ps.map(p => `<tr><td>${plink(p)}</td>${gs.map(x => { const inn = (S.M.linesByGame[x.id] || []).some(l => l.p === p); return `<td style="text-align:center;color:${inn ? 'var(--acc)' : 'var(--dim)'}">${x.played ? (inn ? '●' : '○') : '–'}</td>`; }).join('')}<td style="font-weight:700">${cnt(p)} <span class="small mut">· ${pc0(cnt(p) / Math.max(1, played.length))}</span></td></tr>`).join('')}
    <tr><td class="mut">Jugadores</td>${gs.map(x => `<td style="text-align:center" class="mut">${(S.M.linesByGame[x.id] || []).length || '–'}</td>`).join('')}<td></td></tr></table></div>
    <div class="note" style="margin-top:10px">Media de ${n1(avgN)} jugadores por partido${five ? `, y ${five} de los ${played.length} partidos se jugaron con 5 (sin ningún cambio)` : ''}.</div></section>` : ''}`;
};

/* ============ HISTÓRICO ============ */
PAGES.historico = () => {
  const ss = S.M.playedSeasons;
  if (ss.length < 2) return `<div class="pagehead"><div><h1>Histórico</h1></div></div><section class="sec"><div class="empty">Hace falta más de una temporada con partidos para comparar.</div></section>`;
  const a = ui('h.a', ss[1]), b = ui('h.b', ss[0]);
  const ra = teamRecord(a), rb = teamRecord(b);
  const spA = seasonPlayers(a, 'Liga'), spB = seasonPlayers(b, 'Liga');
  const common = Object.keys(spA).filter(p => spB[p]);
  const st = ui('h.st', 'PTS');
  const HS = [['PTS', 'Puntos'], ['REB', 'Rebotes'], ['AST', 'Asistencias'], ['STL', 'Robos'], ['BLK', 'Tapones'], ['MIN', 'Minutos'], ['VAL', 'Valoración']];
  const rows = common.map(p => { const x = spA[p].avg[st], y = spB[p].avg[st]; return { p, x, y, d: isNum(x) && isNum(y) ? y - x : null, pct: isNum(x) && x ? (y - x) / Math.abs(x) : null }; }).sort((u, v) => (v.d ?? -1e9) - (u.d ?? -1e9));
  const ALL = [['gp', 'PJ'], ['MIN', 'MIN'], ['PTS', 'PTS'], ['REB', 'REB'], ['AST', 'AST'], ['STL', 'ROB'], ['BLK', 'TAP'], ['TOV', 'PÉR'], ['FGp', 'TC%'], ['TPp', 'T3%'], ['FTp', 'TL%'], ['VAL', 'VAL']];
  const gv = (A, k) => k === 'gp' ? A.gp : ['FGp', 'TPp', 'FTp'].includes(k) ? A[k] : A.avg[k];
  const cell = (p, k) => { const x = gv(spA[p], k), y = gv(spB[p], k); if (!isNum(x) || !isNum(y)) return '<td>—</td>';
    if (['FGp', 'TPp', 'FTp'].includes(k)) { const d = (y - x) * 100; return `<td class="${d > 0 ? 'acc' : ''}">${sg(d)} pp</td>`; }
    if (!x) return '<td>—</td>'; let d = (y - x) / Math.abs(x); const good = k === 'TOV' ? d < 0 : d > 0; return `<td class="${good ? 'acc' : ''}">${d > 0 ? '+' : ''}${Math.round(d * 100)}%</td>`; };
  const team = [['Partidos de liga', ra.n, rb.n], ['Victorias', ra.V, rb.V], ['Puntos a favor', ra.pf, rb.pf], ['Puntos en contra', ra.pc, rb.pc]];
  const onlyA = Object.keys(spA).filter(p => !spB[p]), onlyB = Object.keys(spB).filter(p => !spA[p]);
  const sel = (k, cur) => `<div class="pills">${ss.map(x => `<button type="button" class="${cur === x ? 'on' : ''}" ${on(k, x)}>${x}</button>`).join('')}</div>`;
  const mini = (title, list, A) => `<div class="card stack"><h3>${title}</h3>${list.length ? `<table class="t"><tr><th>Jugador</th><th>PJ</th><th>PTS</th><th>REB</th><th>AST</th></tr>${list.map(p => `<tr><td>${plink(p)}</td><td>${A[p].gp}</td><td>${n1(A[p].avg.PTS)}</td><td>${n1(A[p].avg.REB)}</td><td>${n1(A[p].avg.AST)}</td></tr>`).join('')}</table>` : '<div class="note">Nadie.</div>'}</div>`;
  return `<div class="pagehead"><div><h1>Histórico</h1><div class="sub">Medias por partido de liga: elige dos temporadas y compara</div></div>
    <div class="row" style="gap:14px;flex-wrap:wrap"><div><div class="small mut" style="margin-bottom:6px">Temporada base</div>${sel('h.a', a)}</div><div class="cond" style="font-size:28px;align-self:flex-end">→</div><div><div class="small mut" style="margin-bottom:6px">Comparar con</div>${sel('h.b', b)}</div></div></div>
  <section class="sec grid g4" style="gap:14px">${team.map(t => `<div class="card sm"><div class="lbl">${t[0]}</div><div class="big">${nf(t[2])}</div><div class="small mut">${b} · antes ${nf(t[1])} en ${a}</div></div>`).join('')}</section>
  <section class="sec"><div class="between" style="margin-bottom:14px"><h2>¿Quién ha mejorado?</h2><span class="mut">${common.length} jugadores en las dos temporadas</span></div>
    <div class="chips" style="margin-bottom:14px">${HS.map(([k, l]) => `<button type="button" class="chip ${st === k ? 'on' : ''}" ${on('h.st', k)}>${l}</button>`).join('')}</div>
    ${rows.length ? `<div class="tw"><table class="t"><tr><th>Jugador</th><th>${a}</th><th>${b}</th><th>Cambio</th><th>%</th></tr>${rows.map(r => `<tr><td>${plink(r.p)}</td><td class="mut">${n1(r.x)}</td><td style="font-weight:600">${n1(r.y)}</td><td class="${r.d > 0 ? 'best' : ''}">${sg(r.d)}</td><td>${r.pct == null ? '—' : (r.pct > 0 ? '+' : '') + Math.round(r.pct * 100) + '%'}</td></tr>`).join('')}</table></div>` : '<div class="empty">Ningún jugador tiene partidos de liga en las dos temporadas elegidas.</div>'}
    <div class="note" style="margin-top:10px">Solo jugadores con partidos de liga en las dos temporadas elegidas.</div></section>
  ${common.length ? `<section class="sec"><h2 style="margin-bottom:6px">Todas las estadísticas de un vistazo</h2><div class="note" style="margin-bottom:14px">Variación de ${a} a ${b}</div>
    <div class="tw"><table class="t sticky1"><tr><th>Jugador</th>${ALL.map(c => `<th>${c[1]}</th>`).join('')}</tr>${common.map(p => `<tr><td>${plink(p)}</td>${ALL.map(([k]) => cell(p, k)).join('')}</tr>`).join('')}</table></div>
    <div class="note" style="margin-top:10px">Variación en porcentaje sobre la temporada base. En TC%, T3% y TL% es la diferencia en puntos porcentuales (pp). En pérdidas, bajar es mejorar.</div></section>` : ''}
  <section class="sec grid g2" style="gap:24px">${mini('Solo en ' + a, onlyA, spA)}${mini('Nuevos en ' + b, onlyB, spB)}</section>`;
};

/* ============ HERRAMIENTAS (con PIN) ============ */
function pinKey(k) {
  let p = ui('pin.v', '');
  if (k === 'del') p = p.slice(0, -1); else if (p.length < 8) p += k;
  UI['pin.err'] = false; setUI('pin.v', p);
}
function pinOk() {
  const p = ui('pin.v', '');
  if (!p) return;
  if (S.ejemplo) { toast('La web aún no está conectada al Sheet: no se puede comprobar el PIN'); return; }
  UI['pin.busy'] = true; render();
  fetch(CFG.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'pin', pin: p }) })
    .then(r => r.json()).then(j => { UI['pin.busy'] = false; if (j.ok) { try { localStorage.setItem('icaros:pin', p); } catch (e) { toast('Este navegador no deja guardar el PIN'); } UI['pin.v'] = ''; UI['pin.who'] = j.nombre || ''; render(); } else { UI['pin.err'] = true; UI['pin.v'] = ''; render(); } })
    .catch(e => { console.error(e); UI['pin.busy'] = false; toast('No se ha podido comprobar. Prueba otra vez.'); render(); });
}
function pinOut() { ls.del('icaros:pin'); render(); }
PAGES.herramientas = () => {
  let unlocked = false; try { unlocked = !!localStorage.getItem('icaros:pin'); } catch (e) { }
  const basic = S.mode === 'basic';
  const head = basic ? `<div class="bwrap" style="padding-bottom:0"><h2>Herramientas</h2><div class="small tx2">Para quien apunta los partidos. Hace falta PIN.</div></div>`
    : `<div class="pagehead"><div><h1>Herramientas</h1><div class="sub">Para quien apunta los partidos. Hace falta PIN.</div></div></div>`;
  if (!unlocked) {
    const v = ui('pin.v', '');
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
    return head + `<section class="${basic ? 'bwrap' : 'sec'}" style="display:flex;justify-content:center"><div class="card" style="width:min(420px,100%);display:flex;flex-direction:column;align-items:center;gap:18px">
      <div style="width:52px;height:52px;border-radius:14px;background:var(--accbg);color:var(--acc);display:flex;align-items:center;justify-content:center">${LOCK.replace(/13/g, '26')}</div>
      <div class="cond" style="font-weight:700;font-size:26px">Introduce el PIN</div>
      <div class="row" style="gap:12px;min-height:16px">${v.length ? [...v].map(() => '<i style="width:14px;height:14px;border-radius:999px;background:var(--acc)"></i>').join('') : '<span class="small mut">—</span>'}</div>
      ${UI['pin.err'] ? '<div class="small" style="color:var(--bad)">PIN incorrecto. Prueba otra vez.</div>' : ''}
      <div style="display:grid;grid-template-columns:repeat(3,${basic ? 72 : 88}px);gap:10px">${keys.map(k => k === '' ? '<span></span>' : `<button type="button" onclick="pinKey('${k}')" aria-label="${k === 'del' ? 'Borrar' : k}" style="height:58px;border-radius:12px;border:1px solid var(--line);background:var(--card2);font-family:'Barlow Condensed';font-weight:700;font-size:26px;cursor:pointer">${k === 'del' ? '⌫' : k}</button>`).join('')}</div>
      <button type="button" class="btn" style="width:100%;justify-content:center" onclick="pinOk()" ${UI['pin.busy'] || !v ? 'disabled' : ''}>${UI['pin.busy'] ? 'Comprobando…' : 'Entrar'}</button>
      <div class="small mut" style="text-align:center">Si no lo tienes, pídeselo a quien lleva la web.</div></div></section>`;
  }
  const tools = [['📋', 'Apuntar partido', 'herramientas/icaro_stats.html', 'Abre el vídeo del partido y apunta canastas, rebotes, faltas y cambios mientras lo ves. Lleva el marcador, el reloj y los quintetos, y al final envía todo al Sheet.', 'El vídeo se abre desde tu ordenador: no se sube a ningún sitio.'],
    ['✂️', 'Recortar jugadas', 'herramientas/recortar_jugadas.html', 'Carga la lista de jugadas marcadas con ⭐ (o márcalas a mano), pon jugador y palabras clave, y descarga el archivo que corta un clip por jugada con ffmpeg.', 'Los clips van a la carpeta jugadas y salen en la pestaña Jugadas.']];
  const steps = [['Apunta el partido', 'Con Apuntar partido y el vídeo abierto. Marca con ⭐ las jugadas que quieras recortar.'], ['Envía al Sheet', 'Pestaña Enviar → Enviar al Sheet. No vuelve a pedir PIN: vale el de la entrada. Si reenvías, se sustituye lo anterior de ese partido.'],
    ['Vídeo con marcador (opcional)', 'Descarga el marcador y el .bat de incrustar, y haz doble clic. Sale el vídeo con marcador para mandarlo al grupo.'], ['Recorta las jugadas', 'Descarga Jugadas marcadas (.txt), cárgalo en Recortar jugadas y sube los clips a la carpeta jugadas.']];
  return head + `<section class="${basic ? 'bwrap' : 'sec'}"><div class="between"><div class="tx2">Acceso concedido. Este dispositivo queda desbloqueado.</div><button type="button" class="btn ghost" onclick="pinOut()">Salir</button></div></section>
    <section class="${basic ? 'bwrap' : 'sec grid g2'}" style="gap:20px">${tools.map(t => `<div class="card stack"><div class="row"><div style="width:44px;height:44px;border-radius:12px;background:var(--accbg);display:flex;align-items:center;justify-content:center;font-size:22px">${t[0]}</div><h3>${t[1]}</h3></div><div class="tx2">${t[3]}</div><div class="small mut">${t[4]}</div><a class="btn" style="align-self:flex-start" href="${t[2]}" target="_blank" rel="noopener">Abrir →</a></div>`).join('')}</section>
    <section class="${basic ? 'bwrap' : 'sec'}"><div class="card stack" style="gap:14px"><h3>Después de cada partido</h3>${steps.map((x, i) => `<div style="display:grid;grid-template-columns:32px minmax(0,1fr);gap:12px"><span style="width:28px;height:28px;border-radius:999px;background:var(--accbg);color:var(--acc2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px">${i + 1}</span><div><div style="font-weight:600">${x[0]}</div><div class="small mut">${x[1]}</div></div></div>`).join('')}</div></section>`;
};
BPAGES.herramientas = PAGES.herramientas;

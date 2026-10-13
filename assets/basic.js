/* Icaro Barbarouses · modo básico (pensado para el móvil) */
'use strict';
const bhead = (t, sub) => `<div><h2 style="font-size:30px">${t}</h2>${sub ? `<div class="small mut">${sub}</div>` : ''}</div>`;
const toFull = (h, l) => `<a href="#/${h}" onclick="S.mode='full';ls.set('icaros:modo','full')" class="btn ghost" style="justify-content:center">${l} →</a>`;

BPAGES[''] = () => {
  const nx = nextGame(), s = S.season, lg = gamesOf(s).filter(g => g.played), last = lg[lg.length - 1];
  const { sp, q } = qualAvg(s);
  const LEAD = [['PTS', 'Puntos'], ['REB', 'Rebotes'], ['AST', 'Asistencias']];
  const leaders = LEAD.map(([k, l]) => { const p = q.slice().sort((a, b) => (sp[b].avg[k] || 0) - (sp[a].avg[k] || 0))[0]; return p ? { l, p, v: sp[p].avg[k] } : null; }).filter(Boolean);
  const ts = last ? topScorer(last) : null;
  if (!CLIPS) loadClips().then(() => render());
  const clips = (CLIPS || []).slice(0, 2);
  let rsvp = '';
  if (nx) { const who = ls.get('icaros:yo', ''); const by = convOf(nx); const c = who && by[who];
    rsvp = c ? `<div class="small tx2">${esc(who)}: <strong class="acc">${ESTADOS[c.estado]}</strong> · <a href="#/asistencia">cambiar</a></div>` : `<a class="btn" href="#/asistencia" style="justify-content:center">¿Vienes? Responde</a>`; }
  return `<div class="bwrap">
    ${nx ? `<div class="bcard hl stack" style="gap:10px"><div class="lbl" style="color:var(--acc2);font-size:12px">Próximo partido · ${esc(nx.label.replace('J', 'Jornada '))}</div><div class="cond" style="font-weight:800;font-size:30px">vs ${esc(nx.rival)}</div>
      <div class="small tx2">${fdw(nx.date)}${nx.hora ? ' · ' + esc(nx.hora) : ''}${nx.pista ? ' · ' + esc(nx.pista) : ''}${nx.local === true ? ' · en casa' : nx.local === false ? ' · fuera' : ''}</div>${rsvp}<a href="#/asistencia" class="small" style="font-weight:600">Quién va →</a></div>` : ''}
    ${last ? `<a class="bcard stack" href="#/partido/${encodeURIComponent(last.id)}" style="gap:8px;color:var(--tx)"><div class="between"><div class="lbl" style="font-size:12px">Último partido</div><div class="small mut">${fd(last.date)}${last.po ? ' · Playoffs' : ''}</div></div>
      <div class="row" style="justify-content:space-between"><span class="cond" style="font-weight:700;font-size:22px">Icaro</span><span class="cond ${last.res === 'V' ? 'acc' : ''}" style="font-weight:800;font-size:32px">${last.pf}</span></div>
      <div class="row" style="justify-content:space-between"><span class="cond tx2" style="font-weight:700;font-size:22px">${esc(last.rival)}</span><span class="cond tx2" style="font-weight:800;font-size:32px">${last.pc}</span></div>
      ${ts ? `<div class="small mut">Máximo anotador: <strong class="tx2">${esc(ts.p)} · ${nf(ts.PTS)} pts</strong></div>` : ''}</a>` : ''}
    ${leaders.length ? `<div class="bcard stack" style="gap:10px"><div class="between"><strong>Líderes</strong><span class="small mut">Liga ${esc(s)} · por partido</span></div>
      ${leaders.map(l => `<a href="#/jugador/${encodeURIComponent(l.p)}" class="row" style="color:var(--tx);padding:8px 0;border-top:1px solid var(--line)"><span class="mut" style="width:96px">${l.l}</span><span style="flex:1;font-weight:600">${esc(l.p)}</span><span class="cond acc" style="font-weight:800;font-size:24px">${n1(l.v)}</span></a>`).join('')}
      <a href="#/estadisticas" class="small" style="font-weight:600">Ver estadísticas de todos →</a></div>` : ''}
    ${clips.length ? `<div class="stack" style="gap:10px"><div class="between"><strong>Últimas jugadas</strong><a href="#/jugadas" class="small" style="font-weight:600">Todas →</a></div>${clips.map(c => clipCard(c)).join('')}</div>` : ''}
  </div>`;
};

BPAGES.calendario = () => {
  const seasons = uniq([S.M.actual].concat(S.M.playedSeasons)).slice(0, 2);
  const s = ui('cal.s', S.M.actual);
  const gs = gamesOf(s); const nx = nextGame();
  return `<div class="bwrap"><div class="pills" style="align-self:flex-start">${seasons.map(x => `<button type="button" class="${x === s ? 'on' : ''}" ${on('cal.s', x)}>${x}</button>`).join('')}</div>
    ${bhead('Calendario ' + esc(s), gs.filter(g => g.played).length ? teamRecord(s).V + ' victorias · ' + teamRecord(s).D + ' derrotas en liga' : gs.filter(g => g.estado !== 'Descanso').length + ' partidos')}
    <div class="stack" style="gap:8px">${gs.map(g => { const d = pd(g.date); const desc = g.estado === 'Descanso';
      const right = g.played ? `<div style="text-align:right"><div style="font-weight:700">${sc(g)}</div>${resChip(g)}</div>` : `<div class="small mut" style="text-align:right">${desc ? '' : esc(g.hora || '')}</div>`;
      const inner = `<div style="width:48px;text-align:center"><div class="small mut" style="font-size:11px;text-transform:uppercase">${d ? DIAS[d.getDay()] : ''}</div><div class="cond" style="font-weight:800;font-size:24px;line-height:1">${d ? d.getDate() : ''}</div><div class="small mut" style="font-size:11px">${d ? MESES[d.getMonth()] : ''}</div></div>
        <div style="flex:1;min-width:0"><div style="font-weight:600">${desc ? 'Descanso' : esc(g.rival)}</div><div class="small mut">${g.po ? 'Playoffs' : g.label}${g.local === true ? ' · en casa' : g.local === false ? ' · fuera' : ''}${g.estado === 'No disputado' ? ' · no disputado' : ''}</div></div>${right}`;
      const st = `display:flex;gap:12px;align-items:center;color:var(--tx);${nx && nx.id === g.id ? 'border-color:#5C4410;background:#1A1608' : ''}${desc ? ';opacity:.6' : ''}`;
      return g.played ? `<a class="bcard" href="#/partido/${encodeURIComponent(g.id)}" style="${st}">${inner}</a>` : `<div class="bcard" style="${st}">${inner}</div>`; }).join('')}</div></div>`;
};

BPAGES.partido = R => {
  const g = S.M.gameById[R.arg];
  if (!g) return `<div class="bwrap"><div class="empty">No encuentro ese partido.</div></div>`;
  const lines = (S.M.linesByGame[g.id] || []).slice().sort((a, b) => (b.PTS || 0) - (a.PTS || 0));
  return `<div class="bwrap"><a href="#/calendario" style="font-weight:600">← Calendario</a>
    <div class="bcard ${g.res === 'V' ? 'hl' : ''} stack" style="gap:8px"><div class="small tx2"><strong class="${g.res === 'V' ? 'acc' : ''}">${g.res === 'V' ? 'VICTORIA' : g.res === 'D' ? 'DERROTA' : ''}</strong> · ${g.po ? 'Playoffs' : 'Jornada ' + (g.j || '')} · ${fdw(g.date)}</div>
      <div class="row" style="justify-content:space-between"><span class="cond" style="font-weight:700;font-size:24px">Icaro</span><span class="cond ${g.res === 'V' ? 'acc' : ''}" style="font-weight:800;font-size:44px">${g.played ? g.pf : '–'}</span></div>
      <div class="row" style="justify-content:space-between"><span class="cond tx2" style="font-weight:700;font-size:24px">${esc(g.rival)}</span><span class="cond tx2" style="font-weight:800;font-size:44px">${g.played ? g.pc : '–'}</span></div></div>
    ${g.q.some(x => x.f != null) ? `<div class="tw"><table class="t"><tr><th></th>${g.q.map((_, i) => `<th>${i + 1}º</th>`).join('')}${g.ot ? '<th>PR</th>' : ''}</tr><tr><td>Icaro</td>${g.q.map(x => `<td>${x.f ?? '—'}</td>`).join('')}${g.ot ? `<td>${g.ot.f}</td>` : ''}</tr><tr><td>Rival</td>${g.q.map(x => `<td>${x.c ?? '—'}</td>`).join('')}${g.ot ? `<td>${g.ot.c}</td>` : ''}</tr></table></div>` : ''}
    ${lines.length ? `<strong>Quién hizo qué</strong><div class="tw"><table class="t"><tr><th>Jugador</th><th>Min</th><th>Pts</th><th>Reb</th><th>Ast</th><th>Rob</th></tr>${lines.map(l => `<tr><td>${plink(l.p)}</td><td>${nf(l.MIN)}</td><td style="font-weight:700">${nf(l.PTS)}</td><td>${nf(l.REB)}</td><td>${nf(l.AST)}</td><td>${nf(l.STL)}</td></tr>`).join('')}</table></div>` : '<div class="empty">Sin estadísticas de este partido.</div>'}
    ${toFull('partido/' + g.id, 'Ver box score completo')}
    ${g.video ? `<a class="btn" href="${esc(g.video)}" target="_blank" rel="noopener" style="justify-content:center">▶ Vídeo del partido</a>` : ''}</div>`;
};

BPAGES.plantilla = () => {
  const rows = rosterRows().sort((x, y) => (+x.pl.dorsal || 999) - (+y.pl.dorsal || 999));
  return `<div class="bwrap">${bhead('Plantilla ' + esc(S.M.actual), 'Medias de su última temporada con nosotros')}
    <div class="grid g2" style="gap:10px;grid-template-columns:repeat(2,minmax(0,1fr))">${rows.map(r => `<a href="#/jugador/${encodeURIComponent(r.pl.name)}" class="bcard" style="padding:0;overflow:hidden;color:var(--tx)">${photo(r.pl.name, 120, 44)}
      <div style="padding:10px 12px 12px"><div class="cond" style="font-weight:800;font-size:22px;line-height:1.1">${esc(r.pl.name)}</div><div class="small mut">${esc(r.pl.posTxt || '—')}</div><div class="small tx2" style="padding-top:6px">${r.a ? n1(r.a.avg.PTS) + ' pts · ' + n1(r.a.avg.REB) + ' reb' : 'Nuevo esta temporada'}</div></div></a>`).join('')}</div></div>`;
};

BPAGES.jugador = R => {
  const p = R.arg, P = S.M.players[p] || { pos: [], posTxt: '', dorsal: '' };
  const s = linesOf(S.season, { fase: 'Liga', p }).length ? S.season : refSeason(p, S.season) || refSeason(p);
  const role = roleOf(p);
  if (!CLIPS) loadClips().then(() => render());
  const clips = (CLIPS || []).filter(c => c.who.includes(p)).slice(0, 4);
  const A = s ? agg(linesOf(s, { fase: 'Liga', p })) : null;
  const log = s ? linesOf(s, { p }).sort((a, b) => b.g.date.localeCompare(a.g.date)).slice(0, 5) : [];
  return `<div class="bwrap"><a href="#/plantilla" style="font-weight:600">← Jugadores</a>
    <div style="border-radius:16px;overflow:hidden">${photo(p, 230, 80)}</div>
    <div><div class="cond" style="font-weight:800;font-size:40px;line-height:1">${esc(p)}</div><div class="tx2" style="font-size:15px">${P.dorsal ? '#' + esc(P.dorsal) + ' · ' : ''}${esc(P.posTxt || '—')}</div></div>
    ${role ? `<div class="bcard hl stack" style="gap:4px"><div class="lbl" style="font-size:11px">Rol${role.temporada ? ' · según ' + esc(role.temporada) : ''}</div><div class="cond" style="font-weight:700;font-size:22px;color:var(--acc2)">${esc(role.titulo)}</div>${role.porque ? `<div class="small tx2">${esc(role.porque)}</div>` : ''}</div>` : ''}
    ${A ? `<div class="grid g3" style="gap:8px;grid-template-columns:repeat(3,minmax(0,1fr))">${[['Puntos', 'PTS'], ['Rebotes', 'REB'], ['Asistencias', 'AST']].map(([l, k]) => `<div class="bcard" style="text-align:center;padding:12px"><div class="cond acc" style="font-weight:800;font-size:36px;line-height:1">${n1(A.avg[k])}</div><div class="small mut" style="padding-top:4px">${l}</div></div>`).join('')}</div>
      <div class="small mut" style="margin-top:-6px">Por partido · Liga ${esc(s)} · ${A.gp} partidos</div>
      <div class="bcard"><strong style="font-size:20px" class="cond">Últimos partidos</strong>${log.map(l => `<a href="#/partido/${encodeURIComponent(l.gid)}" class="row" style="color:var(--tx);padding:10px 0;border-top:1px solid var(--line)">${resChip(l.g)}<div style="flex:1"><div style="font-weight:600">${esc(l.g.rival)}</div><div class="small mut">${fd(l.g.date)} · ${sc(l.g)}</div></div><div style="text-align:right"><strong class="cond" style="font-size:18px">${nf(l.PTS)}</strong> pts<div class="small mut">${nf(l.REB)} reb · ${nf(l.AST)} ast</div></div></a>`).join('')}</div>`
      : '<div class="empty">Todavía no ha jugado partidos con nosotros.</div>'}
    ${clips.length ? `<div class="between"><strong class="cond" style="font-size:22px">Sus jugadas</strong><a href="#/jugadas">Todas →</a></div>${clips.map(c => clipCard(c, { noWho: true })).join('')}` : ''}
    ${toFull('jugador/' + encodeURIComponent(p), 'Ver todas sus estadísticas')}</div>`;
};

BPAGES.estadisticas = () => {
  const s = S.season, sp = seasonPlayers(s, 'Liga'), m = minPJ(s);
  const C = [['gp', 'PJ'], ['PTS', 'PTS'], ['REB', 'REB'], ['AST', 'AST'], ['STL', 'ROB'], ['BLK', 'TAP']];
  const so = ui('bst.s', 'PTS');
  const v = (p, k) => k === 'gp' ? sp[p].gp : sp[p].avg[k];
  const names = Object.keys(sp).sort((a, b) => ((sp[b].gp >= m) - (sp[a].gp >= m)) || (v(b, so) || 0) - (v(a, so) || 0));
  return `<div class="bwrap">${bhead('Estadísticas', `Media por partido · Liga ${esc(s)} · toca una columna para ordenar`)}
    ${names.length ? `<div class="tw"><table class="t" style="font-size:14px"><tr><th>Jugador</th>${C.map(([k, l]) => `<th class="${so === k ? 'sorted' : ''}" style="padding:12px 6px"><button ${on('bst.s', k)}>${l}</button></th>`).join('')}</tr>
      ${names.map(p => `<tr class="${sp[p].gp < m ? 'dimrow' : ''}"><td>${plink(p)}</td>${C.map(([k]) => `<td style="padding:11px 6px;${so === k ? 'font-weight:700' : ''}">${k === 'gp' ? sp[p].gp : n1(v(p, k))}</td>`).join('')}</tr>`).join('')}</table></div>
      <div class="small mut">PJ partidos jugados · PTS puntos · REB rebotes · AST asistencias · ROB robos · TAP tapones. Atenuados: menos de ${m} partidos.</div>` : '<div class="empty">Aún no hay partidos esta temporada.</div>'}
    ${toFull('estadisticas', 'Más estadísticas en el modo completo')}</div>`;
};

BPAGES.asistencia = () => {
  const g = nextGame();
  if (!g) return `<div class="bwrap"><div class="empty">No hay ningún partido programado ahora mismo.</div></div>`;
  const by = convOf(g);
  const groups = [['Van', [3, 4]], ['Seguramente', [2]], ['75% que no', [1]], ['No pueden', [0]]];
  return `<div class="bwrap"><div class="bcard hl"><div class="lbl" style="color:var(--acc2);font-size:12px">Próximo partido · ${esc(g.label.replace('J', 'Jornada '))}</div><div class="cond" style="font-weight:800;font-size:28px">vs ${esc(g.rival)}</div><div class="small tx2">${fdw(g.date)}${g.hora ? ' · ' + esc(g.hora) : ''}${g.pista ? ' · ' + esc(g.pista) : ''}</div></div>
    ${convForm(g, true)}
    <div class="bcard stack" style="gap:10px"><strong>Así va</strong>${groups.map(([l, es]) => { const list = Object.values(by).filter(c => es.includes(c.estado)); return `<div class="row" style="align-items:flex-start;border-top:1px solid var(--line);padding-top:8px"><span style="width:110px;font-weight:600">${l}</span><span class="small tx2" style="flex:1">${list.map(c => esc(c.p)).join(', ') || '—'}</span><span class="mut">${list.length}</span></div>`; }).join('')}</div></div>`;
};

BPAGES.jugadas = () => {
  if (!CLIPS) { loadClips().then(() => render()); return `<div class="bwrap"><div class="mut">Cargando jugadas…</div></div>`; }
  const fw = ui('jg.who', null), fk = ui('jg.kw', null);
  const shown = CLIPS.filter(c => (!fw || (fw === 'Equipo' ? !c.who.length : c.who.includes(fw))) && (!fk || c.kw.includes(fk)));
  const whos = uniq(CLIPS.flatMap(c => c.who.length ? c.who : ['Equipo'])), kws = uniq(CLIPS.flatMap(c => c.kw));
  return `<div class="bwrap">${bhead('Jugadas', CLIPS.length + ' vídeos')}
    ${CLIPS.length ? `<div class="chips" style="flex-wrap:nowrap;overflow-x:auto"><button type="button" class="chip ${!fw ? 'on' : ''}" ${on('jg.who', null)}>Todos</button>${whos.map(w => `<button type="button" class="chip ${fw === w ? 'on' : ''}" ${on('jg.who', w)}>${esc(w)}</button>`).join('')}</div>
    <div class="chips" style="flex-wrap:nowrap;overflow-x:auto"><button type="button" class="chip ${!fk ? 'on' : ''}" ${on('jg.kw', null)}>Todo</button>${kws.map(k => `<button type="button" class="chip ${fk === k ? 'on' : ''}" ${on('jg.kw', k)}>${esc(k)}</button>`).join('')}</div>` : ''}
    ${shown.length ? shown.map(c => clipCard(c)).join('') : `<div class="empty">${CLIPS.length ? 'Ninguna jugada con ese filtro.' : 'Todavía no hay jugadas subidas.'}</div>`}</div>`;
};

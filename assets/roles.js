/* =====================================================================
   ROLES AUTOMÁTICOS · Icaro Barbarouses
   ---------------------------------------------------------------------
   Asigna a cada jugador un título de rol ("Base creador de tiros",
   "Tiburón del rebote ofensivo"…) a partir de sus estadísticas de la
   temporada y de su(s) posición(es). Se recalcula cada vez que la web
   carga los datos, así que el rol cambia solo cuando cambian las stats.

   Uso:
     const res = Roles.calcular(jugadores, { minPJ: 5 });
     res['Carlos'] -> { titulo, pos, porque, rasgos:[…], id }

   jugadores = [{ nombre, posiciones:['Base','Alero'], pj,
                  tot:{ MIN, PTS, FGM, FGA, '3PM', '3PA', FTM, FTA,
                        REBO, REBD, REB, AST, STL, BLK, TOV, PM, VAL } }]
   (totales de la temporada; los campos que falten simplemente hacen
   que las reglas que los necesitan no se cumplan).

   Columna "Arquetipo" del Sheet: si tiene texto, manda sobre el
   cálculo (rol fijado a mano). Vacía = automático.
   ===================================================================== */
(function (root) {
  const POS = ['Base', 'Escolta', 'Alero', 'Ala-pívot', 'Pívot'];

  const f1 = v => (v == null || !isFinite(v)) ? '—' : v.toFixed(1).replace('.', ',');
  const pc = v => (v == null || !isFinite(v)) ? '—' : Math.round(v * 100) + '%';
  const nth = r => r + 'º';

  /* ---------- CATÁLOGO ----------------------------------------------
     pos : posición a la que pertenece ('*' = cualquiera)
     t   : título que se muestra
     tr  : rasgo corto (chip secundario)
     p   : prioridad (más alta = más específica / más mérito)
     ok  : condición (m = métricas por 36, r = puestos en el equipo,
           T = referencias del equipo)
     y   : explicación "por qué" con los números reales
  ------------------------------------------------------------------ */
  const C = [
    /* ===== BASE ===== */
    { id:'b_total', pos:'Base', t:'Base total', tr:'Todoterreno', p:95,
      ok:(m,r)=>r.pts<=2&&r.ast<=2&&r.reb<=3,
      y:(m,r)=>`${nth(r.pts)} en puntos, ${nth(r.ast)} en asistencias y ${nth(r.reb)} en rebotes del equipo` },
    { id:'b_estrella', pos:'Base', t:'Base estrella', tr:'Referente', p:86,
      ok:(m,r)=>r.pts===1&&r.ast<=3,
      y:(m,r)=>`Máximo anotador (${f1(m.pts)} pts/36) y ${nth(r.ast)} en asistencias` },
    { id:'b_creador', pos:'Base', t:'Base creador de tiros', tr:'Creador', p:82,
      ok:(m,r)=>r.ast<=2&&r.pts<=3,
      y:(m,r)=>`${nth(r.ast)} en asistencias (${f1(m.ast)}/36) y ${nth(r.pts)} en puntos` },
    { id:'b_director', pos:'Base', t:'Base director de juego', tr:'Organizador', p:80,
      ok:(m,r)=>r.ast===1&&m.ato>=1,
      y:m=>`Líder en asistencias (${f1(m.ast)}/36) con ${f1(m.ato)} asistencias por pérdida` },
    { id:'b_anotador', pos:'Base', t:'Base anotador', tr:'Anotador', p:75,
      ok:(m,r)=>r.pts<=2,
      y:(m,r)=>`${nth(r.pts)} en puntos del equipo (${f1(m.pts)}/36)` },
    { id:'b_penetrador', pos:'Base', t:'Base penetrador', tr:'Penetrador', p:68,
      ok:(m,r)=>m.ftr>=0.35&&r.pts<=4,
      y:m=>`${f1(m.ftr*10)} tiros libres por cada 10 tiros de campo: vive en la zona` },
    { id:'b_tirador', pos:'Base', t:'Base tirador', tr:'Tirador', p:66,
      ok:m=>m.r3>=0.45&&m.tpa>=3,
      y:m=>`El ${pc(m.r3)} de sus tiros son triples (${f1(m.tpa)} intentos/36)` },
    { id:'b_presion', pos:'Base', t:'Base de presión', tr:'Ladrón', p:64,
      ok:(m,r)=>r.stl<=2&&m.stl>=1,
      y:(m,r)=>`${nth(r.stl)} en robos del equipo (${f1(m.stl)}/36)` },
    { id:'b_reboteador', pos:'Base', t:'Base reboteador', tr:'Reboteador', p:62,
      ok:(m,r)=>r.reb<=3,
      y:(m,r)=>`${nth(r.reb)} en rebotes del equipo siendo base (${f1(m.reb)}/36)` },
    { id:'b_seguro', pos:'Base', t:'Base seguro con el balón', tr:'Sin pérdidas', p:58,
      ok:m=>m.tov<=1.5&&m.ato>=1.2,
      y:m=>`Solo ${f1(m.tov)} pérdidas/36 y ${f1(m.ato)} asistencias por pérdida` },
    { id:'b_gatillo', pos:'Base', t:'Base con gatillo fácil', tr:'Gatillo fácil', p:55,
      ok:(m,r,T)=>r.fga<=2&&m.fgp<T.fgp,
      y:(m,r,T)=>`${nth(r.fga)} en tiros intentados (${f1(m.fga)}/36) con un ${pc(m.fgp)} de acierto` },
    { id:'b_pasador', pos:'Base', t:'Base pasador', tr:'Pasador', p:52,
      ok:(m,r)=>r.ast<=3,
      y:(m,r)=>`${nth(r.ast)} en asistencias (${f1(m.ast)}/36)` },
    { id:'b_rot', pos:'Base', t:'Base de rotación', p:1, y:()=>`Base que da minutos al equipo` },

    /* ===== ESCOLTA ===== */
    { id:'e_estrella', pos:'Escolta', t:'Escolta estrella', tr:'Referente', p:90,
      ok:(m,r)=>r.pts===1&&m.share>=0.25,
      y:m=>`Máximo anotador: ${pc(m.share)} de los puntos del equipo` },
    { id:'e_3d', pos:'Escolta', t:'Escolta 3&D', tr:'3&D', p:78,
      ok:(m,r)=>m.r3>=0.35&&m.tpa>=1.5&&r.stl<=2,
      y:(m,r)=>`${pc(m.r3)} de sus tiros son triples y ${nth(r.stl)} en robos (${f1(m.stl)}/36)` },
    { id:'e_anotador', pos:'Escolta', t:'Escolta anotador', tr:'Anotador', p:75,
      ok:(m,r)=>r.pts<=2,
      y:(m,r)=>`${nth(r.pts)} en puntos (${f1(m.pts)}/36)` },
    { id:'e_franco', pos:'Escolta', t:'Francotirador', tr:'Tirador', p:74,
      ok:m=>m.tpp>=0.33&&m.tpa>=3,
      y:m=>`${pc(m.tpp)} en triples con ${f1(m.tpa)} intentos/36` },
    { id:'e_micro', pos:'Escolta', t:'Microondas desde el banquillo', tr:'Microondas', p:70,
      ok:(m,r,T)=>r.pts<=3&&m.mpg<T.mpgMed,
      y:(m,r)=>`${nth(r.pts)} en puntos/36 jugando menos minutos que la media` },
    { id:'e_ladron', pos:'Escolta', t:'Escolta ladrón de balones', tr:'Ladrón', p:68,
      ok:(m,r)=>r.stl<=2&&m.stl>=1,
      y:(m,r)=>`${nth(r.stl)} en robos del equipo (${f1(m.stl)}/36)` },
    { id:'e_penetrador', pos:'Escolta', t:'Escolta penetrador', tr:'Penetrador', p:66,
      ok:m=>m.ftr>=0.35&&m.fga>=4,
      y:m=>`${f1(m.ftr*10)} tiros libres por cada 10 tiros: busca el contacto` },
    { id:'e_tirador', pos:'Escolta', t:'Escolta tirador', tr:'Tirador', p:64,
      ok:m=>m.r3>=0.4&&m.tpa>=2,
      y:m=>`El ${pc(m.r3)} de sus tiros son triples` },
    { id:'e_creador', pos:'Escolta', t:'Escolta segundo creador', tr:'Creador', p:62,
      ok:(m,r)=>r.ast<=3,
      y:(m,r)=>`${nth(r.ast)} en asistencias del equipo (${f1(m.ast)}/36)` },
    { id:'e_reboteador', pos:'Escolta', t:'Escolta reboteador', tr:'Reboteador', p:60,
      ok:(m,r)=>r.reb<=4,
      y:(m,r)=>`${nth(r.reb)} en rebotes siendo exterior (${f1(m.reb)}/36)` },
    { id:'e_seguro', pos:'Escolta', t:'Escolta sin errores', tr:'Sin pérdidas', p:56,
      ok:m=>m.tov<=1&&m.mpg>=10,
      y:m=>`Solo ${f1(m.tov)} pérdidas cada 36 minutos` },
    { id:'e_energia', pos:'Escolta', t:'Escolta de energía', tr:'Energía', p:50,
      ok:(m,r,T)=>(m.stl+m.reb)>=T.stlRebMed&&m.fga<=T.fgaMed,
      y:m=>`Aporta ${f1(m.reb)} rebotes y ${f1(m.stl)} robos/36 sin necesitar tiros` },
    { id:'e_rot', pos:'Escolta', t:'Escolta de rotación', p:1, y:()=>`Exterior que da minutos al equipo` },

    /* ===== ALERO ===== */
    { id:'a_3niv', pos:'Alero', t:'Alero anotador de tres niveles', tr:'Tres niveles', p:92,
      ok:(m,r)=>r.pts===1&&m.r3>=0.25&&m.ftr>=0.25,
      y:m=>`Máximo anotador (${f1(m.pts)}/36): ${pc(m.r3)} de tiros triples y ${f1(m.ftr*10)} libres por cada 10 tiros` },
    { id:'a_navaja', pos:'Alero', t:'Alero navaja suiza', tr:'Todoterreno', p:88,
      ok:(m,r)=>['pts','reb','ast','stl','blk'].filter(k=>r[k]<=3).length>=4,
      y:(m,r)=>`Top 3 del equipo en ${['pts','reb','ast','stl','blk'].filter(k=>r[k]<=3).length} de 5 categorías` },
    { id:'a_anotador', pos:'Alero', t:'Alero anotador', tr:'Anotador', p:75,
      ok:(m,r)=>r.pts<=2,
      y:(m,r)=>`${nth(r.pts)} en puntos (${f1(m.pts)}/36)` },
    { id:'a_point', pos:'Alero', t:'Point forward', tr:'Organizador', p:72,
      ok:(m,r)=>r.ast<=2,
      y:(m,r)=>`Alero que reparte: ${nth(r.ast)} en asistencias (${f1(m.ast)}/36)` },
    { id:'a_slasher', pos:'Alero', t:'Alero que ataca el aro', tr:'Penetrador', p:70,
      ok:(m,r)=>m.ftr>=0.35&&r.pts<=4,
      y:m=>`${f1(m.ftr*10)} tiros libres por cada 10 tiros y solo ${pc(m.r3)} de triples` },
    { id:'a_3d', pos:'Alero', t:'Alero 3&D', tr:'3&D', p:68,
      ok:(m,r)=>m.r3>=0.3&&m.tpa>=1.5&&r.stl<=3,
      y:(m,r)=>`${pc(m.r3)} de tiros triples y ${nth(r.stl)} en robos` },
    { id:'a_reboteador', pos:'Alero', t:'Alero reboteador', tr:'Reboteador', p:66,
      ok:(m,r)=>r.reb<=3,
      y:(m,r)=>`${nth(r.reb)} en rebotes del equipo (${f1(m.reb)}/36)` },
    { id:'a_tirador', pos:'Alero', t:'Alero tirador', tr:'Tirador', p:62,
      ok:m=>m.r3>=0.4&&m.tpa>=2,
      y:m=>`El ${pc(m.r3)} de sus tiros son triples` },
    { id:'a_defensor', pos:'Alero', t:'Alero defensor', tr:'Defensor', p:60,
      ok:(m,r)=>r.stl<=3||(r.blk<=2&&m.blk>=0.5),
      y:m=>`${f1(m.stl)} robos y ${f1(m.blk)} tapones cada 36 minutos` },
    { id:'a_pegamento', pos:'Alero', t:'Alero pegamento', tr:'Pegamento', p:55,
      ok:(m,r,T)=>m.fga<=T.fgaMed&&(m.reb+m.stl+m.ast)>=T.hustleMed,
      y:m=>`Suma ${f1(m.reb+m.stl+m.ast)} reb+rob+ast/36 con pocos tiros: hace lo que no sale en el marcador` },
    { id:'a_seguro', pos:'Alero', t:'Alero sin errores', tr:'Sin pérdidas', p:50,
      ok:m=>m.tov<=1&&m.mpg>=10,
      y:m=>`Solo ${f1(m.tov)} pérdidas cada 36 minutos` },
    { id:'a_rot', pos:'Alero', t:'Alero de rotación', p:1, y:()=>`Alero que da minutos al equipo` },

    /* ===== ALA-PÍVOT ===== */
    { id:'ap_doble', pos:'Ala-pívot', t:'Doble-doble andante', tr:'Doble-doble', p:90,
      ok:m=>m.pts>=10&&m.reb>=10,
      y:m=>`${f1(m.pts)} puntos y ${f1(m.reb)} rebotes cada 36 minutos` },
    { id:'ap_dueno', pos:'Ala-pívot', t:'Ala-pívot dueño del rebote', tr:'Reboteador', p:85,
      ok:(m,r)=>r.reb===1,
      y:m=>`Máximo reboteador del equipo (${f1(m.reb)}/36)` },
    { id:'ap_abierto', pos:'Ala-pívot', t:'Ala-pívot abierto', tr:'Tirador', p:75,
      ok:m=>m.r3>=0.3&&m.tpa>=2,
      y:m=>`Abre el campo: ${pc(m.r3)} de sus tiros son triples` },
    { id:'ap_anotador', pos:'Ala-pívot', t:'Ala-pívot anotador', tr:'Anotador', p:74,
      ok:(m,r)=>r.pts<=3,
      y:(m,r)=>`${nth(r.pts)} en puntos del equipo (${f1(m.pts)}/36)` },
    { id:'ap_poste', pos:'Ala-pívot', t:'Ala-pívot de poste bajo', tr:'Poste bajo', p:70,
      ok:(m,r)=>m.r3<0.15&&r.pts<=4&&m.fga>=5,
      y:m=>`${f1(m.pts)} pts/36 casi todos cerca del aro (${pc(m.r3)} de triples)` },
    { id:'ap_ofensivo', pos:'Ala-pívot', t:'Ala-pívot de segundas oportunidades', tr:'Rebote ofensivo', p:68,
      ok:(m,r)=>r.ro<=2,
      y:(m,r)=>`${nth(r.ro)} en rebotes ofensivos (${f1(m.ro)}/36)` },
    { id:'ap_reboteador', pos:'Ala-pívot', t:'Ala-pívot reboteador', tr:'Reboteador', p:66,
      ok:(m,r)=>r.reb<=3,
      y:(m,r)=>`${nth(r.reb)} en rebotes del equipo (${f1(m.reb)}/36)` },
    { id:'ap_intim', pos:'Ala-pívot', t:'Ala-pívot intimidador', tr:'Intimidador', p:64,
      ok:(m,r)=>r.blk<=2&&m.blk>=0.5,
      y:(m,r)=>`${nth(r.blk)} en tapones (${f1(m.blk)}/36)` },
    { id:'ap_pasador', pos:'Ala-pívot', t:'Ala-pívot pasador', tr:'Pasador', p:62,
      ok:(m,r)=>r.ast<=3,
      y:(m,r)=>`${nth(r.ast)} en asistencias siendo interior (${f1(m.ast)}/36)` },
    { id:'ap_manos', pos:'Ala-pívot', t:'Ala-pívot de manos rápidas', tr:'Ladrón', p:60,
      ok:(m,r)=>r.stl<=3&&m.stl>=0.7,
      y:(m,r)=>`${nth(r.stl)} en robos (${f1(m.stl)}/36)` },
    { id:'ap_contacto', pos:'Ala-pívot', t:'Ala-pívot que busca el contacto', tr:'Penetrador', p:58,
      ok:m=>m.ftr>=0.35&&m.fga>=3,
      y:m=>`${f1(m.ftr*10)} tiros libres por cada 10 tiros de campo` },
    { id:'ap_currante', pos:'Ala-pívot', t:'Ala-pívot currante', tr:'Currante', p:50,
      ok:(m,r,T)=>m.reb>=T.rebMed&&m.fga<=T.fgaMed,
      y:m=>`${f1(m.reb)} rebotes/36 sin pedir el balón` },
    { id:'ap_rot', pos:'Ala-pívot', t:'Ala-pívot de rotación', p:1, y:()=>`Interior que da minutos al equipo` },

    /* ===== PÍVOT ===== */
    { id:'p_dominante', pos:'Pívot', t:'Pívot dominante', tr:'Referente', p:92,
      ok:(m,r)=>r.pts<=2&&r.reb<=2,
      y:(m,r)=>`${nth(r.pts)} en puntos y ${nth(r.reb)} en rebotes del equipo` },
    { id:'p_ancla', pos:'Pívot', t:'Ancla defensiva', tr:'Intimidador', p:85,
      ok:(m,r)=>r.blk===1&&m.blk>=1&&r.reb<=3,
      y:m=>`Máximo taponador (${f1(m.blk)}/36) y ${f1(m.reb)} rebotes/36` },
    { id:'p_dueno', pos:'Pívot', t:'Pívot dueño del rebote', tr:'Reboteador', p:84,
      ok:(m,r)=>r.reb===1,
      y:m=>`Máximo reboteador del equipo (${f1(m.reb)}/36)` },
    { id:'p_tiburon', pos:'Pívot', t:'Tiburón del rebote ofensivo', tr:'Rebote ofensivo', p:80,
      ok:(m,r)=>r.ro===1,
      y:m=>`Líder en rebotes ofensivos (${f1(m.ro)}/36)` },
    { id:'p_protector', pos:'Pívot', t:'Protector del aro', tr:'Intimidador', p:78,
      ok:(m,r)=>r.blk===1&&m.blk>=0.8,
      y:m=>`Máximo taponador del equipo (${f1(m.blk)}/36)` },
    { id:'p_anotador', pos:'Pívot', t:'Pívot anotador', tr:'Anotador', p:74,
      ok:(m,r)=>r.pts<=3,
      y:(m,r)=>`${nth(r.pts)} en puntos (${f1(m.pts)}/36)` },
    { id:'p_abierto', pos:'Pívot', t:'Pívot abierto', tr:'Tirador', p:70,
      ok:m=>m.r3>=0.25&&m.tpa>=1.5,
      y:m=>`Pívot que tira de fuera: ${pc(m.r3)} de sus tiros son triples` },
    { id:'p_reboteador', pos:'Pívot', t:'Pívot reboteador', tr:'Reboteador', p:66,
      ok:(m,r)=>r.reb<=3,
      y:(m,r)=>`${nth(r.reb)} en rebotes (${f1(m.reb)}/36)` },
    { id:'p_pasador', pos:'Pívot', t:'Pívot pasador', tr:'Pasador', p:62,
      ok:(m,r)=>r.ast<=3,
      y:(m,r)=>`${nth(r.ast)} en asistencias desde la pintura` },
    { id:'p_segundas', pos:'Pívot', t:'Pívot de segundas oportunidades', tr:'Rebote ofensivo', p:60,
      ok:(m,r)=>r.ro<=3,
      y:(m,r)=>`${nth(r.ro)} en rebotes ofensivos (${f1(m.ro)}/36)` },
    { id:'p_obrero', pos:'Pívot', t:'Obrero de la pintura', tr:'Currante', p:55,
      ok:(m,r,T)=>m.reb>=T.rebMed&&m.fga<=3,
      y:m=>`${f1(m.reb)} rebotes/36 con solo ${f1(m.fga)} tiros: trabajo sucio` },
    { id:'p_sacrificado', pos:'Pívot', t:'Pívot sacrificado', tr:'Sacrificio', p:45,
      ok:m=>m.fga<=3,
      y:m=>`Juega para el equipo: ${f1(m.fga)} tiros cada 36 minutos` },
    { id:'p_rot', pos:'Pívot', t:'Pívot de rotación', p:1, y:()=>`Interior que da minutos al equipo` },

    /* ===== CUALQUIER POSICIÓN ===== */
    { id:'g_franquicia', pos:'*', t:'Jugador franquicia', tr:'Franquicia', p:60,
      ok:(m,r)=>m.share>=0.33&&r.val===1&&r.pts===1,
      y:m=>`Anota el ${pc(m.share)} de los puntos del equipo y lidera la valoración` },
    { id:'g_eficiente', pos:'*', t:'El más eficiente', tr:'Eficiente', p:48,
      ok:(m,r)=>r.ts===1&&m.fga>=4,
      y:m=>`Mejor % de tiro real del equipo (${pc(m.ts)})` },
    { id:'g_pm', pos:'*', t:'Mr. Más/Menos', tr:'+/-', p:46,
      ok:(m,r)=>r.pm===1&&m.pm>0,
      y:m=>`El equipo gana su tiempo en pista: ${m.pm>0?'+':''}${f1(m.pm)} cada 36 min` },
    { id:'g_hierro', pos:'*', t:'Hombre de hierro', tr:'Hierro', p:40,
      ok:(m,r)=>r.mpg===1,
      y:m=>`El que más minutos juega (${f1(m.mpg)} por partido)` },
  ];

  /* ---------------------------------------------------------------- */
  function metricas(j, teamPts) {
    const t = j.tot || {}, min = t.MIN || 0, k = min > 0 ? 36 / min : 0;
    const g = x => (t[x] == null ? undefined : t[x]);
    const per = x => (g(x) == null ? undefined : g(x) * k);
    const fga = g('FGA'), fta = g('FTA'), tpa = g('3PA');
    const reb = g('REB') != null ? g('REB') : (g('REBO') != null && g('REBD') != null ? g('REBO') + g('REBD') : undefined);
    const tsA = fga != null && fta != null ? 2 * (fga + 0.44 * fta) : undefined;
    return {
      pj: j.pj, mpg: j.pj ? min / j.pj : 0,
      pts: per('PTS'), reb: reb == null ? undefined : reb * k, ro: per('REBO'), rd: per('REBD'),
      ast: per('AST'), stl: per('STL'), blk: per('BLK'), tov: per('TOV'),
      fga: per('FGA'), tpa: per('3PA'), fta: per('FTA'), pm: per('PM'), val: per('VAL') ?? per('EFF'),
      fgp: fga ? g('FGM') / fga : undefined,
      tpp: tpa ? g('3PM') / tpa : undefined,
      ftp: fta ? g('FTM') / fta : undefined,
      ts: tsA ? g('PTS') / tsA : undefined,
      r3: fga && tpa != null ? tpa / fga : undefined,
      ftr: fga && fta != null ? fta / fga : undefined,
      ato: g('AST') != null && g('TOV') != null ? g('AST') / Math.max(g('TOV'), 1) : undefined,
      share: teamPts ? (g('PTS') || 0) / teamPts : undefined,
    };
  }
  const med = a => { a = a.filter(v => v != null && isFinite(v)).sort((x, y) => x - y); if (!a.length) return undefined; const h = a.length >> 1; return a.length % 2 ? a[h] : (a[h - 1] + a[h]) / 2; };

  function calcular(jugadores, opts) {
    opts = opts || {};
    const minPJ = opts.minPJ != null ? opts.minPJ : 5;
    const teamPts = jugadores.reduce((s, j) => s + ((j.tot && j.tot.PTS) || 0), 0);
    const all = jugadores.map(j => ({ j, m: metricas(j, teamPts) }));
    const Q = all.filter(x => x.j.pj >= minPJ && (x.j.tot && x.j.tot.MIN > 0));
    const keys = ['pts','reb','ro','ast','stl','blk','fga','pm','val','ts','mpg'];
    const T = {
      fgp: (() => { const a = Q.reduce((s,x)=>s+(x.j.tot.FGM||0),0), b = Q.reduce((s,x)=>s+(x.j.tot.FGA||0),0); return b ? a / b : undefined; })(),
      mpgMed: med(Q.map(x => x.m.mpg)), fgaMed: med(Q.map(x => x.m.fga)), rebMed: med(Q.map(x => x.m.reb)),
      stlRebMed: med(Q.map(x => (x.m.stl||0) + (x.m.reb||0))),
      hustleMed: med(Q.map(x => (x.m.reb||0) + (x.m.stl||0) + (x.m.ast||0))),
    };
    Q.forEach(x => {
      x.r = {};
      keys.forEach(k => { const v = x.m[k]; x.r[k] = v == null ? 99 : 1 + Q.filter(o => o.m[k] != null && o.m[k] > v).length; });
    });
    const safe = (fn, ...a) => { try { return !!fn(...a); } catch (e) { return false; } };

    // candidatos de cada jugador
    const cand = new Map();
    Q.forEach(x => {
      const ps = (x.j.posiciones || []).filter(p => POS.includes(p));
      if (!ps.length) return;
      const list = [];
      C.forEach(c => {
        if (c.pos !== '*' && !ps.includes(c.pos)) return;
        if (c.ok && !safe(c.ok, x.m, x.r, T)) return;
        const bonus = c.pos === ps[0] ? 2 : 0;            // primera posición = preferente
        list.push({ c, s: c.p + bonus, pos: c.pos === '*' ? ps[0] : c.pos });
      });
      list.sort((a, b) => b.s - a.s);
      cand.set(x.j.nombre, { x, list });
    });

    // reparto: el mismo título no se repite en el equipo (salvo "de rotación")
    const out = {}, usados = new Set();
    const cola = [];
    cand.forEach((v, n) => v.list.forEach((o, i) => cola.push({ n, o, i })));
    cola.sort((a, b) => b.o.s - a.o.s || a.i - b.i);
    cola.forEach(({ n, o }) => {
      if (out[n]) return;
      if (o.c.p > 1 && usados.has(o.c.id)) return;
      const { x, list } = cand.get(n);
      usados.add(o.c.id);
      const rasgos = [];
      list.forEach(l => { if (l.c.tr && l.c.id !== o.c.id && l.c.tr !== o.c.tr && !rasgos.includes(l.c.tr) && rasgos.length < 3) rasgos.push(l.c.tr); });
      out[n] = { id: o.c.id, titulo: o.c.t, pos: o.pos, porque: o.c.y(x.m, x.r, T), rasgos, pj: x.j.pj };
    });
    jugadores.forEach(j => {
      if (out[j.nombre]) return;
      const sinPos = (j.pj || 0) >= minPJ && !(j.posiciones || []).some(p => POS.includes(p));
      out[j.nombre] = { id: 'eval', titulo: 'En evaluación', pos: (j.posiciones || [])[0] || '', rasgos: [], pj: j.pj || 0,
        porque: sinPos ? 'Falta indicar su posición en la hoja Jugadores' : `Necesita ${minPJ} partidos para tener rol (lleva ${j.pj || 0})` };
    });
    return out;
  }

  /* Rol a mostrar en la temporada actual: si el jugador aún no tiene
     minPJ partidos, se enseña el de la última temporada en la que sí
     los tuvo, marcado como "según 25/26". El Arquetipo manual manda. */
  function rolVisible(nombre, temporadas, opts) {
    // temporadas = [{ temporada:'26/27', roles: calcular(...) }, … más reciente primero]
    for (const t of temporadas) {
      const r = t.roles[nombre];
      if (r && r.id !== 'eval') return Object.assign({ temporada: t.temporada, heredado: t !== temporadas[0] }, r);
    }
    return { id: 'nuevo', titulo: 'Por descubrir', porque: 'Su rol aparecerá cuando juegue sus primeros partidos', rasgos: [], temporada: temporadas[0] && temporadas[0].temporada, heredado: false };
  }

  const API = { calcular, rolVisible, catalogo: C, POS };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.Roles = API;
})(this);

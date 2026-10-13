/**
 * Icaro Barbarouses · backend de la web y del tracker
 *
 * Instalación (una vez):
 *  1. Abre el Google Sheet → Extensiones → Apps Script. Borra lo que haya y pega este archivo.
 *  2. Implementar → Nueva implementación → Tipo: Aplicación web
 *       Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario
 *     Copia la URL que termina en /exec: la pegan la web y el tracker.
 *     La Asistencia no lleva PIN. Enviar partidos sí: el PIN está en la hoja Acceso
 *     (columna PIN, filas con Activo = Sí). La web nunca lee esa hoja.
 *  3. Si cambias este código: Implementar → Gestionar implementaciones → editar → Versión nueva
 *     (así la URL no cambia).
 */

const HOJAS_PUBLICAS = ['Temporadas', 'Jugadores', 'Partidos', 'Box', 'Quintetos', 'Convocatoria', 'Media', 'Clasificacion'];

// ---------- lectura ----------
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'all';
  try {
    if (action === 'all') return json_({ ok: true, data: leerTodo_(HOJAS_PUBLICAS) });
    if (action === 'setup') return json_({ ok: true, data: leerTodo_(['Temporadas', 'Jugadores', 'Partidos', 'Convocatoria']) });
    return json_({ ok: false, error: 'Acción desconocida' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function leerTodo_(nombres) {
  const ss = SpreadsheetApp.getActive();
  const out = {};
  nombres.forEach(n => {
    const sh = ss.getSheetByName(n);
    out[n] = sh ? filas_(sh) : [];
  });
  return out;
}

function filas_(sh) {
  const v = sh.getDataRange().getValues();
  if (v.length < 2) return [];
  const h = v[0].map(String);
  const tz = Session.getScriptTimeZone();
  return v.slice(1).filter(r => r.some(x => x !== '' && x !== null)).map(r => {
    const o = {};
    h.forEach((k, i) => {
      let x = r[i];
      if (x instanceof Date) x = (k === 'Hora') ? Utilities.formatDate(x, tz, 'HH:mm') : (k === 'Actualizado' ? Utilities.formatDate(x, tz, "yyyy-MM-dd'T'HH:mm:ss") : Utilities.formatDate(x, tz, 'yyyy-MM-dd'));
      if (x !== '' && x !== null) o[k] = x;
    });
    return o;
  });
}

// ---------- escritura ----------
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'convocatoria') return json_(guardarConvocatoria_(body));
    if (body.action === 'pin') return json_(comprobarPin_(body.pin));
    if (body.action === 'partido') {
      const acc = comprobarPin_(body.pin);
      if (!acc.ok) return json_({ ok: false, error: 'PIN incorrecto o sin permiso. Vuelve a entrar en Herramientas.' });
      const r = guardarPartido_(body);
      if (r.ok) registrarEnvio_(acc.nombre, body, r);
      return json_(r);
    }
    return json_({ ok: false, error: 'Acción desconocida' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function guardarConvocatoria_(b) {
  const estado = Number(b.estado);
  if (!(estado >= 0 && estado <= 4)) return { ok: false, error: 'Estado no válido' };
  const ss = SpreadsheetApp.getActive();
  const jug = filas_(ss.getSheetByName('Jugadores')).map(j => j.Nombre);
  if (jug.indexOf(b.jugador) < 0) return { ok: false, error: 'Jugador desconocido' };
  const sh = ss.getSheetByName('Convocatoria');
  const v = sh.getDataRange().getValues();
  const h = v[0];
  const c = k => h.indexOf(k);
  const ahora = new Date();
  const fila = [];
  h.forEach(k => fila.push({ Temporada: b.temporada, PartidoID: b.partidoId, Jugador: b.jugador, Estado: estado,
    Comentario: String(b.comentario || '').slice(0, 200), Actualizado: ahora }[k] ?? ''));
  // La hoja Convocatoria guarda solo la última respuesta de cada jugador (es la que enseña la web).
  // Todas las respuestas, también las que luego se cambian, quedan en ConvocatoriaHistorial.
  let anterior = '';
  let filaExistente = -1;
  for (let i = 1; i < v.length; i++) {
    if (v[i][c('PartidoID')] === b.partidoId && v[i][c('Jugador')] === b.jugador) { filaExistente = i; anterior = v[i][c('Estado')]; break; }
  }
  if (filaExistente >= 0) sh.getRange(filaExistente + 1, 1, 1, h.length).setValues([fila]);
  else sh.appendRow(fila);
  historial_(ss, { Fecha: ahora, Temporada: b.temporada, PartidoID: b.partidoId, Jugador: b.jugador, Estado: estado, Respuesta: ESTADOS[estado],
    Comentario: String(b.comentario || '').slice(0, 200), EstadoAnterior: anterior, RespuestaAnterior: anterior === '' ? '' : (ESTADOS[Number(anterior)] || '') });
  return { ok: true, actualizado: filaExistente >= 0, fecha: Utilities.formatDate(ahora, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss") };
}

const ESTADOS = ['No puedo', '75% que no', 'Seguramente pueda', 'Puedo 100%', 'Voy al partido'];
const HIST_COLS = ['Fecha', 'Temporada', 'PartidoID', 'Jugador', 'Estado', 'Respuesta', 'Comentario', 'EstadoAnterior', 'RespuestaAnterior'];

function historial_(ss, o) {
  let sh = ss.getSheetByName('ConvocatoriaHistorial');
  if (!sh) { sh = ss.insertSheet('ConvocatoriaHistorial'); sh.appendRow(HIST_COLS); sh.setFrozenRows(1); }
  const h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  sh.appendRow(h.map(k => o[k] ?? ''));
}

function guardarPartido_(b) {
  const ss = SpreadsheetApp.getActive();
  const id = b.partidoId;
  if (!id) return { ok: false, error: 'Falta el ID del partido' };
  reemplazar_(ss.getSheetByName('Box'), id, b.box || []);
  reemplazar_(ss.getSheetByName('Quintetos'), id, b.quintetos || []);
  // Partidos: actualiza la fila o la crea
  const sh = ss.getSheetByName('Partidos');
  const v = sh.getDataRange().getValues();
  const h = v[0];
  let row = -1;
  for (let i = 1; i < v.length; i++) if (v[i][h.indexOf('ID')] === id) { row = i; break; }
  const datos = Object.assign({ Temporada: b.temporada, ID: id, Estado: 'Jugado' }, b.partido || {});
  if (row < 0) {
    sh.appendRow(h.map(k => datos[k] ?? ''));
  } else {
    const r = v[row].slice();
    h.forEach((k, i) => { if (datos[k] !== undefined && datos[k] !== null && datos[k] !== '') r[i] = datos[k]; });
    sh.getRange(row + 1, 1, 1, h.length).setValues([r]);
  }
  return { ok: true, box: (b.box || []).length, quintetos: (b.quintetos || []).length };
}

// Borra las filas de ese partido y escribe las nuevas (reenviar = sustituir)
function reemplazar_(sh, id, filas) {
  const v = sh.getDataRange().getValues();
  const h = v[0];
  const ci = h.indexOf('PartidoID');
  const resto = v.slice(1).filter(r => r[ci] !== id && r.some(x => x !== ''));
  const nuevas = filas.map(o => h.map(k => o[k] ?? ''));
  const todo = resto.concat(nuevas);
  if (v.length > 1) sh.getRange(2, 1, v.length - 1, h.length).clearContent();
  if (todo.length) sh.getRange(2, 1, todo.length, h.length).setValues(todo);
}

// ---------- acceso a las herramientas ----------
// Hoja Acceso: Nombre | PIN | Activo. Se puede tener un PIN compartido o uno por persona.
function comprobarPin_(pin) {
  pin = String(pin == null ? '' : pin).trim();
  if (!pin) return { ok: false };
  const sh = SpreadsheetApp.getActive().getSheetByName('Acceso');
  if (!sh) return { ok: false, error: 'Falta la hoja Acceso' };
  const fila = filas_(sh).find(r => String(r.PIN).trim() === pin && /^s[ií]$/i.test(String(r.Activo || '').trim()));
  if (!fila) { Utilities.sleep(800); return { ok: false }; }   // un poco de espera frena a quien pruebe PINs a lo loco
  return { ok: true, nombre: fila.Nombre || '' };
}

function registrarEnvio_(nombre, b, r) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName('Envios');
  if (!sh) { sh = ss.insertSheet('Envios'); sh.appendRow(['Fecha', 'PartidoID', 'Quién', 'Filas Box', 'Filas Quintetos']); sh.setFrozenRows(1); }
  sh.appendRow([new Date(), b.partidoId, nombre, r.box, r.quintetos]);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

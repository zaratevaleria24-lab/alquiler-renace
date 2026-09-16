// Regresiones de fechas y disponibilidad: ejecutar con node scripts/verificar-reservas.cjs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function cargar(archivo) {
  const codigo = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', archivo), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const modulo = { exports: {} };
  new Function('module', 'exports', 'require', codigo)(modulo, modulo.exports, require);
  return modulo.exports;
}
const f = cargar('lib/reserva-fechas.ts');
const { homeFaq } = cargar('lib/faq.ts');
assert.equal(f.fechaValida('2026-02-30'), false);
assert.equal(f.fechaValida('2028-02-29'), true);
assert.equal(f.nochesEntre('', ''), 0);
assert.equal(f.nochesEntre('2026-10-02', '2026-10-01'), 0);
assert.equal(f.nochesEntre('2026-12-30', '2027-01-03'), 4);
assert.equal(f.sumarNoches('2026-12-30', 4), '2027-01-03');
assert.equal(f.sumarNoches('', 3), '');
const q = new URLSearchParams('llegada=2026-10-01&salida=2026-10-03&personas=6');
assert.deepEqual(f.fechasDeBusqueda(q, 2, '2026-09-16'), { checkIn: '2026-10-01', checkOut: '2026-10-03', noches: 2 });
assert.equal(f.fechasDeBusqueda(q, 3, '2026-09-16'), null);
assert.equal(f.fechasDeBusqueda(q, 2, '2026-10-04'), null);
assert.equal(f.leerDisponibilidad({ error: 'no existe' }), null);
assert.equal(f.leerDisponibilidad({ hoy: '2026-09-16', ocupado: [{ desde: '2026-10-02', hasta: '2026-10-01' }] }), null);
assert.equal(f.leerDisponibilidad({ hoy: '2026-09-16', ocupado: [] }).sincronizado, false);
assert.equal(f.leerDisponibilidad({ hoy: '2026-09-16', ocupado: [], sincronizado: true }).sincronizado, true);
const preguntaPrecio = (p) => homeFaq(p).find((x) => x.q.startsWith('¿Cuánto cuesta'));
const listado = (precio, real = true, consultar = false) => ({ pricePerNight: precio, isReal: real, priceOnRequest: consultar });
assert.match(preguntaPrecio([listado(65), listado(32, false), listado(0), listado(20, true, true)]).a, /US\$65/);
assert.doesNotMatch(preguntaPrecio([]).a, /Infinity|US\$32|US\$150/);
assert.match(preguntaPrecio([listado(80)]).a, /US\$80/);
console.log('18 comprobaciones de fechas, disponibilidad y tarifa pública: OK');

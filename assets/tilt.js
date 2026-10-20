/* Efecto 3D en las fotos de los jugadores (solo con ratón): la tarjeta se inclina hacia el cursor,
   la foto se desplaza un poco más que la tarjeta (profundidad) y un foco de luz sigue al cursor. */
(function () {
  if (!window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let el = null, ph = null, img = null, tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  const lerp = (a, b, t) => a + (b - a) * t;
  function target(n) {
    const p = n && n.closest && n.closest('.ph');
    if (!p || !p.querySelector('img.foto')) return null;
    return { box: p.closest('a.card, a.bcard') || p.parentElement, ph: p };
  }
  function paint() {
    cx = lerp(cx, tx, 0.14); cy = lerp(cy, ty, 0.14);
    el.style.transform = `perspective(900px) rotateX(${(-cy * 10).toFixed(2)}deg) rotateY(${(cx * 12).toFixed(2)}deg) scale3d(1.025,1.025,1.025)`;
    img.style.transform = `translate(${(cx * 14).toFixed(1)}px, ${(cy * 10).toFixed(1)}px) scale(1.07)`;
    ph.style.setProperty('--gx', (50 + cx * 90).toFixed(1) + '%');
    ph.style.setProperty('--gy', (50 + cy * 90).toFixed(1) + '%');
    if (Math.abs(cx - tx) > 0.001 || Math.abs(cy - ty) > 0.001) raf = requestAnimationFrame(paint); else raf = 0;
  }
  function leave() {
    if (!el) return;
    cancelAnimationFrame(raf); raf = 0;
    el.classList.remove('tilt-on'); el.style.transform = ''; img.style.transform = '';
    el = ph = img = null; cx = cy = tx = ty = 0;
  }
  document.addEventListener('mousemove', e => {
    if (!el || !el.contains(e.target)) {          // entra en otra tarjeta (o sale de todas)
      const t = target(e.target); leave(); if (!t) return;
      el = t.box; ph = t.ph; img = ph.querySelector('img.foto'); el.classList.add('tilt', 'tilt-on');
    }
    const r = el.getBoundingClientRect();
    tx = Math.max(-0.5, Math.min(0.5, (e.clientX - r.left) / r.width - 0.5));
    ty = Math.max(-0.5, Math.min(0.5, (e.clientY - r.top) / r.height - 0.5));
    if (!raf) raf = requestAnimationFrame(paint);
  }, { passive: true });
  document.addEventListener('mouseout', e => { if (el && (!e.relatedTarget || !el.contains(e.relatedTarget))) leave(); });
  window.addEventListener('hashchange', leave);
})();

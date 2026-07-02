(() => {
  const mesh = document.querySelector('.home-mesh');
  if (!mesh) return;

  mesh.classList.add('home-mesh--ready');

  const wraps = mesh.querySelectorAll('.home-mesh__orb-wrap');
  let frame = 0;

  const onMove = (x, y) => {
    const nx = (x / window.innerWidth - 0.5) * 2;
    const ny = (y / window.innerHeight - 0.5) * 2;
    wraps.forEach((wrap, index) => {
      const depth = 12 + index * 8;
      wrap.style.transform = `translate3d(${nx * depth}px, ${ny * depth}px, 0)`;
    });
  };

  const tick = () => {
    frame += 1;
    const t = frame * 0.012;
    mesh.style.setProperty('--mesh-shift', `${Math.sin(t) * 18}px`);
    mesh.style.setProperty('--mesh-lift', `${Math.cos(t * 0.85) * 14}px`);
    requestAnimationFrame(tick);
  };

  window.addEventListener('pointermove', (event) => onMove(event.clientX, event.clientY), { passive: true });
  window.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];
    if (touch) onMove(touch.clientX, touch.clientY);
  }, { passive: true });

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    requestAnimationFrame(tick);
  }
})();

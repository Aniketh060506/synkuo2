import { useEffect, useRef } from 'react';

export default function SplashParticleField({ active }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const particlesRef = useRef([]);
  const dprRef = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const state = { width: 0, height: 0 };
    dprRef.current = Math.min(window.devicePixelRatio || 1, 1.5);

    const makeParticles = () => {
      const count = Math.floor((state.width * state.height) / 14000); // density
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * state.width,
        y: Math.random() * state.height,
        r: 0.8 + Math.random() * 1.8,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        life: 1,
      }));
    };

    const resize = () => {
      state.width = window.innerWidth;
      state.height = window.innerHeight;
      canvas.width = Math.floor(state.width * dprRef.current);
      canvas.height = Math.floor(state.height * dprRef.current);
      canvas.style.width = state.width + 'px';
      canvas.style.height = state.height + 'px';
      ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
      makeParticles();
    };

    resize();
    window.addEventListener('resize', resize);

    let last = 0;
    const step = (t) => {
      if (!active) return; // stop when unmounted/hidden
      if (!last) last = t;
      const dt = t - last;
      if (dt < 33) { // ~30fps
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      last = t;

      ctx.clearRect(0, 0, state.width, state.height);
      ctx.fillStyle = '#fff';

      const ps = particlesRef.current;
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.x += p.vx;
        p.y += p.vy;
        // gentle wrap
        if (p.x < -10) p.x = state.width + 10;
        if (p.x > state.width + 10) p.x = -10;
        if (p.y < -10) p.y = state.height + 10;
        if (p.y > state.height + 10) p.y = -10;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // subtle links between close particles
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = '#fff';
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const dx = ps[i].x - ps[j].x;
          const dy = ps[i].y - ps[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 90 * 90) {
            ctx.beginPath();
            ctx.moveTo(ps[i].x, ps[i].y);
            ctx.lineTo(ps[j].x, ps[j].y);
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    // simple balloon effect on click
    const balloons = [];
    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      balloons.push({ x, y, r: 6, vy: -0.6, alpha: 0.9 });
    };
    canvas.addEventListener('click', onClick);

    // draw balloons on top
    const balloonLoop = () => {
      if (!active) return;
      const ctx2 = ctx;
      for (let i = balloons.length - 1; i >= 0; i--) {
        const b = balloons[i];
        b.y += b.vy;
        b.alpha -= 0.008;
        b.r += 0.04;
        if (b.alpha <= 0) {
          balloons.splice(i, 1);
          continue;
        }
        ctx2.save();
        ctx2.globalAlpha = Math.max(0, b.alpha);
        ctx2.strokeStyle = '#ffffff';
        ctx2.lineWidth = 1;
        ctx2.beginPath();
        ctx2.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx2.stroke();
        ctx2.restore();
      }
      rafRef.current = requestAnimationFrame(balloonLoop);
    };
    rafRef.current = requestAnimationFrame(balloonLoop);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', onClick);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  return <canvas ref={canvasRef} className="splash-particles" />;
}

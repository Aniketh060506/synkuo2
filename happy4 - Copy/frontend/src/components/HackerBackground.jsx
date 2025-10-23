import { useEffect, useRef } from 'react';

export default function HackerBackground() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const state = {
      cols: 0,
      fontSize: 14, // fewer columns -> faster
      drops: [],     // current head positions per column
      speeds: [],    // variable speeds per column
      width: 0,
      height: 0,
      dpr: 1, // cap to 1 for perf
    };

    const CHARS = '01{}[]<>#/$%&=+*ABCDEFGHIKLMNOPQRSTUVWXYZ';

    const resize = () => {
      state.width = window.innerWidth;
      state.height = window.innerHeight;
      canvas.width = Math.floor(state.width * state.dpr);
      canvas.height = Math.floor(state.height * state.dpr);
      canvas.style.width = state.width + 'px';
      canvas.style.height = state.height + 'px';
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

      state.cols = Math.floor(state.width / state.fontSize);
      state.drops = Array.from({ length: state.cols }, () => Math.floor(Math.random() * -40));
      state.speeds = Array.from({ length: state.cols }, () => 0.9 + Math.random() * 0.8);
      ctx.font = `${state.fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
    };

    resize();
    window.addEventListener('resize', resize);

    const step = (t) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = t;
      }
      const dt = t - lastTimeRef.current;
      // cap to ~22fps for perf
      if (dt < 45) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      lastTimeRef.current = t;

      // trail (slightly darker to lengthen fall feel)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(0, 0, state.width, state.height);

      for (let i = 0; i < state.cols; i++) {
        const x = i * state.fontSize + 2;
        const speed = state.speeds[i];
        state.drops[i] += speed; // falling down
        const y = (state.drops[i] * state.fontSize);

        // Draw multi-segment stream: bright head + fading tail (no blending)
        const alphas = [0.5, 0.22, 0.12, 0.06];
        ctx.save();
        for (let seg = 0; seg < alphas.length; seg++) {
          const yy = y - seg * state.fontSize;
          if (yy < -state.fontSize) continue;
          const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
          ctx.fillStyle = `rgba(120,255,170,${alphas[seg]})`;
          ctx.fillText(ch, x, yy);
        }
        ctx.restore();

        // reset stream when offscreen, with small randomness
        if (y - alphas.length * state.fontSize > state.height && Math.random() > 0.9) {
          state.drops[i] = Math.floor(Math.random() * -40);
          state.speeds[i] = 0.9 + Math.random() * 0.8;
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="hacker-bg">
      <canvas ref={canvasRef} className="hacker-canvas" />
      <div className="hacker-scanlines" />
      <div className="hacker-vignette" />
    </div>
  );
}

import { useRef, useEffect } from 'react';
import { __pianoroll } from '@strudel/draw';
import { getActivePattern, getTime } from '../engine/strudel';

interface VisualizerProps {
  /** Whether the visualizer should be actively drawing. */
  active: boolean;
}

export default function Visualizer({ active }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const pattern = getActivePattern() as {
        queryArc: (begin: number, end: number) => unknown[];
      } | null;

      // Resize canvas to match CSS size (retina-aware)
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      if (pattern) {
        const time = Math.max(getTime(), 0);
        const cycles = 4;
        const playhead = 0.5;
        const lookbehind = cycles * playhead;
        const lookahead = cycles * (1 - playhead);
        const haps = pattern.queryArc(time - lookbehind, time + lookahead);

        __pianoroll({
          time,
          haps,
          ctx,
          cycles,
          playhead,
          active: '#00ffd5',
          inactive: '#1a3a35',
          background: '#000000',
          playheadColor: '#00ffd5',
          fold: 1,
          autorange: 1,
          labels: 1,
          fill: 1,
          fillActive: 1,
          strokeActive: 0,
        });
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="visualizer-panel">
      <canvas ref={canvasRef} className="visualizer-canvas" />
    </div>
  );
}

import { useRef, useEffect, useState, useCallback } from 'react';

export type DrawTool = 'pen' | 'highlighter' | 'eraser';

interface DrawCanvasProps {
  tool?: DrawTool;
  color?: string;
  size?: number;
}

interface Stroke {
  tool: DrawTool;
  color: string;
  size: number;
  points: { x: number; y: number; pressure: number }[];
}

export function DrawCanvas({ tool = 'pen', color = '#d8dee9', size = 2 }: DrawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStroke = useRef<Stroke | null>(null);
  const isDrawing = useRef(false);

  // Resize canvas to match container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        redraw(ctx, strokes);
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, [strokes]);

  const redraw = useCallback((ctx: CanvasRenderingContext2D, allStrokes: Stroke[]) => {
    const canvas = ctx.canvas;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    for (const stroke of allStrokes) {
      if (stroke.points.length < 2) continue;
      ctx.save();

      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = stroke.size * 6;
      } else if (stroke.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'multiply';
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = stroke.size * 8;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        // Apply pressure sensitivity for pen
        if (stroke.tool === 'pen' && p.pressure > 0) {
          ctx.lineWidth = stroke.size * (0.5 + p.pressure);
        }
        ctx.lineTo(p.x, p.y);
      }

      ctx.stroke();
      ctx.restore();
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Accept all pointer types (mouse, pen, touch)
    const canvas = canvasRef.current;
    if (!canvas) return;

    isDrawing.current = true;
    canvas.setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentStroke.current = {
      tool,
      color,
      size,
      points: [{ x, y, pressure: e.pressure }],
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing.current || !currentStroke.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentStroke.current.points.push({ x, y, pressure: e.pressure });

    // Live draw
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      redraw(ctx, [...strokes, currentStroke.current]);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing.current || !currentStroke.current) return;
    isDrawing.current = false;

    if (currentStroke.current.points.length > 1) {
      setStrokes(prev => [...prev, currentStroke.current!]);
    }
    currentStroke.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      className="draw-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        touchAction: 'none',
        cursor: tool === 'eraser' ? 'crosshair' : 'crosshair',
      }}
    />
  );
}

"use client";

import React, { useRef, useCallback, useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Undo2, Eraser } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SignaturePadHandle {
  /** Returns the current signature as a base64 data URL, or null if empty. */
  getSignature: () => string | null;
  /** Clears the pad entirely. */
  clear: () => void;
  /** Removes the last stroke. */
  undo: () => void;
  /** Whether the pad has any strokes. */
  isEmpty: () => boolean;
}

interface SignaturePadProps {
  /** Called when the user saves (lifts pointer after drawing). */
  onSave?: (dataUrl: string) => void;
  /** Called after the pad is cleared. */
  onClear?: () => void;
  /** Additional class names for the wrapper. */
  className?: string;
  /** Disables drawing. */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

function getCanvasPoint(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const { points, color, width } = stroke;
  if (points.length === 0) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (points.length === 1) {
    // Single point – draw a small dot
    const p = points[0];
    ctx.beginPath();
    ctx.arc(p.x, p.y, width / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    // Smooth bezier through all points
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    // Connect to the last point
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }

  ctx.restore();
}

function redrawAll(ctx: CanvasRenderingContext2D, strokes: Stroke[], width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  strokes.forEach((s) => drawStroke(ctx, s));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad({ onSave, onClear, className = '', disabled = false }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const isDrawingRef = useRef(false);
    const currentStrokeRef = useRef<Stroke | null>(null);
    const [, forceUpdate] = useState(0);

    // Refs for canvas dimensions
    const canvasWidth = useRef(400);
    const canvasHeight = useRef(180);

    // ---- Resize canvas to match CSS -----------------------------------
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvasWidth.current = rect.width;
        canvasHeight.current = rect.height;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
          redrawAll(ctx, strokes, rect.width, rect.height);
        }
      };

      resize();
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }, [strokes]);

    // ---- Re-render strokes when they change ---------------------------
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redrawAll(ctx, strokes, canvasWidth.current, canvasHeight.current);
    }, [strokes]);

    // ---- Pointer helpers ----------------------------------------------

    const startDrawing = useCallback(
      (clientX: number, clientY: number) => {
        if (disabled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const point = getCanvasPoint(canvas, clientX, clientY);
        const newStroke: Stroke = { points: [point], color: '#ffffff', width: 2.5 };
        currentStrokeRef.current = newStroke;
        isDrawingRef.current = true;
      },
      [disabled],
    );

    const draw = useCallback(
      (clientX: number, clientY: number) => {
        if (!isDrawingRef.current || disabled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const point = getCanvasPoint(canvas, clientX, clientY);
        const stroke = currentStrokeRef.current;
        if (!stroke) return;
        stroke.points.push(point);

        // Draw incrementally
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawStroke(ctx, stroke);
      },
      [disabled],
    );

    const endDrawing = useCallback(() => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      const stroke = currentStrokeRef.current;
      if (stroke && stroke.points.length > 0) {
        setStrokes((prev) => {
          const next = [...prev, stroke];
          return next;
        });
        onSave?.(canvasRef.current?.toDataURL('image/png') ?? '');
      }
      currentStrokeRef.current = null;
    }, [onSave]);

    // ---- Mouse events -------------------------------------------------
    const handleMouseDown = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => startDrawing(e.clientX, e.clientY),
      [startDrawing],
    );
    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => draw(e.clientX, e.clientY),
      [draw],
    );
    const handleMouseUp = useCallback(() => endDrawing(), [endDrawing]);
    const handleMouseLeave = useCallback(() => {
      if (isDrawingRef.current) endDrawing();
    }, [endDrawing]);

    // ---- Touch events -------------------------------------------------
    const handleTouchStart = useCallback(
      (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const touch = e.touches[0];
        if (touch) startDrawing(touch.clientX, touch.clientY);
      },
      [startDrawing],
    );
    const handleTouchMove = useCallback(
      (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const touch = e.touches[0];
        if (touch) draw(touch.clientX, touch.clientY);
      },
      [draw],
    );
    const handleTouchEnd = useCallback(
      (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        endDrawing();
      },
      [endDrawing],
    );

    // ---- Exposed methods ----------------------------------------------
    const clear = useCallback(() => {
      if (disabled) return;
      currentStrokeRef.current = null;
      isDrawingRef.current = false;
      setStrokes([]);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasWidth.current, canvasHeight.current);
        }
      }
      onClear?.();
      forceUpdate((n) => n + 1);
    }, [disabled, onClear]);

    const undo = useCallback(() => {
      if (disabled) return;
      if (strokes.length === 0) return;
      currentStrokeRef.current = null;
      isDrawingRef.current = false;
      setStrokes((prev) => {
        const next = prev.slice(0, -1);
        return next;
      });
    }, [disabled, strokes.length]);

    const getSignature = useCallback((): string | null => {
      const canvas = canvasRef.current;
      if (!canvas || strokes.length === 0) return null;
      return canvas.toDataURL('image/png');
    }, [strokes.length]);

    const isEmpty = useCallback((): boolean => strokes.length === 0, [strokes.length]);

    useImperativeHandle(ref, () => ({ getSignature, clear, undo, isEmpty }), [
      getSignature,
      clear,
      undo,
      isEmpty,
    ]);

    // ---- Render -------------------------------------------------------
    return (
      <div className={`space-y-2 ${className}`}>
        <div
          className={`relative rounded-xl border border-[var(--border-primary)] overflow-hidden transition-opacity ${
            disabled ? 'opacity-50' : ''
          }`}
          style={{ background: '#1a1a2e' }}
          role="img"
          aria-label="Signature pad. Use mouse or touch to draw your signature."
        >
          <canvas
            ref={canvasRef}
            className="block w-full touch-none"
            style={{ height: '180px', cursor: disabled ? 'not-allowed' : 'crosshair' }}
            onMouseDown={disabled ? undefined : handleMouseDown}
            onMouseMove={disabled ? undefined : handleMouseMove}
            onMouseUp={disabled ? undefined : handleMouseUp}
            onMouseLeave={disabled ? undefined : handleMouseLeave}
            onTouchStart={disabled ? undefined : handleTouchStart}
            onTouchMove={disabled ? undefined : handleTouchMove}
            onTouchEnd={disabled ? undefined : handleTouchEnd}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={undo}
              disabled={disabled || strokes.length === 0}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs hover:bg-[var(--bg-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Undo last stroke"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </button>
            <button
              type="button"
              onClick={clear}
              disabled={disabled || strokes.length === 0}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs hover:bg-[var(--bg-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Clear signature"
            >
              <Eraser className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)]">
            {strokes.length === 0 ? 'Draw with mouse or touch' : `${strokes.length} stroke${strokes.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>
    );
  },
);

export { SignaturePad };
export default SignaturePad;

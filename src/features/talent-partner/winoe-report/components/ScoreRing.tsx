'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/shared/ui/classnames';
import { formatSummaryTone, formatWinoeScore } from '../utils/reportFormatting';

function useReducedMotionPreference(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  return prefersReducedMotion;
}

type Props = {
  score: number;
};

export function ScoreRing({ score }: Props) {
  const reducedMotion = useReducedMotionPreference();
  const [animatedScore, setAnimatedScore] = useState(reducedMotion ? score : 0);

  useEffect(() => {
    if (reducedMotion) {
      const frame = requestAnimationFrame(() => setAnimatedScore(score));
      return () => cancelAnimationFrame(frame);
    }

    let frame = 0;
    const duration = 1200;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(score * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion, score]);

  const size = 280;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, animatedScore)) / 100;
  const dashOffset = circumference * (1 - progress);
  const tone = formatSummaryTone(score);

  return (
    <div className="score-ring relative mx-auto flex w-fit items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-[0_14px_30px_rgba(0,0,0,0.08)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="score-ring-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--wheat-300)" />
            <stop offset="100%" stopColor="var(--wheat-700)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#score-ring-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="flex items-end gap-1 text-[72px] font-semibold leading-none tracking-tight tabular-nums text-primary">
          <span>{formatWinoeScore(animatedScore)}</span>
        </div>
        <div className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-secondary">
          Winoe Score
        </div>
        <div
          className={cn(
            'mt-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.14em]',
            tone === 'strong'
              ? 'border-wheat-300 bg-wheat-50 text-wheat-900'
              : tone === 'steady'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : tone === 'mixed'
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-slate-200 bg-slate-50 text-slate-700',
          )}
        >
          {tone === 'strong'
            ? 'Strong signal'
            : tone === 'steady'
              ? 'Measured signal'
              : tone === 'mixed'
                ? 'Mixed signal'
                : 'Thin signal'}
        </div>
      </div>
    </div>
  );
}

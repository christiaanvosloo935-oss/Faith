import type { CSSProperties, ReactElement } from 'react';
import type { Motif } from '../db';

/** A single leaf, pointing up. */
export function Leaf({ size = 16, color = 'currentColor', rotate = 0, style }: { size?: number; color?: string; rotate?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ transform: `rotate(${rotate}deg)`, ...style }}>
      <path d="M12 2C18 7 20 13 16.5 19 15 21.5 13.5 22 12 22s-3-.5-4.5-3C4 13 6 7 12 2z" fill={color} />
      <path d="M12 6v15" stroke="var(--parchment)" strokeWidth="1.2" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

/** Small olive sprig used in headers and corners. */
export function Sprig({ width = 120, className, flip = false }: { width?: number; className?: string; flip?: boolean }) {
  return (
    <svg className={className} width={width} height={width * 0.42} viewBox="0 0 120 50" aria-hidden style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M4 40 C 30 36, 60 26, 116 8" stroke="var(--bark)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {[
        [22, 37, -70, 'var(--leaf)'],
        [26, 30, -140, 'var(--leaf-light)'],
        [44, 31, -65, 'var(--leaf-light)'],
        [50, 24, -145, 'var(--leaf)'],
        [68, 24, -60, 'var(--leaf)'],
        [74, 17, -150, 'var(--leaf-light)'],
        [92, 16, -55, 'var(--leaf-light)'],
        [96, 9, -150, 'var(--leaf)'],
      ].map(([x, y, r, c], i) => (
        <path
          key={i}
          d="M0 0 C 5 -4, 12 -4, 16 0 C 12 4, 5 4, 0 0 z"
          fill={c as string}
          transform={`translate(${x} ${y}) rotate(${r as number + 90}) scale(1.05)`}
        />
      ))}
      <circle cx="113" cy="9" r="3" fill="var(--olive-fruit)" />
    </svg>
  );
}

/** Horizontal vine divider. */
export function VineDivider() {
  return (
    <div className="vine-divider" aria-hidden>
      <svg viewBox="0 0 300 24" preserveAspectRatio="xMidYMid meet">
        <path d="M0 12 Q 37 2, 75 12 T 150 12 T 225 12 T 300 12" stroke="var(--bark)" strokeWidth="1.5" fill="none" opacity=".6" />
        {[38, 112, 188, 262].map((x, i) => (
          <path key={x} d="M0 0 C 4 -4, 10 -4, 13 0 C 10 4, 4 4, 0 0 z" fill={i % 2 ? 'var(--leaf-light)' : 'var(--leaf)'} transform={`translate(${x} ${i % 2 ? 13 : 9}) rotate(${i % 2 ? 30 : -30})`} />
        ))}
        <circle cx="150" cy="12" r="3.5" fill="var(--olive-fruit)" />
      </svg>
    </div>
  );
}

/** Repeating background motif for sermon pages, drawn in the accent colour. */
export function MotifPattern({ motif, color }: { motif: Motif; color: string }) {
  const id = `motif-${motif}`;
  const shapes: Record<Motif, ReactElement> = {
    leaves: (
      <g fill={color}>
        <path d="M10 30 C 14 22, 22 20, 28 22 C 24 28, 18 32, 10 30 z" />
        <path d="M44 10 C 48 4, 56 4, 60 8 C 54 12, 50 12, 44 10 z" />
      </g>
    ),
    vine: (
      <g fill="none" stroke={color} strokeWidth="1.4">
        <path d="M0 40 Q 16 24, 32 40 T 64 40" />
        <circle cx="16" cy="30" r="3" fill={color} />
        <circle cx="21" cy="33" r="3" fill={color} />
        <circle cx="18" cy="37" r="3" fill={color} />
      </g>
    ),
    wheat: (
      <g fill={color}>
        <path d="M32 58 L32 18" stroke={color} strokeWidth="1.3" />
        {[22, 30, 38].map((y) => (
          <g key={y}>
            <ellipse cx="28" cy={y} rx="3" ry="5.5" transform={`rotate(-25 28 ${y})`} />
            <ellipse cx="36" cy={y} rx="3" ry="5.5" transform={`rotate(25 36 ${y})`} />
          </g>
        ))}
        <ellipse cx="32" cy="14" rx="2.8" ry="5" />
      </g>
    ),
    waves: (
      <g fill="none" stroke={color} strokeWidth="1.5">
        <path d="M0 20 Q 8 12, 16 20 T 32 20 T 48 20 T 64 20" />
        <path d="M0 44 Q 8 36, 16 44 T 32 44 T 48 44 T 64 44" />
      </g>
    ),
    stone: (
      <g fill={color}>
        <ellipse cx="18" cy="20" rx="10" ry="7" />
        <ellipse cx="46" cy="44" rx="12" ry="8" />
        <ellipse cx="50" cy="14" rx="6" ry="4.5" />
      </g>
    ),
    stars: (
      <g fill={color}>
        <path d="M16 8 l2.4 6 6.4.4-5 4 1.6 6.2L16 21l-5.4 3.6 1.6-6.2-5-4 6.4-.4z" />
        <circle cx="46" cy="40" r="1.8" />
        <circle cx="54" cy="18" r="1.2" />
        <circle cx="30" cy="52" r="1.4" />
      </g>
    ),
  };
  return (
    <svg className="motif-pattern" aria-hidden width="100%" height="100%">
      <defs>
        <pattern id={id} width="64" height="64" patternUnits="userSpaceOnUse">
          {shapes[motif]}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

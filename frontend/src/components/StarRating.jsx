import React, { useState } from 'react';
import { Star } from 'lucide-react';

export function StarDisplay({ rating, size = 14, showNumber = false }) {
  if (rating == null || isNaN(rating)) return null;
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < full
              ? 'text-amber-400 fill-amber-400'
              : half && i === full
              ? 'text-amber-400 fill-amber-200'
              : 'text-slate-200 fill-slate-100'
          }
        />
      ))}
      {showNumber && <span className="ml-1 text-sm font-bold text-slate-700">{rating.toFixed(1)}</span>}
    </span>
  );
}

export function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            size={28}
            className={
              n <= (hovered || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-200 fill-slate-100'
            }
          />
        </button>
      ))}
    </div>
  );
}

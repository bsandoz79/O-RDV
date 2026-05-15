import { useMemo } from 'react';
import { Check, X } from 'lucide-react';

function getScore(pwd) {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8)            score++;
  if (/[A-Z]/.test(pwd))          score++;
  if (/[0-9]/.test(pwd))          score++;
  if (/[^A-Za-z0-9]/.test(pwd))  score++;
  return score;
}

export function getPasswordScore(pwd) { return getScore(pwd); }

const LEVELS = [
  null,
  { label: 'Faible',    bar: 'bg-red-400',     text: 'text-red-500' },
  { label: 'Moyen',     bar: 'bg-orange-400',  text: 'text-orange-500' },
  { label: 'Fort',      bar: 'bg-blue-500',    text: 'text-blue-600' },
  { label: 'Très fort', bar: 'bg-emerald-400', text: 'text-emerald-600' },
];

const CRITERIA = [
  { label: '8 caractères minimum', test: p => p.length >= 8 },
  { label: '1 majuscule (A–Z)',     test: p => /[A-Z]/.test(p) },
  { label: '1 chiffre (0–9)',       test: p => /[0-9]/.test(p) },
  { label: '1 caractère spécial',   test: p => /[^A-Za-z0-9]/.test(p) },
];

export default function PasswordStrength({ password }) {
  const score = useMemo(() => getScore(password), [password]);

  if (!password) return null;

  const level = LEVELS[score];

  return (
    <div className="mt-2 space-y-2">
      {/* Barres de progression */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? level.bar : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <p className={`text-xs font-bold ${level.text}`}>{level.label}</p>

      {/* Critères */}
      <ul className="space-y-0.5">
        {CRITERIA.map(({ label, test }) => {
          const ok = test(password);
          return (
            <li key={label} className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>
              {ok
                ? <Check size={11} className="text-emerald-500 flex-shrink-0" />
                : <X    size={11} className="text-slate-300 flex-shrink-0" />}
              {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

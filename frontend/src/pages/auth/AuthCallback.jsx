import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const user  = params.get('user');
    const error = params.get('error');

    if (error || !token || !user) {
      const msg = error === 'banned'
        ? 'Ce compte est suspendu.'
        : 'Connexion Google échouée. Réessayez.';
      sessionStorage.setItem('redirectMsg', msg);
      navigate('/login');
      return;
    }

    try {
      const parsed = JSON.parse(decodeURIComponent(user));
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(parsed));
      window.dispatchEvent(new Event('authChange'));
      navigate(parsed.role === 'pro' ? '/pro/settings' : '/account', { replace: true });
    } catch {
      navigate('/login');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 size={32} className="animate-spin text-rose-500" />
      <p className="text-sm text-slate-500">Connexion en cours…</p>
    </div>
  );
}
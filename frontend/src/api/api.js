const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// sessionStorage prioritaire pour l'impersonation admin (iframe), sinon cookie httpOnly (auth normale)
export function getToken() {
  return sessionStorage.getItem('_impToken') || null;
}

export function getUser() {
  const u = sessionStorage.getItem('_impUser') || localStorage.getItem('user');
  try { return JSON.parse(u || '{}'); } catch { return {}; }
}

export async function apiFetch(url, options = {}) {
  const impToken = sessionStorage.getItem('_impToken');

  const opts = {
    ...options,
    credentials: 'include', // envoie le cookie httpOnly automatiquement
  };

  // Impersonation : injecte le token dans le header Authorization
  if (impToken) {
    opts.headers = { ...(options.headers || {}), Authorization: `Bearer ${impToken}` };
  }

  const response = await fetch(url, opts);

  if (response.status === 401) {
    if (!impToken) {
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('authChange'));
      window.location.href = '/login?session=expired';
    }
    return response;
  }
  return response;
}

export default API_BASE_URL;

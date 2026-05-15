const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// sessionStorage prioritaire (iframe impersonation), sinon localStorage
export function getToken() {
  return sessionStorage.getItem('_impToken') || localStorage.getItem('token');
}

export function getUser() {
  const u = sessionStorage.getItem('_impUser') || localStorage.getItem('user');
  try { return JSON.parse(u || '{}'); } catch { return {}; }
}

export async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  if (response.status === 401) {
    if (!sessionStorage.getItem('_impToken')) {
      localStorage.clear();
      window.dispatchEvent(new Event('authChange'));
      window.location.href = '/login?session=expired';
    }
    return response;
  }
  return response;
}

export default API_BASE_URL;

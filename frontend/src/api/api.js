const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  if (response.status === 401) {
    localStorage.clear();
    window.dispatchEvent(new Event('authChange'));
    window.location.href = '/login?session=expired';
    return response;
  }
  return response;
}

export default API_BASE_URL;

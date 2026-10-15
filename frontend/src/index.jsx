import React from 'react';
import './index.css'
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import API_BASE_URL from './api/api';

// Le JWT est dans un cookie httpOnly posé par l'API (autre domaine) :
// toute requête vers l'API doit l'envoyer, sinon le backend répond 401.
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  const url = typeof input === 'string' ? input : (input?.url || '');
  if (url.startsWith(API_BASE_URL)) init = { credentials: 'include', ...init };
  return nativeFetch(input, init);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
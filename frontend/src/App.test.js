import { render } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

test('le composant App s\'affiche sans crash', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
});
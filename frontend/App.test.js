import { render, screen } from '@testing-library/react';
import React from 'react';
import App from './App.js';

test('vérifie que le projet démarre sans erreur', () => {
  render(<App />);
});
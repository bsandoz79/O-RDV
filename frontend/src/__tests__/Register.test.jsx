import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));
jest.mock('../api/api', () => 'http://localhost:5000/api');

import Register from '../pages/auth/Register';
import { MemoryRouter } from 'react-router-dom';

function renderRegister() {
  return render(<MemoryRouter><Register /></MemoryRouter>);
}

test("affiche le titre de la page d'inscription", () => {
  renderRegister();
  expect(screen.getByText(/créer un compte/i)).toBeInTheDocument();
});

test('affiche les champs email et mot de passe', () => {
  renderRegister();
  expect(screen.getByPlaceholderText('Adresse email')).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/mot de passe/i)).toBeInTheDocument();
});

test('affiche les deux boutons Client / Prestataire', () => {
  renderRegister();
  expect(screen.getByRole('button', { name: /^client$/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^prestataire$/i })).toBeInTheDocument();
});

test("bascule en mode prestataire au clic sur 'Prestataire'", () => {
  renderRegister();

  // En mode client par défaut
  expect(screen.queryByPlaceholderText(/nom de l'établissement/i)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^prestataire$/i }));

  // Après le clic : champ établissement visible + label du bouton changé
  expect(screen.getByPlaceholderText(/nom de l'établissement/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /démarrer mon activité/i })).toBeInTheDocument();
});

test('affiche un lien vers la page de connexion', () => {
  renderRegister();
  expect(screen.getByText(/déjà inscrit/i)).toBeInTheDocument();
});

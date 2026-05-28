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

test('affiche une erreur si le mot de passe est trop faible', async () => {
  renderRegister();
  fireEvent.change(screen.getByPlaceholderText('Adresse email'), { target: { value: 'a@a.com' } });
  fireEvent.change(screen.getByPlaceholderText(/mot de passe/i), { target: { value: 'faible' } });
  fireEvent.click(screen.getByRole('button', { name: /m'inscrire/i }));

  expect(await screen.findByText(/mot de passe trop faible/i)).toBeInTheDocument();
});

test('affiche "Création en cours..." pendant le chargement', async () => {
  global.fetch = jest.fn(() => new Promise(() => {}));

  renderRegister();
  fireEvent.change(screen.getByPlaceholderText('Adresse email'), { target: { value: 'new@test.com' } });
  fireEvent.change(screen.getByPlaceholderText(/mot de passe/i), { target: { value: 'Password1' } });
  fireEvent.click(screen.getByRole('button', { name: /m'inscrire/i }));

  expect(await screen.findByText(/création en cours/i)).toBeInTheDocument();
});

test('affiche le bouton Google', () => {
  renderRegister();
  expect(screen.getByText(/continuer avec google/i)).toBeInTheDocument();
});

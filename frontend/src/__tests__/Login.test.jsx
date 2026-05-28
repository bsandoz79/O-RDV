import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams()],
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));
jest.mock('../api/api', () => 'http://localhost:5000/api');

import Login from '../pages/auth/Login';
import { MemoryRouter } from 'react-router-dom';

function renderLogin() {
  return render(<MemoryRouter><Login /></MemoryRouter>);
}

test('affiche le titre de la page de connexion', () => {
  renderLogin();
  expect(screen.getByText('Connexion')).toBeInTheDocument();
});

test('affiche le formulaire avec email et mot de passe', () => {
  renderLogin();
  expect(screen.getByPlaceholderText('votre@email.com')).toBeInTheDocument();
  expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
});

test('affiche le bouton de soumission', () => {
  renderLogin();
  expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
});

test("affiche un message si la session a expiré", () => {
  jest.spyOn(require('react-router-dom'), 'useSearchParams')
    .mockReturnValue([new URLSearchParams('session=expired')]);

  renderLogin();
  expect(screen.getByText(/votre session a expiré/i)).toBeInTheDocument();
});

test('affiche "Vérification..." pendant le chargement', async () => {
  global.fetch = jest.fn(() => new Promise(() => {}));

  renderLogin();
  fireEvent.change(screen.getByPlaceholderText('votre@email.com'), {
    target: { value: 'a@a.com' },
  });
  const passwordInput = screen.getByLabelText(/mot de passe/i);
  fireEvent.change(passwordInput, { target: { value: 'pass' } });
  fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

  expect(await screen.findByText(/vérification/i)).toBeInTheDocument();
});

test('affiche le message d\'erreur retourné par le serveur', async () => {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: 'Identifiants invalides.' }),
  });

  renderLogin();
  fireEvent.change(screen.getByPlaceholderText('votre@email.com'), { target: { value: 'x@x.com' } });
  fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'wrong' } });
  fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

  expect(await screen.findByText('Identifiants invalides.')).toBeInTheDocument();
});

test('affiche une erreur si le serveur est injoignable', async () => {
  global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

  renderLogin();
  fireEvent.change(screen.getByPlaceholderText('votre@email.com'), { target: { value: 'x@x.com' } });
  fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'pass' } });
  fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

  expect(await screen.findByText(/impossible de contacter le serveur/i)).toBeInTheDocument();
});

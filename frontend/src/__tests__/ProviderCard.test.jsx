import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProviderCard from '../components/ProviderCard';

const BASE_PROVIDER = {
  name: 'Salon Élégance',
  metier: 'Coiffure',
  avg_rating: 4.5,
  review_count: 32,
  distance: '1,2 km',
  image: '/img/test.jpg',
  todayOpen: null,
  todayClose: null,
  todayIsClosed: true,
  createdAt: null,
};

test('affiche le nom du prestataire', () => {
  render(<ProviderCard provider={BASE_PROVIDER} onClick={() => {}} />);
  expect(screen.getByText('Salon Élégance')).toBeInTheDocument();
});

test('affiche le badge "Fermé" si is_closed=true', () => {
  render(<ProviderCard provider={BASE_PROVIDER} onClick={() => {}} />);
  expect(screen.getByText('Fermé')).toBeInTheDocument();
});

test('affiche la note et le nombre d\'avis', () => {
  render(<ProviderCard provider={BASE_PROVIDER} onClick={() => {}} />);
  expect(screen.getByText('4.5')).toBeInTheDocument();
  expect(screen.getByText('(32 avis)')).toBeInTheDocument();
});

test('affiche la distance', () => {
  render(<ProviderCard provider={BASE_PROVIDER} onClick={() => {}} />);
  expect(screen.getByText('1,2 km')).toBeInTheDocument();
});

test('affiche le badge "Nouveau" pour un prestataire créé aujourd\'hui', () => {
  const provider = { ...BASE_PROVIDER, createdAt: new Date().toISOString() };
  render(<ProviderCard provider={provider} onClick={() => {}} />);
  expect(screen.getByText('Nouveau')).toBeInTheDocument();
});

test('n\'affiche pas le badge "Nouveau" pour un ancien prestataire', () => {
  const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const provider = { ...BASE_PROVIDER, createdAt: oldDate };
  render(<ProviderCard provider={provider} onClick={() => {}} />);
  expect(screen.queryByText('Nouveau')).not.toBeInTheDocument();
});

test('appelle onClick au clic sur la carte', () => {
  const handleClick = jest.fn();
  render(<ProviderCard provider={BASE_PROVIDER} onClick={handleClick} />);
  fireEvent.click(screen.getByRole('article'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});

test("affiche 'Pas encore d'avis' si aucune note", () => {
  const provider = { ...BASE_PROVIDER, avg_rating: null, review_count: 0 };
  render(<ProviderCard provider={provider} onClick={() => {}} />);
  expect(screen.getByText(/pas encore d'avis/i)).toBeInTheDocument();
});

test("affiche le badge 'Ouvert' si le prestataire est ouvert maintenant", () => {
  const now = new Date();
  const openH  = String(now.getHours()).padStart(2, '0');
  const closeH = String((now.getHours() + 2) % 24).padStart(2, '0');
  const provider = {
    ...BASE_PROVIDER,
    todayIsClosed: false,
    todayOpen:  `${openH}:00`,
    todayClose: `${closeH}:00`,
  };
  render(<ProviderCard provider={provider} onClick={() => {}} />);
  expect(screen.getByText('Ouvert')).toBeInTheDocument();
});

test('affiche le bouton favori et appelle onFavoriteToggle', () => {
  const toggle = jest.fn();
  render(
    <ProviderCard
      provider={{ ...BASE_PROVIDER, id: 42 }}
      onClick={() => {}}
      isFavorite={false}
      onFavoriteToggle={toggle}
    />
  );
  fireEvent.click(screen.getByLabelText(/ajouter aux favoris/i));
  expect(toggle).toHaveBeenCalledWith(42);
});

test("affiche le bouton favori actif si isFavorite=true", () => {
  const toggle = jest.fn();
  render(
    <ProviderCard
      provider={{ ...BASE_PROVIDER, id: 1 }}
      onClick={() => {}}
      isFavorite={true}
      onFavoriteToggle={toggle}
    />
  );
  expect(screen.getByLabelText(/retirer des favoris/i)).toBeInTheDocument();
});

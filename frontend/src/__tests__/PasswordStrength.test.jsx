import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PasswordStrength, { getPasswordScore } from '../components/PasswordStrength';

// ── getPasswordScore ─────────────────────────────────────────────────────────

describe('getPasswordScore', () => {
  test('retourne 0 pour un mot de passe vide', () => {
    expect(getPasswordScore('')).toBe(0);
  });

  test('retourne 1 pour 8 caractères sans majuscule ni chiffre', () => {
    expect(getPasswordScore('abcdefgh')).toBe(1);
  });

  test('retourne 2 pour 8 caractères + majuscule', () => {
    expect(getPasswordScore('Abcdefgh')).toBe(2);
  });

  test('retourne 3 pour 8 caractères + majuscule + chiffre', () => {
    expect(getPasswordScore('Abcdefg1')).toBe(3);
  });

  test('retourne 4 pour mot de passe complet avec caractère spécial', () => {
    expect(getPasswordScore('Abcdef1!')).toBe(4);
  });
});

// ── Composant PasswordStrength ────────────────────────────────────────────────

describe('PasswordStrength component', () => {
  test("n'affiche rien si le mot de passe est vide", () => {
    const { container } = render(<PasswordStrength password="" />);
    expect(container.firstChild).toBeNull();
  });

  test('affiche "Trop faible" pour un mot de passe court', () => {
    render(<PasswordStrength password="ab" />);
    expect(screen.getByText('Trop faible')).toBeInTheDocument();
  });

  test('affiche "Faible" pour un mot de passe de 8 caractères simples', () => {
    render(<PasswordStrength password="abcdefgh" />);
    expect(screen.getByText('Faible')).toBeInTheDocument();
  });

  test('affiche "Très fort" pour un mot de passe fort', () => {
    render(<PasswordStrength password="Abcdef1!" />);
    expect(screen.getByText('Très fort')).toBeInTheDocument();
  });

  test('affiche les 4 critères', () => {
    render(<PasswordStrength password="ab" />);
    expect(screen.getByText('8 caractères minimum')).toBeInTheDocument();
    expect(screen.getByText('1 majuscule (A–Z)')).toBeInTheDocument();
    expect(screen.getByText('1 chiffre (0–9)')).toBeInTheDocument();
    expect(screen.getByText('1 caractère spécial')).toBeInTheDocument();
  });
});

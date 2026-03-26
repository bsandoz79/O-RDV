import { render } from '@testing-library/react';
import React from 'react';
import App from './App'; // Si tu as renommé en .jsx, React le trouvera quand même

test('le composant App s\'affiche sans crash', () => {
  render(<App />);
});
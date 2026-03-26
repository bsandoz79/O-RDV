import React from 'react';
import SearchBar from '../components/SearchBar';

const Home = () => {
  return (
    <div>
      <SearchBar />
      <div className="p-4">
        <h3 className="font-bold mb-3">Catégories</h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {['Coiffure', 'Bien-être', 'Massage'].map(cat => (
            <button key={cat} className="px-4 py-2 bg-white border rounded-full text-sm">
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
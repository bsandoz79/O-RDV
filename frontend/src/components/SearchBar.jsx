import React from 'react';

const SearchBar = () => {
  return (
    <div className="p-4 bg-white shadow-md rounded-b-2xl">
      <h2 className="text-xl font-bold text-blue-900">Trouvez le service idéal</h2>
      <p className="text-sm text-gray-500 mb-4">près de chez vous</p>
      
      <div className="space-y-3">
        <input 
          type="text" 
          placeholder="Quel service ?" 
          className="w-full p-3 border rounded-lg bg-gray-50"
        />
        <input 
          type="text" 
          placeholder="Où ?" 
          className="w-full p-3 border rounded-lg bg-gray-50"
        />
        <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold">
          Rechercher
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
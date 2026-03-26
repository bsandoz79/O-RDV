import React, { useState } from 'react';

const Booking = () => {
  const [phone, setPhone] = useState('');
  
  return (
    <div className="p-6 bg-white min-h-screen">
      <h2 className="text-xl font-bold mb-6 text-center">Réservation</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom</label>
          <input type="text" placeholder="Marie Dupont" className="w-full p-3 border rounded-lg mt-1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Téléphone</label>
          <input 
            type="text" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 border rounded-lg mt-1 border-red-500" 
          />
          <p className="text-red-500 text-xs mt-1 font-semibold">Numéro invalide</p>
        </div>
        <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold mt-8">
          Confirmer la réservation
        </button>
      </div>
    </div>
  );
};

export default Booking;
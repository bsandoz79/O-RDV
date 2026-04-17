import React, { useState } from 'react';

const isPhoneValid = (phone) => /^(\+?\d[\s\-.]?){7,15}$/.test(phone.trim());

const Booking = () => {
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);

  const phoneError = touched && phone && !isPhoneValid(phone);

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
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="06 12 34 56 78"
            className={`w-full p-3 border rounded-lg mt-1 ${phoneError ? 'border-red-500' : 'border-slate-200'}`}
          />
          <div aria-live="polite" aria-atomic="true">
            {phoneError && (
              <p className="text-red-500 text-xs mt-1">Format invalide (ex : 06 12 34 56 78)</p>
            )}
          </div>
        </div>
        <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold mt-8">
          Confirmer la réservation
        </button>
      </div>
    </div>
  );
};

export default Booking;

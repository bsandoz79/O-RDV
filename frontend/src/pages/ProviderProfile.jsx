import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Star, MapPin, Phone, Mail, ArrowLeft } from 'lucide-react';

const ProviderProfile = () => {
  const { id } = useParams();

  // Simulation de données (En Phase 2, cela viendra de ton Backend/Base de données)
  const provider = {
    id: id,
    name: "Sophie Martin",
    specialty: "Coiffeuse Visagiste",
    rating: 4.9,
    reviews: 128,
    address: "15 Rue de la Paix, 75002 Paris",
    phone: "01 23 45 67 89",
    email: "sophie.m@example.com",
    about: "Passionnée par la coiffure depuis 10 ans, je vous accueille dans mon salon pour un moment de détente et de transformation personnalisé.",
    prices: [
      { service: "Coupe Femme", price: "45€" },
      { service: "Coupe Homme", price: "25€" },
      { service: "Coloration", price: "60€" }
    ]
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Bouton Retour */}
      <Link to="/" className="flex items-center text-blue-600 mb-6 hover:underline">
        <ArrowLeft size={20} className="mr-2" /> Retour à la recherche
      </Link>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header du profil */}
        <div className="bg-blue-600 h-32"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12">
            <div className="w-24 h-24 bg-gray-200 rounded-full border-4 border-white shadow-md flex items-center justify-center text-2xl font-bold text-gray-600">
              {provider.name.charAt(0)}
            </div>
            <Link 
              to={`/booking/${id}`} 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Prendre rendez-vous
            </Link>
          </div>

          <div className="mt-6">
            <h1 className="text-3xl font-bold text-gray-800">{provider.name}</h1>
            <p className="text-blue-600 font-medium text-lg">{provider.specialty}</p>
            
            <div className="flex items-center mt-2 text-yellow-500">
              <Star size={18} fill="currentColor" />
              <span className="ml-1 font-bold">{provider.rating}</span>
              <span className="ml-1 text-gray-500 text-sm">({provider.reviews} avis)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            {/* Infos de contact */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Informations</h2>
              <div className="space-y-3 text-gray-600">
                <div className="flex items-center"><MapPin size={18} className="mr-3 text-gray-400" /> {provider.address}</div>
                <div className="flex items-center"><Phone size={18} className="mr-3 text-gray-400" /> {provider.phone}</div>
                <div className="flex items-center"><Mail size={18} className="mr-3 text-gray-400" /> {provider.email}</div>
              </div>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-gray-800">À propos</h2>
              <p className="text-gray-600 leading-relaxed">{provider.about}</p>
            </div>

            {/* Tarifs */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Tarifs & Prestations</h2>
              <div className="space-y-4">
                {provider.prices.map((item, index) => (
                  <div key={index} className="flex justify-between border-b pb-2">
                    <span className="text-gray-700">{item.service}</span>
                    <span className="font-bold text-gray-900">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderProfile;
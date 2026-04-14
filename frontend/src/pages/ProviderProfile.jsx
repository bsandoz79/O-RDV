import React, { useState, useEffect } from 'react'; // Ajout de useState et useEffect
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Phone, Mail, ArrowLeft, Loader } from 'lucide-react';
import API_BASE_URL from '../api/api'; 

const ProviderProfile = () => {
  const { id } = useParams();
  
  // État pour stocker les données du prestataire
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  // Récupération des données depuis le Backend
  useEffect(() => {
    const fetchProviderData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/shop/info/${id}`);
        if (response.ok) {
          const data = await response.json();
          setProvider(data);
        } else {
          console.error("Erreur lors de la récupération du prestataire");
        }
      } catch (error) {
        console.error("Erreur réseau :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviderData();
  }, [id]);

  // Écran de chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // Si aucun prestataire n'est trouvé
  if (!provider) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl font-bold">Prestataire introuvable</h2>
        <Link to="/" className="text-blue-600 hover:underline">Retour à l'accueil</Link>
      </div>
    );
  }

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
              {provider.name ? provider.name.charAt(0) : "?"}
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
              <span className="ml-1 font-bold">{provider.rating || "N/A"}</span>
              <span className="ml-1 text-gray-500 text-sm">({provider.reviews || 0} avis)</span>
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

            {/* Tarifs (Conditionnel si les données existent) */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Tarifs & Prestations</h2>
              <div className="space-y-4">
                {provider.prices && provider.prices.length > 0 ? (
                  provider.prices.map((item, index) => (
                    <div key={index} className="flex justify-between border-b pb-2">
                      <span className="text-gray-700">{item.service}</span>
                      <span className="font-bold text-gray-900">{item.price}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">Aucun tarif renseigné</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderProfile;
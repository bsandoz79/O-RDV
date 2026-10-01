// Jeu de données de démonstration (fictif) — utilisé par seed-demo.js
// Tous les comptes utilisent le domaine @demo.ordv.fr pour pouvoir être supprimés d'un coup.

const DEMO_DOMAIN = 'demo.ordv.fr';
const DEMO_PASSWORD = 'Demo2026!';

// Horaires types : [jour, ouverture, fermeture] — absent = fermé
const HOURS = {
  classique: { tuesday: ['09:00', '19:00'], wednesday: ['09:00', '19:00'], thursday: ['09:00', '19:00'], friday: ['09:00', '19:00'], saturday: ['09:00', '18:00'] },
  semaine:   { monday: ['10:00', '19:00'], tuesday: ['10:00', '19:00'], wednesday: ['10:00', '19:00'], thursday: ['10:00', '19:00'], friday: ['10:00', '19:00'], saturday: ['10:00', '17:00'] },
  spa:       { tuesday: ['10:00', '20:00'], wednesday: ['10:00', '20:00'], thursday: ['10:00', '20:00'], friday: ['10:00', '20:00'], saturday: ['10:00', '20:00'], sunday: ['10:00', '18:00'] },
  tattoo:    { wednesday: ['11:00', '19:00'], thursday: ['11:00', '19:00'], friday: ['11:00', '19:00'], saturday: ['11:00', '19:00'] },
};

// Services par catégorie : [libellé, prix €, durée min, groupe]
const SERVICES = {
  'Coiffeur': [
    ['Coupe femme', 38, 45, 'Coupes'], ['Coupe homme', 22, 30, 'Coupes'], ['Brushing', 25, 30, 'Coiffage'],
    ['Coloration', 65, 90, 'Couleur'], ['Balayage', 95, 120, 'Couleur'], ['Soin profond', 20, 30, 'Soins'],
  ],
  'Barbier': [
    ['Coupe homme', 20, 30, 'Coupes'], ['Taille de barbe', 15, 30, 'Barbe'], ['Coupe + barbe', 32, 45, 'Formules'],
    ['Rasage traditionnel', 25, 30, 'Barbe'], ['Coupe enfant', 15, 30, 'Coupes'],
  ],
  'Institut beauté': [
    ['Soin visage éclat', 55, 60, 'Visage'], ['Épilation sourcils', 12, 15, 'Épilation'], ['Épilation jambes', 30, 30, 'Épilation'],
    ['Maquillage soirée', 40, 45, 'Maquillage'], ['Rehaussement de cils', 50, 60, 'Regard'],
  ],
  'Tatoueur': [
    ['Consultation projet', 20, 30, 'Rendez-vous'], ['Petit tatouage', 80, 60, 'Tatouage'],
    ['Tatouage moyen', 180, 120, 'Tatouage'], ['Retouche', 50, 45, 'Tatouage'],
  ],
  'Nail Art': [
    ['Semi-permanent mains', 30, 45, 'Mains'], ['Pose gel complète', 50, 75, 'Mains'], ['Nail art (décor)', 15, 30, 'Déco'],
    ['Manucure classique', 22, 30, 'Mains'], ['Beauté des pieds', 35, 45, 'Pieds'],
  ],
  'Spa & Bien-être': [
    ['Massage relaxant 60 min', 70, 60, 'Massages'], ['Massage pierres chaudes', 85, 75, 'Massages'],
    ['Hammam + gommage', 45, 45, 'Rituels'], ['Soin du dos', 50, 45, 'Soins'], ['Rituel duo', 140, 90, 'Rituels'],
  ],
};

// 12 salons fictifs à Amiens et alentours
const PROVIDERS = [
  { slug: 'meches-ciseaux', name: 'Atelier Mèches & Ciseaux', category: 'Coiffeur', hours: 'classique', certified: true,
    address: '12 rue des Trois Cailloux', zip: '80000', city: 'Amiens', lat: 49.8936, lng: 2.2980,
    owner: ['Sophie', 'Lefèvre'], phone: '0322410012',
    description: "Salon de coiffure mixte au cœur d'Amiens. Coupes sur mesure, colorations végétales et balayages lumineux, dans une ambiance chaleureuse.",
    access: 'Centre-ville piéton, parking Gambetta à 3 min.', payment: 'CB, espèces, chèques' },
  { slug: 'studio-lumiere', name: 'Studio Lumière Coiffure', category: 'Coiffeur', hours: 'semaine', certified: false,
    address: '45 rue de Noyon', zip: '80000', city: 'Amiens', lat: 49.8905, lng: 2.3040,
    owner: ['Julien', 'Morel'], phone: '0322410045',
    description: 'Coiffeur visagiste spécialisé dans les coupes courtes et les couleurs tendance. Conseils personnalisés à chaque visite.',
    access: 'À 2 min de la gare, arrêt de bus Gare du Nord.', payment: 'CB, sans contact' },
  { slug: 'barbier-beffroi', name: 'Le Barbier du Beffroi', category: 'Barbier', hours: 'classique', certified: true,
    address: '3 place du Don', zip: '80000', city: 'Amiens', lat: 49.8968, lng: 2.3014,
    owner: ['Karim', 'Benali'], phone: '0322410003',
    description: 'Barbier traditionnel au pied du Beffroi : rasage à la serviette chaude, taille de barbe précise et coupes classiques.',
    access: 'Quartier Saint-Leu, stationnement place Parmentier.', payment: 'CB, espèces' },
  { slug: 'maison-rasoir', name: 'Maison Rasoir', category: 'Barbier', hours: 'semaine', certified: false,
    address: '88 rue Jules Barni', zip: '80000', city: 'Amiens', lat: 49.8882, lng: 2.2955,
    owner: ['Thomas', 'Girard'], phone: '0322410088',
    description: 'Barbershop moderne : dégradés, contours nets et soins de barbe. Café offert pendant l\'attente.',
    access: 'Bus ligne N1, arrêt Jules Barni.', payment: 'CB, sans contact, espèces' },
  { slug: 'belle-saison', name: 'Institut Belle Saison', category: 'Institut beauté', hours: 'classique', certified: true,
    address: '27 rue Delambre', zip: '80000', city: 'Amiens', lat: 49.8925, lng: 2.2945,
    owner: ['Claire', 'Dubois'], phone: '0322410027',
    description: 'Institut de beauté : soins du visage, épilations et beauté du regard, avec des produits français et naturels.',
    access: 'Accès PMR, parking rue Delambre.', payment: 'CB, chèques cadeaux' },
  { slug: 'eclat-beaute', name: "L'Éclat Beauté", category: 'Institut beauté', hours: 'semaine', certified: false,
    address: '5 avenue de l\'Europe', zip: '80080', city: 'Amiens', lat: 49.9112, lng: 2.3025,
    owner: ['Inès', 'Haddad'], phone: '0322410005',
    description: 'Maquillage, rehaussement de cils et soins express pour être prête en un temps record.',
    access: 'Parking gratuit devant l\'institut.', payment: 'CB, espèces' },
  { slug: 'encre-noire', name: 'Encre Noire Tattoo', category: 'Tatoueur', hours: 'tattoo', certified: true,
    address: '19 rue Saint-Leu', zip: '80000', city: 'Amiens', lat: 49.8975, lng: 2.3000,
    owner: ['Lucas', 'Fontaine'], phone: '0322410019',
    description: 'Studio de tatouage spécialisé blackwork et fine line. Chaque projet est dessiné sur mesure après consultation.',
    access: 'Quartier Saint-Leu, au bord de la Somme.', payment: 'CB, espèces (acompte demandé)' },
  { slug: 'ligne-fine', name: 'Atelier Ligne Fine', category: 'Tatoueur', hours: 'tattoo', certified: false,
    address: '61 boulevard d\'Alsace-Lorraine', zip: '80000', city: 'Amiens', lat: 49.8900, lng: 2.3080,
    owner: ['Emma', 'Roussel'], phone: '0322410061',
    description: 'Tatouages minimalistes et botaniques dans un atelier calme et lumineux.',
    access: 'Arrêt de bus Alsace-Lorraine.', payment: 'CB, virement' },
  { slug: 'nail-pastel', name: 'Nail Studio Pastel', category: 'Nail Art', hours: 'classique', certified: true,
    address: '8 rue de la République', zip: '80000', city: 'Amiens', lat: 49.8930, lng: 2.2990,
    owner: ['Léa', 'Garnier'], phone: '0322410008',
    description: 'Prothésiste ongulaire : semi-permanent, gel et nail art pastel. Plus de 200 couleurs disponibles.',
    access: 'Centre-ville, parking Gambetta.', payment: 'CB, sans contact' },
  { slug: 'ongles-margaux', name: 'Les Ongles de Margaux', category: 'Nail Art', hours: 'semaine', certified: false,
    address: '24 route d\'Amiens', zip: '80480', city: 'Dury', lat: 49.8650, lng: 2.2700,
    owner: ['Margaux', 'Petit'], phone: '0322410024',
    description: 'Salon de manucure à Dury : poses gel, beauté des pieds et décors faits main.',
    access: 'Parking privé gratuit.', payment: 'CB, espèces' },
  { slug: 'spa-hortillonnages', name: 'Spa Les Hortillonnages', category: 'Spa & Bien-être', hours: 'spa', certified: true,
    address: '54 rue Victor Hugo', zip: '80000', city: 'Amiens', lat: 49.8950, lng: 2.2985,
    owner: ['Nathalie', 'Mercier'], phone: '0322410054',
    description: 'Spa urbain : massages, hammam et rituels duo pour une vraie pause au cœur de la ville.',
    access: 'Accès PMR, vestiaires et douches sur place.', payment: 'CB, chèques cadeaux, ANCV' },
  { slug: 'bulle-zen', name: 'Bulle Zen Massage', category: 'Spa & Bien-être', hours: 'spa', certified: false,
    address: '2 rue de la Gare', zip: '80440', city: 'Longueau', lat: 49.8720, lng: 2.3560,
    owner: ['Antoine', 'Lambert'], phone: '0322410002',
    description: 'Massages bien-être et soins du dos dans une cabine apaisante, à 10 min d\'Amiens.',
    access: 'À 200 m de la gare de Longueau.', payment: 'CB, espèces', isNew: true },
];

// 25 clients fictifs — le premier est le compte de démonstration
const CLIENTS = [
  ['Camille', 'Martin'], ['Lucas', 'Bernard'], ['Chloé', 'Thomas'], ['Hugo', 'Robert'], ['Manon', 'Richard'],
  ['Nathan', 'Durand'], ['Inès', 'Moreau'], ['Louis', 'Laurent'], ['Jade', 'Simon'], ['Gabriel', 'Michel'],
  ['Léna', 'Garcia'], ['Arthur', 'David'], ['Zoé', 'Bertrand'], ['Raphaël', 'Roux'], ['Alice', 'Vincent'],
  ['Adam', 'Fournier'], ['Louise', 'Morel'], ['Jules', 'Girard'], ['Emma', 'André'], ['Paul', 'Mercier'],
  ['Sarah', 'Blanc'], ['Tom', 'Guerin'], ['Lina', 'Boyer'], ['Mathis', 'Garnier'], ['Rose', 'Chevalier'],
];

const COMMENTS = {
  5: ["Parfait du début à la fin, je recommande les yeux fermés.", "Accueil adorable et résultat au top !", "Très professionnel, à l'écoute et ponctuel.",
      "Meilleure adresse d'Amiens, je reviendrai.", "Un vrai moment de détente, merci !", "Résultat exactement comme je le voulais."],
  4: ["Très bien, juste un peu d'attente à l'arrivée.", "Bon rapport qualité-prix, équipe sympa.", "Satisfait, le salon est très propre.",
      "Très bon travail, réservation en ligne pratique."],
  3: ["Correct, mais un peu cher pour la prestation.", "Bien dans l'ensemble, ambiance un peu bruyante."],
  2: ["Retard de 20 minutes et prestation moyenne.", "Déçu par le résultat cette fois-ci."],
};

const REFUSAL_REASONS = ['Fermeture exceptionnelle ce jour-là', 'Praticien absent (formation)', 'Créneau réservé à un client régulier'];

module.exports = { DEMO_DOMAIN, DEMO_PASSWORD, HOURS, SERVICES, PROVIDERS, CLIENTS, COMMENTS, REFUSAL_REASONS };

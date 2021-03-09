const MARKER_SVG = 'M27.62 54.68A27.34 27.34 0 1 0 0 27.34 27.35 27.35 0 0 0 27.62 54.68Zm0-41A13.63 13.63 0 1 1 13.85 27.34 13.63 13.63 0 0 1 27.62 13.72Z M11.51 59.46 8.08 57.54l21 51.6 18.1-52-3.46 2.36C33.44 66.51 24.12 66.49 11.51 59.46Z';
const MARKER_ICON = {
  path: MARKER_SVG,
  fillOpacity: 1,
  strokeColor: '#fff',
  anchor: { x: 30, y: 115 },
  scale: 0.5,
};
const CATEGORIES = [
  {
    colour: '#e01d1d',
    englishTitle: 'Childcare / Families',
    frenchTitle: "Services de garde d'enfants / Familles",
    value: 1,
  },
  {
    colour: '#e05e1d',
    englishTitle: 'Community Centres',
    frenchTitle: 'Centres communautaires',
    value: 2,
  },
  {
    colour: '#e0c01d',
    englishTitle: 'Cultural Sites',
    frenchTitle: 'Lieux culturels',
    value: 3,
  },
  {
    colour: '#ace01d',
    englishTitle: 'Dentist',
    frenchTitle: 'Dentiste',
    value: 4,
  },
  {
    colour: '#4ee01d',
    englishTitle: 'Doctors Surgery',
    frenchTitle: 'Médecins',
    value: 5,
  },
  {
    colour: '#1de06e',
    englishTitle: 'Education',
    frenchTitle: 'Éducation',
    value: 6,
  },
  {
    colour: '#1de0c0',
    englishTitle: 'Health',
    frenchTitle: 'Santé',
    value: 7,
  },
  {
    colour: '#1d9fe0',
    englishTitle: 'Hospital / A&E',
    frenchTitle: 'Hôpitaux',
    value: 8,
  },
  {
    colour: '#1d34e0',
    englishTitle: 'Library',
    frenchTitle: 'Bibliothèque',
    value: 9,
  },
  {
    colour: '#6b1de0',
    englishTitle: 'Practical Life',
    frenchTitle: 'Vie Pratique',
    value: 10,
  },
  {
    colour: '#b31de0',
    englishTitle: 'Transport',
    frenchTitle: 'Transports',
    value: 11,
  },
  {
    colour: '#000',
    englishTitle: 'Creative',
    frenchTitle: 'Créatif',
    value: 12,
  },
  {
    colour: '#fff',
    englishTitle: 'Sport / Exercise',
    frenchTitle: 'Sports / Activités physiques',
    value: 13,
  },
  {
    colour: '#999',
    englishTitle: 'Social / Wellbeing',
    frenchTitle: 'Social / Bien-être',
    value: 14,
  },
  {
    colour: '#e01db3',
    englishTitle: 'Other',
    frenchTitle: 'Autre',
    value: 15,
  },
];

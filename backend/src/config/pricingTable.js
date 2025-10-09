// config/pricingTable.js
// Contient tous les types de services avec leurs prix

// Grille tarifaire (par m²)
const pricingTable = {
  standard: {
    propre: 0.86,  // Ménage classique
    sale: 1.78,    // Ménage moyen
    tres_sale: 2.69, // Ménage intensif
  },
  renovation: {
    propre: 3.25,  // État propre
    sale: 4.05,    // État moyen
    tres_sale: 4.84, // Très poussiéreux
  },
  specialise: {
    tapis: 3.20,   // Tapis
    exterieur: 4.30, // Espaces extérieurs
    vitres: 15,    // Prix moyen par vitre
  },
};

// Forfaits par élément
const forfaits = {
  matelas_queen: 90,
  canape_3places: 90,
  divan_sectionnel: 120,
  chaise_tissu: 30,
};

// Majoration (par m² ou fixes)
const majorations = {
  animaux: 0.5,
  urgence: 0.5,
  week_end: 0.5,
  repassage: 0.5,
  vitres: 0.5,
  tapis: 0.5,
};

// Tarifs saisonniers
const tarifsSaisonniers = {
  hiver: { // novembre - mars
    deneigement_entree: 50, // $ par visite
    anti_verglas: 20, // $ par visite
    grand_menage_interieur: 2.70, // $ par m²
    nettoyage_tapis: 3.25, // $ par m²
    nettoyage_vitres_interieures: 6, // $ par vitre
  },
  printemps: { // mars - juin
    grand_menage_intensif: 2.70, // $ par m²
    nettoyage_apres_renovation_propre: 3.30, // $ par m²
    nettoyage_tapis_canape: 3.25, // $ par m²
    nettoyage_tapis_canape_forfait: { min: 90, max: 120 }, // forfait
    nettoyage_exterieur: 4.30, // $ par m²
  },
  ete: { // juin - août
    nettoyage_terrasses_allees: 4.30, // $ par m²
    mobilier_textile: { // forfaits
      canape: 90,
      divan: 120,
      matelas: 90
    },
    menage_moyen: 1.80, // $ par m²
    menage_classique: 0.90, // $ par m²
  },
  automne: { // septembre - novembre
    nettoyage_exterieur: 4.30, // $ par m²
    grand_menage_interieur: 2.70, // $ par m²
    menage_renovation_moyen: 4.10, // $ par m²
    menage_renovation_poussiereux: 4.90, // $ par m²
  }
};

module.exports = {
  pricingTable,
  forfaits,
  majorations,
  tarifsSaisonniers
};
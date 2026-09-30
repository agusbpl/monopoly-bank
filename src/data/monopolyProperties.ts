export type PropertyGroup =
  | 'brown'
  | 'light_blue'
  | 'pink'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'green'
  | 'dark_blue'
  | 'railroad'
  | 'utility';

export interface PropertyDefinition {
  id: string;
  name: string;
  group: PropertyGroup;
  groupName: string;
  groupColor: string;
  price: number;
  mortgageValue: number;
  houseCost: number; // 0 for railroad and utility
  baseRent: number;
  rentWithHouses: number[]; // [1 house, 2 houses, 3 houses, 4 houses, hotel]
}

export const MONOPOLY_PROPERTIES: PropertyDefinition[] = [
  // --- MARRÓN (BROWN) ---
  {
    id: 'mediterranean_ave',
    name: 'Av. Mediterráneo',
    group: 'brown',
    groupName: 'Marrón',
    groupColor: '#92400e',
    price: 60,
    mortgageValue: 30,
    houseCost: 50,
    baseRent: 2,
    rentWithHouses: [10, 30, 90, 160, 250],
  },
  {
    id: 'baltic_ave',
    name: 'Av. Báltica',
    group: 'brown',
    groupName: 'Marrón',
    groupColor: '#92400e',
    price: 60,
    mortgageValue: 30,
    houseCost: 50,
    baseRent: 4,
    rentWithHouses: [20, 60, 180, 320, 450],
  },

  // --- CELESTE (LIGHT BLUE) ---
  {
    id: 'oriental_ave',
    name: 'Av. Oriental',
    group: 'light_blue',
    groupName: 'Celeste',
    groupColor: '#38bdf8',
    price: 100,
    mortgageValue: 50,
    houseCost: 50,
    baseRent: 6,
    rentWithHouses: [30, 90, 270, 400, 550],
  },
  {
    id: 'vermont_ave',
    name: 'Av. Vermont',
    group: 'light_blue',
    groupName: 'Celeste',
    groupColor: '#38bdf8',
    price: 100,
    mortgageValue: 50,
    houseCost: 50,
    baseRent: 6,
    rentWithHouses: [30, 90, 270, 400, 550],
  },
  {
    id: 'connecticut_ave',
    name: 'Av. Connecticut',
    group: 'light_blue',
    groupName: 'Celeste',
    groupColor: '#38bdf8',
    price: 120,
    mortgageValue: 60,
    houseCost: 50,
    baseRent: 8,
    rentWithHouses: [40, 100, 300, 450, 600],
  },

  // --- ROSA (PINK) ---
  {
    id: 'st_charles_place',
    name: 'Plaza San Carlos',
    group: 'pink',
    groupName: 'Rosa',
    groupColor: '#ec4899',
    price: 140,
    mortgageValue: 70,
    houseCost: 100,
    baseRent: 10,
    rentWithHouses: [50, 150, 450, 625, 750],
  },
  {
    id: 'states_ave',
    name: 'Av. de los Estados',
    group: 'pink',
    groupName: 'Rosa',
    groupColor: '#ec4899',
    price: 140,
    mortgageValue: 70,
    houseCost: 100,
    baseRent: 10,
    rentWithHouses: [50, 150, 450, 625, 750],
  },
  {
    id: 'virginia_ave',
    name: 'Av. Virginia',
    group: 'pink',
    groupName: 'Rosa',
    groupColor: '#ec4899',
    price: 160,
    mortgageValue: 80,
    houseCost: 100,
    baseRent: 12,
    rentWithHouses: [60, 180, 500, 700, 900],
  },

  // --- NARANJA (ORANGE) ---
  {
    id: 'st_james_place',
    name: 'Plaza San Jaime',
    group: 'orange',
    groupName: 'Naranja',
    groupColor: '#f97316',
    price: 180,
    mortgageValue: 90,
    houseCost: 100,
    baseRent: 14,
    rentWithHouses: [70, 200, 550, 750, 950],
  },
  {
    id: 'tennessee_ave',
    name: 'Av. Tennessee',
    group: 'orange',
    groupName: 'Naranja',
    groupColor: '#f97316',
    price: 180,
    mortgageValue: 90,
    houseCost: 100,
    baseRent: 14,
    rentWithHouses: [70, 200, 550, 750, 950],
  },
  {
    id: 'new_york_ave',
    name: 'Av. Nueva York',
    group: 'orange',
    groupName: 'Naranja',
    groupColor: '#f97316',
    price: 200,
    mortgageValue: 100,
    houseCost: 100,
    baseRent: 16,
    rentWithHouses: [80, 220, 600, 800, 1000],
  },

  // --- ROJO (RED) ---
  {
    id: 'kentucky_ave',
    name: 'Av. Kentucky',
    group: 'red',
    groupName: 'Rojo',
    groupColor: '#ef4444',
    price: 220,
    mortgageValue: 110,
    houseCost: 150,
    baseRent: 18,
    rentWithHouses: [90, 250, 700, 875, 1050],
  },
  {
    id: 'indiana_ave',
    name: 'Av. Indiana',
    group: 'red',
    groupName: 'Rojo',
    groupColor: '#ef4444',
    price: 220,
    mortgageValue: 110,
    houseCost: 150,
    baseRent: 18,
    rentWithHouses: [90, 250, 700, 875, 1050],
  },
  {
    id: 'illinois_ave',
    name: 'Av. Illinois',
    group: 'red',
    groupName: 'Rojo',
    groupColor: '#ef4444',
    price: 240,
    mortgageValue: 120,
    houseCost: 150,
    baseRent: 20,
    rentWithHouses: [100, 300, 750, 925, 1100],
  },

  // --- AMARILLO (YELLOW) ---
  {
    id: 'atlantic_ave',
    name: 'Av. Atlántico',
    group: 'yellow',
    groupName: 'Amarillo',
    groupColor: '#eab308',
    price: 260,
    mortgageValue: 130,
    houseCost: 150,
    baseRent: 22,
    rentWithHouses: [110, 330, 800, 975, 1150],
  },
  {
    id: 'ventnor_ave',
    name: 'Av. Ventnor',
    group: 'yellow',
    groupName: 'Amarillo',
    groupColor: '#eab308',
    price: 260,
    mortgageValue: 130,
    houseCost: 150,
    baseRent: 22,
    rentWithHouses: [110, 330, 800, 975, 1150],
  },
  {
    id: 'marvin_gardens',
    name: 'Jardines Marvin',
    group: 'yellow',
    groupName: 'Amarillo',
    groupColor: '#eab308',
    price: 280,
    mortgageValue: 140,
    houseCost: 150,
    baseRent: 24,
    rentWithHouses: [120, 360, 850, 1025, 1200],
  },

  // --- VERDE (GREEN) ---
  {
    id: 'pacific_ave',
    name: 'Av. Pacífico',
    group: 'green',
    groupName: 'Verde',
    groupColor: '#22c55e',
    price: 300,
    mortgageValue: 150,
    houseCost: 200,
    baseRent: 26,
    rentWithHouses: [130, 390, 900, 1100, 1275],
  },
  {
    id: 'north_carolina_ave',
    name: 'Av. Carolina del Norte',
    group: 'green',
    groupName: 'Verde',
    groupColor: '#22c55e',
    price: 300,
    mortgageValue: 150,
    houseCost: 200,
    baseRent: 26,
    rentWithHouses: [130, 390, 900, 1100, 1275],
  },
  {
    id: 'pennsylvania_ave',
    name: 'Av. Pensilvania',
    group: 'green',
    groupName: 'Verde',
    groupColor: '#22c55e',
    price: 320,
    mortgageValue: 160,
    houseCost: 200,
    baseRent: 28,
    rentWithHouses: [150, 450, 1000, 1200, 1400],
  },

  // --- AZUL OSCURO (DARK BLUE) ---
  {
    id: 'park_place',
    name: 'Plaza Park / El Muelle',
    group: 'dark_blue',
    groupName: 'Azul Oscuro',
    groupColor: '#1d4ed8',
    price: 350,
    mortgageValue: 175,
    houseCost: 200,
    baseRent: 35,
    rentWithHouses: [175, 500, 1100, 1300, 1500],
  },
  {
    id: 'boardwalk',
    name: 'Paseo Tablado / Prado',
    group: 'dark_blue',
    groupName: 'Azul Oscuro',
    groupColor: '#1d4ed8',
    price: 400,
    mortgageValue: 200,
    houseCost: 200,
    baseRent: 50,
    rentWithHouses: [200, 600, 1400, 1700, 2000],
  },

  // --- FERROCARRILES / ESTACIONES ---
  {
    id: 'reading_railroad',
    name: 'Ferrocarril Reading',
    group: 'railroad',
    groupName: 'Estaciones',
    groupColor: '#64748b',
    price: 200,
    mortgageValue: 100,
    houseCost: 0,
    baseRent: 25,
    rentWithHouses: [25, 50, 100, 200, 200], // 1 RR = 25, 2 RR = 50, 3 RR = 100, 4 RR = 200
  },
  {
    id: 'pennsylvania_railroad',
    name: 'Ferrocarril Pensilvania',
    group: 'railroad',
    groupName: 'Estaciones',
    groupColor: '#64748b',
    price: 200,
    mortgageValue: 100,
    houseCost: 0,
    baseRent: 25,
    rentWithHouses: [25, 50, 100, 200, 200],
  },
  {
    id: 'bo_railroad',
    name: 'Ferrocarril B. & O.',
    group: 'railroad',
    groupName: 'Estaciones',
    groupColor: '#64748b',
    price: 200,
    mortgageValue: 100,
    houseCost: 0,
    baseRent: 25,
    rentWithHouses: [25, 50, 100, 200, 200],
  },
  {
    id: 'short_line',
    name: 'Ferrocarril Vía Rápida',
    group: 'railroad',
    groupName: 'Estaciones',
    groupColor: '#64748b',
    price: 200,
    mortgageValue: 100,
    houseCost: 0,
    baseRent: 25,
    rentWithHouses: [25, 50, 100, 200, 200],
  },

  // --- SERVICIOS PÚBLICOS ---
  {
    id: 'electric_company',
    name: 'Compañía de Electricidad',
    group: 'utility',
    groupName: 'Servicios',
    groupColor: '#059669',
    price: 150,
    mortgageValue: 75,
    houseCost: 0,
    baseRent: 28, // 4x tirada de dados típica (7) = 28
    rentWithHouses: [28, 70, 70, 70, 70], // 1 utility = 4x dice, 2 utilities = 10x dice
  },
  {
    id: 'water_works',
    name: 'Servicio de Agua',
    group: 'utility',
    groupName: 'Servicios',
    groupColor: '#059669',
    price: 150,
    mortgageValue: 75,
    houseCost: 0,
    baseRent: 28,
    rentWithHouses: [28, 70, 70, 70, 70],
  },
];

export const PROPERTY_MAP = new Map<string, PropertyDefinition>(
  MONOPOLY_PROPERTIES.map((p) => [p.id, p])
);

// Helper to check if player owns all properties of a color group
export function ownsCompleteGroup(
  propertiesState: Record<string, { ownerId: string | null }>,
  playerId: string,
  group: PropertyGroup
): boolean {
  const groupProps = MONOPOLY_PROPERTIES.filter((p) => p.group === group);
  return groupProps.every((p) => propertiesState[p.id]?.ownerId === playerId);
}

// Calculate actual rent according to official Monopoly rules
export function calculateRent(
  propertyId: string,
  propertiesState: Record<
    string,
    { ownerId: string | null; houses: number; isMortgaged: boolean }
  >,
  diceRoll = 7
): number {
  const prop = PROPERTY_MAP.get(propertyId);
  const state = propertiesState[propertyId];
  if (!prop || !state || !state.ownerId || state.isMortgaged) return 0;

  // 1. Railroads
  if (prop.group === 'railroad') {
    const ownedRRs = MONOPOLY_PROPERTIES.filter(
      (p) => p.group === 'railroad' && propertiesState[p.id]?.ownerId === state.ownerId
    ).length;
    // 1 RR = $25, 2 RR = $50, 3 RR = $100, 4 RR = $200
    if (ownedRRs === 1) return 25;
    if (ownedRRs === 2) return 50;
    if (ownedRRs === 3) return 100;
    if (ownedRRs >= 4) return 200;
    return 25;
  }

  // 2. Utilities
  if (prop.group === 'utility') {
    const ownedUtils = MONOPOLY_PROPERTIES.filter(
      (p) => p.group === 'utility' && propertiesState[p.id]?.ownerId === state.ownerId
    ).length;
    // 1 Utility = 4x dice, 2 Utilities = 10x dice
    return ownedUtils === 2 ? diceRoll * 10 : diceRoll * 4;
  }

  // 3. Streets with Houses/Hotel
  if (state.houses > 0) {
    const houseIndex = Math.min(state.houses - 1, prop.rentWithHouses.length - 1);
    return prop.rentWithHouses[houseIndex];
  }

  // 4. Unimproved streets: If player owns complete color group, base rent is DOUBLED!
  const hasMonopoly = ownsCompleteGroup(propertiesState, state.ownerId, prop.group);
  return hasMonopoly ? prop.baseRent * 2 : prop.baseRent;
}

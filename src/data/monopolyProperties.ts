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
  rentWithHouses: number[]; // [1 casa, 2 casas, 3 casas, 4 casas, hotel]
}

// Propiedades de la edición oficial Monopoly España (Madrid)
export const MONOPOLY_PROPERTIES: PropertyDefinition[] = [
  // --- MARRÓN ---
  {
    id: 'ronda_de_valencia',
    name: 'Ronda de Valencia',
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
    id: 'plaza_lavapies',
    name: 'Plaza Lavapiés',
    group: 'brown',
    groupName: 'Marrón',
    groupColor: '#92400e',
    price: 60,
    mortgageValue: 30,
    houseCost: 50,
    baseRent: 4,
    rentWithHouses: [20, 60, 180, 320, 450],
  },

  // --- CELESTE ---
  {
    id: 'glorieta_cuatro_caminos',
    name: 'Glorieta Cuatro Caminos',
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
    id: 'avenida_reina_victoria',
    name: 'Avenida Reina Victoria',
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
    id: 'calle_bravo_murillo',
    name: 'Calle Bravo Murillo',
    group: 'light_blue',
    groupName: 'Celeste',
    groupColor: '#38bdf8',
    price: 120,
    mortgageValue: 60,
    houseCost: 50,
    baseRent: 8,
    rentWithHouses: [40, 100, 300, 450, 600],
  },

  // --- ROSA ---
  {
    id: 'glorieta_de_bilbao',
    name: 'Glorieta de Bilbao',
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
    id: 'calle_alberto_aguilera',
    name: 'Calle Alberto Aguilera',
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
    id: 'calle_fuencarral',
    name: 'Calle Fuencarral',
    group: 'pink',
    groupName: 'Rosa',
    groupColor: '#ec4899',
    price: 160,
    mortgageValue: 80,
    houseCost: 100,
    baseRent: 12,
    rentWithHouses: [60, 180, 500, 700, 900],
  },

  // --- NARANJA ---
  {
    id: 'avenida_felipe_ii',
    name: 'Avenida Felipe II',
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
    id: 'calle_velazquez',
    name: 'Calle Velázquez',
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
    id: 'calle_serrano',
    name: 'Calle Serrano',
    group: 'orange',
    groupName: 'Naranja',
    groupColor: '#f97316',
    price: 200,
    mortgageValue: 100,
    houseCost: 100,
    baseRent: 16,
    rentWithHouses: [80, 220, 600, 800, 1000],
  },

  // --- ROJO ---
  {
    id: 'avenida_de_america',
    name: 'Avenida de América',
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
    id: 'calle_maria_de_molina',
    name: 'Calle María de Molina',
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
    id: 'calle_cea_bermudez',
    name: 'Calle Cea Bermúdez',
    group: 'red',
    groupName: 'Rojo',
    groupColor: '#ef4444',
    price: 240,
    mortgageValue: 120,
    houseCost: 150,
    baseRent: 20,
    rentWithHouses: [100, 300, 750, 925, 1100],
  },

  // --- AMARILLO ---
  {
    id: 'avenida_reyes_catolicos',
    name: 'Avenida de los Reyes Católicos',
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
    id: 'calle_bailen',
    name: 'Calle Bailén',
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
    id: 'plaza_de_espana',
    name: 'Plaza de España',
    group: 'yellow',
    groupName: 'Amarillo',
    groupColor: '#eab308',
    price: 280,
    mortgageValue: 140,
    houseCost: 150,
    baseRent: 24,
    rentWithHouses: [120, 360, 850, 1025, 1200],
  },

  // --- VERDE ---
  {
    id: 'puerta_del_sol',
    name: 'Puerta del Sol',
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
    id: 'calle_alcala',
    name: 'Calle Alcalá',
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
    id: 'gran_via',
    name: 'Gran Vía',
    group: 'green',
    groupName: 'Verde',
    groupColor: '#22c55e',
    price: 320,
    mortgageValue: 160,
    houseCost: 200,
    baseRent: 28,
    rentWithHouses: [150, 450, 1000, 1200, 1400],
  },

  // --- AZUL OSCURO ---
  {
    id: 'paseo_de_la_castellana',
    name: 'Paseo de la Castellana',
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
    id: 'paseo_del_prado',
    name: 'Paseo del Prado',
    group: 'dark_blue',
    groupName: 'Azul Oscuro',
    groupColor: '#1d4ed8',
    price: 400,
    mortgageValue: 200,
    houseCost: 200,
    baseRent: 50,
    rentWithHouses: [200, 600, 1400, 1700, 2000],
  },

  // --- ESTACIONES DE FERROCARRIL (200 € cada una) ---
  {
    id: 'estacion_de_goya',
    name: 'Estación de Goya',
    group: 'railroad',
    groupName: 'Estaciones',
    groupColor: '#64748b',
    price: 200,
    mortgageValue: 100,
    houseCost: 0,
    baseRent: 25,
    rentWithHouses: [25, 50, 100, 200, 200], // 1 Estación = 25€, 2 = 50€, 3 = 100€, 4 = 200€
  },
  {
    id: 'estacion_de_las_delicias',
    name: 'Estación de las Delicias',
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
    id: 'estacion_del_mediodia',
    name: 'Estación del Mediodía',
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
    id: 'estacion_del_norte',
    name: 'Estación del Norte',
    group: 'railroad',
    groupName: 'Estaciones',
    groupColor: '#64748b',
    price: 200,
    mortgageValue: 100,
    houseCost: 0,
    baseRent: 25,
    rentWithHouses: [25, 50, 100, 200, 200],
  },

  // --- SERVICIOS PÚBLICOS (150 € cada uno) ---
  {
    id: 'compania_de_electricidad',
    name: 'Compañía de Electricidad',
    group: 'utility',
    groupName: 'Servicios',
    groupColor: '#059669',
    price: 150,
    mortgageValue: 75,
    houseCost: 0,
    baseRent: 28, // 4x dados (promedio 7 = 28€)
    rentWithHouses: [28, 70, 70, 70, 70], // 1 servicio = 4x dados, 2 servicios = 10x dados
  },
  {
    id: 'compania_de_aguas',
    name: 'Compañía de Aguas',
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

  // 1. Railroads / Estaciones
  if (prop.group === 'railroad') {
    const ownedRRs = MONOPOLY_PROPERTIES.filter(
      (p) => p.group === 'railroad' && propertiesState[p.id]?.ownerId === state.ownerId
    ).length;
    if (ownedRRs === 1) return 25;
    if (ownedRRs === 2) return 50;
    if (ownedRRs === 3) return 100;
    if (ownedRRs >= 4) return 200;
    return 25;
  }

  // 2. Utilities / Servicios
  if (prop.group === 'utility') {
    const ownedUtils = MONOPOLY_PROPERTIES.filter(
      (p) => p.group === 'utility' && propertiesState[p.id]?.ownerId === state.ownerId
    ).length;
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

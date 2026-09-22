export type LimaDeliveryMode = 'scheduled' | 'express';
export const FREE_EXPRESS_FROM = 200;

/**
 * Rangos operativos desde Pueblo Libre. La distancia usa como referencia el
 * centro de cada distrito; el punto exacto se coordina por WhatsApp.
 *
 * Los cortes aproximan un envío en moto con base + kilómetros + minutos:
 * https://cabify.com/pe/tarifas/lima
 */
export const EXPRESS_TIERS = [
  {
    fee: 10,
    distance: '0 a 4 km',
    districts: ['Pueblo Libre', 'Jesús María', 'Magdalena del Mar', 'Breña'],
  },
  {
    fee: 15,
    distance: 'más de 4 a 7 km',
    districts: [
      'San Miguel', 'Cercado de Lima', 'Lince', 'La Victoria', 'San Isidro', 'Rímac',
      'Bellavista', 'La Perla', 'Carmen de la Legua-Reynoso',
    ],
  },
  {
    fee: 20,
    distance: 'más de 7 a 10 km',
    districts: ['Miraflores', 'Surquillo', 'San Luis', 'El Agustino', 'Callao', 'La Punta'],
  },
  {
    fee: 25,
    distance: 'más de 10 a 14 km',
    districts: [
      'San Borja', 'Barranco', 'Santiago de Surco', 'Santa Anita', 'Independencia',
      'Los Olivos', 'San Martín de Porres',
    ],
  },
  {
    fee: 30,
    distance: 'más de 14 km',
    districts: [
      'Chorrillos', 'La Molina', 'Ate', 'San Juan de Lurigancho', 'San Juan de Miraflores',
      'Villa El Salvador', 'Villa María del Triunfo', 'Comas', 'Carabayllo', 'Puente Piedra',
      'Ventanilla', 'Mi Perú', 'Ancón', 'Santa Rosa', 'Lurín', 'Pachacámac', 'Cieneguilla',
    ],
  },
] as const;

export const EXPRESS_DISTRICTS = EXPRESS_TIERS.flatMap(tier =>
  tier.districts.map(name => ({ name, fee: tier.fee, distance: tier.distance })),
);

export function expressTierForDistrict(district?: string) {
  return EXPRESS_DISTRICTS.find(item => item.name === district) ?? null;
}

export function expressFeeForDistrict(district?: string) {
  return expressTierForDistrict(district)?.fee ?? null;
}

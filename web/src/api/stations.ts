const API_BASE = '/api';

export interface Station {
  id: string;
  brand: string;
  address: string;
  longitude: number;
  latitude: number;
}

export interface StationDetail extends Station {
  prices: FuelPrice[];
}

export interface FuelPrice {
  fuel_type: string;
  price: number;
  updated_at: string;
  updated_by: string;
}

export async function getStationsInBBox(
  minLon: number,
  minLat: number,
  maxLon: number,
  maxLat: number
): Promise<Station[]> {
  const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
  const res = await fetch(`${API_BASE}/stations?bbox=${bbox}`);
  if (!res.ok) throw new Error('Ошибка загрузки АЗС');
  return res.json();
}

export async function getStationDetail(id: string): Promise<StationDetail> {
  const res = await fetch(`${API_BASE}/stations/${id}`);
  if (!res.ok) throw new Error('АЗС не найдена');
  return res.json();
}

export async function updatePrice(
  stationId: string,
  fuelType: string,
  price: number,
  updatedBy: string = 'user'
): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/stations/${stationId}/prices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fuel_type: fuelType, price, updated_by: updatedBy }),
  });
  if (!res.ok) throw new Error('Ошибка обновления цены');
  return res.json();
}

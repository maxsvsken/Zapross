import { useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { getStationsInBBox, getStationDetail, Station, StationDetail } from '../api/stations'
import './Map.css'

interface Props {
  onStationSelect: (station: StationDetail) => void;
}

const BRAND_COLORS: Record<string, string> = {
  'Лукойл': '#e31e24',
  'ЛУКОЙЛ': '#e31e24',
  'Газпромнефть': '#00a651',
  'Газпром': '#00a651',
  'Роснефть': '#0055a5',
  'ТНК': '#ffc107',
  'TATNEFT': '#ff6600',
  'Shell': '#fbce07',
  'BP': '#009b3a',
  'Сургутнефтегаз': '#0066cc',
  'ННК': '#cc0000',
  'TEBOIL': '#003399',
}

function createStationIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'station-marker',
    html: `<div style="
      background: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 13px;
    ">⛽</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

function MapEvents({ onStationSelect }: { onStationSelect: (s: StationDetail) => void }) {
  const map = useMap()
  const loadedRef = useRef(false)

  const loadStations = useCallback(async () => {
    const bounds = map.getBounds()
    const minLat = bounds.getSouth()
    const minLon = bounds.getWest()
    const maxLat = bounds.getNorth()
    const maxLon = bounds.getEast()

    try {
      const stations = await getStationsInBBox(minLon, minLat, maxLon, maxLat)
      renderMarkers(map, stations, onStationSelect)
    } catch (err) {
      console.error('Ошибка загрузки АЗС:', err)
    }
  }, [map, onStationSelect])

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true
      loadStations()
    }
  }, [loadStations])

  useMapEvents({
    moveend: () => loadStations(),
    zoomend: () => loadStations(),
  })

  return null
}

function renderMarkers(
  map: L.Map,
  stations: Station[],
  onStationSelect: (s: StationDetail) => void
) {
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker && (layer as any)._stationData) {
      map.removeLayer(layer)
    }
  })

  stations.forEach((station) => {
    const color = BRAND_COLORS[station.brand] || '#666'
    const icon = createStationIcon(color)

    const marker = L.marker([station.latitude, station.longitude], { icon })
      .addTo(map)

    ;(marker as any)._stationData = station

    marker.on('click', async () => {
      try {
        const detail = await getStationDetail(station.id)
        onStationSelect(detail)
      } catch (err) {
        console.error(err)
      }
    })
  })
}

export default function LeafletMap({ onStationSelect }: Props) {
  return (
    <div className="map-container">
      <MapContainer
        center={[55.75, 37.6]}
        zoom={12}
        className="map"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onStationSelect={onStationSelect} />
      </MapContainer>
    </div>
  )
}

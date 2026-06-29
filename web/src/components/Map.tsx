import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import './Map.css'

interface StationFeature {
  type: string
  geometry: { type: string; coordinates: [number, number] }
  properties: {
    id: string
    name: string
    brand: string
    address: string
    fuel_types: string[]
  }
}

interface StationGeoJSON {
  type: string
  features: StationFeature[]
}

const BRAND_COLORS: Record<string, string> = {
  'ЛУКОЙЛ': '#e31e24',
  'Лукойл': '#e31e24',
  'РОСНЕФТЬ': '#0055a5',
  'Роснефть': '#0055a5',
  'ГАЗПРОМНЕФТЬ': '#00a651',
  'Газпромнефть': '#00a651',
  'ТНК': '#ffc107',
  'TATNEFT': '#ff6600',
  'ТАТНЕФТЬ': '#ff6600',
  'Сургутнефтегаз': '#0066cc',
  'ННК': '#cc0000',
  'TEBOIL': '#003399',
  'Shell': '#fbce07',
  'BP': '#009b3a',
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

function getBrandColor(brand: string): string {
  const upper = brand.toUpperCase()
  for (const [key, color] of Object.entries(BRAND_COLORS)) {
    if (key.toUpperCase() === upper) return color
  }
  return '#666'
}

function buildPopup(props: StationFeature['properties']): string {
  const fuelBadges = props.fuel_types
    .map(f => `<span class="fuel-badge">${f}</span>`)
    .join(' ')

  return `
    <div class="station-popup">
      <div class="popup-brand">${props.brand}</div>
      ${props.name && props.name !== props.brand ? `<div class="popup-name">${props.name}</div>` : ''}
      <div class="popup-address">${props.address}</div>
      <div class="popup-fuels">${fuelBadges}</div>
    </div>
  `
}

export default function LeafletMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [55.75, 37.6],
      zoom: 10,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      chunkProgress: (processed, total) => {
        if (processed === total) {
          console.log(`Loaded ${total} stations`)
        }
      },
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      disableClusteringAtZoom: 16,
    })

    fetch('/stations.json')
      .then(r => r.json())
      .then((geojson: StationGeoJSON) => {
        const markers: L.Marker[] = []

        geojson.features.forEach(feature => {
          const { coordinates } = feature.geometry
          const { brand } = feature.properties
          const color = getBrandColor(brand)
          const icon = createStationIcon(color)

          const marker = L.marker([coordinates[1], coordinates[0]], { icon })
          marker.bindPopup(buildPopup(feature.properties), { maxWidth: 300 })
          markers.push(marker)
        })

        clusterGroup.addLayers(markers)
        map.addLayer(clusterGroup)
      })
      .catch(err => console.error('Failed to load stations:', err))

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  return <div ref={mapRef} className="map" />
}

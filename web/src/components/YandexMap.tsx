import { useEffect, useRef, useState, useCallback } from 'react'
import { getStationsInBBox, getStationDetail, Station, StationDetail } from '../api/stations'
import './YandexMap.css'

declare global {
  interface Window {
    ymaps3: any;
  }
}

interface Props {
  onStationSelect: (station: StationDetail) => void;
}

const BRAND_COLORS: Record<string, string> = {
  'Лукойл': '#e31e24',
  'Газпромнефть': '#00a651',
  'Роснефть': '#0055a5',
  'ТНК': '#ffc107',
  'Shell': '#fbce07',
  'BP': '#009b3a',
};

export default function YandexMap({ onStationSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  const loadStations = useCallback(async () => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;
    const bounds = map.getBounds();
    if (!bounds) return;

    const [[minLon, minLat], [maxLon, maxLat]] = bounds;

    setLoading(true);
    try {
      const stations = await getStationsInBBox(minLon, minLat, maxLon, maxLat);
      renderMarkers(stations);
    } catch (err) {
      console.error('Ошибка загрузки АЗС:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const renderMarkers = (stations: Station[]) => {
    if (!markersLayer.current) return;

    markersLayer.current.removeAll();

    stations.forEach((station) => {
      const color = BRAND_COLORS[station.brand] || '#666';

      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.style.backgroundColor = color;
      markerElement.title = `${station.brand}\n${station.address}`;
      markerElement.innerHTML = `<span>⛽</span>`;

      markerElement.addEventListener('click', async () => {
        try {
          const detail = await getStationDetail(station.id);
          onStationSelect(detail);
        } catch (err) {
          console.error(err);
        }
      });

      const { Marker } = window.ymaps3;
      const marker = new Marker({
        coordinates: [station.longitude, station.latitude],
        content: markerElement,
        anchor: [16, 16],
      });

      markersLayer.current.add(marker);
    });
  };

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const initMap = async () => {
      const { YMap, YMapDefaultSchemeLayer, YMapControls, YMapControlButton } = window.ymaps3;

      const map = new YMap(mapRef.current, {
        location: {
          center: [37.6, 55.75],
          zoom: 12,
        },
        behavior: {
          default: ['drag', 'zoom', 'scrollZoom'],
        },
      });

      map.addChild(new YMapDefaultSchemeLayer());
      map.addChild(new YMapControls({ position: 'top right' }));

      const { MarkerLayer } = window.ymaps3;
      markersLayer.current = new MarkerLayer();
      map.addChild(markersLayer.current);

      mapInstance.current = map;

      map.addListener('bounds', loadStations);
      loadStations();
    };

    const checkYmaps = setInterval(() => {
      if (window.ymaps3) {
        clearInterval(checkYmaps);
        initMap();
      }
    }, 100);

    return () => clearInterval(checkYmaps);
  }, [loadStations]);

  return (
    <div className="map-container">
      <div ref={mapRef} className="map" />
      {loading && <div className="loading-badge">Загрузка...</div>}
    </div>
  );
}

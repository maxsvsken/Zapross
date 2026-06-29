import { useState } from 'react'
import LeafletMap from './components/Map'
import StationCard from './components/StationCard'
import { StationDetail } from './api/stations'
import './App.css'

function App() {
  const [selectedStation, setSelectedStation] = useState<StationDetail | null>(null)

  return (
    <div className="app">
      <header className="header">
        <h1>ZapRos</h1>
        <p>Цены на топливо в реальном времени</p>
      </header>
      <main className="main">
        <LeafletMap onStationSelect={setSelectedStation} />
        {selectedStation && (
          <StationCard
            station={selectedStation}
            onClose={() => setSelectedStation(null)}
            onPriceUpdated={() => {}}
          />
        )}
      </main>
    </div>
  )
}

export default App

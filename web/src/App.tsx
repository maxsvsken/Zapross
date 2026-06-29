import LeafletMap from './components/Map'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>ZapRos</h1>
        <p>Цены на топливо в реальном времени</p>
      </header>
      <main className="main">
        <LeafletMap />
      </main>
    </div>
  )
}

export default App

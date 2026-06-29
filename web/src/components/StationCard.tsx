import { useState } from 'react'
import { StationDetail, updatePrice } from '../api/stations'
import './StationCard.css'

interface Props {
  station: StationDetail;
  onClose: () => void;
  onPriceUpdated: () => void;
}

const FUEL_TYPES = ['АИ-92', 'АИ-95', 'АИ-98', 'АИ-100', 'ДТ', 'Газ'];

const BRAND_ICONS: Record<string, string> = {
  'Лукойл': '🔴',
  'Газпромнефть': '🟢',
  'Роснефть': '🔵',
  'ТНК': '🟡',
  'Shell': '🟠',
  'BP': '💚',
};

export default function StationCard({ station, onClose, onPriceUpdated }: Props) {
  const [editingFuel, setEditingFuel] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (fuelType: string) => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) return;

    setSaving(true);
    try {
      await updatePrice(station.id, fuelType, price);
      setEditingFuel(null);
      setNewPrice('');
      onPriceUpdated();
    } catch (err) {
      alert('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="station-card">
      <button className="close-btn" onClick={onClose}>✕</button>

      <div className="station-header">
        <span className="brand-icon">{BRAND_ICONS[station.brand] || '⛽'}</span>
        <div>
          <h2>{station.brand}</h2>
          <p className="address">{station.address}</p>
        </div>
      </div>

      <div className="prices-section">
        <h3>Цены на топливо</h3>
        <div className="prices-list">
          {FUEL_TYPES.map((fuel) => {
            const priceData = station.prices.find((p) => p.fuel_type === fuel);
            const isEditing = editingFuel === fuel;

            return (
              <div key={fuel} className="price-row">
                <span className="fuel-type">{fuel}</span>
                {isEditing ? (
                  <div className="price-edit">
                    <input
                      type="number"
                      step="0.10"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder={priceData ? String(priceData.price) : 'Цена'}
                      autoFocus
                    />
                    <button
                      className="save-btn"
                      onClick={() => handleSave(fuel)}
                      disabled={saving}
                    >
                      {saving ? '...' : '✓'}
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={() => { setEditingFuel(null); setNewPrice(''); }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="price-display">
                    {priceData ? (
                      <>
                        <span className="price-value">{priceData.price.toFixed(2)} ₽</span>
                        <span className="price-date">
                          {new Date(priceData.updated_at).toLocaleDateString('ru-RU')}
                        </span>
                      </>
                    ) : (
                      <span className="no-price">нет данных</span>
                    )}
                    <button
                      className="update-btn"
                      onClick={() => {
                        setEditingFuel(fuel);
                        setNewPrice(priceData ? String(priceData.price) : '');
                      }}
                    >
                      ✎
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-footer">
        <p>Нажал ✎ — обнови цену для других водителей</p>
      </div>
    </div>
  );
}

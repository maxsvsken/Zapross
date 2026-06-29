import { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { getStationsInBBox, getStationDetail, updatePrice, Station, StationDetail } from '../api/stations';

const { width } = Dimensions.get('window');

const BRAND_COLORS: Record<string, string> = {
  'Лукойл': '#e31e24',
  'Газпромнефть': '#00a651',
  'Роснефть': '#0055a5',
  'ТНК': '#ffc107',
  'Shell': '#fbce07',
  'BP': '#009b3a',
};

const FUEL_TYPES = ['АИ-92', 'АИ-95', 'АИ-98', 'АИ-100', 'ДТ', 'Газ'];

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<StationDetail | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFuel, setEditingFuel] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState('');

  const loadStations = async () => {
    if (!mapRef.current) return;
    const region = await mapRef.current.getMapBoundaries();
    try {
      const data = await getStationsInBBox(
        region.southWest.longitude,
        region.southWest.latitude,
        region.northEast.longitude,
        region.northEast.latitude
      );
      setStations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkerPress = async (stationId: string) => {
    try {
      const detail = await getStationDetail(stationId);
      setSelectedStation(detail);
      setModalVisible(true);
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные АЗС');
    }
  };

  const handleSavePrice = async (fuelType: string) => {
    if (!selectedStation) return;
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Ошибка', 'Введите корректную цену');
      return;
    }
    try {
      await updatePrice(selectedStation.id, fuelType, price);
      const updated = await getStationDetail(selectedStation.id);
      setSelectedStation(updated);
      setEditingFuel(null);
      setNewPrice('');
      Alert.alert('Готово', 'Цена обновлена');
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось сохранить цену');
    }
  };

  useEffect(() => {
    loadStations();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: 55.75,
          longitude: 37.6,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        onRegionChangeComplete={loadStations}
        showsUserLocation
      >
        {stations.map((station) => (
          <Marker
            key={station.id}
            coordinate={{
              latitude: station.latitude,
              longitude: station.longitude,
            }}
            pinColor={BRAND_COLORS[station.brand] || '#666'}
            title={station.brand}
            description={station.address}
            onCalloutPress={() => handleMarkerPress(station.id)}
          />
        ))}
      </MapView>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>ZapRos</Text>
        <Text style={styles.headerSub}>Цены на топливо</Text>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            {selectedStation && (
              <>
                <Text style={styles.modalBrand}>{selectedStation.brand}</Text>
                <Text style={styles.modalAddress}>{selectedStation.address}</Text>

                <View style={styles.pricesContainer}>
                  {FUEL_TYPES.map((fuel) => {
                    const priceData = selectedStation.prices.find((p) => p.fuel_type === fuel);
                    const isEditing = editingFuel === fuel;

                    return (
                      <View key={fuel} style={styles.priceRow}>
                        <Text style={styles.fuelLabel}>{fuel}</Text>
                        {isEditing ? (
                          <View style={styles.priceEditRow}>
                            <TextInput
                              style={styles.priceInput}
                              keyboardType="numeric"
                              value={newPrice}
                              onChangeText={setNewPrice}
                              placeholder={priceData ? String(priceData.price) : 'Цена'}
                              autoFocus
                            />
                            <TouchableOpacity
                              style={styles.saveBtn}
                              onPress={() => handleSavePrice(fuel)}
                            >
                              <Text style={styles.saveBtnText}>✓</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.cancelBtn}
                              onPress={() => { setEditingFuel(null); setNewPrice(''); }}
                            >
                              <Text style={styles.cancelBtnText}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.priceDisplayRow}>
                            <Text style={styles.priceValue}>
                              {priceData ? `${priceData.price.toFixed(2)} ₽` : 'нет данных'}
                            </Text>
                            <TouchableOpacity
                              style={styles.editBtn}
                              onPress={() => {
                                setEditingFuel(fuel);
                                setNewPrice(priceData ? String(priceData.price) : '');
                              }}
                            >
                              <Text style={styles.editBtnText}>✎</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                <Text style={styles.footerText}>
                  Нажал ✎ — обнови цену для других водителей
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(26, 115, 232, 0.95)',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '70%',
  },
  modalClose: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#666',
  },
  modalBrand: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  modalAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 20,
  },
  pricesContainer: {
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  fuelLabel: {
    fontWeight: '600',
    fontSize: 15,
    minWidth: 70,
  },
  priceDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a73e8',
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontSize: 14,
    color: '#666',
  },
  priceEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceInput: {
    width: 80,
    padding: 6,
    borderWidth: 2,
    borderColor: '#1a73e8',
    borderRadius: 6,
    fontSize: 14,
    textAlign: 'center',
  },
  saveBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#34a853',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ea4335',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: 'white',
    fontSize: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
});

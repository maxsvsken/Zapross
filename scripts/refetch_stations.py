import json
import sys
import urllib.request
import concurrent.futures
import os

def fetch_station(station_id):
    url = f'https://locator.transitcard.ru/web/v1/point?id={station_id}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception:
        return None

def main():
    input_file = sys.argv[1] if len(sys.argv) > 1 else 'web/public/stations.json'
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'web/public/stations_fixed.json'

    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    ids = [feat['properties']['id'] for feat in data['features']]
    total = len(ids)
    print(f'Fetching {total} stations...', flush=True)

    features = []
    count = 0
    failed = 0
    batch_size = 2000

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(fetch_station, sid): sid for sid in ids}
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            count += 1

            if not result or result.get('closed') or not result.get('fuelStation'):
                failed += 1
                continue

            fuel_types = [fs['name'] for fs in result.get('fuelServices', []) if fs.get('name')]
            prices = {}
            for fs in result.get('fuelServices', []):
                if fs.get('name') and fs.get('price'):
                    prices[fs['name']] = {
                        'price': fs['price'],
                        'date': fs.get('priceDate', ''),
                    }

            features.append({
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [result['longitude'], result['latitude']]
                },
                'properties': {
                    'id': result.get('id', ''),
                    'name': result.get('name', ''),
                    'brand': result.get('brand', ''),
                    'address': result.get('address', ''),
                    'town': result.get('townName', ''),
                    'fuel_types': fuel_types,
                    'prices': prices,
                }
            })

            if count % batch_size == 0:
                geojson = {'type': 'FeatureCollection', 'features': features}
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(geojson, f, ensure_ascii=False, separators=(',', ':'))
                print(f'  {count}/{total} ({len(features)} ok, {failed} failed) - saved', flush=True)

    geojson = {'type': 'FeatureCollection', 'features': features}
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, ensure_ascii=False, separators=(',', ':'))
    print(f'Done: {len(features)} stations -> {output_file} ({failed} failed)')

if __name__ == '__main__':
    main()

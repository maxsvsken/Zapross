import json
import sys
import xlrd
import re

def normalize(s):
    return re.sub(r'[^а-яёa-z0-9]', '', s.lower())

def read_xls(filename):
    wb = xlrd.open_workbook(filename)
    sh = wb.sheet_by_name('points')

    fuel_cols = [
        (16, 17, 'АИ-95'), (18, 19, 'АИ-92'), (20, 21, 'ДТ'),
        (22, 23, 'ДТ2'), (24, 25, 'ДТ Арктическое'),
        (26, 27, 'Газ СПБТ'), (28, 29, 'Метан'),
        (30, 31, 'AdBlue'), (32, 33, 'АИ-98'), (34, 35, 'АИ-100'),
        (36, 37, 'ДТ Премиум'), (38, 39, 'АИ-95 Фирменный'),
        (40, 41, 'АИ-92 Фора'), (42, 43, 'Электрозарядка'),
    ]

    stations = []
    for r in range(3, sh.nrows):
        brand = str(sh.cell_value(r, 10)).strip()
        address = str(sh.cell_value(r, 9)).strip()
        city = str(sh.cell_value(r, 8)).strip()
        region = str(sh.cell_value(r, 7)).strip()
        terminals = str(sh.cell_value(r, 5)).strip()

        if not brand or not address:
            continue

        services = []
        if sh.cell_value(r, 12):
            services.append('АЗС')
        if sh.cell_value(r, 13):
            services.append('Мойка')
        if sh.cell_value(r, 14):
            services.append('Шиномонтаж')
        if sh.cell_value(r, 15):
            services.append('АГЗС')

        prices = {}
        for price_col, date_col, fuel_name in fuel_cols:
            try:
                price_val = sh.cell_value(r, price_col)
                date_val = str(sh.cell_value(r, date_col)).strip()
                if price_val and price_val != '' and isinstance(price_val, (int, float)) and price_val > 0:
                    prices[fuel_name] = {
                        'price': float(price_val),
                        'date': date_val,
                    }
            except (IndexError, ValueError):
                pass

        stations.append({
            'brand': brand,
            'address': address,
            'city': city,
            'region': region,
            'terminals': terminals,
            'services': services,
            'prices': prices,
        })

    return stations

def main():
    xls_stations = []
    for f in ['StationList.xls', 'StationListLPG.xls']:
        try:
            data = read_xls(f)
            print(f'{f}: {len(data)} stations')
            xls_stations.extend(data)
        except Exception as e:
            print(f'{f}: error - {e}')

    print(f'Total XLS stations: {len(xls_stations)}')

    with open('web/public/stations.json', 'r', encoding='utf-8') as f:
        geojson = json.load(f)

    matched = 0
    new_prices = 0

    for feature in geojson['features']:
        props = feature['properties']
        geo_brand = normalize(props['brand'])
        geo_addr = normalize(props['address'][:50])

        best_match = None
        best_score = 0

        for xls_s in xls_stations:
            xls_brand = normalize(xls_s['brand'])
            if xls_brand != geo_brand:
                continue

            xls_addr = normalize(xls_s['address'][:50])
            if xls_addr == geo_addr:
                best_match = xls_s
                best_score = 100
                break

            if geo_addr[:20] == xls_addr[:20] and len(geo_addr) > 15:
                score = 80
                if score > best_score:
                    best_match = xls_s
                    best_score = score

        if best_match and best_score >= 80:
            matched += 1
            for fuel, price_data in best_match['prices'].items():
                if fuel not in props.get('prices', {}) or not props['prices'].get(fuel):
                    props.setdefault('prices', {})[fuel] = price_data
                    new_prices += 1

    with open('web/public/stations.json', 'w', encoding='utf-8') as f:
        json.dump(geojson, f, ensure_ascii=False, separators=(',', ':'))

    print(f'Matched: {matched}, new prices added: {new_prices}')
    print(f'GeoJSON features: {len(geojson["features"])}')

if __name__ == '__main__':
    main()

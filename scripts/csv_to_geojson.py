import csv
import json
import sys

def main():
    input_file = sys.argv[1] if len(sys.argv) > 1 else "transitcard_stations.csv"
    output_file = sys.argv[2] if len(sys.argv) > 2 else "web/public/stations.json"

    features = []
    skipped = 0

    with open(input_file, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                lat = float(row["latitude"])
                lon = float(row["longitude"])
            except (ValueError, KeyError):
                skipped += 1
                continue

            if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
                skipped += 1
                continue

            fuel_raw = row.get("fuel_types", "")
            fuel_types = [ft.strip() for ft in fuel_raw.split(";") if ft.strip()]

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat]
                },
                "properties": {
                    "id": row.get("id", ""),
                    "name": row.get("name", ""),
                    "brand": row.get("brand", ""),
                    "address": row.get("address", ""),
                    "fuel_types": fuel_types,
                }
            })

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False, separators=(",", ":"))

    print(f"Exported {len(features)} stations ({skipped} skipped) to {output_file}")

if __name__ == "__main__":
    main()

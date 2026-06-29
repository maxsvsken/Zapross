from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy.future import select
from app.models.station import Station
from app.models.price import Price
from typing import List, Optional, Tuple
from uuid import UUID


async def find_stations_in_bbox(
    db: AsyncSession,
    min_lon: float,
    min_lat: float,
    max_lon: float,
    max_lat: float
) -> List[dict]:
    query = text("""
        SELECT
            s.id,
            s.brand,
            s.address,
            ST_X(s.location) AS longitude,
            ST_Y(s.location) AS latitude
        FROM stations s
        WHERE ST_Within(
            s.location,
            ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326)
        )
    """)
    result = await db.execute(query, {
        "min_lon": min_lon,
        "min_lat": min_lat,
        "max_lon": max_lon,
        "max_lat": max_lat
    })
    rows = result.fetchall()
    return [
        {
            "id": str(row[0]),
            "brand": row[1],
            "address": row[2],
            "longitude": float(row[3]),
            "latitude": float(row[4])
        }
        for row in rows
    ]


async def get_station_with_prices(db: AsyncSession, station_id: UUID) -> Optional[dict]:
    station_query = select(Station).where(Station.id == station_id)
    result = await db.execute(station_query)
    station = result.scalar_one_or_none()

    if not station:
        return None

    prices_query = select(Price).where(Price.station_id == station_id)
    prices_result = await db.execute(prices_query)
    prices = prices_result.scalars().all()

    from geoalchemy2.elements import WKTElement
    geom = station.location
    coords = db.execute(text(f"SELECT ST_X('{geom}'::geometry), ST_Y('{geom}'::geometry)")).fetchone()

    return {
        "id": str(station.id),
        "brand": station.brand,
        "address": station.address,
        "longitude": float(coords[0]),
        "latitude": float(coords[1]),
        "prices": [
            {
                "fuel_type": p.fuel_type,
                "price": float(p.price),
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                "updated_by": p.updated_by
            }
            for p in prices
        ]
    }


async def update_price(
    db: AsyncSession,
    station_id: UUID,
    fuel_type: str,
    price: float,
    updated_by: str = "anonymous"
) -> dict:
    existing_query = select(Price).where(
        Price.station_id == station_id,
        Price.fuel_type == fuel_type
    )
    result = await db.execute(existing_query)
    existing = result.scalar_one_or_none()

    if existing:
        existing.price = price
        existing.updated_by = updated_by
    else:
        new_price = Price(
            station_id=station_id,
            fuel_type=fuel_type,
            price=price,
            updated_by=updated_by
        )
        db.add(new_price)

    await db.commit()
    return {"status": "ok", "fuel_type": fuel_type, "price": price}

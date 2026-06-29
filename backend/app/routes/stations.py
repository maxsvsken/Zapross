from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import station_service
from pydantic import BaseModel
from typing import Optional
from uuid import UUID


router = APIRouter(prefix="/api/stations", tags=["stations"])


class StationResponse(BaseModel):
    id: str
    brand: str
    address: str
    longitude: float
    latitude: float


class StationDetailResponse(BaseModel):
    id: str
    brand: str
    address: str
    longitude: float
    latitude: float
    prices: list


class PriceUpdateRequest(BaseModel):
    fuel_type: str
    price: float
    updated_by: str = "anonymous"


@router.get("", response_model=list[StationResponse])
async def get_stations(
    bbox: str = Query(..., description="Bounding box: min_lon,min_lat,max_lon,max_lat"),
    db: AsyncSession = Depends(get_db)
):
    try:
        parts = [float(x.strip()) for x in bbox.split(",")]
        if len(parts) != 4:
            raise ValueError
        min_lon, min_lat, max_lon, max_lat = parts
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Invalid bbox format. Use: min_lon,min_lat,max_lon,max_lat")

    stations = await station_service.find_stations_in_bbox(db, min_lon, min_lat, max_lon, max_lat)
    return stations


@router.get("/{station_id}", response_model=StationDetailResponse)
async def get_station_detail(
    station_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    station = await station_service.get_station_with_prices(db, station_id)
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    return station


@router.post("/{station_id}/prices")
async def update_station_price(
    station_id: UUID,
    request: PriceUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    station = await station_service.get_station_with_prices(db, station_id)
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    valid_fuel_types = ["АИ-92", "АИ-95", "АИ-98", "АИ-100", "ДТ", "Газ"]
    if request.fuel_type not in valid_fuel_types:
        raise HTTPException(status_code=400, detail=f"Invalid fuel_type. Must be one of: {valid_fuel_types}")

    if request.price <= 0:
        raise HTTPException(status_code=400, detail="Price must be positive")

    result = await station_service.update_price(
        db, station_id, request.fuel_type, request.price, request.updated_by
    )
    return result

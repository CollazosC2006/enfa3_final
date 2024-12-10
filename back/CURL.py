from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI()

# Configuración de CORS para permitir solicitudes desde tu página web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Cambia esto al puerto donde corre tu Angular
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos (GET, POST, etc.)
    allow_headers=["*"],  # Permitir todos los encabezados
)
# URL base del servidor Ryu
RYU_BASE_URL = "http://192.168.233.146:8080/v1.0/topology"

# Ruta para obtener switches
@app.get("/switches")
async def get_switches():
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{RYU_BASE_URL}/switches")
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as exc:
            raise HTTPException(status_code=500, detail=f"Request failed: {exc}")

# Ruta para obtener enlaces
@app.get("/links")
async def get_links():
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{RYU_BASE_URL}/links")
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as exc:
            raise HTTPException(status_code=500, detail=f"Request failed: {exc}")

# Ruta para obtener hosts
@app.get("/hosts")
async def get_hosts():
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{RYU_BASE_URL}/hosts")
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as exc:
            raise HTTPException(status_code=500, detail=f"Request failed: {exc}")

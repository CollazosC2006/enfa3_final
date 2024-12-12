from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import websockets
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
RYU_BASE_URL = "http://192.168.10.22:8080/v1.0/topology"

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
        

@app.websocket("/ws")
async def websocket_proxy(websocket: WebSocket):
    await websocket.accept()
    try:
        # Conectar al servidor WebSocket de Ryu
        async with websockets.connect("ws://192.168.10.22:8080/v1.0/topology/ws") as ryu_ws:
            # Escuchar mensajes en ambas direcciones
            async def forward_to_ryu():
                async for message in websocket.iter_text():
                    await ryu_ws.send(message)

            async def forward_to_client():
                async for message in ryu_ws:
                    await websocket.send_text(message)

            # Ejecutar ambas tareas concurrentemente
            await asyncio.gather(forward_to_ryu(), forward_to_client())
    except WebSocketDisconnect:
        print("WebSocket disconnected from client")
    except Exception as e:
        print(f"Error: {e}")

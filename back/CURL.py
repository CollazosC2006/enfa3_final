from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import websockets
import httpx
import json
from fastapi.responses import JSONResponse
import paramiko
from pydantic import BaseModel
from typing import Any, Dict

app = FastAPI()

class GenericRule(BaseModel):
    rule: Dict[str, Any]

# Configuración de CORS para permitir solicitudes desde tu página web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Cambia esto al puerto donde corre tu Angular
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos (GET, POST, etc.)
    allow_headers=["*"],  # Permitir todos los encabezados
)
# URL base del servidor Ryu
RYU_BASE_URL = "http://192.168.1.10:8080/v1.0/topology"


# Dirección del servidor Ryu
RYU_SERVER_IP = "192.168.1.10"  
RYU_SERVER_PORT = 8080
RYU_BASE_URL2 = f"http://{RYU_SERVER_IP}:{RYU_SERVER_PORT}"
RYU_USER= "ryu"
RYU_PASS= "ryu"
ryu_process = None
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


@app.post("/start-ryu")
async def start_ryu(request: Request):
    global ryu_process
    try:
        stop_ryu()
        data = await request.json()
        app_name = data.get('app_name')
        
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(hostname=RYU_SERVER_IP, username=RYU_USER, password=RYU_PASS)

        # Ejecutar el comando ryu-manager con el app 'simple_switch.py'
        command = f"ryu-manager /usr/lib/python3/dist-packages/ryu/app/{app_name} --observe-links rest_topology.py ofctl_rest.py"
        
        ryu_process = ssh.exec_command(command, get_pty=True)  # Ejecuta el comando y obtiene el canal
        # Acceder al canal de stdin y stdout
        stdin, stdout, stderr = ryu_process

        return JSONResponse({"message": "Aplicación iniciada correctamente"})
    except Exception as e:
        return JSONResponse({"message": f"Error al iniciar la aplicación: {str(e)}"}, status_code=500)

@app.post("/stop-ryu")
async def stop_ryu():
    global ryu_process
    try:
        if ryu_process is not None:
            # Acceder al canal de stdin y escribir el comando de salida 'exit'
            stdin, stdout, stderr = ryu_process
            stdin.write('exit\n')
            stdin.flush()

            # Cerrar los canales
            stdout.channel.close()
            stderr.channel.close()

            return JSONResponse({"message": "Aplicación detenida correctamente"})
        else:
            return JSONResponse({"message": "La aplicación no está en ejecución"}, status_code=400)
    except Exception as e:
        return JSONResponse({"message": f"Error al detener la aplicación: {str(e)}"}, status_code=500)


@app.get("/switchesinfo")
async def get_switches():
    print("Obteniendo switches de Ryu")
    async with httpx.AsyncClient() as client:
        try:
            # Realizamos la solicitud GET a la API de Ryu
            response = await client.get(f"{RYU_BASE_URL2}/stats/switches")
            response.raise_for_status()  # Lanza un error si el status no es 200
            return response.json()  # Retorna los datos en formato JSON
        except httpx.HTTPStatusError as e:
            return {"error": f"Error al obtener switches de Ryu: {e}"}
        except Exception as e:
            return {"error": f"Error desconocido: {e}"}

@app.get("/stats/flow/{switch_id}")
async def get_rules(switch_id: int):
    print(f"Obteniendo reglas para el switch {switch_id} de Ryu")
    async with httpx.AsyncClient() as client:
        try:
            # Realizamos la solicitud GET a la API de Ryu
            response = await client.get(f"{RYU_BASE_URL2}/stats/flow/{switch_id}")
            response.raise_for_status()  # Lanza un error si el status no es 200
            return response.json()  # Retorna los datos en formato JSON
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=response.status_code, detail=f"Error al obtener reglas de Ryu: {e}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error desconocido: {e}")

@app.post("/stats/flow")
async def add_rule(request: Request):
    
    try:
        # Obtener el cuerpo de la solicitud como cadena
        body = await request.body()
        print(f"Body: {body}")
        # Convertir la cadena JSON en un diccionario de Python
        rule_dict = json.loads(body)
        print(f"Regla recibida: {rule_dict}")
        # Validar y convertir el diccionario en un objeto GenericRule
        rule = GenericRule(rule=rule_dict)
        
        print(f"Agregando regla a Ryu: {rule.rule}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{RYU_BASE_URL2}/stats/flowentry/add", json=rule.rule)
            print(response)
            #mandar solo el status code
            return response.status_code
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=response.status_code, detail=f"Error al agregar regla a Ryu: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error desconocido: {e}")
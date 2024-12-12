import json
from fastapi import FastAPI,HTTPException, Request
from fastapi.responses import JSONResponse
import paramiko
from fastapi.middleware.cors import CORSMiddleware
import httpx
from pydantic import BaseModel
from typing import Any, Dict




# Crear una instancia de la aplicación FastAPI
app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Cambia esto al puerto donde corre tu Angular
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos (GET, POST, etc.)
    allow_headers=["*"],  # Permitir todos los encabezados
)
# Variable para almacenar el proceso de Ryu
ryu_process = None


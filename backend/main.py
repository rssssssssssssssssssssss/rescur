import asyncio
import sys
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import logging

# Add backend directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.schemas import CommandPayload
from websocket.manager import manager
from simulator.rover_sim import simulator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("RescueXBackend")

app = FastAPI(
    title="RESCUE-X Laptop AI & Telemetry Backend",
    description="FastAPI WebSocket, Camera Photo Ingest & AI Human Detection Hub",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend static files (index.html, styles.css, app.js)
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if os.path.exists(os.path.join(frontend_dir, "index.html")):
    app.mount("/static", StaticFiles(directory=frontend_dir, html=True), name="frontend")


@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("  RESCUE-X Laptop AI & Telemetry Server ONLINE")
    logger.info("  WebSocket: ws://localhost:8000/ws")
    logger.info("  API Docs:  http://localhost:8000/docs")
    logger.info("  Frame Upload: POST http://localhost:8000/api/camera/frame")
    logger.info("=" * 60)
    asyncio.create_task(telemetry_broadcast_loop())


async def telemetry_broadcast_loop():
    """Broadcast telemetry at 10 Hz to all connected WebSocket clients."""
    while True:
        try:
            telemetry = simulator.generate_telemetry()
            await manager.broadcast_json({"type": "telemetry", "data": telemetry})
            await asyncio.sleep(0.1)
        except Exception as e:
            logger.error(f"Telemetry loop error: {e}")
            await asyncio.sleep(0.5)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"WS received: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get("/")
def read_root():
    return {
        "status": "ONLINE",
        "system": "RESCUE-X Laptop AI & Telemetry Server",
        "version": "2.1.0",
        "endpoints": {
            "ws": "ws://localhost:8000/ws",
            "telemetry": "/api/telemetry",
            "camera_frame": "POST /api/camera/frame",
            "command": "POST /api/command",
            "docs": "/docs"
        }
    }


@app.get("/api/telemetry")
def get_current_telemetry():
    """Returns current snapshot of all 15 sensor feeds."""
    return simulator.generate_telemetry()


@app.post("/api/camera/frame")
async def upload_camera_frame(file: UploadFile = File(...)):
    """
    Ingests live camera frames/photos from ESP32-CAM / Rover.
    Laptop runs YOLOv8 detection, maps victim location, broadcasts updated tracking.
    """
    contents = await file.read()
    telemetry = simulator.process_incoming_frame(contents)
    return {
        "status": "PROCESSED",
        "filename": file.filename,
        "bytes_received": len(contents),
        "tracking": telemetry["tracker"]
    }


@app.post("/api/command")
def send_command(cmd: CommandPayload):
    """Send tele-operation commands to the rover."""
    logger.info(f"Command: {cmd.action} (params: {cmd.params})")
    action = cmd.action.upper()

    if action in ["FORWARD", "REVERSE", "LEFT", "RIGHT", "STOP"]:
        simulator.drive_dir = action
    elif action == "ESTOP":
        simulator.emergency_stop = True
        simulator.drive_dir = "STOP"
    elif action == "RESET_ESTOP":
        simulator.emergency_stop = False
    elif action == "TOGGLE_MODE":
        simulator.drive_mode = "MANUAL DRIVE" if simulator.drive_mode == "AUTONOMOUS" else "AUTONOMOUS"
    elif action == "TOGGLE_LIGHTS":
        simulator.headlights = not simulator.headlights
    elif action == "SIM_HUMAN":
        simulator.human_present = not simulator.human_present
    elif action == "SIM_GAS":
        simulator.gas_hazard = not simulator.gas_hazard
    else:
        raise HTTPException(status_code=400, detail=f"Unknown command: {cmd.action}")

    return {"status": "ACK", "action": action, "telemetry": simulator.generate_telemetry()}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

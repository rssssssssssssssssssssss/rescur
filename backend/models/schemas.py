from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class CameraData(BaseModel):
    status: str = "STREAMING"
    fps: int = 30
    resolution: str = "1080p"
    night_vision: bool = False
    recording: bool = True

class HumanTrackerData(BaseModel):
    track_id: int = 1
    detected: bool = True
    confidence: float = 94.0
    bbox: List[float] = Field(default_factory=lambda: [320, 180, 420, 320])
    relative_x_m: float = 2.4
    relative_y_m: float = 3.8
    distance_m: float = 4.5
    bearing_deg: float = 45.0
    mapped_lat: float = 12.97164
    mapped_lon: float = 77.59463
    tracking_status: str = "TARGET LOCKED"

class VitalSignData(BaseModel):
    heart_rate: int = 78
    breathing_rate: int = 16
    human_presence: bool = True
    movement_detected: bool = True
    confidence: float = 96.0

class AudioData(BaseModel):
    status: str = "MONITORING"
    sound_level_db: float = 48.0
    voice_cry_detected: bool = True
    sound_direction_deg: float = 45.0
    frequency_spectrum: List[float] = Field(default_factory=list)

class HumanDetectionData(BaseModel):
    status: str = "HUMAN DETECTED"
    confidence: float = 94.0
    camera_detected: bool = True
    pir_motion: bool = True
    radar_present: bool = True

class GasHazardData(BaseModel):
    gas_level_ppm: float = 142.0
    air_quality_index: int = 28
    air_quality_level: str = "GOOD"
    hazard_status: str = "SAFE"
    warning_active: bool = False

class EnvironmentData(BaseModel):
    temperature_c: float = 31.2
    temp_warning: bool = False
    ldr_lux: float = 340.0

class DistanceData(BaseModel):
    front_cm: float = 82.0
    left_cm: float = 35.0
    right_cm: float = 120.0
    rear_cm: float = 95.0
    warning_front: bool = False
    warning_left: bool = True

class OrientationData(BaseModel):
    pitch_deg: float = 3.0
    roll_deg: float = 7.0
    yaw_deg: float = 124.0
    orientation_status: str = "SAFE"
    tilt_warning: bool = False

class NavigationData(BaseModel):
    direction: str = "NE"
    speed_ms: float = 1.4
    distance_travelled_m: float = 12.4
    wheel_rpm: int = 120
    mode: str = "AUTONOMOUS"

class GPSData(BaseModel):
    latitude: float = 12.9716
    longitude: float = 77.5946
    altitude_m: float = 920.0
    satellites_locked: int = 11
    signal_status: str = "GOOD"
    distance_from_start_m: float = 12.4

class CommStatusData(BaseModel):
    wifi_connected: bool = True
    wifi_signal_pct: int = 94
    esp32_status: str = "ONLINE"
    stm32_status: str = "ONLINE"
    lora_status: str = "ONLINE"
    last_received_ms: int = 45

class BatteryData(BaseModel):
    percentage: int = 82
    voltage_v: float = 12.4
    current_draw_a: float = 1.8
    low_battery_warning: bool = False

class LightingData(BaseModel):
    headlights_on: bool = False
    ldr_reading_lux: float = 340.0
    lighting_mode: str = "MANUAL"

class SafetyData(BaseModel):
    emergency_stop: bool = False
    motor_status: str = "NORMAL"
    tilt_emergency: bool = False
    gas_emergency: bool = False
    comm_failure: bool = False
    system_fault: bool = False

class RoverTelemetry(BaseModel):
    timestamp: float
    camera: CameraData
    tracker: HumanTrackerData
    vitals: VitalSignData
    audio: AudioData
    human_detection: HumanDetectionData
    gas_hazard: GasHazardData
    environment: EnvironmentData
    distance: DistanceData
    orientation: OrientationData
    navigation: NavigationData
    gps: GPSData
    communication: CommStatusData
    battery: BatteryData
    lighting: LightingData
    safety: SafetyData

class CommandPayload(BaseModel):
    action: str
    params: Optional[Dict[str, str]] = None

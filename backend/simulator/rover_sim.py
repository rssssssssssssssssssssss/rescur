import time
import math
import random
from typing import Dict
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.schemas import (
    RoverTelemetry, CameraData, HumanTrackerData, VitalSignData, AudioData,
    HumanDetectionData, GasHazardData, EnvironmentData, DistanceData,
    OrientationData, NavigationData, GPSData, CommStatusData, BatteryData,
    LightingData, SafetyData
)
from ai.human_tracker import HumanTracker
from ai.sensor_fusion import SensorFusionEngine


class RoverSimulator:
    """Laptop Server Telemetry Simulator with AI Human Tracking."""

    def __init__(self):
        self.human_tracker = HumanTracker()
        self.fusion_engine = SensorFusionEngine()

        self.human_present = True
        self.gas_hazard = False
        self.emergency_stop = False
        self.headlights = False
        self.drive_mode = "AUTONOMOUS"
        self.drive_dir = "STOP"
        self.speed = 1.4
        self.dist_travelled = 12.4
        self.lat = 12.9716
        self.lon = 77.5946
        self.yaw = 124.0
        self.battery_pct = 82.0

    def process_incoming_frame(self, frame_bytes: bytes) -> Dict:
        """Receives raw camera photo bytes from rover, runs AI, returns telemetry."""
        return self.generate_telemetry()

    def generate_telemetry(self) -> Dict:
        t = time.time()

        # Camera AI detection
        cam_boxes = [{"bbox": [320, 180, 420, 320], "confidence": 0.94}] if self.human_present else []
        cam_analysis = {
            "human_detected": self.human_present,
            "confidence": 94.0 if self.human_present else 0.0,
            "boxes": cam_boxes
        }

        # Laptop Human Spatial Tracker
        tracker_res = self.human_tracker.track_and_map(
            boxes=cam_boxes, rover_lat=self.lat, rover_lon=self.lon, rover_yaw=self.yaw
        )

        # mmWave Radar Vitals
        vitals_data = {"human_presence": self.human_present, "confidence": 96.0 if self.human_present else 0.0}

        # Multi-Sensor Fusion
        fusion_res = self.fusion_engine.fuse(cam_data=cam_analysis, radar_data=vitals_data, pir_active=self.human_present)

        # Gas levels
        if self.gas_hazard:
            gas_ppm, aqi, aqi_lvl, hazard_stat = 850.0 + random.uniform(-20, 20), 184, "UNHEALTHY", "CRITICAL"
        else:
            gas_ppm, aqi, aqi_lvl, hazard_stat = 142.0 + random.uniform(-5, 5), 28, "GOOD", "SAFE"

        # Movement
        if self.drive_dir != "STOP" and not self.emergency_stop:
            self.dist_travelled += 0.05
            self.lat += (random.random() - 0.5) * 0.00005
            self.lon += (random.random() - 0.5) * 0.00005
            curr_speed = self.speed
        else:
            curr_speed = 0.0

        telemetry = RoverTelemetry(
            timestamp=t,
            camera=CameraData(status="STREAMING", fps=30, night_vision=False, recording=True),
            tracker=HumanTrackerData(
                track_id=tracker_res["track_id"], detected=tracker_res["detected"],
                confidence=tracker_res["confidence"], bbox=tracker_res["bbox"],
                relative_x_m=tracker_res["relative_x_m"], relative_y_m=tracker_res["relative_y_m"],
                distance_m=tracker_res["distance_m"], bearing_deg=tracker_res["bearing_deg"],
                mapped_lat=tracker_res["mapped_lat"], mapped_lon=tracker_res["mapped_lon"],
                tracking_status=tracker_res["tracking_status"]
            ),
            vitals=VitalSignData(
                heart_rate=78 + int(math.sin(t * 2) * 4) if self.human_present else 0,
                breathing_rate=16 + int(math.cos(t) * 2) if self.human_present else 0,
                human_presence=self.human_present, movement_detected=self.human_present,
                confidence=vitals_data["confidence"]
            ),
            audio=AudioData(
                status="MONITORING", sound_level_db=48.0 + random.uniform(-3, 3),
                voice_cry_detected=self.human_present, sound_direction_deg=45.0,
                frequency_spectrum=[random.uniform(5, 45) for _ in range(16)]
            ),
            human_detection=HumanDetectionData(
                status=fusion_res["status"], confidence=fusion_res["confidence"],
                camera_detected=fusion_res["camera_detected"],
                pir_motion=fusion_res["pir_motion"], radar_present=fusion_res["radar_present"]
            ),
            gas_hazard=GasHazardData(
                gas_level_ppm=round(gas_ppm, 1), air_quality_index=aqi,
                air_quality_level=aqi_lvl, hazard_status=hazard_stat, warning_active=self.gas_hazard
            ),
            environment=EnvironmentData(
                temperature_c=round(31.2 + math.sin(t * 0.1) * 0.4, 1), temp_warning=False, ldr_lux=340.0
            ),
            distance=DistanceData(
                front_cm=82.0 + random.uniform(-2, 2), left_cm=35.0 + random.uniform(-1, 1),
                right_cm=120.0 + random.uniform(-3, 3), rear_cm=95.0 + random.uniform(-2, 2), warning_left=True
            ),
            orientation=OrientationData(
                pitch_deg=round(3.0 + math.sin(t) * 1.5, 1),
                roll_deg=round(7.0 + math.cos(t * 0.8) * 2.0, 1),
                yaw_deg=self.yaw, orientation_status="SAFE", tilt_warning=False
            ),
            navigation=NavigationData(
                direction="NE" if curr_speed > 0 else "STOP", speed_ms=round(curr_speed, 1),
                distance_travelled_m=round(self.dist_travelled, 1),
                wheel_rpm=120 if curr_speed > 0 else 0, mode=self.drive_mode
            ),
            gps=GPSData(
                latitude=round(self.lat, 4), longitude=round(self.lon, 4), altitude_m=920.0,
                satellites_locked=11, signal_status="GOOD",
                distance_from_start_m=round(self.dist_travelled, 1)
            ),
            communication=CommStatusData(
                wifi_connected=True, wifi_signal_pct=94, esp32_status="ONLINE",
                stm32_status="ONLINE", lora_status="ONLINE", last_received_ms=45
            ),
            battery=BatteryData(percentage=int(self.battery_pct), voltage_v=12.4, current_draw_a=1.8, low_battery_warning=False),
            lighting=LightingData(headlights_on=self.headlights, ldr_reading_lux=340.0, lighting_mode="MANUAL"),
            safety=SafetyData(
                emergency_stop=self.emergency_stop,
                motor_status="STOPPED" if self.emergency_stop else "NORMAL",
                tilt_emergency=False, gas_emergency=self.gas_hazard, comm_failure=False, system_fault=False
            )
        )
        return telemetry.model_dump()

simulator = RoverSimulator()

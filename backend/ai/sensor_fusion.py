from typing import Dict

class SensorFusionEngine:
    """Multi-Sensor Fusion: Camera YOLO (60%) + mmWave Radar (30%) + PIR (10%)."""
    def __init__(self, w_cam=0.60, w_radar=0.30, w_pir=0.10):
        self.w_cam = w_cam
        self.w_radar = w_radar
        self.w_pir = w_pir

    def fuse(self, cam_data: Dict, radar_data: Dict, pir_active: bool) -> Dict:
        cam_conf = cam_data.get("confidence", 0.0) if cam_data.get("human_detected", False) else 0.0
        radar_conf = radar_data.get("confidence", 0.0) if radar_data.get("human_presence", False) else 0.0
        pir_score = 90.0 if pir_active else 0.0
        fusion_score = round(min(100.0, max(0.0,
            (cam_conf * self.w_cam) + (radar_conf * self.w_radar) + (pir_score * self.w_pir))), 1)
        if fusion_score >= 60.0:
            status = "HUMAN DETECTED"
        elif fusion_score >= 30.0:
            status = "SUSPECTED HUMAN"
        else:
            status = "NOT DETECTED"
        return {"status": status, "confidence": fusion_score,
                "camera_detected": cam_data.get("human_detected", False),
                "radar_present": radar_data.get("human_presence", False),
                "pir_motion": pir_active}

import math
from typing import Dict, List

class HumanTracker:
    """Laptop AI: Spatial Mapping & Tracking from bounding boxes + rover GPS."""
    def __init__(self, focal_length_px=500.0, avg_human_height_m=1.7):
        self.focal_length = focal_length_px
        self.avg_height = avg_human_height_m
        self.track_id = 101

    def track_and_map(self, boxes: List[Dict], rover_lat: float, rover_lon: float, rover_yaw: float) -> Dict:
        if not boxes:
            return {"track_id": self.track_id, "detected": False, "confidence": 0.0,
                    "bbox": [0,0,0,0], "relative_x_m": 0.0, "relative_y_m": 0.0,
                    "distance_m": 0.0, "bearing_deg": 0.0,
                    "mapped_lat": rover_lat, "mapped_lon": rover_lon,
                    "tracking_status": "SEARCHING"}
        top_box = max(boxes, key=lambda b: b.get("confidence", 0.0))
        bbox = top_box.get("bbox", [320, 180, 420, 320])
        conf = round(top_box.get("confidence", 0.94) * (100 if top_box.get("confidence", 0.94) <= 1.0 else 1), 1)
        x1, y1, x2, y2 = bbox
        box_h_px = max(10, y2 - y1)
        estimated_dist_m = round(max(0.5, min(25.0, (self.avg_height * self.focal_length) / box_h_px)), 1)
        box_cx = (x1 + x2) / 2.0
        angle_offset_deg = (box_cx - 320.0) / 320.0 * 30.0
        target_bearing_deg = (rover_yaw + angle_offset_deg) % 360.0
        rad = math.radians(target_bearing_deg)
        rel_x = round(estimated_dist_m * math.sin(rad), 1)
        rel_y = round(estimated_dist_m * math.cos(rad), 1)
        mapped_lat = round(rover_lat + (rel_y / 111000.0), 5)
        mapped_lon = round(rover_lon + (rel_x / (111000.0 * math.cos(math.radians(rover_lat)))), 5)
        return {"track_id": self.track_id, "detected": True, "confidence": conf,
                "bbox": bbox, "relative_x_m": rel_x, "relative_y_m": rel_y,
                "distance_m": estimated_dist_m, "bearing_deg": round(target_bearing_deg, 1),
                "mapped_lat": mapped_lat, "mapped_lon": mapped_lon,
                "tracking_status": "TARGET LOCKED"}

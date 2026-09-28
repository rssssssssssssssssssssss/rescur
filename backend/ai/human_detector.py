import numpy as np
import logging

logger = logging.getLogger("HumanDetector")

class HumanDetector:
    """YOLOv8 / OpenCV-based Human Detector for Laptop AI Processing."""
    def __init__(self, use_yolo=True):
        self.use_yolo = use_yolo
        self.model = None
        if self.use_yolo:
            try:
                from ultralytics import YOLO
                self.model = YOLO("yolov8n.pt")
                logger.info("YOLOv8 model loaded successfully.")
            except Exception as e:
                logger.warning(f"Could not load YOLOv8: {e}. Falling back to HOG.")
                self.use_yolo = False
        if not self.use_yolo:
            import cv2
            self.hog = cv2.HOGDescriptor()
            self.hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

    def detect(self, frame: np.ndarray):
        if frame is None or frame.size == 0:
            return {"human_detected": False, "confidence": 0.0, "boxes": []}
        if self.use_yolo and self.model is not None:
            try:
                results = self.model(frame, verbose=False)
                boxes = []
                max_conf = 0.0
                for r in results:
                    for box in r.boxes:
                        if int(box.cls[0]) == 0:
                            conf = float(box.conf[0])
                            xyxy = box.xyxy[0].tolist()
                            boxes.append({"bbox": xyxy, "confidence": conf})
                            if conf > max_conf:
                                max_conf = conf
                return {"human_detected": len(boxes) > 0, "confidence": round(max_conf * 100, 1), "boxes": boxes}
            except Exception as e:
                logger.error(f"YOLO inference error: {e}")
        import cv2
        rects, weights = self.hog.detectMultiScale(frame, winStride=(8, 8), padding=(8, 8), scale=1.05)
        boxes = []
        max_conf = 0.0
        for idx, (x, y, w, h) in enumerate(rects):
            conf = float(weights[idx]) if idx < len(weights) else 0.75
            boxes.append({"bbox": [x, y, x + w, y + h], "confidence": conf})
            if conf > max_conf:
                max_conf = conf
        return {"human_detected": len(boxes) > 0, "confidence": round(min(100.0, max_conf * 90), 1), "boxes": boxes}

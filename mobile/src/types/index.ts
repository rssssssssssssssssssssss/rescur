export interface CameraData {
  status: string;
  fps: number;
  resolution: string;
  night_vision: boolean;
  recording: boolean;
}

export interface HumanTrackerData {
  track_id: number;
  detected: boolean;
  confidence: number;
  bbox: number[];
  relative_x_m: number;
  relative_y_m: number;
  distance_m: number;
  bearing_deg: number;
  mapped_lat: number;
  mapped_lon: number;
  tracking_status: string;
}

export interface VitalSignData {
  heart_rate: number;
  breathing_rate: number;
  human_presence: boolean;
  movement_detected: boolean;
  confidence: number;
}

export interface AudioData {
  status: string;
  sound_level_db: number;
  voice_cry_detected: boolean;
  sound_direction_deg: number;
  frequency_spectrum: number[];
}

export interface HumanDetectionData {
  status: string;
  confidence: number;
  camera_detected: boolean;
  pir_motion: boolean;
  radar_present: boolean;
}

export interface GasHazardData {
  gas_level_ppm: number;
  air_quality_index: number;
  air_quality_level: string;
  hazard_status: string;
  warning_active: boolean;
}

export interface EnvironmentData {
  temperature_c: number;
  temp_warning: boolean;
  ldr_lux: number;
}

export interface DistanceData {
  front_cm: number;
  left_cm: number;
  right_cm: number;
  rear_cm: number;
  warning_front: boolean;
  warning_left: boolean;
}

export interface OrientationData {
  pitch_deg: number;
  roll_deg: number;
  yaw_deg: number;
  orientation_status: string;
  tilt_warning: boolean;
}

export interface NavigationData {
  direction: string;
  speed_ms: number;
  distance_travelled_m: number;
  wheel_rpm: number;
  mode: string;
}

export interface GPSData {
  latitude: number;
  longitude: number;
  altitude_m: number;
  satellites_locked: number;
  signal_status: string;
  distance_from_start_m: number;
}

export interface CommStatusData {
  wifi_connected: boolean;
  wifi_signal_pct: number;
  esp32_status: string;
  stm32_status: string;
  lora_status: string;
  last_received_ms: number;
}

export interface BatteryData {
  percentage: number;
  voltage_v: number;
  current_draw_a: number;
  low_battery_warning: boolean;
}

export interface LightingData {
  headlights_on: boolean;
  ldr_reading_lux: number;
  lighting_mode: string;
}

export interface SafetyData {
  emergency_stop: boolean;
  motor_status: string;
  tilt_emergency: boolean;
  gas_emergency: boolean;
  comm_failure: boolean;
  system_fault: boolean;
}

export interface RoverTelemetry {
  timestamp: number;
  camera: CameraData;
  tracker: HumanTrackerData;
  vitals: VitalSignData;
  audio: AudioData;
  human_detection: HumanDetectionData;
  gas_hazard: GasHazardData;
  environment: EnvironmentData;
  distance: DistanceData;
  orientation: OrientationData;
  navigation: NavigationData;
  gps: GPSData;
  communication: CommStatusData;
  battery: BatteryData;
  lighting: LightingData;
  safety: SafetyData;
}

export interface CommandPayload {
  action: string;
  params?: Record<string, string>;
}

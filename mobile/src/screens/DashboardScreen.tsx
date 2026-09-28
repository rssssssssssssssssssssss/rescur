import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { sendCommand } from '../services/api';

export const DashboardScreen: React.FC = () => {
  const { telemetry, connected } = useWebSocket();

  if (!telemetry) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#070a12',
        color: '#00f0ff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Orbitron, monospace'
      }}>
        <h2>🚨 CONNECTING TO LAPTOP AI TELEMETRY HUB...</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '8px' }}>
          {connected ? 'Waiting for 10Hz Laptop AI telemetry...' : 'Connecting ws://localhost:8000/ws...'}
        </p>
      </div>
    );
  }

  const {
    camera, tracker, vitals, audio, human_detection,
    gas_hazard, environment, distance, orientation,
    navigation, gps, communication, battery, lighting, safety
  } = telemetry;

  return (
    <div style={{
      background: '#070a12',
      color: '#f1f5f9',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif',
      padding: '16px'
    }}>
      {/* Header Navbar */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid rgba(0, 240, 255, 0.2)',
        borderRadius: '12px',
        padding: '12px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.2rem', color: '#fff', margin: 0 }}>
            🚨 RESCUE-X — LAPTOP AI MISSION CONTROL
          </h1>
          <span style={{ fontSize: '0.7rem', color: '#00f0ff', fontFamily: 'JetBrains Mono' }}>
            CAMERA FRAME STREAM → LAPTOP YOLO AI DETECT & MAPPING ACTIVE
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', fontFamily: 'JetBrains Mono' }}>
          <span style={{ background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', padding: '6px 10px', borderRadius: '4px', border: '1px solid #00ff88' }}>
            📡 LINK: {communication.wifi_signal_pct}%
          </span>
          <span style={{ background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', padding: '6px 10px', borderRadius: '4px', border: '1px solid #00f0ff' }}>
            🔋 BATTERY: {battery.percentage}% ({battery.voltage_v}V)
          </span>
          <span style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '6px 10px', borderRadius: '4px', border: '1px solid #a855f7' }}>
            🤖 MODE: {navigation.mode}
          </span>
        </div>
      </header>

      {/* Main Grid View */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '14px'
      }}>
        {/* 1. 🎥 Camera Stream (Processed on Laptop) */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span>📷 1. LIVE CAMERA FEED (STREAM TO LAPTOP)</span>
            <span style={{ color: '#00ff88', fontSize: '0.7rem' }}>YOLOv8 AI ACTIVE</span>
          </div>
          <div style={{
            height: '180px',
            background: '#020408',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            position: 'relative'
          }}>
            <span style={{ color: '#00f0ff', fontSize: '0.8rem' }}>🎥 LIVE STREAM TO LAPTOP SERVER</span>
            {camera.recording && (
              <div style={{ position: 'absolute', top: 8, right: 8, background: '#ff2a5f', color: '#fff', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '3px' }}>
                REC
              </div>
            )}
          </div>
        </div>

        {/* 2. 📍 LAPTOP AI HUMAN TRACKING & SPATIAL MAPPING CARD */}
        <div style={{ ...cardStyle, borderColor: tracker.detected ? '#00ff88' : 'rgba(0, 240, 255, 0.15)' }}>
          <div style={cardHeaderStyle}>
            <span style={{ color: tracker.detected ? '#00ff88' : '#00f0ff' }}>
              📍 2. LAPTOP AI HUMAN TRACKER & MAP
            </span>
            <span style={{
              background: tracker.detected ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: tracker.detected ? '#00ff88' : '#94a3b8',
              padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem'
            }}>
              {tracker.tracking_status}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <div style={subBoxStyle}>
              <span style={labelStyle}>TARGET DISTANCE</span>
              <strong style={{ color: '#00ff88', fontSize: '1.1rem' }}>{tracker.distance_m} m</strong>
            </div>
            <div style={subBoxStyle}>
              <span style={labelStyle}>BEARING ANGLE</span>
              <strong style={{ color: '#00f0ff', fontSize: '1.1rem' }}>{tracker.bearing_deg}° NE</strong>
            </div>
            <div style={subBoxStyle}>
              <span style={labelStyle}>RELATIVE OFFSET (X, Y)</span>
              <strong style={{ color: '#ffaa00' }}>X: {tracker.relative_x_m}m | Y: {tracker.relative_y_m}m</strong>
            </div>
            <div style={subBoxStyle}>
              <span style={labelStyle}>MAPPED GPS LOCATION</span>
              <strong style={{ color: '#fff', fontSize: '0.75rem' }}>{tracker.mapped_lat}, {tracker.mapped_lon}</strong>
            </div>
          </div>
        </div>

        {/* 3. ❤️ Vital-Sign Feed */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span>❤️ 3. VITAL-SIGN RADAR (60GHz mmWave)</span>
            <span style={{ color: '#00ff88', fontSize: '0.7rem' }}>CONF: {vitals.confidence}%</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.9rem' }}>
            <div style={subBoxStyle}>
              <span style={labelStyle}>HEART RATE</span>
              <strong style={{ color: '#00ff88', fontSize: '1.2rem' }}>{vitals.heart_rate} BPM</strong>
            </div>
            <div style={subBoxStyle}>
              <span style={labelStyle}>BREATHING</span>
              <strong style={{ color: '#00f0ff', fontSize: '1.2rem' }}>{vitals.breathing_rate} BPM</strong>
            </div>
          </div>
        </div>

        {/* 4. 🎤 Audio Feed */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span>🎤 4. AUDIO FEED</span>
            <span style={{ color: '#a855f7', fontSize: '0.7rem' }}>{audio.status}</span>
          </div>
          <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>SOUND LEVEL: <strong>{audio.sound_level_db} dB</strong></div>
            <div>VOICE CRY DETECTED: <strong style={{ color: audio.voice_cry_detected ? '#00ff88' : '#64748b' }}>{audio.voice_cry_detected ? 'YES' : 'NO'}</strong></div>
            <div>SOUND DIRECTION: <strong>{audio.sound_direction_deg}° NE</strong></div>
          </div>
        </div>

        {/* 5. 👤 Fused Human Detection Engine */}
        <div style={{ ...cardStyle, borderColor: '#00ff88' }}>
          <div style={cardHeaderStyle}>
            <span style={{ color: '#00ff88' }}>👤 5. FUSED HUMAN DETECTION</span>
            <span style={{ color: '#00ff88', fontWeight: 'bold' }}>{human_detection.confidence}%</span>
          </div>
          <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#00ff88' }}>
              STATUS: {human_detection.status}
            </div>
            <div>Laptop YOLO Visual: <strong>{human_detection.camera_detected ? 'Detected (94%)' : 'Clear'}</strong></div>
            <div>mmWave Radar Vitals: <strong>{human_detection.radar_present ? 'Present (78 BPM)' : 'Clear'}</strong></div>
            <div>PIR Motion: <strong>{human_detection.pir_motion ? 'Active Motion' : 'Inactive'}</strong></div>
          </div>
        </div>

        {/* 6. ☠️ Gas Feed */}
        <div style={{ ...cardStyle, borderColor: gas_hazard.warning_active ? '#ff2a5f' : 'rgba(0, 240, 255, 0.15)' }}>
          <div style={cardHeaderStyle}>
            <span>☠️ 6. HAZARD / GAS FEED</span>
            <span style={{ color: gas_hazard.warning_active ? '#ff2a5f' : '#00ff88' }}>{gas_hazard.hazard_status}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <div style={subBoxStyle}>
              <span style={labelStyle}>GAS LEVEL</span>
              <strong>{gas_hazard.gas_level_ppm} PPM</strong>
            </div>
            <div style={subBoxStyle}>
              <span style={labelStyle}>AIR QUALITY</span>
              <strong style={{ color: gas_hazard.warning_active ? '#ff2a5f' : '#00ff88' }}>{gas_hazard.air_quality_level}</strong>
            </div>
          </div>
        </div>

        {/* 7. 🌡️ Environment Feed */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}><span>🌡️ 7. ENVIRONMENT TEMP</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.9rem' }}>
            <div>TEMP: <strong style={{ color: '#00f0ff' }}>{environment.temperature_c}°C</strong></div>
            <div>LIGHT: <strong style={{ color: '#ffaa00' }}>{environment.ldr_lux} LUX</strong></div>
          </div>
        </div>

        {/* 8. 📏 Distance Feed */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}><span>📏 8. 4-WAY DISTANCE FEED</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '0.75rem' }}>
            <div style={subBoxStyle}>FRONT: <strong>{distance.front_cm} cm</strong></div>
            <div style={{ ...subBoxStyle, border: distance.warning_left ? '1px solid #ff2a5f' : '1px solid transparent' }}>
              LEFT: <strong style={{ color: distance.warning_left ? '#ff2a5f' : '#fff' }}>{distance.left_cm} cm ⚠️</strong>
            </div>
            <div style={subBoxStyle}>RIGHT: <strong>{distance.right_cm} cm</strong></div>
            <div style={subBoxStyle}>REAR: <strong>{distance.rear_cm} cm</strong></div>
          </div>
        </div>

        {/* 9. 🧭 Orientation Feed */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}><span>🧭 9. ORIENTATION (MPU6050)</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.85rem' }}>
            <span>PITCH: <strong>{orientation.pitch_deg}°</strong></span>
            <span>ROLL: <strong>{orientation.roll_deg}°</strong></span>
            <span>YAW: <strong style={{ color: '#00f0ff' }}>{orientation.yaw_deg}°</strong></span>
          </div>
        </div>

        {/* 10. 🛞 Navigation Feed */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}><span>🛞 10. MOVEMENT / NAVIGATION</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.85rem' }}>
            <span>SPEED: <strong>{navigation.speed_ms} m/s</strong></span>
            <span>DISTANCE: <strong>{navigation.distance_travelled_m} m</strong></span>
          </div>
        </div>

        {/* 11. 📍 GPS Feed */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}><span>📍 11. GPS LOCATION</span></div>
          <div style={{ fontSize: '0.8rem' }}>
            <div>ROVER LAT: <strong>{gps.latitude}° N</strong></div>
            <div>ROVER LON: <strong>{gps.longitude}° E</strong></div>
            <div>SATS: <strong style={{ color: '#00ff88' }}>{gps.satellites_locked} LOCKED</strong></div>
          </div>
        </div>

        {/* 12. 📡 Communication Status */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}><span>📡 12. COMM STATUS</span></div>
          <div style={{ fontSize: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
            <div>ESP32: <strong style={{ color: '#00ff88' }}>{communication.esp32_status}</strong></div>
            <div>STM32: <strong style={{ color: '#00ff88' }}>{communication.stm32_status}</strong></div>
            <div>LoRa: <strong style={{ color: '#00ff88' }}>{communication.lora_status}</strong></div>
            <div>Latency: <strong>{communication.last_received_ms} ms</strong></div>
          </div>
        </div>

        {/* 13. 🔋 Battery Status */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}><span>🔋 13. BATTERY STATUS</span></div>
          <div style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-around' }}>
            <span>LEVEL: <strong style={{ color: '#00ff88' }}>{battery.percentage}%</strong></span>
            <span>VOLTS: <strong>{battery.voltage_v} V</strong></span>
            <span>CURRENT: <strong>{battery.current_draw_a} A</strong></span>
          </div>
        </div>

        {/* 14. 💡 Lighting Status */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}><span>💡 14. LIGHTING CONTROL</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>HEADLIGHTS: <strong style={{ color: lighting.headlights_on ? '#ffaa00' : '#64748b' }}>{lighting.headlights_on ? 'ON' : 'OFF'}</strong></span>
            <button onClick={() => sendCommand('TOGGLE_LIGHTS')} style={btnStyle}>Toggle Lights</button>
          </div>
        </div>

        {/* 15. 🚨 Safety & Controls Card */}
        <div style={{ ...cardStyle, borderColor: safety.emergency_stop ? '#ff2a5f' : '#00f0ff' }}>
          <div style={cardHeaderStyle}>
            <span style={{ color: '#ff2a5f' }}>🚨 15. SAFETY & TELE-OPERATION CONTROLS</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button onClick={() => sendCommand('FORWARD')} style={btnStyle}>▲ FWD</button>
            <button onClick={() => sendCommand('LEFT')} style={btnStyle}>◀ LEFT</button>
            <button onClick={() => sendCommand('STOP')} style={{ ...btnStyle, background: '#64748b' }}>STOP</button>
            <button onClick={() => sendCommand('RIGHT')} style={btnStyle}>▶ RIGHT</button>
            <button onClick={() => sendCommand('REVERSE')} style={btnStyle}>▼ REV</button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => sendCommand(safety.emergency_stop ? 'RESET_ESTOP' : 'ESTOP')}
              style={{
                flex: 1,
                background: safety.emergency_stop ? '#00ff88' : '#ff2a5f',
                color: '#fff',
                fontWeight: 'bold',
                border: 'none',
                padding: '10px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {safety.emergency_stop ? 'RESET EMERGENCY STOP' : '🛑 EMERGENCY STOP'}
            </button>
            <button onClick={() => sendCommand('SIM_HUMAN')} style={btnStyle}>👤 Sim Human</button>
            <button onClick={() => sendCommand('SIM_GAS')} style={btnStyle}>☠️ Sim Gas</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.85)',
  border: '1px solid rgba(0, 240, 255, 0.15)',
  borderRadius: '12px',
  padding: '14px',
  fontFamily: 'JetBrains Mono, monospace'
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justify-content: 'space-between',
  alignItems: 'center',
  marginBottom: '10px',
  color: '#00f0ff',
  fontSize: '0.8rem',
  fontWeight: 'bold'
};

const subBoxStyle: React.CSSProperties = {
  background: 'rgba(10, 15, 26, 0.6)',
  padding: '8px',
  borderRadius: '6px',
  textAlign: 'center'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.65rem',
  color: '#94a3b8',
  marginBottom: '2px'
};

const btnStyle: React.CSSProperties = {
  background: 'rgba(0, 240, 255, 0.15)',
  border: '1px solid #00f0ff',
  color: '#00f0ff',
  padding: '6px 12px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '0.75rem'
};

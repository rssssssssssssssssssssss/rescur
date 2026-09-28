import { RoverTelemetry } from '../types';

type TelemetryCallback = (data: RoverTelemetry) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: TelemetryCallback[] = [];
  private url: string;
  private isConnecting: boolean = false;

  constructor(url: string = 'ws://localhost:8000/ws') {
    this.url = url;
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('CONNECTED to RESCUE-X Laptop AI WebSocket Hub');
      this.isConnecting = false;
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'telemetry' && msg.data) {
          this.notifyListeners(msg.data);
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    this.ws.onclose = () => {
      console.warn('RESCUE-X WebSocket Disconnected. Retrying in 2s...');
      this.isConnecting = false;
      setTimeout(() => this.connect(), 2000);
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket Error:', err);
      this.ws?.close();
    };
  }

  public subscribe(callback: TelemetryCallback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(data: RoverTelemetry) {
    this.listeners.forEach(cb => cb(data));
  }
}

export const wsService = new WebSocketService();

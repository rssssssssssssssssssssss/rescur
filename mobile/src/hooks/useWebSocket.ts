import { useEffect, useState } from 'react';
import { wsService } from '../services/websocket';
import { RoverTelemetry } from '../types';

export function useWebSocket() {
  const [telemetry, setTelemetry] = useState<RoverTelemetry | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    wsService.connect();
    setConnected(true);

    const unsubscribe = wsService.subscribe((data) => {
      setTelemetry(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { telemetry, connected };
}

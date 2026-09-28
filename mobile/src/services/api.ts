const BASE_URL = 'http://localhost:8000';

export async function sendCommand(action: string, params?: Record<string, string>) {
  try {
    const res = await fetch(`${BASE_URL}/api/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, params })
    });
    return await res.json();
  } catch (error) {
    console.error('Failed to send command REST request:', error);
    return { status: 'ERROR', error: String(error) };
  }
}

export async function uploadCameraFrame(file: Blob | File) {
  try {
    const formData = new FormData();
    formData.append('file', file, 'frame.jpg');
    const res = await fetch(`${BASE_URL}/api/camera/frame`, {
      method: 'POST',
      body: formData
    });
    return await res.json();
  } catch (error) {
    console.error('Failed to upload camera frame to Laptop AI:', error);
    return { status: 'ERROR', error: String(error) };
  }
}

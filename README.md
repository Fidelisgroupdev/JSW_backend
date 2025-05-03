# Real-Time RTSP Stream Monitoring with YOLOv8 and WebRTC Viewer

## Manual Setup (Phase 1)

### 1. Python Inference Engine
- Go to `backend/inference/`
- Place your trained `best.pt` YOLOv8 model in this folder.
- Set your RTSP camera URL in `main.py` (RTSP_INPUT).
- Install requirements: `pip install -r requirements.txt`
- Run: `python main.py`

### 2. MediaMTX
- Download and run MediaMTX from https://github.com/bluenviron/mediamtx
- Use the provided `mediartx/mediamtx.yaml` config.
- Start MediaMTX: `mediamtx mediartx/mediamtx.yaml`

### 3. Frontend (to be implemented)
- React WebRTC viewer coming next.

### 4. Notes
- The pipeline: RTSP Camera → YOLOv8 Python Engine → FFmpeg RTSP out → MediaMTX → WebRTC → Browser
- For boundary customization, edit `boundaries.json`.

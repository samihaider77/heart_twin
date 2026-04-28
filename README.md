# Heart Twin - Cardiac Digital Twin Dashboard

A comprehensive cardiac monitoring application that visualizes patient heart data in real-time with AI-powered analysis.

## Features

- 📊 Interactive patient data dashboard with UCI Heart Disease dataset
- ❤️ Real-time cardiac signal monitoring (ECG, SpO2, Blood Pressure)
- 🤖 AI-powered medical analysis using Ollama (Gemma2 model)
- 🩺 Blood pressure, heart rate, and cholesterol monitoring
- 🎨 Color-coded risk indicators for cardiac parameters
- 📱 Responsive Next.js frontend with modern UI

## Project Structure

```
heart_twin/
├── backend/           # FastAPI backend
│   ├── app/          # API endpoints & services
│   ├── data/         # Patient datasets & 3D models
│   └── requirements.txt
├── frontend/         # Next.js frontend
│   ├── src/
│   │   ├── app/      # Pages (dashboard, monitor)
│   │   ├── components/ # UI components (ECG, SpO2, BP, etc.)
│   │   ├── hooks/    # Custom React hooks
│   │   ├── lib/      # API client & signal processing
│   │   └── types/    # TypeScript types
│   └── package.json
└── dev.ps1          # Development script
```

## Setup

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install backend dependencies:
```bash
uv pip install -r backend/requirements.txt
```

3. Start Ollama (for AI analysis):
```bash
ollama pull gemma2:2b
ollama serve
```

4. Run the FastAPI server:
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create frontend environment file:
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

4. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Environment Configuration

- Frontend reads backend URL from `NEXT_PUBLIC_API_URL`.
- You can set it either as origin only (`https://api.example.com`) or full base path (`https://api.example.com/api/v1`).
- If `/api/v1` is omitted, frontend adds it automatically.

Examples:

```bash
# Local
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# Production
NEXT_PUBLIC_API_URL=https://your-backend-domain
```

Backend CORS origins are controlled by `FRONTEND_ORIGINS` (comma-separated), for example:

```bash
FRONTEND_ORIGINS=http://localhost:3000,https://your-frontend-domain
```

## Contabo Deployment Notes

1. Deploy backend so it is reachable publicly (domain recommended) and run it on `0.0.0.0`.
2. Set backend `FRONTEND_ORIGINS` to your frontend URL(s).
3. Build frontend with `NEXT_PUBLIC_API_URL` already set to deployed backend URL.
4. If frontend is HTTPS, backend should also be HTTPS to avoid mixed-content blocks.
5. Verify `GET /api/v1/patients` returns `200` (not `307`) from browser network tab.

## Technologies Used

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python
- **AI/ML**: Ollama (Gemma2 model) for medical analysis
- **Data**: UCI Heart Disease dataset, pandas

## Usage

1. Select a patient from the dashboard
2. View real-time cardiac signals:
   - ECG waveform (multi-lead)
   - SpO2 levels
   - Blood pressure readings
   - Heart rate
3. Get AI-powered medical observations based on patient parameters

## AI Analysis

The application uses Ollama's Gemma2 model to provide medical observations based on patient parameters. Make sure Ollama is running locally for this feature to work.

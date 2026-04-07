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
pip install -r backend/requirements.txt
```

3. Start Ollama (for AI analysis):
```bash
ollama pull gemma2:2b
ollama serve
```

4. Run the FastAPI server:
```bash
uvicorn backend.app.main:app --reload
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

3. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

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

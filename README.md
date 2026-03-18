# Heart Twin - Cardiac Digital Twin Dashboard

A comprehensive cardiac monitoring application that visualizes patient heart data in real-time with 3D heart models and AI-powered analysis.

## Features

- 📊 Interactive patient data dashboard with UCI Heart Disease dataset
- ❤️ Real-time 3D heart visualization with anatomically accurate beating animation
- 🤖 AI-powered medical analysis using Ollama (Gemma2 model)
- 🩺 Blood pressure, heart rate, and cholesterol monitoring
- 🎨 Color-coded risk indicators for cardiac parameters
- 📱 Responsive Next.js frontend with modern UI

## Project Structure

```
heart_twin/
├── app.py              # Streamlit dashboard with 3D heart viewer
├── backend/           # FastAPI backend
│   ├── app/          # API endpoints
│   ├── data/         # Patient datasets & 3D models
│   └── requirements.txt
├── frontend/         # Next.js frontend
│   ├── src/
│   ├── public/
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
pip install streamlit ollama pandas
```

3. Start Ollama (for AI analysis):
```bash
ollama pull gemma2:2b
ollama serve
```

4. Run the Streamlit app:
```bash
streamlit run app.py
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

## Technologies Used

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python
- **Visualization**: Three.js for 3D heart rendering
- **AI/ML**: Ollama (Gemma2 model) for medical analysis
- **Data**: UCI Heart Disease dataset, pandas

## Usage

1. Select a patient from the dropdown menu
2. Adjust parameters using the sidebar sliders:
   - Blood Pressure (80-200 mmHg)
   - Cholesterol (120-400 mg/dL)
   - Heart Rate (60-200 bpm)
3. View the real-time 3D heart visualization
4. Get AI-powered medical observations

## AI Analysis

The application uses Ollama's Gemma2 model to provide medical observations based on patient parameters. Make sure Ollama is running locally for this feature to work.


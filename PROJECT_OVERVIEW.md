# GitHub Copilot Prompt - ECG/EKG & SpO2 Real-Time Graphs Implementation

## Context
I'm building a cardiac digital twin application with Next.js frontend and FastAPI backend. The project currently displays static vital signs (BP, HR, Cholesterol) from the UCI Heart Disease dataset. Now I need to add real-time ECG/EKG waveforms and SpO2 (oxygen saturation) graphs that look like hospital monitors.

**Important:** Since my current dataset only has static snapshots (not continuous signals), I need to **GENERATE REALISTIC synthetic ECG and SpO2 waveforms** that correspond to each patient's heart rate.

---

## Requirements

### 1. Backend (FastAPI - Python)

**File: `backend/app/services/signal_generator.py`**

Create a service that generates realistic physiological signals:

```python
# Generate realistic ECG waveform based on patient's heart rate
# Generate realistic SpO2 (oxygen saturation) values with minor variations
# ECG should have proper P-QRS-T complex morphology
# Signals should be time-synchronized (same timestamp axis)
```

**Specifications:**
- **ECG Signal:**
  - Sampling rate: 250 Hz (250 samples per second)
  - Duration: Generate 10 seconds of continuous data (2500 samples)
  - Heart rate: Use patient's actual HR from dataset (60-200 bpm)
  - Morphology: Realistic P wave, QRS complex, T wave
  - Amplitude: P (0.1-0.3 mV), QRS (0.8-1.2 mV), T (0.2-0.4 mV)
  - Noise: Add subtle baseline wander + random noise for realism

- **SpO2 Signal:**
  - Sampling rate: 1 Hz (1 sample per second)
  - Duration: 60 seconds of data
  - Normal range: 95-100%
  - Add small random variations (±1-2%)
  - Correlate with heart rate (lower SpO2 if HR is abnormally high/low)

**Library to use:** `neurokit2` (install with: `pip install neurokit2`)

**API Endpoint to create:**
```python
@router.get("/api/v1/signals/{patient_id}")
async def get_patient_signals(patient_id: int):
    """
    Returns ECG waveform and SpO2 time-series for a specific patient
    Response format:
    {
        "ecg": {
            "timestamps": [0.000, 0.004, 0.008, ...],  # seconds
            "values": [0.0, 0.1, 0.5, ...],            # mV
            "heart_rate": 75,                           # bpm
            "sampling_rate": 250                        # Hz
        },
        "spo2": {
            "timestamps": [0, 1, 2, ...],              # seconds
            "values": [98, 97, 98, 99, ...],           # percentage
            "average": 98                               # %
        }
    }
    """
```

---

### 2. Frontend (Next.js - TypeScript + React)

**File: `frontend/src/components/RealTimeMonitor.tsx`**

Create a hospital-style monitoring component with scrolling graphs:

```typescript
// Component should display:
// 1. ECG waveform (scrolling left continuously like hospital monitors)
// 2. SpO2 graph (scrolling bar chart or line)
// 3. Current values displayed as large numbers
// 4. Color-coded alerts (red if abnormal, green if normal)
```

**Specifications:**
- **Layout:**
  ```
  ┌─────────────────────────────────────────┐
  │ ECG (Lead II)              HR: 75 bpm   │
  │ ━━━━━━╱╲━━━━╱█╲━━━╱╲━━━━━━━━━━━━━━━━  │
  │                                         │
  ├─────────────────────────────────────────┤
  │ SpO2                            98%     │
  │ ████████████████████████████████░░░░    │
  └─────────────────────────────────────────┘
  ```

- **ECG Graph:**
  - Use **Plotly.js** or **Chart.js** with streaming mode
  - Black background, green line (classic monitor look)
  - Grid lines (5mm × 5mm standard ECG paper style)
  - Auto-scroll from right to left
  - Show 5-10 seconds of data at once
  - Update at 30 FPS (downsample from 250 Hz to 30 Hz for performance)

- **SpO2 Graph:**
  - Line graph or bar chart
  - Blue color for oxygen saturation
  - Normal range indicator (95-100% highlighted in green)
  - Below 95%: Yellow warning
  - Below 90%: Red alert

**Charting Library:** Use **Plotly.js** for streaming capability
```bash
npm install plotly.js-dist-min
npm install @types/plotly.js
```

**Alternative:** **Chart.js** with streaming plugin
```bash
npm install chart.js chartjs-plugin-streaming
```

**Animation:** Smooth scrolling effect using GSAP or CSS animations

---

### 3. Data Flow

**Workflow:**
```
User selects patient → Frontend requests /api/v1/signals/{id} 
→ Backend generates ECG + SpO2 based on patient's HR 
→ Frontend receives data and starts animating graphs 
→ Graphs scroll continuously (loop/repeat data if needed)
```

**Real-time Simulation:**
- Since data is pre-generated, create illusion of "live" by:
  1. Render data points progressively (not all at once)
  2. Add timestamp delays (render 250 points/second for ECG)
  3. Loop the signal seamlessly when it ends

---

### 4. Visual Styling (Hospital Monitor Theme)

**CSS Requirements:**
```css
/* ECG Monitor */
background: #000000 (black)
grid lines: #003300 (dark green)
ECG waveform: #00ff00 (bright green)
text: #00ff00

/* SpO2 Monitor */
background: #001a33 (dark blue)
waveform: #0099ff (blue)
text: #ffffff

/* Alert colors */
normal: #00ff00 (green)
warning: #ffaa00 (yellow)
critical: #ff0000 (red)
```

**Fonts:**
- Use monospace font (e.g., 'Courier New', 'Monaco')
- Large numbers for current values (48px)
- Small labels for units (14px)

---

### 5. Additional Features (Optional but Impressive)

**Heart Rate Detection:**
```typescript
// Calculate HR from ECG peaks automatically
// Display next to waveform
// Update in real-time as graph scrolls
```

**Annotations:**
```typescript
// Mark P, QRS, T waves on ECG
// Show intervals (PR interval, QT interval)
// Display these as tooltips on hover
```

**Audio:**
```typescript
// Add beep sound synchronized to each QRS complex
// Pitch changes with heart rate
// Can be muted/unmuted
```

**Alerts:**
```typescript
// Visual + audio alerts for:
// - Bradycardia (HR < 60)
// - Tachycardia (HR > 100)
// - Low SpO2 (< 95%)
// - Critical SpO2 (< 90%)
```

---

### 6. File Structure

**Backend:**
```
backend/app/
├── services/
│   └── signal_generator.py       # NEW: ECG/SpO2 generation
├── routes/
│   └── signals.py                # NEW: API endpoints for signals
└── main.py                       # Register new routes
```

**Frontend:**
```
frontend/src/
├── components/
│   ├── RealTimeMonitor.tsx       # NEW: Main monitor component
│   ├── ECGGraph.tsx              # NEW: ECG waveform display
│   ├── SpO2Graph.tsx             # NEW: SpO2 display
│   └── VitalDisplay.tsx          # NEW: Large number displays
├── hooks/
│   └── useSignalStreaming.ts     # NEW: Hook for data fetching/animation
└── lib/
    └── signalProcessor.ts        # NEW: Signal processing utilities
```

---

### 7. Testing Checklist

After implementation, verify:
- [ ] ECG waveform looks realistic (has P-QRS-T morphology)
- [ ] Heart rate matches patient's HR from dataset
- [ ] Graph scrolls smoothly from right to left
- [ ] SpO2 stays in normal range (95-100%)
- [ ] Can switch between different patients
- [ ] No lag or jank (60 FPS animation)
- [ ] Responsive on different screen sizes
- [ ] Audio beep works (if implemented)
- [ ] Alerts trigger correctly for abnormal values

---

## Example Code Snippets

### Backend Signal Generation (Python)

```python
import neurokit2 as nk
import numpy as np

def generate_ecg_signal(heart_rate: int, duration: int = 10):
    """
    Generate realistic ECG waveform
    
    Args:
        heart_rate: Patient's heart rate in bpm
        duration: Length of signal in seconds
    
    Returns:
        dict with timestamps and values
    """
    sampling_rate = 250  # Hz
    
    # Generate ECG using neurokit2
    ecg = nk.ecg_simulate(
        duration=duration, 
        sampling_rate=sampling_rate, 
        heart_rate=heart_rate,
        noise=0.01  # Add realistic noise
    )
    
    # Create timestamps
    timestamps = np.arange(len(ecg)) / sampling_rate
    
    return {
        "timestamps": timestamps.tolist(),
        "values": ecg.tolist(),
        "heart_rate": heart_rate,
        "sampling_rate": sampling_rate
    }

def generate_spo2_signal(heart_rate: int, duration: int = 60):
    """
    Generate realistic SpO2 values
    
    Args:
        heart_rate: Patient's heart rate (affects baseline SpO2)
        duration: Length of signal in seconds
    
    Returns:
        dict with timestamps and values
    """
    # Base SpO2 (slightly lower if HR is abnormal)
    if heart_rate < 60 or heart_rate > 100:
        base_spo2 = 96
    else:
        base_spo2 = 98
    
    # Generate values with small variations
    timestamps = np.arange(duration)
    values = base_spo2 + np.random.normal(0, 1, duration)
    values = np.clip(values, 94, 100)  # Keep in realistic range
    
    return {
        "timestamps": timestamps.tolist(),
        "values": values.astype(int).tolist(),
        "average": int(np.mean(values))
    }
```

### Frontend ECG Display (TypeScript + React)

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';

interface ECGGraphProps {
  patientId: number;
}

export function ECGGraph({ patientId }: ECGGraphProps) {
  const graphRef = useRef<HTMLDivElement>(null);
  const [heartRate, setHeartRate] = useState(0);

  useEffect(() => {
    async function loadECG() {
      // Fetch ECG data from backend
      const response = await fetch(`/api/v1/signals/${patientId}`);
      const data = await response.json();
      
      setHeartRate(data.ecg.heart_rate);
      
      // Initialize Plotly graph
      if (graphRef.current) {
        Plotly.newPlot(graphRef.current, [{
          x: data.ecg.timestamps,
          y: data.ecg.values,
          type: 'scatter',
          mode: 'lines',
          line: { color: '#00ff00', width: 2 },
          hoverinfo: 'none'
        }], {
          paper_bgcolor: '#000000',
          plot_bgcolor: '#000000',
          xaxis: { 
            showgrid: true, 
            gridcolor: '#003300',
            showticklabels: false,
            range: [0, 5]  // Show 5 seconds at a time
          },
          yaxis: { 
            showgrid: true, 
            gridcolor: '#003300',
            range: [-0.5, 1.5]
          },
          margin: { l: 30, r: 30, t: 30, b: 30 }
        }, {
          displayModeBar: false
        });
        
        // Animate scrolling
        animateScroll(data.ecg.timestamps, data.ecg.values);
      }
    }
    
    loadECG();
  }, [patientId]);

  function animateScroll(timestamps: number[], values: number[]) {
    let index = 0;
    const interval = setInterval(() => {
      if (!graphRef.current) return;
      
      // Update visible window (scroll effect)
      const windowSize = 5;  // 5 seconds visible
      const start = timestamps[index];
      const end = start + windowSize;
      
      Plotly.relayout(graphRef.current, {
        'xaxis.range': [start, end]
      });
      
      index += 125;  // Advance by 0.5 seconds
      if (index >= timestamps.length) index = 0;  // Loop
    }, 500);
    
    return () => clearInterval(interval);
  }

  return (
    <div className="bg-black p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-green-500 font-mono text-sm">ECG (Lead II)</span>
        <span className="text-green-500 font-mono text-2xl">
          HR: {heartRate} bpm
        </span>
      </div>
      <div ref={graphRef} className="w-full h-64" />
    </div>
  );
}
```

---

## Dependencies to Install

**Backend:**
```bash
pip install neurokit2 numpy scipy
```

**Frontend:**
```bash
npm install plotly.js-dist-min
npm install @types/plotly.js
```

**Alternative (Chart.js):**
```bash
npm install chart.js chartjs-plugin-streaming
npm install react-chartjs-2
```

---

## Success Criteria

✅ ECG waveform looks medically realistic (doctor can recognize P-QRS-T)
✅ Graph scrolls smoothly like hospital monitors
✅ Heart rate displayed matches the waveform rhythm
✅ SpO2 graph shows realistic oxygen saturation values
✅ Color-coded alerts work (green = normal, red = critical)
✅ Can switch between patients and signals update correctly
✅ Performance: 60 FPS with no lag
✅ Responsive design works on different screen sizes

---

## Important Notes for Implementation

1. **Do NOT download external datasets** - generate signals synthetically
2. **Use neurokit2** for ECG generation - it creates realistic morphology
3. **Keep sampling rates reasonable** - 250 Hz for ECG, 1 Hz for SpO2
4. **Downsample for rendering** - Show 30 FPS, not 250 FPS (performance)
5. **Match patient's actual HR** - ECG rhythm should sync with HR from dataset
6. **Add subtle noise** - Makes it look more realistic
7. **Loop seamlessly** - When signal ends, restart without visible jump
8. **Black background + green lines** - Classic medical monitor aesthetic

---

## Time Estimate

- Backend signal generation: 3-4 hours
- Frontend ECG graph: 4-5 hours
- Frontend SpO2 graph: 2-3 hours
- Styling + polish: 2-3 hours
- Testing + debugging: 2 hours


---

## Questions to Clarify Before Starting

1. Should the graphs auto-scroll continuously, or pause when user hovers?
2. Do you want audio beeps synchronized to heartbeats?
3. Should we show multiple ECG leads (I, II, III, aVR, etc.) or just Lead II?
4. Do you want historical trend graphs (e.g., last 1 hour SpO2)?
5. Should alerts be visual only, or also trigger notifications?

---

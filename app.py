import base64
import os

import ollama
import pandas as pd
import streamlit as st
import streamlit.components.v1 as components


def get_ai_analysis(bp, hr, chol):
    prompt = (
        f"The patient has BP of {bp}, HR of {hr}, and Cholesterol of {chol}. "
        "As a digital twin, provide a 1-sentence medical observation."
    )
    try:
        response = ollama.chat(
            model="gemma2:2b",
            messages=[{"role": "user", "content": prompt}],
        )
        return response["message"]["content"]
    except Exception:
        return "⚠️ AI model unavailable — start Ollama locally to enable analysis."

# ── Page config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Cardiac Report",
    page_icon="❤️",
    layout="centered",
)

# ── Load dataset ─────────────────────────────────────────────────────────────
data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", "data")
df = pd.read_csv(os.path.join(data_dir, "heart_disease_uci.csv"))

# Build a human-readable label for each row
df["_label"] = df.apply(
    lambda r: f"Patient {r['id']}  |  Age {r['age']}  {r['sex']}  |  {r['dataset']}", axis=1
)

st.title("❤️ Cardiac Report Dashboard")

# ── Patient selector ─────────────────────────────────────────────────────────
st.subheader("Select Patient")
selected_label = st.selectbox(
    "Choose a patient from the dataset:",
    options=df["_label"].tolist(),
    index=0,
)

row = df[df["_label"] == selected_label].iloc[0]

# Map CSV columns → slider defaults (clamp to slider range)
def clamp(val, lo, hi):
    return int(max(lo, min(hi, val)))

default_bp   = clamp(row["trestbps"], 80, 200)
default_hr   = clamp(row["thalch"],   60, 200)
default_chol = clamp(row["chol"],    120, 400)

# Show a compact summary card for the selected patient
with st.expander("📋 Patient Record", expanded=False):
    display_cols = ["id", "age", "sex", "dataset", "cp", "trestbps", "chol", "thalch", "num"]
    st.dataframe(row[display_cols].to_frame().T.reset_index(drop=True), use_container_width=True)

# ── Sidebar controls ─────────────────────────────────────────────────────────
st.sidebar.header("Patient Parameters")

blood_pressure = st.sidebar.slider(
    "Blood Pressure (mmHg)", min_value=80, max_value=200, value=default_bp, step=1
)
cholesterol = st.sidebar.slider(
    "Cholesterol (mg/dL)", min_value=120, max_value=400, value=default_chol, step=1
)
if cholesterol >= 240:
    chol_risk, chol_color = "\U0001f534 High Risk (\u2265240)", "#FF4444"
elif cholesterol >= 200:
    chol_risk, chol_color = "\U0001f7e1 Borderline (200\u2013239)", "#FFA500"
else:
    chol_risk, chol_color = "\U0001f7e2 Normal (<200)", "#00CC66"
st.sidebar.markdown(
    f"<p style='font-size:0.8rem; margin-top:-0.5rem; color:{chol_color};'>{chol_risk}</p>",
    unsafe_allow_html=True,
)
heart_rate = st.sidebar.slider(
    "Heart Rate (bpm)", min_value=60, max_value=200, value=default_hr, step=1
)

# ── AI Analysis ──────────────────────────────────────────────────────────────
st.sidebar.markdown("---")
st.sidebar.subheader("AI Observation")
with st.sidebar:
    with st.spinner("Analyzing with AI..."):
        ai_response = get_ai_analysis(blood_pressure, heart_rate, cholesterol)
    st.info(ai_response)

# ── Derived values passed into the 3D viewer ─────────────────────────────────
# Seconds per beat: HR=60→1.0s, HR=120→0.5s, HR=200→0.3s
beat_period = round(60 / heart_rate, 3)

# BP tiers:  ≤130 → normal, 130–145 → 40% red, >145 → 60% red
if blood_pressure <= 130:
    bp_red_intensity = 0.0
    status_msg   = "✅ Blood Pressure is normal."
    status_color = "green"
elif blood_pressure <= 145:
    bp_red_intensity = 0.4
    status_msg   = "🟡 Elevated Blood Pressure (130–145)"
    status_color = "orange"
else:
    bp_red_intensity = 0.6
    status_msg   = "⚠️ High Blood Pressure (>145)"
    status_color = "red"

high_bp = blood_pressure > 130   # any tint active (used for pulse scale)

# ── 3D Heart viewer ───────────────────────────────────────────────────────────
glb_path = os.path.join(data_dir, "heart_model.glb")

if os.path.exists(glb_path):
    with open(glb_path, "rb") as f:
        glb_b64 = base64.b64encode(f.read()).decode()
    model_src = f"data:model/gltf-binary;base64,{glb_b64}"
else:
    model_src = ""  # handled in JS

three_html = f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ background: #0E1117; overflow: hidden; }}
  canvas {{ display: block; }}
  #overlay {{
    position: absolute; bottom: 8px; left: 0; right: 0;
    text-align: center; color: #aaa; font: 11px sans-serif;
    pointer-events: none;
  }}
  #missing {{
    position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    color: #f55; font: 14px sans-serif; text-align: center; display: none;
  }}
</style>
</head>
<body>
<div id="missing">heart_model.glb not found.<br>Place the file in backend/data.</div>
<div id="overlay">Drag to rotate &nbsp;·&nbsp; Scroll to zoom</div>

<script type="importmap">
{{
  "imports": {{
    "three":         "https://unpkg.com/three@0.161.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.161.0/examples/jsm/"
  }}
}}
</script>

<script type="module">
import * as THREE from 'three';
import {{ GLTFLoader }}   from 'three/addons/loaders/GLTFLoader.js';
import {{ OrbitControls }} from 'three/addons/controls/OrbitControls.js';

// ── Config from Python ───────────────────────────────────────────────────
const BEAT_PERIOD      = {beat_period};        // seconds per full heartbeat
const BP_RED_INTENSITY = {bp_red_intensity};   // 0=normal, 0.4=40% red, 0.6=60% red
const HIGH_BP          = {'true' if high_bp else 'false'};
const MODEL_SRC        = `{model_src}`;

// ── Scene ────────────────────────────────────────────────────────────────
const W = window.innerWidth, H = window.innerHeight;
const renderer = new THREE.WebGLRenderer({{ antialias: true, alpha: true }});
renderer.setSize(W, H);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x0E1117, 1);
document.body.appendChild(renderer.domElement);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 100);
camera.position.set(0, 0, 3);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const dir = new THREE.DirectionalLight(0xffffff, 2.5);
dir.position.set(3, 5, 3);
scene.add(dir);
const fill = new THREE.DirectionalLight(0xffeedd, 1.0);
fill.position.set(-3, -2, -3);
scene.add(fill);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance   = 0.5;
controls.maxDistance   = 10;

// ── Load model ───────────────────────────────────────────────────────────
let heartModel = null;

if (!MODEL_SRC) {{
  document.getElementById('missing').style.display = 'block';
}} else {{
  const loader = new GLTFLoader();
  loader.load(
    MODEL_SRC,
    (gltf) => {{
      heartModel = gltf.scene;

      // Centre the model
      const box  = new THREE.Box3().setFromObject(heartModel);
      const centre = box.getCenter(new THREE.Vector3());
      heartModel.position.sub(centre);

      // Auto-fit to view
      const size   = box.getSize(new THREE.Vector3()).length();
      camera.position.set(0, 0, size * 1.5);
      controls.maxDistance = size * 6;

      // Apply BP colour tint via lerp: 0=original, 0.4=40% red, 0.6=60% red
      if (BP_RED_INTENSITY > 0) {{
        const targetRed = new THREE.Color(0x8B0000);
        heartModel.traverse((node) => {{
          if (node.isMesh) {{
            node.material = node.material.clone();
            const orig = node.material.color.clone();
            node.material.color.lerpColors(orig, targetRed, BP_RED_INTENSITY);
          }}
        }});
      }}

      scene.add(heartModel);
    }},
    undefined,
    (err) => {{
      console.error('GLB load error', err);
      document.getElementById('missing').style.display = 'block';
    }}
  );
}}

// ── Lub-dub pulse animation ──────────────────────────────────────────────
// Uses the same cardiac keyframe profile as before:
//   0%→rest, 14%→lub peak, 28%→relax, 42%→dub peak, 70%-100%→rest
const LUB_SCALE = HIGH_BP ? 1.22 : 1.13;
const DUB_SCALE = HIGH_BP ? 1.14 : 1.08;

function pulseScale(t) {{
  // Systole (active): first 40% of beat — lub-dub contractions
  // Diastole (rest):  60% of beat  — long pause, clearly slower at low HR
  if (t < 0.10) return 1 + (LUB_SCALE - 1) * (t / 0.10);                          // rise to lub
  if (t < 0.20) return LUB_SCALE - (LUB_SCALE - 1) * ((t - 0.10) / 0.10);        // fall from lub
  if (t < 0.30) return 1 + (DUB_SCALE - 1) * ((t - 0.20) / 0.10);                // rise to dub
  if (t < 0.40) return DUB_SCALE - (DUB_SCALE - 1) * ((t - 0.30) / 0.10);        // fall from dub
  return 1.0;                                                                        // diastole rest
}}

const clock = new THREE.Clock();

function animate() {{
  requestAnimationFrame(animate);
  controls.update();

  if (heartModel) {{
    const elapsed  = clock.getElapsedTime();
    const phase    = (elapsed % BEAT_PERIOD) / BEAT_PERIOD;  // 0→1
    const s        = pulseScale(phase);
    heartModel.scale.setScalar(s);
  }}

  renderer.render(scene, camera);
}}
animate();

// Resize
window.addEventListener('resize', () => {{
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}});
</script>
</body>
</html>
"""

st.markdown(
    "<style>iframe { border: none !important; box-shadow: none !important; }</style>",
    unsafe_allow_html=True,
)
components.html(three_html, height=520, scrolling=False)

# ── Status readout ────────────────────────────────────────────────────────────
st.markdown(
    f"<p style='text-align:center; color:{status_color}; font-size:1.1rem;'>"
    f"{status_msg}</p>",
    unsafe_allow_html=True,
)

st.markdown(
    f"""
    <p style='text-align:center; color:#888; font-size:0.9rem;'>
        Heart Rate: <b>{heart_rate} bpm</b> &nbsp;|&nbsp;
        Beat period: <b>{beat_period}s</b> &nbsp;|&nbsp;
        Cholesterol: <b>{cholesterol} mg/dL</b>
    </p>
    """,
    unsafe_allow_html=True,
)

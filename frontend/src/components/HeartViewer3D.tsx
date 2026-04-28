'use client';

import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface HeartViewer3DProps {
  systolicBp: number;
  diastolicBp: number;
  heartRate: number;
  ejectionFraction: number;
  riskScore: number;
}

type StoredMaterialState = {
  baseColor?: THREE.Color;
  baseEmissive?: THREE.Color;
  baseEmissiveIntensity?: number;
};

function updateHeartMaterials(
  scene: THREE.Group,
  tintFactor: number,
  emissiveBoost: number
) {
  const redTint = new THREE.Color('#ff4d4d');
  const visibleBaseFallback = new THREE.Color('#b86a6a');

  scene.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) {
      return;
    }

    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach((material) => {
      const m = material as THREE.Material & {
        color?: THREE.Color;
        emissive?: THREE.Color;
        emissiveIntensity?: number;
        userData: StoredMaterialState;
      };

      const userData = m.userData ?? (m.userData = {});

      if (m.color instanceof THREE.Color && !(userData.baseColor instanceof THREE.Color)) {
        userData.baseColor = m.color.clone();
      }

      if (m.emissive instanceof THREE.Color && !(userData.baseEmissive instanceof THREE.Color)) {
        userData.baseEmissive = m.emissive.clone();
      }

      if (typeof m.emissiveIntensity === 'number' && userData.baseEmissiveIntensity === undefined) {
        userData.baseEmissiveIntensity = m.emissiveIntensity;
      }

      if ('color' in material && material.color instanceof THREE.Color) {
        const storedBaseColor = userData.baseColor instanceof THREE.Color ? userData.baseColor : undefined;
        const base = (storedBaseColor ?? material.color).clone();
        if (base.getHSL({ h: 0, s: 0, l: 0 }).l < 0.08) {
          base.copy(visibleBaseFallback);
        }
        material.color.copy(base).lerp(redTint, tintFactor);
      }

      if ('emissive' in material && material.emissive instanceof THREE.Color) {
        const emissiveBase = userData.baseEmissive instanceof THREE.Color ? userData.baseEmissive : material.emissive;
        material.emissive.copy(emissiveBase).lerp(redTint, tintFactor * 0.4);
        const baseIntensity = userData.baseEmissiveIntensity ?? material.emissiveIntensity ?? 0;
        material.emissiveIntensity = Math.max(0.06, baseIntensity + emissiveBoost);
      }
    });
  });
}

const HeartModel = ({ systolicBp, diastolicBp, heartRate, ejectionFraction }: HeartViewer3DProps) => {
  const { scene } = useGLTF('/heart_model.glb');
  const heartRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    scene.position.sub(center);

    scene.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) {
        return;
      }

      node.material = Array.isArray(node.material)
        ? node.material.map((material) => material.clone())
        : node.material.clone();
    });
  }, [scene]);

  useEffect(() => {
    const pulsePressure = Math.max(20, systolicBp - diastolicBp);
    const isHighBp = systolicBp >= 140 || diastolicBp >= 90;
    const pressureSeverity = THREE.MathUtils.clamp((systolicBp - 140) / 40, 0, 1);
    const tintFactor = isHighBp ? THREE.MathUtils.lerp(0.08, 0.22, pressureSeverity) : 0;
    const emissiveBoost = isHighBp ? THREE.MathUtils.clamp(pulsePressure / 260, 0.04, 0.16) : 0;

    updateHeartMaterials(scene, tintFactor, emissiveBoost);
  }, [diastolicBp, scene, systolicBp]);

  useFrame((state) => {
    if (heartRef.current) {
      const elapsed = state.clock.getElapsedTime();
      const beatDuration = 60 / heartRate;
      const phase = (elapsed % beatDuration) / beatDuration;
      const pulsePressure = Math.max(20, systolicBp - diastolicBp);

      let scale = 1;
      const contractionStrength = THREE.MathUtils.clamp(
        0.88 + (60 - ejectionFraction) / 220 + pulsePressure / 900,
        0.82,
        1.08
      );

      if (phase < 0.15) {
        scale = THREE.MathUtils.lerp(1, contractionStrength * 1.1, phase / 0.15);
      } else if (phase < 0.3) {
        scale = THREE.MathUtils.lerp(contractionStrength * 1.1, contractionStrength, (phase - 0.15) / 0.15);
      } else {
        scale = THREE.MathUtils.lerp(contractionStrength, 1, (phase - 0.3) / 0.7);
      }

      heartRef.current.scale.setScalar(scale);
    }
  });

  return <primitive ref={heartRef} object={scene} />;
};

export default function HeartViewer3D(props: HeartViewer3DProps) {
  return (
    <div className="w-full h-[500px] rounded-2xl bg-slate-900/50 backdrop-blur-md overflow-hidden border border-slate-800">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={1.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} />
        <pointLight position={[-10, -10, -10]} intensity={1} />
        <React.Suspense fallback={null}>
          <HeartModel {...props} />
          <Environment preset="city" />
        </React.Suspense>
        <OrbitControls enableDamping dampingFactor={0.07} minDistance={2} maxDistance={10} />
      </Canvas>
    </div>
  );
}

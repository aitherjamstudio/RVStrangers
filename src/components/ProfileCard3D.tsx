import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type SetupStage = 'box_closed' | 'box_opening' | 'card_ready' | 'card_flipping' | 'card_flipped';

interface ProfileCard3DProps {
  className?: string;
  stage: SetupStage;
  onBoxClick?: () => void;
  onCardClick?: () => void;
  onOpeningFinished?: () => void;
  onFlipFinished?: () => void;
}

export const ProfileCard3D: React.FC<ProfileCard3DProps> = ({
  className = 'w-full h-full',
  stage,
  onBoxClick,
  onCardClick,
  onOpeningFinished,
  onFlipFinished,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);

  // References to keep callbacks current in the Three.js animation loop
  const stageRef = useRef<SetupStage>(stage);
  stageRef.current = stage;

  const onBoxClickRef = useRef(onBoxClick);
  onBoxClickRef.current = onBoxClick;

  const onCardClickRef = useRef(onCardClick);
  onCardClickRef.current = onCardClick;

  const onOpeningFinishedRef = useRef(onOpeningFinished);
  onOpeningFinishedRef.current = onOpeningFinished;

  const onFlipFinishedRef = useRef(onFlipFinished);
  onFlipFinishedRef.current = onFlipFinished;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const rawBase = import.meta.env.BASE_URL || './';
    const baseUrl = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

    const boxModelUrl = `${baseUrl}3D/models/default_box.glb`;
    const boxTextureUrl = `${baseUrl}3D/textures/default_box_texture.webp`;
    const cardModelUrl = `${baseUrl}3D/models/card.glb`;
    const cardTextureUrl = `${baseUrl}3D/textures/Profile_Card.webp`;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 380;

    // Scene & Perspective Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.05, 10);
    // Camera placed at comfortable framing distance (0.44) so objects are not oversized or cropped
    camera.position.set(0, 0, 0.44);

    // High performance WebGL Renderer with alpha transparency for smooth neon blending
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // ==========================================
    // LIGHTING: Atmospheric Cyberpunk Rim Lighting
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(-0.8, 1.8, 2.5);
    scene.add(keyLight);

    const rightRimLight = new THREE.DirectionalLight(0xff2e93, 4.8);
    rightRimLight.position.set(2.5, 1.0, -0.6);
    scene.add(rightRimLight);

    const leftRimLight = new THREE.DirectionalLight(0xd946ef, 3.0);
    leftRimLight.position.set(-2.5, 0.8, -0.6);
    scene.add(leftRimLight);

    const topLight = new THREE.DirectionalLight(0xf43f8e, 3.5);
    topLight.position.set(0, 3.0, 0.2);
    scene.add(topLight);

    // Root Group
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // 1. Box Group
    const boxGroup = new THREE.Group();
    worldGroup.add(boxGroup);
    boxGroup.rotation.y = 0.24;
    boxGroup.rotation.x = 0.06;

    // Lid Hinge at top-back of box body: Y = 0.0707, Z = -0.0166
    const lidHingeGroup = new THREE.Group();
    lidHingeGroup.position.set(0, 0.0707, -0.0166);
    boxGroup.add(lidHingeGroup);

    // 2. Card Pivot Group (Starts concealed inside box cavity below the notch!)
    const cardPivotGroup = new THREE.Group();
    worldGroup.add(cardPivotGroup);
    // Initial hidden placement inside the box: Y = -0.020 (below top notch), Z = 0
    cardPivotGroup.position.set(0, -0.020, 0.0);
    cardPivotGroup.visible = false; // Hidden until lid opens to guarantee zero clipping!

    const gltfLoader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    let totalLoaded = 0;
    const notifyLoaded = () => {
      totalLoaded++;
      if (totalLoaded >= 2) {
        setIsAssetsLoaded(true);
      }
    };

    // Load Box Model & Texture
    gltfLoader.load(boxModelUrl, (gltf) => {
      const model = gltf.scene;
      let foundLid: THREE.Object3D | null = null;
      let foundBody: THREE.Object3D | null = null;

      model.traverse((child) => {
        if (child.name === 'Lid') foundLid = child;
        if (child.name === 'RV_Box_Body') foundBody = child;
      });

      textureLoader.load(boxTextureUrl, (boxTex) => {
        boxTex.colorSpace = THREE.SRGBColorSpace;
        boxTex.flipY = false;
        const boxMat = new THREE.MeshStandardMaterial({
          map: boxTex,
          roughness: 0.22,
          metalness: 0.06,
        });

        if (foundBody) {
          foundBody.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).material = boxMat;
          });
          boxGroup.add(foundBody);
        }

        if (foundLid) {
          foundLid.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).material = boxMat;
          });
          // Position relative to lid hinge origin (0, 0.0707, -0.0166)
          foundLid.position.set(0, -0.0707, 0.0166);
          lidHingeGroup.add(foundLid);
        }

        notifyLoaded();
      });
    });

    // Load Card Model & Texture
    gltfLoader.load(cardModelUrl, (gltf) => {
      const cardScene = gltf.scene;

      // Auto-center card mesh around (0, 0, 0)
      const b3 = new THREE.Box3().setFromObject(cardScene);
      const center = b3.getCenter(new THREE.Vector3());
      cardScene.position.set(-center.x, -center.y, -center.z);

      // Scale card slightly so it fits inside box cavity
      cardScene.scale.set(0.92, 0.92, 0.92);

      textureLoader.load(cardTextureUrl, (cardTex) => {
        cardTex.colorSpace = THREE.SRGBColorSpace;
        cardTex.flipY = false;
        const cardMat = new THREE.MeshStandardMaterial({
          map: cardTex,
          roughness: 0.22,
          metalness: 0.08,
          side: THREE.DoubleSide,
        });

        cardScene.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            (c as THREE.Mesh).material = cardMat;
          }
        });

        cardPivotGroup.add(cardScene);
        notifyLoaded();
      });
    });

    // Interaction Raycasting / Click Handler
    const handleTap = () => {
      const current = stageRef.current;
      if (current === 'box_closed') {
        onBoxClickRef.current?.();
      } else if (current === 'card_ready') {
        onCardClickRef.current?.();
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('click', handleTap);
    domEl.addEventListener('touchstart', handleTap, { passive: true });

    let openProgress = 0;
    let flipProgress = 0;
    let reqId: number;
    let clock = new THREE.Clock();

    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
    const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const currentStage = stageRef.current;

      // ------------------------------------------
      // 1. STAGE: BOX CLOSED (Interactive Idle Float)
      // ------------------------------------------
      if (currentStage === 'box_closed') {
        cardPivotGroup.visible = false;
        boxGroup.visible = true;
        camera.position.set(0, 0, 0.44);

        // Gentle floating and breathing light
        boxGroup.position.set(0, Math.sin(elapsed * 1.5) * 0.003, 0);
        boxGroup.rotation.y = 0.24 + Math.sin(elapsed * 0.8) * 0.04;
        boxGroup.rotation.x = 0.06 + Math.cos(elapsed * 0.6) * 0.015;
        lidHingeGroup.rotation.x = 0;

        // Subtle pulsing rim light
        rightRimLight.intensity = 4.8 + Math.sin(elapsed * 2.5) * 0.8;
        openProgress = 0;
        flipProgress = 0;
      }

      // ------------------------------------------
      // 2. STAGE: BOX OPENING & CARD EMERGENCE
      // ------------------------------------------
      if (currentStage === 'box_opening') {
        openProgress = Math.min(1, openProgress + delta * 0.62); // Smooth ~1.6s reveal
        const p = easeInOutCubic(openProgress);

        // Phase A: Lid rotates open (-95 deg)
        const lidP = Math.min(1, p * 1.5);
        lidHingeGroup.rotation.x = -Math.PI * 0.54 * easeOutCubic(lidP);

        // Phase B: Card becomes visible once lid cracks open
        if (p > 0.12) {
          cardPivotGroup.visible = true;
        }

        // Phase C: Card slides smoothly upward out of box (Y: -0.020 -> 0.076)
        if (p > 0.18) {
          const cardSlideP = Math.min(1, (p - 0.18) / 0.55);
          const easedSlide = easeOutCubic(cardSlideP);
          cardPivotGroup.position.y = -0.020 + easedSlide * 0.096; // Moves to 0.076
        }

        // Phase D: Card glides forward toward camera & reframes (Z: 0 -> 0.08)
        if (p > 0.45) {
          const forwardP = Math.min(1, (p - 0.45) / 0.55);
          const easedFwd = easeOutCubic(forwardP);
          cardPivotGroup.position.z = easedFwd * 0.08;
          boxGroup.position.z = -easedFwd * 0.04; // Box steps back into background
          camera.position.z = 0.44 - easedFwd * 0.06; // Camera tracks closer (0.38)
        }

        if (openProgress >= 1) {
          onOpeningFinishedRef.current?.();
        }
      }

      // ------------------------------------------
      // 3. STAGE: CARD READY (Hovering, Tap to Flip)
      // ------------------------------------------
      if (currentStage === 'card_ready') {
        boxGroup.visible = true;
        boxGroup.position.z = -0.04;
        lidHingeGroup.rotation.x = -Math.PI * 0.54;

        cardPivotGroup.visible = true;
        cardPivotGroup.position.y = 0.076 + Math.sin(elapsed * 2.0) * 0.0035;
        cardPivotGroup.position.z = 0.08;
        cardPivotGroup.rotation.y = Math.sin(elapsed * 1.2) * 0.07;
        camera.position.set(0, 0, 0.38);

        rightRimLight.intensity = 5.0 + Math.sin(elapsed * 3.0) * 0.6;
        flipProgress = 0;
      }

      // ------------------------------------------
      // 4. STAGE: CARD FLIPPING (Smooth 180° Flip)
      // ------------------------------------------
      if (currentStage === 'card_flipping') {
        flipProgress = Math.min(1, flipProgress + delta * 1.55); // ~0.65s flip
        const fP = easeInOutCubic(flipProgress);

        cardPivotGroup.rotation.y = fP * Math.PI; // 0 to 180 degrees
        cardPivotGroup.position.y = 0.076 + Math.sin(fP * Math.PI) * 0.015; // Realistic 3D lift during flip
        cardPivotGroup.position.z = 0.08 + Math.sin(fP * Math.PI) * 0.01;

        if (flipProgress >= 1) {
          onFlipFinishedRef.current?.();
        }
      }

      // ------------------------------------------
      // 5. STAGE: CARD FLIPPED (Form Active)
      // ------------------------------------------
      if (currentStage === 'card_flipped') {
        cardPivotGroup.rotation.y = Math.PI; // Strictly 180°
        cardPivotGroup.position.y = 0.076 + Math.sin(elapsed * 1.5) * 0.002;
        cardPivotGroup.position.z = 0.08;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('click', handleTap);
      domEl.removeEventListener('touchstart', handleTap);
      renderer.dispose();
      if (domEl.parentNode) domEl.parentNode.removeChild(domEl);
    };
  }, []);

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full flex items-center justify-center cursor-pointer" />

      {/* Brand Circle Loader while 3D assets load */}
      {!isAssetsLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#07000E] z-30 pointer-events-none">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute -inset-2 rounded-full bg-pink-500/30 blur-md pointer-events-none" />
            <div className="w-10 h-10 rounded-full border-[3px] border-fuchsia-500/20 border-t-[#FF2E93] border-r-[#D946EF] animate-spin shadow-[0_0_16px_rgba(255,46,147,0.6)]" />
          </div>
          <span className="text-xs font-bold text-pink-300 tracking-wide mt-3">Preparing 3D Deck...</span>
        </div>
      )}
    </div>
  );
};

export default ProfileCard3D;

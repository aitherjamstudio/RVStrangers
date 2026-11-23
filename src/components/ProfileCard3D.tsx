import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type ProfileStage = 'box_closed' | 'opening' | 'card_out' | 'flipping' | 'card_flipped';

interface ProfileCard3DProps {
  className?: string;
  stage: ProfileStage;
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

  // References to keep callbacks current in animation loop
  const stageRef = useRef<ProfileStage>(stage);
  stageRef.current = stage;

  const onOpeningFinishedRef = useRef(onOpeningFinished);
  onOpeningFinishedRef.current = onOpeningFinished;

  const onFlipFinishedRef = useRef(onFlipFinished);
  onFlipFinishedRef.current = onFlipFinished;

  const onBoxClickRef = useRef(onBoxClick);
  onBoxClickRef.current = onBoxClick;

  const onCardClickRef = useRef(onCardClick);
  onCardClickRef.current = onCardClick;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const rawBase = import.meta.env.BASE_URL || './';
    const baseUrl = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

    const boxModelUrl = `${baseUrl}3D/models/default_box.glb`;
    const boxTextureUrl = `${baseUrl}3D/textures/default_box_texture.webp`;
    const cardModelUrl = `${baseUrl}3D/models/card.glb`;
    const cardTextureUrl = `${baseUrl}3D/textures/Profile_Card.webp`;

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 420;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.05, 10);
    camera.position.set(0, 0, 0.27);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Ambient & Directional Lighting
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

    // Master World Group
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);
    worldGroup.rotation.y = 0.24; // Subtle 3D isometric turn
    worldGroup.rotation.x = 0.05;

    // Sub-groups
    const boxGroup = new THREE.Group();
    worldGroup.add(boxGroup);

    const lidHingeGroup = new THREE.Group();
    // Hinge line at top-back of box body: Y = 0.0707, Z = -0.0166
    lidHingeGroup.position.set(0, 0.0707, -0.0166);
    boxGroup.add(lidHingeGroup);

    const cardPivotGroup = new THREE.Group();
    worldGroup.add(cardPivotGroup);

    // Initial position of card (inside the box)
    cardPivotGroup.position.set(0, 0.005, 0.0);

    const gltfLoader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    let loadedItems = 0;

    const checkAllLoaded = () => {
      loadedItems++;
      if (loadedItems >= 2) {
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
          // Position lid relative to lidHingeGroup origin (0, 0.0707, -0.0166)
          foundLid.position.set(0, -0.0707, 0.0166);
          lidHingeGroup.add(foundLid);
        }

        checkAllLoaded();
      });
    });

    // Load Card Model & Texture
    gltfLoader.load(cardModelUrl, (gltf) => {
      const cardScene = gltf.scene;

      textureLoader.load(cardTextureUrl, (cardTex) => {
        cardTex.colorSpace = THREE.SRGBColorSpace;
        cardTex.flipY = false;
        const cardMat = new THREE.MeshStandardMaterial({
          map: cardTex,
          roughness: 0.25,
          metalness: 0.05,
          side: THREE.DoubleSide,
        });

        cardScene.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            (c as THREE.Mesh).material = cardMat;
          }
        });

        // Reset relative translation of card so it nests nicely inside cardPivotGroup
        cardScene.position.set(0, 0, 0);
        cardPivotGroup.add(cardScene);

        checkAllLoaded();
      });
    });

    // Raycaster for user taps on Box / Card
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      if (stageRef.current === 'box_closed') {
        const intersects = raycaster.intersectObjects([boxGroup, lidHingeGroup], true);
        if (intersects.length > 0 || true) {
          // Tapping anywhere on canvas in box_closed triggers box opening
          onBoxClickRef.current?.();
        }
      } else if (stageRef.current === 'card_out') {
        const intersects = raycaster.intersectObjects([cardPivotGroup], true);
        if (intersects.length > 0 || true) {
          // Tapping card in card_out triggers card flip
          onCardClickRef.current?.();
        }
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('click', handlePointerDown);
    domEl.addEventListener('touchstart', handlePointerDown, { passive: true });

    // Animation progress trackers
    let openProgress = 0; // 0 to 1
    let flipProgress = 0; // 0 to 1

    let reqId: number;
    let clock = new THREE.Clock();

    const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);
    const easeInOutQuad = (x: number): number => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      const currentStage = stageRef.current;

      // Gentle ambient floating
      if (currentStage === 'box_closed') {
        worldGroup.position.y = Math.sin(elapsed * 1.5) * 0.003;
        worldGroup.rotation.y = 0.24 + Math.sin(elapsed * 0.8) * 0.05;
      }

      // --- STAGE: OPENING SEQUENCE ---
      if (currentStage === 'opening') {
        openProgress = Math.min(1, openProgress + delta * 0.72); // ~1.4s duration
        const p = easeInOutQuad(openProgress);

        // Sub-phase 1: Camera zoom in (0 -> 0.35)
        if (p < 0.35) {
          const subP = p / 0.35;
          camera.position.z = 0.27 - subP * 0.07; // Zoom from 0.27 down to 0.20
          camera.position.y = subP * 0.02;
        } 
        // Sub-phase 2: Camera zooms back out (0.35 -> 1.0)
        else {
          const subP = (p - 0.35) / 0.65;
          camera.position.z = 0.20 + subP * 0.07; // Back to 0.27
          camera.position.y = 0.02 * (1 - subP);
        }

        // Sub-phase 2: Lid opens -90 deg (starts at 0.25 -> 0.75)
        if (p > 0.20) {
          const lidP = Math.min(1, (p - 0.20) / 0.55);
          lidHingeGroup.rotation.x = -Math.PI * 0.5 * easeOutCubic(lidP);
        }

        // Sub-phase 3: Card slides up & forward out of the box (0.45 -> 1.0)
        if (p > 0.40) {
          const cardP = (p - 0.40) / 0.60;
          const easedCard = easeOutCubic(cardP);
          // Y moves from 0.005 up to 0.072 (emerges from box)
          cardPivotGroup.position.y = 0.005 + easedCard * 0.067;
          // Z moves forward from 0 to 0.038
          cardPivotGroup.position.z = easedCard * 0.038;
          // Subtle tilt as it floats out
          cardPivotGroup.rotation.x = -0.05 * easedCard;
        }

        if (openProgress >= 1) {
          onOpeningFinishedRef.current?.();
        }
      }

      // --- STAGE: CARD OUT (Hovering & Floating) ---
      if (currentStage === 'card_out') {
        lidHingeGroup.rotation.x = -Math.PI * 0.5;
        cardPivotGroup.position.y = 0.072 + Math.sin(elapsed * 2.0) * 0.003;
        cardPivotGroup.position.z = 0.038;
        cardPivotGroup.rotation.y = Math.sin(elapsed * 1.2) * 0.08;
      }

      // --- STAGE: FLIPPING (Card 180 deg) ---
      if (currentStage === 'flipping') {
        flipProgress = Math.min(1, flipProgress + delta * 1.8); // ~0.55s flip
        const fP = easeInOutQuad(flipProgress);

        cardPivotGroup.rotation.y = fP * Math.PI; // 0 to 180 degrees
        cardPivotGroup.position.y = 0.072 + Math.sin(fP * Math.PI) * 0.015; // Gentle lift during flip
        cardPivotGroup.position.z = 0.038 + Math.sin(fP * Math.PI) * 0.01;

        if (flipProgress >= 1) {
          onFlipFinishedRef.current?.();
        }
      }

      // --- STAGE: CARD FLIPPED (Form Active) ---
      if (currentStage === 'card_flipped') {
        cardPivotGroup.rotation.y = Math.PI; // Strictly 180 degrees
        cardPivotGroup.position.y = 0.072 + Math.sin(elapsed * 1.5) * 0.002;
        cardPivotGroup.position.z = 0.038;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
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
      domEl.removeEventListener('click', handlePointerDown);
      domEl.removeEventListener('touchstart', handlePointerDown);
      renderer.dispose();
      if (domEl.parentNode) domEl.parentNode.removeChild(domEl);
    };
  }, []);

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* 3D Canvas Mounting Point */}
      <div ref={mountRef} className="w-full h-full flex items-center justify-center cursor-pointer" />

      {/* Brand Circle Loader while 3D assets load */}
      {!isAssetsLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#07000E] z-30 pointer-events-none">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute -inset-2 rounded-full bg-pink-500/30 blur-md pointer-events-none" />
            <div className="w-10 h-10 rounded-full border-[3px] border-fuchsia-500/20 border-t-[#FF2E93] border-r-[#D946EF] animate-spin shadow-[0_0_16px_rgba(255,46,147,0.6)]" />
          </div>
          <span className="text-xs font-bold text-pink-300 tracking-wide mt-3">Preparing Deck & Card...</span>
        </div>
      )}
    </div>
  );
};

export default ProfileCard3D;

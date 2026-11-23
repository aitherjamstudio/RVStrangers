import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type SetupStage = 'box_closed' | 'box_opening' | 'card_ready' | 'card_flipping' | 'card_flipped';

interface ProfileCard3DProps {
  className?: string;
  stage: SetupStage;
  selectedAvatar?: string;
  displayName?: string;
  handle?: string;
  selectedMood?: string;
  onBoxClick?: () => void;
  onCardClick?: () => void;
  onOpeningFinished?: () => void;
  onFlipFinished?: () => void;
}

// Generates a 2x retina CanvasTexture of the Player Identity Card matching the HTML form exactly
function createIdentityCardTexture(params: {
  avatar: string;
  displayName: string;
  handle: string;
  mood: string;
}): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 660;
  canvas.height = 960;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 660, 960);

  const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  };

  // 1. Base Card Surface (#1a052b) with Glowing Neon Border
  ctx.save();
  ctx.shadowColor = 'rgba(255, 46, 147, 0.7)';
  ctx.shadowBlur = 28;
  ctx.strokeStyle = '#FF2E93';
  ctx.lineWidth = 6;
  ctx.fillStyle = '#1a052b';
  drawRoundRect(14, 14, 632, 932, 44);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 2. Card Header Strip
  // Pink dot
  ctx.fillStyle = '#FF2E93';
  ctx.beginPath();
  ctx.arc(46, 62, 6, 0, Math.PI * 2);
  ctx.fill();

  // Header Title
  ctx.font = 'bold 21px sans-serif';
  ctx.fillStyle = '#F472B6';
  ctx.fillText('PLAYER IDENTITY CARD', 64, 70);

  // Header Badge: #001 • GENESIS
  drawRoundRect(436, 44, 178, 36, 18);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#E9D5FF';
  ctx.fillText('#001 • GENESIS', 458, 68);

  // Divider line
  ctx.strokeStyle = 'rgba(255, 46, 147, 0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(34, 100);
  ctx.lineTo(626, 100);
  ctx.stroke();

  // 3. Avatar Section
  ctx.font = 'bold 19px sans-serif';
  ctx.fillStyle = 'rgba(244, 114, 182, 0.95)';
  ctx.fillText('Choose Avatar Symbol', 42, 136);

  // Glowing Avatar Emblem Portal
  ctx.save();
  ctx.shadowColor = 'rgba(255, 46, 147, 0.8)';
  ctx.shadowBlur = 24;
  ctx.strokeStyle = 'rgba(255, 46, 147, 0.9)';
  ctx.lineWidth = 4;
  ctx.fillStyle = '#1a052b';
  drawRoundRect(265, 148, 130, 130, 26);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Avatar Emoji
  ctx.font = '64px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(params.avatar || '💜', 330, 238);

  // Avatar Icons Row (💜, 🃏, ⚡, 👑, ⭐, 🎭)
  const avatars = ['💜', '🃏', '⚡', '👑', '⭐', '🎭'];
  const startX = 66;
  const gap = 90;
  avatars.forEach((av, idx) => {
    const x = startX + idx * gap;
    const y = 300;
    const isSel = av === params.avatar;

    drawRoundRect(x, y, 62, 62, 16);
    if (isSel) {
      ctx.fillStyle = 'rgba(255, 46, 147, 0.3)';
      ctx.fill();
      ctx.strokeStyle = '#FF2E93';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 46, 147, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(av, x + 31, y + 42);
  });

  // 4. Input Fields
  ctx.textAlign = 'left';

  // Field A: Display Name
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = 'rgba(244, 114, 182, 0.9)';
  ctx.fillText('DISPLAY NAME', 42, 404);

  drawRoundRect(38, 418, 584, 66, 20);
  ctx.fillStyle = 'rgba(19, 3, 34, 0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 46, 147, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(params.displayName || 'John Don', 96, 460);
  ctx.fillStyle = '#F472B6';
  ctx.font = '20px sans-serif';
  ctx.fillText('👤', 58, 459);

  // Field B: Player Tag
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = 'rgba(244, 114, 182, 0.9)';
  ctx.fillText('PLAYER TAG', 42, 524);

  drawRoundRect(38, 538, 584, 66, 20);
  ctx.fillStyle = 'rgba(19, 3, 34, 0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 46, 147, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(params.handle || '@samplemail1247', 96, 580);
  ctx.fillStyle = '#F472B6';
  ctx.font = '20px sans-serif';
  ctx.fillText('@', 60, 579);

  // Field C: Conversation Vibe
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = 'rgba(244, 114, 182, 0.9)';
  ctx.fillText('CONVERSATION VIBE', 42, 644);

  drawRoundRect(38, 658, 584, 66, 20);
  ctx.fillStyle = '#1a052b';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 46, 147, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#F3E8FF';
  ctx.fillText(params.mood || 'Here for deep conversations', 96, 699);
  ctx.fillStyle = '#F472B6';
  ctx.font = '20px sans-serif';
  ctx.fillText('💬', 58, 698);
  ctx.fillText('▼', 584, 698);

  // 5. Action Button
  const btnGrad = ctx.createLinearGradient(38, 768, 622, 768);
  btnGrad.addColorStop(0, '#FF2E93');
  btnGrad.addColorStop(0.5, '#D946EF');
  btnGrad.addColorStop(1, '#8B5CF6');

  ctx.save();
  ctx.shadowColor = 'rgba(255, 46, 147, 0.6)';
  ctx.shadowBlur = 28;
  drawRoundRect(38, 768, 584, 84, 26);
  ctx.fillStyle = btnGrad;
  ctx.fill();
  ctx.restore();

  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText('✓  Save Identity & Enter', 330, 820);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const ProfileCard3D: React.FC<ProfileCard3DProps> = ({
  className = 'w-full h-full',
  stage,
  selectedAvatar = '💜',
  displayName = 'John Don',
  handle = '@samplemail1247',
  selectedMood = 'Here for deep conversations',
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

  const selectedAvatarRef = useRef(selectedAvatar);
  selectedAvatarRef.current = selectedAvatar;

  const displayNameRef = useRef(displayName);
  displayNameRef.current = displayName;

  const handleRef = useRef(handle);
  handleRef.current = handle;

  const selectedMoodRef = useRef(selectedMood);
  selectedMoodRef.current = selectedMood;

  const backMeshRef = useRef<THREE.Mesh | null>(null);

  const onBoxClickRef = useRef(onBoxClick);
  onBoxClickRef.current = onBoxClick;

  const onCardClickRef = useRef(onCardClick);
  onCardClickRef.current = onCardClick;

  const onOpeningFinishedRef = useRef(onOpeningFinished);
  onOpeningFinishedRef.current = onOpeningFinished;

  const onFlipFinishedRef = useRef(onFlipFinished);
  onFlipFinishedRef.current = onFlipFinished;

  // Dynamically update the back texture whenever profile values change
  useEffect(() => {
    if (backMeshRef.current) {
      const newTex = createIdentityCardTexture({
        avatar: selectedAvatar || '💜',
        displayName: displayName || 'John Don',
        handle: handle || '@samplemail1247',
        mood: selectedMood || 'Here for deep conversations',
      });
      const mat = backMeshRef.current.material as THREE.MeshStandardMaterial;
      if (mat.map) mat.map.dispose();
      mat.map = newTex;
      mat.needsUpdate = true;
    }
  }, [selectedAvatar, displayName, handle, selectedMood]);

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
    const height = container.clientHeight || 420;

    // Scene & Perspective Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.05, 10);
    // Camera placed at comfortable framing distance (0.44) with ample headroom
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

    // Root World Group
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // 1. Box Group (positioned lower in the viewport for comfortable margins)
    const boxGroup = new THREE.Group();
    worldGroup.add(boxGroup);
    boxGroup.position.set(0, -0.040, 0);
    boxGroup.rotation.y = 0.24;
    boxGroup.rotation.x = 0.06;

    // Lid Hinge at top-back of box body: Y = 0.0707, Z = -0.0166
    const lidHingeGroup = new THREE.Group();
    lidHingeGroup.position.set(0, 0.0707, -0.0166);
    boxGroup.add(lidHingeGroup);

    // 2. Card Pivot Group (Starts concealed inside box cavity below the notch!)
    const cardPivotGroup = new THREE.Group();
    worldGroup.add(cardPivotGroup);
    cardPivotGroup.position.set(0, -0.060, 0.0);
    cardPivotGroup.visible = false; // Hidden while closed to guarantee zero notch clipping!

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

      // Scale card slightly so it nests inside box cavity
      cardScene.scale.set(0.92, 0.92, 0.92);

      textureLoader.load(cardTextureUrl, (cardTex) => {
        cardTex.colorSpace = THREE.SRGBColorSpace;
        cardTex.flipY = false;
        const cardMat = new THREE.MeshStandardMaterial({
          map: cardTex,
          roughness: 0.22,
          metalness: 0.08,
          side: THREE.FrontSide, // Front side renders the conversation card artwork
        });

        cardScene.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            (c as THREE.Mesh).material = cardMat;
          }
        });

        cardPivotGroup.add(cardScene);

        // ATTACH THE PLAYER IDENTITY CARD DIRECTLY ONTO THE OTHER SIDE OF THE CARD SURFACE
        const identityTex = createIdentityCardTexture({
          avatar: selectedAvatarRef.current || '💜',
          displayName: displayNameRef.current || 'John Don',
          handle: handleRef.current || '@samplemail1247',
          mood: selectedMoodRef.current || 'Here for deep conversations',
        });

        const backGeo = new THREE.PlaneGeometry(0.0792, 0.1180);
        const backMat = new THREE.MeshStandardMaterial({
          map: identityTex,
          roughness: 0.22,
          metalness: 0.08,
          side: THREE.FrontSide,
          transparent: true,
        });

        const backMesh = new THREE.Mesh(backGeo, backMat);
        // Positioned flush on the back surface of card.glb
        backMesh.position.set(0, 0, -0.00115);
        backMesh.rotation.set(0, Math.PI, 0); // Flipped 180° to face backward
        cardPivotGroup.add(backMesh);
        backMeshRef.current = backMesh;

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

        // Gentle floating and breathing light - positioned comfortably in lower-center view
        boxGroup.position.set(0, -0.040 + Math.sin(elapsed * 1.5) * 0.003, 0);
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
        openProgress = Math.min(1, openProgress + delta * 0.60); // Smooth ~1.65s reveal
        const p = easeInOutCubic(openProgress);

        // Phase A: Lid rotates open (-95 deg)
        const lidP = Math.min(1, p * 1.45);
        lidHingeGroup.rotation.x = -Math.PI * 0.54 * easeOutCubic(lidP);

        // Phase B: Card becomes visible once lid cracks open
        if (p > 0.12) {
          cardPivotGroup.visible = true;
        }

        // Phase C: Card slides smoothly upward out of box (Y: -0.060 -> 0.012)
        if (p > 0.18) {
          const cardSlideP = Math.min(1, (p - 0.18) / 0.55);
          const easedSlide = easeOutCubic(cardSlideP);
          cardPivotGroup.position.y = -0.060 + easedSlide * 0.072; // Sits at 0.012 (plenty of headroom)
        }

        // Phase D: Card glides forward toward camera & box steps down and back
        if (p > 0.45) {
          const forwardP = Math.min(1, (p - 0.45) / 0.55);
          const easedFwd = easeOutCubic(forwardP);
          cardPivotGroup.position.z = easedFwd * 0.085;
          boxGroup.position.y = -0.040 - easedFwd * 0.035; // Steps down to -0.075
          boxGroup.position.z = -easedFwd * 0.05; // Box steps back into background
          camera.position.z = 0.44;
        }

        if (openProgress >= 1) {
          onOpeningFinishedRef.current?.();
        }
      }

      // ------------------------------------------
      // 3. STAGE: CARD READY (Hovering, Tap to Flip & Zoom)
      // ------------------------------------------
      if (currentStage === 'card_ready') {
        boxGroup.visible = true;
        boxGroup.position.set(0, -0.075, -0.05);
        lidHingeGroup.rotation.x = -Math.PI * 0.54;

        cardPivotGroup.visible = true;
        cardPivotGroup.position.y = 0.012 + Math.sin(elapsed * 2.0) * 0.0025;
        cardPivotGroup.position.z = 0.085;
        cardPivotGroup.rotation.y = Math.sin(elapsed * 1.2) * 0.07;
        camera.position.set(0, 0, 0.44);

        rightRimLight.intensity = 5.0 + Math.sin(elapsed * 3.0) * 0.6;
        flipProgress = 0;
      }

      // ------------------------------------------
      // 4. STAGE: CARD FLIPPING & ZOOMING IN
      // ------------------------------------------
      if (currentStage === 'card_flipping') {
        flipProgress = Math.min(1, flipProgress + delta * 1.20); // ~0.82s cinematic flip & zoom
        const fP = easeInOutCubic(flipProgress);

        // 180° smooth spin
        cardPivotGroup.rotation.y = fP * Math.PI;

        // Smooth ZOOM IN towards camera (Z: 0.085 -> 0.200)
        cardPivotGroup.position.z = 0.085 + fP * 0.115 + Math.sin(fP * Math.PI) * 0.012;

        // Centered elevation
        cardPivotGroup.position.y = 0.012 * (1 - fP);

        // Box dramatically recedes back into depth
        boxGroup.position.z = -0.05 - fP * 0.12;
        boxGroup.position.y = -0.075 - fP * 0.04;

        if (flipProgress >= 1) {
          onFlipFinishedRef.current?.();
        }
      }

      // ------------------------------------------
      // 5. STAGE: CARD FLIPPED (Zoomed In, Active)
      // ------------------------------------------
      if (currentStage === 'card_flipped') {
        cardPivotGroup.rotation.y = Math.PI; // Strictly 180°
        cardPivotGroup.position.set(0, Math.sin(elapsed * 1.5) * 0.0015, 0.200);
        camera.position.set(0, 0, 0.44);
        boxGroup.visible = false; // Hide background box so card has 100% focus
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

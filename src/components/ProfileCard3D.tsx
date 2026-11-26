import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DEFAULT_AVATAR_PATH, resolveAvatarUrl } from '../utils/avatars';

export type SetupStage = 'box_closed' | 'box_opening' | 'card_ready' | 'card_flipping' | 'card_flipped';

interface ProfileCard3DProps {
  className?: string;
  stage: SetupStage;
  selectedAvatar?: string;
  displayName?: string;
  handle?: string;
  gender?: string;
  bio?: string;
  country?: string;
  languages?: string[];
  interests?: string[];
  onBoxClick?: () => void;
  onCardClick?: () => void;
  onOpeningFinished?: () => void;
  onFlipFinished?: () => void;
}

// Generates a 2x retina CanvasTexture of the ornate Identity Card matching the HTML prototype
function createIdentityCardTexture(params: {
  avatar: string;
  displayName: string;
  handle: string;
  gender: string;
  bio: string;
  country: string;
  languages: string[];
  interests: string[];
  avatarImg?: HTMLImageElement | null;
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

  // 1. Base Card Surface (#1a052b) with Ornate Glowing Neon Border
  ctx.save();
  ctx.shadowColor = 'rgba(255, 46, 147, 0.75)';
  ctx.shadowBlur = 32;
  ctx.strokeStyle = '#FF2E93';
  ctx.lineWidth = 5;
  ctx.fillStyle = '#1a052b';
  drawRoundRect(16, 22, 628, 916, 48);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Inner crystalline bevel line
  ctx.strokeStyle = 'rgba(216, 180, 254, 0.2)';
  ctx.lineWidth = 2;
  drawRoundRect(26, 32, 608, 896, 40);
  ctx.stroke();

  // Top & Bottom Diamond Crests
  const drawDiamond = (cx: number, cy: number) => {
    ctx.save();
    ctx.shadowColor = '#FF2E93';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#FF2E93';
    ctx.strokeStyle = '#FCE7F3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 18);
    ctx.lineTo(cx + 15, cy);
    ctx.lineTo(cx, cy + 18);
    ctx.lineTo(cx - 15, cy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };
  drawDiamond(330, 22);
  drawDiamond(330, 938);

  // 2. Subtle Orbital Glow behind Circular Avatar
  const radial = ctx.createRadialGradient(330, 150, 20, 330, 150, 140);
  radial.addColorStop(0, 'rgba(255, 46, 147, 0.35)');
  radial.addColorStop(1, 'rgba(26, 5, 43, 0)');
  ctx.fillStyle = radial;
  ctx.fillRect(140, 40, 380, 220);

  // 3. Circular Avatar Portal
  const cx = 330;
  const cy = 152;
  const r = 82;

  ctx.save();
  ctx.shadowColor = 'rgba(255, 46, 147, 0.85)';
  ctx.shadowBlur = 26;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.strokeStyle = '#FF2E93';
  ctx.lineWidth = 5;
  ctx.fillStyle = '#130322';
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  if (params.avatarImg && params.avatarImg.complete && params.avatarImg.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(params.avatarImg, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
  }

  // Edit pencil badge at bottom-right of avatar circle
  ctx.save();
  ctx.fillStyle = '#3A105C';
  ctx.strokeStyle = '#FF2E93';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx + 58, cy + 56, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✎', cx + 58, cy + 62);
  ctx.restore();

  // 4. Form Fields
  ctx.textAlign = 'left';

  // Row 1: Nickname + Gender
  drawRoundRect(42, 266, 356, 76, 20);
  ctx.fillStyle = 'rgba(19, 3, 34, 0.78)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.28)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '17px sans-serif';
  ctx.fillStyle = 'rgba(216, 180, 254, 0.72)';
  ctx.fillText('Nickname', 86, 294);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText((params.displayName || 'John Don').slice(0, 18), 86, 326);

  drawRoundRect(410, 266, 208, 76, 20);
  ctx.fillStyle = 'rgba(19, 3, 34, 0.78)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.28)';
  ctx.stroke();
  ctx.font = 'bold 21px sans-serif';
  ctx.fillStyle = '#F3E8FF';
  const genderLabel =
    params.gender && params.gender !== 'unspecified'
      ? params.gender.charAt(0).toUpperCase() + params.gender.slice(1)
      : 'Gender';
  ctx.fillText(genderLabel.slice(0, 10), 438, 312);

  // Row 2: Username
  drawRoundRect(42, 358, 576, 76, 20);
  ctx.fillStyle = 'rgba(19, 3, 34, 0.78)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.28)';
  ctx.stroke();

  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#F472B6';
  ctx.fillText('@', 58, 405);
  ctx.font = '17px sans-serif';
  ctx.fillStyle = 'rgba(216, 180, 254, 0.72)';
  ctx.fillText('Username', 92, 386);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText((params.handle || 'stranger').replace(/^@+/, '').slice(0, 22), 92, 418);
  ctx.fillStyle = '#34D399';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('✓', 580, 405);

  // Row 3: Bio
  drawRoundRect(42, 450, 576, 128, 20);
  ctx.fillStyle = 'rgba(19, 3, 34, 0.78)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.28)';
  ctx.stroke();

  ctx.font = '17px sans-serif';
  ctx.fillStyle = 'rgba(216, 180, 254, 0.72)';
  ctx.fillText('Bio', 86, 480);
  ctx.font = '600 20px sans-serif';
  ctx.fillStyle = '#F5F3FF';
  const bioStr = params.bio || 'Here for deep conversations and interesting people.';
  const words = bioStr.split(' ');
  let line1 = '';
  let line2 = '';
  for (const w of words) {
    if ((line1 + ' ' + w).trim().length <= 36 && !line2) {
      line1 = (line1 + ' ' + w).trim();
    } else if ((line2 + ' ' + w).trim().length <= 36) {
      line2 = (line2 + ' ' + w).trim();
    }
  }
  ctx.fillText(line1, 86, 514);
  if (line2) {
    ctx.fillText(line2, 86, 542);
  }
  ctx.font = '16px sans-serif';
  ctx.fillStyle = 'rgba(216, 180, 254, 0.6)';
  ctx.textAlign = 'right';
  ctx.fillText(`${bioStr.length} / 120`, 600, 562);
  ctx.textAlign = 'left';

  // Row 4: Country + Matchmaking Languages
  drawRoundRect(42, 594, 282, 76, 20);
  ctx.fillStyle = 'rgba(19, 3, 34, 0.78)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.28)';
  ctx.stroke();

  ctx.font = '17px sans-serif';
  ctx.fillStyle = 'rgba(216, 180, 254, 0.72)';
  ctx.fillText('Country', 74, 622);
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText((params.country || 'Select').slice(0, 14), 74, 654);

  drawRoundRect(336, 594, 282, 76, 20);
  ctx.fillStyle = 'rgba(19, 3, 34, 0.78)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.28)';
  ctx.stroke();

  ctx.font = '17px sans-serif';
  ctx.fillStyle = 'rgba(216, 180, 254, 0.72)';
  ctx.fillText('Match Languages', 368, 622);
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  const langs = params.languages && params.languages.length > 0 ? params.languages : ['English'];
  const langLabel = langs.length > 1 ? `${langs[0].slice(0, 9)} +${langs.length - 1}` : langs[0].slice(0, 14);
  ctx.fillText(langLabel, 368, 654);

  // Row 5: Interests (up to 6)
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Interests', 52, 710);
  ctx.font = '17px sans-serif';
  ctx.fillStyle = 'rgba(216, 180, 254, 0.72)';
  ctx.fillText('(up to 6)', 148, 710);

  const tags = ['Games', 'Music', 'Psychology', 'Movies', 'Travel', 'Food'];
  tags.forEach((tag, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const px = 42 + col * 195;
    const py = 732 + row * 68;
    const active = params.interests.includes(tag);

    drawRoundRect(px, py, 182, 54, 27);
    if (active) {
      const grad = ctx.createLinearGradient(px, py, px + 182, py);
      grad.addColorStop(0, '#FF2E93');
      grad.addColorStop(1, '#C026D3');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 207, 232, 0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(19, 3, 34, 0.65)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.28)';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    ctx.font = 'bold 19px sans-serif';
    ctx.fillStyle = active ? '#FFFFFF' : '#E9D5FF';
    ctx.textAlign = 'center';
    ctx.fillText(active ? `✓ ${tag}` : tag, px + 91, py + 34);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const ProfileCard3D: React.FC<ProfileCard3DProps> = ({
  className = 'w-full h-full',
  stage,
  selectedAvatar = DEFAULT_AVATAR_PATH,
  displayName = 'John Don',
  handle = 'johndon1247',
  gender = 'unspecified',
  bio = 'Here for deep conversations and interesting people.',
  country = '',
  languages = ['English'],
  interests = ['Games', 'Music', 'Psychology'],
  onBoxClick,
  onCardClick,
  onOpeningFinished,
  onFlipFinished,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);

  // References to keep values current in the Three.js animation loop & async loaders
  const stageRef = useRef<SetupStage>(stage);
  stageRef.current = stage;

  const profileDataRef = useRef({
    avatar: selectedAvatar,
    displayName,
    handle,
    gender,
    bio,
    country,
    languages,
    interests,
  });
  profileDataRef.current = {
    avatar: selectedAvatar,
    displayName,
    handle,
    gender,
    bio,
    country,
    languages,
    interests,
  };

  const backMeshRef = useRef<THREE.Mesh | null>(null);
  const avatarImgRef = useRef<HTMLImageElement | null>(null);

  const onBoxClickRef = useRef(onBoxClick);
  onBoxClickRef.current = onBoxClick;

  const onCardClickRef = useRef(onCardClick);
  onCardClickRef.current = onCardClick;

  const onOpeningFinishedRef = useRef(onOpeningFinished);
  onOpeningFinishedRef.current = onOpeningFinished;

  const onFlipFinishedRef = useRef(onFlipFinished);
  onFlipFinishedRef.current = onFlipFinished;

  const applyBackTexture = () => {
    if (!backMeshRef.current) return;
    const p = profileDataRef.current;
    const newTex = createIdentityCardTexture({
      avatar: p.avatar || DEFAULT_AVATAR_PATH,
      displayName: p.displayName || 'John Don',
      handle: p.handle || 'johndon1247',
      gender: p.gender || 'unspecified',
      bio: p.bio || '',
      country: p.country || '',
      languages: p.languages || ['English'],
      interests: p.interests || [],
      avatarImg: avatarImgRef.current,
    });
    const mat = backMeshRef.current.material as THREE.MeshStandardMaterial;
    if (mat.map) mat.map.dispose();
    mat.map = newTex;
    mat.needsUpdate = true;
  };

  // Load avatar image & refresh back texture whenever profile values change
  useEffect(() => {
    let cancelled = false;
    const resolvedUrl = resolveAvatarUrl(selectedAvatar);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      avatarImgRef.current = img;
      applyBackTexture();
    };
    img.src = resolvedUrl;
    applyBackTexture();
    return () => {
      cancelled = true;
    };
  }, [selectedAvatar, displayName, handle, gender, bio, country, languages, interests]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const rawBase = import.meta.env.BASE_URL || './';
    const baseUrl = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

    const boxModelUrl = `${baseUrl}3D/models/box_with_texture.glb`;
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

    // Load Box Model (with embedded texture from box_with_texture.glb)
    gltfLoader.load(boxModelUrl, (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat && mat.isMeshStandardMaterial) {
            mat.roughness = 0.25;
            mat.metalness = 0.05;
          }
        }
      });

      const foundBody = model.getObjectByName('RV_Box_Body');
      const foundLid = model.getObjectByName('Lid');

      if (foundBody) {
        boxGroup.add(foundBody);
      }

      if (foundLid) {
        // Position relative to lid hinge origin (0, 0.0707, -0.0166)
        foundLid.position.set(0, -0.0707, 0.0166);
        lidHingeGroup.add(foundLid);
      }

      notifyLoaded();
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
        const p = profileDataRef.current;
        const identityTex = createIdentityCardTexture({
          avatar: p.avatar || DEFAULT_AVATAR_PATH,
          displayName: p.displayName || 'John Don',
          handle: p.handle || 'johndon1247',
          gender: p.gender || 'unspecified',
          bio: p.bio || '',
          country: p.country || '',
          languages: p.languages || ['English'],
          interests: p.interests || [],
          avatarImg: avatarImgRef.current,
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

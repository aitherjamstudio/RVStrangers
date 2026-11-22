import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface DeckBox3DProps {
  className?: string;
  textureUrl?: string;
  modelUrl?: string;
  autoRotate?: boolean;
  interactive?: boolean;
}

export const DeckBox3D: React.FC<DeckBox3DProps> = ({
  className = 'w-full h-full',
  textureUrl,
  modelUrl,
  autoRotate = true,
  interactive = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Resolve base paths
    const rawBase = import.meta.env.BASE_URL || './';
    const baseUrl = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
    
    // Default model and texture URLs
    const defaultModelPath = `${baseUrl}3D/models/default_box.glb`;
    const defaultLocalTexturePath = `${baseUrl}3D/textures/default_box_texture.webp`;
    const defaultR2TexturePath = 'https://worker.aitherjamstudio.workers.dev/api/assets/textures/default_box_texture.webp';
    
    const resolvedModelUrl = modelUrl || defaultModelPath;
    const resolvedTextureUrl = textureUrl || defaultLocalTexturePath;

    // Dimensions
    let width = container.clientWidth || 140;
    let height = container.clientHeight || 140;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.05, 10);
    camera.position.set(0, 0, 0.24);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Lighting Setup tuned for Cyberpunk / Purple Neon Card Game aesthetic
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    // Key Light (crisp front illumination to showcase artwork and text)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(0.6, 1.8, 2.4);
    scene.add(keyLight);

    // Rim Accent Light (vibrant magenta edge highlight on spine and corners)
    const rimLight = new THREE.DirectionalLight(0xf43f8e, 2.2);
    rimLight.position.set(-2.0, 1.2, -1.0);
    scene.add(rimLight);

    // Fill Light (electric purple from bottom-left)
    const fillLight = new THREE.DirectionalLight(0xa855f7, 1.4);
    fillLight.position.set(-1.0, -1.8, 1.2);
    scene.add(fillLight);

    // Top Rim Light (golden-pink shimmer on the lid)
    const topLight = new THREE.DirectionalLight(0xf472b6, 1.6);
    topLight.position.set(0, 2.5, 0.5);
    scene.add(topLight);

    // Root Pivot Group for transformations
    const pivotGroup = new THREE.Group();
    scene.add(pivotGroup);

    // Default hero orientation:
    // Front face clearly visible with slight 3/4 turn to reveal spine and top lid
    const defaultRotX = 0.10;
    const defaultRotY = -0.32;
    const defaultRotZ = 0.0;

    pivotGroup.rotation.x = defaultRotX;
    pivotGroup.rotation.y = defaultRotY;
    pivotGroup.rotation.z = defaultRotZ;

    let modelScene: THREE.Group | null = null;
    let boxMaterial: THREE.MeshStandardMaterial | null = null;
    let loadedTexture: THREE.Texture | null = null;
    let animFrameId: number;

    // Interaction State
    let isDragging = false;
    let previousPointerX = 0;
    let previousPointerY = 0;
    let currentRotX = defaultRotX;
    let userRotOffset = 0;
    let dragVelocityX = 0;
    let dragVelocityY = 0;
    let lastInteractTime = 0;

    // Load Texture
    const textureLoader = new THREE.TextureLoader();

    const applyTextureToModel = (tex: THREE.Texture, model: THREE.Group) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = false; // Essential for glTF UV mapping from Blender
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;

      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.28,
        metalness: 0.06,
      });
      boxMaterial = mat;

      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.material = mat;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
    };

    const loadTextureWithFallback = (primaryUrl: string, fallbackUrl?: string) => {
      textureLoader.load(
        primaryUrl,
        (tex) => {
          loadedTexture = tex;
          if (modelScene) {
            applyTextureToModel(tex, modelScene);
          }
        },
        undefined,
        (err) => {
          console.warn(`Failed to load texture from ${primaryUrl}, trying fallback:`, err);
          if (fallbackUrl && fallbackUrl !== primaryUrl) {
            textureLoader.load(fallbackUrl, (tex) => {
              loadedTexture = tex;
              if (modelScene) {
                applyTextureToModel(tex, modelScene);
              }
            });
          }
        }
      );
    };

    // Load GLTF Model
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      resolvedModelUrl,
      (gltf) => {
        modelScene = gltf.scene;

        // Auto-center the model geometry around (0, 0, 0)
        const box = new THREE.Box3().setFromObject(modelScene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        modelScene.position.set(-center.x, -center.y, -center.z);
        pivotGroup.add(modelScene);

        // Adjust camera distance to frame the box prominently (~78% of view)
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const cameraDistance = (maxDim / 2) / Math.tan(fov / 2) * 1.18;
        camera.position.z = Math.max(cameraDistance, 0.21);
        camera.lookAt(0, 0, 0);

        // Load and apply texture
        loadTextureWithFallback(resolvedTextureUrl, defaultR2TexturePath);

        setIsLoading(false);
      },
      undefined,
      (err) => {
        console.error('Failed to load Deck Box 3D model:', err);
        setLoadError('Failed to load 3D model');
        setIsLoading(false);
      }
    );

    // Pointer / Touch Event Handlers
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      previousPointerX = clientX;
      previousPointerY = clientY;
      dragVelocityX = 0;
      dragVelocityY = 0;
      lastInteractTime = performance.now();
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !interactive) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - previousPointerX;
      const deltaY = clientY - previousPointerY;

      dragVelocityX = deltaX * 0.012;
      dragVelocityY = deltaY * 0.012;

      userRotOffset += dragVelocityX;
      currentRotX = Math.max(-Math.PI * 0.35, Math.min(Math.PI * 0.35, currentRotX + dragVelocityY));

      previousPointerX = clientX;
      previousPointerY = clientY;
      lastInteractTime = performance.now();
    };

    const onPointerUp = () => {
      isDragging = false;
      lastInteractTime = performance.now();
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    domEl.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      if (isDragging) {
        // While user is actively dragging
        pivotGroup.rotation.y = defaultRotY + userRotOffset;
        pivotGroup.rotation.x = currentRotX;
      } else {
        // Apply inertia drag falloff
        dragVelocityX *= 0.92;
        dragVelocityY *= 0.92;
        userRotOffset += dragVelocityX;
        currentRotX = Math.max(-Math.PI * 0.35, Math.min(Math.PI * 0.35, currentRotX + dragVelocityY));

        const timeSinceInteract = (performance.now() - lastInteractTime) / 1000;

        if (timeSinceInteract > 1.0) {
          // Gently return user rotation offset back towards 0 so the hero front face sways
          userRotOffset *= 0.96;
          currentRotX += (defaultRotX - currentRotX) * 0.04;
        }

        // Hero sway animation: keeps front face readable while creating alive 3D depth
        const idleSwayY = autoRotate ? Math.sin(elapsedTime * 1.2) * 0.22 : 0;
        const idleSwayX = autoRotate ? Math.cos(elapsedTime * 0.9) * 0.05 : 0;

        pivotGroup.rotation.y = defaultRotY + userRotOffset + idleSwayY;
        pivotGroup.rotation.x = currentRotX + idleSwayX;
      }

      // Gentle floating bobbing on Y axis
      pivotGroup.position.y = Math.sin(elapsedTime * 1.8) * 0.0035;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();

      domEl.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);

      domEl.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);

      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }

      scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });

      loadedTexture?.dispose();
      boxMaterial?.dispose();
      renderer.dispose();
    };
  }, [textureUrl, modelUrl, autoRotate, interactive]);

  return (
    <div className={`relative flex items-center justify-center select-none cursor-grab active:cursor-grabbing ${className}`}>
      {/* 3D Canvas Container */}
      <div ref={mountRef} className="w-full h-full flex items-center justify-center" />

      {/* Loading Skeleton / Glow Placeholder */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-24 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/40 animate-pulse flex items-center justify-center shadow-[0_0_20px_rgba(217,70,239,0.3)]">
            <div className="w-5 h-5 border-2 border-fuchsia-400 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}

      {/* Error Fallback */}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-[10px] text-fuchsia-300 bg-purple-950/80 px-2 py-1 rounded border border-fuchsia-500/40">
            3D preview offline
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckBox3D;

import * as THREE from "three";

/** Slow-rotating low-poly wireframe forms in the background for depth. */
export function createAmbientGeometry() {
  const group = new THREE.Group();

  const icoGeo = new THREE.IcosahedronGeometry(3.2, 1);
  const icoMat = new THREE.MeshBasicMaterial({ color: 0x6c8dff, wireframe: true, transparent: true, opacity: 0.06 });
  const ico = new THREE.Mesh(icoGeo, icoMat);
  ico.position.set(-3.5, 1.2, -4);
  group.add(ico);

  const torusGeo = new THREE.TorusGeometry(2.1, 0.02, 8, 80);
  const torusMat = new THREE.MeshBasicMaterial({ color: 0x9a7bff, transparent: true, opacity: 0.12 });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  torus.position.set(4, -1.4, -3);
  torus.rotation.x = Math.PI / 3;
  group.add(torus);

  return { group, ico, torus };
}

/** Soft radial-gradient sprite used as a light source glow (cheap, no post-processing). */
export function createGlowSprite(color = "#6c8dff", size = 6) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, color + "cc");
  gradient.addColorStop(1, color + "00");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(size, size, 1);
  return sprite;
}

export function applyFog(scene, color = 0x08090c, near = 6, far = 16) {
  scene.fog = new THREE.Fog(color, near, far);
}

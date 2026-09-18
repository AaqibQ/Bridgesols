import * as THREE from "three";

/**
 * Builds an abstract "connected network" system: a cloud of point nodes plus
 * thin line segments joining nodes that are near each other. Reads as
 * abstract connectivity (bridges, networks, digital strategy) rather than a
 * literal globe/graph illustration.
 */
export function createNodeNetwork({ count = 140, radius = 7.5, linkDistance = 1.9, accentA = 0x6c8dff, accentB = 0x9a7bff } = {}) {
  const group = new THREE.Group();

  // Node positions — a loose, slightly flattened sphere so it reads well
  // in a wide hero viewport rather than a perfect ball.
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = radius * (0.55 + Math.random() * 0.45);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.62;
    positions[i * 3 + 2] = r * Math.cos(phi) * 0.85;
    speeds[i] = 0.15 + Math.random() * 0.35;
  }

  const pointGeo = new THREE.BufferGeometry();
  pointGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const pointMat = new THREE.PointsMaterial({
    color: accentA,
    size: 0.055,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });
  const points = new THREE.Points(pointGeo, pointMat);
  group.add(points);

  // Link nearby nodes with thin lines — capped so mobile/low counts stay cheap.
  const linePositions = [];
  const maxLinks = count * 3;
  outer: for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const dx = positions[i * 3] - positions[j * 3];
      const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
      const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < linkDistance) {
        linePositions.push(
          positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
          positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
        );
        if (linePositions.length / 3 >= maxLinks) break outer;
      }
    }
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: accentB,
    transparent: true,
    opacity: 0.16,
    depthWrite: false
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  group.add(lines);

  return { group, points, lines, positions, speeds };
}

/**
 * Ambient dust particles — a very sparse field for depth, independent of the
 * node network so it can keep drifting slowly without affecting link math.
 */
export function createDustField(count = 220, spread = 14) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.7;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.02,
    transparent: true,
    opacity: 0.25,
    depthWrite: false
  });
  return new THREE.Points(geo, mat);
}

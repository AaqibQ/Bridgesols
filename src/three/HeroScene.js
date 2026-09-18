import * as THREE from "three";
import { createNodeNetwork, createDustField } from "./particles.js";
import { createAmbientGeometry, createGlowSprite, applyFog } from "./effects.js";

function isWebGLAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch (e) {
    return false;
  }
}

export class HeroScene {
  constructor(container, { reducedMotion = false } = {}) {
    this.container = container;
    this.reducedMotion = reducedMotion;
    this.isMobile = window.innerWidth < 760;
    this.supported = isWebGLAvailable();
    this.running = false;
    this.pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.scrollVelocity = 0;
    this.lastScrollY = window.scrollY;

    if (!this.supported) return;
    this._init();
  }

  _init() {
    const { container, isMobile } = this;
    const rect = container.getBoundingClientRect();

    this.scene = new THREE.Scene();
    applyFog(this.scene);

    this.camera = new THREE.PerspectiveCamera(50, rect.width / rect.height, 0.1, 100);
    this.camera.position.set(0, 0, 8.5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    this.renderer.setSize(rect.width, rect.height);
    this.renderer.setClearColor(0x000000, 0);
    container.appendChild(this.renderer.domElement);

    // Network — fewer nodes and no cross-links on mobile to stay cheap.
    const network = createNodeNetwork(
      isMobile
        ? { count: 55, radius: 6.5, linkDistance: 1.6 }
        : { count: 150, radius: 7.5, linkDistance: 1.9 }
    );
    this.network = network;
    this.scene.add(network.group);

    if (!isMobile) {
      this.dust = createDustField(220, 14);
      this.scene.add(this.dust);

      const ambient = createAmbientGeometry();
      this.ambient = ambient;
      this.scene.add(ambient.group);

      const glow = createGlowSprite("#6c8dff", 7);
      glow.position.set(2, 1.5, -2);
      this.scene.add(glow);
    }

    this.group = network.group;

    window.addEventListener("resize", this._onResize);
    window.addEventListener("pointermove", this._onPointerMove, { passive: true });
    window.addEventListener("scroll", this._onScroll, { passive: true });

    this._observeVisibility();
    this.running = true;
    this._tick = this._tick.bind(this);
    this._raf = requestAnimationFrame(this._tick);
  }

  _observeVisibility() {
    if (!("IntersectionObserver" in window)) return;
    this._io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.visible = entry.isIntersecting;
        });
      },
      { threshold: 0 }
    );
    this._io.observe(this.container);
    this.visible = true;
  }

  _onResize = () => {
    if (!this.supported) return;
    const rect = this.container.getBoundingClientRect();
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(rect.width, rect.height);
  };

  _onPointerMove = (e) => {
    this.pointer.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    this.pointer.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  };

  _onScroll = () => {
    const y = window.scrollY;
    this.scrollVelocity = y - this.lastScrollY;
    this.lastScrollY = y;
  };

  _tick(time) {
    if (!this.running) return;
    this._raf = requestAnimationFrame(this._tick);
    if (this.visible === false) return;

    const t = time * 0.00012;

    this.pointer.x += (this.pointer.targetX - this.pointer.x) * 0.04;
    this.pointer.y += (this.pointer.targetY - this.pointer.y) * 0.04;

    const parallax = this.reducedMotion ? 0.15 : 1;
    if (this.group) {
      this.group.rotation.y = t * (this.reducedMotion ? 0.3 : 1) + this.pointer.x * 0.22 * parallax;
      this.group.rotation.x = this.pointer.y * 0.14 * parallax;
      this.group.position.y = Math.sin(t * 1.4) * 0.15;
    }

    if (this.dust) this.dust.rotation.y = t * 0.4;
    if (this.ambient) {
      this.ambient.ico.rotation.y = t * 0.6;
      this.ambient.ico.rotation.x = t * 0.3;
      this.ambient.torus.rotation.z = t * 0.5;
    }

    // Gentle camera dolly reacting to scroll velocity, damped back to rest.
    this.camera.position.z = 8.5 + Math.min(Math.max(this.scrollVelocity * 0.01, -0.6), 0.6);
    this.scrollVelocity *= 0.9;

    this.renderer.render(this.scene, this.camera);
  }

  setReducedMotion(value) {
    this.reducedMotion = value;
  }

  dispose() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("pointermove", this._onPointerMove);
    window.removeEventListener("scroll", this._onScroll);
    if (this._io) this._io.disconnect();
    if (!this.supported) return;
    this.renderer.dispose();
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (obj.material.map) obj.material.map.dispose();
        obj.material.dispose();
      }
    });
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}

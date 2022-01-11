import * as THREE from "three";

export function setupOrthoScene(): {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
} {
  const scene = new THREE.Scene();

  // Will use the whole window for the webgl canvas
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Orthogonal camera for 2D drawing
  const camera = new THREE.OrthographicCamera(
    0,
    width,
    0,
    height,
    -height, // near
    height // far
  );
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // Set up renderer and attach to DOM
  const canvas = document.querySelector("[data-canvas]") as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    preserveDrawingBuffer: true,
    antialias: true,
  });

  renderer.sortObjects = false;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  // document.body.appendChild(renderer.domElement);

  return { scene, camera, renderer };
}

export interface MouseInfo {
  position: THREE.Vector2;
  isDown: boolean;
}
export function setupMouse(renderer: THREE.WebGLRenderer): MouseInfo {
  // start updating mouse coordinates
  const mouse: MouseInfo = {
    position: new THREE.Vector2(0, 0),
    isDown: false,
  };

  function addListeners() {
    renderer.domElement.addEventListener("pointermove", (e) => {
      mouse.position.set(e.clientX, e.clientY);
    });
    renderer.domElement.addEventListener("pointerdown", () => {
      mouse.isDown = true;
    });
    renderer.domElement.addEventListener("pointerup", () => {
      mouse.isDown = false;
    });
    renderer.domElement.addEventListener("pointerout", () => {
      mouse.isDown = false;
    });
  }
  addListeners();
  return mouse;
}

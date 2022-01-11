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

// Create data texture
export function createDataTexture(sizes: {
  width: number;
  height: number;
}): THREE.DataTexture {
  const size = sizes.width * sizes.height;
  const data = new Uint8Array(4 * size); // 4 for RGBA

  for (let i = 0; i < size; i++) {
    const stride = i * 4;
    data[stride] = 0; // r
    data[stride + 1] = 0; // g
    data[stride + 2] = 0; // b
    data[stride + 3] = 0; // a
  }

  const dt = new THREE.DataTexture(
    data,
    sizes.width,
    sizes.height,
    THREE.RGBAFormat
  );
  dt.needsUpdate = true;
  return dt;
}

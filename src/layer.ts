import * as THREE from "three";
import { Sizes } from "./main";
import { createPlaneMesh } from "./planeMesh";
import { createRT } from "./utils";

export function createShaderLayer(
  sizes: Sizes,
  shader: THREE.ShaderMaterialParameters
): {
  scene: THREE.Scene;
  mesh: THREE.Mesh;
  material: THREE.RawShaderMaterial;
  rts: {
    prev: THREE.WebGLRenderTarget;
    next: THREE.WebGLRenderTarget;
  };
  render: (
    renderer: THREE.WebGLRenderer,
    camera: THREE.Camera
  ) => THREE.Texture;
} {
  // Shader material that s two textures
  const material = new THREE.RawShaderMaterial(shader);
  const mesh = createPlaneMesh(sizes, material);
  const scene = new THREE.Scene();
  scene.background = null;
  scene.add(mesh);
  const rt1 = createRT(sizes);
  const rt2 = createRT(sizes);
  const rts = {
    prev: rt1,
    next: rt2,
  };

  function swapRTs() {
    const temp = rts.prev;
    rts.prev = rts.next;
    rts.next = temp;
  }

  // Uses ping pong RTs to render the next frame
  function render(
    renderer: THREE.WebGLRenderer,
    camera: THREE.Camera
  ): THREE.Texture {
    renderer.setRenderTarget(rts.next);
    renderer.render(scene, camera);
    swapRTs(); // pingpong for next pass
    return rts.next.texture;
  }

  return {
    scene,
    mesh,
    material,
    rts,
    render,
  };
}

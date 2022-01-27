import debounce from "lodash.debounce";
import * as THREE from "three";
import {
  createRT,
  createDataTexture,
  setupMouse,
  setupOrthoScene,
} from "./utils";
import vertex from "./shaders/vertex.glsl";
import merge from "./shaders/merge.glsl";
import "./style.css";
import { setupBrush } from "./brush";
import { createPlaneMesh } from "./planeMesh";
import { createShaderLayer } from "./layer";

export const RT_OPTIONS = {
  format: THREE.RGBAFormat,
};
export interface Sizes {
  width: number;
  height: number;
}
const sizes: Sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
const { scene, camera, renderer } = setupOrthoScene();
scene.background = null;
const mouse = setupMouse(renderer);

const brush = setupBrush(mouse);

// Mesh that displays the rendered output each frame
const outputMaterial = new THREE.MeshBasicMaterial({
  map: null,
  side: THREE.DoubleSide,
});
const outputMesh = createPlaneMesh(sizes, outputMaterial);
scene.add(outputMesh);
scene.add(brush.line);

// Layer that merges the previous frame with new brush input
// and incorporates wetness texture to bleed out ink
const mergeLayer = createShaderLayer(sizes, {
  side: THREE.DoubleSide,
  uniforms: {
    texture1: {
      value: null,
    },
    texture2: {
      value: null,
    },
  },
  vertexShader: vertex,
  fragmentShader: merge,
});

// Main render loop
const render = () => {
  const brushTexture = brush.render(renderer, camera);

  // get brushRT as texture, and previous RT as texture
  mergeLayer.material.uniforms.texture1.value = brushTexture;
  mergeLayer.material.uniforms.texture2.value = mergeLayer.rts.prev.texture;
  // render the next merge RT with shader
  const nextMergeTexture = mergeLayer.render(renderer, camera);

  // preview the newly rendered next RT's texture in base scene
  outputMesh.material.map = nextMergeTexture;
  renderer.setRenderTarget(null);
  renderer.render(scene, camera);

  window.requestAnimationFrame(render);
};

render();

// import * as dat from "dat.gui";
// const gui = new dat.GUI();
// // const debugObject = {
// //   color: "#FF00CC",
// // };
// // gui
// //   .addColor(debugObject, "color")
// //   .name("Color")
// //   .onChange(() => {
// //     cubeMaterial.color = new THREE.Color(debugObject.color);
// //   });

// if (import.meta.env.PROD) {
//   gui.hide();
//   window.showGUI = () => gui.show();
// }

// Setup resizers
window.addEventListener("resize", debounce(onResize, 100));
function onResize(): void {
  sizes.height = window.innerHeight;
  sizes.width = window.innerWidth;

  // camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

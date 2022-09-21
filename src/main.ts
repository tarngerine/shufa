import debounce from "lodash.debounce";
import * as THREE from "three";
import { createDataTexture, setupMouse, setupOrthoScene } from "./utils";
import vertex from "./shaders/vertex.glsl";
import merge from "./shaders/merge.glsl";
import wetness from "./shaders/wetness.glsl";
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
const brush2 = setupBrush(mouse, true);

// Mesh that displays the rendered output each frame
const outputMaterial = new THREE.MeshBasicMaterial({
  map: null,
  side: THREE.DoubleSide,
});
const outputMesh = createPlaneMesh(sizes, outputMaterial);
scene.add(outputMesh);
scene.add(brush.line);
scene.add(brush2.line);

// Wetness texture
const wetnessLayer = createShaderLayer(sizes, {
  side: THREE.DoubleSide,
  uniforms: {
    brush: {
      value: null,
    },
    brush2: {
      value: null,
    },
    prev: {
      value: createDataTexture(sizes),
    },
    time: {
      value: 0,
    },
    w: {
      value: sizes.width,
    },
    h: {
      value: sizes.height,
    },
  },
  vertexShader: vertex,
  fragmentShader: wetness,
});

// Layer that merges the previous frame with new brush input
// and incorporates wetness texture to bleed out ink
const mergeLayer = createShaderLayer(sizes, {
  side: THREE.DoubleSide,
  uniforms: {
    brush: {
      value: null,
    },
    brush2: {
      value: null,
    },
    prev: {
      value: null,
    },
    wetness: {
      value: null,
    },
    time: {
      value: 0,
    },
    w: {
      value: sizes.width,
    },
    h: {
      value: sizes.height,
    },
  },
  vertexShader: vertex,
  fragmentShader: merge,
});

// Main render loop
const render = () => {
  const brushTexture = brush.render(renderer, camera);
  const brush2Texture = brush2.render(renderer, camera);

  // get brushRT as texture, and previous wetness as texture
  wetnessLayer.material.uniforms.time.value += 0.01;
  wetnessLayer.material.uniforms.brush.value = brushTexture;
  wetnessLayer.material.uniforms.brush2.value = brush2Texture;
  wetnessLayer.material.uniforms.prev.value = wetnessLayer.rts.prev.texture;
  const wetnessTexture = wetnessLayer.render(renderer, camera);

  // get brushRT as texture, and previous RT as texture
  mergeLayer.material.uniforms.time.value += 0.01;
  mergeLayer.material.uniforms.brush.value = brushTexture;
  mergeLayer.material.uniforms.brush2.value = brush2Texture;
  mergeLayer.material.uniforms.prev.value = mergeLayer.rts.prev.texture;
  mergeLayer.material.uniforms.wetness.value = wetnessTexture;
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
